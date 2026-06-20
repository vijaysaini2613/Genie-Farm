import React, { useState, useEffect } from 'react';
import { dbService } from './db';
import type { Product, Order, BillingConfig, Coupon, Category } from './db';
import * as XLSX from 'xlsx';
import {
  LayoutDashboard,
  ShoppingBag,
  FolderPlus,
  ClipboardList,
  TrendingUp,
  Clock,
  AlertTriangle,
  Plus,
  Edit2,
  Trash2,
  X,
  Printer,
  ChevronRight,
  LogOut,
  Sparkles,
  Settings,
  Tag,
  Leaf,
  Image,
  PhoneCall,
  Menu
} from 'lucide-react';

const toLocalDatetimeLocal = (dateString?: string) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '';
  const ten = (i: number) => (i < 10 ? '0' : '') + i;
  const YYYY = date.getFullYear();
  const MM = ten(date.getMonth() + 1);
  const DD = ten(date.getDate());
  const HH = ten(date.getHours());
  const MIN = ten(date.getMinutes());
  return `${YYYY}-${MM}-${DD}T${HH}:${MIN}`;
};

const getAddressAndPhone = (fullAddress: string) => {
  if (!fullAddress) return { address: '', phone: '' };
  const phoneMatch = fullAddress.match(/-?\s*(\d{10})$/);
  if (phoneMatch) {
    const phone = phoneMatch[1];
    const addressWithoutPhone = fullAddress.slice(0, phoneMatch.index).trim().replace(/-$/, '').trim();
    return { address: addressWithoutPhone, phone };
  }
  return { address: fullAddress, phone: '' };
};

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('admin_is_logged_in') === 'true';
    }
    return false;
  });
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [customAlert, setCustomAlert] = useState<string | null>(null);

  // Dashboard Tab state
  const [activeTab, setActiveTab] = useState<'dashboard' | 'orders' | 'products' | 'packing-list' | 'billing' | 'banner' | 'support' | 'flash-sales'>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Database States
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [, setLoading] = useState(true);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isManageCategoriesOpen, setIsManageCategoriesOpen] = useState(false);
  const [categoryForm, setCategoryForm] = useState({ name: '', icon: '', image: '' });
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  // Billing and Coupons state
  const [billingConfig, setBillingConfig] = useState<BillingConfig>({
    delivery_fee: 15,
    delivery_free_threshold: 199,
    platform_fee: 2,
    gst_fee: 0,
    delivery_fee_enabled: true,
    platform_fee_enabled: true,
    gst_enabled: false,
    support_email: "mygeniefarm@gmail.com",
    support_phone: "+919509122472",
    support_phone_formatted: "+91 9509122472",
    delivery_slot: "6 AM - 8 AM",
    default_city: "Bhiwadi, Khairthal",
    admin_username: "admin",
    admin_password: "admin123",
    admin_name: "Vijay Manager"
  });
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [couponForm, setCouponForm] = useState<Omit<Coupon, 'id'> & { id?: string }>({
    code: '',
    discount_type: 'flat',
    discount_value: 0,
    min_order_value: 0,
    is_active: true
  });

  // Flash Sales form state
  const [flashSaleForm, setFlashSaleForm] = useState({
    product_id: '',
    flash_price: 0,
    threshold: 199,
    has_timer: false,
    expiry_time: ''
  });

  // Form States
  const [productForm, setProductForm] = useState<Omit<Product, 'id'>>({
    name: '',
    category: '',
    sub_category: '',
    mrp: 0,
    price: 0,
    unit: 'per 500 gm',
    weight_range: '(400-600g)',
    stock: 20,
    image_url: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&q=80&w=400',
    description: '',
    benefits: '',
    storage_tips: '',
    shelf_life: '3 days',
    origin: 'Local Farms',
    is_flash_deal: false,
    flash_deal_threshold: 0,
    flash_deal_end_time: '',
    is_available: true
  });

  const loadAllData = async () => {
    setLoading(true);
    const prodList = await dbService.getProducts();
    setProducts(prodList);
    const orderList = await dbService.getOrders();
    setOrders(orderList);
    try {
      const config = await dbService.getBillingConfig();
      setBillingConfig(config);
      const couponList = await dbService.getCoupons();
      setCoupons(couponList);
      const catList = await dbService.getCategories();
      setCategories(catList);
    } catch (e) {
      console.error('Failed to load billing configuration, coupons, or categories:', e);
    }
    setLoading(false);
  };

  useEffect(() => {
    const originalAlert = window.alert;
    window.alert = (message: any) => {
      setCustomAlert(String(message));
    };

    // Load initial configuration for credential auth check fallbacks
    const fetchConfigBeforeLogin = async () => {
      try {
        const config = await dbService.getBillingConfig();
        setBillingConfig(config);
      } catch (e) {
        console.error('Failed to load initial config:', e);
      }
    };
    fetchConfigBeforeLogin();

    return () => {
      window.alert = originalAlert;
    };
  }, []);

  const loadPeriodicData = async () => {
    try {
      const orderList = await dbService.getOrders();
      setOrders(orderList);
    } catch (e) {
      console.error('Failed to load periodic orders:', e);
    }
  };

  useEffect(() => {
    if (isLoggedIn) {
      loadAllData();
      const interval = setInterval(() => {
        loadPeriodicData();
      }, 4000);
      return () => clearInterval(interval);
    }
  }, [isLoggedIn]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const dynamicUser = billingConfig.admin_username || 'admin';
    const dynamicPass = billingConfig.admin_password || 'admin123';
    if (username === dynamicUser && password === dynamicPass) {
      localStorage.setItem('admin_is_logged_in', 'true');
      setIsLoggedIn(true);
    } else {
      alert(`Invalid admin credentials. Use ${dynamicUser} / ${dynamicPass}`);
    }
  };

  const handleStatusChange = async (orderId: string, status: Order['delivery_status']) => {
    const success = await dbService.updateOrderStatus(orderId, status);
    if (success) {
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, delivery_status: status } : o));
      if (selectedOrder?.id === orderId) {
        setSelectedOrder(prev => prev ? { ...prev, delivery_status: status } : null);
      }
    } else {
      alert('Failed to update status.');
    }
  };

  // CSV template for products import
  const csvTemplateContent = [
    'name,category,sub_category,mrp,price,unit,weight_range,stock,image_url,description,benefits,storage_tips,shelf_life,origin,is_flash_deal,flash_deal_threshold,is_available',
    'Pineapple,Fruits,Tropical,120,98,1 pc,,20,https://images.unsplash.com/photo-1589820296156-2454bb8a6ad1,Sweet pineapples.,Metabolism & Immunity.,Refrigerate.,4 days,India,false,0,true',
    'Zucchini - Green,Vegetables,Exotic,60,50,per 500 gm,(400-600g),15,https://images.unsplash.com/photo-1592924357228-91a4daadcfea,Fresh green zucchini.,Supports vision.,Store dry in fridge.,4 days,India,false,0,true'
  ].join('\n');

  const templateDownloadUrl = `data:text/csv;charset=utf-8,${encodeURIComponent(csvTemplateContent)}`;

  const handleFileImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileReader = new FileReader();

    fileReader.onload = async (event) => {
      try {
        const data = event.target?.result;
        if (!data) return;

        let rows: any[] = [];

        // Parse CSV or Excel
        if (file.name.endsWith('.csv')) {
          const text = new TextDecoder().decode(new Uint8Array(data as ArrayBuffer));
          const workbook = XLSX.read(text, { type: 'string' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          rows = XLSX.utils.sheet_to_json(worksheet, { defval: '' });
        } else {
          const workbook = XLSX.read(new Uint8Array(data as ArrayBuffer), { type: 'array' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          rows = XLSX.utils.sheet_to_json(worksheet, { defval: '' });
        }

        if (rows.length === 0) {
          alert('No product rows found in the uploaded file.');
          return;
        }

        const productsToAdd: Omit<Product, 'id'>[] = [];
        let skippedRowsCount = 0;

        for (const row of rows) {
          const normalizedRow: any = {};
          Object.keys(row).forEach(key => {
            const normalizedKey = key.toLowerCase().trim().replace(/[\s_]/g, '');
            normalizedRow[normalizedKey] = row[key];
          });

          const name = normalizedRow.name || normalizedRow.productname;
          const category = normalizedRow.category;
          const mrp = parseFloat(normalizedRow.mrp);
          const price = parseFloat(normalizedRow.price) || parseFloat(normalizedRow.sellingprice);
          const unit = normalizedRow.unit || normalizedRow.unitsize;

          if (!name || !category || isNaN(mrp) || isNaN(price) || !unit) {
            skippedRowsCount++;
            continue;
          }

          const catStr = category.toString().trim();
          const matchedCat = categories.find(c => c.name.toLowerCase() === catStr.toLowerCase());
          const finalCategory = matchedCat ? matchedCat.name : catStr;

          const productData: Omit<Product, 'id'> = {
            name: name.toString().trim(),
            category: finalCategory,
            sub_category: (normalizedRow.subcategory || '').toString().trim(),
            mrp: mrp,
            price: price,
            unit: unit.toString().trim(),
            weight_range: (normalizedRow.weightrange || '').toString().trim(),
            stock: parseInt(normalizedRow.stock || normalizedRow.stockyield) || 0,
            image_url: (normalizedRow.imageurl || normalizedRow.image || 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&q=80&w=400').toString().trim(),
            description: (normalizedRow.description || '').toString().trim(),
            benefits: (normalizedRow.benefits || '').toString().trim(),
            storage_tips: (normalizedRow.storagetips || normalizedRow.storage || '').toString().trim(),
            shelf_life: (normalizedRow.shelflife || '3 days').toString().trim(),
            origin: (normalizedRow.origin || 'Local Farms').toString().trim(),
            is_flash_deal: normalizedRow.isflashdeal === true || normalizedRow.isflashdeal === 'true' || normalizedRow.isflashdeal === 1 || normalizedRow.isflashdeal === '1',
            flash_deal_threshold: parseFloat(normalizedRow.flashdealthreshold) || 0,
            is_available: normalizedRow.isavailable !== false && normalizedRow.isavailable !== 'false' && normalizedRow.isavailable !== 0 && normalizedRow.isavailable !== '0'
          };

          productsToAdd.push(productData);
        }

        if (productsToAdd.length === 0) {
          alert('Failed to parse any valid products. Please check required fields (name, category, mrp, price, unit).');
          return;
        }

        let addedCount = 0;
        for (const prod of productsToAdd) {
          try {
            await dbService.addProduct(prod);
            addedCount++;
          } catch (err) {
            console.error('Failed to add product during import:', prod.name, err);
          }
        }

        loadAllData();
        alert(`Successfully imported ${addedCount} products!${skippedRowsCount > 0 ? ` (Skipped ${skippedRowsCount} invalid rows)` : ''}`);
        setIsAddOpen(false);
      } catch (err) {
        console.error('File import error:', err);
        alert('An error occurred while parsing the file. Make sure it is a valid CSV or Excel file.');
      }
    };

    fileReader.readAsArrayBuffer(file);
    e.target.value = '';
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryForm.name.trim() || !categoryForm.icon.trim()) {
      alert('Please fill out all fields.');
      return;
    }
    try {
      const data = editingCategory
        ? { id: editingCategory.id, name: categoryForm.name.trim(), icon: categoryForm.icon.trim(), image: categoryForm.image || '' }
        : { name: categoryForm.name.trim(), icon: categoryForm.icon.trim(), image: categoryForm.image || '' };

      const success = await dbService.saveCategory(data);
      if (success) {
        setCategoryForm({ name: '', icon: '', image: '' });
        setEditingCategory(null);
        const catList = await dbService.getCategories();
        setCategories(catList);
        alert(editingCategory ? 'Category updated successfully!' : 'Category added successfully!');
      } else {
        alert('Failed to save category.');
      }
    } catch (err) {
      console.error(err);
      alert('Failed to save category.');
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this category? Any products in this category will remain, but the category itself will be deleted.')) {
      try {
        const success = await dbService.deleteCategory(id);
        if (success) {
          const catList = await dbService.getCategories();
          setCategories(catList);
          alert('Category deleted successfully!');
        } else {
          alert('Failed to delete category.');
        }
      } catch (err) {
        console.error(err);
        alert('Failed to delete category.');
      }
    }
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await dbService.addProduct(productForm);
      setIsAddOpen(false);
      // Reset form
      setProductForm({
        name: '',
        category: '',
        sub_category: '',
        mrp: 0,
        price: 0,
        unit: 'per 500 gm',
        weight_range: '',
        stock: 20,
        image_url: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&q=80&w=400',
        description: '',
        benefits: '',
        storage_tips: '',
        shelf_life: '3 days',
        origin: 'Local Farms',
        is_flash_deal: false,
        flash_deal_threshold: 0,
        flash_deal_end_time: '',
        is_available: true
      });
      loadAllData();
      alert('Product added successfully!');
    } catch (err) {
      console.error(err);
      alert('Failed to save product.');
    }
  };

  const handleEditProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;
    try {
      await dbService.updateProduct(selectedProduct);
      setIsEditOpen(false);
      setSelectedProduct(null);
      loadAllData();
      alert('Product updated successfully!');
    } catch (err) {
      console.error(err);
      alert('Failed to update product.');
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      await dbService.deleteProduct(id);
      loadAllData();
    }
  };

  const handleDeleteOrder = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this order?')) {
      const success = await dbService.deleteOrder(id);
      if (success) {
        if (selectedOrder?.id === id) {
          setSelectedOrder(null);
        }
        loadAllData();
        alert('Order deleted successfully!');
      } else {
        alert('Failed to delete order.');
      }
    }
  };

  const handleSaveFlashSale = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!flashSaleForm.product_id) {
      alert('Please select a product first.');
      return;
    }
    const product = products.find(p => p.id === flashSaleForm.product_id);
    if (!product) return;

    try {
      const updated = {
        ...product,
        is_flash_deal: true,
        price: flashSaleForm.flash_price,
        flash_deal_threshold: flashSaleForm.threshold,
        flash_deal_end_time: flashSaleForm.has_timer && flashSaleForm.expiry_time ? new Date(flashSaleForm.expiry_time).toISOString() : ''
      };
      await dbService.updateProduct(updated);
      setFlashSaleForm({
        product_id: '',
        flash_price: 0,
        threshold: 199,
        has_timer: false,
        expiry_time: ''
      });
      loadAllData();
      alert('Flash sale launched successfully!');
    } catch (err) {
      console.error(err);
      alert('Failed to launch flash sale.');
    }
  };

  const handleEndFlashSale = async (productId: string) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    try {
      const updated = {
        ...product,
        is_flash_deal: false,
        price: product.mrp, // Revert price to MRP
        flash_deal_threshold: 0,
        flash_deal_end_time: ''
      };
      await dbService.updateProduct(updated);
      loadAllData();
      alert('Flash sale ended and price reverted to MRP.');
    } catch (err) {
      console.error(err);
      alert('Failed to end flash sale.');
    }
  };

  const handleSaveBillingConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await dbService.updateBillingConfig(billingConfig);
      alert('Billing configuration updated successfully!');
    } catch (err) {
      console.error(err);
      alert('Failed to update billing configuration.');
    }
  };

  const handleSaveBannerConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await dbService.updateBillingConfig(billingConfig);
      alert('Discount card banner updated successfully!');
    } catch (err) {
      console.error(err);
      alert('Failed to update banner configuration.');
    }
  };

  const handleSaveSupportConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await dbService.updateBillingConfig(billingConfig);
      alert('Customer support & access credentials updated successfully!');
    } catch (err) {
      console.error(err);
      alert('Failed to update support settings.');
    }
  };

  const handleSaveCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await dbService.saveCoupon(couponForm);
      setCouponForm({
        code: '',
        discount_type: 'flat',
        discount_value: 0,
        min_order_value: 0,
        is_active: true
      });
      const couponList = await dbService.getCoupons();
      setCoupons(couponList);
      alert('Coupon saved successfully!');
    } catch (err) {
      console.error(err);
      alert('Failed to save coupon.');
    }
  };

  const handleDeleteCoupon = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this coupon?')) {
      await dbService.deleteCoupon(id);
      const couponList = await dbService.getCoupons();
      setCoupons(couponList);
    }
  };

  // Overnight Packing List Calculations
  // Sum item quantities across all orders that are currently "Pending" or "Packing"
  const getPackingList = () => {
    const packingSummary: { [key: string]: { product_name: string; quantity: number; unit: string } } = {};

    orders
      .filter(o => o.delivery_status === 'Pending' || o.delivery_status === 'Packing')
      .forEach(order => {
        order.items?.forEach(item => {
          const product = products.find(p => p.id === item.product_id);
          const unit = product?.unit || 'pcs';
          if (packingSummary[item.product_name]) {
            packingSummary[item.product_name].quantity += item.quantity;
          } else {
            packingSummary[item.product_name] = {
              product_name: item.product_name,
              quantity: item.quantity,
              unit: unit
            };
          }
        });
      });

    return Object.values(packingSummary);
  };

  const packingList = getPackingList();

  // Statistics Summary
  const pendingOrders = orders.filter(o => o.delivery_status === 'Pending' || o.delivery_status === 'Packing');
  const revenue = orders
    .filter(o => o.delivery_status === 'Delivered' || o.payment_status === 'Completed')
    .reduce((acc, o) => acc + o.final_amount, 0);
  const outOfStockProducts = products.filter(p => p.stock === 0 || !p.is_available);

  // Filter lists
  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredOrders = orders.filter(o =>
    o.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    o.delivery_address.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!isLoggedIn) {
    /* LOGIN VIEW */
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
        <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
          <div className="mx-auto h-12 w-12 rounded-xl bg-[#1e7e34] flex items-center justify-center text-white text-2xl font-bold shadow-md">
            <Leaf size={24} className="fill-current text-white animate-pulse" />
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Genie Farm Admin Portal
          </h2>
          <p className="mt-2 text-center text-sm text-gray-500">
            Secure inventory & dispatch dashboard
          </p>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-4 shadow-xl sm:rounded-3xl sm:px-10 border border-gray-100">
            <form className="space-y-6" onSubmit={handleLogin}>
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Admin Username
                </label>
                <div className="mt-1.5">
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="e.g. admin"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-[#1e7e34] text-gray-800"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Password
                </label>
                <div className="mt-1.5">
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-[#1e7e34] text-gray-800"
                  />
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-md text-sm font-bold text-white bg-[#1e7e34] hover:bg-[#155a24] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#1e7e34] transition-all cursor-pointer"
                >
                  Log In to Dashboard
                </button>
              </div>
            </form>
            <div className="mt-6 text-center text-xs text-gray-400">
              Credentials for testing: <span className="font-bold text-gray-600">{billingConfig.admin_username || 'admin'} / {billingConfig.admin_password || 'admin123'}</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex font-sans overflow-x-hidden">

      {/* 1. SIDEBAR NAVIGATION */}
      {/* Mobile backdrop */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-[#1e7e34] text-white flex flex-col justify-between shrink-0 shadow-lg transform transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div>
          {/* Brand header */}
          <div className="p-6 flex items-center space-x-3 border-b border-green-700/40">
            <div className="w-8 h-8 rounded-lg bg-yellow-400 text-green-950 flex items-center justify-center shadow-inner">
              <Leaf size={16} className="fill-current text-green-950 animate-pulse" />
            </div>
            <div>
              <h1 className="text-lg font-bold leading-tight m-0 text-white flex items-center">
                genie farm
                <span className="text-[10px] bg-green-900/60 text-yellow-400 px-1.5 py-0.2 rounded-md font-semibold ml-2">Admin</span>
              </h1>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1">
            {[
              { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
              { id: 'orders', label: 'Active Orders', icon: ShoppingBag, badge: pendingOrders.length },
              { id: 'products', label: 'Products Catalog', icon: FolderPlus },
              { id: 'packing-list', label: 'Overnight Packing Sheet', icon: ClipboardList, badge: packingList.length },
              { id: 'billing', label: 'Billing Settings', icon: Settings },
              { id: 'banner', label: 'Banner Upload', icon: Image },
              { id: 'support', label: 'Customer Support', icon: PhoneCall },
              { id: 'flash-sales', label: 'Flash Sales Manager', icon: Sparkles },
            ].map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id as any);
                    setSearchQuery('');
                    setIsSidebarOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-xs font-bold transition-all text-left ${isActive
                      ? 'bg-white text-green-950 shadow-md'
                      : 'text-green-100 hover:bg-green-700/40'
                    }`}
                >
                  <div className="flex items-center space-x-3">
                    <Icon size={18} />
                    <span>{item.label}</span>
                  </div>
                  {!!item.badge && (
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${isActive ? 'bg-[#1e7e34] text-white' : 'bg-green-800 text-yellow-400'
                      }`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* User / Logout */}
        <div className="p-4 border-t border-green-700/40">
          <div className="flex items-center justify-between p-2 rounded-xl bg-green-800/40">
            <div className="flex items-center space-x-2.5 overflow-hidden">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center font-bold text-xs">
                AD
              </div>
              <div className="truncate">
                <p className="text-xs font-bold truncate">{billingConfig.admin_name || 'Vijay Manager'}</p>
                <p className="text-[9px] text-green-200">System Admin</p>
              </div>
            </div>
            <button
              onClick={() => {
                localStorage.removeItem('admin_is_logged_in');
                setIsLoggedIn(false);
              }}
              className="p-1.5 hover:bg-red-600 rounded-lg text-green-100 hover:text-white transition-colors"
              title="Logout"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* 2. MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">

        {/* Top bar header */}
        <header className="bg-white border-b border-gray-100 px-4 lg:px-8 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0 shadow-xs">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="p-2 -ml-2 rounded-lg text-gray-600 hover:bg-gray-100 lg:hidden cursor-pointer"
            >
              <Menu size={20} />
            </button>
            <h2 className="text-lg lg:text-xl font-bold text-gray-900 m-0 capitalize">
              {activeTab.replace('-', ' ')}
            </h2>
          </div>

          {/* Search box (Dynamic for list views) */}
          {activeTab !== 'dashboard' && activeTab !== 'packing-list' && (
            <div className="w-full sm:w-80 relative">
              <input
                type="text"
                placeholder={`Search ${activeTab}...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-[#1e7e34] text-gray-800"
              />
            </div>
          )}
        </header>

        {/* Context panel */}
        <div className="p-4 lg:p-8">

          {/* Tab contents */}
          {activeTab === 'dashboard' && (
            /* OVERVIEW TAB */
            <div className="space-y-8 animate-fade-in">
              {/* Stat cards grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                  { label: "Today's Revenue", value: `₹${revenue}`, desc: "From completed orders", icon: TrendingUp, color: "text-[#1e7e34] bg-green-50" },
                  { label: "Orders Packing", value: pendingOrders.length, desc: "Deliver by next morning", icon: Clock, color: "text-yellow-600 bg-yellow-50" },
                  { label: "Total Catalog Items", value: products.length, desc: "Live fruits & vegetables", icon: ClipboardList, color: "text-indigo-600 bg-indigo-50" },
                  { label: "Stock Warnings", value: outOfStockProducts.length, desc: "Disabled or 0 quantity", icon: AlertTriangle, color: "text-red-600 bg-red-50" },
                ].map((stat, i) => {
                  const Icon = stat.icon;
                  return (
                    <div key={i} className="bg-white rounded-3xl border border-gray-100 p-5 shadow-xs flex justify-between items-start">
                      <div className="space-y-1">
                        <span className="text-[10px] text-gray-400 font-extrabold uppercase tracking-wider">{stat.label}</span>
                        <h3 className="text-2xl font-black text-gray-900">{stat.value}</h3>
                        <p className="text-[10px] text-gray-400">{stat.desc}</p>
                      </div>
                      <div className={`p-3 rounded-2xl ${stat.color}`}>
                        <Icon size={22} />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Layout splits */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Active orders teaser */}
                <div className="col-span-1 lg:col-span-2 bg-white rounded-3xl border border-gray-100 p-6 shadow-xs space-y-4">
                  <div className="flex justify-between items-center pb-2 border-b border-gray-55">
                    <h3 className="text-sm font-extrabold text-gray-800 uppercase tracking-wider">Latest Pending Orders</h3>
                    <button
                      onClick={() => setActiveTab('orders')}
                      className="text-xs font-bold text-[#1e7e34] hover:underline flex items-center space-x-1"
                    >
                      <span>View all</span>
                      <ChevronRight size={14} />
                    </button>
                  </div>
                  {pendingOrders.length === 0 ? (
                    <p className="text-xs text-gray-400 py-4 text-center">No pending orders for tomorrow morning.</p>
                  ) : (
                    <div className="divide-y divide-gray-50">
                      {pendingOrders.slice(0, 5).map((order) => (
                        <div key={order.id} className="py-3 flex justify-between items-center text-xs">
                          <div>
                            <span className="font-bold text-gray-800">#{order.id}</span>
                            <span className="text-gray-400 ml-2">{order.items?.length} items</span>
                            {(() => {
                              const { address, phone } = getAddressAndPhone(order.delivery_address);
                              return (
                                <div className="mt-1 space-y-0.5">
                                  <p className="text-[10px] text-gray-400 truncate max-w-xs">{address}</p>
                                  {phone && <p className="text-[9px] text-green-700 font-extrabold">📞 {phone}</p>}
                                </div>
                              );
                            })()}
                          </div>
                          <div className="text-right">
                            <span className="font-bold text-[#1e7e34]">₹{order.final_amount}</span>
                            <span className="block text-[9px] bg-yellow-50 text-yellow-700 px-2 py-0.5 rounded-full font-bold mt-1">
                              {order.delivery_status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Sourcing alerts */}
                <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-xs space-y-4">
                  <div className="flex justify-between items-center pb-2 border-b border-gray-55">
                    <h3 className="text-sm font-extrabold text-gray-800 uppercase tracking-wider">Low Stock Warnings</h3>
                  </div>
                  {outOfStockProducts.length === 0 ? (
                    <p className="text-xs text-gray-400 py-4 text-center">All inventory levels look healthy.</p>
                  ) : (
                    <div className="space-y-3">
                      {outOfStockProducts.slice(0, 5).map((prod) => (
                        <div key={prod.id} className="flex justify-between items-center text-xs p-2.5 bg-red-50/30 rounded-xl border border-red-50">
                          <div>
                            <h4 className="font-bold text-gray-800">{prod.name}</h4>
                            <p className="text-[9px] text-gray-400">{prod.category}</p>
                          </div>
                          <span className="text-[10px] font-extrabold bg-red-100 text-red-700 px-2 py-0.5 rounded-full">
                            {prod.stock === 0 ? 'Out of stock' : 'Inactive'}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'orders' && (
            /* ORDERS TAB */
            <div className="bg-white rounded-3xl border border-gray-100 shadow-xs overflow-x-auto animate-fade-in">
              <table className="min-w-[1000px] w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100 text-gray-400 uppercase tracking-wider font-extrabold">
                    <th className="p-4">Order ID</th>
                    <th className="p-4">Date & Time</th>
                    <th className="p-4">Address</th>
                    <th className="p-4">Final Amt</th>
                    <th className="p-4">Payment</th>
                    <th className="p-4">Instructions</th>
                    <th className="p-4">Delivery Status</th>
                    <th className="p-4">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-gray-700">
                  {filteredOrders.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-gray-400 font-medium">No orders found.</td>
                    </tr>
                  ) : (
                    filteredOrders.map((order) => (
                      <tr key={order.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="p-4 font-bold text-gray-900">#{order.id}</td>
                        <td className="p-4">
                          {new Date(order.created_at).toLocaleString()}
                        </td>
                        <td className="p-4 max-w-sm">
                          {(() => {
                            const { address, phone } = getAddressAndPhone(order.delivery_address);
                            return (
                              <div className="space-y-1">
                                <p className="text-gray-800 font-semibold whitespace-normal break-words leading-relaxed">{address}</p>
                                {phone && (
                                  <span className="inline-block text-[9px] bg-green-50 text-green-700 border border-green-200/50 font-extrabold px-2 py-0.5 rounded-md">
                                    📞 {phone}
                                  </span>
                                )}
                              </div>
                            );
                          })()}
                        </td>
                        <td className="p-4 font-bold text-green-700">₹{order.final_amount}</td>
                        <td className="p-4">
                          <span className="font-semibold block">{order.payment_method}</span>
                          <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded-md ${order.payment_status === 'Completed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                            }`}>
                            {order.payment_status}
                          </span>
                        </td>
                        <td className="p-4 max-w-xs">
                          {order.ring_doorbell && (
                            <span className="bg-blue-50 text-blue-700 text-[9px] font-bold px-2 py-0.5 rounded-full mr-1.5">
                              Bell 🔔
                            </span>
                          )}
                          {order.delivery_instructions && (
                            <span className="text-[10px] text-gray-400 italic">"{order.delivery_instructions}"</span>
                          )}
                        </td>
                        <td className="p-4">
                          <select
                            value={order.delivery_status}
                            onChange={(e) => handleStatusChange(order.id, e.target.value as any)}
                            className="bg-gray-50 border border-gray-200 rounded-lg p-1.5 text-xs font-bold text-gray-700 focus:outline-none focus:ring-1 focus:ring-[#1e7e34]"
                          >
                            <option value="Pending">Pending</option>
                            <option value="Packing">Packing</option>
                            <option value="Out for Delivery">Out for Delivery</option>
                            <option value="Delivered">Delivered</option>
                            <option value="Cancelled">Cancelled</option>
                          </select>
                        </td>
                        <td className="p-4 flex items-center space-x-3">
                          <button
                            onClick={() => setSelectedOrder(order)}
                            className="text-[#1e7e34] font-bold hover:underline"
                          >
                            View Items
                          </button>
                          <button
                            onClick={() => handleDeleteOrder(order.id)}
                            className="p-1.5 bg-gray-50 text-gray-600 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors"
                            title="Delete Order"
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'products' && (
            /* PRODUCTS CATALOG TAB */
            <div className="space-y-4 animate-fade-in">
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-400 font-bold">{filteredProducts.length} Products registered</span>
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => setIsManageCategoriesOpen(true)}
                    className="flex items-center space-x-1.5 border border-gray-200 hover:border-[#1e7e34] bg-white hover:bg-[#1e7e34]/5 text-gray-700 hover:text-[#1e7e34] font-bold text-xs px-4 py-2.5 rounded-xl transition-all shadow-xs cursor-pointer animate-fade-in"
                  >
                    <Settings size={16} />
                    <span>Manage Categories</span>
                  </button>
                  <button
                    onClick={() => setIsAddOpen(true)}
                    className="flex items-center space-x-1.5 bg-[#1e7e34] hover:bg-[#155a24] text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-all shadow-md cursor-pointer"
                  >
                    <Plus size={16} />
                    <span>Add New Product</span>
                  </button>
                </div>
              </div>

              <div className="bg-white rounded-3xl border border-gray-100 shadow-xs overflow-x-auto">
                <table className="min-w-[1000px] w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100 text-gray-400 uppercase tracking-wider font-extrabold">
                      <th className="p-4">Image</th>
                      <th className="p-4">Product Name</th>
                      <th className="p-4">Category</th>
                      <th className="p-4">Price / MRP</th>
                      <th className="p-4">Sizing Unit</th>
                      <th className="p-4">Stock</th>
                      <th className="p-4">Status</th>
                      <th className="p-4">Flash Deal</th>
                      <th className="p-4 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-gray-700">
                    {filteredProducts.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="p-8 text-center text-gray-400 font-medium">No products registered.</td>
                      </tr>
                    ) : (
                      filteredProducts.map((prod) => (
                        <tr key={prod.id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="p-4">
                            <img
                              src={prod.image_url}
                              alt={prod.name}
                              className="w-10 h-10 object-cover rounded-lg bg-gray-50 border border-gray-100"
                            />
                          </td>
                          <td className="p-4 font-bold text-gray-900">{prod.name}</td>
                          <td className="p-4">
                            <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded-md font-semibold">
                              {prod.category}
                            </span>
                          </td>
                          <td className="p-4">
                            <span className="font-bold text-[#1e7e34]">₹{prod.price}</span>
                            <span className="text-[10px] text-gray-400 line-through ml-1.5">₹{prod.mrp}</span>
                          </td>
                          <td className="p-4">{prod.unit} <span className="text-gray-400 text-[10px]">{prod.weight_range}</span></td>
                          <td className="p-4 font-bold">
                            <input
                              type="number"
                              min="0"
                              value={prod.stock}
                              onChange={async (e) => {
                                const newStock = parseInt(e.target.value) || 0;
                                const updated = { ...prod, stock: newStock, is_available: newStock > 0 };
                                await dbService.updateProduct(updated);
                                loadAllData();
                              }}
                              className="w-16 bg-gray-50 border border-gray-200 rounded-lg p-1 text-center font-bold text-gray-800 focus:outline-none focus:ring-1 focus:ring-[#1e7e34]"
                            />
                          </td>
                          <td className="p-4">
                            <button
                              onClick={async () => {
                                const updated = { ...prod, is_available: !prod.is_available };
                                await dbService.updateProduct(updated);
                                loadAllData();
                              }}
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full transition-colors ${prod.is_available && prod.stock > 0
                                  ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                  : 'bg-red-100 text-red-700 hover:bg-red-200'
                                }`}
                            >
                              {prod.is_available && prod.stock > 0 ? 'Active' : 'Inactive'}
                            </button>
                          </td>
                          <td className="p-4">
                            <button
                              onClick={async () => {
                                const updated = { ...prod, is_flash_deal: !prod.is_flash_deal, flash_deal_threshold: prod.is_flash_deal ? 0 : 80 };
                                await dbService.updateProduct(updated);
                                loadAllData();
                              }}
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full transition-colors ${prod.is_flash_deal
                                  ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                                  : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                                }`}
                            >
                              {prod.is_flash_deal ? 'Flash' : 'No'}
                            </button>
                          </td>
                          <td className="p-4 flex items-center justify-center space-x-2">
                            <button
                              onClick={() => {
                                setSelectedProduct(prod);
                                setIsEditOpen(true);
                              }}
                              className="p-1.5 bg-gray-50 text-gray-600 hover:bg-gray-100 hover:text-green-700 rounded-lg transition-colors"
                              title="Edit Details"
                            >
                              <Edit2 size={14} />
                            </button>
                            <button
                              onClick={() => handleDeleteProduct(prod.id)}
                              className="p-1.5 bg-gray-50 text-gray-600 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors"
                              title="Delete Product"
                            >
                              <Trash2 size={14} />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'packing-list' && (
            /* OVERNIGHT PACKING LIST TAB */
            <div className="space-y-4 animate-fade-in max-w-2xl">
              <div className="flex justify-between items-center bg-white rounded-2xl border border-gray-100 p-4 shadow-xs">
                <div>
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Operational Summary</h3>
                  <h4 className="text-sm font-extrabold text-gray-900 mt-0.5">Overnight Sourcing Checklist</h4>
                  <p className="text-[10px] text-gray-400">Aggregated quantities from all pending/packing orders to fetch before morning 5:00 AM.</p>
                </div>
                <button
                  onClick={() => window.print()}
                  className="flex items-center space-x-1.5 border border-gray-200 hover:border-[#1e7e34] bg-white hover:bg-[#1e7e34]/5 text-gray-700 hover:text-[#1e7e34] font-bold text-xs px-4 py-2.5 rounded-xl transition-all active:scale-95"
                >
                  <Printer size={16} />
                  <span>Print Sheet</span>
                </button>
              </div>

              <div className="bg-white rounded-3xl border border-gray-100 shadow-xs overflow-hidden">
                <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-green-50/20">
                  <div className="flex items-center space-x-2">
                    <ClipboardList className="text-[#1e7e34]" />
                    <span className="text-xs font-bold text-gray-800">Packing Items ({packingList.length})</span>
                  </div>
                  <span className="text-[9px] bg-[#1e7e34] text-white font-extrabold px-2.5 py-0.5 rounded-full uppercase">
                    Harvest Guide
                  </span>
                </div>

                {packingList.length === 0 ? (
                  <p className="text-xs text-gray-400 p-12 text-center">No items to pack. Put your feet up!</p>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {packingList.map((item, index) => (
                      <div key={index} className="p-4 flex items-center justify-between hover:bg-gray-50/50 transition-colors">
                        <div className="flex items-center space-x-3.5">
                          <input
                            type="checkbox"
                            className="w-4.5 h-4.5 border-gray-300 text-[#1e7e34] focus:ring-[#1e7e34] rounded cursor-pointer"
                          />
                          <span className="text-xs font-bold text-gray-800">{item.product_name}</span>
                        </div>
                        <span className="text-xs font-extrabold bg-[#1e7e34]/10 text-[#1e7e34] px-3.5 py-1 rounded-xl">
                          {item.quantity} units ({item.unit})
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'billing' && (
            /* BILLING CONFIG & COUPONS TAB */
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-fade-in text-xs text-gray-700">

              {/* Left Column: Billing Settings (Span 5) */}
              <div className="lg:col-span-5 space-y-6">
                <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-xs space-y-5">
                  <div className="border-b border-gray-100 pb-3 flex items-center space-x-2">
                    <div className="p-2 bg-green-50 text-[#1e7e34] rounded-xl">
                      <Settings size={18} />
                    </div>
                    <div>
                      <h3 className="text-sm font-extrabold text-gray-950 uppercase tracking-wider">Billing Settings</h3>
                      <p className="text-[10px] text-gray-400">Manage delivery, platform, and tax fees</p>
                    </div>
                  </div>

                  <form onSubmit={handleSaveBillingConfig} className="space-y-5">
                    {/* Delivery Fee Section */}
                    <div className="space-y-3.5 p-4 bg-gray-50/50 rounded-2xl border border-gray-100">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-gray-800 flex items-center space-x-1.5">
                          <span>Delivery Fee Settings</span>
                        </span>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={billingConfig.delivery_fee_enabled}
                            onChange={(e) => setBillingConfig({ ...billingConfig, delivery_fee_enabled: e.target.checked })}
                            className="sr-only peer"
                          />
                          <div className="w-8 h-4.5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-[#1e7e34]"></div>
                        </label>
                      </div>

                      {billingConfig.delivery_fee_enabled && (
                        <div className="grid grid-cols-2 gap-4 pt-1 animate-fade-in">
                          <div className="space-y-1">
                            <label className="block text-[10px] font-bold text-gray-400 uppercase">Fee Amount (₹)</label>
                            <input
                              type="number"
                              min="0"
                              value={billingConfig.delivery_fee}
                              onChange={(e) => setBillingConfig({ ...billingConfig, delivery_fee: parseFloat(e.target.value) || 0 })}
                              className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-800 font-bold focus:ring-1 focus:ring-[#1e7e34] focus:outline-none"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="block text-[10px] font-bold text-gray-400 uppercase">Free Threshold (₹)</label>
                            <input
                              type="number"
                              min="0"
                              value={billingConfig.delivery_free_threshold}
                              onChange={(e) => setBillingConfig({ ...billingConfig, delivery_free_threshold: parseFloat(e.target.value) || 0 })}
                              className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-800 font-bold focus:ring-1 focus:ring-[#1e7e34] focus:outline-none"
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Platform Fee Section */}
                    <div className="space-y-3.5 p-4 bg-gray-50/50 rounded-2xl border border-gray-100">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-gray-800 flex items-center space-x-1.5">
                          <span>Platform Fee Settings</span>
                        </span>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={billingConfig.platform_fee_enabled}
                            onChange={(e) => setBillingConfig({ ...billingConfig, platform_fee_enabled: e.target.checked })}
                            className="sr-only peer"
                          />
                          <div className="w-8 h-4.5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-[#1e7e34]"></div>
                        </label>
                      </div>

                      {billingConfig.platform_fee_enabled && (
                        <div className="space-y-1 pt-1 animate-fade-in">
                          <label className="block text-[10px] font-bold text-gray-400 uppercase">Fee Amount (₹)</label>
                          <input
                            type="number"
                            min="0"
                            value={billingConfig.platform_fee}
                            onChange={(e) => setBillingConfig({ ...billingConfig, platform_fee: parseFloat(e.target.value) || 0 })}
                            className="w-full max-w-[180px] bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-800 font-bold focus:ring-1 focus:ring-[#1e7e34] focus:outline-none"
                          />
                        </div>
                      )}
                    </div>

                    {/* GST Section */}
                    <div className="space-y-3.5 p-4 bg-gray-50/50 rounded-2xl border border-gray-100">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-gray-800 flex items-center space-x-1.5">
                          <span>GST (Goods & Services Tax)</span>
                        </span>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={billingConfig.gst_enabled}
                            onChange={(e) => setBillingConfig({ ...billingConfig, gst_enabled: e.target.checked })}
                            className="sr-only peer"
                          />
                          <div className="w-8 h-4.5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-[#1e7e34]"></div>
                        </label>
                      </div>

                      {billingConfig.gst_enabled && (
                        <div className="space-y-1 pt-1 animate-fade-in">
                          <label className="block text-[10px] font-bold text-gray-400 uppercase">GST Rate (%)</label>
                          <input
                            type="number"
                            min="0"
                            step="any"
                            value={billingConfig.gst_fee}
                            onChange={(e) => setBillingConfig({ ...billingConfig, gst_fee: parseFloat(e.target.value) || 0 })}
                            className="w-full max-w-[180px] bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-800 font-bold focus:ring-1 focus:ring-[#1e7e34] focus:outline-none"
                          />
                        </div>
                      )}
                    </div>

                    <button
                      type="submit"
                      className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-xl shadow-md text-xs font-bold text-white bg-[#1e7e34] hover:bg-[#155a24] focus:outline-none transition-all cursor-pointer"
                    >
                      Save Billing Settings
                    </button>
                  </form>
                </div>
              </div>

              {/* Right Column: Coupons Settings (Span 7) */}
              <div className="lg:col-span-7 space-y-6">

                {/* Add/Edit Coupon Form */}
                <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-xs space-y-4">
                  <div className="border-b border-gray-100 pb-3 flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="p-2 bg-yellow-50 text-yellow-600 rounded-xl">
                        <Tag size={18} />
                      </div>
                      <div>
                        <h3 className="text-sm font-extrabold text-gray-950 uppercase tracking-wider">
                          {couponForm.id ? 'Edit Coupon' : 'Create New Coupon'}
                        </h3>
                        <p className="text-[10px] text-gray-400">Offer percentage or flat discount incentives</p>
                      </div>
                    </div>
                    {couponForm.id && (
                      <button
                        type="button"
                        onClick={() => setCouponForm({ code: '', discount_type: 'flat', discount_value: 0, min_order_value: 0, is_active: true })}
                        className="text-xs font-bold text-red-600 hover:underline"
                      >
                        Cancel Edit
                      </button>
                    )}
                  </div>

                  <form onSubmit={handleSaveCoupon} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Code */}
                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold text-gray-500 uppercase">Coupon Code</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. FRESH20"
                        value={couponForm.code}
                        onChange={(e) => setCouponForm({ ...couponForm, code: e.target.value.toUpperCase() })}
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-800 font-bold focus:ring-1 focus:ring-[#1e7e34] focus:outline-none px-3 py-2"
                      />
                    </div>

                    {/* Type */}
                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold text-gray-500 uppercase">Discount Type</label>
                      <select
                        value={couponForm.discount_type}
                        onChange={(e) => setCouponForm({ ...couponForm, discount_type: e.target.value as any })}
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-800 font-bold focus:ring-1 focus:ring-[#1e7e34] focus:outline-none px-3 py-2"
                      >
                        <option value="flat">Flat Discount (₹)</option>
                        <option value="percentage">Percentage Off (%)</option>
                      </select>
                    </div>

                    {/* Value */}
                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold text-gray-500 uppercase">Discount Value</label>
                      <input
                        type="number"
                        min="1"
                        required
                        value={couponForm.discount_value || ''}
                        onChange={(e) => setCouponForm({ ...couponForm, discount_value: parseFloat(e.target.value) || 0 })}
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-800 font-bold focus:ring-1 focus:ring-[#1e7e34] focus:outline-none px-3 py-2"
                      />
                    </div>

                    {/* Min Order */}
                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold text-gray-500 uppercase">Min Order Value (₹)</label>
                      <input
                        type="number"
                        min="0"
                        required
                        value={couponForm.min_order_value || ''}
                        onChange={(e) => setCouponForm({ ...couponForm, min_order_value: parseFloat(e.target.value) || 0 })}
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-800 font-bold focus:ring-1 focus:ring-[#1e7e34] focus:outline-none px-3 py-2"
                      />
                    </div>

                    {/* Active Checkbox */}
                    <div className="col-span-1 sm:col-span-2 flex items-center space-x-2 py-1">
                      <input
                        type="checkbox"
                        id="coupon_is_active"
                        checked={couponForm.is_active}
                        onChange={(e) => setCouponForm({ ...couponForm, is_active: e.target.checked })}
                        className="w-4 h-4 text-[#1e7e34] focus:ring-[#1e7e34] border-gray-300 rounded cursor-pointer"
                      />
                      <label htmlFor="coupon_is_active" className="font-bold text-gray-700 cursor-pointer">
                        Make this coupon active immediately
                      </label>
                    </div>

                    <div className="col-span-1 sm:col-span-2">
                      <button
                        type="submit"
                        className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-xl shadow-md text-xs font-bold text-white bg-yellow-500 hover:bg-yellow-600 focus:outline-none transition-all cursor-pointer"
                      >
                        {couponForm.id ? 'Save Changes' : 'Create Coupon'}
                      </button>
                    </div>
                  </form>
                </div>

                {/* Coupons List */}
                <div className="bg-white rounded-3xl border border-gray-100 shadow-xs overflow-hidden">
                  <div className="p-4 border-b border-gray-100 bg-gray-50/50">
                    <h4 className="font-extrabold text-gray-800">Existing Coupons ({coupons.length})</h4>
                  </div>

                  <div className="divide-y divide-gray-100">
                    {coupons.length === 0 ? (
                      <p className="text-[11px] text-gray-400 p-8 text-center">No coupon offers registered yet.</p>
                    ) : (
                      coupons.map((coupon) => (
                        <div key={coupon.id} className="p-4 flex items-center justify-between hover:bg-gray-50/40 transition-colors">
                          <div className="space-y-1">
                            <div className="flex items-center space-x-2">
                              <span className="font-extrabold text-xs text-gray-900 bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-md">
                                {coupon.code}
                              </span>
                              <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${coupon.is_active ? 'bg-green-50 text-[#1e7e34]' : 'bg-red-50 text-red-600'
                                }`}>
                                {coupon.is_active ? 'Active' : 'Disabled'}
                              </span>
                            </div>
                            <p className="text-[10px] text-gray-500 font-medium">
                              Get {coupon.discount_type === 'percentage' ? `${coupon.discount_value}%` : `₹${coupon.discount_value}`} off on orders above ₹{coupon.min_order_value}
                            </p>
                          </div>

                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => setCouponForm(coupon)}
                              className="p-1.5 bg-gray-50 text-gray-600 hover:bg-gray-100 hover:text-green-700 rounded-lg transition-colors"
                              title="Edit Coupon"
                            >
                              <Edit2 size={13} />
                            </button>
                            <button
                              onClick={() => handleDeleteCoupon(coupon.id)}
                              className="p-1.5 bg-gray-50 text-gray-600 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors"
                              title="Delete Coupon"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'banner' && (() => {
            const currentBanners = billingConfig.discount_banners || (billingConfig.discount_card ? [billingConfig.discount_card] : []);
            return (
              /* BANNER UPLOAD TAB */
              <div className="max-w-2xl mx-auto animate-fade-in text-xs text-gray-700 space-y-6">
                <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-xs space-y-5">
                  <div className="border-b border-gray-100 pb-3 flex items-center space-x-2">
                    <div className="p-2 bg-green-50 text-[#1e7e34] rounded-xl">
                      <Image size={18} />
                    </div>
                    <div>
                      <h3 className="text-sm font-extrabold text-gray-950 uppercase tracking-wider">Promotional Discount Banners</h3>
                      <p className="text-[10px] text-gray-400">Upload and manage homepage promotional banner cards</p>
                    </div>
                  </div>

                  <form onSubmit={handleSaveBannerConfig} className="space-y-5">
                    <div className="space-y-3.5 p-4 bg-gray-50/50 rounded-2xl border border-gray-100">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-gray-800">Banner Image Files ({currentBanners.length})</span>
                        {currentBanners.length > 0 && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              if (window.confirm('Remove all banners?')) {
                                const updatedConfig = {
                                  ...billingConfig,
                                  discount_banners: [],
                                  discount_card: ''
                                };
                                setBillingConfig(updatedConfig);
                                dbService.updateBillingConfig(updatedConfig).catch(err => {
                                  console.error(err);
                                  alert('Failed to save banner settings.');
                                });
                              }
                            }}
                            className="text-red-600 font-bold hover:underline text-[10px]"
                          >
                            Remove All
                          </button>
                        )}
                      </div>

                      <div className="space-y-4">
                        <label className="flex flex-col items-center justify-center border border-dashed border-gray-300 rounded-xl p-6 bg-white hover:bg-gray-50/50 cursor-pointer transition-colors">
                          <Plus size={24} className="text-[#1e7e34] mb-2" />
                          <span className="text-xs font-bold text-gray-600">Add Promotional Banner</span>
                          <span className="text-[10px] text-gray-400 mt-1">PNG, JPG or WEBP formats</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (!file) return;
                              const reader = new FileReader();
                              reader.onload = (event) => {
                                const base64 = event.target?.result as string;
                                const updatedBanners = [...currentBanners, base64];
                                const updatedConfig = {
                                  ...billingConfig,
                                  discount_banners: updatedBanners,
                                  discount_card: updatedBanners[0] || ''
                                };
                                setBillingConfig(updatedConfig);
                                dbService.updateBillingConfig(updatedConfig).catch(err => {
                                  console.error(err);
                                  alert('Failed to save banner settings.');
                                });
                              };
                              reader.readAsDataURL(file);
                            }}
                            className="hidden"
                          />
                        </label>

                        {currentBanners.length > 0 ? (
                          <div className="space-y-2">
                            <span className="block text-[10px] font-bold text-gray-400 uppercase">Uploaded Banners</span>
                            <div className="grid grid-cols-2 gap-4">
                              {currentBanners.map((banner, index) => (
                                <div key={index} className="relative rounded-2xl overflow-hidden border border-gray-200 aspect-[3/1] bg-gray-50 shadow-xs group">
                                  <img
                                    src={banner}
                                    alt={`Banner ${index + 1}`}
                                    className="w-full h-full object-cover"
                                  />
                                  <div className="absolute inset-0 bg-black/45 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-2">
                                    <span className="absolute top-2 left-2 text-white bg-black/60 px-1.5 py-0.5 rounded text-[8px] font-bold">
                                      #{index + 1}
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        if (window.confirm(`Remove Banner #${index + 1}?`)) {
                                          const updatedBanners = currentBanners.filter((_, i) => i !== index);
                                          const updatedConfig = {
                                            ...billingConfig,
                                            discount_banners: updatedBanners,
                                            discount_card: updatedBanners[0] || ''
                                          };
                                          setBillingConfig(updatedConfig);
                                          dbService.updateBillingConfig(updatedConfig).catch(err => {
                                            console.error(err);
                                            alert('Failed to save banner settings.');
                                          });
                                        }
                                      }}
                                      className="p-1.5 bg-red-600 hover:bg-red-700 text-white rounded-full transition-colors shadow-md"
                                      title="Delete Banner"
                                    >
                                      <Trash2 size={14} />
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <div className="p-8 border border-gray-200 rounded-2xl text-center bg-gray-50/30 text-gray-400">
                            No banners uploaded yet. Upload promotional images above.
                          </div>
                        )}
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-xl shadow-md text-xs font-bold text-white bg-[#1e7e34] hover:bg-[#155a24] focus:outline-none transition-all cursor-pointer"
                    >
                      Save Banner Settings
                    </button>
                  </form>
                </div>
              </div>
            );
          })()}

          {activeTab === 'support' && (
            /* CUSTOMER SUPPORT & ADMIN ACCESS TAB */
            <div className="max-w-2xl mx-auto animate-fade-in text-xs text-gray-700 space-y-6">
              <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-xs space-y-5">
                <div className="border-b border-gray-100 pb-3 flex items-center space-x-2">
                  <div className="p-2 bg-green-50 text-[#1e7e34] rounded-xl">
                    <PhoneCall size={18} />
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold text-gray-950 uppercase tracking-wider">Customer Support & Credentials</h3>
                    <p className="text-[10px] text-gray-400">Manage support contact, defaults, and admin logins</p>
                  </div>
                </div>

                <form onSubmit={handleSaveSupportConfig} className="space-y-6">
                  {/* Contact & Delivery Defaults */}
                  <div className="space-y-3.5 p-4 bg-gray-50/50 rounded-2xl border border-gray-100">
                    <span className="font-bold text-gray-800 block">Contact & Delivery Defaults</span>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="block text-[10px] font-bold text-gray-400 uppercase">Support Email</label>
                        <input
                          type="email"
                          required
                          value={billingConfig.support_email || ''}
                          onChange={(e) => setBillingConfig({ ...billingConfig, support_email: e.target.value })}
                          className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-800 font-bold focus:ring-1 focus:ring-[#1e7e34] focus:outline-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="block text-[10px] font-bold text-gray-400 uppercase">Support Phone</label>
                        <input
                          type="text"
                          required
                          value={billingConfig.support_phone || ''}
                          onChange={(e) => setBillingConfig({ ...billingConfig, support_phone: e.target.value })}
                          className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-800 font-bold focus:ring-1 focus:ring-[#1e7e34] focus:outline-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="block text-[10px] font-bold text-gray-400 uppercase">Support Phone Formatted</label>
                        <input
                          type="text"
                          required
                          value={billingConfig.support_phone_formatted || ''}
                          onChange={(e) => setBillingConfig({ ...billingConfig, support_phone_formatted: e.target.value })}
                          className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-800 font-bold focus:ring-1 focus:ring-[#1e7e34] focus:outline-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="block text-[10px] font-bold text-gray-400 uppercase">Delivery Slot</label>
                        <input
                          type="text"
                          required
                          value={billingConfig.delivery_slot || ''}
                          onChange={(e) => setBillingConfig({ ...billingConfig, delivery_slot: e.target.value })}
                          className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-800 font-bold focus:ring-1 focus:ring-[#1e7e34] focus:outline-none"
                        />
                      </div>
                      <div className="space-y-1 col-span-2">
                        <label className="block text-[10px] font-bold text-gray-400 uppercase">Default City / Area</label>
                        <input
                          type="text"
                          required
                          value={billingConfig.default_city || ''}
                          onChange={(e) => setBillingConfig({ ...billingConfig, default_city: e.target.value })}
                          className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-800 font-bold focus:ring-1 focus:ring-[#1e7e34] focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Admin Access Details */}
                  <div className="space-y-3.5 p-4 bg-gray-50/50 rounded-2xl border border-gray-100">
                    <span className="font-bold text-gray-800 block">Admin Access & Profile Credentials</span>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="block text-[10px] font-bold text-gray-400 uppercase">Admin Username</label>
                        <input
                          type="text"
                          required
                          value={billingConfig.admin_username || ''}
                          onChange={(e) => setBillingConfig({ ...billingConfig, admin_username: e.target.value })}
                          className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-800 font-bold focus:ring-1 focus:ring-[#1e7e34] focus:outline-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="block text-[10px] font-bold text-gray-400 uppercase">Admin Password</label>
                        <input
                          type="text"
                          required
                          value={billingConfig.admin_password || ''}
                          onChange={(e) => setBillingConfig({ ...billingConfig, admin_password: e.target.value })}
                          className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-800 font-bold focus:ring-1 focus:ring-[#1e7e34] focus:outline-none"
                        />
                      </div>
                      <div className="space-y-1 col-span-2">
                        <label className="block text-[10px] font-bold text-gray-400 uppercase">Admin Profile Name</label>
                        <input
                          type="text"
                          required
                          value={billingConfig.admin_name || ''}
                          onChange={(e) => setBillingConfig({ ...billingConfig, admin_name: e.target.value })}
                          className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-800 font-bold focus:ring-1 focus:ring-[#1e7e34] focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-xl shadow-md text-xs font-bold text-white bg-[#1e7e34] hover:bg-[#155a24] focus:outline-none transition-all cursor-pointer"
                  >
                    Save Support & Access Settings
                  </button>
                </form>
              </div>
            </div>
          )}

          {activeTab === 'flash-sales' && (
            /* FLASH SALES MANAGER TAB */
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-fade-in text-xs text-gray-700">

              {/* Left Column: Create Flash Sale (Span 5) */}
              <div className="lg:col-span-5 space-y-6">
                <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-xs space-y-5">
                  <div className="border-b border-gray-100 pb-3 flex items-center space-x-2">
                    <div className="p-2 bg-yellow-50 text-yellow-600 rounded-xl">
                      <Sparkles size={18} />
                    </div>
                    <div>
                      <h3 className="text-sm font-extrabold text-gray-950 uppercase tracking-wider">Launch Flash Sale</h3>
                      <p className="text-[10px] text-gray-400">Set seted promotional prices with thresholds</p>
                    </div>
                  </div>

                  <form onSubmit={handleSaveFlashSale} className="space-y-4">
                    {/* Select Product */}
                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold text-gray-500 uppercase">Select Catalog Item</label>
                      <select
                        value={flashSaleForm.product_id}
                        onChange={(e) => {
                          const pId = e.target.value;
                          const selectedProd = products.find(p => p.id === pId);
                          setFlashSaleForm({
                            ...flashSaleForm,
                            product_id: pId,
                            flash_price: selectedProd ? selectedProd.price : 0
                          });
                        }}
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-800 font-bold focus:ring-1 focus:ring-[#1e7e34] focus:outline-none px-3 py-2.5"
                      >
                        <option value="">-- Select Product --</option>
                        {products
                          .filter(p => !p.is_flash_deal && p.is_available)
                          .map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name} ({p.category}) - Current: ₹{p.price}
                            </option>
                          ))
                        }
                      </select>
                    </div>

                    {/* Price Snapshot */}
                    {flashSaleForm.product_id && (
                      <div className="grid grid-cols-2 gap-4 p-3 bg-green-55/10 rounded-2xl border border-green-100/50">
                        <div>
                          <span className="text-gray-400 text-[9px] block uppercase font-bold">Catalog Price:</span>
                          <span className="font-extrabold text-gray-900 text-sm">
                            ₹{products.find(p => p.id === flashSaleForm.product_id)?.price}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-400 text-[9px] block uppercase font-bold">Market MRP:</span>
                          <span className="font-semibold text-gray-400 text-sm line-through">
                            ₹{products.find(p => p.id === flashSaleForm.product_id)?.mrp}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Flash sale Price */}
                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold text-gray-500 uppercase">Flash Sale Price (₹)</label>
                      <input
                        type="number"
                        min="1"
                        required
                        value={flashSaleForm.flash_price || ''}
                        onChange={(e) => setFlashSaleForm({ ...flashSaleForm, flash_price: parseFloat(e.target.value) || 0 })}
                        placeholder="Discounted selling price"
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-800 font-bold focus:ring-1 focus:ring-[#1e7e34] focus:outline-none px-3 py-2.5"
                      />
                    </div>

                    {/* Threshold purchase */}
                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold text-gray-500 uppercase">Min Purchase Threshold (₹)</label>
                      <input
                        type="number"
                        min="0"
                        required
                        value={flashSaleForm.threshold || ''}
                        onChange={(e) => setFlashSaleForm({ ...flashSaleForm, threshold: parseFloat(e.target.value) || 0 })}
                        placeholder="Cart value to claim this price"
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-800 font-bold focus:ring-1 focus:ring-[#1e7e34] focus:outline-none px-3 py-2.5"
                      />
                    </div>

                    {/* Expiry Timer toggle */}
                    <div className="flex items-center space-x-2 py-1">
                      <input
                        type="checkbox"
                        id="flash_has_timer"
                        checked={flashSaleForm.has_timer}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          // If enabling timer, default to 1 hour from now
                          let defaultExpiry = '';
                          if (checked) {
                            const oneHourLater = new Date(Date.now() + 60 * 60 * 1000);
                            defaultExpiry = toLocalDatetimeLocal(oneHourLater.toISOString());
                          }
                          setFlashSaleForm({
                            ...flashSaleForm,
                            has_timer: checked,
                            expiry_time: defaultExpiry
                          });
                        }}
                        className="w-4 h-4 text-[#1e7e34] focus:ring-[#1e7e34] border-gray-300 rounded cursor-pointer"
                      />
                      <label htmlFor="flash_has_timer" className="font-bold text-gray-700 cursor-pointer">
                        Set Expiry Timer
                      </label>
                    </div>

                    {flashSaleForm.has_timer && (
                      <div className="space-y-3 p-3 bg-red-50/20 border border-red-100 rounded-2xl animate-fade-in">
                        <div className="space-y-1">
                          <label className="block text-[10px] font-bold text-gray-500 uppercase">Quick Duration</label>
                          <select
                            onChange={(e) => {
                              const val = e.target.value;
                              if (val === 'custom') return;
                              const minutes = parseInt(val);
                              const futureDate = new Date(Date.now() + minutes * 60 * 1000);
                              setFlashSaleForm({
                                ...flashSaleForm,
                                expiry_time: toLocalDatetimeLocal(futureDate.toISOString())
                              });
                            }}
                            defaultValue="60"
                            className="w-full bg-white border border-gray-200 rounded-xl text-xs text-gray-800 font-bold focus:ring-1 focus:ring-[#1e7e34] focus:outline-none px-3 py-2"
                          >
                            <option value="15">15 Minutes</option>
                            <option value="30">30 Minutes</option>
                            <option value="60">1 Hour</option>
                            <option value="120">2 Hours</option>
                            <option value="360">6 Hours</option>
                            <option value="720">12 Hours</option>
                            <option value="1440">24 Hours</option>
                            <option value="custom">Custom Date & Time</option>
                          </select>
                        </div>

                        <div className="space-y-1">
                          <label className="block text-[10px] font-bold text-gray-500 uppercase">Ends At (Date & Time)</label>
                          <input
                            type="datetime-local"
                            required
                            value={flashSaleForm.expiry_time}
                            onChange={(e) => setFlashSaleForm({ ...flashSaleForm, expiry_time: e.target.value })}
                            className="w-full bg-white border border-gray-200 rounded-xl text-xs text-gray-800 font-bold focus:ring-1 focus:ring-[#1e7e34] focus:outline-none px-3 py-2"
                          />
                        </div>
                      </div>
                    )}

                    <button
                      type="submit"
                      className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-xl shadow-md text-xs font-bold text-white bg-[#1e7e34] hover:bg-[#155a24] focus:outline-none transition-all cursor-pointer"
                    >
                      Set Flash Deal Price
                    </button>
                  </form>
                </div>
              </div>

              {/* Right Column: Active Flash Sales List (Span 7) */}
              <div className="lg:col-span-7 space-y-6">
                <div className="bg-white rounded-3xl border border-gray-100 shadow-xs overflow-hidden">
                  <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
                    <h4 className="font-extrabold text-gray-800">Active Flash Deals ({products.filter(p => p.is_flash_deal).length})</h4>
                    <span className="text-[9px] bg-red-100 text-red-700 font-black px-2 py-0.5 rounded-md uppercase tracking-wider">
                      Promo Live
                    </span>
                  </div>

                  <div className="divide-y divide-gray-100">
                    {products.filter(p => p.is_flash_deal).length === 0 ? (
                      <p className="text-[11px] text-gray-400 p-8 text-center">No active flash sale products right now.</p>
                    ) : (
                      products
                        .filter(p => p.is_flash_deal)
                        .map((prod) => (
                          <div key={prod.id} className="p-4 flex items-center justify-between hover:bg-gray-50/40 transition-colors">
                            <div className="flex items-center space-x-3.5">
                              <img
                                src={prod.image_url}
                                alt={prod.name}
                                className="w-12 h-12 object-cover rounded-xl bg-gray-50 border border-gray-100 shrink-0"
                              />
                              <div className="space-y-1">
                                <h4 className="font-extrabold text-xs text-gray-900">{prod.name}</h4>
                                <p className="text-[10px] text-gray-500 font-medium">
                                  MRP: <span className="line-through">₹{prod.mrp}</span> |
                                  Flash Sale Price: <span className="font-bold text-[#1e7e34]">₹{prod.price}</span>
                                </p>
                                <div className="flex items-center space-x-1.5 flex-wrap gap-1">
                                  <span className="text-[9px] bg-yellow-50 text-yellow-800 border border-yellow-100 font-extrabold px-2 py-0.2 rounded-md">
                                    Min Purchase Required: ₹{prod.flash_deal_threshold}
                                  </span>
                                  {prod.flash_deal_end_time && (
                                    <span className="text-[9px] bg-red-50 text-red-800 border border-red-100 font-extrabold px-2 py-0.2 rounded-md">
                                      ⏰ Ends: {new Date(prod.flash_deal_end_time).toLocaleString()}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => {
                                  setFlashSaleForm({
                                    product_id: prod.id,
                                    flash_price: prod.price,
                                    threshold: prod.flash_deal_threshold || 199,
                                    has_timer: !!prod.flash_deal_end_time,
                                    expiry_time: toLocalDatetimeLocal(prod.flash_deal_end_time)
                                  });
                                }}
                                className="p-1.5 bg-gray-50 text-gray-600 hover:bg-gray-150 hover:text-green-700 rounded-lg transition-colors"
                                title="Edit Deal"
                              >
                                <Edit2 size={13} />
                              </button>
                              <button
                                onClick={() => handleEndFlashSale(prod.id)}
                                className="p-2 border border-red-200 bg-red-50/50 hover:bg-red-55 text-red-600 hover:text-red-75 font-bold text-[10px] rounded-xl transition-all cursor-pointer"
                              >
                                End Deal
                              </button>
                            </div>
                          </div>
                        ))
                    )}
                  </div>
                </div>
              </div>

            </div>
          )}

        </div>
      </div>

      {/* ========================================================== */}
      {/* MODAL WINDOWS                                              */}
      {/* ========================================================== */}

      {/* A. VIEW ORDER ITEMS MODAL */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 overflow-hidden flex items-center justify-center">
          <div onClick={() => setSelectedOrder(null)} className="absolute inset-0 bg-black/60 backdrop-blur-xs" />
          <div className="relative bg-white w-full max-w-md rounded-3xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden animate-scale-up border border-gray-100">
            <div className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-extrabold text-gray-900">Order Details</h3>
                <p className="text-[10px] text-[#1e7e34] font-semibold">ID: #{selectedOrder.id}</p>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="p-1 hover:bg-gray-100 text-gray-400 hover:text-gray-700 rounded-full"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {/* Address details */}
              <div className="bg-gray-50 rounded-2xl p-4 text-xs space-y-1">
                <span className="text-[9px] text-gray-400 font-extrabold uppercase block tracking-wider">Delivery Destination</span>
                {(() => {
                  const { address, phone } = getAddressAndPhone(selectedOrder.delivery_address);
                  return (
                    <div className="space-y-1.5">
                      <p className="text-gray-800 font-semibold leading-relaxed whitespace-normal break-words">{address}</p>
                      {phone && (
                        <div className="mt-1">
                          <span className="inline-block text-[10px] bg-green-50 text-[#1e7e34] border border-green-100 font-extrabold px-2.5 py-0.5 rounded-md">
                            📞 {phone}
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })()}
                {selectedOrder.delivery_instructions && (
                  <p className="text-[10px] text-gray-500 italic mt-2">Instruction: "{selectedOrder.delivery_instructions}"</p>
                )}
                {selectedOrder.ring_doorbell && (
                  <span className="inline-block bg-blue-100 text-blue-800 text-[8px] font-bold px-2 py-0.5 rounded-full mt-1.5">
                    Ring Doorbell requested 🔔
                  </span>
                )}
              </div>

              {/* Items listing */}
              <div className="space-y-2">
                <span className="text-[9px] text-gray-400 font-extrabold uppercase block tracking-wider pl-1">Items Checklist</span>
                <div className="bg-white border border-gray-100 rounded-2xl divide-y divide-gray-100">
                  {selectedOrder.items?.map((item) => (
                    <div key={item.id} className="p-3 flex items-center justify-between text-xs">
                      <div>
                        <h4 className="font-bold text-gray-800">{item.product_name}</h4>
                        <p className="text-[10px] text-gray-400">Price: ₹{item.price}</p>
                      </div>
                      <span className="font-extrabold text-[#1e7e34] bg-green-50 px-3 py-1 rounded-xl">
                        Qty: {item.quantity}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Final calculation */}
              <div className="border-t border-gray-100 pt-3 space-y-1.5 text-xs">
                <div className="flex justify-between text-gray-500">
                  <span>Subtotal</span>
                  <span>₹{selectedOrder.total_amount}</span>
                </div>
                <div className="flex justify-between text-gray-500">
                  <span>Fees (Deliv + Plat)</span>
                  <span>₹{selectedOrder.delivery_fee + selectedOrder.platform_fee}</span>
                </div>
                <div className="flex justify-between text-gray-900 font-black text-sm pt-1.5 border-t border-gray-50">
                  <span>Total Bill Amount</span>
                  <span className="text-green-700">₹{selectedOrder.final_amount}</span>
                </div>
              </div>
            </div>

            <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-end">
              <button
                onClick={() => setSelectedOrder(null)}
                className="bg-[#1e7e34] hover:bg-[#155a24] text-white font-bold text-xs px-6 py-2.5 rounded-xl transition-all shadow-md active:scale-95"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* B. ADD PRODUCT MODAL */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden flex items-center justify-center">
          <div onClick={() => setIsAddOpen(false)} className="absolute inset-0 bg-black/60 backdrop-blur-xs" />
          <form
            onSubmit={handleSaveProduct}
            className="relative bg-white w-full max-w-lg rounded-3xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden animate-scale-up border border-gray-100"
          >
            <div className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
              <h3 className="text-sm font-extrabold text-gray-900 flex items-center space-x-1.5">
                <Sparkles size={16} className="text-[#1e7e34]" />
                <span>Add Product to Catalog</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsAddOpen(false)}
                className="p-1 hover:bg-gray-100 text-gray-400 hover:text-gray-700 rounded-full"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
              {/* FILE IMPORT COMPONENT (CSV/EXCEL) */}
              <div className="bg-green-50/20 border border-green-100/50 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-2">
                <div>
                  <h4 className="font-extrabold text-gray-800 text-xs">Bulk Import via CSV/Excel</h4>
                  <p className="text-[10px] text-gray-500 mt-0.5">Quickly upload multiple products using a file.</p>
                </div>
                <div className="flex items-center space-x-2 shrink-0">
                  <a
                    href={templateDownloadUrl}
                    download="products_template.csv"
                    className="text-[10px] bg-white border border-gray-200 text-gray-700 font-bold px-3 py-2 rounded-xl hover:bg-gray-50 transition-colors shadow-xs"
                  >
                    Get Template
                  </a>
                  <label className="text-[10px] bg-[#1e7e34] hover:bg-[#155a24] text-white font-bold px-3.5 py-2 rounded-xl transition-all shadow-md cursor-pointer active:scale-95">
                    <span>Upload File</span>
                    <input
                      type="file"
                      accept=".csv,.xlsx,.xls"
                      onChange={handleFileImport}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              <div className="flex items-center space-x-3 my-2 text-gray-400">
                <hr className="flex-1 border-gray-100" />
                <span className="text-[9px] font-extrabold uppercase tracking-wider">Or Add Manually</span>
                <hr className="flex-1 border-gray-100" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Product Name */}
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-gray-500 uppercase">Product Name</label>
                  <input
                    type="text"
                    required
                    value={productForm.name}
                    onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                    placeholder="e.g. Zucchini - Yellow"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#1e7e34] text-gray-800 font-semibold"
                  />
                </div>

                {/* Category */}
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-gray-500 uppercase">Category</label>
                  <select
                    value={productForm.category}
                    onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#1e7e34] text-gray-800 font-bold"
                    required
                  >
                    <option value="">-- Select Category --</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.name}>
                        {cat.icon} {cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* MRP */}
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-gray-500 uppercase">Original Price (MRP)</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={productForm.mrp}
                    onChange={(e) => setProductForm({ ...productForm, mrp: parseFloat(e.target.value) || 0 })}
                    placeholder="e.g. 60"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#1e7e34] text-gray-800 font-semibold"
                  />
                </div>

                {/* Selling Price */}
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-gray-500 uppercase">Our Selling Price</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={productForm.price}
                    onChange={(e) => setProductForm({ ...productForm, price: parseFloat(e.target.value) || 0 })}
                    placeholder="e.g. 48"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#1e7e34] text-gray-800 font-semibold"
                  />
                </div>

                {/* Unit size */}
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-gray-500 uppercase">Unit Size (Pack size)</label>
                  <input
                    type="text"
                    required
                    value={productForm.unit}
                    onChange={(e) => setProductForm({ ...productForm, unit: e.target.value })}
                    placeholder="e.g. per 500 gm, per 1 kg"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#1e7e34] text-gray-800 font-semibold"
                  />
                </div>

                {/* Weight Range */}
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-gray-500 uppercase">Weight Range (Approx variation)</label>
                  <input
                    type="text"
                    value={productForm.weight_range || ''}
                    onChange={(e) => setProductForm({ ...productForm, weight_range: e.target.value })}
                    placeholder="e.g. (400-600g)"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#1e7e34] text-gray-800 font-semibold"
                  />
                </div>

                {/* Stock levels */}
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-gray-500 uppercase">Stock Yield</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={productForm.stock}
                    onChange={(e) => setProductForm({ ...productForm, stock: parseInt(e.target.value) || 0 })}
                    placeholder="e.g. 20"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#1e7e34] text-gray-800 font-semibold"
                  />
                </div>

                {/* Image Link */}
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-gray-500 uppercase">Image URL (Unsplash/Direct link)</label>
                  <input
                    type="url"
                    value={productForm.image_url}
                    onChange={(e) => setProductForm({ ...productForm, image_url: e.target.value })}
                    placeholder="https://..."
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#1e7e34] text-gray-800 font-semibold"
                  />
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-gray-500 uppercase">About the Product (Freshness & details)</label>
                <textarea
                  value={productForm.description}
                  onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                  placeholder="Tell user about it..."
                  rows={2}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#1e7e34] text-gray-800 font-semibold"
                />
              </div>

              {/* Benefits */}
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-gray-500 uppercase">Nutritional Benefits</label>
                <textarea
                  value={productForm.benefits}
                  onChange={(e) => setProductForm({ ...productForm, benefits: e.target.value })}
                  placeholder="Rich in Vitamin C, boosts health..."
                  rows={2}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#1e7e34] text-gray-800 font-semibold"
                />
              </div>

              {/* Storage */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-gray-500 uppercase">Storage Tips</label>
                  <input
                    type="text"
                    value={productForm.storage_tips || ''}
                    onChange={(e) => setProductForm({ ...productForm, storage_tips: e.target.value })}
                    placeholder="e.g. Refrigerate"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#1e7e34] text-gray-800 font-semibold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-gray-500 uppercase">Shelf Life</label>
                  <input
                    type="text"
                    value={productForm.shelf_life || ''}
                    onChange={(e) => setProductForm({ ...productForm, shelf_life: e.target.value })}
                    placeholder="e.g. 4 days"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#1e7e34] text-gray-800 font-semibold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-gray-500 uppercase">Origin</label>
                  <input
                    type="text"
                    value={productForm.origin || ''}
                    onChange={(e) => setProductForm({ ...productForm, origin: e.target.value })}
                    placeholder="e.g. Local Farms"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#1e7e34] text-gray-800 font-semibold"
                  />
                </div>
              </div>

              {/* Toggles */}
              <div className="flex space-x-6 bg-gray-50 rounded-2xl p-3 border border-gray-100">
                <label className="flex items-center space-x-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={productForm.is_available}
                    onChange={(e) => setProductForm({ ...productForm, is_available: e.target.checked })}
                    className="w-4 h-4 text-[#1e7e34] focus:ring-[#1e7e34] border-gray-300 rounded"
                  />
                  <span className="font-bold text-gray-700">Available in stock</span>
                </label>

                <label className="flex items-center space-x-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={productForm.is_flash_deal}
                    onChange={(e) => setProductForm({ ...productForm, is_flash_deal: e.target.checked, flash_deal_threshold: e.target.checked ? 80 : 0 })}
                    className="w-4 h-4 text-[#1e7e34] focus:ring-[#1e7e34] border-gray-300 rounded"
                  />
                  <span className="font-bold text-gray-700">Set as Flash Deal</span>
                </label>
              </div>

              {productForm.is_flash_deal && (
                <div className="grid grid-cols-2 gap-4 p-3.5 bg-yellow-50/20 border border-yellow-100/50 rounded-2xl animate-fade-in">
                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-gray-500 uppercase">Min Purchase Threshold (₹)</label>
                    <input
                      type="number"
                      min="0"
                      value={productForm.flash_deal_threshold || 0}
                      onChange={(e) => setProductForm({ ...productForm, flash_deal_threshold: parseFloat(e.target.value) || 0 })}
                      className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-800 font-semibold focus:ring-1 focus:ring-[#1e7e34] focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-gray-500 uppercase">Expiry Time (Ends At)</label>
                    <input
                      type="datetime-local"
                      value={toLocalDatetimeLocal(productForm.flash_deal_end_time)}
                      onChange={(e) => setProductForm({ ...productForm, flash_deal_end_time: e.target.value ? new Date(e.target.value).toISOString() : '' })}
                      className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-800 font-semibold focus:ring-1 focus:ring-[#1e7e34] focus:outline-none"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setIsAddOpen(false)}
                className="bg-white border border-gray-200 text-gray-700 font-bold text-xs px-6 py-2.5 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bg-[#1e7e34] hover:bg-[#155a24] text-white font-bold text-xs px-6 py-2.5 rounded-xl transition-all shadow-md active:scale-95 cursor-pointer"
              >
                Save Product
              </button>
            </div>
          </form>
        </div>
      )}

      {/* C. EDIT PRODUCT MODAL */}
      {isEditOpen && selectedProduct && (
        <div className="fixed inset-0 z-50 overflow-hidden flex items-center justify-center">
          <div onClick={() => { setIsEditOpen(false); setSelectedProduct(null); }} className="absolute inset-0 bg-black/60 backdrop-blur-xs" />
          <form
            onSubmit={handleEditProduct}
            className="relative bg-white w-full max-w-lg rounded-3xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden animate-scale-up border border-gray-100"
          >
            <div className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
              <h3 className="text-sm font-extrabold text-gray-900 flex items-center space-x-1.5">
                <Edit2 size={16} className="text-[#1e7e34]" />
                <span>Edit Product Info</span>
              </h3>
              <button
                type="button"
                onClick={() => { setIsEditOpen(false); setSelectedProduct(null); }}
                className="p-1 hover:bg-gray-100 text-gray-400 hover:text-gray-700 rounded-full"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Product Name */}
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-gray-500 uppercase">Product Name</label>
                  <input
                    type="text"
                    required
                    value={selectedProduct.name}
                    onChange={(e) => setSelectedProduct({ ...selectedProduct, name: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#1e7e34] text-gray-800 font-semibold"
                  />
                </div>

                {/* Category */}
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-gray-500 uppercase">Category</label>
                  <select
                    value={selectedProduct.category}
                    onChange={(e) => setSelectedProduct({ ...selectedProduct, category: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#1e7e34] text-gray-800 font-bold"
                    required
                  >
                    <option value="">-- Select Category --</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.name}>
                        {cat.icon} {cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* MRP */}
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-gray-500 uppercase">Original Price (MRP)</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={selectedProduct.mrp}
                    onChange={(e) => setSelectedProduct({ ...selectedProduct, mrp: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#1e7e34] text-gray-800 font-semibold"
                  />
                </div>

                {/* Selling Price */}
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-gray-500 uppercase">Our Selling Price</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={selectedProduct.price}
                    onChange={(e) => setSelectedProduct({ ...selectedProduct, price: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#1e7e34] text-gray-800 font-semibold"
                  />
                </div>

                {/* Unit size */}
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-gray-500 uppercase">Unit Size (Pack size)</label>
                  <input
                    type="text"
                    required
                    value={selectedProduct.unit}
                    onChange={(e) => setSelectedProduct({ ...selectedProduct, unit: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#1e7e34] text-gray-800 font-semibold"
                  />
                </div>

                {/* Weight Range */}
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-gray-500 uppercase">Weight Range (Approx variation)</label>
                  <input
                    type="text"
                    value={selectedProduct.weight_range || ''}
                    onChange={(e) => setSelectedProduct({ ...selectedProduct, weight_range: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#1e7e34] text-gray-800 font-semibold"
                  />
                </div>

                {/* Stock levels */}
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-gray-500 uppercase">Stock Yield</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={selectedProduct.stock}
                    onChange={(e) => setSelectedProduct({ ...selectedProduct, stock: parseInt(e.target.value) || 0 })}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#1e7e34] text-gray-800 font-semibold"
                  />
                </div>

                {/* Image Link */}
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-gray-500 uppercase">Image URL (Unsplash/Direct link)</label>
                  <input
                    type="url"
                    value={selectedProduct.image_url}
                    onChange={(e) => setSelectedProduct({ ...selectedProduct, image_url: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#1e7e34] text-gray-800 font-semibold"
                  />
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-gray-500 uppercase">About the Product (Freshness & details)</label>
                <textarea
                  value={selectedProduct.description}
                  onChange={(e) => setSelectedProduct({ ...selectedProduct, description: e.target.value })}
                  rows={2}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#1e7e34] text-gray-800 font-semibold"
                />
              </div>

              {/* Benefits */}
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-gray-500 uppercase">Nutritional Benefits</label>
                <textarea
                  value={selectedProduct.benefits}
                  onChange={(e) => setSelectedProduct({ ...selectedProduct, benefits: e.target.value })}
                  rows={2}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#1e7e34] text-gray-800 font-semibold"
                />
              </div>

              {/* Storage */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-gray-500 uppercase">Storage Tips</label>
                  <input
                    type="text"
                    value={selectedProduct.storage_tips || ''}
                    onChange={(e) => setSelectedProduct({ ...selectedProduct, storage_tips: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#1e7e34] text-gray-800 font-semibold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-gray-500 uppercase">Shelf Life</label>
                  <input
                    type="text"
                    value={selectedProduct.shelf_life || ''}
                    onChange={(e) => setSelectedProduct({ ...selectedProduct, shelf_life: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#1e7e34] text-gray-800 font-semibold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-gray-500 uppercase">Origin</label>
                  <input
                    type="text"
                    value={selectedProduct.origin || ''}
                    onChange={(e) => setSelectedProduct({ ...selectedProduct, origin: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#1e7e34] text-gray-800 font-semibold"
                  />
                </div>
              </div>

              {/* Toggles */}
              <div className="flex space-x-6 bg-gray-50 rounded-2xl p-3 border border-gray-100">
                <label className="flex items-center space-x-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedProduct.is_available}
                    onChange={(e) => setSelectedProduct({ ...selectedProduct, is_available: e.target.checked })}
                    className="w-4 h-4 text-[#1e7e34] focus:ring-[#1e7e34] border-gray-300 rounded"
                  />
                  <span className="font-bold text-gray-700">Available in stock</span>
                </label>

                <label className="flex items-center space-x-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedProduct.is_flash_deal}
                    onChange={(e) => setSelectedProduct({ ...selectedProduct, is_flash_deal: e.target.checked })}
                    className="w-4 h-4 text-[#1e7e34] focus:ring-[#1e7e34] border-gray-300 rounded"
                  />
                  <span className="font-bold text-gray-700">Set as Flash Deal</span>
                </label>
              </div>

              {selectedProduct.is_flash_deal && (
                <div className="grid grid-cols-2 gap-4 p-3.5 bg-yellow-50/20 border border-yellow-100/50 rounded-2xl animate-fade-in">
                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-gray-500 uppercase">Min Purchase Threshold (₹)</label>
                    <input
                      type="number"
                      min="0"
                      value={selectedProduct.flash_deal_threshold || 0}
                      onChange={(e) => setSelectedProduct({ ...selectedProduct, flash_deal_threshold: parseFloat(e.target.value) || 0 })}
                      className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-800 font-semibold focus:ring-1 focus:ring-[#1e7e34] focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-gray-500 uppercase">Expiry Time (Ends At)</label>
                    <input
                      type="datetime-local"
                      value={toLocalDatetimeLocal(selectedProduct.flash_deal_end_time)}
                      onChange={(e) => setSelectedProduct({ ...selectedProduct, flash_deal_end_time: e.target.value ? new Date(e.target.value).toISOString() : '' })}
                      className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-800 font-semibold focus:ring-1 focus:ring-[#1e7e34] focus:outline-none"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => { setIsEditOpen(false); setSelectedProduct(null); }}
                className="bg-white border border-gray-200 text-gray-700 font-bold text-xs px-6 py-2.5 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bg-[#1e7e34] hover:bg-[#155a24] text-white font-bold text-xs px-6 py-2.5 rounded-xl transition-all shadow-md active:scale-95 cursor-pointer"
              >
                Save Changes
              </button>
            </div>
          </form>
        </div>
      )}

      {/* D. MANAGE CATEGORIES MODAL */}
      {isManageCategoriesOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden flex items-center justify-center">
          <div onClick={() => { setIsManageCategoriesOpen(false); setEditingCategory(null); setCategoryForm({ name: '', icon: '', image: '' }); }} className="absolute inset-0 bg-black/60 backdrop-blur-xs" />
          <div className="relative bg-white w-full max-w-lg rounded-3xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden animate-scale-up border border-gray-100">
            <div className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
              <h3 className="text-sm font-extrabold text-gray-900 flex items-center space-x-1.5">
                <FolderPlus size={16} className="text-[#1e7e34]" />
                <span>{editingCategory ? 'Edit Category' : 'Manage Categories'}</span>
              </h3>
              <button
                type="button"
                onClick={() => { setIsManageCategoriesOpen(false); setEditingCategory(null); setCategoryForm({ name: '', icon: '', image: '' }); }}
                className="p-1 hover:bg-gray-100 text-gray-400 hover:text-gray-700 rounded-full"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs text-gray-700">
              {/* Form to Add/Edit Category */}
              <form onSubmit={handleSaveCategory} className="bg-gray-50 border border-gray-150 rounded-2xl p-4 space-y-4">
                <h4 className="font-extrabold text-gray-800 text-xs">
                  {editingCategory ? 'Modify Category Details' : 'Create Custom Category'}
                </h4>
                <div className="grid grid-cols-3 gap-4">
                  {/* Category Name */}
                  <div className="col-span-2 space-y-1">
                    <label className="block text-[10px] font-bold text-gray-500 uppercase">Category Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Exotic Fruits"
                      value={categoryForm.name}
                      onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                      className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#1e7e34] text-gray-800 font-semibold"
                    />
                  </div>
                  {/* Category Icon */}
                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-gray-500 uppercase">Icon (Emoji)</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 🥭"
                      maxLength={4}
                      value={categoryForm.icon}
                      onChange={(e) => setCategoryForm({ ...categoryForm, icon: e.target.value })}
                      className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#1e7e34] text-gray-800 font-semibold text-center text-lg"
                    />
                  </div>
                </div>

                {/* Category Background Image */}
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-gray-500 uppercase">Category Background Image</label>
                  <div className="flex items-center space-x-3">
                    <label className="flex-1 flex flex-col items-center justify-center border border-dashed border-gray-300 rounded-xl p-3 bg-white hover:bg-gray-50/50 cursor-pointer transition-colors">
                      <span className="text-[10px] font-bold text-gray-600">Click to Upload Category Image</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          const reader = new FileReader();
                          reader.onload = (event) => {
                            const base64 = event.target?.result as string;
                            setCategoryForm({ ...categoryForm, image: base64 });
                          };
                          reader.readAsDataURL(file);
                        }}
                        className="hidden"
                      />
                    </label>
                    {categoryForm.image && (
                      <div className="relative w-16 h-12 rounded-xl overflow-hidden border border-gray-200 bg-gray-50 shrink-0">
                        <img
                          src={categoryForm.image}
                          alt="Category Preview"
                          className="w-full h-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => setCategoryForm({ ...categoryForm, image: '' })}
                          className="absolute inset-0 bg-black/40 hover:bg-black/60 flex items-center justify-center text-white text-[9px] font-bold transition-colors"
                        >
                          Remove
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex justify-end space-x-2 pt-1">
                  {editingCategory && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingCategory(null);
                        setCategoryForm({ name: '', icon: '', image: '' });
                      }}
                      className="bg-white border border-gray-200 text-gray-700 font-bold px-4 py-2 rounded-xl hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                  )}
                  <button
                    type="submit"
                    className="bg-[#1e7e34] hover:bg-[#155a24] text-white font-bold px-4 py-2 rounded-xl transition-all shadow-md active:scale-95 cursor-pointer"
                  >
                    {editingCategory ? 'Update' : 'Create Category'}
                  </button>
                </div>
              </form>

              {/* List of categories */}
              <div className="space-y-2">
                <span className="text-[9px] text-gray-400 font-extrabold uppercase block tracking-wider pl-1">Registered Categories ({categories.length})</span>
                <div className="bg-white border border-gray-100 rounded-2xl divide-y divide-gray-100">
                  {categories.length === 0 ? (
                    <p className="text-[11px] text-gray-400 p-8 text-center">No categories registered yet.</p>
                  ) : (
                    categories.map((cat) => (
                      <div key={cat.id} className="p-3 flex items-center justify-between hover:bg-gray-50/40 transition-colors">
                        <div className="flex items-center space-x-3">
                          {cat.image ? (
                            <img src={cat.image} alt={cat.name} className="w-8 h-8 rounded-lg object-cover border border-gray-100 shrink-0" />
                          ) : (
                            <span className="text-xl w-8 h-8 flex items-center justify-center bg-gray-50 rounded-lg shrink-0">{cat.icon}</span>
                          )}
                          <span className="font-bold text-gray-800">{cat.name}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingCategory(cat);
                              setCategoryForm({ name: cat.name, icon: cat.icon, image: cat.image || '' });
                            }}
                            className="p-1.5 bg-gray-50 text-gray-600 hover:bg-gray-100 hover:text-green-700 rounded-lg transition-colors"
                            title="Edit Category"
                          >
                            <Edit2 size={13} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteCategory(cat.id)}
                            className="p-1.5 bg-gray-50 text-gray-600 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors"
                            title="Delete Category"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-end">
              <button
                type="button"
                onClick={() => { setIsManageCategoriesOpen(false); setEditingCategory(null); setCategoryForm({ name: '', icon: '', image: '' }); }}
                className="bg-white border border-gray-200 text-gray-700 font-bold text-xs px-6 py-2.5 rounded-xl hover:bg-gray-50 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Global Custom Centered Alert */}
      {customAlert && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 text-xs text-gray-700">
          <div onClick={() => setCustomAlert(null)} className="absolute inset-0 bg-black/60 backdrop-blur-xs" />
          <div className="relative bg-white w-full max-w-sm rounded-3xl shadow-2xl border border-gray-100 p-6 flex flex-col items-center text-center animate-scale-up">
            <div className="w-12 h-12 rounded-full bg-green-50 text-green-700 flex items-center justify-center mb-3">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 111.084-1.083l-.042.02a.75.75 0 01-1.084 1.083zM12 15.75h.008v.008H12v-.008zM21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-sm font-extrabold text-gray-900 mb-2">Notification</h3>
            <p className="text-xs text-gray-600 font-semibold leading-relaxed mb-5">{customAlert}</p>
            <button
              onClick={() => setCustomAlert(null)}
              className="w-full bg-[#1e7e34] hover:bg-[#155a24] text-white font-bold text-xs py-2.5 rounded-xl transition-all shadow-md active:scale-95 cursor-pointer"
            >
              Okay
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
