import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Dynamically resolve Node.js modules only if not running on Edge worker runtime
const fs = typeof process !== 'undefined' && process.env.NEXT_RUNTIME !== 'edge' ? require('fs') : null;
const path = typeof process !== 'undefined' && process.env.NEXT_RUNTIME !== 'edge' ? require('path') : null;

// Resolved database path with fallback checks to support various cwd configurations
const getDbPath = () => {
  if (!path || !fs) return '';
  const cwd = process.cwd();
  const candidates = [
    path.resolve(cwd, 'db.json'),
    path.resolve(cwd, 'customer-app', 'db.json'),
    path.resolve(cwd, 'gf_website', 'customer-app', 'db.json'),
    'c:/Users/saini/gf_website/customer-app/db.json'
  ];
  for (const c of candidates) {
    if (fs.existsSync(c)) {
      return c;
    }
  }
  return candidates[0];
};
const dbPath = getDbPath();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const isValidUrl = (url: string) => {
  return typeof url === 'string' && (url.startsWith('http://') || url.startsWith('https://'));
};

const supabase = isValidUrl(supabaseUrl) && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

const readDB = () => {
  try {
    if (!fs) throw new Error('fs module not available on edge runtime');
    const raw = fs.readFileSync(dbPath, 'utf-8');
    return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to read database file, returning default schema:', e);
    return { products: [], orders: [], wallet_balance: 0, societies: [], addresses: [], config: {}, coupons: [] };
  }
};

const writeDB = (data: any) => {
  if (!fs) throw new Error('fs module not available on edge runtime');
  fs.writeFileSync(dbPath, JSON.stringify(data, null, 2), 'utf-8');
};

// Sequential execution queue to prevent concurrent read/write race conditions on db.json
let dbPromise: Promise<any> = Promise.resolve();

function runLocked<T>(operation: () => Promise<T> | T): Promise<T> {
  const resultPromise = dbPromise.then(operation);
  dbPromise = resultPromise.catch(() => { });
  return resultPromise;
}

// CORS configuration headers helper
const getCorsHeaders = () => ({
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
});

// Resolve Preflight OPTIONS calls
export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: getCorsHeaders(),
  });
}

