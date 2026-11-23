
import React, { useState, useEffect, useCallback, useRef } from 'react';

import SplashScreen from './components/splash/SplashScreen';
import Header from './components/common/Header';
import BottomNav from './components/common/BottomNav';
import Toast from './components/common/Toast';
import HeroBanner from './components/home/HeroBanner';
import CategoryTabs from './components/home/CategoryTabs';
import SearchBar from './components/home/SearchBar';
import ProductCard from './components/product/ProductCard';
import ProductDetailsPage from './components/product/ProductDetailsPage';
import CartDrawer from './components/cart/CartDrawer';
import CheckoutModal from './components/checkout/CheckoutModal';
import OrderConfirmationModal from './components/tracking/OrderConfirmationModal';
import OrderTrackingView from './components/tracking/OrderTrackingView';
import OrdersListPage from './components/orders/OrdersListPage';
import NotificationModal from './components/notifications/NotificationModal';
import AdminDashboard from './components/admin/AdminDashboard';
import DeliveryDashboard from './components/delivery/DeliveryDashboard';
import ZuxuStore from './components/zuxu/ZuxuStore';
import ChefDashboard from './components/chef/ChefDashboard';
import StaffGate from './components/staff/StaffGate';
import WorkWithBhookLgi from './components/work/WorkWithBhookLgi';
import ProfilePage from './components/profile/ProfilePage';

import { useCart } from './context/CartContext';
import { useOrder } from './context/OrderContext';
import { useAuth } from './context/AuthContext';
import { api } from './services/api';
import { FALLBACK_PRODUCTS } from './data/fallbackProducts';
import { pushBackStep, useBackStep, goBack } from './utils/backNavigation';

export default function App() {
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

  // Navigation states
  const [isZuxuView, setIsZuxuView] = useState(false);

  const { addToCart } = useCart();
  const { setActiveOrderId } = useOrder();

  // The view is chosen from the signed-in account's role, which the
  // server confirms (see AuthContext). No hidden shortcuts.
  const {
    user,
    role,
    logout,
    isAdminView,
    setIsAdminView,
    isMobileFrame
  } = useAuth();

  // ==========================================================
  // BACK BUTTON: every screen / popup is one step, so the phone's
  // Back button goes back the way the user came instead of
  // closing the website.
  // ==========================================================

  const { isAdmin } = useAuth();
  const activeTabRef = useRef(activeTab);
  activeTabRef.current = activeTab;

  // Switch screens and remember the previous one for Back.
  const goToTab = useCallback((tab) => {
    const previous = activeTabRef.current;
    if (previous === tab) return;
    pushBackStep(() => setActiveTab(previous));
    setActiveTab(tab);
  }, []);

  useBackStep(Boolean(selectedProduct), () => setSelectedProduct(null));
  useBackStep(isCartOpen, () => setIsCartOpen(false));
  useBackStep(isCheckoutOpen, () => setIsCheckoutOpen(false));
  useBackStep(isNotificationsOpen, () => setIsNotificationsOpen(false));
  useBackStep(showWorkWithBhookLgi, () => setShowWorkWithBhookLgi(false));
  useBackStep(Boolean(confirmedOrder), () => setConfirmedOrder(null));
  useBackStep(isZuxuView, () => setIsZuxuView(false));
  // Admin opened the shop from the dashboard → Back returns to it.
  useBackStep(isAdmin && !isAdminView, () => setIsAdminView(true));

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

  // Open the tracking screen from anywhere — including the Zuxu
  // store or Admin view, which would otherwise stay on top.
  const openOrderTracking = (orderId) => {
    if (orderId) setActiveOrderId(orderId);
    setIsZuxuView(false);
    setIsAdminView(false);
    goToTab('orders');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleTrackConfirmedOrder = () => {
    setConfirmedOrder(null);
    openOrderTracking();
  };

  // ==========================================================
  // CONTENT RENDERING
  // ==========================================================

  const renderContent = () => {

    // ADMIN DASHBOARD (only ever true for an admin account)
    if (isAdminView) {
      return (
        <AdminDashboard
          onSwitchToCustomer={() => setIsAdminView(false)}
        />
      );
    }

    // ========================================================
    // SEPARATE ZUXU SHOP
    // ========================================================

    if (isZuxuView) {
      return (
        <ZuxuStore
          onBack={() => goBack(handleBackFromZuxu)}
        />
      );
    }

    // MY PROFILE
    if (activeTab === 'profile') {
      return (
        <ProfilePage
          onBack={() => goBack(() => setActiveTab('home'))}
          onOpenOrders={() => goToTab('all-orders')}
          onOpenNotifications={() => setIsNotificationsOpen(true)}
          onWorkWithUs={() => setShowWorkWithBhookLgi(true)}
        />
      );
    }

    // ALL ORDERS
    if (activeTab === 'all-orders') {
      return (
        <OrdersListPage
          onSelectOrder={(id) => {
            setActiveOrderId(id);
            goToTab('orders');
          }}
          onStartNewOrder={() => goToTab('home')}
        />
      );
    }

    // ORDER TRACKING
    if (activeTab === 'orders') {
      return (
        <OrderTrackingView
          onBackToMenu={() => goToTab('home')}
          onOpenAllOrders={() => goToTab('all-orders')}
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
              goToTab('menu');
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
  // CUSTOMER APP (also what off-duty chefs / delivery partners see)
  // ==========================================================

  const customerApp = (
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
              goToTab('all-orders');
            }}

            onLogoClick={() => {
              setIsAdminView(false);
              setIsZuxuView(false);
              goToTab('home');
              setActiveCategory('all');
              setSearchQuery('');
            }}

            onOpenProfile={() => {
              setIsAdminView(false);
              setIsZuxuView(false);
              goToTab('profile');
            }}

            onWorkWithBhookLgi={() => {
              setShowWorkWithBhookLgi(true);
            }}
          />

          {/* TOAST */}
          <Toast
            onOpenOrders={() => openOrderTracking()}
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
              goToTab(tab);
            }}
            onOpenCart={() => setIsCartOpen(true)}
            onOpenZuxu={handleExploreZuxu}
          />

        </div>

        {/* ====================================================
            GLOBAL MODALS & DRAWERS
        ==================================================== */}

        {/* PRODUCT CUSTOMIZATION */}
        {/* Full product page (photos, options, add to cart, reviews).
            key = product id so options reset for each product. */}
        {selectedProduct && (
          <ProductDetailsPage
            key={selectedProduct.id}
            product={selectedProduct}
            onClose={() => setSelectedProduct(null)}
            onOpenCart={() => setIsCartOpen(true)}
          />
        )}

        {/* WORK WITH BHOOK_LGI */}
        {showWorkWithBhookLgi && (
          <WorkWithBhookLgi
            onClose={() => setShowWorkWithBhookLgi(false)}
          />
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
          onTrackOrder={(orderId) => openOrderTracking(orderId)}
        />

      </div>

    </>
  );

  // ==========================================================
  // STAFF: their panel when on duty, the customer app when off duty
  // ==========================================================

  if (role === 'CHEF') {
    return (
      <StaffGate showTopBar offDuty={customerApp}>
        <ChefDashboard />
      </StaffGate>
    );
  }

  if (role === 'DELIVERY') {
    return (
      <StaffGate offDuty={customerApp}>
        <DeliveryDashboard
          deliveryPartner={{ id: user?.id, deliveryId: user?.loginId, name: user?.name }}
          onLogout={logout}
        />
      </StaffGate>
    );
  }

  return customerApp;
}
