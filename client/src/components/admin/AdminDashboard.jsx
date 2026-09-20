import React, { useState, useEffect } from 'react';
import {
  ChefHat,
  Package,
  Plus,
  Trash2,
  Edit2
} from 'lucide-react';
import { api } from '../../services/api';
import { useOrder } from '../../context/OrderContext';

export default function AdminDashboard({ onSwitchToCustomer }) {
  const { orders, updateOrderStatus, fetchOrders } = useOrder();
  const [activeTab, setActiveTab] = useState('orders'); // 'orders' or 'products'
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [orderFilter, setOrderFilter] = useState('all');

  // New product form modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [newProduct, setNewProduct] = useState({
    name: '',
    categoryId: 'bhel',
    price: '',
    description: '',
    imageUrl: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=600&q=80',
    isCooked: true,
    allowsSpiceCustomization: true,
    isAvailable: true
  });

  // Fetch products for admin management
  const fetchProducts = async () => {
    try {
      const res = await api.getProducts();
      if (res && res.data) {
        setProducts(res.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchOrders();
    const interval = setInterval(() => {
      fetchOrders();
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // Stock toggle action
  const handleToggleStock = async (productId, currentStatus) => {
    try {
      const res = await api.updateProduct(productId, { isAvailable: !currentStatus });
      if (res && res.data) {
        setProducts(prev => prev.map(p => (p.id === productId ? res.data : p)));
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Price change action
  const handlePriceChange = async (productId) => {
    const newPriceStr = window.prompt('Enter new price for this item:');
    if (!newPriceStr || isNaN(Number(newPriceStr))) return;
    try {
      const res = await api.updateProduct(productId, { price: Number(newPriceStr) });
      if (res && res.data) {
        setProducts(prev => prev.map(p => (p.id === productId ? res.data : p)));
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Delete product action
  const handleDeleteProduct = async (productId) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    try {
      await api.deleteProduct(productId);
      setProducts(prev => prev.filter(p => p.id !== productId));
    } catch (err) {
      console.error(err);
    }
  };

  // Create product action
  const handleCreateProduct = async (e) => {
    e.preventDefault();
    if (!newProduct.name || !newProduct.price) return;
    setLoading(true);
    try {
      const res = await api.createProduct({
        ...newProduct,
        price: Number(newProduct.price)
      });
      if (res && res.data) {
        setProducts(prev => [res.data, ...prev]);
        setShowAddModal(false);
        setNewProduct({
          name: '',
          categoryId: 'bhel',
          price: '',
          description: '',
          imageUrl: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=600&q=80',
          isCooked: true,
          allowsSpiceCustomization: true,
          isAvailable: true
        });
      }
    } catch (err) {
      alert(err.message || 'Failed to create product');
    } finally {
      setLoading(false);
    }
  };

  // Filter orders
  const filteredOrders = orders.filter(o => {
    if (orderFilter === 'all') return true;
    return o.status === orderFilter;
  });

  const totalRevenue = orders
    .filter(o => o.status !== 'cancelled')
    .reduce((sum, o) => sum + (o.total || 0), 0);

  const pendingCount = orders.filter(o => ['placed', 'accepted', 'preparing'].includes(o.status)).length;

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-20">
      {/* Top Banner */}
      <div className="bg-brand-black text-white rounded-3xl p-5 sm:p-6 shadow-xl border border-gray-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-2xl bg-brand-yellow flex items-center justify-center text-brand-black shadow-yellow-glow">
              <ChefHat className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-white leading-tight">
                Bhook_Lgi Kitchen HQ
              </h2>
              <span className="text-xs text-brand-yellow font-bold uppercase tracking-wider">
                Admin Control Dashboard
              </span>
            </div>
          </div>
        </div>

        {/* Quick stats and customer app switcher */}
        <div className="flex items-center gap-3">
          <div className="bg-gray-900 border border-gray-800 px-3.5 py-2 rounded-2xl text-center">
            <span className="block text-[10px] text-gray-400 font-bold uppercase">Active Orders</span>
            <span className="text-base font-black text-brand-yellow">{pendingCount}</span>
          </div>

          <div className="bg-gray-900 border border-gray-800 px-3.5 py-2 rounded-2xl text-center">
            <span className="block text-[10px] text-gray-400 font-bold uppercase">Today's Revenue</span>
            <span className="text-base font-black text-emerald-400">₹{totalRevenue}</span>
          </div>

          <button
            onClick={onSwitchToCustomer}
            className="px-4 py-2.5 bg-brand-yellow hover:bg-brand-yellowHover text-brand-black font-black text-xs rounded-2xl shadow-yellow-glow transition-all"
          >
            Switch to App ➔
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center justify-between border-b border-gray-200 pb-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('orders')}
            className={`px-4 py-2 rounded-2xl text-xs font-black transition-all ${
              activeTab === 'orders'
                ? 'bg-brand-black text-brand-yellow shadow-md'
                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            Live Orders Queue ({orders.length})
          </button>

          <button
            onClick={() => setActiveTab('products')}
            className={`px-4 py-2 rounded-2xl text-xs font-black transition-all ${
              activeTab === 'products'
                ? 'bg-brand-black text-brand-yellow shadow-md'
                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            Inventory & Stock ({products.length})
          </button>
        </div>

        {activeTab === 'orders' ? (
          <div className="flex items-center gap-1.5 overflow-x-auto text-xs font-bold">
            {['all', 'placed', 'accepted', 'preparing', 'ready', 'out_for_delivery', 'delivered'].map((st) => (
              <button
                key={st}
                onClick={() => setOrderFilter(st)}
                className={`px-2.5 py-1 rounded-xl uppercase text-[10px] tracking-wider transition-all ${
                  orderFilter === st
                    ? 'bg-brand-yellow text-brand-black font-black'
                    : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        ) : (
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1 px-3.5 py-1.5 bg-brand-yellow text-brand-black rounded-xl font-bold text-xs shadow-xs hover:bg-brand-yellowHover"
          >
            <Plus className="w-3.5 h-3.5 stroke-[3]" />
            <span>Add Product</span>
          </button>
        )}
      </div>

      {/* TAB 1: ORDERS QUEUE */}
      {activeTab === 'orders' && (
        <div className="space-y-4">
          {filteredOrders.length === 0 ? (
            <div className="bg-white rounded-3xl p-10 text-center border border-gray-100 text-gray-500">
              <Package className="w-10 h-10 mx-auto mb-2 opacity-40 text-gray-400" />
              <p className="text-sm font-bold">No orders found in "{orderFilter}" status.</p>
            </div>
          ) : (
            filteredOrders.map((ord) => {
              const timeStr = new Date(ord.createdAt).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit'
              });

              return (
                <div
                  key={ord.id}
                  className="bg-white rounded-3xl p-5 border border-gray-100 shadow-soft space-y-4 hover:shadow-card-lift transition-shadow"
                >
                  {/* Order Card Header */}
                  <div className="flex flex-wrap items-start justify-between gap-2 pb-3 border-b border-gray-100">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-base font-black text-brand-black">
                          {ord.orderNumber}
                        </span>
                        <span className="text-xs font-bold text-gray-400">• {timeStr}</span>
                        <span className="text-[11px] font-black uppercase px-2 py-0.5 rounded-full bg-brand-yellowLight text-brand-yellowHover">
                          {ord.deliveryType === 'pickup' ? '🏃 Pickup' : '🚪 Room Delivery'}
                        </span>
                      </div>
                      <div className="text-xs text-gray-600 font-semibold mt-1 flex items-center gap-3">
                        <span className="text-brand-black font-extrabold">{ord.customerName}</span>
                        <span>📱 {ord.customerPhone}</span>
                        <span className="bg-gray-100 px-2 py-0.5 rounded-md font-black text-brand-black">
                          📍 {ord.hostel}, Room {ord.roomNumber}
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-lg font-black text-brand-black">₹{ord.total}</div>
                      <span
                        className={`inline-block text-[10px] font-black uppercase px-2 py-0.5 rounded-full mt-0.5 ${
                          ord.status === 'delivered'
                            ? 'bg-emerald-100 text-emerald-800'
                            : ord.status === 'cancelled'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-yellow-100 text-yellow-800 border border-yellow-300 animate-pulse'
                        }`}
                      >
                        {ord.status}
                      </span>
                    </div>
                  </div>

                  {/* Items list */}
                  <div className="space-y-1.5 bg-brand-cream/50 rounded-2xl p-3 border border-gray-100">
                    <div className="text-[10px] font-black uppercase tracking-wider text-gray-400">
                      Ordered Items:
                    </div>
                    {ord.items?.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center text-xs">
                        <div className="font-bold text-brand-black">
                          {item.quantity}x {item.productName || item.name}
                          {item.variant && <span className="text-gray-500 font-normal"> ({item.variant})</span>}
                          {item.spiceLevel && (
                            <span className="ml-1.5 px-1.5 py-0.2 bg-red-100 text-red-700 text-[10px] font-black rounded-md">
                              {item.spiceLevel === 'spicy' ? '🌶️ Spicy' : '🙂 Non-Spicy'}
                            </span>
                          )}
                          {item.addons && item.addons.length > 0 && (
                            <span className="text-[10px] text-gray-500 ml-1">
                              (+{item.addons.join(', ')})
                            </span>
                          )}
                        </div>
                        <span className="font-black text-brand-black">
                          ₹{item.itemTotal || item.priceAtOrder * item.quantity}
                        </span>
                      </div>
                    ))}

                    {ord.deliveryNotes && (
                      <div className="pt-2 border-t border-gray-200/60 text-[11px] text-gray-600">
                        <span className="font-bold text-gray-800">Hostel Note:</span> "{ord.deliveryNotes}"
                      </div>
                    )}
                  </div>

                  {/* Admin Order Action Pipeline Buttons */}
                  <div>
                    <div className="text-[10px] font-black uppercase tracking-wider text-gray-400 mb-1.5">
                      Advance Status Pipeline (Updates Customer View Instantly):
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        onClick={() => updateOrderStatus(ord.id, 'accepted')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all ${
                          ord.status === 'accepted'
                            ? 'bg-purple-600 text-white shadow-xs'
                            : 'bg-purple-50 text-purple-700 hover:bg-purple-100'
                        }`}
                      >
                        1. Accept Order 🔥
                      </button>

                      <button
                        onClick={() => updateOrderStatus(ord.id, 'preparing')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all ${
                          ord.status === 'preparing'
                            ? 'bg-yellow-500 text-black shadow-xs ring-2 ring-yellow-300'
                            : 'bg-yellow-50 text-yellow-800 hover:bg-yellow-100'
                        }`}
                      >
                        2. Preparing 🍜
                      </button>

                      <button
                        onClick={() => updateOrderStatus(ord.id, 'ready')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all ${
                          ord.status === 'ready'
                            ? 'bg-teal-600 text-white shadow-xs'
                            : 'bg-teal-50 text-teal-700 hover:bg-teal-100'
                        }`}
                      >
                        3. Ready 🥡
                      </button>

                      <button
                        onClick={() => updateOrderStatus(ord.id, 'out_for_delivery')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all ${
                          ord.status === 'out_for_delivery'
                            ? 'bg-amber-600 text-white shadow-xs ring-2 ring-amber-300'
                            : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
                        }`}
                      >
                        4. Out for Delivery 🛵
                      </button>

                      <button
                        onClick={() => updateOrderStatus(ord.id, 'delivered')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all ${
                          ord.status === 'delivered'
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                        }`}
                      >
                        5. Delivered 🎉
                      </button>

                      <button
                        onClick={() => updateOrderStatus(ord.id, 'cancelled')}
                        className="px-3 py-1.5 rounded-xl text-xs font-extrabold bg-red-50 text-red-700 hover:bg-red-100 transition-all ml-auto"
                      >
                        Cancel ❌
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* TAB 2: INVENTORY & STOCK MANAGEMENT */}
      {activeTab === 'products' && (
        <div className="space-y-4">
          <div className="p-4 bg-brand-yellowLight/80 border border-brand-yellow/30 rounded-2xl text-xs font-semibold text-brand-black flex items-center justify-between">
            <span>
              💡 <strong>Stock availability is dynamic!</strong> Toggle items to "Out of Stock 🔴" whenever limited hostel ingredients run out. The customer menu updates immediately.
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {products.map((prod) => {
              const isAvail = prod.isAvailable !== false;
              return (
                <div
                  key={prod.id}
                  className={`bg-white rounded-3xl p-4 border transition-all flex flex-col justify-between ${
                    isAvail ? 'border-gray-100 shadow-soft' : 'border-red-200 bg-red-50/20 opacity-80'
                  }`}
                >
                  <div className="flex gap-3">
                    <img
                      src={prod.imageUrl}
                      alt={prod.name}
                      className="w-16 h-16 rounded-2xl object-cover bg-gray-100 shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-1">
                        <h4 className="font-black text-sm text-brand-black leading-snug truncate">
                          {prod.name}
                        </h4>
                        <button
                          onClick={() => handleDeleteProduct(prod.id)}
                          className="text-gray-400 hover:text-brand-chili p-1"
                          title="Delete product"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <span className="inline-block text-[10px] font-bold text-gray-400 uppercase">
                        {prod.categoryId} {prod.isCooked ? '• Cooked' : '• Raw'}
                      </span>

                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-sm font-black text-brand-black">₹{prod.price}</span>
                        <button
                          onClick={() => handlePriceChange(prod.id)}
                          className="text-[10px] font-bold text-blue-600 hover:underline flex items-center gap-0.5"
                        >
                          <Edit2 className="w-2.5 h-2.5" /> Edit Price
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Dynamic Stock Toggle */}
                  <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-600">Stock Status:</span>
                    <button
                      onClick={() => handleToggleStock(prod.id, isAvail)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 ${
                        isAvail
                          ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                          : 'bg-red-100 text-red-800 hover:bg-red-200'
                      }`}
                    >
                      <span>{isAvail ? 'Available 🟢' : 'Out of Stock 🔴'}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Add New Product Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-gray-100 animate-bounce-in">
            <h3 className="text-lg font-black text-brand-black mb-1">Add Product to Hostel Menu</h3>
            <p className="text-xs text-gray-500 mb-4">Enter product details and base price.</p>

            <form onSubmit={handleCreateProduct} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-gray-700 mb-1">Product Title</label>
                <input
                  type="text"
                  required
                  value={newProduct.name}
                  onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                  placeholder="e.g. Cheese Peri-Peri Maggie"
                  className="w-full px-3 py-2 border rounded-xl font-bold focus:outline-none focus:border-brand-yellow"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Category</label>
                  <select
                    value={newProduct.categoryId}
                    onChange={(e) => setNewProduct({ ...newProduct, categoryId: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl font-bold focus:outline-none focus:border-brand-yellow"
                  >
                    <option value="bhel">Bhel</option>
                    <option value="maggie">Maggie</option>
                    <option value="snacks">Snacks</option>
                    <option value="biscuits">Biscuits</option>
                    <option value="cooked">Cooked</option>
                    <option value="uncooked">Uncooked</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">Price (₹)</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={newProduct.price}
                    onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                    placeholder="e.g. 50"
                    className="w-full px-3 py-2 border rounded-xl font-bold focus:outline-none focus:border-brand-yellow"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={newProduct.description}
                  onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                  placeholder="Short description of taste and ingredients..."
                  className="w-full px-3 py-2 border rounded-xl font-medium focus:outline-none focus:border-brand-yellow"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Image URL</label>
                <input
                  type="url"
                  value={newProduct.imageUrl}
                  onChange={(e) => setNewProduct({ ...newProduct, imageUrl: e.target.value })}
                  placeholder="https://..."
                  className="w-full px-3 py-2 border rounded-xl font-medium focus:outline-none focus:border-brand-yellow"
                />
              </div>

              <div className="flex items-center gap-4 pt-1">
                <label className="flex items-center gap-1.5 font-bold text-gray-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newProduct.isCooked}
                    onChange={(e) => setNewProduct({ ...newProduct, isCooked: e.target.checked })}
                    className="rounded text-brand-yellow"
                  />
                  <span>Cooked Item</span>
                </label>

                <label className="flex items-center gap-1.5 font-bold text-gray-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newProduct.allowsSpiceCustomization}
                    onChange={(e) => setNewProduct({ ...newProduct, allowsSpiceCustomization: e.target.checked })}
                    className="rounded text-brand-yellow"
                  />
                  <span>Spice Customizable</span>
                </label>
              </div>

              <div className="flex items-center gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-2.5 bg-gray-100 font-bold rounded-xl text-gray-700 hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-2.5 bg-brand-yellow text-brand-black font-black rounded-xl shadow-yellow-glow hover:bg-brand-yellowHover"
                >
                  {loading ? 'Saving...' : 'Add Item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
