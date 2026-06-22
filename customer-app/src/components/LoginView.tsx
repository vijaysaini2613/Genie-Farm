'use client';

import React, { useState } from 'react';
import { Phone, User, ArrowRight, ArrowLeft } from 'lucide-react';

interface LoginViewProps {
  onLoginSuccess: (user: { name: string; phone: string }) => void;
  onBack?: () => void;
}

export default function LoginView({ onLoginSuccess, onBack }: LoginViewProps) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('Please enter your name.');
      return;
    }
    if (!/^\d{10}$/.test(phone.trim())) {
      alert('Please enter a valid 10-digit mobile number.');
      return;
    }
    const user = { name: name.trim(), phone: phone.trim() };
    localStorage.setItem('geniefarm_user', JSON.stringify(user));
    onLoginSuccess(user);
  };

  return (
    <div className="mx-auto max-w-md bg-white border border-gray-100 rounded-3xl shadow-xl p-8 space-y-6 animate-scale-up mt-8 font-sans relative">
      {onBack && (
        <button
          onClick={onBack}
          type="button"
          className="absolute top-4 left-4 p-1.5 hover:bg-gray-100 rounded-full text-gray-500 hover:text-gray-700 transition-colors cursor-pointer"
        >
          <ArrowLeft size={20} />
        </button>
      )}
      <div className="text-center space-y-2">
        <div className="mx-auto w-16 h-16 bg-green-50 rounded-2xl flex items-center justify-center text-[#1e7e34]">
          <User size={32} />
        </div>
        <h2 className="text-xl font-black text-gray-900">Welcome to Genie Farm</h2>
        <p className="text-xs text-gray-400 font-medium">Log in to view your orders and place new deliveries</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        {/* Name */}
        <div className="space-y-1">
          <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider">Your Full Name</label>
          <div className="relative">
            <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              required
              placeholder="Enter your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-10 pr-4 py-3 text-sm text-gray-800 font-semibold focus:outline-none focus:ring-1 focus:ring-[#1e7e34] focus:bg-white transition-all"
            />
          </div>
        </div>

        {/* Phone */}
        <div className="space-y-1">
          <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider">Mobile Number</label>
          <div className="relative">
            <Phone size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="tel"
              required
              maxLength={10}
              placeholder="10-digit mobile number"
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-10 pr-4 py-3 text-sm text-gray-800 font-semibold focus:outline-none focus:ring-1 focus:ring-[#1e7e34] focus:bg-white transition-all"
            />
          </div>
        </div>

        <button
          type="submit"
          className="w-full flex items-center justify-center space-x-2 bg-[#1e7e34] hover:bg-[#155a24] text-white font-bold text-sm py-3.5 rounded-xl transition-all shadow-md active:scale-98 cursor-pointer"
        >
          <span>Login / Continue</span>
          <ArrowRight size={16} />
        </button>
      </form>
    </div>
  );
}
