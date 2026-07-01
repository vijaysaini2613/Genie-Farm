// Always fallback to Next.js proxy API (which uses Service Role Key) to bypass client-side RLS limits
export const supabase: any = null;


// Next.js API Base URL (pointing exclusively to port 4000 in local dev)
export const API_BASE = import.meta.env?.VITE_API_BASE ||
  (typeof window !== 'undefined'
    ? `http://${window.location.hostname}:4000/api/db`
    : 'http://localhost:4000/api/db');


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
      const res = await fetch(`${API_BASE}?type=products&t=${Date.now()}`);
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
      if (!error && data) {
        return data.map((order: any) => ({
          ...order,
          items: order.order_items || []
        })) as Order[];
      }
      console.error(error);
    }

    // Local API Fallback
    try {
      const res = await fetch(`${API_BASE}?type=orders&t=${Date.now()}`);
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
      const res = await fetch(`${API_BASE}?type=config&t=${Date.now()}`);
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
        support_phone: '+917732997749',
        support_phone_formatted: '+91 7732997749',
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
      const res = await fetch(`${API_BASE}?type=coupons&t=${Date.now()}`);
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
    if (supabase) {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name');
      if (!error && data) return data as Category[];
      console.error('Supabase getCategories error:', error);
    }

    try {
      const res = await fetch(`${API_BASE}?type=categories&t=${Date.now()}`);
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
  target_category?: string;
}

