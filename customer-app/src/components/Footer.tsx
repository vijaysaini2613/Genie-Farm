'use client';

import React, { useState } from 'react';
import { Mail, ArrowUp, X, HelpCircle, ShieldAlert, FileText, RefreshCw, AlertCircle } from 'lucide-react';
import { BillingConfig } from '../utils/db';

interface FooterProps {
  billingConfig: BillingConfig;
}

export default function Footer({ billingConfig }: FooterProps) {
  const [activeModal, setActiveModal] = useState<'faqs' | 'privacy' | 'terms' | 'refund' | 'grievance' | null>(null);

  const handleBackToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="hidden md:block bg-white border-t border-gray-100 py-12 px-6 mt-12 w-full font-sans text-xs text-gray-700">
      <div className="max-w-7xl mx-auto space-y-10">
        {/* 1. Main Footer Columns */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">

          {/* Column 1: Brand details & description */}
          <div className="space-y-4">
            <h3 className="text-sm font-extrabold text-gray-900 tracking-tight">
              Genie Farm Fuels Life
            </h3>
            <p className="text-gray-500 leading-relaxed max-w-sm">
              A modern guide to why <strong className="text-gray-900 font-extrabold">fresh fruits & vegetables</strong> matter every day—energy, immunity, focus, and sustainability.
            </p>

          </div>

          {/* Column 2: Explore */}
          <div className="space-y-3.5">
            <h4 className="text-[10px] font-extrabold text-gray-900 uppercase tracking-wider">
              Explore
            </h4>
            <ul className="space-y-2 font-bold">
              <li>
                <button
                  suppressHydrationWarning
                  onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                  className="hover:text-green-700 transition-colors text-left cursor-pointer"
                >
                  Home
                </button>
              </li>
              <li>
                <button
                  suppressHydrationWarning
                  onClick={() => alert('Genie Farm is committed to bringing fresh organic products from local farms to your home daily.')}
                  className="hover:text-green-700 transition-colors text-left cursor-pointer"
                >
                  About Us
                </button>
              </li>
              <li>
                <button
                  suppressHydrationWarning
                  onClick={() => alert('Read articles on nutritional lifestyles, farm-fresh recipes, and immunity tips on the Genie Farm Blog.')}
                  className="hover:text-green-700 transition-colors text-left cursor-pointer"
                >
                  Blog
                </button>
              </li>
              <li>
                <a
                  href={`mailto:${billingConfig.support_email || 'mygeniefarm@gmail.com'}`}
                  className="hover:text-green-700 transition-colors text-left cursor-pointer"
                >
                  Contact Us
                </a>
              </li>
              <li>
                <button
                  suppressHydrationWarning
                  onClick={() => setActiveModal('faqs')}
                  className="hover:text-green-700 transition-colors text-left cursor-pointer"
                >
                  FAQ
                </button>
              </li>
            </ul>
          </div>

          {/* Column 3: Company */}
          <div className="space-y-3.5">
            <h4 className="text-[10px] font-extrabold text-gray-900 uppercase tracking-wider">
              Company
            </h4>
            <div className="space-y-2.5">
              <p className="leading-relaxed">
                <span className="text-green-700 font-extrabold">Genie Farm</span> is a consumer brand.
              </p>
              <p className="text-[10px] text-gray-500 font-medium">
                CIN: U63999DL2024PTC432100
              </p>
              <div className="text-[10px] text-gray-400 italic leading-relaxed">
                <p className="font-semibold text-gray-500">Registered Office:</p>
                <p className="mt-0.5">8/232, 1st Floor, Sector 8, Bhiwadi, Khairthal, Rajasthan 301019</p>
              </div>
              <a
                href={`mailto:${billingConfig.support_email || 'mygeniefarm@gmail.com'}`}
                className="flex items-center space-x-1.5 text-green-700 font-extrabold hover:underline"
              >
                <Mail size={14} className="shrink-0" />
                <span>{billingConfig.support_email || 'mygeniefarm@gmail.com'}</span>
              </a>
            </div>
          </div>

          {/* Column 4: Legal */}
          <div className="space-y-3.5">
            <h4 className="text-[10px] font-extrabold text-gray-900 uppercase tracking-wider">
              Legal
            </h4>
            <ul className="space-y-2 font-extrabold text-green-700">
              <li>
                <button
                  suppressHydrationWarning
                  onClick={() => setActiveModal('privacy')}
                  className="hover:underline hover:text-green-800 transition-colors text-left cursor-pointer"
                >
                  Privacy Policy
                </button>
              </li>
              <li>
                <button
                  suppressHydrationWarning
                  onClick={() => setActiveModal('terms')}
                  className="hover:underline hover:text-green-800 transition-colors text-left cursor-pointer"
                >
                  Terms & Conditions
                </button>
              </li>
              <li>
                <button
                  suppressHydrationWarning
                  onClick={() => setActiveModal('refund')}
                  className="hover:underline hover:text-green-800 transition-colors text-left cursor-pointer"
                >
                  Refund Policy
                </button>
              </li>
              <li>
                <button
                  suppressHydrationWarning
                  onClick={() => setActiveModal('grievance')}
                  className="hover:underline hover:text-green-800 transition-colors text-left cursor-pointer"
                >
                  Grievance Policy
                </button>
              </li>
            </ul>
          </div>

        </div>

        {/* 3. Bottom Row */}
        <div className="flex items-center justify-between text-[10px] text-gray-400 font-medium pt-6 border-t border-gray-100 mt-6">
          <span>© 2026 Genie Farm. All rights reserved.</span>
          <div className="flex items-center space-x-6">
            <button
              suppressHydrationWarning
              onClick={handleBackToTop}
              className="flex items-center space-x-1.5 text-green-700 font-bold hover:underline hover:text-green-800 cursor-pointer active:scale-95"
            >
              <ArrowUp size={12} />
              <span>Back to top</span>
            </button>
            <span>Made in Bhiwadi</span>
          </div>
        </div>
      </div>

      {/* WORKABLE INFO MODALS */}
      {activeModal && (
        <div className="fixed inset-0 z-50 overflow-hidden flex items-center justify-center p-4">
          <div onClick={() => setActiveModal(null)} className="absolute inset-0 bg-black/60 backdrop-blur-xs" />
          <div className="relative bg-white w-full max-w-md rounded-3xl shadow-2xl flex flex-col max-h-[80vh] overflow-hidden border border-gray-100 animate-scale-up text-xs text-gray-700">
            {/* Modal Header */}
            <div className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between shrink-0">
              <div className="flex items-center space-x-2">
                {activeModal === 'faqs' && <HelpCircle className="text-green-700" size={18} />}
                {activeModal === 'privacy' && <ShieldAlert className="text-green-700" size={18} />}
                {activeModal === 'terms' && <FileText className="text-green-700" size={18} />}
                {activeModal === 'refund' && <RefreshCw className="text-green-700" size={18} />}
                {activeModal === 'grievance' && <AlertCircle className="text-green-700" size={18} />}
                <h3 className="text-sm font-extrabold text-gray-900 capitalize">
                  {activeModal === 'faqs' ? 'Frequently Asked Questions' : activeModal.replace('_', ' ') + ' Policy'}
                </h3>
              </div>
              <button
                suppressHydrationWarning
                onClick={() => setActiveModal(null)}
                className="p-1 hover:bg-gray-100 text-gray-400 hover:text-gray-700 rounded-full"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {activeModal === 'faqs' && (
                <div className="space-y-4">
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
                    <p className="text-gray-500 leading-relaxed font-semibold">A: Call us directly at {billingConfig.support_phone_formatted || '+91 9509122472'} or email {billingConfig.support_email || 'mygeniefarm@gmail.com'}. We are here to help!</p>
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

              {activeModal === 'refund' && (
                <div className="space-y-3 font-semibold text-gray-500 leading-relaxed">
                  <p>
                    Our Refund Policy ensures your satisfaction. If you receive damaged, stale, or sub-par fresh produce, please report it within 24 hours of delivery.
                  </p>
                  <p>
                    We will verify the issue and initiate a full refund or replacement directly to your original payment method within 3-5 business days. No questions asked.
                  </p>
                </div>
              )}

              {activeModal === 'grievance' && (
                <div className="space-y-3 font-semibold text-gray-500 leading-relaxed">
                  <p>
                    For any complaints, issues, or disputes regarding our service, produce, or delivery staff, you can contact our Grievance Officer.
                  </p>
                  <p>
                    Email <span className="text-green-700 font-extrabold">{billingConfig.support_email || 'mygeniefarm@gmail.com'}</span> with your Order ID and contact details, and we will investigate and resolve your grievance within 48 business hours.
                  </p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-end">
              <button
                suppressHydrationWarning
                onClick={() => setActiveModal(null)}
                className="bg-[#1e7e34] hover:bg-[#155a24] text-white font-bold text-xs px-6 py-2.5 rounded-xl transition-all shadow-md active:scale-95"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </footer>
  );
}
