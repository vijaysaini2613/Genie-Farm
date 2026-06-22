import { createClient } from '@supabase/supabase-js';

// Custom absolute fetch helper to resolve relative endpoints on mobile/external network clients
const clientFetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
  if (typeof window !== 'undefined' && typeof input === 'string' && input.startsWith('/')) {
    const absoluteUrl = `${window.location.origin}${input}`;
    return window.fetch(absoluteUrl, init);
  }
  return typeof window !== 'undefined' ? window.fetch(input, init) : globalThis.fetch(input, init);
};

// Shadow the global fetch identifier for all calls in this file
const localFetch = clientFetch;

// Get Supabase credentials from environment
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Initialize real Supabase client if configured
export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

export interface Product {
  id: string;
  name: string;
  category: string;
  sub_category?: string;
  mrp: number;
  price: number;
  unit: string;
  weight_range?: string;
  stock: number;
  image_url: string;
  description: string;
  benefits?: string;
  storage_tips?: string;
  shelf_life?: string;
  origin?: string;
  is_flash_deal?: boolean;
  flash_deal_threshold?: number;
  flash_deal_end_time?: string;
  is_available: boolean;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  image?: string;
}

export interface Society {
  id: string;
  name: string;
  city: string;
  pincode: string;
  sector?: string;
}

export interface Address {
  id: string;
  society_id: string;
  society_name: string;
  flat_house_no: string;
  name: string;
  phone: string;
  is_default: boolean;
}

export interface OrderItem {
  id: string;
  product_id: string;
  product_name: string;
  quantity: number;
  price: number;
}

export interface Order {
  id: string;
  created_at: string;
  total_amount: number;
  discount_amount: number;
  delivery_fee: number;
  platform_fee: number;
  final_amount: number;
  payment_method: 'UPI' | 'COD' | 'WALLET';
  payment_status: 'Pending' | 'Completed' | 'Failed';
  delivery_address: string;
  delivery_instructions?: string;
  ring_doorbell: boolean;
  delivery_status: 'Pending' | 'Packing' | 'Out for Delivery' | 'Delivered' | 'Cancelled';
  delivery_slot: string;
  items: OrderItem[];
}

// ==========================================
// DB SERVICE METHODS (Supabase or API fallback)
// ==========================================

