
import React, { useState, useEffect, useCallback } from 'react';

import SplashScreen from './components/splash/SplashScreen';
import Header from './components/common/Header';
import BottomNav from './components/common/BottomNav';
import Toast from './components/common/Toast';
import HeroBanner from './components/home/HeroBanner';
import CategoryTabs from './components/home/CategoryTabs';
import SearchBar from './components/home/SearchBar';
import ProductCard from './components/product/ProductCard';
import CustomizationModal from './components/product/CustomizationModal';
import CartDrawer from './components/cart/CartDrawer';
import CheckoutModal from './components/checkout/CheckoutModal';
import OrderConfirmationModal from './components/tracking/OrderConfirmationModal';
import OrderTrackingView from './components/tracking/OrderTrackingView';
import OrdersListPage from './components/orders/OrdersListPage';
import NotificationModal from './components/notifications/NotificationModal';
import AdminDashboard from './components/admin/AdminDashboard';
import AdminLogin from './components/admin/AdminLogin';
import DeliveryLogin from './components/delivery/DeliveryLogin';
import DeliveryDashboard from './components/delivery/DeliveryDashboard';
import ZuxuStore from './components/zuxu/ZuxuStore';
import ChefDashboard from './components/chef/ChefDashboard';

import { useCart } from './context/CartContext';
import { useOrder } from './context/OrderContext';
import { useAuth } from './context/AuthContext';
import { api } from './services/api';
import { FALLBACK_PRODUCTS } from './data/fallbackProducts';

