'use client';

import React from 'react';
import { X, Heart, Plus, Minus, Info, AlertTriangle, ShieldCheck, ShoppingCart, MapPin } from 'lucide-react';
import { Product } from '../utils/db';

interface ProductDetailsModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  quantityInCart: number;
  onAddToCart: (product: Product) => void;
  onRemoveFromCart: (productId: string) => void;
  isFavorite: boolean;
  onToggleFavorite: (productId: string) => void;
}

export default function ProductDetailsModal({
  product,
  isOpen,
  onClose,
  quantityInCart,
  onAddToCart,
  onRemoveFromCart,
  isFavorite,
  onToggleFavorite,
}: ProductDetailsModalProps) {
  if (!isOpen || !product) return null;

  const hasDiscount = product.mrp > product.price;
  const discountPercent = hasDiscount 
    ? Math.round(((product.mrp - product.price) / product.mrp) * 100) 
    : 0;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden font-sans flex items-center justify-center">
      {/* Backdrop */}
      <div onClick={onClose} className="absolute inset-0 bg-black/60 backdrop-blur-xs" />

      {/* Sheet */}
      <div className="relative bg-white w-full max-w-md h-full sm:h-[90vh] sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-fade-in">
        
        {/* Floating actions */}
        <div className="absolute top-4 inset-x-4 z-10 flex justify-between">
          <button
            onClick={onClose}
            className="p-2 bg-black/45 hover:bg-black/60 text-white rounded-full transition-colors backdrop-blur-xs"
          >
            <X size={20} />
          </button>
          <button
            onClick={() => onToggleFavorite(product.id)}
            className="p-2 bg-black/45 hover:bg-black/60 text-white rounded-full transition-colors backdrop-blur-xs"
          >
            <Heart size={20} className={isFavorite ? 'fill-red-500 stroke-red-500' : ''} />
          </button>
        </div>

        {/* Scrollable contents */}
        <div className="flex-1 overflow-y-auto">
          {/* Main Hero Image */}
          <div className="aspect-video w-full bg-gray-100 relative overflow-hidden">
            <img
              src={product.image_url}
              alt={product.name}
              className="w-full h-full object-cover"
            />
            {product.stock <= 0 && (
              <div className="absolute inset-0 bg-black/45 flex items-center justify-center">
                <span className="bg-red-600 text-white text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-widest">
                  Out of Stock
                </span>
              </div>
            )}
          </div>

          {/* Product Info Panel */}
          <div className="p-4 space-y-4">
            
            {/* Title & Price row */}
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-[10px] bg-[#1e7e34]/10 text-[#1e7e34] font-bold px-2 py-0.5 rounded-md">
                  100% Fresh
                </span>
                {hasDiscount && (
                  <span className="text-[10px] bg-red-500 text-white font-bold px-2 py-0.5 rounded-md">
                    {discountPercent}% OFF
                  </span>
                )}
              </div>
              <h1 className="text-lg font-bold text-gray-900 mt-2">{product.name}</h1>
              <p className="text-xs text-gray-400 mt-0.5">
                Pack weight: {product.unit} {product.weight_range}
              </p>

              <div className="flex items-baseline space-x-2 mt-3">
                <span className="text-xl font-extrabold text-[#1e7e34]">
                  ₹{quantityInCart > 0 ? product.price * quantityInCart : product.price}
                </span>
                {quantityInCart > 1 && (
                  <span className="text-xs text-gray-500 font-medium">
                    (₹{product.price} each)
                  </span>
                )}
                {hasDiscount && (
                  <span className="text-sm text-gray-400 line-through">
                    ₹{quantityInCart > 0 ? product.mrp * quantityInCart : product.mrp}
                  </span>
                )}
              </div>
            </div>

            <hr className="border-gray-100" />

            {/* Quality Badges */}
            <div className="grid grid-cols-3 gap-2 py-1">
              <div className="bg-gray-50 rounded-2xl p-2.5 text-center flex flex-col items-center">
                <ShieldCheck size={20} className="text-[#1e7e34] mb-1" />
                <span className="text-[9px] font-bold text-gray-700">100% Quality</span>
                <span className="text-[8px] text-gray-400 mt-0.5">Sourced Daily</span>
              </div>
              <div className="bg-gray-50 rounded-2xl p-2.5 text-center flex flex-col items-center">
                <Info size={20} className="text-[#1e7e34] mb-1" />
                <span className="text-[9px] font-bold text-gray-700">Shelf Life</span>
                <span className="text-[8px] text-gray-400 mt-0.5">{product.shelf_life || '3 Days'}</span>
              </div>
              <div className="bg-gray-50 rounded-2xl p-2.5 text-center flex flex-col items-center">
                <MapPin size={20} className="text-[#1e7e34] mb-1" />
                <span className="text-[9px] font-bold text-gray-700">Origin</span>
                <span className="text-[8px] text-gray-400 mt-0.5 truncate max-w-full">{product.origin || 'Local'}</span>
              </div>
            </div>

            <hr className="border-gray-100" />

            {/* Product description sections */}
            <div className="space-y-4 text-xs">
              
              {/* About the product */}
              {product.description && (
                <div className="space-y-1">
                  <h3 className="font-bold text-gray-800 uppercase tracking-wide text-[10px] text-gray-400">
                    About The Product
                  </h3>
                  <p className="text-gray-600 leading-relaxed">{product.description}</p>
                </div>
              )}

              {/* Benefits */}
              {product.benefits && (
                <div className="space-y-1">
                  <h3 className="font-bold text-gray-800 uppercase tracking-wide text-[10px] text-gray-400">
                    Nutritional Benefits
                  </h3>
                  <p className="text-gray-600 leading-relaxed">{product.benefits}</p>
                </div>
              )}

              {/* Storage */}
              {product.storage_tips && (
                <div className="space-y-1">
                  <h3 className="font-bold text-gray-800 uppercase tracking-wide text-[10px] text-gray-400">
                    Storage & Uses
                  </h3>
                  <p className="text-gray-600 leading-relaxed">{product.storage_tips}</p>
                </div>
              )}

              {/* Disclaimer */}
              <div className="bg-yellow-50/50 border border-yellow-100 rounded-2xl p-3 flex items-start space-x-2.5">
                <AlertTriangle size={16} className="text-yellow-600 shrink-0 mt-0.5" />
                <div className="text-[10px] text-yellow-800 leading-normal">
                  <span className="font-bold block mb-0.5">Disclaimer:</span>
                  Please note that fresh produce items vary in shape, color, and size naturally. Weight may vary by +/- 5% due to moisture loss during delivery.
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Cart Action Drawer */}
        <div className="bg-white border-t border-gray-100 p-4 shadow-lg shrink-0">
          {product.stock <= 0 ? (
            <button
              disabled
              className="w-full py-3 text-center text-sm font-semibold rounded-xl bg-gray-100 text-gray-400 cursor-not-allowed"
            >
              This Item is Currently Unavailable
            </button>
          ) : quantityInCart > 0 ? (
            <div className="flex items-center justify-between border border-[#1e7e34] bg-green-50/50 rounded-2xl p-2">
              <button
                onClick={() => onRemoveFromCart(product.id)}
                className="p-2 hover:bg-[#1e7e34]/10 text-[#1e7e34] rounded-xl transition-colors"
              >
                <Minus size={18} className="stroke-[3px]" />
              </button>
              <div className="text-center">
                <span className="text-xs text-gray-500 font-medium">Added to Cart</span>
                <span className="block text-sm font-bold text-gray-900">
                  {quantityInCart} items (₹{product.price * quantityInCart})
                </span>
              </div>
              <button
                onClick={() => onAddToCart(product)}
                disabled={quantityInCart >= product.stock}
                className={`p-2 text-[#1e7e34] rounded-xl transition-colors ${
                  quantityInCart >= product.stock ? 'opacity-30 cursor-not-allowed' : 'hover:bg-[#1e7e34]/10'
                }`}
              >
                <Plus size={18} className="stroke-[3px]" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => onAddToCart(product)}
              className="w-full flex items-center justify-center space-x-2 bg-[#1e7e34] hover:bg-[#155a24] text-white font-bold p-3.5 rounded-2xl transition-all shadow-md active:scale-98"
            >
              <ShoppingCart size={18} />
              <span>Add to Basket</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
