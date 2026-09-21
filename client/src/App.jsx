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

import { useCart } from './context/CartContext';
import { useOrder } from './context/OrderContext';
import { useAuth } from './context/AuthContext';
import { api } from './services/api';
import { FALLBACK_PRODUCTS } from './data/fallbackProducts';

export default function App() {
  // Splash screen state
  const [showSplash, setShowSplash] = useState(true);

  // App navigation state
  const [activeTab, setActiveTab] = useState('home'); // 'home', 'menu', 'orders', 'all-orders'
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Products state
  const [products, setProducts] = useState(FALLBACK_PRODUCTS);

  // Modal / Drawer states
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [confirmedOrder, setConfirmedOrder] = useState(null);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  const { addToCart } = useCart();
  const { setActiveOrderId } = useOrder();
  const { isAdminView, setIsAdminView, isMobileFrame } = useAuth();

 

  // Fetch products from backend
  const loadProducts = useCallback(async () => {
    try {
      const res = await api.getProducts(activeCategory, searchQuery);
      if (res && res.data && res.data.length > 0) {
        setProducts(res.data);
      } else {
        // Fallback filter
        let filtered = [...FALLBACK_PRODUCTS];
        if (activeCategory !== 'all') {
          if (activeCategory === 'cooked') filtered = filtered.filter(p => p.isCooked);
          else if (activeCategory === 'uncooked') filtered = filtered.filter(p => !p.isCooked);
          else filtered = filtered.filter(p => p.categoryId === activeCategory);
        }
        if (searchQuery) {
          const q = searchQuery.toLowerCase();
          filtered = filtered.filter(p => p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q));
        }
        setProducts(filtered);
      }
    } catch (err) {
      console.warn('API getProducts fallback:', err.message);
    }
  }, [activeCategory, searchQuery]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  // Quick add without opening bottom sheet
  const handleQuickAdd = (product) => {
    addToCart(product, {
      variant: product.variants?.[0] || null,
      spiceLevel: product.allowsSpiceCustomization ? 'spicy' : null,
      addons: [],
      quantity: 1
    });
  };

  // When order is successfully placed from checkout
  const handleOrderPlaced = (order) => {
    setIsCheckoutOpen(false);
    setConfirmedOrder(order);
  };

  // Navigating to order tracking
  const handleTrackConfirmedOrder = () => {
    setConfirmedOrder(null);
    setActiveTab('orders');
  };

  // Content rendering based on current view
  const renderContent = () => {
    if (isAdminView) {
      return (
        <AdminDashboard
          onSwitchToCustomer={() => setIsAdminView(false)}
        />
      );
    }

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

    if (activeTab === 'orders') {
      return (
        <OrderTrackingView
          onBackToMenu={() => setActiveTab('home')}
          onOpenAllOrders={() => setActiveTab('all-orders')}
        />
      );
    }

    // Default: Home or Menu view
    return (
      <div className="space-y-6 pb-20">
        {activeTab === 'home' && <HeroBanner />}

        {/* Search & Suggestions */}
        <SearchBar search={searchQuery} setSearch={setSearchQuery} />

        {/* Sticky Categories Bar */}
        <CategoryTabs
          activeCategory={activeCategory}
          onSelectCategory={(cat) => {
            setActiveCategory(cat);
            if (activeTab !== 'home' && activeTab !== 'menu') {
              setActiveTab('menu');
            }
          }}
        />

        {/* Product Grid Section */}
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

            {/* Quick Filter Tag for Cooked / Raw */}
            <div className="flex items-center gap-1.5 text-xs font-bold text-gray-500">
              <span className="hidden sm:inline">Late night fast prep</span>
            </div>
          </div>

          {products.length === 0 ? (
            <div className="bg-white rounded-3xl p-10 text-center border border-gray-100 shadow-soft">
              <div className="text-3xl mb-2">🔍</div>
              <h4 className="font-extrabold text-brand-black text-base">No cravings found</h4>
              <p className="text-xs text-gray-400 mt-1">Try another keyword or category.</p>
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

  return (
    <>
      {/* 1. App Opening Splash Animation */}
      {showSplash && <SplashScreen onFinish={() => setShowSplash(false)} />}

      {/* Main Wrapper with optional mobile phone frame simulation */}
      <div className={`min-h-screen bg-brand-cream flex flex-col items-center justify-start ${
        isMobileFrame ? 'p-4 sm:p-8 bg-neutral-900' : ''
      }`}>
        {/* Frame container for mobile preview vs standard responsive */}
        <div
          className={`w-full transition-all duration-300 ${
            isMobileFrame
              ? 'max-w-[420px] bg-brand-cream rounded-[48px] shadow-[0_25px_70px_rgba(0,0,0,0.6)] border-[10px] border-neutral-800 overflow-hidden relative min-h-[840px] flex flex-col'
              : 'max-w-5xl mx-auto flex-1 flex flex-col'
          }`}
        >
          {/* Mobile Notch Bar if in simulated phone frame */}
          {isMobileFrame && (
            <div className="w-full bg-neutral-900 py-1 flex items-center justify-center relative">
              <div className="w-24 h-4 bg-black rounded-b-xl flex items-center justify-center">
                <div className="w-2.5 h-2.5 rounded-full bg-neutral-800 mr-2"></div>
                <div className="w-2 h-2 rounded-full bg-blue-900"></div>
              </div>
            </div>
          )}

          {/* Top Header */}
          <Header
            onOpenCart={() => setIsCartOpen(true)}
            onOpenNotifications={() => setIsNotificationsOpen(true)}
            onLogoClick={() => {
              setIsAdminView(false);
              setActiveTab('home');
              setActiveCategory('all');
              setSearchQuery('');
            }}
          />

          {/* Floating In-App Toast messages */}
          <Toast
            onOpenOrders={() => {
              setIsAdminView(false);
              setActiveTab('orders');
            }}
            onOpenNotifications={() => setIsNotificationsOpen(true)}
          />

          {/* Main App Container */}
          <main className="flex-1 px-4 sm:px-6 pt-4">
            {renderContent()}
          </main>

          {/* Bottom Navigation for Mobile */}
          <BottomNav
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            onOpenCart={() => setIsCartOpen(true)}
          />
        </div>

        {/* Global Modals & Drawers */}
        <CustomizationModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
        />

        <CartDrawer
          isOpen={isCartOpen}
          onClose={() => setIsCartOpen(false)}
          onProceedToCheckout={() => setIsCheckoutOpen(true)}
        />

        <CheckoutModal
          isOpen={isCheckoutOpen}
          onClose={() => setIsCheckoutOpen(false)}
          onOrderPlaced={handleOrderPlaced}
        />

        <OrderConfirmationModal
          order={confirmedOrder}
          onClose={() => setConfirmedOrder(null)}
          onTrackOrder={handleTrackConfirmedOrder}
        />

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