// 1. GET HANDLER
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type') || '';

  // If Supabase is configured, read directly from Supabase tables concurrently (no lock)
  if (supabase) {
    try {
      switch (type) {
        case 'products': {
          const { data, error } = await supabase.from('products').select('*').eq('is_available', true);
          if (error) throw error;
          return NextResponse.json(data, { headers: getCorsHeaders() });
        }
        case 'orders': {
          const { data, error } = await supabase.from('orders').select('*, order_items(*)').order('created_at', { ascending: false });
          if (error) throw error;
          const mapped = data.map((order: any) => ({
            ...order,
            items: order.order_items || []
          }));
          return NextResponse.json(mapped, { headers: getCorsHeaders() });
        }
        case 'wallet': {
          const { data, error } = await supabase.from('config').select('wallet_balance').eq('id', 1).maybeSingle();
          if (error) throw error;
          return NextResponse.json(data?.wallet_balance || 0, { headers: getCorsHeaders() });
        }
        case 'societies': {
          const { data, error } = await supabase.from('societies').select('*').eq('is_active', true);
          if (error) throw error;
          return NextResponse.json(data, { headers: getCorsHeaders() });
        }
        case 'addresses': {
          const { data, error } = await supabase.from('addresses').select('*');
          if (error) throw error;
          return NextResponse.json(data, { headers: getCorsHeaders() });
        }
        case 'config': {
          const { data, error } = await supabase.from('config').select('*').eq('id', 1).maybeSingle();
          if (error) throw error;
          const defaultConfig = {
            delivery_fee: 15,
            delivery_free_threshold: 199,
            platform_fee: 2,
            gst_fee: 0,
            delivery_fee_enabled: true,
            platform_fee_enabled: true,
            gst_enabled: false,
            support_email: 'mygeniefarm@gmail.com',
            support_phone: '+917732997749',
            support_phone_formatted: '+91 7732997749',
            delivery_slot: '6 AM - 8 AM',
            default_city: 'Bhiwadi, Khairthal',
            admin_username: 'admin',
            admin_password: 'admin123',
            admin_name: 'Vijay Manager',
            wallet_balance: 0
          };
          return NextResponse.json(data ? { ...defaultConfig, ...data } : defaultConfig, { headers: getCorsHeaders() });
        }
        case 'coupons': {
          const { data, error } = await supabase.from('coupons').select('*');
          if (error) throw error;
          return NextResponse.json(data, { headers: getCorsHeaders() });
        }
        case 'categories': {
          const { data, error } = await supabase.from('categories').select('*');
          if (error) throw error;
          return NextResponse.json(data, { headers: getCorsHeaders() });
        }
        default:
          return NextResponse.json({ error: 'API action not supported' }, { status: 400, headers: getCorsHeaders() });
      }
    } catch (err: any) {
      console.error('Supabase proxy GET error (falling back to JSON):', err.message || err);
      // Fall through to JSON file fallback if Supabase fails
    }
  }

  // Local JSON File Fallback (locked to prevent file corruption)
  return runLocked(async () => {
    const db = readDB();
    let responseData: any = null;

    switch (type) {
      case 'products':
        responseData = db.products;
        break;
      case 'orders':
        responseData = db.orders;
        break;
      case 'wallet':
        responseData = db.wallet_balance;
        break;
      case 'societies':
        responseData = db.societies;
        break;
      case 'addresses':
        responseData = db.addresses;
        break;
      case 'config':
        const defaultConfig = {
          delivery_fee: 15,
          delivery_free_threshold: 199,
          platform_fee: 2,
          gst_fee: 0,
          delivery_fee_enabled: true,
          platform_fee_enabled: true,
          gst_enabled: false,
          support_email: 'mygeniefarm@gmail.com',
          support_phone: '+917732997749',
          support_phone_formatted: '+91 7732997749',
          delivery_slot: '6 AM - 8 AM',
          default_city: 'Bhiwadi, Khairthal',
          admin_username: 'admin',
          admin_password: 'admin123',
          admin_name: 'Vijay Manager'
        };
        responseData = { ...defaultConfig, ...(db.config || {}) };
        break;
      case 'coupons':
        responseData = db.coupons || [];
        break;
      case 'categories':
        responseData = db.categories && db.categories.length > 0 ? db.categories : [
          { id: 'cat-1', name: 'Fruits', icon: '🍎' },
          { id: 'cat-2', name: 'Vegetables', icon: '🥦' },
          { id: 'cat-3', name: 'Daily Veggies', icon: '🍅' },
          { id: 'cat-4', name: 'Exotic Veggies', icon: '🥬' },
          { id: 'cat-5', name: 'Melons', icon: '🍉' },
          { id: 'cat-6', name: 'Traditional', icon: '🥭' }
        ];
        break;
      default:
        responseData = db;
    }

    return NextResponse.json(responseData, {
      headers: getCorsHeaders(),
    });
  });
}

