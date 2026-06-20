'use client';

import React from 'react';
import Link from 'next/link';
import { Leaf, ArrowLeft, Home } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="flex-1 min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-green-50/50 via-white to-green-50/20 px-6 py-12 text-center font-sans">
      <div className="max-w-md w-full space-y-8 animate-fade-in">
        {/* Decorative Leaf Icon */}
        <div className="relative mx-auto w-24 h-24 bg-green-50 text-green-600 rounded-full flex items-center justify-center shadow-lg border border-green-100/50">
          <Leaf size={48} className="stroke-[1.5px] animate-pulse" />
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-md">
            404
          </span>
        </div>

        {/* Text Details */}
        <div className="space-y-3">
          <h1 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight">
            Harvest Lost in Transit!
          </h1>
          <p className="text-sm text-gray-500 leading-relaxed font-medium max-w-sm mx-auto">
            The page you are looking for has been harvested, moved, or never existed. Let's guide you back to the fresh produce on the farm!
          </p>
        </div>

        {/* Navigation Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            suppressHydrationWarning
            onClick={() => window.history.back()}
            className="w-full sm:w-auto flex items-center justify-center space-x-2 border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 font-bold text-xs px-6 py-3.5 rounded-2xl transition-all active:scale-95 shadow-sm cursor-pointer"
          >
            <ArrowLeft size={16} />
            <span>Go Back</span>
          </button>
          
          <Link
            href="/"
            className="w-full sm:w-auto flex items-center justify-center space-x-2 bg-[#1e7e34] hover:bg-[#155a24] text-white font-bold text-xs px-6 py-3.5 rounded-2xl transition-all active:scale-95 shadow-md"
          >
            <Home size={16} />
            <span>Back to Shopping</span>
          </Link>
        </div>

        {/* Brand footer */}
        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
          Genie Farm • Fresh Daily
        </p>
      </div>
    </div>
  );
}
