const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://qhkbklzngxhwommfgghr.supabase.co';
const supabaseKey = 'sb_publishable_OYljLVW0jvoOetTnNOQ6iw_gJd87w40';
const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  const testProduct = {
    name: 'Test Product ' + Date.now(),
    category: 'Fruits',
    mrp: 100,
    price: 80,
    unit: 'per kg',
    stock: 10,
    description: 'Testing RLS',
    is_available: true
  };

  try {
    const { data, error } = await supabase.from('products').insert([testProduct]).select();
    if (error) {
      console.log('INSERT FAILED WITH ERROR:', JSON.stringify(error, null, 2));
    } else {
      console.log('INSERT SUCCEEDED! Result:', JSON.stringify(data, null, 2));
    }
  } catch (err) {
    console.error('EXCEPTION THROWN:', err);
  }
}

main();
