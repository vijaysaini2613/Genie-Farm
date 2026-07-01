'use client';

import React, { useState } from 'react';
import { ShoppingBag, X, Plus, Minus, Tag, MapPin, ArrowRight } from 'lucide-react';
import { Product, BillingConfig, Coupon } from '../utils/db';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: { product: Product; quantity: number }[];
  onAddToCart: (product: Product) => void;
  onRemoveFromCart: (productId: string, isFlash?: boolean) => void;
  onProceedToCheckout: () => void;
  deliveryAddressName: string;
  billingConfig: BillingConfig;
  coupons: Coupon[];
  appliedCoupon: Coupon | null;
  setAppliedCoupon: (coupon: Coupon | null) => void;
}

export default function CartDrawer({
  isOpen,
  onClose,
  cartItems,
  onAddToCart,
  onRemoveFromCart,
  onProceedToCheckout,
  deliveryAddressName,
  billingConfig,
  coupons,
  appliedCoupon,
  setAppliedCoupon,
}: CartDrawerProps) {
  const [couponCode, setCouponCode] = useState('');

  // Sync internal coupon input state with appliedCoupon
  React.useEffect(() => {
    if (appliedCoupon) {
      setCouponCode(appliedCoupon.code);
    } else {
      setCouponCode('');
    }
  }, [appliedCoupon]);

  const subTotal = cartItems.reduce((acc, item) => acc + item.product.price * item.quantity, 0);

  if (!isOpen) return null;
  
  // Dynamic Fee Computations
  const deliveryFee = billingConfig.delivery_fee_enabled 
    ? (subTotal >= billingConfig.delivery_free_threshold || subTotal === 0 ? 0 : billingConfig.delivery_fee)
    : 0;
  
  const platformFee = billingConfig.platform_fee_enabled && subTotal > 0 
    ? billingConfig.platform_fee 
    : 0;

  const targetSubTotal = appliedCoupon?.target_category && appliedCoupon.target_category !== 'All'
    ? cartItems
        .filter(item => item.product.category === appliedCoupon.target_category)
        .reduce((acc, item) => acc + item.product.price * item.quantity, 0)
    : subTotal;

  let discountAmount = 0;
  if (appliedCoupon && subTotal >= appliedCoupon.min_order_value && appliedCoupon.is_active) {
    discountAmount = appliedCoupon.discount_type === 'percentage'
      ? Math.round(targetSubTotal * (appliedCoupon.discount_value / 100))
      : Math.min(targetSubTotal, appliedCoupon.discount_value);
  }

  const gstFee = billingConfig.gst_enabled && subTotal > 0 
    ? parseFloat((Math.max(0, subTotal - discountAmount) * (billingConfig.gst_fee / 100)).toFixed(2))
    : 0;

  const finalAmount = Math.max(0, subTotal - discountAmount + deliveryFee + platformFee + gstFee);

  const applyCoupon = () => {
    const matched = coupons.find(
      (c) => c.code.toUpperCase() === couponCode.trim().toUpperCase() && c.is_active
    );

    if (matched) {
      if (subTotal >= matched.min_order_value) {
        setAppliedCoupon(matched);
      } else {
        alert(`Minimum order value to apply this coupon is ₹${matched.min_order_value}.`);
      }
    } else {
      alert('Invalid or inactive coupon code. Check active coupons in your account.');
    }
  };

  // Find active coupons to show as hints
  const activeCouponsHint = coupons.filter(c => c.is_active);

  return (
    <div className="fixed inset-0 z-50 overflow-hidden font-sans">
      {/* Backdrop */}
      <div 
        onClick={onClose}
        className="absolute inset-0 bg-black/55 backdrop-blur-xs transition-opacity" 
      />

      {/* Sheet */}
      <div className="absolute inset-y-0 right-0 max-w-md w-full bg-gray-50 flex flex-col shadow-2xl animate-slide-in">
        
        {/* Cart Header */}
        <div className="bg-white px-4 py-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-green-50 text-[#1e7e34] rounded-xl">
              <ShoppingBag size={20} />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900">Your Cart</h2>
              <p className="text-xs text-gray-550">{cartItems.length} items selected</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 hover:bg-gray-100 text-gray-400 hover:text-gray-700 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {cartItems.length === 0 ? (
          /* EMPTY CART VIEW */
          <div className="flex-1 flex flex-col items-center justify-center px-6 text-center bg-white">
            <div className="w-44 h-44 bg-green-50/50 rounded-full flex items-center justify-center mb-6">
              <ShoppingBag size={64} className="text-[#1e7e34]/30 stroke-[1.5px]" />
            </div>
            <h3 className="text-lg font-bold text-gray-900">Your cart is empty!</h3>
            <p className="text-sm text-gray-500 mt-2 max-w-xs leading-relaxed">
              Add products to your cart and place your order. You will get a response within a few minutes.
            </p>
            <button
              onClick={onClose}
              className="mt-6 bg-[#1e7e34] hover:bg-[#155a24] text-white font-semibold text-sm px-8 py-3 rounded-xl transition-all shadow-md active:scale-95"
            >
              Continue Shopping
            </button>
          </div>
        ) : (
          /* ACTIVE CART VIEW */
          <>
            {/* Scrollable Container */}
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
              
              {/* Sourcing/Delivery Warning */}
              <div className="bg-green-50/70 border border-green-100 rounded-2xl p-3 flex items-start space-x-2.5">
                <MapPin size={18} className="text-[#1e7e34] shrink-0 mt-0.5" />
                <div className="text-xs text-[#1e7e34] font-medium leading-normal">
                  Delivery scheduled to <span className="font-bold">{deliveryAddressName || 'your selected address'}</span> tomorrow morning between <span className="font-bold">7:00 AM - 9:00 AM</span>.
                </div>
              </div>

              {/* Product List */}
              <div className="bg-white rounded-2xl border border-gray-100 divide-y divide-gray-100 shadow-xs">
                {cartItems.map(({ product, quantity }) => (
                  <div key={`${product.id}-${product.is_flash_deal ? 'flash' : 'regular'}`} className="p-3 flex items-center space-x-3">
                    <img
                      src={product.image_url}
                      alt={product.name}
                      className="w-14 h-14 object-cover rounded-xl bg-gray-50 shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-bold text-gray-900 truncate">
                        {product.name}
                      </h4>
                      <p className="text-[10px] text-gray-400 mt-0.5">
                        {product.unit} {product.weight_range}
                      </p>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className="text-xs font-extrabold text-gray-900">₹{product.price * quantity}</span>
                        {quantity > 1 && (
                          <span className="text-[10px] text-gray-500 font-medium">(₹{product.price} each)</span>
                        )}
                        {product.mrp > product.price && (
                          <span className="text-[10px] text-gray-400 line-through">₹{product.mrp * quantity}</span>
                        )}
                      </div>
                    </div>
                    {/* Add/Remove Controls */}
                    {product.is_flash_deal ? (
                      <button
                        onClick={() => onRemoveFromCart(product.id, true)}
                        className="text-red-500 hover:text-white hover:bg-red-650 font-bold text-[10px] border border-red-200 hover:border-red-600 bg-red-50 px-2.5 py-1.5 rounded-xl transition-all cursor-pointer shadow-xs active:scale-95"
                      >
                        Remove Offer
                      </button>
                    ) : (
                      <div className="flex items-center justify-between border border-[#1e7e34] bg-green-50/50 rounded-lg overflow-hidden py-1 px-1.5 shrink-0">
                        <button
                          onClick={() => onRemoveFromCart(product.id, product.is_flash_deal)}
                          className="p-0.5 hover:bg-[#1e7e34]/10 text-[#1e7e34] rounded transition-colors"
                        >
                          <Minus size={12} className="stroke-[3px]" />
                        </button>
                        <span className="text-xs font-bold text-gray-900 px-2">{quantity}</span>
                        <button
                          onClick={() => onAddToCart(product)}
                          disabled={quantity >= product.stock}
                          className={`p-0.5 text-[#1e7e34] rounded transition-colors ${
                            quantity >= product.stock ? 'opacity-30' : 'hover:bg-[#1e7e34]/10'
                          }`}
                        >
                          <Plus size={12} className="stroke-[3px]" />
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Coupon Field */}
              {activeCouponsHint.length > 0 && (
                <div className="bg-white rounded-2xl border border-gray-100 p-3 shadow-xs">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-gray-800 flex items-center space-x-1.5">
                      <Tag size={16} className="text-yellow-500" />
                      <span>Apply Coupon Code</span>
                    </span>
                    {!!appliedCoupon && (
                      <span className="text-[10px] bg-green-100 text-[#1e7e34] font-bold px-2 py-0.5 rounded-full">
                        Applied
                      </span>
                    )}
                  </div>
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      placeholder="Enter code (e.g. WELCOME10)"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value)}
                      disabled={!!appliedCoupon}
                      className="flex-1 bg-gray-50 border border-gray-100 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-[#1e7e34] disabled:opacity-50 text-gray-800"
                    />
                    <button
                      onClick={applyCoupon}
                      disabled={!!appliedCoupon}
                      className="bg-yellow-400 hover:bg-yellow-500 text-green-950 font-bold text-xs px-4 py-2 rounded-xl transition-colors disabled:opacity-50 active:scale-95 cursor-pointer"
                    >
                      Apply
                    </button>
                  </div>
                  {!appliedCoupon && (
                    <div className="mt-2 space-y-1">
                      <p className="text-[9px] text-gray-400">Available Coupons:</p>
                      {activeCouponsHint.map((cp) => (
                        <div key={cp.id} className="text-[9.5px] text-gray-500">
                          Use <span className="font-bold text-[#1e7e34]">{cp.code}</span> to get{' '}
                          <span className="font-semibold">
                            {cp.discount_type === 'percentage' ? `${cp.discount_value}%` : `₹${cp.discount_value}`} off
                          </span>{' '}
                          (Min order: ₹{cp.min_order_value})
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Bill Details (Dynamically filters/hides inactive or zero value elements) */}
              <div className="bg-white rounded-2xl border border-gray-100 p-3.5 space-y-2.5 shadow-xs">
                <h4 className="text-xs font-bold text-gray-800 border-b border-gray-50 pb-2">
                  Order Summary
                </h4>
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Sub Total</span>
                  <span className="font-semibold text-gray-800">₹{subTotal}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-xs text-green-600">
                    <span>Discount</span>
                    <span className="font-bold">-₹{discountAmount}</span>
                  </div>
                )}
                
                {/* Dynamically Hide Delivery Fee Tag */}
                {billingConfig.delivery_fee_enabled && (deliveryFee > 0 || subTotal > 0) && (
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>Delivery Fee</span>
                    <span className="font-semibold text-gray-800">
                      {deliveryFee > 0 ? `₹${deliveryFee}` : <span className="text-green-600 font-bold">FREE</span>}
                    </span>
                  </div>
                )}

                {/* Dynamically Hide Platform Fee Tag */}
                {billingConfig.platform_fee_enabled && platformFee > 0 && (
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>Platform Fee</span>
                    <span className="font-semibold text-gray-800">₹{platformFee}</span>
                  </div>
                )}

                {/* Dynamically Hide GST Tag */}
                {billingConfig.gst_enabled && gstFee > 0 && (
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>GST ({billingConfig.gst_fee}%)</span>
                    <span className="font-semibold text-gray-800">₹{gstFee}</span>
                  </div>
                )}

                <div className="flex justify-between text-sm font-bold text-gray-900 border-t border-gray-50 pt-2.5">
                  <span>Order Total</span>
                  <span className="text-green-700 text-base">₹{finalAmount}</span>
                </div>
              </div>
            </div>

            {/* Bottom Checkout Action */}
            <div className="bg-white border-t border-gray-100 p-4 pb-20 md:pb-4 shadow-lg">
              <button
                onClick={onProceedToCheckout}
                className="w-full flex items-center justify-between bg-[#1e7e34] hover:bg-[#155a24] text-white font-bold p-3.5 rounded-2xl transition-all shadow-md active:scale-98 group"
              >
                <div className="flex flex-col items-start">
                  <span className="text-[10px] text-green-200">Total payable</span>
                  <span className="text-sm font-extrabold">₹{finalAmount}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <span className="text-sm font-bold">Check Out Now</span>
                  <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                </div>
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
