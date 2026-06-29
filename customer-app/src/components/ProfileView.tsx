'use client';

import React, { useState, useEffect } from 'react';
import { User, Phone, ShoppingBag, LogOut, PhoneCall, HelpCircle, ShieldAlert, FileText, X, ChevronLeft, ChevronRight, MapPin, Headset, Heart } from 'lucide-react';
import { Order, Address, BillingConfig, dbService, Product } from '../utils/db';
import ProductCard from './ProductCard';

interface ProfileViewProps {
  onRefreshOrdersTrigger: number;
  currentUser: { name: string; phone: string } | null;
  onLogout: () => void;
  billingConfig: BillingConfig;
  addresses: Address[];
  activeAddress: Address | null;
  onAddressSelect: (addr: Address) => void;
  onAddressDelete: (id: string) => void;
  onAddressAdd: () => void;
  setActiveTab?: (tab: any) => void;
  products: Product[];
  favorites: string[];
  onToggleFavorite: (id: string) => void;
  cart: { product: Product; quantity: number }[];
  onAddToCart: (p: Product) => void;
  onRemoveFromCart: (id: string, isFlash?: boolean) => void;
}

export default function ProfileView({
  onRefreshOrdersTrigger,
  currentUser,
  onLogout,
  billingConfig,
  addresses,
  activeAddress,
  onAddressSelect,
  onAddressDelete,
  onAddressAdd,
  setActiveTab,
  products,
  favorites,
  onToggleFavorite,
  cart,
  onAddToCart,
  onRemoveFromCart,
}: ProfileViewProps) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeModal, setActiveModal] = useState<'faqs' | 'privacy' | 'terms' | null>(null);
  const [subView, setSubView] = useState<'orders' | 'support' | 'addresses' | 'profile-details' | 'wishlist' | null>(null);
  const [viewingOrder, setViewingOrder] = useState<Order | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const ordList = await dbService.getOrders();
      if (currentUser) {
        // Filter orders by phone strictly matching the phone number appended at the end of the address
        setOrders(ordList.filter((o: Order) => {
          const match = o.delivery_address.match(/-?\s*(\d{10})$/);
          return match ? match[1] === currentUser.phone : false;
        }));
      } else {
        setOrders(ordList);
      }
    } catch (e) {
      console.error(e);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [onRefreshOrdersTrigger, currentUser]);

  const getStatusColor = (status: Order['delivery_status']) => {
    switch (status) {
      case 'Delivered':
        return 'bg-green-100 text-green-800';
      case 'Cancelled':
        return 'bg-red-100 text-red-800';
      case 'Out for Delivery':
        return 'bg-blue-100 text-blue-800';
      case 'Packing':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleBack = () => {
    setSubView(null);
  };

  const renderContent = () => {
    /* ================= SUBVIEW: ORDER HISTORY ================= */
    if (subView === 'orders') {
      return (
        <div className="mx-auto w-full max-w-screen-sm bg-gray-50 min-h-screen font-sans flex flex-col pb-24">
          {/* Header */}
          <div className="flex items-center px-4 py-3.5 border-b border-gray-100 bg-white sticky top-0 z-10 shadow-3xs">
            <button onClick={handleBack} className="text-gray-600 mr-2 p-1.5 hover:bg-gray-100 rounded-full cursor-pointer">
              <ChevronLeft size={20} />
            </button>
            <h1 className="text-sm font-bold text-gray-800">Order History</h1>
          </div>

          {/* Order History Content */}
          <div className="flex-1 px-4 py-4 space-y-3 overflow-y-auto">
            {isLoading ? (
              <div className="text-center py-10 text-xs text-gray-400">Loading orders...</div>
            ) : orders.length === 0 ? (
              <div className="text-center py-12 text-xs text-gray-400 bg-white border border-gray-100 rounded-2xl p-6">
                No orders placed yet.
              </div>
            ) : (
              orders.map((order) => (
                <div key={order.id} className="bg-white border border-gray-100 rounded-2xl p-4 space-y-2.5 shadow-3xs hover:shadow-xs transition-shadow">
                  <div className="flex items-center justify-between text-xs">
                    <div>
                      <span className="font-extrabold text-gray-900">Order #{order.id}</span>
                      <span className="text-gray-400 ml-2 font-medium">
                        {new Date(order.created_at).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                    <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full ${getStatusColor(order.delivery_status)}`}>
                      {order.delivery_status}
                    </span>
                  </div>

                  {/* Summary of items */}
                  <div className="text-[11px] text-gray-600 font-bold leading-relaxed bg-gray-50/50 p-2.5 rounded-xl border border-gray-100/50">
                    {order.items?.map((item) => `${item.product_name} x${item.quantity}`).join(', ')}
                  </div>

                  <div className="flex justify-between items-center text-xs pt-2.5 border-t border-gray-55">
                    <span className="text-gray-400 font-medium">Payment: {order.payment_method}</span>
                    <div className="flex items-center space-x-2.5">
                      <button
                        type="button"
                        onClick={() => setViewingOrder(order)}
                        className="text-[10px] font-black text-[#1e7e34] bg-green-50 hover:bg-green-100 border border-green-150 px-3 py-1.5 rounded-xl transition-colors cursor-pointer"
                      >
                        View Order
                      </button>
                      <span className="font-extrabold text-[#1e7e34]">Paid: ₹{order.final_amount}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      );
    }

    /* ================= SUBVIEW: SAVED ADDRESSES ================= */
    if (subView === 'addresses') {
      return (
        <div className="mx-auto w-full max-w-screen-sm bg-gray-50 min-h-screen font-sans flex flex-col pb-24">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3.5 border-b border-gray-100 bg-white sticky top-0 z-10 shadow-3xs">
            <div className="flex items-center">
              <button onClick={handleBack} className="text-gray-600 mr-2 p-1.5 hover:bg-gray-100 rounded-full cursor-pointer">
                <ChevronLeft size={20} />
              </button>
              <h1 className="text-sm font-bold text-gray-800">Saved Addresses</h1>
            </div>
            <button
              onClick={onAddressAdd}
              className="text-[#1e7e34] text-xs font-bold hover:underline bg-green-50 px-3 py-1.5 rounded-xl border border-green-100/30 cursor-pointer"
            >
              + Add New
            </button>
          </div>

          {/* Saved Addresses List */}
          <div className="flex-1 px-4 py-4 space-y-3 overflow-y-auto">
            {addresses.length === 0 ? (
              <div className="text-center py-12 text-xs text-gray-400 bg-white border border-gray-100 rounded-2xl p-6">
                No saved addresses found.
              </div>
            ) : (
              addresses.map((addr) => {
                const isActive = activeAddress?.id === addr.id;
                return (
                  <div
                    key={addr.id}
                    onClick={() => {
                      onAddressSelect(addr);
                    }}
                    className={`bg-white border p-4 rounded-2xl flex justify-between items-start cursor-pointer transition-all ${isActive
                      ? 'border-[#1e7e34] shadow-3xs'
                      : 'border-gray-100 hover:border-gray-200'
                      }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center space-x-1.5 flex-wrap gap-y-1">
                        <span className="text-xs font-bold text-gray-800 truncate block max-w-[150px]">{addr.name}</span>
                        {addr.is_default && (
                          <span className="text-[8px] bg-green-50 text-[#1e7e34] px-1.5 py-0.5 rounded-md font-black uppercase">
                            Default
                          </span>
                        )}
                        {isActive && (
                          <span className="text-[8px] bg-[#1e7e34] text-white px-1.5 py-0.5 rounded-md font-black uppercase">
                            Active
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-gray-500 font-bold mt-1.5 leading-normal">
                        {addr.flat_house_no}, {addr.society_name}
                      </p>
                      <p className="text-[10px] text-gray-400 mt-0.5 font-medium">Mobile: {addr.phone}</p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onAddressDelete(addr.id);
                      }}
                      className="text-red-500 hover:text-red-700 font-bold text-[10px] px-2 py-1 rounded-lg hover:bg-red-50 shrink-0 ml-1.5 border border-red-100 cursor-pointer"
                    >
                      Delete
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>
      );
    }

    /* ================= SUBVIEW: WISHLIST ================= */
    if (subView === 'wishlist') {
      const wishlistProducts = products.filter(p => favorites.includes(p.id));
      return (
        <div className="mx-auto w-full max-w-screen-sm bg-gray-50 min-h-screen font-sans flex flex-col pb-24 animate-fade-in">
          {/* Header */}
          <div className="flex items-center px-4 py-3.5 border-b border-gray-100 bg-white sticky top-0 z-10 shadow-3xs">
            <button onClick={handleBack} className="text-gray-600 mr-2 p-1.5 hover:bg-gray-100 rounded-full cursor-pointer">
              <ChevronLeft size={20} />
            </button>
            <h1 className="text-sm font-bold text-gray-800">My Wishlist</h1>
          </div>

          {/* Wishlist Items Content */}
          <div className="flex-1 px-4 py-4 overflow-y-auto">
            {wishlistProducts.length === 0 ? (
              <div className="text-center py-16 text-xs text-gray-400 bg-white border border-gray-100 rounded-2xl p-6 flex flex-col items-center justify-center space-y-3">
                <div className="p-3 bg-rose-50 text-rose-500 rounded-full">
                  <Heart size={24} className="fill-current" />
                </div>
                <p className="font-bold">Your wishlist is empty</p>
                <p className="text-[10px] text-gray-400 max-w-[200px]">Save your favorite items to purchase them easily later.</p>
                <button
                  onClick={() => {
                    setSubView(null);
                    setActiveTab && setActiveTab('home');
                  }}
                  className="mt-2 bg-[#1e7e34] text-white px-4 py-2 rounded-xl text-xs font-bold shadow-xs hover:bg-[#155a24] active:scale-95 transition-all cursor-pointer"
                >
                  Explore Products
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3.5">
                {wishlistProducts.map((product) => {
                  const inCartItem = cart.find(c => c.product.id === product.id && !c.product.is_flash_deal);
                  const qty = inCartItem ? inCartItem.quantity : 0;
                  return (
                    <ProductCard
                      key={product.id}
                      product={product}
                      quantityInCart={qty}
                      onAddToCart={onAddToCart}
                      onRemoveFromCart={onRemoveFromCart}
                      onProductClick={() => { }}
                      isFavorite={true}
                      onToggleFavorite={onToggleFavorite}
                    />
                  );
                })}
              </div>
            )}
          </div>
        </div>
      );
    }

    /* ================= SUBVIEW: CUSTOMER SUPPORT ================= */
    if (subView === 'support') {
      return (
        <div className="mx-auto w-full max-w-screen-sm bg-gray-50 min-h-screen font-sans flex flex-col pb-24">
          {/* Header */}
          <div className="flex items-center px-4 py-3.5 border-b border-gray-100 bg-white sticky top-0 z-10 shadow-3xs">
            <button onClick={handleBack} className="text-gray-600 mr-2 p-1.5 hover:bg-gray-100 rounded-full cursor-pointer">
              <ChevronLeft size={20} />
            </button>
            <h1 className="text-sm font-bold text-gray-800">Customer Support</h1>
          </div>

          {/* Support Options */}
          <div className="flex-1 px-4 py-4 space-y-4 overflow-y-auto">
            {/* Quick Call */}
            <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-3xs flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold text-gray-800">Phone Support</h3>
                <p className="text-[10px] text-gray-400 mt-0.5">Call our support agent directly</p>
              </div>
              <a
                href={`tel:${billingConfig.support_phone || '+917732997749'}`}
                className="bg-[#1e7e34] hover:bg-green-800 text-white font-extrabold px-4.5 py-2 rounded-xl text-xs flex items-center space-x-1"
              >
                <PhoneCall size={14} />
                <span>Call Now</span>
              </a>
            </div>

            {/* Quick email */}
            <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-3xs flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold text-gray-800">Email Support</h3>
                <p className="text-[10px] text-gray-400 mt-0.5">Reach out to us via support email</p>
              </div>
              <a
                href={`mailto:${billingConfig.support_email || 'mygeniefarm@gmail.com'}`}
                className="border border-[#1e7e34] text-[#1e7e34] font-extrabold px-4.5 py-2 rounded-xl text-xs"
              >
                Email Us
              </a>
            </div>

            {/* Legal / Policy documents */}
            <div className="bg-white border border-gray-100 rounded-2xl p-2 shadow-3xs divide-y divide-gray-100">
              <button
                onClick={() => setActiveModal('faqs')}
                className="w-full flex items-center justify-between p-3.5 text-xs font-bold text-gray-700 hover:bg-gray-50 transition-colors text-left cursor-pointer"
              >
                <div className="flex items-center space-x-3">
                  <HelpCircle size={16} className="text-[#1e7e34]" />
                  <span>Frequently Asked Questions (FAQs)</span>
                </div>
                <ChevronRight size={14} className="text-gray-400" />
              </button>
              <button
                onClick={() => setActiveModal('privacy')}
                className="w-full flex items-center justify-between p-3.5 text-xs font-bold text-gray-700 hover:bg-gray-50 transition-colors text-left cursor-pointer"
              >
                <div className="flex items-center space-x-3">
                  <ShieldAlert size={16} className="text-[#1e7e34]" />
                  <span>Privacy Policy</span>
                </div>
                <ChevronRight size={14} className="text-gray-400" />
              </button>
              <button
                onClick={() => setActiveModal('terms')}
                className="w-full flex items-center justify-between p-3.5 text-xs font-bold text-gray-700 hover:bg-gray-50 transition-colors text-left cursor-pointer"
              >
                <div className="flex items-center space-x-3">
                  <FileText size={16} className="text-[#1e7e34]" />
                  <span>Terms & Conditions</span>
                </div>
                <ChevronRight size={14} className="text-gray-400" />
              </button>
            </div>
          </div>
        </div>
      );
    }

    /* ================= SUBVIEW: USER INFO ================= */
    if (subView === 'profile-details') {
      return (
        <div className="mx-auto w-full max-w-screen-sm bg-gray-50 min-h-screen font-sans flex flex-col pb-24">
          {/* Header */}
          <div className="flex items-center px-4 py-3.5 border-b border-gray-100 bg-white sticky top-0 z-10 shadow-3xs">
            <button onClick={handleBack} className="text-gray-600 mr-2 p-1.5 hover:bg-gray-100 rounded-full cursor-pointer">
              <ChevronLeft size={20} />
            </button>
            <h1 className="text-sm font-bold text-gray-800">Profile Details</h1>
          </div>

          {/* Profile details */}
          <div className="flex-1 px-4 py-4 space-y-4">
            <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-3xs space-y-4">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-gray-400 uppercase">Your Name</span>
                <p className="text-xs font-extrabold text-gray-800">{currentUser?.name}</p>
              </div>
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-gray-400 uppercase">Mobile Number</span>
                <p className="text-xs font-extrabold text-gray-800">{currentUser?.phone}</p>
              </div>
            </div>
          </div>
        </div>
      );
    }

    /* ================= MAIN SETTINGS MENU ================= */
    return (
      <div className="mx-auto w-full max-w-screen-sm bg-gray-50 min-h-screen font-sans flex flex-col justify-between pb-24">
        <div className="flex-1">
          {/* 1. Header (Settings title with back arrow) */}
          <div className="flex items-center px-4 py-3.5 border-b border-gray-100 bg-white sticky top-0 z-10 shadow-3xs">
            <button
              onClick={() => setActiveTab && setActiveTab('home')}
              className="text-gray-600 mr-2 p-1.5 hover:bg-gray-100 rounded-full cursor-pointer"
            >
              <ChevronLeft size={20} />
            </button>
            <h1 className="text-sm font-bold text-gray-800">Settings</h1>
          </div>

          {/* 2. User Profile Card Row */}
          <div className="px-4 py-6 flex items-center space-x-4 bg-white border-b border-gray-100/50">
            <div className="w-14 h-14 bg-indigo-50 border border-indigo-100 rounded-full flex items-center justify-center text-indigo-500 shrink-0">
              <User size={28} className="stroke-[1.5px]" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-gray-800 leading-tight">
                {currentUser?.name || 'Guest User'}
              </h2>
              <p className="text-[11px] text-gray-400 mt-1 font-semibold">
                {currentUser?.phone || 'No Mobile Number'}
              </p>
            </div>
          </div>

          {/* 3. Settings Options List */}
          <div className="px-4 mt-6">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-3xs divide-y divide-gray-100 overflow-hidden">
              {[
                { id: 'orders' as const, label: 'Orders', icon: ShoppingBag },
                { id: 'wishlist' as const, label: 'Wishlist', icon: Heart },
                { id: 'support' as const, label: 'Customer Support', icon: Headset },
                { id: 'addresses' as const, label: 'Saved Addresses', icon: MapPin },
                { id: 'profile-details' as const, label: 'Profile', icon: User },
              ].map((option) => {
                const Icon = option.icon;
                return (
                  <button
                    key={option.id}
                    onClick={() => setSubView(option.id)}
                    className="w-full flex items-center justify-between p-4 hover:bg-gray-50/50 transition-colors text-left cursor-pointer"
                  >
                    <div className="flex items-center space-x-3.5 text-xs font-bold text-gray-700">
                      <Icon size={18} className="text-[#1e7e34] stroke-[1.8px]" />
                      <span>{option.label}</span>
                    </div>
                    <ChevronRight size={16} className="text-gray-400" />
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* 4. Log Out button at the bottom */}
        <div className="px-4 py-6 flex flex-col items-center space-y-4 shrink-0">
          <button
            onClick={onLogout}
            className="border border-red-200 hover:border-red-300 text-red-500 hover:bg-red-50/10 px-8 py-2.5 rounded-xl text-xs font-bold bg-white active:scale-95 transition-all shadow-3xs cursor-pointer"
          >
            Log Out
          </button>

          <span className="text-[11px] text-gray-400 font-extrabold tracking-wider uppercase select-none">
            geniefarm
          </span>
        </div>
      </div>
    );
  };

  return (
    <>
      {renderContent()}

      {/* FAQs / Policies Modals */}
      {activeModal && (
        <div className="fixed inset-0 z-[100] overflow-hidden flex items-center justify-center">
          <div onClick={() => setActiveModal(null)} className="absolute inset-0 bg-black/60 backdrop-blur-xs" />
          <div className="relative bg-white w-full max-w-md rounded-3xl shadow-2xl flex flex-col max-h-[80vh] overflow-hidden border border-gray-100 animate-scale-up text-xs text-gray-700">
            {/* Modal Header */}
            <div className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between shrink-0">
              <h3 className="text-sm font-extrabold text-gray-900 capitalize">
                {activeModal === 'faqs' ? 'Frequently Asked Questions' : activeModal.replace('_', ' ')}
              </h3>
              <button
                onClick={() => setActiveModal(null)}
                className="p-1 hover:bg-gray-100 text-gray-400 hover:text-gray-700 rounded-full"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {activeModal === 'faqs' && (
                <div className="space-y-4 font-semibold">
                  <div className="space-y-1">
                    <h4 className="font-extrabold text-gray-950">Q: How does the delivery work?</h4>
                    <p className="text-gray-500 leading-relaxed font-semibold">A: We deliver all orders farm-fresh next morning between {billingConfig.delivery_slot || '6 AM - 8 AM'}.</p>
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-extrabold text-gray-950">Q: Is there a delivery fee?</h4>
                    <p className="text-gray-500 leading-relaxed font-semibold">A: Delivery is FREE for orders above ₹{billingConfig.delivery_free_threshold || 199} threshold. Below this cart amount, a flat ₹{billingConfig.delivery_fee || 15} shipping fee applies.</p>
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-extrabold text-gray-950">Q: What is your refund policy?</h4>
                    <p className="text-gray-500 leading-relaxed font-semibold">A: If you receive damaged or sub-par produce, let us know within 24 hours for a prompt refund directly to your account.</p>
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-extrabold text-gray-950">Q: How can I contact customer support?</h4>
                    <p className="text-gray-500 leading-relaxed font-semibold">A: Call us directly at {billingConfig.support_phone_formatted || '+91 7732997749'} or email {billingConfig.support_email || 'mygeniefarm@gmail.com'}. We are here to help!</p>
                  </div>
                </div>
              )}

              {activeModal === 'privacy' && (
                <div className="space-y-3 font-semibold text-gray-500 leading-relaxed">
                  <p>
                    <strong className="text-gray-950 block mb-0.5">1. Information We Collect</strong>
                    We collect your Name, Phone Number, and flat/society address configurations to handle local deliveries.
                  </p>
                  <p>
                    <strong className="text-gray-950 block mb-0.5">2. Security and Data Protection</strong>
                    Your credentials and order list are saved securely inside our private system and never shared with third-party advertising services.
                  </p>
                  <p>
                    <strong className="text-gray-950 block mb-0.5">3. Cookie Policy</strong>
                    We use standard browser local storage configurations to keep your account session and cart contents loaded across refreshes.
                  </p>
                </div>
              )}

              {activeModal === 'terms' && (
                <div className="space-y-3 font-semibold text-gray-500 leading-relaxed">
                  <p>
                    <strong className="text-gray-950 block mb-0.5">1. Ordering Deadlines</strong>
                    Orders placed before 10:00 PM are guaranteed for harvesting and delivery early next morning ({billingConfig.delivery_slot || '6 AM - 8 AM'}).
                  </p>
                  <p>
                    <strong className="text-gray-950 block mb-0.5">2. Billing Configuration</strong>
                    Pricing includes all local tax rates. Applicable platform service fees are shown transparently before checkout completion.
                  </p>
                  <p>
                    <strong className="text-gray-950 block mb-0.5">3. Out of Stock Replacements</strong>
                    As we source produce fresh from local farm harvests, crop yield changes may occur. Stale items will be deleted with immediate balance updates.
                  </p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-end">
              <button
                onClick={() => setActiveModal(null)}
                className="bg-[#1e7e34] hover:bg-[#155a24] text-white font-bold text-xs px-6 py-2.5 rounded-xl transition-all shadow-md active:scale-95"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* D. VIEW ORDER ITEMS MODAL */}
      {viewingOrder && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 text-xs text-gray-700">
          <div onClick={() => setViewingOrder(null)} className="absolute inset-0 bg-black/60 backdrop-blur-xs" />
          <div className="relative bg-white w-full max-w-sm rounded-3xl shadow-2xl flex flex-col max-h-[80vh] overflow-hidden animate-scale-up border border-gray-100">
            {/* Modal Header */}
            <div className="bg-[#1e7e34] text-white px-6 py-4 flex items-center justify-between shadow-sm">
              <div>
                <h3 className="text-sm font-extrabold">Order Summary</h3>
                <p className="text-[10px] text-green-100 font-semibold mt-0.5">ID: #{viewingOrder.id}</p>
              </div>
              <button
                onClick={() => setViewingOrder(null)}
                className="p-1 hover:bg-white/10 rounded-full text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {/* Order Info */}
              <div className="bg-gray-50 rounded-2xl p-3.5 space-y-1.5 border border-gray-100/50">
                <div className="flex justify-between text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                  <span>Status</span>
                  <span>Date & Time</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full ${getStatusColor(viewingOrder.delivery_status)}`}>
                    {viewingOrder.delivery_status}
                  </span>
                  <span className="font-semibold text-gray-800">
                    {new Date(viewingOrder.created_at).toLocaleString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
                <div className="border-t border-gray-200/60 pt-2 text-[10px] font-semibold text-gray-500">
                  <span className="block"><strong>Delivery Slot:</strong> {viewingOrder.delivery_slot}</span>
                  <span className="block mt-0.5"><strong>Payment:</strong> {viewingOrder.payment_method} ({viewingOrder.payment_status})</span>
                </div>
              </div>

              {/* Items List */}
              <div className="space-y-2">
                <span className="text-[9px] text-gray-400 font-extrabold uppercase block tracking-wider pl-1">Items List</span>
                <div className="bg-white border border-gray-100 rounded-2xl divide-y divide-gray-100 overflow-hidden">
                  {viewingOrder.items?.map((item) => {
                    const prod = products.find(p => p.id === item.product_id);
                    return (
                      <div key={item.id} className="p-3 flex items-center justify-between text-xs hover:bg-gray-50/20">
                        <div className="min-w-0 flex-1 pr-3">
                          <h4 className="font-bold text-gray-850 truncate">{item.product_name}</h4>
                          <span className="text-[10px] text-gray-400 font-semibold">
                            ₹{item.price} {prod ? `• ${prod.unit}` : ''}
                          </span>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="font-black text-gray-900">₹{(item.price * item.quantity).toFixed(0)}</div>
                          <div className="text-[9px] text-gray-400 font-bold">Qty: {item.quantity}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Calculation Summary */}
              <div className="border-t border-gray-100 pt-3 space-y-1.5 text-xs font-semibold text-gray-500">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>₹{viewingOrder.total_amount}</span>
                </div>
                {viewingOrder.discount_amount > 0 && (
                  <div className="flex justify-between text-rose-500">
                    <span>Discount Coupon</span>
                    <span>-₹{viewingOrder.discount_amount}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Delivery & Platform Fees</span>
                  <span>₹{viewingOrder.delivery_fee + viewingOrder.platform_fee}</span>
                </div>
                <div className="flex justify-between text-gray-900 font-black text-sm pt-2 border-t border-gray-50">
                  <span>Amount Paid</span>
                  <span className="text-[#1e7e34]">₹{viewingOrder.final_amount}</span>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-end">
              <button
                onClick={() => setViewingOrder(null)}
                className="bg-[#1e7e34] hover:bg-[#155a24] text-white font-bold text-xs px-6 py-2.5 rounded-xl transition-all shadow-md active:scale-95 animate-fade-in"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
