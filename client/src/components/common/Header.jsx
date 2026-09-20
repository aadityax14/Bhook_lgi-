import React, { useState } from 'react';
import { MapPin, ShoppingBag, Bell, Shield, Smartphone, Monitor, ChevronDown } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useNotification } from '../../context/NotificationContext';
import { useAuth } from '../../context/AuthContext';

export default function Header({ onOpenCart, onOpenNotifications, onLogoClick }) {
  const { itemsCount } = useCart();
  const { unreadCount } = useNotification();
  const { user, updateUser, isAdminView, setIsAdminView, isMobileFrame, setIsMobileFrame } = useAuth();
  const [showLocationModal, setShowLocationModal] = useState(false);

  const HOSTELS = ['GS12', 'GS11','GH1', 'GH3', 'GH4', 'Other'];

  return (
    <>
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-sm transition-all">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between gap-2">
          {/* Brand Logo */}
          <button 
            onClick={onLogoClick}
            className="flex items-center gap-2 group text-left transition-transform active:scale-95"
          >
            <div className="w-10 h-10 rounded-2xl bg-brand-yellow flex items-center justify-center shadow-md group-hover:rotate-6 transition-transform">
              <span className='small logo'>
                <img src='bhook_lgi logo no bg.png' alt='small logo'></img>
              </span>
              {/* <span className="text-xl">🍜</span> */}
            </div>
            <div>
              <div className="flex items-center font-black text-xl leading-none text-brand-black tracking-tight">
                Bhook<span className="text-brand-yellow">_</span>Lgi
              </div>
              {/* <span className="text-[10px] font-bold text-gray-500 tracking-wide uppercase">Hostel Kitchen</span> */}
            </div>
          </button>

          {/* Center Location Pill */}
          <button
            onClick={() => setShowLocationModal(true)}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-brand-yellowLight border border-brand-yellow/30 text-xs font-semibold text-brand-black hover:bg-brand-yellow/20 transition-all shadow-xs"
          >
            <MapPin className="w-3.5 h-3.5 text-brand-yellow" />
            <span>{user.hostel}, Room {user.roomNumber}</span>
            <ChevronDown className="w-3 h-3 text-gray-400" />
          </button>

          {/* Right Action Controls */}
          <div className="flex items-center gap-2">
            {/* Desktop / Mobile Frame Preview Switcher (on larger screens) */}
            <button
              onClick={() => setIsMobileFrame(!isMobileFrame)}
              title={isMobileFrame ? "Switch to Full Desktop View" : "Simulate Mobile Phone Frame"}
              className="hidden md:flex p-2 rounded-xl text-gray-500 hover:text-brand-black hover:bg-gray-100 transition-colors"
            >
              {isMobileFrame ? <Monitor className="w-4 h-4" /> : <Smartphone className="w-4 h-4" />}
            </button>

            {/* Admin Switcher Toggle */}
            <button
              onClick={() => setIsAdminView(!isAdminView)}
              className={`flex items-center gap-1 text-xs font-bold px-2.5 py-1.5 rounded-xl border transition-all ${
                isAdminView
                  ? 'bg-brand-black text-brand-yellow border-brand-black shadow-sm'
                  : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
              }`}
              title="Toggle between Student Ordering App and Kitchen Admin Dashboard"
            >
              <Shield className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{isAdminView ? 'Customer App' : 'Admin'}</span>
            </button>

            {/* Notifications Bell */}
            <button
              onClick={onOpenNotifications}
              className="relative p-2 rounded-xl text-brand-black hover:bg-gray-100 transition-colors"
              aria-label="Notifications"
            >
              <Bell className="w-5 h-5 text-gray-700" />
              {unreadCount > 0 && (
                <span className="absolute 1 top-1 right-1 w-4 h-4 bg-brand-chili text-white text-[10px] font-black rounded-full flex items-center justify-center animate-pulse">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {/* Cart Button */}
            <button
              onClick={onOpenCart}
              className="relative flex items-center gap-2 bg-brand-yellow hover:bg-brand-yellowHover text-brand-black px-3 py-1.5 rounded-2xl font-bold text-sm shadow-yellow-glow transition-all active:scale-95"
              aria-label="Open Cart"
            >
              <ShoppingBag className="w-4 h-4" />
              <span className="hidden xs:inline">Cart</span>
              {itemsCount > 0 && (
                <span className="bg-brand-black text-brand-yellow text-xs font-black px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
                  {itemsCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Location Sub-bar */}
        <div className="sm:hidden px-4 py-1.5 bg-brand-yellowLight/60 border-t border-brand-yellow/10 flex items-center justify-between text-xs">
          <button
            onClick={() => setShowLocationModal(true)}
            className="flex items-center gap-1.5 font-medium text-gray-700"
          >
            <MapPin className="w-3 h-3 text-brand-yellow" />
            <span>Delivering to: <strong className="text-brand-black">{user.hostel}, Room {user.roomNumber}</strong></span>
            <ChevronDown className="w-3 h-3 text-gray-400" />
          </button>
          <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full">🟢 Kitchen Open</span>
        </div>
      </header>

      {/* Quick Location Change Modal */}
      {showLocationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-gray-100 animate-bounce-in">
            <h3 className="font-extrabold text-lg text-brand-black mb-1">Set Delivery Hostel</h3>
            <p className="text-xs text-gray-500 mb-4">Orders will be brought directly to your hostel room.</p>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1.5">Select Hostel</label>
                <div className="grid grid-cols-4 gap-2">
                  {HOSTELS.map(h => (
                    <button
                      key={h}
                      type="button"
                      onClick={() => updateUser({ hostel: h })}
                      className={`py-2 text-xs font-bold rounded-xl border transition-all ${
                        user.hostel === h
                          ? 'bg-brand-yellow text-brand-black border-brand-yellow shadow-xs'
                          : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                      }`}
                    >
                      {h}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1.5">Room Number</label>
                <input
                  type="text"
                  value={user.roomNumber}
                  onChange={(e) => updateUser({ roomNumber: e.target.value })}
                  placeholder="e.g. 312 or 405-B"
                  className="w-full px-3 py-2 text-sm rounded-xl border border-gray-200 focus:outline-none focus:border-brand-yellow"
                />
              </div>

              <button
                type="button"
                onClick={() => setShowLocationModal(false)}
                className="w-full py-2.5 bg-brand-black text-brand-yellow font-bold text-sm rounded-xl hover:bg-gray-800 transition-colors shadow-sm"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