export default function App() {
  const [isDeliveryView, setIsDeliveryView] = useState(false);
  const [deliveryPartner, setDeliveryPartner] = useState(null);

  const [showWorkWithBhookLgi, setShowWorkWithBhookLgi] = useState(false);

  // Splash screen state
  const [showSplash, setShowSplash] = useState(true);

  // App navigation state
  const [activeTab, setActiveTab] = useState('home');
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Products state
  const [products, setProducts] = useState(
    FALLBACK_PRODUCTS.filter(
      (product) =>
        String(product.categoryId || '').toLowerCase() !== 'zuxu'
    )
  );

  // Modal / Drawer states
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [confirmedOrder, setConfirmedOrder] = useState(null);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  // Staff and navigation states
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [isChefView, setIsChefView] = useState(false);
  const [isZuxuView, setIsZuxuView] = useState(false);

  const { addToCart } = useCart();
  const { setActiveOrderId } = useOrder();

  const {
    isAdminView,
    setIsAdminView,
    isMobileFrame
  } = useAuth();

  // ==========================================================
  // PRODUCT FILTER
  // ==========================================================

  const isZuxuProduct = (product) => {
    const category = String(
      product?.categoryId ||
      product?.category ||
      ''
    ).toLowerCase().trim();

    return category === 'zuxu';
  };

  // ==========================================================
  // ADMIN SHORTCUT
  // ==========================================================

  useEffect(() => {
    const handleAdminShortcut = (e) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'A') {
        setShowAdminLogin(true);
      }
    };

    window.addEventListener('keydown', handleAdminShortcut);

    return () => {
      window.removeEventListener('keydown', handleAdminShortcut);
    };
  }, []);

  // ==========================================================
  // FETCH BHOO​​K_LGI PRODUCTS
  // ZUXU PRODUCTS ARE EXCLUDED FROM THE MAIN SHOP
  // ==========================================================

  const loadProducts = useCallback(async () => {
    try {
      const res = await api.getProducts(
        activeCategory,
        searchQuery
      );

      if (res && Array.isArray(res.data) && res.data.length > 0) {

        // IMPORTANT:
        // Only Bhook_Lgi products are shown in the main shop.
        // Zuxu products are displayed separately in ZuxuStore.jsx.

        const bhookProducts = res.data.filter(
          (product) => !isZuxuProduct(product)
        );

        setProducts(bhookProducts);

      } else {
        // Fallback products
        let filtered = [...FALLBACK_PRODUCTS];

        // Always exclude Zuxu products.
        filtered = filtered.filter(
          (product) => !isZuxuProduct(product)
        );

        if (activeCategory !== 'all') {
          if (activeCategory === 'cooked') {
            filtered = filtered.filter(
              (product) => product.isCooked
            );
          } else if (activeCategory === 'uncooked') {
            filtered = filtered.filter(
              (product) => !product.isCooked
            );
          } else {
            filtered = filtered.filter(
              (product) =>
                product.categoryId === activeCategory
            );
          }
        }

        if (searchQuery) {
          const q = searchQuery.toLowerCase();

          filtered = filtered.filter(
            (product) =>
              (product.name || '').toLowerCase().includes(q) ||
              (product.description || '').toLowerCase().includes(q)
          );
        }

        setProducts(filtered);
      }

    } catch (err) {
      console.warn(
        'API getProducts fallback:',
        err.message
      );

      // If API fails, show only Bhook_Lgi fallback products.
      let filtered = [...FALLBACK_PRODUCTS].filter(
        (product) => !isZuxuProduct(product)
      );

      if (activeCategory !== 'all') {
        if (activeCategory === 'cooked') {
          filtered = filtered.filter(
            (product) => product.isCooked
          );
        } else if (activeCategory === 'uncooked') {
          filtered = filtered.filter(
            (product) => !product.isCooked
          );
        } else {
          filtered = filtered.filter(
            (product) => product.categoryId === activeCategory
          );
        }
      }

      setProducts(filtered);
    }
  }, [activeCategory, searchQuery]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  // ==========================================================
  // ZUXU NAVIGATION
  // ==========================================================

  const handleExploreZuxu = () => {
    setIsAdminView(false);
    setIsChefView(false);
    setIsDeliveryView(false);
    setIsZuxuView(true);
    setIsCartOpen(false);
    setIsCheckoutOpen(false);
  };

  const handleBackFromZuxu = () => {
    setIsZuxuView(false);
    setActiveTab('home');
    setActiveCategory('all');
    setSearchQuery('');
  };

  // ==========================================================
  // QUICK ADD TO CART
  // ==========================================================

  const handleQuickAdd = (product) => {
    addToCart(product, {
      variant: product.variants?.[0] || null,
      spiceLevel: product.allowsSpiceCustomization
        ? 'spicy'
        : null,
      addons: [],
      quantity: 1
    });
  };

  // ==========================================================
  // ORDER PLACED
  // ==========================================================

  const handleOrderPlaced = (order) => {
    setIsCheckoutOpen(false);
    setConfirmedOrder(order);
  };

  // ==========================================================
  // ORDER TRACKING
  // ==========================================================

  const handleTrackConfirmedOrder = () => {
    setConfirmedOrder(null);
    setActiveTab('orders');
  };

  // ==========================================================
  // CONTENT RENDERING
  // ==========================================================

  const renderContent = () => {

    // ADMIN LOGIN
    if (showAdminLogin) {
      return (
        <AdminLogin
          onLogin={() => {
            setShowAdminLogin(false);
            setIsAdminView(true);
          }}
          onBack={() => setShowAdminLogin(false)}
        />
      );
    }

    // ADMIN DASHBOARD
    if (isAdminView) {
      return (
        <AdminDashboard
          onSwitchToCustomer={() => setIsAdminView(false)}
        />
      );
    }

    // DELIVERY LOGIN
    if (isDeliveryView && !deliveryPartner) {
      return (
        <DeliveryLogin
          onLogin={(partner) => {
            setDeliveryPartner(partner);
          }}
        />
      );
    }

    // DELIVERY DASHBOARD
    if (isDeliveryView && deliveryPartner) {
      return (
        <DeliveryDashboard
          deliveryPartner={deliveryPartner}
          onLogout={() => {
            setDeliveryPartner(null);
            setIsDeliveryView(false);
          }}
        />
      );
    }

    // CHEF DASHBOARD
    if (isChefView) {
      return (
        <ChefDashboard />
      );
    }

    // ========================================================
    // SEPARATE ZUXU SHOP
    // ========================================================

    if (isZuxuView) {
      return (
        <ZuxuStore
          onBack={handleBackFromZuxu}
        />
      );
    }

    // ALL ORDERS
    if (activeTab === 'all-orders') {
      return (
        <OrdersListPage
          onSelectOrder={(id) => {
            setActiveOrderId(id);
            setActiveTab('orders');
          }}
          onStartNewOrder={() => setActiveTab('home')}
        />
      );
    }

    // ORDER TRACKING
    if (activeTab === 'orders') {
      return (
        <OrderTrackingView
          onBackToMenu={() => setActiveTab('home')}
          onOpenAllOrders={() => setActiveTab('all-orders')}
          onExploreZuxu={handleExploreZuxu}
        />
      );
    }

    // ========================================================
    // MAIN BHOO​​K_LGI HOME / MENU
    // ========================================================

    return (
      <div className="space-y-6 pb-20">

        {/* HERO BANNER */}
        {activeTab === 'home' && (
          <HeroBanner
            onExploreZuxu={handleExploreZuxu}
          />
        )}

        {/* SEARCH */}
        <SearchBar
          search={searchQuery}
          setSearch={setSearchQuery}
        />

        {/* CATEGORY TABS */}
        <CategoryTabs
          activeCategory={activeCategory}
          onSelectCategory={(cat) => {
            setActiveCategory(cat);

            if (
              activeTab !== 'home' &&
              activeTab !== 'menu'
            ) {
              setActiveTab('menu');
            }
          }}
        />

        {/* PRODUCT GRID */}
        <div>

          <div className="flex items-center justify-between mb-4">
            <div>

              <h3 className="text-xl font-black text-brand-black tracking-tight">
                {activeCategory === 'all'
                  ? 'All Hostel Munchies 🔥'
                  : `${activeCategory.toUpperCase()} Selection`}
              </h3>

              <span className="text-xs text-gray-500 font-semibold">
                {products.length} items ready to order
              </span>

            </div>

            <div className="flex items-center gap-1.5 text-xs font-bold text-gray-500">
              <span className="hidden sm:inline">
                Late night fast prep
              </span>
            </div>

          </div>

          {products.length === 0 ? (

            <div className="bg-white rounded-3xl p-10 text-center border border-gray-100 shadow-soft">

              <div className="text-3xl mb-2">
                🔍
              </div>

              <h4 className="font-extrabold text-brand-black text-base">
                No cravings found
              </h4>

              <p className="text-xs text-gray-400 mt-1">
                Try another keyword or category.
              </p>

              <button
                onClick={() => {
                  setSearchQuery('');
                  setActiveCategory('all');
                }}
                className="mt-4 px-4 py-2 bg-brand-yellow text-brand-black rounded-xl text-xs font-bold shadow-xs"
              >
                Reset Search
              </button>

            </div>

          ) : (

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">

              {products.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onSelectProduct={(p) => setSelectedProduct(p)}
                  onQuickAdd={handleQuickAdd}
                />
              ))}

            </div>

          )}

        </div>

      </div>
    );
  };

  // ==========================================================
  // MAIN APP RETURN
  // ==========================================================

  return (
    <>

      {/* SPLASH SCREEN */}
      {showSplash && (
        <SplashScreen
          onFinish={() => setShowSplash(false)}
        />
      )}

      {/* MAIN WRAPPER */}
      <div
        className={`min-h-screen bg-brand-cream flex flex-col items-center justify-start ${
          isMobileFrame
            ? 'p-4 sm:p-8 bg-neutral-900'
            : ''
        }`}
      >

        {/* MOBILE FRAME */}
        <div
          className={`w-full transition-all duration-300 ${
            isMobileFrame
              ? 'max-w-[420px] bg-brand-cream rounded-[48px] shadow-[0_25px_70px_rgba(0,0,0,0.6)] border-[10px] border-neutral-800 overflow-hidden relative min-h-[840px] flex flex-col'
              : 'max-w-5xl mx-auto flex-1 flex flex-col'
          }`}
        >

          {/* MOBILE NOTCH */}
          {isMobileFrame && (
            <div className="w-full bg-neutral-900 py-1 flex items-center justify-center relative">

              <div className="w-24 h-4 bg-black rounded-b-xl flex items-center justify-center">

                <div className="w-2.5 h-2.5 rounded-full bg-neutral-800 mr-2"></div>

                <div className="w-2 h-2 rounded-full bg-blue-900"></div>

              </div>

            </div>
          )}

          {/* HEADER */}
          <Header
            onOpenCart={() => setIsCartOpen(true)}
            onOpenNotifications={() => setIsNotificationsOpen(true)}

            onOpenMyOrders={() => {
              setIsAdminView(false);
              setIsZuxuView(false);
              setActiveTab('all-orders');
            }}

            onLogoClick={() => {
              setIsAdminView(false);
              setIsZuxuView(false);
              setActiveTab('home');
              setActiveCategory('all');
              setSearchQuery('');
            }}

            onWorkWithBhookLgi={() => {
              setShowWorkWithBhookLgi(true);
            }}
          />

          {/* TOAST */}
          <Toast
            onOpenOrders={() => {
              setIsAdminView(false);
              setActiveTab('orders');
            }}
            onOpenNotifications={() => {
              setIsNotificationsOpen(true);
            }}
          />

          {/* MAIN CONTENT */}
          <main className="flex-1 px-4 sm:px-6 pt-4">
            {renderContent()}
          </main>

          {/* BOTTOM NAVIGATION */}
          <BottomNav
            activeTab={activeTab}
            setActiveTab={(tab) => {
              setIsZuxuView(false);
              setActiveTab(tab);
            }}
            onOpenCart={() => setIsCartOpen(true)}
            onOpenZuxu={handleExploreZuxu}
          />

        </div>

        {/* ====================================================
            GLOBAL MODALS & DRAWERS
        ==================================================== */}

        {/* PRODUCT CUSTOMIZATION */}
        <CustomizationModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
        />

        {/* WORK WITH BHOOK_LGI */}
        {showWorkWithBhookLgi && (

          <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">

            <div className="w-full max-w-sm rounded-3xl bg-brand-cream p-6 text-center shadow-2xl">

              <div className="text-5xl mb-4">
                🚀
              </div>

              <h2 className="text-2xl font-black text-brand-black">
                Coming Soon!
              </h2>

              <p className="mt-3 text-sm text-gray-600">
                We're working on something exciting.
                Staff applications for Bhook_Lgi will open soon.
              </p>

              <div className="mt-5 rounded-xl bg-brand-yellow/30 p-3">
                <p className="font-bold text-sm">
                  Earn. Learn. Grow.
                </p>
              </div>

              <button
                onClick={() => setShowWorkWithBhookLgi(false)}
                className="mt-5 w-full rounded-xl bg-brand-black py-3 font-black text-brand-yellow"
              >
                Okay
              </button>

            </div>

          </div>
        )}

        {/* CART DRAWER */}
        <CartDrawer
          isOpen={isCartOpen}
          onClose={() => setIsCartOpen(false)}
          onProceedToCheckout={() => setIsCheckoutOpen(true)}
        />

        {/* CHECKOUT */}
        <CheckoutModal
          isOpen={isCheckoutOpen}
          onClose={() => setIsCheckoutOpen(false)}
          onOrderPlaced={handleOrderPlaced}
        />

        {/* ORDER CONFIRMATION */}
        <OrderConfirmationModal
          order={confirmedOrder}
          onClose={() => setConfirmedOrder(null)}
          onTrackOrder={handleTrackConfirmedOrder}
        />

        {/* NOTIFICATIONS */}
        <NotificationModal
          isOpen={isNotificationsOpen}
          onClose={() => setIsNotificationsOpen(false)}
          onTrackOrder={(orderId) => {
            setActiveOrderId(orderId);
            setActiveTab('orders');
          }}
        />

      </div>

    </>
  );
}
