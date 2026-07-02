'use client';

import React, { useState, useEffect } from 'react';
import { Search, Mic, ShoppingBag, User, ChevronDown, MapPin, Leaf } from 'lucide-react';
import { Address, BillingConfig, Category } from '../utils/db';
import { TabType } from './FooterNav';

interface HeaderProps {
  activeAddress: Address | null;
  onAddressClick: () => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  cartItemCount: number;
  onCartClick: () => void;
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  billingConfig: BillingConfig;
  categories: Category[];
}

export default function Header({
  activeAddress,
  onAddressClick,
  searchQuery,
  setSearchQuery,
  cartItemCount,
  onCartClick,
  activeTab,
  setActiveTab,
  billingConfig,
  categories,
}: HeaderProps) {
  const categoriesList = categories && categories.length > 0
    ? categories.map(c => c.name)
    : ['Fruits', 'Vegetables', 'Melons', 'Traditional'];

  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [isFocused, setIsFocused] = useState(false);
  const [isMobileFocused, setIsMobileFocused] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setPlaceholderIndex((prev) => (prev + 1) % categoriesList.length);
    }, 3000);
    return () => clearInterval(timer);
  }, [categoriesList.length]);

  return (
    <header className="sticky top-0 z-40 bg-white text-gray-800 border-b border-gray-100 shadow-xs">
      <style>{`
        @keyframes slideUpEnter {
          0% {
            transform: translateY(100%);
            opacity: 0;
          }
          100% {
            transform: translateY(0);
            opacity: 1;
          }
        }
        .animate-placeholder-swap {
          animation: slideUpEnter 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>
      
      {/* ========================================================== */}
      {/* 1. DESKTOP LAYOUT (md and up)                             */}
      {/* ========================================================== */}
      <div className="hidden md:flex mx-auto max-w-7xl px-6 py-3.5 items-center justify-between space-x-6">
        
        {/* Brand Logo & Location Dropdown */}
        <div className="flex items-center space-x-5 shrink-0">
          <button 
            suppressHydrationWarning
            onClick={() => {
              setActiveTab('home');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="flex items-center hover:opacity-90 transition-opacity"
          >
            <img src="/logo.png?v=2" alt="genie farm" className="h-10 w-auto object-contain" />
          </button>

          {/* Location Selector */}
          <button
            suppressHydrationWarning
            onClick={onAddressClick}
            className="flex items-center space-x-1.5 hover:bg-gray-50 px-3 py-2 rounded-xl text-left transition-colors"
          >
            <span className="text-xs font-bold text-gray-800 truncate max-w-[150px] lg:max-w-[220px]">
              {activeAddress
                ? `${activeAddress.society_name}`
                : 'Select Location'}
            </span>
            <ChevronDown size={14} className="text-gray-500 shrink-0" />
          </button>
        </div>

        {/* Center Search Input (Pill style matching Zepto) */}
        <div className="flex-1 max-w-2xl relative">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            suppressHydrationWarning
            type="text"
            placeholder=""
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            className="w-full bg-gray-50 text-gray-800 placeholder-gray-400 pl-11 pr-11 py-2.5 rounded-xl text-xs border border-gray-200/80 focus:outline-none focus:bg-white focus:ring-1 focus:ring-[#1e7e34] focus:border-transparent transition-all shadow-inner"
          />
          {!isFocused && searchQuery === "" && (
            <div className="absolute left-11 top-1/2 -translate-y-1/2 pointer-events-none overflow-hidden h-[18px] flex items-center">
              <span 
                key={placeholderIndex} 
                className="text-xs text-[#909090] inline-block animate-placeholder-swap"
              >
                Search for "{categoriesList[placeholderIndex]}"
              </span>
            </div>
          )}
          {/* <button className="absolute right-4 top-1/2 -translate-y-1/2 p-0.5 text-gray-400 hover:text-[#1e7e34] rounded-full">
            <Mic size={16} />
          </button> */}
        </div>

        {/* Right Navigation & Utilities */}
        <div className="flex items-center space-x-5 shrink-0">
          <nav className="flex space-x-2.5">
            {[
              { id: 'home' as TabType, label: 'Home' },
              { id: 'categories' as TabType, label: 'Categories' },
            ].map((link) => {
              const isActive = activeTab === link.id;
              return (
                <button
                  suppressHydrationWarning
                  key={link.id}
                  onClick={() => setActiveTab(link.id)}
                  className={`text-xs font-bold px-3 py-2 rounded-xl transition-all cursor-pointer ${
                    isActive
                      ? 'bg-green-50 text-[#1e7e34]'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  {link.label}
                </button>
              );
            })}
          </nav>

          <div className="flex items-center space-x-4 border-l border-gray-100 pl-5">
            {/* Account Tab */}
            <button
              suppressHydrationWarning
              onClick={() => setActiveTab('profile')}
              className={`flex items-center space-x-1 text-xs font-bold py-2 px-2.5 rounded-xl transition-colors cursor-pointer ${
                activeTab === 'profile' ? 'text-[#1e7e34] bg-green-50' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <User size={16} />
              <span>Account</span>
            </button>

            {/* Cart Button */}
            <button
              suppressHydrationWarning
              onClick={onCartClick}
              className="flex items-center space-x-1.5 bg-[#1e7e34] hover:bg-[#155a24] text-white font-bold px-4 py-2.5 rounded-xl transition-all shadow-md active:scale-95 relative cursor-pointer text-xs"
            >
              <ShoppingBag size={16} />
              <span>Cart</span>
              {cartItemCount > 0 && (
                <span className="bg-red-500 text-white text-[9px] font-black w-4.5 h-4.5 rounded-full flex items-center justify-center border border-white animate-bounce">
                  {cartItemCount}
                </span>
              )}
            </button>
          </div>
        </div>

      </div>

      {/* ========================================================== */}
      {/* 2. MOBILE LAYOUT (Default mobile screen)                  */}
      {/* ========================================================== */}
      <div className="md:hidden w-full bg-[#74b14e] text-white">
        <div className="mx-auto w-full max-w-screen-sm px-4 py-3">
        {/* Top row: Brand & Cart */}
        <div className="flex items-center justify-between">
          <button 
            suppressHydrationWarning
            onClick={() => {
              setActiveTab('home');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="flex items-center hover:opacity-90 transition-opacity"
          >
            <img src="/logo.png?v=2" alt="genie farm" className="h-10 w-auto object-contain" />
          </button>
          
          <button 
            suppressHydrationWarning
            onClick={onCartClick} 
            className="p-1.5 hover:bg-green-700/50 rounded-xl transition-all relative"
          >
            <ShoppingBag size={22} />
            {cartItemCount > 0 && (
              <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full"></span>
            )}
          </button>
        </div>

        {/* Location & Delivery time row */}
        <button
          suppressHydrationWarning
          onClick={onAddressClick}
          className="w-full mt-3.5 flex items-center justify-between text-left focus:outline-none cursor-pointer bg-black/10 backdrop-blur-xs px-3.5 py-2.5 rounded-2xl shadow-inner border border-white/5"
        >
          <div className="flex items-center flex-1 min-w-0 space-x-2.5">
            <MapPin size={22} className="text-yellow-400 shrink-0" />
            <div className="truncate flex-1">
              <div className="text-[10px] text-green-200 font-bold uppercase leading-none">Delivering to</div>
              <div className="text-xs font-semibold truncate mt-0.5">
                {activeAddress
                  ? `${activeAddress.name} - ${activeAddress.society_name}`
                  : 'Select Delivery Address'}
              </div>
            </div>
          </div>
          <div className="ml-3 shrink-0 border-l border-green-600/40 pl-3 text-right">
            <span className="text-[10px] bg-yellow-400 text-green-950 font-bold px-2 py-0.5 rounded-full inline-block uppercase">
              Next-Day
            </span>
            <div className="text-[10px] text-green-100 font-semibold mt-0.5 leading-none">
              {billingConfig.delivery_slot || '6 AM - 8 AM'}
            </div>
          </div>
        </button>

        {/* Search Bar */}
        <div className="mt-3 relative">
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#595959]" />
          <input
            suppressHydrationWarning
            type="text"
            placeholder=""
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setIsMobileFocused(true)}
            onBlur={() => setIsMobileFocused(false)}
            className="w-full rounded-xl bg-white py-3 pl-10 pr-4 text-sm text-gray-800 placeholder-gray-400 focus:outline-none"
          />
          {!isMobileFocused && searchQuery === "" && (
            <div className="absolute left-10 top-1/2 -translate-y-1/2 pointer-events-none overflow-hidden h-[20px] flex items-center">
              <span 
                key={placeholderIndex} 
                className="text-sm text-[#595959] inline-block animate-placeholder-swap"
              >
                Search for "{categoriesList[placeholderIndex]}"
              </span>
            </div>
          )}
          
        </div>
        </div>
      </div>
    </header>
  );
}
