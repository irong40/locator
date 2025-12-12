import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Valid table names for import
const validTables = [
  'engine_brands',
  'oem_brands', 
  'products',
  'payment_types',
  'zipcode_lists',
  'vendors',
  'vendor_engine_brands',
  'vendor_oem_brands',
  'vendor_epp_brands',
  'vendor_products',
  'users',
] as const;

// Zod schema for request validation
const ImportRequestSchema = z.object({
  table: z.enum(validTables, { 
    errorMap: () => ({ message: `Invalid table. Must be one of: ${validTables.join(', ')}` }) 
  }),
  data: z.array(z.record(z.unknown())).min(1, { message: 'Data array cannot be empty' }).max(10000, { message: 'Data array cannot exceed 10000 records' }),
});

// Save mappings to database
async function saveMappings(supabase: any, sourceTable: string, mappings: Record<number, string>) {
  const records = Object.entries(mappings).map(([oldId, newId]) => ({
    source_table: sourceTable,
    old_id: parseInt(oldId),
    new_id: newId,
  }));

  if (records.length === 0) return;

  // Insert in batches of 500
  const batchSize = 500;
  for (let i = 0; i < records.length; i += batchSize) {
    const batch = records.slice(i, i + batchSize);
    const { error } = await supabase.from('migration_mappings').upsert(batch, {
      onConflict: 'source_table,old_id',
    });
    if (error) {
      console.error(`Error saving mappings for ${sourceTable}:`, error.message);
    }
  }
  console.log(`Saved ${records.length} mappings for ${sourceTable}`);
}

// Load mappings from database
async function loadMappings(supabase: any, sourceTable: string): Promise<Record<number, string>> {
  const { data, error } = await supabase
    .from('migration_mappings')
    .select('old_id, new_id')
    .eq('source_table', sourceTable);

  if (error) {
    console.error(`Error loading mappings for ${sourceTable}:`, error.message);
    return {};
  }

  const mappings: Record<number, string> = {};
  data?.forEach((r: any) => {
    mappings[r.old_id] = r.new_id;
  });
  console.log(`Loaded ${Object.keys(mappings).length} mappings for ${sourceTable}`);
  return mappings;
}

