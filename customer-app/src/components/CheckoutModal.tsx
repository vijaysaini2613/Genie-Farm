'use client';

import React, { useState, useEffect } from 'react';
import { X, MapPin, Truck, CheckCircle2, ArrowRight, BellRing, NotebookPen } from 'lucide-react';
import { Product, Address, BillingConfig, dbService, Coupon } from '../utils/db';
import LoginView from './LoginView';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: { product: Product; quantity: number }[];
  activeAddress: Address | null;
  onOrderSuccess: () => void;
  onOrderPlaced?: () => void;
  onOpenAddressSelector: () => void;
  billingConfig: BillingConfig;
  appliedCoupon: Coupon | null;
  setAppliedCoupon: (coupon: Coupon | null) => void;
  currentUser: { name: string; phone: string } | null;
  onLoginTrigger: (user: { name: string; phone: string }) => void;
}

export default function CheckoutModal({
  isOpen,
  onClose,
  cartItems,
  activeAddress,
  onOrderSuccess,
  onOrderPlaced,
  onOpenAddressSelector,
  billingConfig,
  appliedCoupon,
  setAppliedCoupon,
  currentUser,
  onLoginTrigger,
}: CheckoutModalProps) {
  const [paymentMethod, setPaymentMethod] = useState<'UPI' | 'COD'>('COD');
  const [ringDoorbell, setRingDoorbell] = useState(true);
  const [customInstructions, setCustomInstructions] = useState('');
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [orderSuccessId, setOrderSuccessId] = useState<string | null>(null);
  const [placedItems, setPlacedItems] = useState<{ product: Product; quantity: number }[]>([]);
  const [placedAmount, setPlacedAmount] = useState<number>(0);
  const [societies, setSocieties] = useState<any[]>([]);
  const isSubmittingRef = React.useRef(false);

  // Dynamic Bill Calculations
  const subTotal = cartItems.reduce((acc, item) => acc + item.product.price * item.quantity, 0);

  let discountAmount = 0;
  if (appliedCoupon && subTotal >= appliedCoupon.min_order_value && appliedCoupon.is_active) {
    discountAmount = appliedCoupon.discount_type === 'percentage'
      ? Math.round(subTotal * (appliedCoupon.discount_value / 100))
      : appliedCoupon.discount_value;
  }

  // Re-validate coupon subtotal requirement upon checkout modal open
  useEffect(() => {
    if (isOpen && !orderSuccessId && appliedCoupon && subTotal < appliedCoupon.min_order_value) {
      alert(`Coupon ${appliedCoupon.code} was automatically removed because your order subtotal is below ₹${appliedCoupon.min_order_value}.`);
      setAppliedCoupon(null);
    }
  }, [subTotal, appliedCoupon, isOpen, setAppliedCoupon, orderSuccessId]);
  
  const deliveryFee = billingConfig.delivery_fee_enabled 
    ? (subTotal >= billingConfig.delivery_free_threshold || subTotal === 0 ? 0 : billingConfig.delivery_fee)
    : 0;

  const platformFee = billingConfig.platform_fee_enabled && subTotal > 0 
    ? billingConfig.platform_fee 
    : 0;

  const gstFee = billingConfig.gst_enabled && subTotal > 0 
    ? parseFloat((Math.max(0, subTotal - discountAmount) * (billingConfig.gst_fee / 100)).toFixed(2))
    : 0;

  const finalAmount = Math.max(0, subTotal - discountAmount + deliveryFee + platformFee + gstFee);

  useEffect(() => {
    if (isOpen) {
      dbService.getSocieties().then(setSocieties);
      setOrderSuccessId(null);
      setPlacedItems([]);
      setPlacedAmount(0);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  if (!currentUser) {
    return (
      <div className="fixed inset-0 z-50 overflow-hidden font-sans flex items-center justify-center">
        <div onClick={onClose} className="absolute inset-0 bg-black/60 backdrop-blur-xs" />
        <div className="relative bg-white w-full max-w-md h-auto p-6 sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-scale-up border border-gray-100 text-xs text-gray-700">
          <div className="flex justify-between items-center mb-1 shrink-0">
            <h3 className="text-sm font-bold text-gray-900">Login to Checkout</h3>
            <button onClick={onClose} className="p-1 hover:bg-gray-100 text-gray-400 hover:text-gray-700 rounded-full">
              <X size={20} />
            </button>
          </div>
          <LoginView onLoginSuccess={onLoginTrigger} onBack={onClose} />
        </div>
      </div>
    );
  }

  const handlePayNow = async () => {
    if (isSubmittingRef.current) return;
    if (!activeAddress) {
      alert('Please select or add a delivery address first.');
      onOpenAddressSelector();
      return;
    }

    isSubmittingRef.current = true;
    setIsPlacingOrder(true);

    try {
      // Format full snapshot address
      const matchedSoc = societies.find(s => s.id === activeAddress.society_id);
      const cityStr = matchedSoc?.city || billingConfig.default_city || 'Bhiwadi, Khairthal';
      const pinStr = matchedSoc?.pincode ? ` - ${matchedSoc.pincode}` : '';
      const userPhone = currentUser ? currentUser.phone : activeAddress.phone;
      const formattedAddress = `${activeAddress.name}, ${activeAddress.flat_house_no}, ${activeAddress.society_name}, ${cityStr}${pinStr} - ${userPhone}`;

      const created = await dbService.createOrder({
        total_amount: subTotal,
        discount_amount: discountAmount,
        delivery_fee: deliveryFee,
        platform_fee: platformFee,
        final_amount: finalAmount,
        payment_method: paymentMethod,
        payment_status: paymentMethod === 'COD' ? 'Pending' : 'Completed',
        delivery_address: formattedAddress,
        delivery_instructions: customInstructions,
        ring_doorbell: ringDoorbell,
        delivery_status: 'Pending',
        delivery_slot: billingConfig.delivery_slot || '6 AM - 8 AM',
        items: cartItems.map(item => ({
          id: 'item-' + Math.random(),
          product_id: item.product.id,
          product_name: item.product.name,
          quantity: item.quantity,
          price: item.product.price,
        })),
      });

      setPlacedItems([...cartItems]);
      setPlacedAmount(finalAmount);
      setOrderSuccessId(created.id);
      
      if (onOrderPlaced) {
        onOrderPlaced();
      }
    } catch (e: any) {
      console.error(e);
      alert(e.message || 'Failed to place order.');
    } finally {
      isSubmittingRef.current = false;
      setIsPlacingOrder(false);
    }
  };

  const handleFinish = () => {
    setOrderSuccessId(null);
    onOrderSuccess();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden font-sans flex items-center justify-center">
      {/* Backdrop */}
      <div onClick={orderSuccessId ? undefined : onClose} className="absolute inset-0 bg-black/60 backdrop-blur-xs" />

      {/* Modal */}
      <div className="relative bg-white w-full max-w-md h-full sm:h-[90vh] sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-fade-in">
        
        {/* Header */}
        <div className="bg-white border-b border-gray-100 px-4 py-4 flex items-center justify-between shrink-0">
          <h2 className="text-base font-bold text-gray-900">Checkout</h2>
          {!orderSuccessId && (
            <button onClick={onClose} className="p-1 hover:bg-gray-100 text-gray-400 hover:text-gray-700 rounded-full">
              <X size={20} />
            </button>
          )}
        </div>

        {orderSuccessId ? (
          /* SUCCESS SCREEN */
          <div className="flex-1 flex flex-col items-center overflow-y-auto px-6 py-10 text-center bg-white">
            <div className="w-20 h-20 bg-green-50 text-[#1e7e34] rounded-full flex items-center justify-center mb-6 animate-bounce shrink-0">
              <CheckCircle2 size={56} className="stroke-[2px]" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 shrink-0">Order Placed Successfully!</h3>
            <p className="text-sm text-[#1e7e34] font-semibold mt-1 shrink-0">Order ID: #{orderSuccessId}</p>
            
            <div className="bg-green-50/70 border border-green-100 rounded-2xl p-4 mt-6 max-w-xs text-left shrink-0">
              <h4 className="text-xs font-bold text-green-900 flex items-center space-x-1.5 mb-1.5">
                <Truck size={16} />
                <span>Next-Morning Delivery</span>
              </h4>
              <p className="text-[11px] text-green-800 leading-relaxed">
                Your order is confirmed. Our delivery partner will drop it off tomorrow morning between <span className="font-bold">{billingConfig.delivery_slot || '6 AM - 8 AM'}</span>.
              </p>
            </div>

            {/* Placed Order details showing below */}
            <div className="w-full max-w-xs bg-gray-50 border border-gray-150/80 rounded-2xl p-4 mt-4 text-left space-y-2.5 shadow-sm shrink-0">
              <span className="text-[10px] text-gray-400 font-extrabold uppercase tracking-wider block">Items Purchased</span>
              <div className="divide-y divide-gray-100 max-h-[160px] overflow-y-auto pr-1">
                {placedItems.map((item, index) => (
                  <div key={index} className="py-2 flex justify-between items-baseline text-xs text-gray-700 font-medium">
                    <span className="truncate max-w-[170px]">{item.product.name} x{item.quantity}</span>
                    <span className="font-bold text-[#1e7e34] shrink-0">₹{item.product.price * item.quantity}</span>
                  </div>
                ))}
              </div>
              <div className="border-t border-gray-200/80 pt-2 flex justify-between text-xs font-bold text-gray-900">
                <span>Final Paid</span>
                <span className="text-[#1e7e34] text-sm font-black">₹{placedAmount}</span>
              </div>
            </div>

            <button
              onClick={handleFinish}
              className="mt-6 bg-[#1e7e34] hover:bg-[#155a24] text-white font-bold text-sm px-10 py-3.5 rounded-xl transition-all shadow-md active:scale-95 shrink-0"
            >
              Back to Shopping
            </button>
          </div>
        ) : (
          /* MAIN CHECKOUT FORM */
          <div className="flex-1 flex flex-col justify-between overflow-hidden bg-gray-50">
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
              
              {/* Delivery Slot Indicator */}
              <div className="bg-green-800 text-white rounded-2xl p-3 flex items-center justify-between shadow-xs">
                <div className="flex items-center space-x-2.5">
                  <Truck size={20} className="text-yellow-400 shrink-0" />
                  <span className="text-xs font-bold">Delivery: {billingConfig.delivery_slot || '6 AM - 8 AM'}</span>
                </div>
                <span className="text-[9px] bg-yellow-400 text-green-950 px-2 py-0.5 rounded-md font-bold uppercase">
                  Guaranteed
                </span>
              </div>

              {/* Delivery Address */}
              <div className="bg-white rounded-2xl border border-gray-100 p-3.5 shadow-xs">
                <div className="flex justify-between items-start mb-2.5">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                    Delivery Address
                  </span>
                  <button 
                    onClick={onOpenAddressSelector}
                    className="text-[#1e7e34] text-xs font-bold hover:underline"
                  >
                    Change
                  </button>
                </div>
                {activeAddress ? (
                  <div className="flex items-start space-x-2.5">
                    <MapPin size={18} className="text-gray-400 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-xs font-bold text-gray-800">{activeAddress.name}</h4>
                      <p className="text-[11px] text-gray-500 mt-0.5 leading-normal">
                        {activeAddress.flat_house_no}, {activeAddress.society_name}, {societies.find(s => s.id === activeAddress.society_id)?.city || billingConfig.default_city || 'Bhiwadi, Khairthal'}
                      </p>
                      <p className="text-[11px] text-gray-400 mt-1">{activeAddress.phone}</p>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-2">
                    <p className="text-xs text-gray-400 font-medium mb-2">No address selected</p>
                    <button
                      onClick={onOpenAddressSelector}
                      className="bg-[#1e7e34]/10 text-[#1e7e34] hover:bg-[#1e7e34]/15 px-4 py-2 rounded-xl text-xs font-bold transition-colors"
                    >
                      Add New Address
                    </button>
                  </div>
                )}
              </div>

              {/* Payment Options */}
              <div className="bg-white rounded-2xl border border-gray-100 p-3.5 space-y-3 shadow-xs">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                  Payment Options
                </span>

                {/* Cash on Delivery */}
                <div
                  className="w-full flex items-center justify-between p-3 rounded-2xl border border-[#1e7e34] bg-green-50/20"
                >
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-gray-50 text-gray-700 rounded-xl">
                      <Truck size={18} />
                    </div>
                    <div className="text-left">
                      <h4 className="text-xs font-bold text-gray-800">Cash on Delivery (COD)</h4>
                      <p className="text-[9px] text-gray-400">Pay cash or UPI at delivery time</p>
                    </div>
                  </div>
                  <div className="w-4 h-4 rounded-full border border-[#1e7e34] flex items-center justify-center shrink-0">
                    <div className="w-2.5 h-2.5 bg-[#1e7e34] rounded-full" />
                  </div>
                </div>
              </div>

              {/* Delivery Instructions */}
              <div className="bg-white rounded-2xl border border-gray-100 p-3.5 space-y-3 shadow-xs">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                  Delivery Instructions
                </span>
                
                {/* Ring doorbell switch */}
                <div className="flex items-center justify-between pb-1">
                  <div className="flex items-center space-x-2 text-gray-700">
                    <BellRing size={16} className="text-gray-400" />
                    <span className="text-xs font-semibold">Ring the door bell</span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={ringDoorbell}
                      onChange={(e) => setRingDoorbell(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#1e7e34]"></div>
                  </label>
                </div>

                {/* Instructions input */}
                <div className="relative">
                  <NotebookPen size={14} className="absolute left-3 top-3.5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Add custom instructions here (e.g. Leave at gate)"
                    value={customInstructions}
                    onChange={(e) => setCustomInstructions(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-100 rounded-xl pl-9 pr-3 py-2.5 text-xs text-gray-800 focus:outline-none focus:ring-1 focus:ring-[#1e7e34]"
                  />
                </div>
              </div>

              {/* Bill Summary */}
              <div className="bg-white rounded-2xl border border-gray-100 p-3.5 space-y-2.5 shadow-xs">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                  Order Summary
                </span>
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

            {/* Bottom Pay Button */}
            <div className="bg-white border-t border-gray-100 p-4 shrink-0 shadow-lg">
              <button
                onClick={handlePayNow}
                disabled={isPlacingOrder}
                className="w-full flex items-center justify-between bg-[#1e7e34] hover:bg-[#155a24] text-white font-bold p-3.5 rounded-2xl transition-all shadow-md active:scale-98 disabled:opacity-50"
              >
                <div className="flex flex-col items-start">
                  <span className="text-[10px] text-green-200">Total to pay</span>
                  <span className="text-sm font-extrabold">₹{finalAmount}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <span className="text-sm font-bold">
                    {isPlacingOrder ? 'Processing...' : paymentMethod === 'COD' ? 'Place COD Order' : 'Pay & Confirm'}
                  </span>
                  <ArrowRight size={16} />
                </div>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
