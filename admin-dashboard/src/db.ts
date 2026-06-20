import { createClient } from '@supabase/supabase-js';

// Get Supabase credentials from environment
const supabaseUrl = import.meta.env?.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env?.VITE_SUPABASE_ANON_KEY || '';

// Initialize real Supabase client if configured
export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// Next.js Local API Base URL (dynamic to support local network mobile testing)
// We default to port 4000, but will dynamically fall back to port 3000 if 4000 is not available.
export let API_BASE = import.meta.env?.VITE_API_BASE || 
  (typeof window !== 'undefined'
    ? `http://${window.location.hostname}:3000/api/db`
    : 'http://localhost:3000/api/db');

if (typeof window !== 'undefined' && !import.meta.env?.VITE_API_BASE) {
  const probePort = async (port: number): Promise<boolean> => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 600);
      const res = await fetch(`http://${window.location.hostname}:${port}/api/db?type=config`, {
        signal: controller.signal,
        mode: 'cors'
      });
      clearTimeout(timeoutId);
      return res.ok;
    } catch (e) {
      return false;
    }
  };

  const autoDetectPort = async () => {
    // Try 4000 first
    const isPort4000Active = await probePort(4000);
    if (isPort4000Active) {
      API_BASE = `http://${window.location.hostname}:4000/api/db`;
      return;
    }
    // Fallback to 3000
    const isPort3000Active = await probePort(3000);
    if (isPort3000Active) {
      API_BASE = `http://${window.location.hostname}:3000/api/db`;
    } else {
      // Default to 3000 if neither is active yet (matching default Next.js local behavior)
      API_BASE = `http://${window.location.hostname}:3000/api/db`;
    }
  };

  autoDetectPort();
}

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

export const dbService = {
  // PRODUCTS
  async getProducts(): Promise<Product[]> {
    if (supabase) {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('name');
      if (!error && data) return data as Product[];
      console.error(error);
    }

    // Local API Fallback
    try {
      const res = await fetch(`${API_BASE}?type=products`);
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
      console.error(error);
    }

    // Local API Fallback
    try {
      const res = await fetch(API_BASE, {
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
      console.error(error);
    }

    // Local API Fallback
    try {
      const res = await fetch(API_BASE, {
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

  async deleteProduct(productId: string): Promise<boolean> {
    if (supabase) {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productId);
      if (!error) return true;
      console.error(error);
    }

    // Local API Fallback
    try {
      const res = await fetch(API_BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete_product', data: { id: productId } })
      });
      return res.ok;
    } catch (err) {
      console.error('API Fallback deleteProduct failed:', err);
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
      if (!error && data) return data as Order[];
      console.error(error);
    }

    // Local API Fallback
    try {
      const res = await fetch(`${API_BASE}?type=orders`);
      if (!res.ok) throw new Error(`API returned status ${res.status}`);
      return await res.json();
    } catch (err) {
      console.warn('API Fallback fetch failed for orders, returning empty list:', err);
      return [];
    }
  },

  async updateOrderStatus(orderId: string, status: Order['delivery_status']): Promise<boolean> {
    if (supabase) {
      const { error } = await supabase
        .from('orders')
        .update({ delivery_status: status })
        .eq('id', orderId);
      if (!error) return true;
      console.error(error);
    }

    // Local API Fallback
    try {
      const res = await fetch(API_BASE, {
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
      console.error(error);
    }

    // Local API Fallback
    try {
      const res = await fetch(API_BASE, {
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
    try {
      const res = await fetch(`${API_BASE}?type=config`);
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
    try {
      const res = await fetch(API_BASE, {
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
    try {
      const res = await fetch(`${API_BASE}?type=coupons`);
      if (!res.ok) throw new Error(`API returned status ${res.status}`);
      return await res.json();
    } catch (err) {
      console.warn('API Fallback fetch failed for coupons, returning empty list:', err);
      return [];
    }
  },

  async saveCoupon(coupon: Omit<Coupon, 'id'> & { id?: string }): Promise<boolean> {
    try {
      const res = await fetch(API_BASE, {
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
    try {
      const res = await fetch(API_BASE, {
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
    try {
      const res = await fetch(`${API_BASE}?type=categories`);
      if (!res.ok) throw new Error(`API returned status ${res.status}`);
      return await res.json();
    } catch (err) {
      console.warn('API Fallback fetch failed for categories, returning empty list:', err);
      return [];
    }
  },

  async saveCategory(category: Omit<Category, 'id'> & { id?: string }): Promise<boolean> {
    try {
      const res = await fetch(API_BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'save_category', data: category })
      });
      return res.ok;
    } catch (err) {
      console.error('API Fallback saveCategory failed:', err);
      return false;
    }
  },

  async deleteCategory(categoryId: string): Promise<boolean> {
    try {
      const res = await fetch(API_BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete_category', data: { id: categoryId } })
      });
      return res.ok;
    } catch (err) {
      console.error('API Fallback deleteCategory failed:', err);
      return false;
    }
  }
};

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

