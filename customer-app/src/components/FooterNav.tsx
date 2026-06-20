'use client';

import React from 'react';
import { Home, ShoppingBag, User } from 'lucide-react';

// Custom SVG icon matching the user's category layout (3 squares + 1 green plus)
function CategoryIcon({ size = 26, className }: { size?: number; className?: string }) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2.2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      {/* Three rounded squares */}
      <rect x="3" y="3" width="7" height="7" rx="2" />
      <rect x="14" y="3" width="7" height="7" rx="2" />
      <rect x="3" y="14" width="7" height="7" rx="2" />
      
      {/* Bottom right green plus */}
      <path 
        d="M17.5 14v7M14 17.5h7" 
        stroke="#1e7e34" 
        strokeWidth="3"
      />
    </svg>
  );
}

export type TabType = 'home' | 'categories' | 'cart' | 'profile';

interface FooterNavProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  cartItemCount: number;
  className?: string;
}

export default function FooterNav({ activeTab, setActiveTab, cartItemCount, className = '' }: FooterNavProps) {
  const tabs = [
    { id: 'home' as TabType, label: 'Home', icon: Home },
    { id: 'categories' as TabType, label: 'Categories', icon: CategoryIcon as any },
    { id: 'cart' as TabType, label: 'Cart', icon: ShoppingBag, badge: cartItemCount },
    { id: 'profile' as TabType, label: 'Profile', icon: User },
  ];

  return (
    <nav className={`fixed bottom-0 left-0 right-0 z-[60] bg-white border-t border-gray-100 shadow-lg md:hidden pb-[env(safe-area-inset-bottom)] transition-transform duration-300 ease-in-out ${className}`}>
      <div className="mx-auto max-w-md flex justify-around py-1.5 px-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-col items-center py-0.5 px-3 rounded-xl transition-all relative ${
                isActive ? 'text-[#1e7e34] scale-105' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <div className="relative p-1">
                <Icon size={26} className={isActive ? 'stroke-[2.5px]' : 'stroke-[1.8px]'} />
                {!!tab.badge && (
                  <span className="absolute -top-1.5 -right-2 bg-red-500 text-white text-[9px] font-bold w-4.5 h-4.5 rounded-full flex items-center justify-center border border-white animate-bounce">
                    {tab.badge}
                  </span>
                )}
              </div>
              <span className="text-[9.5px] font-semibold mt-0.5">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

// 'use client';

// import React, { useEffect, useRef, useState } from 'react';
// import { Home, ShoppingBag, User } from 'lucide-react';

// // Custom SVG icon matching the user's category layout
// function CategoryIcon({
//   size = 26,
//   className,
// }: {
//   size?: number;
//   className?: string;
// }) {
//   return (
//     <svg
//       width={size}
//       height={size}
//       viewBox="0 0 24 24"
//       fill="none"
//       stroke="currentColor"
//       strokeWidth="2.2"
//       strokeLinecap="round"
//       strokeLinejoin="round"
//       className={className}
//     >
//       {/* Three rounded squares */}
//       <rect x="3" y="3" width="7" height="7" rx="2" />
//       <rect x="14" y="3" width="7" height="7" rx="2" />
//       <rect x="3" y="14" width="7" height="7" rx="2" />

//       {/* Bottom right green plus */}
//       <path
//         d="M17.5 14v7M14 17.5h7"
//         stroke="#1e7e34"
//         strokeWidth="3"
//       />
//     </svg>
//   );
// }

// export type TabType = 'home' | 'categories' | 'cart' | 'profile';

// interface FooterNavProps {
//   activeTab: TabType;
//   setActiveTab: (tab: TabType) => void;
//   cartItemCount: number;
//   className?: string;
// }

// export default function FooterNav({
//   activeTab,
//   setActiveTab,
//   cartItemCount,
//   className = '',
// }: FooterNavProps) {
//   const tabs = [
//     { id: 'home' as TabType, label: 'Home', icon: Home },
//     {
//       id: 'categories' as TabType,
//       label: 'Categories',
//       icon: CategoryIcon as any,
//     },
//     {
//       id: 'cart' as TabType,
//       label: 'Cart',
//       icon: ShoppingBag,
//       badge: cartItemCount,
//     },
//     { id: 'profile' as TabType, label: 'Profile', icon: User },
//   ];

//   return (
//     <nav
//       className={`
//         fixed bottom-0 left-0 right-0
//         z-[60]
//         bg-[#74B14E]
  
//         border-t border-gray-100
//         shadow-lg
//         md:hidden
//         pb-[env(safe-area-inset-bottom)]
//         transition-transform duration-300 ease-in-out
//         ${className}
//       `}
//     >
//       <div className="mx-auto max-w-md flex justify-around py-1.5 px-1">
//         {tabs.map((tab) => {
//           const Icon = tab.icon;
//           const isActive = activeTab === tab.id;

//           return (
//             <button
//               key={tab.id}
//               onClick={() => setActiveTab(tab.id)}
//               className={`flex flex-col items-center py-0.5 px-3 rounded-xl transition-all relative ${
//                 isActive
//                   ? 'text-[#1e7e34] scale-105'
//                   : 'text-gray-400 hover:text-gray-600'
//               }`}
//             >
//               <div className="relative p-1">
//                 <Icon
//                   size={26}
//                   className={isActive ? 'stroke-[2.5px]' : 'stroke-[1.8px]'}
//                 />

//                 {!!tab.badge && (
//                   <span className="absolute -top-1.5 -right-2 bg-red-500 text-white text-[9px] font-bold w-5 h-5 rounded-full flex items-center justify-center border border-white animate-bounce">
//                     {tab.badge}
//                   </span>
//                 )}
//               </div>

//               <span className="text-[9.5px] font-semibold mt-0.5">
//                 {tab.label}
//               </span>
//             </button>
//           );
//         })}
//       </div>
//     </nav>
//   );
// }