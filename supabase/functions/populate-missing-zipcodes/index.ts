import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('Starting zip code population process...');

    // Step 1: Get all unique vendor zip codes that aren't in zipcode_lists
    const { data: vendors, error: vendorError } = await supabase
      .from('vendors')
      .select('zip_code')
      .not('zip_code', 'is', null)
      .neq('zip_code', '');

    if (vendorError) throw vendorError;

    // Get unique 5-digit zip codes
    const vendorZips = new Set<string>();
    vendors?.forEach(v => {
      const zip = v.zip_code?.trim().substring(0, 5);
      if (zip && /^\d{5}$/.test(zip)) {
        vendorZips.add(zip);
      }
    });

    console.log(`Found ${vendorZips.size} unique vendor zip codes`);

    // Step 2: Get existing zip codes
    const { data: existingZips, error: existingError } = await supabase
      .from('zipcode_lists')
      .select('zipcode');

    if (existingError) throw existingError;

    const existingSet = new Set(existingZips?.map(z => z.zipcode) || []);
    const missingZips = [...vendorZips].filter(z => !existingSet.has(z));

    console.log(`Missing zip codes to fetch: ${missingZips.length}`);

    // Step 3: Fetch coordinates for each missing zip code
    const results = {
      added: [] as string[],
      failed: [] as { zip: string; reason: string }[],
      vendorsUpdated: 0,
    };

    // Process in batches to avoid rate limiting
    const batchSize = 10;
    for (let i = 0; i < missingZips.length; i += batchSize) {
      const batch = missingZips.slice(i, i + batchSize);
      
      await Promise.all(batch.map(async (zipcode) => {
        try {
          // Use Zippopotam.us API (free, no key required)
          const response = await fetch(`http://api.zippopotam.us/us/${zipcode}`);
          
          if (!response.ok) {
            results.failed.push({ zip: zipcode, reason: 'Not found in API' });
            console.log(`Zip ${zipcode}: Not found`);
            return;
          }

          const data = await response.json();
          
          if (!data.places || data.places.length === 0) {
            results.failed.push({ zip: zipcode, reason: 'No places data' });
            console.log(`Zip ${zipcode}: No places data`);
            return;
          }

          const lat = parseFloat(data.places[0].latitude);
          const lng = parseFloat(data.places[0].longitude);

          // Insert into zipcode_lists
          const { error: insertError } = await supabase
            .from('zipcode_lists')
            .insert({
              zipcode: zipcode,
              latitude: lat,
              longitude: lng,
            });

          if (insertError) {
            results.failed.push({ zip: zipcode, reason: insertError.message });
            console.log(`Zip ${zipcode}: Insert failed - ${insertError.message}`);
          } else {
            results.added.push(zipcode);
            console.log(`Zip ${zipcode}: Added (${lat}, ${lng})`);
          }
        } catch (err) {
          results.failed.push({ zip: zipcode, reason: String(err) });
          console.log(`Zip ${zipcode}: Error - ${err}`);
        }
      }));

      // Small delay between batches to be nice to the API
      if (i + batchSize < missingZips.length) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    console.log(`Zip codes added: ${results.added.length}, failed: ${results.failed.length}`);

    // Step 4: Trigger vendor coordinate re-population
    // Update vendors to trigger the populate_vendor_coordinates trigger
    const { data: updatedVendors, error: updateError } = await supabase
      .from('vendors')
      .update({ updated_at: new Date().toISOString() })
      .or('latitude.is.null,latitude.eq.0')
      .not('zip_code', 'is', null)
      .select('id');

    if (updateError) {
      console.error('Error triggering vendor updates:', updateError);
    } else {
      results.vendorsUpdated = updatedVendors?.length || 0;
      console.log(`Triggered coordinate update for ${results.vendorsUpdated} vendors`);
    }

    // Step 5: Get final coverage stats
    const { count: totalVendors } = await supabase
      .from('vendors')
      .select('*', { count: 'exact', head: true });

    const { count: vendorsWithCoords } = await supabase
      .from('vendors')
      .select('*', { count: 'exact', head: true })
      .not('latitude', 'is', null)
      .neq('latitude', 0)
      .not('longitude', 'is', null)
      .neq('longitude', 0);

    const coverage = totalVendors ? ((vendorsWithCoords || 0) / totalVendors * 100).toFixed(1) : 0;

    const summary = {
      zipCodesAdded: results.added.length,
      zipCodesFailed: results.failed.length,
      failedDetails: results.failed,
      vendorsTriggered: results.vendorsUpdated,
      finalStats: {
        totalVendors,
        vendorsWithCoordinates: vendorsWithCoords,
        coveragePercent: coverage,
      },
    };

    console.log('Final summary:', JSON.stringify(summary, null, 2));

    return new Response(JSON.stringify(summary), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in populate-missing-zipcodes:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
