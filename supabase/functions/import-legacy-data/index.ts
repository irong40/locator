import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ID mapping storage (old integer ID → new UUID)
const idMappings: Record<string, Record<number, string>> = {
  engine_brands: {},
  oem_brands: {},
  products: {},
  payment_types: {},
  vendors: {},
  users: {},
};

interface ImportRequest {
  table: string;
  data: Record<string, unknown>[];
  mappings?: Record<string, Record<number, string>>;
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

    const { table, data, mappings }: ImportRequest = await req.json();
    
    // Merge provided mappings with stored ones
    if (mappings) {
      Object.assign(idMappings, mappings);
    }

    console.log(`Importing ${data.length} records into ${table}`);

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
        result = await importVendors(supabase, data, mappings?.payment_types || {});
        break;
      case 'vendor_engine_brands':
        result = await importVendorEngineBrands(supabase, data, mappings || {});
        break;
      case 'vendor_oem_brands':
        result = await importVendorOemBrands(supabase, data, mappings || {});
        break;
      case 'vendor_epp_brands':
        result = await importVendorEppBrands(supabase, data, mappings || {});
        break;
      case 'vendor_products':
        result = await importVendorProducts(supabase, data, mappings || {});
        break;
      case 'users':
        result = await importUsers(supabase, data, mappings || {});
        break;
      default:
        return new Response(JSON.stringify({ error: `Unknown table: ${table}` }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
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

  // Get role IDs
  const { data: roles } = await supabase.from('user_roles').select('id, role_name');
  const roleMap: Record<string, string> = {};
  roles?.forEach((r: any) => { roleMap[r.role_name] = r.id; });

  for (const row of data) {
    try {
      // Create user in Supabase Auth with existing password hash
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: row.email,
        password_hash: row.password, // Laravel bcrypt hash
        email_confirm: true,
        user_metadata: {
          first_name: row.name?.split(' ')[0] || '',
          last_name: row.name?.split(' ').slice(1).join(' ') || '',
        },
      });

      if (authError) {
        // Try without password hash if it fails
        const { data: authData2, error: authError2 } = await supabase.auth.admin.createUser({
          email: row.email,
          email_confirm: true,
          user_metadata: {
            first_name: row.name?.split(' ')[0] || '',
            last_name: row.name?.split(' ').slice(1).join(' ') || '',
          },
        });

        if (authError2) {
          errors.push(`User ${row.id} (${row.email}): ${authError2.message}`);
          continue;
        }

        userMappings[row.id] = authData2.user.id;

        // Send password reset email
        await supabase.auth.admin.generateLink({
          type: 'recovery',
          email: row.email,
        });
      } else {
        userMappings[row.id] = authData.user.id;
      }

      // Assign role based on old user_role_id (1=Admin, 2=User)
      const roleName = row.user_role_id === 1 || row.user_role_id === '1' ? 'Admin' : 'User';
      const roleId = roleMap[roleName];

      if (roleId) {
        await supabase.from('user_role_assignments').insert({
          user_id: userMappings[row.id],
          role_id: roleId,
        });
      }

      inserted++;
    } catch (err: any) {
      errors.push(`User ${row.id} (${row.email}): ${err.message}`);
    }
  }

  return { table: 'users', inserted, errors, mappings: userMappings };
}
