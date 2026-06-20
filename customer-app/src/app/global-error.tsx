'use client';

import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-red-50/20 via-white to-green-50/10 px-6 py-12 text-center font-sans">
        <div className="max-w-md w-full space-y-8">
          {/* Warning Icon */}
          <div className="relative mx-auto w-24 h-24 bg-red-50 text-red-600 rounded-full flex items-center justify-center shadow-lg border border-red-100/50">
            <AlertTriangle size={48} className="stroke-[1.5px]" />
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-md">
              SYSTEM ERROR
            </span>
          </div>

          {/* Text Details */}
          <div className="space-y-3">
            <h1 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight">
              A Global Error Occurred!
            </h1>
            <p className="text-sm text-gray-500 leading-relaxed font-medium max-w-sm mx-auto">
              A critical error crashed the core application interface. We have logged the error details.
            </p>
            {error && error.message && (
              <div className="bg-red-50/50 border border-red-100 rounded-xl p-3 max-w-sm mx-auto text-left">
                <span className="text-[10px] text-red-500 font-extrabold uppercase tracking-wide block mb-1">System Error Details</span>
                <p className="text-[11px] text-red-800 font-mono break-all leading-normal">
                  {error.message}
                </p>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-center">
            <button
              suppressHydrationWarning
              onClick={() => reset()}
              className="w-full sm:w-auto flex items-center justify-center space-x-2 bg-[#1e7e34] hover:bg-[#155a24] text-white font-bold text-xs px-6 py-3.5 rounded-2xl transition-all active:scale-95 shadow-md cursor-pointer"
            >
              <RefreshCw size={16} />
              <span>Recover App</span>
            </button>
          </div>

          {/* Brand footer */}
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
            Genie Farm • Core System
          </p>
        </div>
      </body>
    </html>
  );
}
