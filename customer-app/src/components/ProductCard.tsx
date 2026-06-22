'use client';

import React from 'react';
import { Heart, Plus, Minus, Star } from 'lucide-react';
import { Product } from '../utils/db';

interface ProductCardProps {
  product: Product;
  quantityInCart: number;
  onAddToCart: (product: Product) => void;
  onRemoveFromCart: (productId: string, isFlash?: boolean) => void;
  onProductClick: (product: Product) => void;
  isFavorite: boolean;
  onToggleFavorite: (productId: string) => void;
}

export default function ProductCard({
  product,
  quantityInCart,
  onAddToCart,
  onRemoveFromCart,
  onProductClick,
  isFavorite,
  onToggleFavorite,
}: ProductCardProps) {
  const hasDiscount = product.mrp > product.price;
  const discountAmount = hasDiscount ? product.mrp - product.price : 0;
  
  // Seed a realistic random star rating and review count based on product id
  const ratingHash = (product.id.charCodeAt(product.id.length - 1) % 4) + 6; // results in 6-9
  const rating = (4 + ratingHash / 10).toFixed(1); // results in 4.6 - 4.9
  const reviewsHash = (product.id.charCodeAt(0) * 45) % 150;
  const reviewsCount = `${(reviewsHash / 10 + 1).toFixed(1)}k`; // e.g. 7.5k

  return (
    <div className="bg-white rounded-2xl p-2 relative flex flex-col justify-between transition-all hover:shadow-md border border-gray-100/30 group">
      
      {/* Favorite Heart Button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onToggleFavorite(product.id);
        }}
        className="absolute top-2 left-2 z-20 p-1.5 bg-white/90 hover:bg-white text-gray-400 hover:text-red-500 rounded-full shadow-xs border border-gray-100 transition-all opacity-0 group-hover:opacity-100 focus:opacity-100"
      >
        <Heart size={14} className={isFavorite ? 'fill-red-500 stroke-red-500' : ''} />
      </button>

      {/* Image Area (Relative container) */}
      <div className="relative aspect-square w-full rounded-xl bg-gray-50 flex items-center justify-center overflow-hidden mb-2 border border-gray-100/50">
        <img
          src={product.image_url}
          alt={product.name}
          onClick={() => onProductClick(product)}
          className="object-cover w-full h-full cursor-pointer hover:scale-102 transition-transform duration-200"
          loading="lazy"
        />
        {product.stock <= 0 && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <span className="bg-red-600 text-white text-[9px] font-black px-2.5 py-1 rounded-md uppercase tracking-wider">
              Out of stock
            </span>
          </div>
        )}

        {/* Absolute ADD Button sitting on the bottom-right corner of the image container (Zepto Style) */}
        {product.stock > 0 && (
          <div className="absolute bottom-1.5 right-1.5 z-10">
            {quantityInCart > 0 ? (
              <div className="flex items-center justify-between bg-[#1e7e34] text-white rounded-xl shadow-md px-2 py-1.5 min-w-[76px]">
                <button
                  onClick={() => onRemoveFromCart(product.id, product.is_flash_deal)}
                  className="hover:bg-white/10 p-0.5 rounded transition-colors"
                >
                  <Minus size={13} className="stroke-[3.5px]" />
                </button>
                <span className="text-xs font-black">{quantityInCart}</span>
                <button
                  onClick={() => onAddToCart(product)}
                  disabled={product.is_flash_deal || quantityInCart >= product.stock}
                  className={`hover:bg-white/10 p-0.5 rounded transition-colors ${
                    product.is_flash_deal 
                      ? 'opacity-0 pointer-events-none' 
                      : 'disabled:opacity-20'
                  }`}
                >
                  <Plus size={13} className="stroke-[3.5px]" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => onAddToCart(product)}
                className="bg-white border border-[#1e7e34]/80 text-[#1e7e34] hover:bg-green-50 font-black text-xs px-3.5 py-1.5 rounded-xl shadow-xs flex items-center justify-center space-x-0.5 min-w-[72px] transition-all cursor-pointer active:scale-95"
              >
                <span>ADD</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Product Details below */}
      <div className="flex-1 flex flex-col justify-between pt-1">
        <div 
          onClick={() => onProductClick(product)}
          className="cursor-pointer"
        >
          {/* Prices Area */}
          <div className="flex flex-wrap items-baseline gap-1">
            {/* Price badge (Green pill with white text - Zepto Style) */}
            <span className="text-xs font-extrabold bg-[#1e7e34] text-white px-2 py-0.5 rounded-md">
              ₹{quantityInCart > 0 ? product.price * quantityInCart : product.price}
            </span>
            {quantityInCart > 1 && (
              <span className="text-[9px] text-gray-500 font-medium">
                (₹{product.price}/ea)
              </span>
            )}
            {hasDiscount && (
              <span className="text-[11px] text-gray-400 line-through">
                ₹{quantityInCart > 0 ? product.mrp * quantityInCart : product.mrp}
              </span>
            )}
          </div>

          {/* Discount Tag (e.g. ₹12 OFF) */}
          {hasDiscount ? (
            <span className="text-[10px] text-[#1e7e34] font-black block mt-0.5">
              ₹{quantityInCart > 0 ? discountAmount * quantityInCart : discountAmount} OFF
            </span>
          ) : (
            <span className="text-[10px] text-transparent select-none block mt-0.5">
              No Discount
            </span>
          )}
          
          {/* Title */}
          <h3 className="text-xs font-bold text-gray-800 line-clamp-2 mt-1.5 min-h-[32px] leading-snug">
            {product.name}
          </h3>

          {/* Unit Size */}
          <p className="text-[10px] text-gray-400 font-medium mt-1 leading-none">
            {product.unit} {product.weight_range}
          </p>

          {/* Zepto Style Ratings & Reviews */}
          {/* <div className="flex items-center space-x-1 mt-1.5 text-[10px] text-gray-500 font-medium">
            <span className="flex items-center text-green-700 bg-green-50 px-1 rounded font-bold shrink-0">
              <Star size={10} className="fill-green-700 stroke-green-700 mr-0.5" />
              {rating}
            </span>
            <span className="text-gray-300">|</span>
            <span className="truncate">({reviewsCount})</span>
          </div> */}
        </div>
      </div>
    </div>
  );
}
