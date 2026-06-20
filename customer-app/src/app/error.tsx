'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function Error({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Log the error to console
    console.error('Next.js Page Error Boundary:', error);
  }, [error]);

  return (
    <div className="flex-1 min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-red-50/20 via-white to-green-50/10 px-6 py-12 text-center font-sans">
      <div className="max-w-md w-full space-y-8 animate-fade-in">
        {/* Warning Icon */}
        <div className="relative mx-auto w-24 h-24 bg-red-50 text-red-600 rounded-full flex items-center justify-center shadow-lg border border-red-100/50">
          <AlertTriangle size={48} className="stroke-[1.5px] animate-bounce" />
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-md">
            500
          </span>
        </div>

        {/* Text Details */}
        <div className="space-y-3">
          <h1 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight">
            Something Went Wrong!
          </h1>
          <p className="text-sm text-gray-500 leading-relaxed font-medium max-w-sm mx-auto">
            An unexpected error occurred while harvesting your page. We have logged this error and are working on fixing it.
          </p>
          {error && error.message && (
            <div className="bg-red-50/50 border border-red-100 rounded-xl p-3 max-w-sm mx-auto text-left">
              <span className="text-[10px] text-red-500 font-extrabold uppercase tracking-wide block mb-1">Error details</span>
              <p className="text-[11px] text-red-800 font-mono break-all leading-normal">
                {error.message || 'Unknown runtime error'}
              </p>
            </div>
          )}
        </div>

        {/* Navigation Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            suppressHydrationWarning
            onClick={() => reset()}
            className="w-full sm:w-auto flex items-center justify-center space-x-2 border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 font-bold text-xs px-6 py-3.5 rounded-2xl transition-all active:scale-95 shadow-sm cursor-pointer"
          >
            <RefreshCw size={16} />
            <span>Try Again</span>
          </button>
          
          <Link
            href="/"
            className="w-full sm:w-auto flex items-center justify-center space-x-2 bg-[#1e7e34] hover:bg-[#155a24] text-white font-bold text-xs px-6 py-3.5 rounded-2xl transition-all active:scale-95 shadow-md"
          >
            <Home size={16} />
            <span>Back to Home</span>
          </Link>
        </div>

        {/* Brand footer */}
        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
          Genie Farm • Support Team
        </p>
      </div>
    </div>
  );
}