export const dbService = {
  // PRODUCTS
  async getProducts(): Promise<Product[]> {
    if (supabase) {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('is_available', true);
      if (!error && data) return data as Product[];
      console.error('Supabase getProducts error:', error);
    }

    // API Fallback
    try {
      const res = await localFetch('/api/db?type=products');
      if (!res.ok) throw new Error(`API returned status ${res.status}`);
      return await res.json();
    } catch (err) {
      console.warn('API Fallback fetch failed for products, returning empty list:', err);
      return [];
    }
  },

  async addProduct(product: Omit<Product, 'id'>): Promise<Product> {
    if (supabase) {
      const { data, error } = await supabase
        .from('products')
        .insert([product])
        .select()
        .single();
      if (!error && data) return data as Product;
      console.error('Supabase addProduct error:', error);
    }

    // API Fallback
    try {
      const res = await localFetch('/api/db', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'add_product', data: product })
      });
      if (!res.ok) throw new Error(`API returned status ${res.status}`);
      return await res.json();
    } catch (err) {
      console.error('API Fallback addProduct failed:', err);
      throw err;
    }
  },

  async updateProduct(product: Product): Promise<Product> {
    if (supabase) {
      const { data, error } = await supabase
        .from('products')
        .update(product)
        .eq('id', product.id)
        .select()
        .single();
      if (!error && data) return data as Product;
      console.error('Supabase updateProduct error:', error);
    }

    // API Fallback
    try {
      const res = await localFetch('/api/db', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'update_product', data: product })
      });
      if (!res.ok) throw new Error(`API returned status ${res.status}`);
      return await res.json();
    } catch (err) {
      console.error('API Fallback updateProduct failed:', err);
      throw err;
    }
  },

  // SOCIETIES
  async getSocieties(): Promise<Society[]> {
    if (supabase) {
      const { data, error } = await supabase
        .from('societies')
        .select('*')
        .eq('is_active', true);
      if (!error && data) return data as Society[];
      console.error('Supabase getSocieties error:', error);
    }

    // API Fallback
    try {
      const res = await localFetch('/api/db?type=societies');
      if (!res.ok) throw new Error(`API returned status ${res.status}`);
      return await res.json();
    } catch (err) {
      console.warn('API Fallback fetch failed for societies, returning empty list:', err);
      return [];
    }
  },

  // ADDRESSES
  async getAddresses(): Promise<Address[]> {
    if (supabase) {
      const { data, error } = await supabase.from('addresses').select('*');
      if (!error && data) return data as Address[];
      console.error('Supabase getAddresses error:', error);
    }
    try {
      const res = await localFetch('/api/db?type=addresses');
      if (!res.ok) throw new Error(`API returned status ${res.status}`);
      return await res.json();
    } catch (err) {
      console.warn('API Fallback fetch failed for addresses, returning empty list:', err);
      return [];
    }
  },

  async saveAddress(address: Omit<Address, 'id'> & { id?: string }): Promise<Address> {
    if (supabase) {
      if (address.is_default) {
        await supabase.from('addresses').update({ is_default: false }).eq('phone', address.phone);
      }
      const newAddr = {
        ...address,
        id: address.id || 'addr-' + Date.now(),
      };
      const { data, error } = await supabase.from('addresses').upsert(newAddr).select().single();
      if (!error && data) return data as Address;
      console.error('Supabase saveAddress error:', error);
    }
    try {
      const res = await localFetch('/api/db', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'save_address', data: address })
      });
      if (!res.ok) throw new Error(`API returned status ${res.status}`);
      return await res.json();
    } catch (err) {
      console.error('API Fallback saveAddress failed:', err);
      throw err;
    }
  },

  async deleteAddress(addressId: string): Promise<boolean> {
    if (supabase) {
      const { error } = await supabase.from('addresses').delete().eq('id', addressId);
      if (!error) return true;
      console.error('Supabase deleteAddress error:', error);
    }
    try {
      const res = await localFetch('/api/db', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete_address', data: { id: addressId } })
      });
      return res.ok;
    } catch (err) {
      console.error('API Fallback deleteAddress failed:', err);
      return false;
    }
  },

  // WALLET
  async getWalletBalance(): Promise<number> {
    if (supabase) {
      const { data, error } = await supabase.from('config').select('wallet_balance').eq('id', 1).maybeSingle();
      if (!error && data) return data.wallet_balance || 0;
      console.error('Supabase getWalletBalance error:', error);
    }
    try {
      const res = await localFetch('/api/db?type=wallet');
      if (!res.ok) throw new Error(`API returned status ${res.status}`);
      return await res.json();
    } catch (err) {
      console.warn('API Fallback fetch failed for wallet, returning 0:', err);
      return 0;
    }
  },

  async addWalletMoney(amount: number): Promise<number> {
    if (supabase) {
      const { data: config } = await supabase.from('config').select('wallet_balance').eq('id', 1).maybeSingle();
      const curBal = config?.wallet_balance || 0;
      const nextBal = curBal + amount;
      const { error } = await supabase.from('config').update({ wallet_balance: nextBal }).eq('id', 1);
      if (!error) return nextBal;
      console.error('Supabase addWalletMoney error:', error);
    }
    try {
      const res = await localFetch('/api/db', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'wallet_add', data: { amount } })
      });
      if (!res.ok) throw new Error(`API returned status ${res.status}`);
      return await res.json();
    } catch (err) {
      console.error('API Fallback addWalletMoney failed:', err);
      throw err;
    }
  },

  async deductWalletMoney(amount: number): Promise<boolean> {
    if (supabase) {
      const { data: config } = await supabase.from('config').select('wallet_balance').eq('id', 1).maybeSingle();
      const curBal = config?.wallet_balance || 0;
      if (curBal < amount) return false;
      const nextBal = curBal - amount;
      const { error } = await supabase.from('config').update({ wallet_balance: nextBal }).eq('id', 1);
      if (!error) return true;
      console.error('Supabase deductWalletMoney error:', error);
    }
    try {
      const res = await localFetch('/api/db', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'wallet_deduct', data: { amount } })
      });
      return res.ok;
    } catch (err) {
      console.error('API Fallback deductWalletMoney failed:', err);
      return false;
    }
  },

  // ORDERS
  async getOrders(): Promise<Order[]> {
    if (supabase) {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (*)
        `)
        .order('created_at', { ascending: false });
      if (!error && data) {
        return data.map((order: any) => ({
          ...order,
          items: order.order_items || []
        })) as Order[];
      }
      console.error('Supabase getOrders error:', error);
    }

    // API Fallback
    try {
      const res = await localFetch('/api/db?type=orders');
      if (!res.ok) throw new Error(`API returned status ${res.status}`);
      const list = await res.json();
      return list.map((order: any) => ({
        ...order,
        items: order.items || order.order_items || []
      })) as Order[];
    } catch (err) {
      console.warn('API Fallback fetch failed for orders, returning empty list:', err);
      return [];
    }
  },

  async createOrder(order: Omit<Order, 'id' | 'created_at'>): Promise<Order> {
    // ALWAYS call the server-side API for order creation to ensure secure, authorized stock validation and deduction
    try {
      const res = await localFetch('/api/db', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'create_order', data: order })
      });
      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        throw new Error(errBody.error || `API returned status ${res.status}`);
      }
      return await res.json();
    } catch (err) {
      console.error('createOrder failed:', err);
      throw err;
    }
  },

  async updateOrderStatus(orderId: string, status: Order['delivery_status']): Promise<boolean> {
    if (supabase) {
      const { error } = await supabase
        .from('orders')
        .update({ delivery_status: status })
        .eq('id', orderId);
      if (!error) return true;
      console.error('Supabase updateOrderStatus error:', error);
    }

    // API Fallback
    try {
      const res = await localFetch('/api/db', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'update_order_status', data: { id: orderId, status } })
      });
      return res.ok;
    } catch (err) {
      console.error('API Fallback updateOrderStatus failed:', err);
      return false;
    }
  },
  async deleteOrder(orderId: string): Promise<boolean> {
    if (supabase) {
      const { error } = await supabase
        .from('orders')
        .delete()
        .eq('id', orderId);
      if (!error) return true;
      console.error('Supabase deleteOrder error:', error);
    }

    // API Fallback
    try {
      const res = await localFetch('/api/db', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete_order', data: { id: orderId } })
      });
      return res.ok;
    } catch (err) {
      console.error('API Fallback deleteOrder failed:', err);
      return false;
    }
  },

  // BILLING CONFIGS
  async getBillingConfig(): Promise<BillingConfig> {
    if (supabase) {
      const { data, error } = await supabase.from('config').select('*').eq('id', 1).maybeSingle();
      if (!error && data) {
        const defaultConfig = {
          delivery_fee: 15,
          delivery_free_threshold: 199,
          platform_fee: 2,
          gst_fee: 0,
          delivery_fee_enabled: true,
          platform_fee_enabled: true,
          gst_enabled: false,
          support_email: 'mygeniefarm@gmail.com',
          support_phone: '+919509122472',
          support_phone_formatted: '+91 9509122472',
          delivery_slot: '6 AM - 8 AM',
          default_city: 'Bhiwadi, Khairthal',
          admin_username: 'admin',
          admin_password: 'admin123',
          admin_name: 'Vijay Manager'
        };
        return { ...defaultConfig, ...data } as BillingConfig;
      }
      console.error('Supabase getBillingConfig error:', error);
    }
    try {
      const res = await localFetch('/api/db?type=config');
      if (!res.ok) throw new Error(`API returned status ${res.status}`);
      return await res.json();
    } catch (err) {
      console.warn('API Fallback fetch failed for config, returning default config:', err);
      return {
        delivery_fee: 15,
        delivery_free_threshold: 199,
        platform_fee: 2,
        gst_fee: 0,
        delivery_fee_enabled: true,
        platform_fee_enabled: true,
        gst_enabled: false,
        support_email: 'mygeniefarm@gmail.com',
        support_phone: '+919509122472',
        support_phone_formatted: '+91 9509122472',
        delivery_slot: '6 AM - 8 AM',
        default_city: 'Bhiwadi, Khairthal',
        admin_username: 'admin',
        admin_password: 'admin123',
        admin_name: 'Vijay Manager'
      };
    }
  },

  async updateBillingConfig(config: BillingConfig): Promise<BillingConfig> {
    if (supabase) {
      const { data, error } = await supabase.from('config').update(config).eq('id', 1).select().single();
      if (!error && data) return data as BillingConfig;
      console.error('Supabase updateBillingConfig error:', error);
    }
    try {
      const res = await localFetch('/api/db', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'update_config', data: config })
      });
      if (!res.ok) throw new Error(`API returned status ${res.status}`);
      return await res.json();
    } catch (err) {
      console.error('API Fallback updateBillingConfig failed:', err);
      throw err;
    }
  },

  // COUPONS
  async getCoupons(): Promise<Coupon[]> {
    if (supabase) {
      const { data, error } = await supabase.from('coupons').select('*');
      if (!error && data) return data as Coupon[];
      console.error('Supabase getCoupons error:', error);
    }
    try {
      const res = await localFetch('/api/db?type=coupons');
      if (!res.ok) throw new Error(`API returned status ${res.status}`);
      return await res.json();
    } catch (err) {
      console.warn('API Fallback fetch failed for coupons, returning empty list:', err);
      return [];
    }
  },

  async saveCoupon(coupon: Omit<Coupon, 'id'> & { id?: string }): Promise<boolean> {
    if (supabase) {
      const newCoupon = {
        ...coupon,
        id: coupon.id || 'cp-' + Date.now(),
      };
      const { error } = await supabase.from('coupons').upsert(newCoupon);
      if (!error) return true;
      console.error('Supabase saveCoupon error:', error);
    }
    try {
      const res = await localFetch('/api/db', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'save_coupon', data: coupon })
      });
      return res.ok;
    } catch (err) {
      console.error('API Fallback saveCoupon failed:', err);
      return false;
    }
  },

  async deleteCoupon(couponId: string): Promise<boolean> {
    if (supabase) {
      const { error } = await supabase.from('coupons').delete().eq('id', couponId);
      if (!error) return true;
      console.error('Supabase deleteCoupon error:', error);
    }
    try {
      const res = await localFetch('/api/db', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete_coupon', data: { id: couponId } })
      });
      return res.ok;
    } catch (err) {
      console.error('API Fallback deleteCoupon failed:', err);
      return false;
    }
  },

  async getCategories(): Promise<Category[]> {
    if (supabase) {
      const { data, error } = await supabase.from('categories').select('*');
      if (!error && data) return data as Category[];
      console.error('Supabase getCategories error:', error);
    }
    try {
      const res = await localFetch('/api/db?type=categories');
      if (!res.ok) throw new Error(`API returned status ${res.status}`);
      return await res.json();
    } catch (err) {
      console.warn('API Fallback fetch failed for categories, returning empty list:', err);
      return [];
    }
  }
}

export interface BillingConfig {
  delivery_fee: number;
  delivery_free_threshold: number;
  platform_fee: number;
  gst_fee: number;
  delivery_fee_enabled: boolean;
  platform_fee_enabled: boolean;
  gst_enabled: boolean;
  discount_card?: string;
  discount_banners?: string[];
  support_email?: string;
  support_phone?: string;
  support_phone_formatted?: string;
  delivery_slot?: string;
  default_city?: string;
  admin_username?: string;
  admin_password?: string;
  admin_name?: string;
}

export interface Coupon {
  id: string;
  code: string;
  discount_type: 'percentage' | 'flat';
  discount_value: number;
  min_order_value: number;
  is_active: boolean;
}

