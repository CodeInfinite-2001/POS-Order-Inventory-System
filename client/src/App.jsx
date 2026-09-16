import React, { useState, useEffect, useCallback } from 'react';
import { api } from './api/client';
import Header from './components/Header';
import Storefront from './components/Storefront';
import InventoryManager from './components/InventoryManager';
import OrdersList from './components/OrdersList';
import ConcurrencySimulator from './components/ConcurrencySimulator';
import CartDrawer from './components/CartDrawer';
import CheckoutModal from './components/CheckoutModal';

export default function App() {
  const [activeTab, setActiveTab] = useState('storefront');
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Active checkout reservation
  const [activeCheckoutOrder, setActiveCheckoutOrder] = useState(null);
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [isReserving, setIsReserving] = useState(false);
  const [lastPaymentResult, setLastPaymentResult] = useState(null);

  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(true);

  // Load products
  const fetchProducts = useCallback(async () => {
    try {
      const data = await api.getProducts();
      setProducts(data.products || []);
      setIsConnected(true);
    } catch (err) {
      console.error('Failed to fetch products:', err);
      setIsConnected(false);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load orders
  const fetchOrders = useCallback(async () => {
    try {
      const data = await api.getOrders();
      setOrders(data.orders || []);
    } catch (err) {
      console.error('Failed to fetch orders:', err);
    }
  }, []);

  // Initial load and periodic refresh to keep stock and 5-min timer in sync
  useEffect(() => {
    fetchProducts();
    fetchOrders();

    const interval = setInterval(() => {
      fetchProducts();
      fetchOrders();
    }, 4000);

    return () => clearInterval(interval);
  }, [fetchProducts, fetchOrders]);

  // Cart operations
  const handleAddToCart = product => {
    setCart(prev => {
      const existing = prev.find(item => item.productId === product._id);
      if (existing) {
        if (existing.quantity >= product.availableStock) {
          return prev;
        }
        return prev.map(item =>
          item.productId === product._id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [
        ...prev,
        {
          productId: product._id,
          name: product.name,
          sku: product.sku,
          price: product.price,
          quantity: 1,
        },
      ];
    });
  };

  const handleUpdateQty = (productId, newQty) => {
    if (newQty <= 0) {
      handleRemoveItem(productId);
      return;
    }
    const product = products.find(p => p._id === productId);
    if (product && newQty > product.availableStock) {
      return;
    }
    setCart(prev =>
      prev.map(item => (item.productId === productId ? { ...item, quantity: newQty } : item))
    );
  };

  const handleRemoveItem = productId => {
    setCart(prev => prev.filter(item => item.productId !== productId));
  };

  const handleClearCart = () => {
    setCart([]);
  };

  // Convert Cart to Reserved Order (Enters 5-Minute Checkout Lock)
  const handleProceedToCheckout = async () => {
    if (cart.length === 0) return;
    setIsReserving(true);
    setLastPaymentResult(null);

    try {
      const res = await api.createOrder({
        items: cart.map(item => ({ productId: item.productId, quantity: item.quantity })),
        customerName: 'POS Cashier / Shopper',
        reservationDurationSec: 300, // 5 minutes
      });

      // Clear cart, open checkout modal
      setCart([]);
      setIsCartOpen(false);
      setActiveCheckoutOrder(res.order);
      setIsCheckoutModalOpen(true);

      // Refresh stock counts
      await fetchProducts();
      await fetchOrders();
    } catch (err) {
      alert(`Reservation Failed: ${err.message}`);
    } finally {
      setIsReserving(false);
    }
  };

  // Process Mock Payment
  const handleProcessPayment = async ({
    orderId,
    idempotencyKey,
    paymentMethod,
    outcome,
    simulateDuplicate,
  }) => {
    setIsProcessingPayment(true);
    try {
      if (simulateDuplicate) {
        // Fire two simultaneous requests with the SAME idempotency key
        const [res1, res2] = await Promise.all([
          api.processPayment({ orderId, idempotencyKey, paymentMethod, outcome }),
          api.processPayment({ orderId, idempotencyKey, paymentMethod, outcome }),
        ]);

        const result = res2.isDuplicate ? res2 : res1;
        setLastPaymentResult(result);
        if (result.order) {
          setActiveCheckoutOrder(result.order);
        }
      } else {
        const result = await api.processPayment({
          orderId,
          idempotencyKey,
          paymentMethod,
          outcome,
        });

        setLastPaymentResult(result);
        if (result.order) {
          setActiveCheckoutOrder(result.order);
        }
      }

      await fetchProducts();
      await fetchOrders();
    } catch (err) {
      setLastPaymentResult({
        success: false,
        message: err.message,
      });
      await fetchProducts();
      await fetchOrders();
    } finally {
      setIsProcessingPayment(false);
    }
  };

  // Cancel reservation
  const handleCancelReservation = async orderId => {
    try {
      await api.cancelOrder(orderId, 'User cancelled checkout');
      setIsCheckoutModalOpen(false);
      setActiveCheckoutOrder(null);
      await fetchProducts();
      await fetchOrders();
    } catch (err) {
      alert(`Cancellation failed: ${err.message}`);
    }
  };

  // Expire reservation
  const handleExpireReservation = async orderId => {
    try {
      await api.expireOrder(orderId, '5-minute timer reached 0:00');
      setIsCheckoutModalOpen(false);
      setActiveCheckoutOrder(null);
      await fetchProducts();
      await fetchOrders();
    } catch (err) {
      console.error('Auto-expiry error:', err);
    }
  };

  // Product CRUD
  const handleCreateProduct = async productData => {
    try {
      await api.createProduct(productData);
      await fetchProducts();
    } catch (err) {
      alert(`Failed to create product: ${err.message}`);
    }
  };

  const handleUpdateProduct = async (id, updateData) => {
    try {
      await api.updateProduct(id, updateData);
      await fetchProducts();
    } catch (err) {
      alert(`Failed to update product: ${err.message}`);
    }
  };

  const handleDeleteProduct = async id => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    try {
      await api.deleteProduct(id);
      await fetchProducts();
    } catch (err) {
      alert(`Failed to delete product: ${err.message}`);
    }
  };

  const handleSeedCatalog = async () => {
    try {
      await api.seedProducts();
      await fetchProducts();
    } catch (err) {
      alert(`Failed to seed demo catalog: ${err.message}`);
    }
  };

  const cartCount = cart.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-blue-500 selection:text-white">
      {/* Navigation Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        cartCount={cartCount}
        onOpenCart={() => setIsCartOpen(true)}
        isConnected={isConnected}
        onRefresh={() => {
          fetchProducts();
          fetchOrders();
        }}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'storefront' && (
          <Storefront
            products={products}
            cart={cart}
            onAddToCart={handleAddToCart}
            onSeedCatalog={handleSeedCatalog}
            loading={loading}
          />
        )}

        {activeTab === 'inventory' && (
          <InventoryManager
            products={products}
            onCreateProduct={handleCreateProduct}
            onUpdateProduct={handleUpdateProduct}
            onDeleteProduct={handleDeleteProduct}
            onSeedCatalog={handleSeedCatalog}
            loading={loading}
          />
        )}

        {activeTab === 'orders' && (
          <OrdersList
            orders={orders}
            onRefresh={fetchOrders}
            onCancelOrder={handleCancelReservation}
            onOpenCheckout={order => {
              setActiveCheckoutOrder(order);
              setIsCheckoutModalOpen(true);
            }}
            loading={loading}
          />
        )}

        {activeTab === 'simulator' && (
          <ConcurrencySimulator
            products={products}
            onRefreshProducts={fetchProducts}
          />
        )}
      </main>

      {/* Cart Drawer */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cart={cart}
        products={products}
        onUpdateQty={handleUpdateQty}
        onRemoveItem={handleRemoveItem}
        onClearCart={handleClearCart}
        onProceedToCheckout={handleProceedToCheckout}
        isReserving={isReserving}
      />

      {/* Active Checkout & 5-Minute Reservation Modal */}
      <CheckoutModal
        order={activeCheckoutOrder}
        isOpen={isCheckoutModalOpen}
        onClose={() => setIsCheckoutModalOpen(false)}
        onProcessPayment={handleProcessPayment}
        onCancelReservation={handleCancelReservation}
        onExpireReservation={handleExpireReservation}
        isProcessing={isProcessingPayment}
        lastPaymentResult={lastPaymentResult}
      />

      {/* Footer */}
      <footer className="border-t border-slate-900 py-6 text-center text-xs text-slate-500">
        <p>
          Point-of-Sale Order &amp; Inventory System &bull; Atomic Concurrency Guards &bull; 5-Minute
          Stock Lock &bull; Mock Gateway Simulation
        </p>
      </footer>
    </div>
  );
}