// 2. POST HANDLER
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, data } = body;

    if (!action) {
      return NextResponse.json({ error: 'Action parameter missing' }, { status: 400, headers: getCorsHeaders() });
    }

    // If Supabase is configured, write directly to Supabase tables concurrently (no lock)
    if (supabase) {
      try {
        switch (action) {
          case 'log': {
            console.warn('--- CLIENT LOG FROM PHONE ---');
            console.warn(JSON.stringify(data, null, 2));
            console.warn('-----------------------------');
            return NextResponse.json({ success: true }, { headers: getCorsHeaders() });
          }

          case 'add_product': {
            const newProd = {
              ...data,
              id: data.id || 'prod-' + Date.now(),
            };
            const { data: inserted, error } = await supabase.from('products').insert([newProd]).select().single();
            if (error) throw error;
            return NextResponse.json(inserted, { headers: getCorsHeaders() });
          }

          case 'update_product': {
            const { data: updated, error } = await supabase.from('products').update(data).eq('id', data.id).select().single();
            if (error) throw error;
            return NextResponse.json(updated, { headers: getCorsHeaders() });
          }

          case 'delete_product': {
            const { error } = await supabase.from('products').delete().eq('id', data.id);
            if (error) throw error;
            return NextResponse.json({ success: true }, { headers: getCorsHeaders() });
          }

          case 'create_order': {
            // Server-side batch stock validation
            const productIds = data.items.map((item: any) => item.product_id);
            const { data: dbProducts, error: dbProductsError } = await supabase
              .from('products')
              .select('id, name, stock')
              .in('id', productIds);

            if (dbProductsError || !dbProducts) {
              return NextResponse.json({ error: 'Failed to validate product inventory levels.' }, { status: 500, headers: getCorsHeaders() });
            }

            for (const item of data.items) {
              const p = dbProducts.find((x: any) => x.id === item.product_id);
              if (!p) {
                return NextResponse.json({ error: `Product "${item.product_name}" was not found.` }, { status: 400, headers: getCorsHeaders() });
              }
              if (p.stock < item.quantity) {
                return NextResponse.json({ error: `Insufficient stock for "${p.name}". Only ${p.stock} units are available.` }, { status: 400, headers: getCorsHeaders() });
              }
            }

            const orderId = 'order-' + Math.floor(Math.random() * 900000 + 100000);
            const newOrder = {
              id: orderId,
              total_amount: data.total_amount,
              discount_amount: data.discount_amount,
              delivery_fee: data.delivery_fee,
              platform_fee: data.platform_fee,
              final_amount: data.final_amount,
              payment_method: data.payment_method,
              payment_status: data.payment_status,
              delivery_address: data.delivery_address,
              delivery_instructions: data.delivery_instructions,
              ring_doorbell: data.ring_doorbell,
              delivery_status: data.delivery_status || 'Pending',
              delivery_slot: data.delivery_slot,
              created_at: new Date().toISOString()
            };

            const { error: orderError } = await supabase.from('orders').insert([newOrder]);
            if (orderError) throw orderError;

            // Insert order items
            const itemsToInsert = data.items.map((item: any) => ({
              order_id: orderId,
              product_id: item.product_id,
              product_name: item.product_name,
              quantity: item.quantity,
              price: item.price
            }));

            const { error: itemsError } = await supabase.from('order_items').insert(itemsToInsert);
            if (itemsError) throw itemsError;

            // Deduct stock levels in parallel concurrently
            await Promise.all(data.items.map(async (item: any) => {
              const p = dbProducts.find((x: any) => x.id === item.product_id);
              if (p) {
                const nextStock = Math.max(0, p.stock - item.quantity);
                await supabase.from('products').update({ stock: nextStock }).eq('id', item.product_id);
              }
            }));

            return NextResponse.json({ ...newOrder, items: data.items }, { headers: getCorsHeaders() });
          }

          case 'update_order_status': {
            const { error } = await supabase.from('orders').update({ delivery_status: data.status }).eq('id', data.id);
            if (error) throw error;
            return NextResponse.json({ success: true }, { headers: getCorsHeaders() });
          }

          case 'delete_order': {
            const { error } = await supabase.from('orders').delete().eq('id', data.id);
            if (error) throw error;
            return NextResponse.json({ success: true }, { headers: getCorsHeaders() });
          }

          case 'wallet_add': {
            const { data: config } = await supabase.from('config').select('wallet_balance').eq('id', 1).single();
            const curBal = config?.wallet_balance || 0;
            const nextBal = curBal + parseFloat(data.amount);
            const { error } = await supabase.from('config').update({ wallet_balance: nextBal }).eq('id', 1);
            if (error) throw error;
            return NextResponse.json(nextBal, { headers: getCorsHeaders() });
          }

          case 'wallet_deduct': {
            const { data: config } = await supabase.from('config').select('wallet_balance').eq('id', 1).single();
            const curBal = config?.wallet_balance || 0;
            const amt = parseFloat(data.amount);
            if (curBal < amt) {
              return NextResponse.json({ error: 'Insufficient balance' }, { status: 400, headers: getCorsHeaders() });
            }
            const nextBal = curBal - amt;
            const { error } = await supabase.from('config').update({ wallet_balance: nextBal }).eq('id', 1);
            if (error) throw error;
            return NextResponse.json(nextBal, { headers: getCorsHeaders() });
          }

          case 'save_address': {
            if (data.is_default) {
              await supabase.from('addresses').update({ is_default: false }).eq('phone', data.phone);
            }
            const newAddr = {
              ...data,
              id: data.id || 'addr-' + Date.now(),
            };
            const { data: inserted, error } = await supabase.from('addresses').insert([newAddr]).select().single();
            if (error) throw error;
            return NextResponse.json(inserted, { headers: getCorsHeaders() });
          }

          case 'delete_address': {
            const { error } = await supabase.from('addresses').delete().eq('id', data.id);
            if (error) throw error;
            return NextResponse.json({ success: true }, { headers: getCorsHeaders() });
          }

          case 'update_config': {
            const { data: updated, error } = await supabase.from('config').update(data).eq('id', 1).select().single();
            if (error) throw error;
            return NextResponse.json(updated, { headers: getCorsHeaders() });
          }

          case 'save_coupon': {
            const newCoupon = {
              ...data,
              id: data.id || 'cp-' + Date.now(),
            };
            const { error } = await supabase.from('coupons').upsert(newCoupon, { onConflict: 'id' });
            if (error) throw error;
            return NextResponse.json({ success: true }, { headers: getCorsHeaders() });
          }

          case 'delete_coupon': {
            const { error } = await supabase.from('coupons').delete().eq('id', data.id);
            if (error) throw error;
            return NextResponse.json({ success: true }, { headers: getCorsHeaders() });
          }

          case 'save_category': {
            const newCat = {
              ...data,
              id: data.id || 'cat-' + Date.now(),
            };
            const { error } = await supabase.from('categories').upsert(newCat, { onConflict: 'id' });
            if (error) throw error;
            return NextResponse.json({ success: true }, { headers: getCorsHeaders() });
          }

          case 'delete_category': {
            const { error } = await supabase.from('categories').delete().eq('id', data.id);
            if (error) throw error;
            return NextResponse.json({ success: true }, { headers: getCorsHeaders() });
          }
        }
      } catch (err: any) {
        console.error('Supabase proxy POST error (falling back to JSON):', err.message || err);
        // Fall through to JSON file fallback if Supabase fails
      }
    }

    // JSON File Fallback (locked to prevent file corruption)
    return runLocked(async () => {
      const db = readDB();

      switch (action) {
        case 'log': {
          console.warn('--- CLIENT LOG FROM PHONE ---');
          console.warn(JSON.stringify(data, null, 2));
          console.warn('-----------------------------');
          return NextResponse.json({ success: true }, { headers: getCorsHeaders() });
        }

        case 'add_product': {
          const newProd = {
            ...data,
            id: 'prod-' + Date.now(),
          };
          db.products.push(newProd);
          writeDB(db);
          return NextResponse.json(newProd, { headers: getCorsHeaders() });
        }

        case 'update_product': {
          const index = db.products.findIndex((p: any) => p.id === data.id);
          if (index !== -1) {
            db.products[index] = data;
            writeDB(db);
          }
          return NextResponse.json(data, { headers: getCorsHeaders() });
        }

        case 'delete_product': {
          db.products = db.products.filter((p: any) => p.id !== data.id);
          writeDB(db);
          return NextResponse.json({ success: true }, { headers: getCorsHeaders() });
        }

        case 'create_order': {
          // Server-side strict stock validation
          for (const item of data.items) {
            const p = db.products.find((prod: any) => prod.id === item.product_id);
            if (!p) {
              return NextResponse.json({ error: `Product "${item.product_name}" was not found in our catalog.` }, { status: 400, headers: getCorsHeaders() });
            }
            if (p.stock < item.quantity) {
              return NextResponse.json({ error: `Insufficient stock for "${p.name}". Only ${p.stock} units are available.` }, { status: 400, headers: getCorsHeaders() });
            }
          }

          const newOrder = {
            ...data,
            id: 'order-' + Math.floor(Math.random() * 900000 + 100000),
            created_at: new Date().toISOString(),
          };
          db.orders.unshift(newOrder);

          // Deduct stock levels in JSON safely
          data.items.forEach((item: any) => {
            const p = db.products.find((prod: any) => prod.id === item.product_id);
            if (p) p.stock = Math.max(0, p.stock - item.quantity);
          });

          writeDB(db);
          return NextResponse.json(newOrder, { headers: getCorsHeaders() });
        }

        case 'update_order_status': {
          const index = db.orders.findIndex((o: any) => o.id === data.id);
          if (index !== -1) {
            db.orders[index].delivery_status = data.status;
            writeDB(db);
            return NextResponse.json({ success: true }, { headers: getCorsHeaders() });
          }
          return NextResponse.json({ error: 'Order not found' }, { status: 404, headers: getCorsHeaders() });
        }

        case 'delete_order': {
          db.orders = db.orders.filter((o: any) => o.id !== data.id);
          writeDB(db);
          return NextResponse.json({ success: true }, { headers: getCorsHeaders() });
        }

        case 'wallet_add': {
          db.wallet_balance = (db.wallet_balance || 0) + parseFloat(data.amount);
          writeDB(db);
          return NextResponse.json(db.wallet_balance, { headers: getCorsHeaders() });
        }

        case 'wallet_deduct': {
          const bal = db.wallet_balance || 0;
          const amt = parseFloat(data.amount);
          if (bal < amt) {
            return NextResponse.json({ error: 'Insufficient balance' }, { status: 400, headers: getCorsHeaders() });
          }
          db.wallet_balance = bal - amt;
          writeDB(db);
          return NextResponse.json(db.wallet_balance, { headers: getCorsHeaders() });
        }

        case 'save_address': {
          if (data.is_default) {
            db.addresses.forEach((a: any) => {
              if (a.phone === data.phone) {
                a.is_default = false;
              }
            });
          }
          const newAddr = {
            ...data,
            id: 'addr-' + Date.now(),
          };
          db.addresses.push(newAddr);
          writeDB(db);
          return NextResponse.json(newAddr, { headers: getCorsHeaders() });
        }

        case 'delete_address': {
          db.addresses = db.addresses.filter((a: any) => a.id !== data.id);
          writeDB(db);
          return NextResponse.json({ success: true }, { headers: getCorsHeaders() });
        }

        case 'update_config': {
          db.config = data;
          writeDB(db);
          return NextResponse.json(data, { headers: getCorsHeaders() });
        }

        case 'save_coupon': {
          if (!db.coupons) db.coupons = [];
          if (data.id) {
            const index = db.coupons.findIndex((c: any) => c.id === data.id);
            if (index !== -1) {
              db.coupons[index] = data;
            }
          } else {
            const newCoupon = {
              ...data,
              id: 'cp-' + Date.now(),
            };
            db.coupons.push(newCoupon);
          }
          writeDB(db);
          return NextResponse.json({ success: true }, { headers: getCorsHeaders() });
        }

        case 'delete_coupon': {
          if (db.coupons) {
            db.coupons = db.coupons.filter((c: any) => c.id !== data.id);
            writeDB(db);
          }
          return NextResponse.json({ success: true }, { headers: getCorsHeaders() });
        }

        case 'save_category': {
          if (!db.categories) {
            db.categories = [
              { id: 'cat-1', name: 'Fruits', icon: '🍎' },
              { id: 'cat-2', name: 'Vegetables', icon: '🥦' },
              { id: 'cat-3', name: 'Daily Veggies', icon: '🍅' },
              { id: 'cat-4', name: 'Exotic Veggies', icon: '🥬' },
              { id: 'cat-5', name: 'Melons', icon: '🍉' },
              { id: 'cat-6', name: 'Traditional', icon: '🥭' }
            ];
          }
          if (data.id) {
            const index = db.categories.findIndex((c: any) => c.id === data.id);
            if (index !== -1) {
              db.categories[index] = data;
            }
          } else {
            const newCat = {
              ...data,
              id: 'cat-' + Date.now(),
            };
            db.categories.push(newCat);
          }
          writeDB(db);
          return NextResponse.json({ success: true }, { headers: getCorsHeaders() });
        }

        case 'delete_category': {
          if (!db.categories) {
            db.categories = [
              { id: 'cat-1', name: 'Fruits', icon: '🍎' },
              { id: 'cat-2', name: 'Vegetables', icon: '🥦' },
              { id: 'cat-3', name: 'Daily Veggies', icon: '🍅' },
              { id: 'cat-4', name: 'Exotic Veggies', icon: '🥬' },
              { id: 'cat-5', name: 'Melons', icon: '🍉' },
              { id: 'cat-6', name: 'Traditional', icon: '🥭' }
            ];
          }
          db.categories = db.categories.filter((c: any) => c.id !== data.id);
          writeDB(db);
          return NextResponse.json({ success: true }, { headers: getCorsHeaders() });
        }

        default:
          return NextResponse.json({ error: 'Unknown action type' }, { status: 400, headers: getCorsHeaders() });
      }
    });
  } catch (err: any) {
    console.error('API Error:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500, headers: getCorsHeaders() });
  }
}