// Load all mappings needed for an import
async function loadAllMappings(supabase: any): Promise<Record<string, Record<number, string>>> {
  const tables = ['engine_brands', 'oem_brands', 'products', 'payment_types', 'vendors', 'users'];
  const allMappings: Record<string, Record<number, string>> = {};

  for (const table of tables) {
    allMappings[table] = await loadMappings(supabase, table);
  }

  return allMappings;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    // Verify caller is admin
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check admin role
    const { data: hasAdminRole } = await supabase.rpc('has_role', { 
      _user_id: user.id, 
      _role: 'Admin' 
    });

    if (!hasAdminRole) {
      return new Response(JSON.stringify({ error: 'Admin access required' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Parse and validate request body
    const rawBody = await req.json();
    const parseResult = ImportRequestSchema.safeParse(rawBody);
    
    if (!parseResult.success) {
      const errors = parseResult.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
      console.error('Validation error:', errors);
      return new Response(
        JSON.stringify({ error: `Validation failed: ${errors}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { table, data } = parseResult.data;
    console.log(`Importing ${data.length} records into ${table}`);

    // Check if this table already has mappings (prevent re-import)
    const tablesWithMappings = ['engine_brands', 'oem_brands', 'products', 'payment_types', 'vendors', 'users'];
    if (tablesWithMappings.includes(table)) {
      const { count: existingCount } = await supabase
        .from('migration_mappings')
        .select('id', { count: 'exact', head: true })
        .eq('source_table', table);

      if (existingCount && existingCount > 0) {
        console.log(`Table ${table} already has ${existingCount} mappings. Blocking re-import.`);
        return new Response(JSON.stringify({ 
          error: `Table '${table}' already has ${existingCount} mappings stored. Clear mappings first to re-import.`,
          alreadyImported: true,
          existingCount
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    // Load existing mappings from database for imports that need them
    const storedMappings = await loadAllMappings(supabase);

    let result;
    switch (table) {
      case 'engine_brands':
        result = await importEngineBrands(supabase, data);
        break;
      case 'oem_brands':
        result = await importOemBrands(supabase, data);
        break;
      case 'products':
        result = await importProducts(supabase, data);
        break;
      case 'payment_types':
        result = await importPaymentTypes(supabase, data);
        break;
      case 'zipcode_lists':
        result = await importZipcodes(supabase, data);
        break;
      case 'vendors':
        result = await importVendors(supabase, data, storedMappings.payment_types);
        break;
      case 'vendor_engine_brands':
        result = await importVendorEngineBrands(supabase, data, storedMappings);
        break;
      case 'vendor_oem_brands':
        result = await importVendorOemBrands(supabase, data, storedMappings);
        break;
      case 'vendor_epp_brands':
        result = await importVendorEppBrands(supabase, data, storedMappings);
        break;
      case 'vendor_products':
        result = await importVendorProducts(supabase, data, storedMappings);
        break;
      case 'users':
        result = await importUsers(supabase, data, storedMappings);
        break;
      default:
        return new Response(JSON.stringify({ error: `Unknown table: ${table}` }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }

    // Save new mappings to database
    if (result.mappings && Object.keys(result.mappings).length > 0) {
      await saveMappings(supabase, table, result.mappings);
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Import error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

// Helper to fix invalid timestamps
function fixTimestamp(ts: string | null): string | null {
  if (!ts || ts === '0000-00-00 00:00:00' || ts === 'NULL') {
    return new Date().toISOString();
  }
  return new Date(ts).toISOString();
}

async function importEngineBrands(supabase: any, data: any[]) {
  const mappings: Record<number, string> = {};
  let inserted = 0;
  const errors: string[] = [];

  for (const row of data) {
    const newId = crypto.randomUUID();
    const { error } = await supabase.from('engine_brands').insert({
      id: newId,
      engine_brand: row.engine_brand,
      created_at: fixTimestamp(row.created_at),
    });

    if (error) {
      errors.push(`Row ${row.id}: ${error.message}`);
    } else {
      mappings[row.id] = newId;
      inserted++;
    }
  }

  return { table: 'engine_brands', inserted, errors, mappings };
}

async function importOemBrands(supabase: any, data: any[]) {
  const mappings: Record<number, string> = {};
  let inserted = 0;
  const errors: string[] = [];

  for (const row of data) {
    const newId = crypto.randomUUID();
    const { error } = await supabase.from('oem_brands').insert({
      id: newId,
      oem_brand: row.oem_brand,
      created_at: fixTimestamp(row.created_at),
    });

    if (error) {
      errors.push(`Row ${row.id}: ${error.message}`);
    } else {
      mappings[row.id] = newId;
      inserted++;
    }
  }

  return { table: 'oem_brands', inserted, errors, mappings };
}

async function importProducts(supabase: any, data: any[]) {
  const mappings: Record<number, string> = {};
  let inserted = 0;
  const errors: string[] = [];

  for (const row of data) {
    const newId = crypto.randomUUID();
    const { error } = await supabase.from('products').insert({
      id: newId,
      product: row.product,
      created_at: fixTimestamp(row.created_at),
    });

    if (error) {
      errors.push(`Row ${row.id}: ${error.message}`);
    } else {
      mappings[row.id] = newId;
      inserted++;
    }
  }

  return { table: 'products', inserted, errors, mappings };
}

async function importPaymentTypes(supabase: any, data: any[]) {
  const mappings: Record<number, string> = {};
  let inserted = 0;
  const errors: string[] = [];

  for (const row of data) {
    const newId = crypto.randomUUID();
    const { error } = await supabase.from('payment_types').insert({
      id: newId,
      payment_type: row.payment_type,
      created_at: fixTimestamp(row.created_at),
    });

    if (error) {
      errors.push(`Row ${row.id}: ${error.message}`);
    } else {
      mappings[row.id] = newId;
      inserted++;
    }
  }

  return { table: 'payment_types', inserted, errors, mappings };
}

async function importZipcodes(supabase: any, data: any[]) {
  let inserted = 0;
  const errors: string[] = [];
  const batchSize = 500;

  for (let i = 0; i < data.length; i += batchSize) {
    const batch = data.slice(i, i + batchSize).map(row => ({
      id: crypto.randomUUID(),
      zipcode: row.zipcode,
      latitude: parseFloat(row.latitude),
      longitude: parseFloat(row.longitude),
      created_at: fixTimestamp(row.created_at),
    }));

    const { error } = await supabase.from('zipcode_lists').insert(batch);

    if (error) {
      errors.push(`Batch ${i / batchSize + 1}: ${error.message}`);
    } else {
      inserted += batch.length;
    }
    
    console.log(`Zipcodes: Inserted batch ${Math.floor(i / batchSize) + 1}, total: ${inserted}`);
  }

  return { table: 'zipcode_lists', inserted, errors };
}

async function importVendors(supabase: any, data: any[], paymentTypeMappings: Record<number, string>) {
  const mappings: Record<number, string> = {};
  let inserted = 0;
  const errors: string[] = [];

  for (const row of data) {
    const newId = crypto.randomUUID();
    const paymentTypeId = row.payment_type_id ? paymentTypeMappings[row.payment_type_id] : null;

    const { error } = await supabase.from('vendors').insert({
      id: newId,
      vendor_name: row.vendor_name,
      poc: row.poc || null,
      hr_labour_rate: parseFloat(row.hr_labour_rate) || 0,
      phone_no: row.phone_no || null,
      fax_no: row.fax_no || null,
      email_address: row.email_address || null,
      address: row.address || null,
      city: row.city || null,
      state: row.state || null,
      zip_code: row.zip_code || null,
      latitude: row.latitude ? parseFloat(row.latitude) : null,
      longitude: row.longitude ? parseFloat(row.longitude) : null,
      oem: row.oem === '1' || row.oem === 1,
      epp: row.epp === '1' || row.epp === 1,
      vendor_level: row.vendor_level || null,
      preference: row.preference || null,
      comments: row.comments || null,
      payment_type_id: paymentTypeId,
      created_at: fixTimestamp(row.created_at),
      updated_at: fixTimestamp(row.updated_at),
    });

    if (error) {
      errors.push(`Vendor ${row.id} (${row.vendor_name}): ${error.message}`);
    } else {
      mappings[row.id] = newId;
      inserted++;
    }
  }

  return { table: 'vendors', inserted, errors, mappings };
}

async function importVendorEngineBrands(supabase: any, data: any[], mappings: Record<string, Record<number, string>>) {
  let inserted = 0;
  const errors: string[] = [];

  for (const row of data) {
    const vendorId = mappings.vendors?.[row.vendor_id];
    const engineBrandId = mappings.engine_brands?.[row.engine_brand_id];

    if (!vendorId || !engineBrandId) {
      errors.push(`Row ${row.id}: Missing mapping - vendor: ${row.vendor_id}→${vendorId}, engine_brand: ${row.engine_brand_id}→${engineBrandId}`);
      continue;
    }

    const { error } = await supabase.from('vendor_engine_brands').insert({
      id: crypto.randomUUID(),
      vendor_id: vendorId,
      engine_brand_id: engineBrandId,
      is_certified: row.is_certified === '1' || row.is_certified === 1 || row.is_certified === true,
      created_at: fixTimestamp(row.created_at),
    });

    if (error) {
      errors.push(`Row ${row.id}: ${error.message}`);
    } else {
      inserted++;
    }
  }

  return { table: 'vendor_engine_brands', inserted, errors };
}

async function importVendorOemBrands(supabase: any, data: any[], mappings: Record<string, Record<number, string>>) {
  let inserted = 0;
  const errors: string[] = [];

  for (const row of data) {
    const vendorId = mappings.vendors?.[row.vendor_id];
    const oemBrandId = mappings.oem_brands?.[row.oem_brand_id];

    if (!vendorId || !oemBrandId) {
      errors.push(`Row ${row.id}: Missing mapping - vendor: ${row.vendor_id}→${vendorId}, oem_brand: ${row.oem_brand_id}→${oemBrandId}`);
      continue;
    }

    const { error } = await supabase.from('vendor_oem_brands').insert({
      id: crypto.randomUUID(),
      vendor_id: vendorId,
      oem_brand_id: oemBrandId,
      created_at: fixTimestamp(row.created_at),
    });

    if (error) {
      errors.push(`Row ${row.id}: ${error.message}`);
    } else {
      inserted++;
    }
  }

  return { table: 'vendor_oem_brands', inserted, errors };
}

async function importVendorEppBrands(supabase: any, data: any[], mappings: Record<string, Record<number, string>>) {
  let inserted = 0;
  const errors: string[] = [];

  for (const row of data) {
    const vendorId = mappings.vendors?.[row.vendor_id];
    const oemBrandId = mappings.oem_brands?.[row.oem_brand_id];

    if (!vendorId || !oemBrandId) {
      errors.push(`Row ${row.id}: Missing mapping - vendor: ${row.vendor_id}→${vendorId}, oem_brand: ${row.oem_brand_id}→${oemBrandId}`);
      continue;
    }

    const { error } = await supabase.from('vendor_epp_brands').insert({
      id: crypto.randomUUID(),
      vendor_id: vendorId,
      oem_brand_id: oemBrandId,
      created_at: fixTimestamp(row.created_at),
    });

    if (error) {
      errors.push(`Row ${row.id}: ${error.message}`);
    } else {
      inserted++;
    }
  }

  return { table: 'vendor_epp_brands', inserted, errors };
}

async function importVendorProducts(supabase: any, data: any[], mappings: Record<string, Record<number, string>>) {
  let inserted = 0;
  const errors: string[] = [];

  for (const row of data) {
    const vendorId = mappings.vendors?.[row.vendor_id];
    const productId = mappings.products?.[row.product_id];

    if (!vendorId || !productId) {
      errors.push(`Row ${row.id}: Missing mapping - vendor: ${row.vendor_id}→${vendorId}, product: ${row.product_id}→${productId}`);
      continue;
    }

    const { error } = await supabase.from('vendor_products').insert({
      id: crypto.randomUUID(),
      vendor_id: vendorId,
      product_id: productId,
      created_at: fixTimestamp(row.created_at),
    });

    if (error) {
      errors.push(`Row ${row.id}: ${error.message}`);
    } else {
      inserted++;
    }
  }

  return { table: 'vendor_products', inserted, errors };
}

async function importUsers(supabase: any, data: any[], mappings: Record<string, Record<number, string>>) {
  const userMappings: Record<number, string> = {};
  let inserted = 0;
  const errors: string[] = [];

  // Get role mappings
  const { data: roles } = await supabase.from('user_roles').select('id, role_name');
  const roleMap: Record<string, string> = {};
  roles?.forEach((r: any) => {
    roleMap[r.role_name.toLowerCase()] = r.id;
  });

  for (const row of data) {
    // Create user in auth
    const tempPassword = crypto.randomUUID();
    const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
      email: row.email,
      password: tempPassword,
      email_confirm: true,
      user_metadata: {
        first_name: row.first_name || '',
        last_name: row.last_name || '',
      },
    });

    if (createError) {
      errors.push(`User ${row.id} (${row.email}): ${createError.message}`);
      continue;
    }

    // Map role name to role id
    const roleName = row.role_name?.toLowerCase() || 'user';
    const roleId = roleMap[roleName] || roleMap['user'];

    if (roleId) {
      const { error: roleError } = await supabase.from('user_role_assignments').insert({
        user_id: newUser.user.id,
        role_id: roleId,
      });

      if (roleError) {
        console.error(`Error assigning role for user ${row.email}:`, roleError.message);
      }
    }

    // Update profile with old_laravel_id
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ old_laravel_id: row.id })
      .eq('user_id', newUser.user.id);

    if (profileError) {
      console.error(`Error updating profile for user ${row.email}:`, profileError.message);
    }

    userMappings[row.id] = newUser.user.id;
    inserted++;
  }

  return { table: 'users', inserted, errors, mappings: userMappings };
}
