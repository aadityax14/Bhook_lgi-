import React, { useEffect, useState } from 'react';
import { X, MapPin, Phone, User, FileText, CheckCircle2, Bike, Store, ArrowLeft } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { computeFees } from '../../utils/fees';
import { useOrder } from '../../context/OrderContext';
import { useAuth } from '../../context/AuthContext';
import LoginModal from '../common/LoginModal';

const HOSTEL_OPTIONS = ['GH1', 'GH3', 'GH4', 'GH11', 'GH12', 'BH1', 'BH2', 'Other'];

export default function CheckoutModal({ isOpen, onClose, onOrderPlaced }) {
  const { items, subtotal, clearCart, applyServerPrices, feeSettings, refreshFeeSettings, orderType } = useCart();
  const { placeOrder, loading } = useOrder();
  const { user, updateUser, isAuthenticated } = useAuth();

  const [formData, setFormData] = useState({
    name: user.name || 'Aaditya Yadav',
    phone: user.phone || '9876543210',
    hostel: user.hostel || 'GH4',
    roomNumber: user.roomNumber || '',
    deliveryType: 'room_delivery', // 'room_delivery' or 'pickup'
    notes: user.deliveryNote || 'Please call when you reach the wing.'
  });

  useEffect(() => {
  if (isOpen) {
    setFormData(prev => ({
      ...prev,
      hostel: user.hostel || 'GH4',
      roomNumber: user.roomNumber || '',
      name: user.name || 'Aaditya Yadav',
      phone: user.phone || '9876543210',
      // Default delivery note from My Profile
      ...(user.deliveryNote ? { notes: user.deliveryNote } : {})
    }));
  }
}, [isOpen, user.hostel, user.roomNumber, user.name, user.phone, user.deliveryNote]);

  const [error, setError] = useState(null);
  const [kitchenClosed, setKitchenClosed] = useState(false);

  // Charges for the hostel and service type chosen on this form.
  const { deliveryFee, packagingFee, total, sameHostel } = computeFees({
    settings: feeSettings,
    subtotal,
    hostel: formData.hostel,
    deliveryType: formData.deliveryType,
    orderType
  });

  if (!isOpen) return null;

  // Ordering requires an account. Show sign-in first; once the user
  // signs in, isAuthenticated flips and the checkout form appears.
  if (!isAuthenticated) {
    return <LoginModal onClose={onClose} onSuccess={() => {}} />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setKitchenClosed(false);

    // Kitchen closed by the admin (food only — Zuxu is always open).
    if (orderType === 'food' && feeSettings?.kitchenOpen === false) {
      setError(null);
      setKitchenClosed(true);
      refreshFeeSettings();
      return;
    }

    if (!formData.name.trim() || !formData.roomNumber.trim() || !formData.phone.trim()) {
      setError('Please fill in your name, room number, and mobile number!');
      return;
    }

    setError(null);

    // Save preferred user details to context & storage
    updateUser({
      name: formData.name,
      phone: formData.phone,
      hostel: formData.hostel,
      roomNumber: formData.roomNumber
    });

    const orderPayload = {
      customerName: formData.name,
      customerPhone: formData.phone,
      hostel: formData.hostel,
      roomNumber: formData.roomNumber,
      deliveryType: formData.deliveryType,
      deliveryNotes: formData.notes,
      items: items.map(i => ({
        productId: i.productId,
        productName: i.name,
        variant: i.variantName,
        variantId: i.variant?.id || null,
        spiceLevel: i.spiceLevel,
        addons: i.addons,
        quantity: i.quantity,
        // Zuxu choices / special instructions
        ...(i.customization && Object.keys(i.customization).length > 0
          ? { customization: i.customization }
          : {}),
        priceAtOrder: i.unitPrice,
        itemTotal: i.itemTotal
      })),
      subtotal,
      deliveryFee,
      packagingFee,
      total
    };

    try {
      console.log("ORDER PAYLOAD:", orderPayload);
      const created = await placeOrder(orderPayload);
      clearCart();
      onOrderPlaced(created);
    } catch (err) {
      // Kitchen changed a price: refresh the cart so the shown total
      // matches what will be charged, and let the customer confirm again.
      if (err.code === 'PRICE_CHANGED' && err.data?.items) {
        applyServerPrices(err.data.items);
        // Charges may have changed too (admin update or chef duty list).
        refreshFeeSettings();
      }

      // Admin closed the kitchen while the customer was checking out.
      if (err.code === 'KITCHEN_CLOSED') {
        refreshFeeSettings();
        setKitchenClosed(true);
        return;
      }
      setError(err.message || 'Could not place order. Please try again.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">

      {/* Kitchen closed pop-up (shown over the checkout) */}
      {kitchenClosed && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4"
          onClick={() => setKitchenClosed(false)}
        >
          <div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="kitchen-closed-title"
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm rounded-3xl bg-white p-6 text-center shadow-2xl animate-bounce-in"
          >
            <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-red-50 text-3xl">
              🔒
            </div>
            <h3 id="kitchen-closed-title" className="text-xl font-black text-brand-black">
              Kitchen is closed right now
            </h3>
            <p className="mt-2 text-sm text-gray-600">
              You can order it when the kitchen opens. Your cart is saved, so just come back
              and tap Place Order again.
            </p>
            <button
              type="button"
              onClick={() => setKitchenClosed(false)}
              autoFocus
              className="mt-5 w-full rounded-2xl bg-brand-yellow py-3 font-black text-brand-black"
            >
              Okay
            </button>
          </div>
        </div>
      )}

      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden animate-bounce-in my-auto">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 bg-brand-cream/80 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="p-1 rounded-xl text-gray-500 hover:text-brand-black hover:bg-gray-100"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h2 className="font-black text-lg text-brand-black">Hostel Delivery Checkout</h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Checkout Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
          {error && (
            <div className="p-3 bg-red-50 text-red-700 text-xs font-bold rounded-xl border border-red-200">
              ⚠️ {error}
            </div>
          )}

          {/* Delivery Mode Toggle */}
          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-gray-500 mb-1.5">
              Choose Service Type
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, deliveryType: 'room_delivery' })}
                className={`p-3 rounded-2xl border flex items-center gap-2.5 transition-all ${
                  formData.deliveryType === 'room_delivery'
                    ? 'border-brand-yellow bg-brand-yellowLight text-brand-black font-black shadow-xs'
                    : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Bike className="w-4 h-4 text-brand-yellow" />
                <div className="text-left">
                  <div className="text-xs">Room Delivery</div>
                  <div className="text-[10px] text-gray-500 font-normal">Direct to your door</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setFormData({ ...formData, deliveryType: 'pickup' })}
                className={`p-3 rounded-2xl border flex items-center gap-2.5 transition-all ${
                  formData.deliveryType === 'pickup'
                    ? 'border-brand-yellow bg-brand-yellowLight text-brand-black font-black shadow-xs'
                    : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Store className="w-4 h-4 text-brand-yellow" />
                <div className="text-left">
                  <div className="text-xs">Kitchen Pickup</div>
                  <div className="text-[10px] text-gray-500 font-normal">Grab directly at mess</div>
                </div>
              </button>
            </div>
          </div>

          {/* Student Name & Phone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Your Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Aaditya Yadav"
                  className="w-full pl-9 pr-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold focus:outline-none focus:border-brand-yellow focus:bg-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Mobile Phone (For Call)</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="e.g. 9876543210"
                  className="w-full pl-9 pr-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold focus:outline-none focus:border-brand-yellow focus:bg-white"
                />
              </div>
            </div>
          </div>

          {/* Hostel Selection */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1.5">
              Select Hostel / Building
            </label>
            <div className="grid grid-cols-4 gap-1.5">
              {HOSTEL_OPTIONS.map((h) => (
                <button
                  key={h}
                  type="button"
                  onClick={() => setFormData({ ...formData, hostel: h })}
                  className={`py-2 text-xs font-extrabold rounded-xl border transition-all ${
                    formData.hostel === h
                      ? 'bg-brand-black text-brand-yellow border-brand-black shadow-xs'
                      : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  {h}
                </button>
              ))}
            </div>
          </div>

          {/* Room Number & Floor details */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              Room Number & Wing
            </label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                required
                value={formData.roomNumber}
                onChange={(e) => setFormData({ ...formData, roomNumber: e.target.value })}
                placeholder="e.g. Room 312, 3rd Floor, West Wing"
                className="w-full pl-9 pr-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold focus:outline-none focus:border-brand-yellow focus:bg-white"
              />
            </div>
          </div>

          {/* Special Order Notes */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              Order Notes / Delivery Instructions
            </label>
            <div className="relative">
              <FileText className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
              <textarea
                rows={2}
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder='e.g. "Please call when you arrive at the hostel gate."'
                className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium focus:outline-none focus:border-brand-yellow focus:bg-white"
              />
            </div>
          </div>

          {/* Order Summary Box */}
          <div className="p-3.5 bg-brand-cream/60 rounded-2xl border border-gray-200/70 space-y-1.5 text-xs">
            <div className="font-extrabold text-brand-black flex items-center justify-between pb-1 border-b border-gray-200">
              <span>Order Summary ({items.length} items)</span>
              <span>₹{total}</span>
            </div>
            {items.map((i, idx) => (
              <div key={idx} className="flex justify-between text-gray-600 text-[11px]">
                <span>
                  {i.quantity}x {i.name} {i.spiceLevel ? `(${i.spiceLevel === 'spicy' ? '🌶️' : '🙂'})` : ''}
                </span>
                <span className="font-bold">₹{i.itemTotal}</span>
              </div>
            ))}

            <div className="pt-1.5 mt-1 border-t border-gray-200 space-y-1 text-[11px] text-gray-600">
              <div className="flex justify-between">
                <span>
                  Delivery
                  {formData.deliveryType === 'pickup'
                    ? ' (pickup)'
                    : sameHostel
                    ? ` · chef in ${formData.hostel} today 🎉`
                    : ''}
                </span>
                <span className="font-bold">{deliveryFee === 0 ? 'FREE' : `₹${deliveryFee}`}</span>
              </div>
              <div className="flex justify-between">
                <span>Packing</span>
                <span className="font-bold">₹{packagingFee}</span>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 px-6 bg-brand-yellow hover:bg-brand-yellowHover text-brand-black font-black text-sm rounded-2xl shadow-yellow-glow flex items-center justify-between transition-all active:scale-98 disabled:opacity-50"
          >
            <span className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-brand-black" />
              {loading ? 'Sending to Kitchen...' : 'Place Order Now'}
            </span>
            <span className="bg-brand-black text-brand-yellow px-3 py-1 rounded-xl text-xs font-black">
              ₹{total}
            </span>
          </button>
        </form>
      </div>
    </div>
  );
}
