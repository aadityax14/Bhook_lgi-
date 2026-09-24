import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  CheckCircle2,
  ChefHat,
  Edit2,
  ImagePlus,
  Package,
  Plus,
  RefreshCw,
  ShoppingBag,
  Trash2,
  X,
  Upload,
  AlertCircle,
  Check,
} from 'lucide-react';

import { api } from '../../services/api';
import { useOrder } from '../../context/OrderContext';


// ============================================================
// IMAGE COMPRESSION
// ============================================================

const compressImage = (file) => {
  return new Promise((resolve, reject) => {
    if (!file) {
      reject(new Error('No image selected.'));
      return;
    }

    if (!file.type.startsWith('image/')) {
      reject(new Error('Please select an image file.'));
      return;
    }

    const reader = new FileReader();

    reader.onload = (event) => {
      const img = new Image();

      img.onload = () => {
        const MAX_SIZE = 1000;

        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_SIZE) {
            height = Math.round((height * MAX_SIZE) / width);
            width = MAX_SIZE;
          }
        } else {
          if (height > MAX_SIZE) {
            width = Math.round((width * MAX_SIZE) / height);
            height = MAX_SIZE;
          }
        }

        const canvas = document.createElement('canvas');

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');

        if (!ctx) {
          reject(new Error('Could not process image.'));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        const compressedImage = canvas.toDataURL(
          'image/jpeg',
          0.75
        );

        resolve(compressedImage);
      };

      img.onerror = () => {
        reject(new Error('Could not process image.'));
      };

      img.src = event.target.result;
    };

    reader.onerror = () => {
      reject(new Error('Could not read image.'));
    };

    reader.readAsDataURL(file);
  });
};


// ============================================================
// HELPERS
// ============================================================

const isBhelProduct = (product) => {
  if (!product) return false;

  const name = product.name?.toLowerCase() || '';

  return (
    product.categoryId === 'bhel' ||
    name.includes('bhel')
  );
};


const isFullBhel = (product) => {
  const name = product?.name?.toLowerCase() || '';

  return name.includes('full');
};


const getBhelAvailableQuantity = (product, sharedQuantity) => {
  const quantity = Number(sharedQuantity || 0);

  if (isFullBhel(product)) {
    return quantity;
  }

  return quantity * 2;
};


const getNormalStock = (product) => {
  return Number(product?.stockQuantity ?? 0);
};


// ============================================================
// COMPONENT
// ============================================================

