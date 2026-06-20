'use client';

import React, { useState, useEffect, useRef } from 'react';
import Header from '../components/Header';
import FooterNav, { TabType } from '../components/FooterNav';
import Footer from '../components/Footer';
import ProductCard from '../components/ProductCard';
import CartDrawer from '../components/CartDrawer';
import AddressModal from '../components/AddressModal';
import CheckoutModal from '../components/CheckoutModal';
import ProductDetailsModal from '../components/ProductDetailsModal';
import ProfileView from '../components/ProfileView';
import { Product, Address, dbService, BillingConfig, Coupon, Category } from '../utils/db';
import LoginView from '../components/LoginView';
import { ShoppingBag, ArrowRight, Sparkles, Gift, ChevronLeft, ChevronRight } from 'lucide-react';

interface ProductCountdownProps {
  endTime?: string;
}

function ProductCountdown({ endTime }: ProductCountdownProps) {
  const [timeLeft, setTimeLeft] = useState({ hours: '00', minutes: '00', seconds: '00' });

  useEffect(() => {
    const updateTimer = () => {
      const now = new Date();
      let targetTime = new Date();
      if (endTime) {
        targetTime = new Date(endTime);
      } else {
        targetTime.setHours(23, 59, 59, 999);
      }
      const diff = targetTime.getTime() - now.getTime();
      if (diff <= 0) {
        setTimeLeft({ hours: '00', minutes: '00', seconds: '00' });
        return;
      }
      const h = Math.floor(diff / (1000 * 60 * 60));
      const m = Math.floor((diff / (1000 * 60)) % 60);
      const s = Math.floor((diff / 1000) % 60);
      setTimeLeft({
        hours: String(h).padStart(2, '0'),
        minutes: String(m).padStart(2, '0'),
        seconds: String(s).padStart(2, '0'),
      });
    };
    updateTimer();
    const timerId = setInterval(updateTimer, 1000);
    return () => clearInterval(timerId);
  }, [endTime]);

  return (
    <div className="flex flex-col justify-center min-h-[44px]">
      <div className="flex items-center gap-1.5 justify-center">
        <span className="text-[10px] font-extrabold text-neutral-800 tracking-tight uppercase flex items-center gap-1">
          <span>⏰</span> ENDS IN:
        </span>
        <div className="flex items-center font-mono text-xs">
          <span className="bg-neutral-800 text-white px-1.5 py-0.5 rounded font-bold shadow-xs">{timeLeft.hours}</span>
          <span className="text-neutral-800 px-0.5 font-bold animate-pulse">:</span>
          <span className="bg-neutral-800 text-white px-1.5 py-0.5 rounded font-bold shadow-xs">{timeLeft.minutes}</span>
          <span className="text-neutral-800 px-0.5 font-bold animate-pulse">:</span>
          <span className="bg-neutral-800 text-white px-1.5 py-0.5 rounded font-bold shadow-xs">{timeLeft.seconds}</span>
        </div>
      </div>
    </div>
  );
}

interface BannerSliderProps {
  banners: string[];
}

