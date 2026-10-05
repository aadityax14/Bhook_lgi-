import React from 'react';
import {
  Home,
  UtensilsCrossed,
  ShoppingBag,
  Clock,
  Gift
} from 'lucide-react';

import { useCart } from '../../context/CartContext';
import { useOrder } from '../../context/OrderContext';
import { useAuth } from '../../context/AuthContext';

export default function BottomNav({
  activeTab,
  setActiveTab,
  onOpenCart,
  onOpenZuxu
}) {
  const { itemsCount } = useCart();
  const { activeOrder } = useOrder();
  const { isAdminView, setIsAdminView } = useAuth();

  const isOrderActive =
    activeOrder &&
    [
      'placed',
      'accepted',
      'preparing',
      'ready',
      'out_for_delivery'
    ].includes(activeOrder.status);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-lg border-t border-gray-100 py-1.5 px-2 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] sm:hidden">

      <div className="flex items-center justify-between max-w-md mx-auto">

        {/* HOME */}
        <button
          onClick={() => {
            setIsAdminView(false);
            setActiveTab('home');
          }}
          className={`flex flex-1 flex-col items-center py-1 px-2 rounded-2xl transition-all ${
            !isAdminView && activeTab === 'home'
              ? 'text-brand-black font-extrabold scale-105'
              : 'text-gray-400 font-medium'
          }`}
        >
          <Home
            className={`w-5 h-5 ${
              !isAdminView && activeTab === 'home'
                ? 'text-brand-yellow stroke-[2.5]'
                : ''
            }`}
          />

          <span className="text-[9px] mt-0.5">
            Home
          </span>
        </button>


        {/* MENU */}
        <button
          onClick={() => {
            setIsAdminView(false);
            setActiveTab('menu');
          }}
          className={`flex flex-1 flex-col items-center py-1 px-2 rounded-2xl transition-all ${
            !isAdminView && activeTab === 'menu'
              ? 'text-brand-black font-extrabold scale-105'
              : 'text-gray-400 font-medium'
          }`}
        >
          <UtensilsCrossed
            className={`w-5 h-5 ${
              !isAdminView && activeTab === 'menu'
                ? 'text-brand-yellow stroke-[2.5]'
                : ''
            }`}
          />

          <span className="text-[9px] mt-0.5">
            Menu
          </span>
        </button>


        {/* ZUXU - 3RD */}
        <button
          onClick={() => {
            setIsAdminView(false);

            if (onOpenZuxu) {
              onOpenZuxu();
            }
          }}
          className="relative flex flex-1 flex-col items-center py-1 px-2 rounded-2xl text-gray-400 font-medium hover:text-gray-600 transition-all"
        >
          <div className="relative">

            <Gift className="w-5 h-5" />

            <span className="absolute -top-2 -right-2 text-[8px]">
              ✨
            </span>

          </div>

          <span className="text-[9px] mt-0.5">
            Zuxu
          </span>
        </button>


        {/* ORDERS - 4TH */}
        <button
          onClick={() => {
            setIsAdminView(false);
            setActiveTab('orders');
          }}
          className={`relative flex flex-1 flex-col items-center py-1 px-2 rounded-2xl transition-all ${
            !isAdminView && activeTab === 'orders'
              ? 'text-brand-black font-extrabold scale-105'
              : 'text-gray-400 font-medium'
          }`}
        >
          <div className="relative">

            <Clock
              className={`w-5 h-5 ${
                !isAdminView && activeTab === 'orders'
                  ? 'text-brand-yellow stroke-[2.5]'
                  : ''
              }`}
            />

            {isOrderActive && (
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-brand-yellow rounded-full ring-2 ring-white animate-ping" />
            )}

          </div>

          <span className="text-[9px] mt-0.5">
            Orders
          </span>
        </button>


        {/* CART - 5TH */}
        <button
          onClick={onOpenCart}
          className="relative flex flex-1 flex-col items-center py-1 px-2 rounded-2xl text-gray-400 font-medium hover:text-gray-600 transition-all"
        >
          <div className="relative">

            <ShoppingBag className="w-5 h-5" />

            {itemsCount > 0 && (
              <span className="absolute -top-1.5 -right-2 bg-brand-yellow text-brand-black text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center shadow-xs">
                {itemsCount}
              </span>
            )}

          </div>

          <span className="text-[9px] mt-0.5">
            Cart
          </span>
        </button>

      </div>
    </nav>
  );
}