export default function AdminDashboard({
  onBack,
  onSwitchToCustomer,
}) {
  const {
    orders,
    updateOrderStatus,
    fetchOrders,
  } = useOrder();

  const [activeTab, setActiveTab] = useState('orders');

  const [products, setProducts] = useState([]);

  const [loadingProducts, setLoadingProducts] = useState(true);

  const [refreshing, setRefreshing] = useState(false);

  const [stockDrafts, setStockDrafts] = useState({});

  const [bhelHalfDraft, setBhelHalfDraft] = useState(null);

  const [savingStockId, setSavingStockId] = useState(null);

  const [savingBhelStock, setSavingBhelStock] =
    useState(false);

  const [statusSavingId, setStatusSavingId] =
    useState(null);

  const [deletingProductId, setDeletingProductId] =
    useState(null);


  // ==========================================================
  // ADD PRODUCT
  // ==========================================================

  const [showAddProduct, setShowAddProduct] =
    useState(false);

  const [creatingProduct, setCreatingProduct] =
    useState(false);

  const [newProduct, setNewProduct] = useState({
    name: '',
    price: '',
    categoryId: 'snacks',
    description: '',
    imageUrl: '',
    isCooked: false,
    allowsSpiceCustomization: false,
    isAvailable: true,
  });

  const [newImageLoading, setNewImageLoading] =
    useState(false);


  // ==========================================================
  // EDIT PRODUCT
  // ==========================================================

  const [editingProduct, setEditingProduct] =
    useState(null);

  const [editForm, setEditForm] = useState({
    name: '',
    price: '',
    imageUrl: '',
    description: '',
    isAvailable: true,
  });

  const [editSaving, setEditSaving] =
    useState(false);

  const [editImageLoading, setEditImageLoading] =
    useState(false);


  // ==========================================================
  // TOAST
  // ==========================================================

  const [toast, setToast] = useState(null);


  // ==========================================================
  // FETCH PRODUCTS
  // ==========================================================

  const fetchProducts = async () => {
    try {
      const response = await api.getProducts();

      if (response?.data) {
        setProducts(response.data);
      }
    } catch (error) {
      console.error(
        'Could not fetch products:',
        error
      );

      showToast(
        'error',
        error.message || 'Could not load products'
      );
    } finally {
      setLoadingProducts(false);
    }
  };


  // ==========================================================
  // TOAST
  // ==========================================================

  const showToast = (type, message) => {
    setToast({
      type,
      message,
    });

    setTimeout(() => {
      setToast(null);
    }, 3000);
  };


  // ==========================================================
  // INITIAL LOAD
  // ==========================================================

  useEffect(() => {
    fetchProducts();
    fetchOrders();
  }, []);


  // ==========================================================
  // AUTO REFRESH
  // ==========================================================

  useEffect(() => {
    const interval = setInterval(() => {
      fetchProducts();
      fetchOrders();
    }, 4000);

    return () => clearInterval(interval);
  }, []);


  // ==========================================================
  // MANUAL REFRESH
  // ==========================================================

  const handleRefresh = async () => {
    try {
      setRefreshing(true);

      await Promise.all([
        fetchProducts(),
        fetchOrders(),
      ]);

      showToast(
        'success',
        'Dashboard refreshed ✓'
      );
    } catch (error) {
      showToast(
        'error',
        'Could not refresh dashboard'
      );
    } finally {
      setRefreshing(false);
    }
  };


  // ==========================================================
  // PRODUCT GROUPS
  // ==========================================================

  const bhelProducts = useMemo(() => {
    return products.filter(isBhelProduct);
  }, [products]);


  const normalProducts = useMemo(() => {
    return products.filter(
      (product) => !isBhelProduct(product)
    );
  }, [products]);


  // ==========================================================
  // BHEL SHARED STOCK
  // ==========================================================

  const bhelHalfStock = useMemo(() => {
    const bhel = bhelProducts[0];

    if (!bhel) return 0;

    return Number(
      bhel.stockHalfUnits ?? 0
    );
  }, [bhelProducts]);


  const currentBhelHalfStock =
    bhelHalfDraft !== null
      ? Number(bhelHalfDraft)
      : bhelHalfStock;


  // ==========================================================
  // ORDER STATS
  // ==========================================================

  const activeOrders = orders.filter(
    (order) =>
      order.status !== 'delivered' &&
      order.status !== 'cancelled'
  );


  const placedOrders = orders.filter(
    (order) => order.status === 'placed'
  );


  const preparingOrders = orders.filter(
    (order) =>
      order.status === 'accepted' ||
      order.status === 'preparing'
  );


  const readyOrders = orders.filter(
    (order) => order.status === 'ready'
  );


  const deliveryOrders = orders.filter(
    (order) =>
      order.status === 'out_for_delivery'
  );


  // ==========================================================
  // TODAY'S BUSINESS DATA
  // ==========================================================

  const todayOrders = useMemo(() => {
    const now = new Date();

    return orders.filter((order) => {
      if (!order.createdAt) return false;

      const orderDate = new Date(order.createdAt);

      return (
        orderDate.getDate() === now.getDate() &&
        orderDate.getMonth() === now.getMonth() &&
        orderDate.getFullYear() === now.getFullYear()
      );
    });
  }, [orders]);


  const validTodayOrders = useMemo(() => {
    return todayOrders.filter(
      (order) => order.status !== 'cancelled'
    );
  }, [todayOrders]);


  const todayRevenue = useMemo(() => {
    return validTodayOrders.reduce(
      (sum, order) =>
        sum + Number(order.total || 0),
      0
    );
  }, [validTodayOrders]);


  const todayItemsSold = useMemo(() => {
    return validTodayOrders.reduce(
      (sum, order) =>
        sum +
        (order.items || []).reduce(
          (itemSum, item) =>
            itemSum + Number(item.quantity || 0),
          0
        ),
      0
    );
  }, [validTodayOrders]);


  const todayDeliveryFees = useMemo(() => {
    return validTodayOrders.reduce(
      (sum, order) =>
        sum + Number(order.deliveryFee || 0),
      0
    );
  }, [validTodayOrders]);


  const todayAverageOrder = useMemo(() => {
    if (validTodayOrders.length === 0) {
      return 0;
    }

    return todayRevenue / validTodayOrders.length;
  }, [todayRevenue, validTodayOrders]);


  const todayCancelledOrders = useMemo(() => {
    return todayOrders.filter(
      (order) => order.status === 'cancelled'
    ).length;
  }, [todayOrders]);


  const todayDeliveredOrders = useMemo(() => {
    return todayOrders.filter(
      (order) => order.status === 'delivered'
    ).length;
  }, [todayOrders]);


  const todayActiveOrders = useMemo(() => {
    return todayOrders.filter(
      (order) =>
        order.status !== 'delivered' &&
        order.status !== 'cancelled'
    ).length;
  }, [todayOrders]);


  // ==========================================================
  // NORMAL STOCK SAVE
  // ==========================================================

  const handleSaveStock = async (product) => {
    const quantity = Number(
      stockDrafts[product.id] ??
      product.stockQuantity ??
      0
    );

    if (
      !Number.isInteger(quantity) ||
      quantity < 0
    ) {
      showToast(
        'error',
        'Enter a valid stock quantity'
      );

      return;
    }

    try {
      setSavingStockId(product.id);

      const response =
        await api.updateProduct(
          product.id,
          {
            stockQuantity: quantity,
            isAvailable: quantity > 0,
          }
        );

      if (!response?.data) {
        throw new Error(
          'Stock update failed'
        );
      }

      setProducts((previous) =>
        previous.map((item) =>
          item.id === product.id
            ? response.data
            : item
        )
      );

      setStockDrafts((previous) => {
        const next = {
          ...previous,
        };

        delete next[product.id];

        return next;
      });

      showToast(
        'success',
        `${product.name} stock saved ✓`
      );
    } catch (error) {
      console.error(
        'STOCK UPDATE ERROR:',
        error
      );

      showToast(
        'error',
        error.message ||
          'Could not save stock'
      );
    } finally {
      setSavingStockId(null);
    }
  };


  // ==========================================================
  // BHEL STOCK SAVE
  // ==========================================================

  const handleSaveBhelStock = async () => {
    const quantity = Number(
      currentBhelHalfStock
    );

    if (
      !Number.isInteger(quantity) ||
      quantity < 0
    ) {
      showToast(
        'error',
        'Enter a valid Bhel quantity'
      );

      return;
    }

    if (!bhelProducts.length) {
      showToast(
        'error',
        'No Bhel products found'
      );

      return;
    }

    try {
      setSavingBhelStock(true);

      /*
       * Bhel uses shared stock.
       *
       * 1 shared stock =
       * 1 Full Bhel
       * OR
       * 2 Half Bhel.
       */

      for (const product of bhelProducts) {
        await api.updateProduct(
          product.id,
          {
            stockHalfUnits: quantity,
            isAvailable: quantity > 0,
          }
        );
      }

      await fetchProducts();

      setBhelHalfDraft(null);

      showToast(
        'success',
        `Bhel shared stock saved: ${quantity} ✓`
      );
    } catch (error) {
      console.error(
        'BHEL STOCK ERROR:',
        error
      );

      showToast(
        'error',
        error.message ||
          'Could not save Bhel stock'
      );
    } finally {
      setSavingBhelStock(false);
    }
  };


  // ==========================================================
  // OPEN EDIT PRODUCT
  // ==========================================================

  const handleEditProduct = (product) => {
    setEditingProduct(product);

    setEditForm({
      name: product.name || '',
      price: String(
        product.price ?? ''
      ),
      imageUrl: product.imageUrl || '',
      description:
        product.description || '',
      isAvailable:
        product.isAvailable !== false,
    });
  };


  // ==========================================================
  // EDIT GALLERY IMAGE
  // ==========================================================

  const handleEditImageChange = async (
    event
  ) => {
    const file =
      event.target.files?.[0];

    if (!file) return;

    try {
      setEditImageLoading(true);

      const compressedImage =
        await compressImage(file);

      setEditForm((previous) => ({
        ...previous,
        imageUrl: compressedImage,
      }));

      showToast(
        'success',
        'Image selected ✓'
      );
    } catch (error) {
      showToast(
        'error',
        error.message ||
          'Could not process image'
      );
    } finally {
      setEditImageLoading(false);

      event.target.value = '';
    }
  };


  // ==========================================================
  // NEW PRODUCT GALLERY IMAGE
  // ==========================================================

  const handleNewImageChange = async (
    event
  ) => {
    const file =
      event.target.files?.[0];

    if (!file) return;

    try {
      setNewImageLoading(true);

      const compressedImage =
        await compressImage(file);

      setNewProduct((previous) => ({
        ...previous,
        imageUrl: compressedImage,
      }));

      showToast(
        'success',
        'Image selected ✓'
      );
    } catch (error) {
      showToast(
        'error',
        error.message ||
          'Could not process image'
      );
    } finally {
      setNewImageLoading(false);

      event.target.value = '';
    }
  };


  // ==========================================================
  // SAVE PRODUCT EDIT
  // ==========================================================

  const handleSaveProductEdit =
    async () => {
      if (!editingProduct) return;

      const name =
        editForm.name.trim();

      const price =
        Number(editForm.price);

      if (!name) {
        showToast(
          'error',
          'Product name is required'
        );

        return;
      }

      if (
        Number.isNaN(price) ||
        price < 0
      ) {
        showToast(
          'error',
          'Enter a valid price'
        );

        return;
      }

      try {
        setEditSaving(true);

        const response =
          await api.updateProduct(
            editingProduct.id,
            {
              name,
              price,
              imageUrl:
                editForm.imageUrl,
              description:
                editForm.description,
              isAvailable:
                editForm.isAvailable,
            }
          );

        if (!response?.data) {
          throw new Error(
            'Product update failed'
          );
        }

        setProducts((previous) =>
          previous.map((product) =>
            product.id ===
            editingProduct.id
              ? response.data
              : product
          )
        );

        setEditingProduct(null);

        showToast(
          'success',
          `${response.data.name} updated successfully ✓`
        );

        await fetchProducts();
      } catch (error) {
        console.error(
          'PRODUCT UPDATE ERROR:',
          error
        );

        showToast(
          'error',
          error.message ||
            'Could not update product'
        );
      } finally {
        setEditSaving(false);
      }
    };


  // ==========================================================
  // CREATE PRODUCT
  // ==========================================================

  const handleCreateProduct =
    async () => {
      const name =
        newProduct.name.trim();

      const price =
        Number(newProduct.price);

      if (!name) {
        showToast(
          'error',
          'Product name is required'
        );

        return;
      }

      if (
        Number.isNaN(price) ||
        price < 0
      ) {
        showToast(
          'error',
          'Enter a valid price'
        );

        return;
      }

      try {
        setCreatingProduct(true);

        const response =
          await api.createProduct({
            name,
            price,
            categoryId:
              newProduct.categoryId ||
              'snacks',

            description:
              newProduct.description ||
              '',

            imageUrl:
              newProduct.imageUrl ||
              '',

            isCooked:
              Boolean(
                newProduct.isCooked
              ),

            allowsSpiceCustomization:
              Boolean(
                newProduct.allowsSpiceCustomization
              ),

            isAvailable:
              Boolean(
                newProduct.isAvailable
              ),
          });

        if (!response?.data) {
          throw new Error(
            'Product creation failed'
          );
        }

        setProducts((previous) => [
          ...previous,
          response.data,
        ]);

        setNewProduct({
          name: '',
          price: '',
          categoryId: 'snacks',
          description: '',
          imageUrl: '',
          isCooked: false,
          allowsSpiceCustomization: false,
          isAvailable: true,
        });

        setShowAddProduct(false);

        showToast(
          'success',
          `${response.data.name} created successfully ✓`
        );

        await fetchProducts();
      } catch (error) {
        console.error(
          'CREATE PRODUCT ERROR:',
          error
        );

        showToast(
          'error',
          error.message ||
            'Could not create product'
        );
      } finally {
        setCreatingProduct(false);
      }
    };


  // ==========================================================
  // DELETE PRODUCT
  // ==========================================================

  const handleDeleteProduct =
    async (product) => {
      const confirmed =
        window.confirm(
          `Delete "${product.name}"?`
        );

      if (!confirmed) return;

      try {
        setDeletingProductId(
          product.id
        );

        await api.deleteProduct(
          product.id
        );

        setProducts((previous) =>
          previous.filter(
            (item) =>
              item.id !== product.id
          )
        );

        showToast(
          'success',
          `${product.name} deleted ✓`
        );
      } catch (error) {
        console.error(
          'DELETE ERROR:',
          error
        );

        showToast(
          'error',
          error.message ||
            'Could not delete product'
        );
      } finally {
        setDeletingProductId(null);
      }
    };


  // ==========================================================
  // ORDER STATUS
  // ==========================================================

  const handleOrderStatusChange =
    async (
      orderId,
      newStatus
    ) => {
      try {
        setStatusSavingId(orderId);

        await updateOrderStatus(
          orderId,
          newStatus
        );

        /*
         * When order becomes accepted,
         * backend deducts stock.
         *
         * Refresh products immediately
         * so admin sees new quantity.
         */

        await Promise.all([
          fetchOrders(),
          fetchProducts(),
        ]);

        showToast(
          'success',
          `Order moved to ${formatStatus(
            newStatus
          )} ✓`
        );
      } catch (error) {
        console.error(
          'ORDER STATUS ERROR:',
          error
        );

        showToast(
          'error',
          error.message ||
            'Could not update order'
        );
      } finally {
        setStatusSavingId(null);
      }
    };


  // ==========================================================
  // STATUS FORMAT
  // ==========================================================

  function formatStatus(status) {
    if (!status) return 'Unknown';

    return status
      .replaceAll('_', ' ')
      .replace(/\b\w/g, (char) =>
        char.toUpperCase()
      );
  }


  // ==========================================================
  // ORDER STATUS BUTTONS
  // ==========================================================

  const renderOrderActions = (
    order
  ) => {
    const saving =
      statusSavingId === order.id;

    if (order.status === 'placed') {
      return (
        <button
          disabled={saving}
          onClick={() =>
            handleOrderStatusChange(
              order.id,
              'accepted'
            )
          }
          className="px-4 py-2 rounded-xl bg-black text-white font-bold disabled:opacity-50"
        >
          {saving
            ? 'Accepting...'
            : 'Accept Order'}
        </button>
      );
    }

    if (
      order.status === 'accepted'
    ) {
      return (
        <button
          disabled={saving}
          onClick={() =>
            handleOrderStatusChange(
              order.id,
              'preparing'
            )
          }
          className="px-4 py-2 rounded-xl bg-brand-yellow text-black font-bold disabled:opacity-50"
        >
          {saving
            ? 'Updating...'
            : 'Start Preparing'}
        </button>
      );
    }

    if (
      order.status === 'preparing'
    ) {
      return (
        <button
          disabled={saving}
          onClick={() =>
            handleOrderStatusChange(
              order.id,
              'ready'
            )
          }
          className="px-4 py-2 rounded-xl bg-green-500 text-white font-bold disabled:opacity-50"
        >
          {saving
            ? 'Updating...'
            : 'Mark Ready'}
        </button>
      );
    }

    if (
      order.status === 'ready'
    ) {
      return (
        <div className="px-4 py-2 rounded-xl bg-green-100 text-green-700 font-bold">
          Ready for Delivery
        </div>
      );
    }

    if (
      order.status ===
      'out_for_delivery'
    ) {
      return (
        <div className="px-4 py-2 rounded-xl bg-blue-100 text-blue-700 font-bold">
          Out for Delivery
        </div>
      );
    }

    if (
      order.status === 'delivered'
    ) {
      return (
        <div className="px-4 py-2 rounded-xl bg-gray-100 text-gray-600 font-bold">
          Delivered
        </div>
      );
    }

    if (
      order.status === 'cancelled'
    ) {
      return (
        <div className="px-4 py-2 rounded-xl bg-red-100 text-red-600 font-bold">
          Cancelled
        </div>
      );
    }

    return null;
  };


  // ==========================================================
  // ORDER CARD
  // ==========================================================

  const renderOrderCard = (
    order
  ) => {
    return (
      <div
        key={order.id}
        className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5"
      >

        {/* TOP */}

        <div className="flex flex-wrap items-start justify-between gap-4">

          <div>

            <div className="flex items-center gap-2">

              <h3 className="font-black text-lg">
                #{order.id}
              </h3>

              <span className="px-3 py-1 rounded-full bg-gray-100 text-xs font-bold">
                {formatStatus(
                  order.status
                )}
              </span>

            </div>

            <p className="text-sm text-gray-500 mt-1">
              {order.customerName ||
                'Customer'}
            </p>

          </div>

          <div className="text-right">

            <div className="text-xl font-black">
              ₹{order.total}
            </div>

            <div className="text-xs text-gray-500">
              {order.hostel} • Room{' '}
              {order.roomNumber}
            </div>

          </div>

        </div>


        {/* ITEMS */}

        <div className="mt-5 space-y-2">

          {order.items?.map(
            (item, index) => (
              <div
                key={
                  item.productId ||
                  index
                }
                className="flex items-center justify-between bg-gray-50 rounded-xl px-3 py-2"
              >

                <div>

                  <span className="font-bold">
                    {item.quantity} ×{' '}
                    {item.productName ||
                      item.name ||
                      'Item'}
                  </span>

                  {item.variant && (
                    <span className="text-xs text-gray-500 ml-2">
                      {item.variant}
                    </span>
                  )}

                </div>

                <span className="font-bold">
                  ₹
                  {(
                    Number(
                      item.price || 0
                    ) *
                    Number(
                      item.quantity || 0
                    )
                  ).toFixed(0)}
                </span>

              </div>
            )
          )}

        </div>


        {/* DELIVERY */}

        <div className="mt-4 text-sm text-gray-600">

          <div>
            <strong>Hostel:</strong>{' '}
            {order.hostel}
          </div>

          <div>
            <strong>Room:</strong>{' '}
            {order.roomNumber}
          </div>

          {order.deliveryType && (
            <div>
              <strong>Delivery:</strong>{' '}
              {order.deliveryType}
            </div>
          )}

          {order.deliveryNotes && (
            <div className="mt-1">
              <strong>Note:</strong>{' '}
              {order.deliveryNotes}
            </div>
          )}

        </div>


        {/* ACTION */}

        <div className="mt-5 pt-4 border-t flex justify-end">
          {renderOrderActions(
            order
          )}
        </div>

      </div>
    );
  };


  // ==========================================================
  // PRODUCT IMAGE
  // ==========================================================

  const ProductImage = ({
    product,
    size = 'md',
  }) => {
    const sizeClass =
      size === 'sm'
        ? 'w-14 h-14'
        : 'w-20 h-20';

    return (
      <div
        className={`${sizeClass} rounded-2xl overflow-hidden bg-gray-100 flex-shrink-0`}
      >

        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt={product.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            <Package size={24} />
          </div>
        )}

      </div>
    );
  };


  // ==========================================================
  // PRODUCT INVENTORY CARD
  // ==========================================================

  const renderNormalProduct = (
    product
  ) => {
    const stock =
      stockDrafts[product.id] ??
      getNormalStock(product);

    const saving =
      savingStockId === product.id;

    return (
      <div
        key={product.id}
        className="bg-white rounded-3xl border border-gray-100 shadow-sm p-4"
      >

        <div className="flex gap-4">

          <ProductImage
            product={product}
          />

          <div className="flex-1 min-w-0">

            <div className="flex items-start justify-between gap-3">

              <div>

                <h3 className="font-black text-lg truncate">
                  {product.name}
                </h3>

                <p className="text-sm text-gray-500">
                  ₹{product.price}
                </p>

              </div>

              <button
                onClick={() =>
                  handleEditProduct(
                    product
                  )
                }
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-brand-yellow text-black font-bold text-sm"
              >
                <Edit2 size={15} />
                Edit
              </button>

            </div>


            {/* STOCK */}

            <div className="mt-4">

              <div className="flex items-center justify-between mb-2">

                <label className="text-xs font-bold text-gray-500">
                  STOCK
                </label>

                <span
                  className={`text-xs font-black ${
                    Number(stock) <= 0
                      ? 'text-red-600'
                      : Number(stock) <= 5
                      ? 'text-orange-600'
                      : 'text-green-600'
                  }`}
                >
                  {Number(stock) <= 0
                    ? 'OUT OF STOCK'
                    : `${stock} available`}
                </span>

              </div>

              <div className="flex gap-2">

                <input
                  type="number"
                  min="0"
                  value={stock}
                  onChange={(event) =>
                    setStockDrafts(
                      (previous) => ({
                        ...previous,
                        [product.id]:
                          event.target
                            .value,
                      })
                    )
                  }
                  className="flex-1 min-w-0 px-3 py-2.5 border border-gray-200 rounded-xl font-bold outline-none focus:ring-2 focus:ring-brand-yellow"
                />

                <button
                  disabled={saving}
                  onClick={() =>
                    handleSaveStock(
                      product
                    )
                  }
                  className="px-4 py-2.5 rounded-xl bg-black text-white font-bold disabled:opacity-50"
                >
                  {saving
                    ? 'Saving...'
                    : 'Save'}
                </button>

              </div>

            </div>

          </div>

        </div>


        {/* DELETE */}

        <div className="mt-4 pt-3 border-t flex justify-end">

          <button
            disabled={
              deletingProductId ===
              product.id
            }
            onClick={() =>
              handleDeleteProduct(
                product
              )
            }
            className="flex items-center gap-1.5 text-red-500 text-sm font-bold hover:text-red-700 disabled:opacity-50"
          >

            <Trash2 size={15} />

            {deletingProductId ===
            product.id
              ? 'Deleting...'
              : 'Delete'}

          </button>

        </div>

      </div>
    );
  };


  // ==========================================================
  // BHEL PRODUCT CARD
  // ==========================================================

  const renderBhelProduct = (
    product
  ) => {
    const available =
      getBhelAvailableQuantity(
        product,
        currentBhelHalfStock
      );

    return (
      <div
        key={product.id}
        className="bg-gray-50 rounded-2xl p-3 flex items-center gap-3"
      >

        <ProductImage
          product={product}
          size="sm"
        />

        <div className="flex-1 min-w-0">

          <h4 className="font-black truncate">
            {product.name}
          </h4>

          <p className="text-sm text-gray-500">
            ₹{product.price}
          </p>

          <p
            className={`text-xs font-bold ${
              available <= 0
                ? 'text-red-600'
                : available <= 5
                ? 'text-orange-600'
                : 'text-green-600'
            }`}
          >
            {available <= 0
              ? 'Out of Stock'
              : `${available} available`}
          </p>

        </div>

        <button
          onClick={() =>
            handleEditProduct(
              product
            )
          }
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-brand-yellow text-black font-bold text-sm"
        >
          <Edit2 size={15} />
          Edit
        </button>

      </div>
    );
  };


  // ==========================================================
  // HEADER
  // ==========================================================

  return (
    <div className="min-h-screen bg-[#fffdf5] text-gray-900">


      {/* ======================================================
          HEADER
      ====================================================== */}

      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-gray-100">

        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">

          <div className="flex items-center justify-between gap-4">

            <div className="flex items-center gap-3">

              {onBack && (
                <button
                  onClick={onBack}
                  className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center"
                >
                  <ArrowLeft size={20} />
                </button>
              )}

              <div>

                <div className="flex items-center gap-2">

                  <ChefHat
                    size={22}
                    className="text-brand-yellow"
                  />

                  <h1 className="text-xl sm:text-2xl font-black">
                    Bhook_Lgi Admin
                  </h1>

                </div>

                <p className="text-xs text-gray-500">
                  Orders • Inventory • Business
                </p>

              </div>

            </div>


            <div className="flex items-center gap-2">

              {onSwitchToCustomer && (
                <button
                  onClick={
                    onSwitchToCustomer
                  }
                  className="hidden sm:flex px-3 py-2 rounded-xl bg-gray-100 text-sm font-bold"
                >
                  Customer View
                </button>
              )}

              <button
                onClick={
                  handleRefresh
                }
                disabled={refreshing}
                className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center disabled:opacity-50"
              >
                <RefreshCw
                  size={18}
                  className={
                    refreshing
                      ? 'animate-spin'
                      : ''
                  }
                />
              </button>

            </div>

          </div>


          {/* ==================================================
              TABS
          ================================================== */}

          <div className="flex gap-2 mt-5 overflow-x-auto pb-1">

            {/* ORDERS */}

            <button
              onClick={() =>
                setActiveTab('orders')
              }
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm whitespace-nowrap ${
                activeTab === 'orders'
                  ? 'bg-black text-white'
                  : 'bg-gray-100 text-gray-600'
              }`}
            >

              <ShoppingBag size={17} />

              Orders

              {activeOrders.length > 0 && (
                <span
                  className={`px-1.5 py-0.5 rounded-full text-xs ${
                    activeTab === 'orders'
                      ? 'bg-white text-black'
                      : 'bg-black text-white'
                  }`}
                >
                  {activeOrders.length}
                </span>
              )}

            </button>


            {/* INVENTORY */}

            <button
              onClick={() =>
                setActiveTab('inventory')
              }
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm whitespace-nowrap ${
                activeTab === 'inventory'
                  ? 'bg-black text-white'
                  : 'bg-gray-100 text-gray-600'
              }`}
            >

              <Package size={17} />

              Inventory

            </button>


            {/* TODAY'S BUSINESS */}

            <button
              onClick={() =>
                setActiveTab('business')
              }
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm whitespace-nowrap ${
                activeTab === 'business'
                  ? 'bg-black text-white'
                  : 'bg-gray-100 text-gray-600'
              }`}
            >

              <ShoppingBag size={17} />

              Today's Business

            </button>

          </div>

        </div>

      </header>


      {/* ======================================================
          MAIN
      ====================================================== */}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">


        {/* ====================================================
            ORDERS TAB
        ==================================================== */}

        {activeTab === 'orders' && (
          <div className="space-y-6">


            {/* STATS */}

            <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">

              <div className="bg-white rounded-2xl border p-4">

                <p className="text-xs text-gray-500 font-bold">
                  NEW
                </p>

                <p className="text-2xl font-black mt-1">
                  {placedOrders.length}
                </p>

              </div>


              <div className="bg-white rounded-2xl border p-4">

                <p className="text-xs text-gray-500 font-bold">
                  PREPARING
                </p>

                <p className="text-2xl font-black mt-1">
                  {preparingOrders.length}
                </p>

              </div>


              <div className="bg-white rounded-2xl border p-4">

                <p className="text-xs text-gray-500 font-bold">
                  READY
                </p>

                <p className="text-2xl font-black mt-1">
                  {readyOrders.length}
                </p>

              </div>


              <div className="bg-white rounded-2xl border p-4">

                <p className="text-xs text-gray-500 font-bold">
                  DELIVERY
                </p>

                <p className="text-2xl font-black mt-1">
                  {deliveryOrders.length}
                </p>

              </div>


              <div className="bg-brand-yellow rounded-2xl border border-yellow-300 p-4 col-span-2 lg:col-span-1">

                <p className="text-xs text-black/60 font-bold">
                  ACTIVE
                </p>

                <p className="text-2xl font-black mt-1">
                  {activeOrders.length}
                </p>

              </div>

            </div>


            {/* ACTIVE ORDERS */}

            <div>

              <div className="flex items-center justify-between mb-4">

                <div>

                  <h2 className="text-xl font-black">
                    Active Orders
                  </h2>

                  <p className="text-sm text-gray-500">
                    Manage your incoming orders
                  </p>

                </div>

              </div>


              {activeOrders.length === 0 ? (

                <div className="bg-white rounded-3xl border p-10 text-center">

                  <ShoppingBag
                    size={42}
                    className="mx-auto text-gray-300"
                  />

                  <h3 className="font-black text-lg mt-3">
                    No active orders
                  </h3>

                  <p className="text-sm text-gray-500 mt-1">
                    New orders will appear here.
                  </p>

                </div>

              ) : (

                <div className="space-y-4">

                  {activeOrders.map(
                    renderOrderCard
                  )}

                </div>

              )}

            </div>

          </div>
        )}


        {/* ====================================================
            INVENTORY TAB
        ==================================================== */}

        {activeTab === 'inventory' && (
          <div className="space-y-6">


            {/* INVENTORY HEADER */}

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">

              <div>

                <h2 className="text-2xl font-black">
                  Inventory
                </h2>

                <p className="text-sm text-gray-500">
                  Manage prices, images and stock
                </p>

              </div>

              <button
                onClick={() =>
                  setShowAddProduct(
                    true
                  )
                }
                className="flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-brand-yellow text-black font-black"
              >

                <Plus size={19} />

                Add Product

              </button>

            </div>


            {/* BHEL */}

            {bhelProducts.length > 0 && (
              <section>

                <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5">

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">

                    <div>

                      <h3 className="text-xl font-black">
                        Bhel Shared Stock
                      </h3>

                      <p className="text-sm text-gray-500 mt-1">
                        1 Shared = 1 Full Bhel OR 2 Half Bhel
                      </p>

                    </div>


                    <div className="text-left sm:text-right">

                      <p className="text-3xl font-black">
                        {currentBhelHalfStock}
                      </p>

                      <p className="text-xs text-gray-500 font-bold">
                        SHARED BHEL
                      </p>

                    </div>

                  </div>


                  {/* SHARED QUANTITY */}

                  <div className="mt-5 p-4 bg-gray-50 rounded-2xl">

                    <div className="flex flex-col sm:flex-row gap-3">

                      <div className="flex-1">

                        <label className="text-xs font-bold text-gray-500 block mb-2">
                          SHARED BHEL STOCK
                        </label>

                        <input
                          type="number"
                          min="0"
                          value={
                            currentBhelHalfStock
                          }
                          onChange={(event) =>
                            setBhelHalfDraft(
                              Math.max(
                                0,
                                Number(
                                  event
                                    .target
                                    .value
                                )
                              )
                            )
                          }
                          className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white font-black outline-none focus:ring-2 focus:ring-brand-yellow"
                        />

                      </div>


                      <button
                        onClick={
                          handleSaveBhelStock
                        }
                        disabled={
                          savingBhelStock
                        }
                        className="sm:self-end px-6 py-3 rounded-xl bg-black text-white font-black disabled:opacity-50"
                      >

                        {savingBhelStock
                          ? 'Saving...'
                          : 'Save Quantity'}

                      </button>

                    </div>


                    <div className="grid grid-cols-2 gap-3 mt-4">

                      {bhelProducts.map(
                        (product) => (
                          <div
                            key={
                              product.id
                            }
                            className="bg-white rounded-xl p-3 border"
                          >

                            <p className="text-xs text-gray-500 font-bold">
                              {product.name}
                            </p>

                            <p className="text-xl font-black">
                              {getBhelAvailableQuantity(
                                product,
                                currentBhelHalfStock
                              )}
                            </p>

                            <p className="text-xs text-gray-400">
                              available
                            </p>

                          </div>
                        )
                      )}

                    </div>

                  </div>


                  {/* BHEL PRODUCTS */}

                  <div className="mt-5">

                    <div className="flex items-center justify-between mb-3">

                      <h4 className="font-black">
                        Bhel Products
                      </h4>

                      <span className="text-xs text-gray-500">
                        Edit price / image
                      </span>

                    </div>

                    <div className="space-y-3">

                      {bhelProducts.map(
                        renderBhelProduct
                      )}

                    </div>

                  </div>

                </div>

              </section>
            )}


            {/* OTHER PRODUCTS */}

            <section>

              <div className="flex items-center justify-between mb-4">

                <div>

                  <h3 className="text-xl font-black">
                    Other Products
                  </h3>

                  <p className="text-sm text-gray-500">
                    Price, image and stock management
                  </p>

                </div>

                <div className="text-sm font-bold text-gray-500">
                  {normalProducts.length}{' '}
                  products
                </div>

              </div>


              {loadingProducts ? (

                <div className="bg-white rounded-3xl border p-10 text-center">
                  Loading products...
                </div>

              ) : normalProducts.length === 0 ? (

                <div className="bg-white rounded-3xl border p-10 text-center">

                  <Package
                    size={40}
                    className="mx-auto text-gray-300"
                  />

                  <p className="font-bold mt-3">
                    No products found
                  </p>

                </div>

              ) : (

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

                  {normalProducts.map(
                    renderNormalProduct
                  )}

                </div>

              )}

            </section>

          </div>
        )}


        {/* ====================================================
            TODAY'S BUSINESS TAB
        ==================================================== */}

        {activeTab === 'business' && (
          <div className="space-y-6">


            {/* HEADER */}

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">

              <div>

                <h2 className="text-2xl font-black">
                  Today's Business
                </h2>

                <p className="text-sm text-gray-500">
                  {new Date().toLocaleDateString(
                    'en-IN',
                    {
                      weekday: 'long',
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    }
                  )}
                </p>

              </div>


              <div className="text-sm font-bold text-gray-500">
                {todayOrders.length} total orders today
              </div>

            </div>


            {/* ==================================================
                MAIN BUSINESS STATS
            ================================================== */}

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">


              {/* TOTAL ORDERS */}

              <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5">

                <p className="text-xs font-black text-gray-500">
                  TOTAL ORDERS
                </p>

                <p className="text-3xl font-black mt-2">
                  {todayOrders.length}
                </p>

                <p className="text-xs text-gray-400 mt-1">
                  All orders placed today
                </p>

              </div>


              {/* REVENUE */}

              <div className="bg-green-50 rounded-3xl border border-green-100 p-5">

                <p className="text-xs font-black text-green-700">
                  TOTAL REVENUE
                </p>

                <p className="text-3xl font-black mt-2 text-green-700">
                  ₹{todayRevenue.toFixed(0)}
                </p>

                <p className="text-xs text-green-600 mt-1">
                  Excluding cancelled orders
                </p>

              </div>


              {/* ITEMS SOLD */}

              <div className="bg-blue-50 rounded-3xl border border-blue-100 p-5">

                <p className="text-xs font-black text-blue-700">
                  ITEMS SOLD
                </p>

                <p className="text-3xl font-black mt-2 text-blue-700">
                  {todayItemsSold}
                </p>

                <p className="text-xs text-blue-600 mt-1">
                  Total quantity sold
                </p>

              </div>


              {/* AVERAGE ORDER */}

              <div className="bg-brand-yellow rounded-3xl border border-yellow-300 p-5">

                <p className="text-xs font-black text-black/60">
                  AVERAGE ORDER
                </p>

                <p className="text-3xl font-black mt-2">
                  ₹{todayAverageOrder.toFixed(0)}
                </p>

                <p className="text-xs text-black/60 mt-1">
                  Per valid order
                </p>

              </div>

            </div>


            {/* ==================================================
                ORDER STATUS BREAKDOWN
            ================================================== */}

            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5">

              <div className="mb-5">

                <h3 className="text-xl font-black">
                  Today's Order Status
                </h3>

                <p className="text-sm text-gray-500">
                  Exact status breakdown of today's orders
                </p>

              </div>


              <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">


                {/* ACTIVE */}

                <div className="rounded-2xl bg-yellow-50 p-4">

                  <p className="text-xs font-black text-yellow-700">
                    ACTIVE
                  </p>

                  <p className="text-2xl font-black mt-1">
                    {todayActiveOrders}
                  </p>

                </div>


                {/* DELIVERED */}

                <div className="rounded-2xl bg-green-50 p-4">

                  <p className="text-xs font-black text-green-700">
                    DELIVERED
                  </p>

                  <p className="text-2xl font-black mt-1 text-green-700">
                    {todayDeliveredOrders}
                  </p>

                </div>


                {/* CANCELLED */}

                <div className="rounded-2xl bg-red-50 p-4">

                  <p className="text-xs font-black text-red-700">
                    CANCELLED
                  </p>

                  <p className="text-2xl font-black mt-1 text-red-700">
                    {todayCancelledOrders}
                  </p>

                </div>


                {/* DELIVERY FEES */}

                <div className="rounded-2xl bg-purple-50 p-4">

                  <p className="text-xs font-black text-purple-700">
                    DELIVERY FEES
                  </p>

                  <p className="text-2xl font-black mt-1 text-purple-700">
                    ₹{todayDeliveryFees.toFixed(0)}
                  </p>

                </div>


                {/* VALID ORDERS */}

                <div className="rounded-2xl bg-gray-50 p-4">

                  <p className="text-xs font-black text-gray-500">
                    VALID ORDERS
                  </p>

                  <p className="text-2xl font-black mt-1">
                    {validTodayOrders.length}
                  </p>

                </div>

              </div>

            </div>


            {/* ==================================================
                TODAY'S ORDERS
            ================================================== */}

            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5">

              <div className="flex items-center justify-between mb-5">

                <div>

                  <h3 className="text-xl font-black">
                    Today's Orders
                  </h3>

                  <p className="text-sm text-gray-500">
                    Complete order history for today
                  </p>

                </div>

                <div className="text-sm font-black">
                  {todayOrders.length}
                </div>

              </div>


              {todayOrders.length === 0 ? (

                <div className="py-10 text-center">

                  <ShoppingBag
                    size={42}
                    className="mx-auto text-gray-300"
                  />

                  <h4 className="font-black text-lg mt-3">
                    No orders today
                  </h4>

                  <p className="text-sm text-gray-500 mt-1">
                    Today's orders will appear here.
                  </p>

                </div>

              ) : (

                <div className="space-y-4">

                  {todayOrders
                    .slice()
                    .reverse()
                    .map(renderOrderCard)}

                </div>

              )}

            </div>

          </div>
        )}

      </main>


      {/* ======================================================
          TOAST
      ====================================================== */}

      {toast && (
        <div
          className={`fixed top-5 right-5 z-[200] max-w-sm px-5 py-4 rounded-2xl shadow-2xl flex items-center gap-3 ${
            toast.type === 'success'
              ? 'bg-green-600 text-white'
              : 'bg-red-600 text-white'
          }`}
        >

          {toast.type === 'success' ? (
            <CheckCircle2
              size={20}
              className="flex-shrink-0"
            />
          ) : (
            <AlertCircle
              size={20}
              className="flex-shrink-0"
            />
          )}

          <span className="font-bold text-sm">
            {toast.message}
          </span>

          <button
            onClick={() =>
              setToast(null)
            }
            className="ml-auto opacity-80 hover:opacity-100"
          >
            <X size={18} />
          </button>

        </div>
      )}


      {/* ======================================================
          EDIT PRODUCT MODAL
      ====================================================== */}

      {editingProduct && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">

          <div className="w-full max-w-lg max-h-[92vh] overflow-y-auto bg-white rounded-3xl shadow-2xl">

            {/* HEADER */}

            <div className="sticky top-0 z-10 bg-white border-b p-5 flex items-center justify-between">

              <div>

                <h2 className="text-xl font-black">
                  Edit Product
                </h2>

                <p className="text-xs text-gray-500 mt-1">
                  Price, image and product details
                </p>

              </div>

              <button
                onClick={() =>
                  setEditingProduct(
                    null
                  )
                }
                className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center"
              >
                <X size={19} />
              </button>

            </div>


            <div className="p-5 space-y-5">


              {/* IMAGE PREVIEW */}

              <div className="flex justify-center">

                <div className="relative">

                  <div className="w-44 h-44 rounded-3xl overflow-hidden bg-gray-100 border">

                    {editForm.imageUrl ? (
                      <img
                        src={
                          editForm.imageUrl
                        }
                        alt={
                          editForm.name
                        }
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <ImagePlus
                          size={42}
                        />
                      </div>
                    )}

                  </div>


                  {editImageLoading && (
                    <div className="absolute inset-0 rounded-3xl bg-black/60 text-white flex items-center justify-center font-bold">
                      Processing...
                    </div>
                  )}

                </div>

              </div>


              {/* GALLERY BUTTON */}

              <label className="block cursor-pointer">

                <div className="border-2 border-dashed border-gray-300 rounded-2xl p-5 text-center hover:border-brand-yellow transition">

                  <Upload
                    size={25}
                    className="mx-auto mb-2"
                  />

                  <p className="font-black">
                    Choose Image from Gallery
                  </p>

                  <p className="text-xs text-gray-500 mt-1">
                    Image will be automatically compressed
                  </p>

                </div>

                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={
                    handleEditImageChange
                  }
                />

              </label>


              {/* IMAGE URL */}

              <div>

                <label className="block text-sm font-black mb-2">
                  Image URL
                </label>

                <input
                  type="text"
                  value={
                    editForm.imageUrl
                  }
                  onChange={(event) =>
                    setEditForm(
                      (previous) => ({
                        ...previous,
                        imageUrl:
                          event.target
                            .value,
                      })
                    )
                  }
                  placeholder="https://..."
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-brand-yellow"
                />

              </div>


              {/* NAME */}

              <div>

                <label className="block text-sm font-black mb-2">
                  Product Name
                </label>

                <input
                  type="text"
                  value={
                    editForm.name
                  }
                  onChange={(event) =>
                    setEditForm(
                      (previous) => ({
                        ...previous,
                        name:
                          event.target
                            .value,
                      })
                    )
                  }
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-brand-yellow"
                />

              </div>


              {/* PRICE */}

              <div>

                <label className="block text-sm font-black mb-2">
                  Price
                </label>

                <div className="relative">

                  <span className="absolute left-4 top-3.5 font-black">
                    ₹
                  </span>

                  <input
                    type="number"
                    min="0"
                    value={
                      editForm.price
                    }
                    onChange={(event) =>
                      setEditForm(
                        (previous) => ({
                          ...previous,
                          price:
                            event.target
                              .value,
                        })
                      )
                    }
                    className="w-full pl-9 pr-4 py-3 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-brand-yellow"
                  />

                </div>

              </div>


              {/* DESCRIPTION */}

              <div>

                <label className="block text-sm font-black mb-2">
                  Description
                </label>

                <textarea
                  value={
                    editForm.description
                  }
                  onChange={(event) =>
                    setEditForm(
                      (previous) => ({
                        ...previous,
                        description:
                          event.target
                            .value,
                      })
                    )
                  }
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-brand-yellow resize-none"
                />

              </div>


              {/* AVAILABILITY */}

              <label className="flex items-center gap-3 p-4 bg-gray-50 rounded-2xl cursor-pointer">

                <input
                  type="checkbox"
                  checked={
                    editForm.isAvailable
                  }
                  onChange={(event) =>
                    setEditForm(
                      (previous) => ({
                        ...previous,
                        isAvailable:
                          event.target
                            .checked,
                      })
                    )
                  }
                  className="w-5 h-5"
                />

                <div>

                  <p className="font-black">
                    Product Available
                  </p>

                  <p className="text-xs text-gray-500">
                    Customers can order this product
                  </p>

                </div>

              </label>


              {/* SAVE */}

              <button
                onClick={
                  handleSaveProductEdit
                }
                disabled={
                  editSaving ||
                  editImageLoading
                }
                className="w-full py-4 rounded-2xl bg-brand-yellow text-black font-black text-lg disabled:opacity-50 flex items-center justify-center gap-2"
              >

                {editSaving ? (
                  <>
                    <RefreshCw
                      size={20}
                      className="animate-spin"
                    />

                    Saving...
                  </>
                ) : (
                  <>
                    <Check size={20} />

                    Save Changes
                  </>
                )}

              </button>

            </div>

          </div>

        </div>
      )}


      {/* ======================================================
          ADD PRODUCT MODAL
      ====================================================== */}

      {showAddProduct && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">

          <div className="w-full max-w-lg max-h-[92vh] overflow-y-auto bg-white rounded-3xl shadow-2xl">

            {/* HEADER */}

            <div className="sticky top-0 z-10 bg-white border-b p-5 flex items-center justify-between">

              <div>

                <h2 className="text-xl font-black">
                  Add Product
                </h2>

                <p className="text-xs text-gray-500 mt-1">
                  Add a new item to Bhook_Lgi
                </p>

              </div>

              <button
                onClick={() =>
                  setShowAddProduct(
                    false
                  )
                }
                className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center"
              >
                <X size={19} />
              </button>

            </div>


            <div className="p-5 space-y-5">


              {/* IMAGE PREVIEW */}

              <div className="flex justify-center">

                <div className="w-36 h-36 rounded-3xl overflow-hidden bg-gray-100 border">

                  {newProduct.imageUrl ? (
                    <img
                      src={
                        newProduct.imageUrl
                      }
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">

                      <ImagePlus
                        size={32}
                      />

                      <span className="text-xs mt-2">
                        No image
                      </span>

                    </div>
                  )}

                </div>

              </div>


              {/* GALLERY */}

              <label className="block cursor-pointer">

                <div className="border-2 border-dashed border-gray-300 rounded-2xl p-4 text-center">

                  {newImageLoading ? (
                    <p className="font-bold">
                      Processing image...
                    </p>
                  ) : (
                    <>

                      <Upload
                        size={23}
                        className="mx-auto mb-2"
                      />

                      <p className="font-black">
                        Upload from Gallery
                      </p>

                      <p className="text-xs text-gray-500 mt-1">
                        Automatically compressed
                      </p>

                    </>
                  )}

                </div>

                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={
                    handleNewImageChange
                  }
                />

              </label>


              {/* IMAGE URL */}

              <div>

                <label className="block text-sm font-black mb-2">
                  Image URL
                </label>

                <input
                  type="text"
                  value={
                    newProduct.imageUrl
                  }
                  onChange={(event) =>
                    setNewProduct(
                      (previous) => ({
                        ...previous,
                        imageUrl:
                          event.target
                            .value,
                      })
                    )
                  }
                  placeholder="Optional image URL"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-brand-yellow"
                />

              </div>


              {/* NAME */}

              <div>

                <label className="block text-sm font-black mb-2">
                  Product Name
                </label>

                <input
                  type="text"
                  value={
                    newProduct.name
                  }
                  onChange={(event) =>
                    setNewProduct(
                      (previous) => ({
                        ...previous,
                        name:
                          event.target
                            .value,
                      })
                    )
                  }
                  placeholder="e.g. Cheese Maggi"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-brand-yellow"
                />

              </div>


              {/* PRICE */}

              <div>

                <label className="block text-sm font-black mb-2">
                  Price
                </label>

                <div className="relative">

                  <span className="absolute left-4 top-3.5 font-black">
                    ₹
                  </span>

                  <input
                    type="number"
                    min="0"
                    value={
                      newProduct.price
                    }
                    onChange={(event) =>
                      setNewProduct(
                        (previous) => ({
                          ...previous,
                          price:
                            event.target
                              .value,
                        })
                      )
                    }
                    placeholder="65"
                    className="w-full pl-9 pr-4 py-3 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-brand-yellow"
                  />

                </div>

              </div>


              {/* CATEGORY */}

              <div>

                <label className="block text-sm font-black mb-2">
                  Category
                </label>

                <select
                  value={
                    newProduct.categoryId
                  }
                  onChange={(event) =>
                    setNewProduct(
                      (previous) => ({
                        ...previous,
                        categoryId:
                          event.target
                            .value,
                      })
                    )
                  }
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white outline-none focus:ring-2 focus:ring-brand-yellow"
                >

                  <option value="snacks">
                    Snacks
                  </option>

                  <option value="bhel">
                    Bhel
                  </option>

                  <option value="maggi">
                    Maggi
                  </option>

                  <option value="cooked">
                    Cooked
                  </option>

                  <option value="uncooked">
                    Uncooked
                  </option>

                  <option value="momos">
                    Momos
                  </option>

                </select>

              </div>


              {/* DESCRIPTION */}

              <div>

                <label className="block text-sm font-black mb-2">
                  Description
                </label>

                <textarea
                  value={
                    newProduct.description
                  }
                  onChange={(event) =>
                    setNewProduct(
                      (previous) => ({
                        ...previous,
                        description:
                          event.target
                            .value,
                      })
                    )
                  }
                  rows={3}
                  placeholder="Short product description"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-brand-yellow resize-none"
                />

              </div>


              {/* OPTIONS */}

              <div className="space-y-3">

                <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl cursor-pointer">

                  <input
                    type="checkbox"
                    checked={
                      newProduct.isCooked
                    }
                    onChange={(event) =>
                      setNewProduct(
                        (previous) => ({
                          ...previous,
                          isCooked:
                            event.target
                              .checked,
                        })
                      )
                    }
                    className="w-5 h-5"
                  />

                  <span className="font-bold">
                    Cooked product
                  </span>

                </label>


                <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl cursor-pointer">

                  <input
                    type="checkbox"
                    checked={
                      newProduct.allowsSpiceCustomization
                    }
                    onChange={(event) =>
                      setNewProduct(
                        (previous) => ({
                          ...previous,
                          allowsSpiceCustomization:
                            event.target
                              .checked,
                        })
                      )
                    }
                    className="w-5 h-5"
                  />

                  <span className="font-bold">
                    Allow spice customization
                  </span>

                </label>


                <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl cursor-pointer">

                  <input
                    type="checkbox"
                    checked={
                      newProduct.isAvailable
                    }
                    onChange={(event) =>
                      setNewProduct(
                        (previous) => ({
                          ...previous,
                          isAvailable:
                            event.target
                              .checked,
                        })
                      )
                    }
                    className="w-5 h-5"
                  />

                  <span className="font-bold">
                    Product available
                  </span>

                </label>

              </div>


              {/* CREATE */}

              <button
                onClick={
                  handleCreateProduct
                }
                disabled={
                  creatingProduct ||
                  newImageLoading
                }
                className="w-full py-4 rounded-2xl bg-brand-yellow text-black font-black text-lg disabled:opacity-50"
              >

                {creatingProduct
                  ? 'Creating...'
                  : 'Create Product'}

              </button>

            </div>

          </div>

        </div>
      )}

    </div>
  );
}