function BannerSlider({ banners }: BannerSliderProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  const minSwipeDistance = 50;

  useEffect(() => {
    if (banners.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % banners.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [banners.length, currentIndex]);

  if (banners.length === 0) return null;

  const handleNext = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % banners.length);
  };

  const handlePrev = () => {
    setCurrentIndex((prevIndex) => (prevIndex - 1 + banners.length) % banners.length);
  };

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;
    if (isLeftSwipe) {
      handleNext();
    }
    if (isRightSwipe) {
      handlePrev();
    }
  };

  return (
    <div className="w-full">
      {/* Desktop Version */}
      <div className="hidden md:block">
        {banners.length === 1 && (
          <div className="w-full rounded-3xl overflow-hidden border border-gray-100 shadow-xs animate-fade-in bg-white select-none">
            <img
              src={banners[0]}
              alt="Special Offer"
              className="w-full h-auto object-cover max-h-[380px]"
            />
          </div>
        )}
        {banners.length === 2 && (
          <div className="grid grid-cols-2 gap-4 w-full animate-fade-in">
            {banners.map((banner, idx) => (
              <div key={idx} className="rounded-3xl overflow-hidden border border-gray-100 shadow-xs bg-white select-none">
                <img
                  src={banner}
                  alt={`Special Offer ${idx + 1}`}
                  className="w-full h-auto object-cover max-h-[300px]"
                />
              </div>
            ))}
          </div>
        )}
        {banners.length > 2 && (
          <div 
            className="relative w-full rounded-3xl overflow-hidden border border-gray-100 shadow-xs bg-white select-none group/slider"
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
          >
            <div
              className="flex transition-transform duration-700 ease-in-out"
              style={{ transform: `translateX(-${currentIndex * 100}%)` }}
            >
              {banners.map((banner, idx) => (
                <div key={idx} className="w-full flex-shrink-0">
                  <img
                    src={banner}
                    alt={`Special Offer ${idx + 1}`}
                    className="w-full h-auto object-cover max-h-[380px]"
                  />
                </div>
              ))}
            </div>

            {/* Left/Right Navigation Chevrons */}
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); handlePrev(); }}
              className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/30 hover:bg-black/60 text-white flex items-center justify-center transition-all opacity-0 group-hover/slider:opacity-100 shadow-md backdrop-blur-xs cursor-pointer z-10 border border-white/10"
            >
              <ChevronLeft size={22} />
            </button>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); handleNext(); }}
              className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/30 hover:bg-black/60 text-white flex items-center justify-center transition-all opacity-0 group-hover/slider:opacity-100 shadow-md backdrop-blur-xs cursor-pointer z-10 border border-white/10"
            >
              <ChevronRight size={22} />
            </button>

            {/* Dots indicator */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-2 z-10">
              {banners.map((_, idx) => (
                <button
                  key={idx}
                  onClick={(e) => { e.stopPropagation(); setCurrentIndex(idx); }}
                  className={`w-2 h-2 rounded-full transition-all ${
                    currentIndex === idx ? 'bg-white w-4' : 'bg-white/50'
                  }`}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Mobile/Small Screen Version */}
      <div className="block md:hidden">
        {banners.length === 1 ? (
          <div className="w-full rounded-2xl overflow-hidden border border-gray-100 shadow-xs animate-fade-in bg-white select-none">
            <img
              src={banners[0]}
              alt="Special Offer"
              className="w-full h-auto object-cover max-h-[200px]"
            />
          </div>
        ) : (
          <div 
            className="relative w-full rounded-2xl overflow-hidden border border-gray-100 shadow-xs bg-white select-none"
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
          >
            <div
              className="flex transition-transform duration-700 ease-in-out"
              style={{ transform: `translateX(-${currentIndex * 100}%)` }}
            >
              {banners.map((banner, idx) => (
                <div key={idx} className="w-full flex-shrink-0">
                  <img
                    src={banner}
                    alt={`Special Offer ${idx + 1}`}
                    className="w-full h-auto object-cover max-h-[200px]"
                  />
                </div>
              ))}
            </div>
            {/* Dots indicator */}
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex space-x-1.5 z-10">
              {banners.map((_, idx) => (
                <button
                  key={idx}
                  onClick={(e) => { e.stopPropagation(); setCurrentIndex(idx); }}
                  className={`w-1.5 h-1.5 rounded-full transition-all ${
                    currentIndex === idx ? 'bg-[#1e7e34] w-3.5' : 'bg-gray-300'
                  }`}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
export const validateCartItems = (
  cartItems: { product: Product; quantity: number }[],
  prodList: Product[]
): { product: Product; quantity: number }[] => {
  if (!prodList || prodList.length === 0) return cartItems;

  const regSub = cartItems.reduce((acc, item) => {
    const freshProduct = prodList.find((p) => p.id === item.product.id);
    if (!freshProduct) return acc;
    const isDealActive = freshProduct.is_flash_deal &&
      (!freshProduct.flash_deal_end_time || new Date(freshProduct.flash_deal_end_time).getTime() > Date.now());
    if (item.product.is_flash_deal && isDealActive) return acc;
    const currentRegularPrice = freshProduct.is_flash_deal ? freshProduct.mrp : freshProduct.price;
    return acc + currentRegularPrice * item.quantity;
  }, 0);

  return cartItems
    .map((item) => {
      const freshProduct = prodList.find((p) => p.id === item.product.id);
      if (freshProduct) {
        const isDealActive = freshProduct.is_flash_deal &&
          (!freshProduct.flash_deal_end_time || new Date(freshProduct.flash_deal_end_time).getTime() > Date.now());
        const isFlashItem = !!item.product.is_flash_deal && isDealActive;
        const maxQty = isFlashItem ? 1 : freshProduct.stock;

        const syncedPrice = isFlashItem
          ? freshProduct.price
          : (freshProduct.is_flash_deal ? freshProduct.mrp : freshProduct.price);

        return {
          product: {
            ...freshProduct,
            is_flash_deal: isFlashItem,
            price: syncedPrice
          },
          quantity: Math.min(item.quantity, maxQty),
        };
      }
      return item;
    })
    .filter((item) => {
      const freshProduct = prodList.find((p) => p.id === item.product.id);
      if (!freshProduct || !freshProduct.is_available || freshProduct.stock <= 0) return false;
      if (item.product.is_flash_deal) {
        const threshold = item.product.flash_deal_threshold || 0;
        return regSub >= threshold;
      }
      return true;
    });
};

export default function Home() {
  const [activeTab, setActiveTab] = useState<TabType>('home');
  const [products, setProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [currentUser, setCurrentUser] = useState<{ name: string; phone: string } | null>(null);
  const [customAlert, setCustomAlert] = useState<string | null>(null);

  const [showBottomNav, setShowBottomNav] = useState(true);
  const mainRef = useRef<HTMLDivElement | null>(null);
  const lastScrollY = useRef(0);

  // Cart state
  const [cart, setCart] = useState<{ product: Product; quantity: number }[]>([]);
  const isCartLoaded = useRef(false);
  const lastLoadedUserPhone = useRef<string>('');
  const lastCartModifiedRef = useRef<number>(0);
  const isCheckoutModalOpenRef = useRef<boolean>(false);

  // Load saved cart from localStorage on mount and when user changes
  useEffect(() => {
    const userPhone = currentUser?.phone || 'guest';
    const key = `geniefarm_cart_${userPhone}`;
    const savedCart = localStorage.getItem(key);
    let loadedCart = [];
    if (savedCart) {
      try {
        loadedCart = JSON.parse(savedCart);
      } catch (e) {
        console.error('Failed to parse saved cart:', e);
      }
    }

    if (currentUser && lastLoadedUserPhone.current === 'guest' && cart.length > 0) {
      const mergedCart = [...cart];
      loadedCart.forEach((uItem: any) => {
        const existing = mergedCart.find(
          (mItem) => mItem.product.id === uItem.product.id && !!mItem.product.is_flash_deal === !!uItem.product.is_flash_deal
        );
        if (existing) {
          existing.quantity = Math.min(existing.product.stock, existing.quantity + uItem.quantity);
        } else {
          mergedCart.push(uItem);
        }
      });
      const validated = validateCartItems(mergedCart, products);
      setCart(validated);
      localStorage.setItem(key, JSON.stringify(validated));
    } else {
      const validated = validateCartItems(loadedCart, products);
      setCart(validated);
    }

    lastLoadedUserPhone.current = userPhone;
    isCartLoaded.current = true;
  }, [currentUser]);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    if (!isCartLoaded.current) return;
    const userPhone = currentUser?.phone || 'guest';
    if (lastLoadedUserPhone.current === userPhone) {
      const key = `geniefarm_cart_${userPhone}`;
      localStorage.setItem(key, JSON.stringify(cart));
    }
  }, [cart]);


  // Modals & Drawers state
  const [activeAddress, setActiveAddress] = useState<Address | null>(null);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
  const [orderPlacedSuccess, setOrderPlacedSuccess] = useState(false);
  const [isCartDrawerOpen, setIsCartDrawerOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [returnToCheckoutAfterAddress, setReturnToCheckoutAfterAddress] = useState(false);

  useEffect(() => {
    isCheckoutModalOpenRef.current = isCheckoutModalOpen;
  }, [isCheckoutModalOpen]);

  // Automatically return to checkout modal when address selector closes
  useEffect(() => {
    if (!isAddressModalOpen && returnToCheckoutAfterAddress) {
      setReturnToCheckoutAfterAddress(false);
      setIsCheckoutModalOpen(true);
    }
  }, [isAddressModalOpen, returnToCheckoutAfterAddress]);

  // Category filter state
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedCategoryDetail, setSelectedCategoryDetail] = useState<string | null>(null);

  // Favorites state
  const [favorites, setFavorites] = useState<string[]>([]);
  const isFavoritesLoaded = useRef(false);
  const lastLoadedFavPhone = useRef<string>('');

  // Load saved favorites when user changes
  useEffect(() => {
    const userPhone = currentUser?.phone || 'guest';
    const key = `geniefarm_favorites_${userPhone}`;
    const savedFavs = localStorage.getItem(key);
    if (savedFavs) {
      try {
        setFavorites(JSON.parse(savedFavs));
      } catch (e) {
        console.error('Failed to parse saved favorites:', e);
        setFavorites([]);
      }
    } else {
      // Fallback to global favorites for guests or first load
      const globalFavs = localStorage.getItem('geniefarm_favorites');
      if (globalFavs && userPhone === 'guest') {
        try {
          setFavorites(JSON.parse(globalFavs));
        } catch (e) {
          setFavorites([]);
        }
      } else {
        setFavorites([]);
      }
    }
    lastLoadedFavPhone.current = userPhone;
    isFavoritesLoaded.current = true;
  }, [currentUser]);

  // Save favorites whenever they change
  useEffect(() => {
    if (!isFavoritesLoaded.current) return;
    const userPhone = currentUser?.phone || 'guest';
    if (lastLoadedFavPhone.current === userPhone) {
      const key = `geniefarm_favorites_${userPhone}`;
      localStorage.setItem(key, JSON.stringify(favorites));
      // Keep legacy global key in sync for guests
      if (userPhone === 'guest') {
        localStorage.setItem('geniefarm_favorites', JSON.stringify(favorites));
      }
    }
  }, [favorites]);

  // Refresh trigger for Profile order list
  const [profileRefreshTrigger, setProfileRefreshTrigger] = useState(0);

  // Billing and Coupons state
  const [billingConfig, setBillingConfig] = useState<BillingConfig>({
    delivery_fee: 15,
    delivery_free_threshold: 199,
    platform_fee: 2,
    gst_fee: 0,
    delivery_fee_enabled: true,
    platform_fee_enabled: true,
    gst_enabled: false,
    support_email: "mygeniefarm@gmail.com",
    support_phone: "+919509122472",
    support_phone_formatted: "+91 9509122472",
    delivery_slot: "6 AM - 8 AM",
    default_city: "Bhiwadi, Khairthal"
  });
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);

  // Re-validate applied coupon whenever the cart, coupons list, or applied coupon changes
  useEffect(() => {
    if (appliedCoupon) {
      const subTotal = cart.reduce((acc, item) => acc + item.product.price * item.quantity, 0);
      const matched = coupons.find(c => c.id === appliedCoupon.id && c.is_active);
      if (!matched || subTotal < matched.min_order_value) {
        if (matched && subTotal < matched.min_order_value) {
          alert(`Coupon ${appliedCoupon.code} was automatically removed because your order subtotal is below ₹${matched.min_order_value}.`);
        }
        setAppliedCoupon(null);
      }
    }
  }, [cart, coupons, appliedCoupon]);

  // Clear coupon state if cart becomes empty
  useEffect(() => {
    if (cart.length === 0) {
      setAppliedCoupon(null);
    }
  }, [cart]);

  // Function to load dynamic data from DB (runs initially and polls periodically for auto-refresh)
  const loadDynamicData = async () => {
    try {
      const prodList = await dbService.getProducts();
      setProducts(prodList);

      // Sync cart items with fresh product data, but skip validation during active checkout or rapid cart edits to prevent quantity reset glitches
      const isCheckoutOpen = isCheckoutModalOpenRef.current;
      const isCartBusy = Date.now() - lastCartModifiedRef.current < 5000;
      if (!isCheckoutOpen && !isCartBusy) {
        setCart((prevCart) => validateCartItems(prevCart, prodList));
      }

      const config = await dbService.getBillingConfig();
      setBillingConfig(config);

      const couponList = await dbService.getCoupons();
      setCoupons(couponList);

      try {
        const catList = await dbService.getCategories();
        setCategories(catList);
      } catch (catErr) {
        console.error('Failed to load categories in page:', catErr);
      }
    } catch (e: any) {
      console.error('Failed to load dynamic data:', e);
      try {
        fetch('/api/db', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'log',
            data: {
              type: 'loadDynamicData_error',
              message: String(e.message || e),
              stack: String(e.stack || '')
            }
          })
        });
      } catch (logErr) { }
    }
  };

  // Load/update addresses whenever currentUser changes
  useEffect(() => {
    loadAddresses();
  }, [currentUser]);

  // Track history state to support device hardware/system back button
  useEffect(() => {
    const hasActiveSubView =
      isAddressModalOpen ||
      isCheckoutModalOpen ||
      isCartDrawerOpen ||
      !!selectedProduct ||
      !!selectedCategoryDetail ||
      activeTab !== 'home';

    if (hasActiveSubView) {
      if (window.history.state?.modalOpen !== true) {
        window.history.pushState({ modalOpen: true }, '');
      }
    }
  }, [
    isAddressModalOpen,
    isCheckoutModalOpen,
    isCartDrawerOpen,
    selectedProduct,
    selectedCategoryDetail,
    activeTab
  ]);

  // Handle browser/device back button press (popstate)
  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      // If the back button was pressed, close active modals/subviews in priority order
      if (isAddressModalOpen) {
        setIsAddressModalOpen(false);
      } else if (isCheckoutModalOpen) {
        setIsCheckoutModalOpen(false);
        if (orderPlacedSuccess) {
          setOrderPlacedSuccess(false);
          setActiveTab('home');
        }
      } else if (isCartDrawerOpen) {
        setIsCartDrawerOpen(false);
      } else if (selectedProduct) {
        setSelectedProduct(null);
      } else if (selectedCategoryDetail) {
        setSelectedCategoryDetail(null);
      } else if (activeTab !== 'home') {
        setActiveTab('home');
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [
    isAddressModalOpen,
    isCheckoutModalOpen,
    orderPlacedSuccess,
    isCartDrawerOpen,
    selectedProduct,
    selectedCategoryDetail,
    activeTab
  ]);

  // Sync manual modal closes/nav back to browser history stack
  useEffect(() => {
    const hasActiveSubView =
      isAddressModalOpen ||
      isCheckoutModalOpen ||
      isCartDrawerOpen ||
      !!selectedProduct ||
      !!selectedCategoryDetail ||
      activeTab !== 'home';

    if (!hasActiveSubView && window.history.state?.modalOpen === true) {
      window.history.back();
    }
  }, [
    isAddressModalOpen,
    isCheckoutModalOpen,
    isCartDrawerOpen,
    selectedProduct,
    selectedCategoryDetail,
    activeTab
  ]);

  // Setup initial load and 4-second auto refresh polling
  useEffect(() => {
    const originalAlert = window.alert;
    window.alert = (message: any) => {
      setCustomAlert(String(message));
    };

    const savedUser = localStorage.getItem('geniefarm_user');
    if (savedUser) {
      try {
        setCurrentUser(JSON.parse(savedUser));
      } catch (e) {
        console.error('Failed to parse saved user:', e);
      }
    }

    loadDynamicData();

    const interval = setInterval(loadDynamicData, 4000);
    return () => {
      window.alert = originalAlert;
      clearInterval(interval);
    };
  }, []);

  // Scroll tracking to hide/show bottom navigation bar and floating cart bar
  useEffect(() => {
    const mainEl = mainRef.current;

    const handleScroll = () => {
      const windowScroll = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0;
      const mainScroll = mainEl ? mainEl.scrollTop : 0;
      const currentScrollY = Math.max(windowScroll, mainScroll);

      // Ignore tiny movements
      if (Math.abs(currentScrollY - lastScrollY.current) < 10) return;

      // Always show near top
      if (currentScrollY <= 40) {
        setShowBottomNav(true);
      } else if (currentScrollY > lastScrollY.current) {
        setShowBottomNav(false);
      } else {
        setShowBottomNav(true);
      }

      lastScrollY.current = currentScrollY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    if (mainEl) {
      mainEl.addEventListener('scroll', handleScroll, { passive: true });
    }

    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (mainEl) {
        mainEl.removeEventListener('scroll', handleScroll);
      }
    };
  }, []);

  // Show bottom nav when switching tabs or closing subviews
  useEffect(() => {
    setShowBottomNav(true);
  }, [activeTab, selectedCategoryDetail, isCartDrawerOpen, isAddressModalOpen, isCheckoutModalOpen, selectedProduct]);



  const handleAddToCart = (product: Product) => {
    lastCartModifiedRef.current = Date.now();
    if (product.is_flash_deal) {
      const regSub = cart.reduce((acc, item) => {
        if (item.product.is_flash_deal) return acc;
        return acc + item.product.price * item.quantity;
      }, 0);
      const threshold = product.flash_deal_threshold || 0;
      if (regSub < threshold) {
        alert(`Unlock this deal by adding ₹${threshold - regSub} more of other fresh fruits or vegetables to your cart!`);
        return;
      }

      // Limit flash deal items to 1 unit maximum
      const existing = cart.find((item) => item.product.id === product.id && item.product.is_flash_deal);
      if (existing && existing.quantity >= 1) {
        alert(`Limit reached: You can only claim a maximum of 1 unit of each flash deal item.`);
        return;
      }
    }

    setCart((prevCart) => {
      const existing = prevCart.find(
        (item) => item.product.id === product.id && !!item.product.is_flash_deal === !!product.is_flash_deal
      );
      let updatedCart;
      if (existing) {
        if (existing.quantity >= product.stock) {
          alert(`Only ${product.stock} units of ${product.name} are available in stock.`);
          return prevCart;
        }
        updatedCart = prevCart.map((item) =>
          item.product.id === product.id && !!item.product.is_flash_deal === !!product.is_flash_deal
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      } else {
        updatedCart = [...prevCart, { product, quantity: 1 }];
      }
      return validateCartItems(updatedCart, products);
    });
  };

  const handleRemoveFromCart = (productId: string, isFlash?: boolean) => {
    lastCartModifiedRef.current = Date.now();
    setCart((prevCart) => {
      const existing = prevCart.find(
        (item) => item.product.id === productId && !!item.product.is_flash_deal === !!isFlash
      );
      let updatedCart;
      if (existing && existing.quantity > 1) {
        updatedCart = prevCart.map((item) =>
          item.product.id === productId && !!item.product.is_flash_deal === !!isFlash
            ? { ...item, quantity: item.quantity - 1 }
            : item
        );
      } else {
        updatedCart = prevCart.filter(
          (item) => !(item.product.id === productId && !!item.product.is_flash_deal === !!isFlash)
        );
      }
      return validateCartItems(updatedCart, products);
    });
  };

  const handleToggleFavorite = (productId: string) => {
    setFavorites((prev) => {
      const next = prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : [...prev, productId];
      return next;
    });
  };

  const loadAddresses = async (userPhoneOverride?: string) => {
    try {
      const activePhone = userPhoneOverride || currentUser?.phone;
      const addrList = await dbService.getAddresses();

      if (activePhone) {
        // Logged in user: filter addresses by their phone number
        const userAddresses = addrList.filter(a => a.phone === activePhone);
        setAddresses(userAddresses);

        // Retrieve persisted active address from localStorage
        const savedActiveStr = localStorage.getItem('geniefarm_active_address');
        let active: Address | null = null;

        if (savedActiveStr) {
          try {
            const parsed = JSON.parse(savedActiveStr) as Address;
            if (parsed && parsed.phone === activePhone) {
              const fresh = userAddresses.find(a => a.id === parsed.id);
              active = fresh || parsed;
            }
          } catch (e) {
            console.error('Failed to parse saved active address:', e);
          }
        }

        if (!active) {
          // Fallback to default address, then first address, then null
          active = userAddresses.find(a => a.is_default) || userAddresses[0] || null;
          if (active) {
            localStorage.setItem('geniefarm_active_address', JSON.stringify(active));
          } else {
            localStorage.removeItem('geniefarm_active_address');
          }
        } else {
          localStorage.setItem('geniefarm_active_address', JSON.stringify(active));
        }
        setActiveAddress(active);
      } else {
        // Guest user: show empty addresses list
        setAddresses([]);

        // For active address, use localStorage if exists
        const savedActiveStr = localStorage.getItem('geniefarm_active_address');
        let active: Address | null = null;
        if (savedActiveStr) {
          try {
            active = JSON.parse(savedActiveStr) as Address;
          } catch (e) {
            console.error('Failed to parse saved active address for guest:', e);
          }
        }
        setActiveAddress(active);
      }
    } catch (e) {
      console.error('Failed to load addresses:', e);
    }
  };

  const handleAddressSelect = (addr: Address) => {
    setActiveAddress(addr);
    localStorage.setItem('geniefarm_active_address', JSON.stringify(addr));
  };

  const handleAddressDelete = async (addressId: string) => {
    const success = await dbService.deleteAddress(addressId);
    if (success) {
      await loadAddresses();
    } else {
      alert('Failed to delete address.');
    }
  };

  const handleAddressSaved = async (address: Address) => {
    let activePhone = currentUser?.phone || '';
    if (!currentUser) {
      const user = { name: address.name, phone: address.phone };
      localStorage.setItem('geniefarm_user', JSON.stringify(user));
      setCurrentUser(user);
      activePhone = address.phone;
    }
    localStorage.setItem('geniefarm_active_address', JSON.stringify(address));
    setActiveAddress(address);
    await loadAddresses(activePhone);
    setIsAddressModalOpen(false);
  };

  const handleOrderPlaced = () => {
    setCart([]); // Clear cart immediately
    setAppliedCoupon(null); // Clear coupon
    setOrderPlacedSuccess(true);
    setProfileRefreshTrigger((prev) => prev + 1); // Refresh profile orders list
  };

  const handleOrderSuccess = () => {
    setCart([]); // Clear cart
    setProfileRefreshTrigger((prev) => prev + 1); // Refresh profile orders list
    setActiveTab('home'); // Switch to home tab
    setOrderPlacedSuccess(false);
  };

  // Calculations
  const cartItemCount = cart.reduce((acc, item) => acc + item.quantity, 0);
  const cartTotal = cart.reduce((acc, item) => acc + item.product.price * item.quantity, 0);
  const regularSubTotal = cart.reduce((acc, item) => {
    if (item.product.is_flash_deal) return acc;
    return acc + item.product.price * item.quantity;
  }, 0);

  // Filter products by category and search query
  const filteredProducts = products.filter((p) => {
    const matchesCategory =
      activeTab === 'home' ||
      selectedCategory === 'All' ||
      p.category === selectedCategory ||
      (p.sub_category && p.sub_category.toLowerCase() === selectedCategory.toLowerCase());
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.sub_category &&
        p.sub_category.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  // Flash deal products
  const flashDeals = products.filter((p) => {
    if (!p.is_flash_deal || !p.is_available) return false;
    if (p.flash_deal_end_time) {
      const isExpired = new Date(p.flash_deal_end_time).getTime() <= Date.now();
      if (isExpired) return false;
    }
    return true;
  });

  return (
    <div className="flex-1 flex flex-col bg-gray-50 min-h-screen text-gray-800">

      {/* 1. Header (Static top) */}
      {activeTab !== 'profile' && (
        <Header
          activeAddress={activeAddress}
          onAddressClick={() => setIsAddressModalOpen(true)}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          cartItemCount={cartItemCount}
          onCartClick={() => setIsCartDrawerOpen(true)}
          activeTab={activeTab}
          setActiveTab={(tab) => {
            setActiveTab(tab);
            setSelectedCategoryDetail(null);
          }}
          billingConfig={billingConfig}
          categories={categories}
        />
      )}

      {/* 2. Main Scrollable Container */}
      <main ref={mainRef} className="flex-1 overflow-y-auto pb-20 md:pb-6 w-full max-w-[1400px] mx-auto px-2 md:px-8 mt-4">
        {activeTab === 'home' ? (
          <div className="px-1 py-4 space-y-5">
             {/* Promo Discount Card Banner */}
            {(() => {
              const rawBanners = billingConfig.discount_banners || (billingConfig.discount_card ? [billingConfig.discount_card] : []);
              const banners = rawBanners.filter(Boolean);
              return <BannerSlider banners={banners} />;
            })()}

            {/* Flash Deals section */}
            {flashDeals.length > 0 && (
              <div className="space-y-3 w-full">
                <div className="flex justify-between items-center">
                  <h2 className="text-xs md:text-sm font-extrabold text-gray-900 flex items-center space-x-1.5 tracking-tight uppercase">
                    <span className="text-[#e11d48] text-lg">⚡</span>
                    <span>Flash Deals</span>
                  </h2>
                  <span className="text-[10px] bg-rose-50 text-rose-600 font-extrabold px-2.5 py-0.5 rounded-full border border-rose-100 shadow-3xs">
                    Limited Time Offer
                  </span>
                </div>
                <div className="w-full overflow-x-auto pb-4 pt-1 scrollbar-none">
                  <div className="inline-flex gap-4 p-5 rounded-3xl border border-green-100/60 shadow-xs bg-gradient-to-r from-green-50/50 via-yellow-50/20 to-white min-w-full md:min-w-0">
                    {flashDeals.map((product) => {
                      const inCartItem = cart.find(c => c.product.id === product.id && c.product.is_flash_deal);
                      const qty = inCartItem ? inCartItem.quantity : 0;
                      const threshold = product.flash_deal_threshold || 0;
                      const diffToClaim = Math.max(0, threshold - regularSubTotal);
                      return (
                        <div key={product.id} className="w-[230px] md:w-[250px] shrink-0 flex flex-col space-y-4">
                          <ProductCountdown endTime={product.flash_deal_end_time} />
                          <div className="bg-white rounded-2xl p-3 border border-green-100/60 flex flex-col justify-between shadow-3xs hover:shadow-xs transition-shadow h-[320px]">
                            <div className="relative aspect-square rounded-xl bg-gray-50 overflow-hidden mb-2 h-[150px] flex items-center justify-center">
                              <img src={product.image_url} alt={product.name} className="object-cover w-full h-full" />
                              <span className="absolute top-1.5 left-1.5 text-[8px] bg-rose-500 text-white font-extrabold px-1.5 py-0.5 rounded-md">Deal</span>
                            </div>
                            <div className="flex-1 flex flex-col justify-between">
                              <div>
                                <div className="flex items-baseline space-x-1">
                                  <span className="text-xs font-bold text-gray-900">₹{product.price}</span>
                                  <span className="text-[10px] text-gray-400 line-through">₹{product.mrp}</span>
                                </div>
                                <h4 className="text-[11px] font-bold text-gray-800 line-clamp-1 mt-0.5">{product.name}</h4>
                                <p className="text-[9px] text-gray-400 mt-0.5">{product.unit} {product.weight_range}</p>
                              </div>
                              <div>
                                <div className="mt-2 text-[8px] font-semibold text-gray-500">
                                  {diffToClaim > 0 ? (
                                    <span>Shop for <span className="text-[#1e7e34] font-bold">₹{diffToClaim}</span> more</span>
                                  ) : (
                                    <span className="text-green-700 font-bold">Deal unlocked!</span>
                                  )}
                                  <div className="w-full bg-gray-100 h-1 rounded-full mt-1 overflow-hidden">
                                    <div className="bg-[#1e7e34] h-full" style={{ width: `${Math.min(100, (regularSubTotal / threshold) * 100)}%` }} />
                                  </div>
                                </div>
                                <div className="mt-2">
                                  {qty > 0 ? (
                                    <button
                                      onClick={() => handleRemoveFromCart(product.id, true)}
                                      className="w-full text-center py-1.5 border border-[#1e7e34] bg-green-50 text-[#1e7e34] hover:bg-red-50 hover:border-red-200 hover:text-red-600 font-bold text-[10px] rounded-lg transition-colors cursor-pointer group"
                                    >
                                      <span className="group-hover:hidden">Offer Claimed</span>
                                      <span className="hidden group-hover:inline">Remove Offer</span>
                                    </button>
                                  ) : (
                                    <button
                                      onClick={() => handleAddToCart(product)}
                                      className="w-full text-center py-1.5 bg-[#1e7e34] hover:bg-green-800 text-white font-extrabold text-[10px] rounded-lg transition-colors cursor-pointer active:scale-95 shadow-3xs"
                                    >
                                      Claim Deal
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Products grid - Show all items on home */}
            <div className="space-y-3.5">
              <div className="flex justify-between items-baseline pl-0.5">
                <h2 className="text-sm font-extrabold text-gray-900 uppercase tracking-wider">
                  All Items ({filteredProducts.length})
                </h2>
              </div>

              {filteredProducts.length === 0 ? (
                <div className="bg-gray-50 rounded-3xl p-12 text-center border border-gray-100">
                  <img src="/loading.png" alt="No products" className="w-52 h-52 mx-auto" />
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-3.5">
                  {filteredProducts.map((product) => {
                    const displayProduct = product.is_flash_deal
                      ? { ...product, is_flash_deal: false, price: product.mrp }
                      : product;
                    const inCartItem = cart.find(c => c.product.id === displayProduct.id && !c.product.is_flash_deal);
                    const qty = inCartItem ? inCartItem.quantity : 0;
                    const isFav = favorites.includes(displayProduct.id);

                    return (
                      <ProductCard
                        key={displayProduct.id}
                        product={displayProduct}
                        quantityInCart={qty}
                        onAddToCart={handleAddToCart}
                        onRemoveFromCart={handleRemoveFromCart}
                        onProductClick={setSelectedProduct}
                        isFavorite={isFav}
                        onToggleFavorite={handleToggleFavorite}
                      />
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        ) : activeTab === 'categories' ? (
          <div className="px-1 py-4 space-y-5">
            {selectedCategoryDetail === null ? (
              /* Step 1: Render Category Cards Grid with Background Images */
              <div className="space-y-4">
                <h2 className="text-sm font-extrabold text-gray-900 uppercase tracking-wider pl-0.5">
                  Shop By Category
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {categories.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedCategoryDetail(cat.name)}
                      className="bg-white border border-gray-100 rounded-2xl p-3 flex flex-col items-center justify-between text-center hover:shadow-xs hover:border-green-200 transition-all cursor-pointer aspect-square"
                    >
                      <div className="w-full flex-1 flex items-center justify-center rounded-xl bg-gray-50/50 overflow-hidden mb-2 relative">
                        {cat.image ? (
                          <img src={cat.image} alt={cat.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-green-50 to-yellow-50 flex items-center justify-center text-3xl select-none">
                            {cat.icon}
                          </div>
                        )}
                      </div>
                      <span className="text-[11px] font-extrabold text-gray-800 line-clamp-2 leading-tight">
                        {cat.name}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              /* Step 2: Render Category Product List with Header & Back Button */
              <div className="space-y-4">
                <div className="flex items-center space-x-2.5 py-2 px-1 border-b border-gray-100 bg-white rounded-2xl shadow-3xs p-3">
                  <button
                    onClick={() => setSelectedCategoryDetail(null)}
                    className="p-1.5 hover:bg-gray-150 rounded-full text-gray-600 cursor-pointer flex items-center justify-center"
                  >
                    <ArrowRight className="rotate-180 text-gray-600" size={20} />
                  </button>
                  <h3 className="text-sm font-extrabold text-gray-900 capitalize">{selectedCategoryDetail}</h3>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-3.5 mt-4">
                  {products
                    .filter(p => p.category === selectedCategoryDetail || p.sub_category?.toLowerCase() === selectedCategoryDetail?.toLowerCase())
                    .map((product) => {
                      const displayProduct = product.is_flash_deal
                        ? { ...product, is_flash_deal: false, price: product.mrp }
                        : product;
                      const inCartItem = cart.find(c => c.product.id === displayProduct.id && !c.product.is_flash_deal);
                      const qty = inCartItem ? inCartItem.quantity : 0;
                      const isFav = favorites.includes(displayProduct.id);

                      return (
                        <ProductCard
                          key={displayProduct.id}
                          product={displayProduct}
                          quantityInCart={qty}
                          onAddToCart={handleAddToCart}
                          onRemoveFromCart={handleRemoveFromCart}
                          onProductClick={setSelectedProduct}
                          isFavorite={isFav}
                          onToggleFavorite={handleToggleFavorite}
                        />
                      );
                    })}
                </div>
              </div>
            )}
          </div>
        ) : activeTab === 'profile' ? (
          /* Profile Tab */
          currentUser ? (
            <ProfileView
              onRefreshOrdersTrigger={profileRefreshTrigger}
              currentUser={currentUser}
              onLogout={() => {
                localStorage.removeItem('geniefarm_user');
                localStorage.removeItem('geniefarm_active_address');
                setCurrentUser(null);
              }}
              billingConfig={billingConfig}
              addresses={addresses}
              activeAddress={activeAddress}
              onAddressSelect={handleAddressSelect}
              onAddressDelete={handleAddressDelete}
              onAddressAdd={() => setIsAddressModalOpen(true)}
              setActiveTab={setActiveTab}
              products={products}
              favorites={favorites}
              onToggleFavorite={handleToggleFavorite}
              cart={cart}
              onAddToCart={handleAddToCart}
              onRemoveFromCart={handleRemoveFromCart}
            />
          ) : (
            <LoginView onLoginSuccess={(user) => setCurrentUser(user)} onBack={() => setActiveTab('home')} />
          )
        ) : null}

        {/* Brand Footer */}
        <Footer billingConfig={billingConfig} />
      </main>

      {/* 3. Floating View Cart / Unlock Free Delivery slide (Only visible on Home and Categories main pages) */}
      {cartItemCount > 0 && !isCartDrawerOpen && !isAddressModalOpen && !isCheckoutModalOpen && !selectedProduct && !selectedCategoryDetail && (activeTab === 'home' || activeTab === 'categories') && (
        <div className={`fixed left-0 right-0 z-50 px-4 md:hidden max-w-md mx-auto w-full transition-all duration-300 ease-in-out ${showBottomNav ? 'bottom-[calc(64px+env(safe-area-inset-bottom))]' : 'bottom-[calc(8px+env(safe-area-inset-bottom))]'}`}>
          <div
            onClick={() => setIsCartDrawerOpen(true)}
            className="relative bg-[#1c222e]/95 backdrop-blur-xs text-white p-3.5 rounded-2xl shadow-xl border border-slate-800 transition-all active:scale-[0.98] cursor-pointer"
          >


            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {/* Truck Circle Icon */}
                <div className="w-9 h-9 rounded-full bg-slate-800 flex items-center justify-center text-white border border-slate-700 shadow-inner">
                  {cartTotal >= billingConfig.delivery_free_threshold ? (
                    <span className="text-base">🎉</span>
                  ) : (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-5 h-5 text-[#1e7e34]">
                      <rect x="1" y="3" width="15" height="13" rx="2" />
                      <polygon points="16 8 20 8 23 11 23 16 16 16" />
                      <circle cx="5.5" cy="18.5" r="2.5" />
                      <circle cx="18.5" cy="18.5" r="2.5" />
                    </svg>
                  )}
                </div>

                <div className="flex flex-col text-left">
                  <span className="text-[11px] font-extrabold tracking-wide text-white uppercase">
                    {cartTotal >= billingConfig.delivery_free_threshold ? 'Free Delivery Unlocked!' : 'Unlock free delivery'}
                  </span>
                  <span className="text-[10px] font-bold text-gray-400">
                    {cartTotal >= billingConfig.delivery_free_threshold ? (
                      `You saved ₹${billingConfig.delivery_fee} on delivery fee`
                    ) : (
                      `Shop for ₹${Math.max(0, billingConfig.delivery_free_threshold - cartTotal)}`
                    )}
                  </span>
                </div>
              </div>

              {/* Right Side: View Cart Detail */}
              <div className="flex items-center space-x-1 bg-[#1e7e34] px-2.5 py-1.5 rounded-xl border border-[#155a24] text-white shadow-sm hover:bg-[#155a24] transition-all">
                <span className="text-[10px] font-extrabold uppercase tracking-wide">
                  Cart (₹{cartTotal})
                </span>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="w-3 h-3 text-white">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>

            {/* Sleek Real-Time Progress Bar */}
            <div className="w-full bg-slate-800 h-1 rounded-full overflow-hidden mt-2.5">
              <div
                className="bg-[#1e7e34] h-full rounded-full transition-all duration-500 ease-out shadow-inner"
                style={{ width: `${Math.min(100, (cartTotal / billingConfig.delivery_free_threshold) * 100)}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* 4. Bottom Tab Bar Navigation (Only visible on Home and Categories main pages) */}
      {!isAddressModalOpen && !isCheckoutModalOpen && !isCartDrawerOpen && !selectedProduct && !selectedCategoryDetail && (activeTab === 'home' || activeTab === 'categories') && (
        <FooterNav
          className={showBottomNav ? 'translate-y-0' : 'translate-y-full'}
          activeTab={isCartDrawerOpen ? 'cart' : activeTab}
          setActiveTab={(tab) => {
            if (tab === 'cart') {
              setIsCartDrawerOpen(true);
            } else {
              setIsCartDrawerOpen(false);
              setActiveTab(tab);
              // Reset category details state when changing tabs
              setSelectedCategoryDetail(null);
            }
          }}
          cartItemCount={cartItemCount}
        />
      )}

      {/* 5. Cart Drawer Component */}
      <CartDrawer
        isOpen={isCartDrawerOpen}
        onClose={() => setIsCartDrawerOpen(false)}
        cartItems={cart}
        onAddToCart={handleAddToCart}
        onRemoveFromCart={handleRemoveFromCart}
        onProceedToCheckout={() => {
          setIsCartDrawerOpen(false);
          setIsCheckoutModalOpen(true);
        }}
        deliveryAddressName={activeAddress ? activeAddress.society_name : ''}
        billingConfig={billingConfig}
        coupons={coupons}
        appliedCoupon={appliedCoupon}
        setAppliedCoupon={setAppliedCoupon}
      />

      {/* 6. Address modal selector */}
      <AddressModal
        isOpen={isAddressModalOpen}
        onClose={() => setIsAddressModalOpen(false)}
        onAddressSaved={handleAddressSaved}
        addresses={addresses}
        activeAddress={activeAddress}
        onAddressSelect={handleAddressSelect}
        currentUser={currentUser}
      />

      {/* 7. Checkout Process Modal */}
      <CheckoutModal
        isOpen={isCheckoutModalOpen}
        onClose={() => {
          setIsCheckoutModalOpen(false);
          if (orderPlacedSuccess) {
            setOrderPlacedSuccess(false);
            setActiveTab('home');
          }
        }}
        cartItems={cart}
        activeAddress={activeAddress}
        onOrderSuccess={handleOrderSuccess}
        onOrderPlaced={handleOrderPlaced}
        onOpenAddressSelector={() => {
          setReturnToCheckoutAfterAddress(true);
          setIsCheckoutModalOpen(false);
          setIsAddressModalOpen(true);
        }}
        billingConfig={billingConfig}
        appliedCoupon={appliedCoupon}
        setAppliedCoupon={setAppliedCoupon}
        currentUser={currentUser}
        onLoginTrigger={(user) => setCurrentUser(user)}
      />

      {/* 8. Product Detailed view modal */}
      <ProductDetailsModal
        product={selectedProduct}
        isOpen={!!selectedProduct}
        onClose={() => setSelectedProduct(null)}
        quantityInCart={cart.find(c => c.product.id === selectedProduct?.id)?.quantity || 0}
        onAddToCart={handleAddToCart}
        onRemoveFromCart={handleRemoveFromCart}
        isFavorite={selectedProduct ? favorites.includes(selectedProduct.id) : false}
        onToggleFavorite={handleToggleFavorite}
      />

      {/* Global Custom Centered Alert */}
      {customAlert && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 text-xs text-gray-700">
          <div onClick={() => setCustomAlert(null)} className="absolute inset-0 bg-black/60 backdrop-blur-xs" />
          <div className="relative bg-white w-full max-w-sm rounded-3xl shadow-2xl border border-gray-100 p-6 flex flex-col items-center text-center animate-scale-up">
            <div className="w-12 h-12 rounded-full bg-green-50 text-green-700 flex items-center justify-center mb-3">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 111.084-1.083l-.042.02a.75.75 0 01-1.084 1.083zM12 15.75h.008v.008H12v-.008zM21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-sm font-extrabold text-gray-900 mb-2">Notification</h3>
            <p className="text-xs text-gray-600 font-semibold leading-relaxed mb-5">{customAlert}</p>
            <button
              onClick={() => setCustomAlert(null)}
              className="w-full bg-[#1e7e34] hover:bg-[#155a24] text-white font-bold text-xs py-2.5 rounded-xl transition-all shadow-md active:scale-95 cursor-pointer"
            >
              Okay
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
