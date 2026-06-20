const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables if available
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('\nError: Please configure the following environment variables:');
  console.error(' - NEXT_PUBLIC_SUPABASE_URL (or SUPABASE_URL)');
  console.error(' - SUPABASE_SERVICE_ROLE_KEY (found in Supabase Dashboard -> Project Settings -> API)\n');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);
const dbPath = path.resolve(__dirname, '../db.json');

const main = async () => {
  if (!fs.existsSync(dbPath)) {
    console.error(`Error: Local database file not found at: ${dbPath}`);
    return;
  }

  console.log('Reading db.json...');
  const db = JSON.parse(fs.readFileSync(dbPath, 'utf-8'));
  console.log('Successfully loaded local database.');

  // Helper to upsert tables
  const seedTable = async (table, items) => {
    if (!items || items.length === 0) {
      console.log(`No items found for table: ${table}. Skipping...`);
      return;
    }
    console.log(`Seeding "${table}" table with ${items.length} records...`);
    const { error } = await supabase.from(table).upsert(items, { onConflict: 'id' });
    if (error) {
      console.error(`❌ Error seeding ${table}:`, error.message);
    } else {
      console.log(`✅ Seeded ${table} successfully!`);
    }
  };

  try {
    // 1. Seed Config (Single row config)
    if (db.config) {
      console.log('Seeding "config" table...');
      const configRow = {
        id: 1, // Single row constraint key
        ...db.config
      };
      const { error } = await supabase.from('config').upsert(configRow, { onConflict: 'id' });
      if (error) {
        console.error('❌ Error seeding config:', error.message);
      } else {
        console.log('✅ Seeded config successfully!');
      }
    }

    // 2. Seed Categories
    await seedTable('categories', db.categories);

    // 3. Seed Products
    await seedTable('products', db.products);

    // 4. Seed Coupons
    await seedTable('coupons', db.coupons);

    // 5. Seed Societies
    await seedTable('societies', db.societies);

    // 6. Seed Addresses (Optional)
    await seedTable('addresses', db.addresses);

    console.log('\n🎉 Seed process completed successfully!\n');
  } catch (err) {
    console.error('❌ Migration failed:', err);
  }
};

main();
