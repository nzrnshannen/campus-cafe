import React, { useState, useEffect } from 'react';
import { api } from './api';
import PosView from './components/PosView';
import Cart from './components/Cart';
import InventoryTable from './components/InventoryTable';
import OrdersView from './components/OrdersView';
import RecipesView from './components/RecipesView';
import DeliveryModal from './components/DeliveryModal';
import PaymentModal from './components/PaymentModal';
import CustomerModal from './components/CustomerModal';
import AddIngredientModal from './components/AddIngredientModal';
import AddProductModal from './components/AddProductModal';
import ConfirmationModal from './components/ui/ConfirmationModal';
import BrandLogo from './components/ui/BrandLogo';
import {
  Package,
  Receipt,
  BookOpen,
  DollarSign,
  AlertTriangle,
  CheckCircle,
  Database,
  RefreshCw,
  ShoppingBag,
  Clock,
  User
} from 'lucide-react';

export default function App() {
  // Navigation
  const [activeTab, setActiveTab] = useState('pos');

  // Live Clock
  const [currentTime, setCurrentTime] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Data states
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState(['All']);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [ingredients, setIngredients] = useState([]);
  const [lowStockItems, setLowStockItems] = useState([]);
  const [orders, setOrders] = useState([]);
  const [statusFilter, setStatusFilter] = useState('All');
  const [customers, setCustomers] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [summary, setSummary] = useState(null);

  // Cart & POS selections
  const [cartItems, setCartItems] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);

  // System status
  const [dbStatus, setDbStatus] = useState({ connected: false, checked: false });
  const [notification, setNotification] = useState(null);

  // Modals
  const [isDeliveryModalOpen, setIsDeliveryModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentOrder, setPaymentOrder] = useState(null);
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [isAddIngredientModalOpen, setIsAddIngredientModalOpen] = useState(false);
  const [isAddProductModalOpen, setIsAddProductModalOpen] = useState(false);

  // Global Confirmation Modal State
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: "Are you sure you want to remove?",
    message: "",
    confirmText: "Yes, Remove",
    variant: "danger",
    itemHighlight: null,
    onConfirm: null
  });

  const showConfirmModal = ({
    title = "Are you sure you want to remove?",
    message = "This action will remove the selected item. Please confirm to proceed.",
    confirmText = "Yes, Remove",
    variant = "danger",
    itemHighlight = null,
    onConfirm
  }) => {
    setConfirmModal({
      isOpen: true,
      title,
      message,
      confirmText,
      variant,
      itemHighlight,
      onConfirm
    });
  };

  // Clock effect
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) +
        ' • ' +
        now.toLocaleDateString([], { month: 'short', day: 'numeric' })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 10000);
    return () => clearInterval(interval);
  }, []);

  // Toast notification helper
  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification(null);
    }, 4500);
  };

  // Initial Load
  const fetchAllData = async () => {
    try {
      setIsRefreshing(true);
      // 1. Health check
      const health = await api.checkHealth().catch(() => ({ database: { connected: false } }));
      setDbStatus({ connected: !!health?.database?.connected, checked: true });

      // 2. Fetch resources
      const [
        prodsRes,
        catsRes,
        ingsRes,
        lowStockRes,
        ordersRes,
        custsRes,
        empsRes,
        suppsRes,
        sumRes
      ] = await Promise.all([
        api.getProducts().catch(() => ({ data: [] })),
        api.getCategories().catch(() => ({ data: ['All'] })),
        api.getIngredients().catch(() => ({ data: [] })),
        api.getLowStock().catch(() => ({ data: [] })),
        api.getOrders().catch(() => ({ data: [] })),
        api.getCustomers().catch(() => ({ data: [] })),
        api.getEmployees().catch(() => ({ data: [] })),
        api.getSuppliers().catch(() => ({ data: [] })),
        api.getSummary().catch(() => ({ data: null }))
      ]);

      setProducts(prodsRes.data || []);
      setCategories(catsRes.data || ['All']);
      setIngredients(ingsRes.data || []);
      setLowStockItems(lowStockRes.data || []);
      setOrders(ordersRes.data || []);
      setCustomers(custsRes.data || []);
      setEmployees(empsRes.data || []);
      setSuppliers(suppsRes.data || []);
      setSummary(sumRes.data || null);

      // Default selected cashier & customer if not already selected
      if (!selectedEmployee && empsRes.data?.length > 0) {
        setSelectedEmployee(empsRes.data[0].EmployeeID);
      }
      if (!selectedCustomer && custsRes.data?.length > 0) {
        setSelectedCustomer(custsRes.data[0].CustomerID);
      }
    } catch (err) {
      console.error('Data load error:', err);
    } finally {
      setTimeout(() => setIsRefreshing(false), 300);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  const activeCashier = employees.find(e => e.EmployeeID === selectedEmployee);

  // Filter orders when statusFilter changes
  const handleFilterOrders = async (status) => {
    setStatusFilter(status);
    try {
      const res = await api.getOrders(status);
      setOrders(res.data || []);
    } catch (err) {
      showNotification(err.message, 'error');
    }
  };

  // Cart operations
  const handleAddToCart = (product) => {
    setCartItems(prev => {
      const existing = prev.find(item => item.ProductID === product.ProductID);
      if (existing) {
        return prev.map(item =>
          item.ProductID === product.ProductID
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const handleRemoveItem = (productId) => {
    const item = cartItems.find(i => i.ProductID === productId);
    if (!item) return;

    showConfirmModal({
      title: "Are you sure you want to remove?",
      message: "This will remove this item from your current order ticket.",
      itemHighlight: `${item.ProductName} × ${item.quantity}`,
      confirmText: "Yes, Remove",
      variant: "danger",
      onConfirm: () => {
        setCartItems(prev => prev.filter(i => i.ProductID !== productId));
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const handleClearCart = () => {
    if (cartItems.length === 0) return;
    const totalQty = cartItems.reduce((acc, i) => acc + i.quantity, 0);

    showConfirmModal({
      title: "Are you sure you want to remove?",
      message: "This will clear and discard all items currently added to this ticket.",
      itemHighlight: `${totalQty} item${totalQty === 1 ? '' : 's'} on ticket`,
      confirmText: "Yes, Clear Ticket",
      variant: "danger",
      onConfirm: () => {
        setCartItems([]);
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const handleUpdateQty = (productId, delta) => {
    const item = cartItems.find(i => i.ProductID === productId);
    if (!item) return;

    if (item.quantity === 1 && delta === -1) {
      handleRemoveItem(productId);
      return;
    }

    setCartItems(prev => {
      return prev
        .map(i => {
          if (i.ProductID === productId) {
            const newQty = i.quantity + delta;
            return newQty > 0 ? { ...i, quantity: newQty } : null;
          }
          return i;
        })
        .filter(Boolean);
    });
  };

  // Checkout Order (Managed SQL Transaction)
  const handleCheckout = async (orderPayload) => {
    try {
      setIsSubmittingOrder(true);
      const res = await api.createOrder(orderPayload);
      setCartItems([]);
      showNotification(`Order #${res.orderId} created successfully! Ingredients stock deducted.`);
      // Refresh inventory and products immediately to reflect new stock levels & auto-availability
      await fetchAllData();
    } catch (err) {
      showNotification(err.message || 'Order failed to process.', 'error');
    } finally {
      setIsSubmittingOrder(false);
    }
  };

  // Settle Payment
  const handleSettlePayment = async (orderId, paymentPayload) => {
    try {
      await api.settlePayment(orderId, paymentPayload);
      showNotification(`Order #${orderId} marked as Paid!`);
      await fetchAllData();
    } catch (err) {
      showNotification(err.message || 'Failed to settle payment.', 'error');
    }
  };

  // Cancel / Void Order
  const handleCancelOrder = (orderId) => {
    showConfirmModal({
      title: "Are you sure you want to remove?",
      message: `Voiding Order #${orderId} will cancel this receipt and automatically restore all deducted raw ingredients back to inventory.`,
      itemHighlight: `Order #${orderId}`,
      confirmText: "Yes, Void Order",
      variant: "danger",
      onConfirm: async () => {
        try {
          await api.cancelOrder(orderId);
          showNotification(`Order #${orderId} cancelled. Stock restored to inventory.`);
          await fetchAllData();
        } catch (err) {
          showNotification(err.message || 'Failed to cancel order.', 'error');
        } finally {
          setConfirmModal(prev => ({ ...prev, isOpen: false }));
        }
      }
    });
  };

  // Delete Raw Ingredient Stock
  const handleDeleteIngredient = (ingredient) => {
    showConfirmModal({
      title: "Are you sure you want to remove?",
      message: `This will permanently delete ${ingredient.IngredientName} from raw inventory and unbind associated recipe mappings.`,
      itemHighlight: `${ingredient.IngredientName} (${ingredient.CurrentQuantity} ${ingredient.UnitOfMeasurement} in stock)`,
      confirmText: "Yes, Remove Stock",
      variant: "danger",
      onConfirm: async () => {
        try {
          await api.deleteIngredient(ingredient.IngredientID);
          showNotification(`Ingredient ${ingredient.IngredientName} removed from inventory.`);
          await fetchAllData();
        } catch (err) {
          showNotification(err.message || 'Failed to delete ingredient.', 'error');
        } finally {
          setConfirmModal(prev => ({ ...prev, isOpen: false }));
        }
      }
    });
  };

  // Log Delivery
  const handleSubmitDelivery = async (deliveryPayload) => {
    try {
      const res = await api.logDelivery(deliveryPayload);
      showNotification('Delivery received! Kitchen inventory restocked.');
      await fetchAllData();
    } catch (err) {
      throw err;
    }
  };

  // Quick adjust ingredient stock
  const handleQuickUpdateStock = async (ingredientId, newQty) => {
    try {
      await api.updateIngredient(ingredientId, { currentQuantity: newQty });
      showNotification('Ingredient stock updated.');
      await fetchAllData();
    } catch (err) {
      showNotification(err.message, 'error');
    }
  };

  // Register Customer
  const handleSubmitCustomer = async (custPayload) => {
    try {
      const res = await api.addCustomer(custPayload);
      showNotification(`Customer ${custPayload.name} registered.`);
      const custs = await api.getCustomers();
      setCustomers(custs.data || []);
      setSelectedCustomer(res.customerId);
    } catch (err) {
      throw err;
    }
  };

  // Add Ingredient
  const handleSubmitIngredient = async (ingPayload) => {
    try {
      await api.addIngredient(ingPayload);
      showNotification(`Ingredient ${ingPayload.ingredientName} added.`);
      await fetchAllData();
    } catch (err) {
      throw err;
    }
  };

  // Create Product & Recipe Formula
  const handleSubmitProduct = async (prodPayload) => {
    try {
      await api.createProduct(prodPayload);
      showNotification(`Product "${prodPayload.productName}" & recipe created successfully!`);
      await fetchAllData();
    } catch (err) {
      throw err;
    }
  };

  // Toggle Product Availability
  const handleToggleProductStatus = async (productId, status) => {
    try {
      await api.updateProductStatus(productId, status);
      showNotification(`Product status updated to ${status}.`);
      await fetchAllData();
    } catch (err) {
      showNotification(err.message, 'error');
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 flex flex-col font-sans antialiased">
      {/* Toast Notification */}
      {notification && (
        <div
          className={`fixed bottom-6 right-6 z-50 max-w-md px-4 py-3 rounded-xl shadow-xl flex items-center gap-3 border text-xs font-semibold transition-all ${
            notification.type === 'error'
              ? 'bg-rose-50 text-rose-900 border-rose-200'
              : 'bg-emerald-50 text-emerald-900 border-emerald-200'
          }`}
        >
          <span>{notification.message}</span>
        </div>
      )}

      {/* Top Header - Glassmorphic Professional Bar */}
      <header className="glass-header sticky top-0 z-40">
        <div className="w-full px-6 py-2.5 flex flex-col lg:flex-row items-center justify-between gap-3">
          {/* Left: Brand Identity */}
          <div className="flex items-center justify-between w-full lg:w-auto">
            <BrandLogo />
          </div>

          {/* Center: Modern Floating Segmented Navigation Tabs */}
          <div className="inline-flex items-center gap-1 p-1 rounded-2xl bg-slate-100/90 border border-slate-200/80 overflow-x-auto max-w-full">
            {[
              { id: 'pos', label: 'Point of Sale', icon: ShoppingBag },
              { id: 'inventory', label: 'Inventory & Stock', icon: Package, badge: lowStockItems.length },
              { id: 'orders', label: 'Orders & Receipts', icon: Receipt },
              { id: 'recipes', label: 'Menu Recipes', icon: BookOpen },
            ].map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold tracking-normal transition-all whitespace-nowrap cursor-pointer flex items-center gap-2 ${
                    isActive
                      ? 'bg-slate-900 text-white shadow-xs font-bold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/70'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 stroke-[2]" />
                  <span>{tab.label}</span>
                  {tab.badge > 0 && (
                    <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full tabular-nums ${isActive ? 'bg-amber-400 text-slate-950' : 'bg-amber-100 text-amber-800'}`}>
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Right: Quick Metrics & Live Session Indicators */}
          <div className="hidden lg:flex items-center gap-2 text-xs">
            {currentTime && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200/70 text-slate-500 font-medium shadow-2xs">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span className="tabular-nums">{currentTime}</span>
              </div>
            )}

            {activeCashier && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200/70 text-slate-700 font-semibold shadow-2xs">
                <div className="w-4 h-4 rounded-full bg-slate-900 flex items-center justify-center text-[9px] font-black text-white">
                  {activeCashier.Name.charAt(0)}
                </div>
                <span>{activeCashier.Name}</span>
              </div>
            )}

            {summary && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200/70 text-slate-600 shadow-2xs">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span>Sales:</span>
                <span className="font-extrabold text-slate-900 tabular-nums">₱{summary.todayRevenue.toFixed(2)}</span>
              </div>
            )}

            <button
              onClick={fetchAllData}
              title="Refresh all data"
              className="p-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200/80 text-slate-600 hover:text-slate-900 transition-colors cursor-pointer active:scale-95 shadow-2xs"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-slate-900' : ''}`} />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 w-full px-6 py-5 relative z-10">
        {/* Tab 1: Point of Sale */}
        {activeTab === 'pos' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start pb-6">
            {/* Products Grid */}
            <div className="lg:col-span-8 xl:col-span-8 2xl:col-span-9">
              <PosView
                products={products}
                categories={categories}
                selectedCategory={selectedCategory}
                onSelectCategory={setSelectedCategory}
                onAddToCart={handleAddToCart}
                onToggleStatus={handleToggleProductStatus}
                cartItems={cartItems}
              />
            </div>

            {/* Cart & Checkout Panel */}
            <div className="lg:col-span-4 xl:col-span-4 2xl:col-span-3 sticky top-20 self-start">
              <Cart
                cartItems={cartItems}
                onUpdateQty={handleUpdateQty}
                onRemoveItem={handleRemoveItem}
                onClearCart={handleClearCart}
                customers={customers}
                employees={employees}
                selectedCustomer={selectedCustomer}
                onSelectCustomer={setSelectedCustomer}
                selectedEmployee={selectedEmployee}
                onSelectEmployee={setSelectedEmployee}
                onOpenNewCustomerModal={() => setIsCustomerModalOpen(true)}
                onCheckout={handleCheckout}
                isSubmitting={isSubmittingOrder}
                products={products}
                onAddToCart={handleAddToCart}
              />
            </div>
          </div>
        )}

        {/* Tab 2: Inventory */}
        {activeTab === 'inventory' && (
          <InventoryTable
            ingredients={ingredients}
            lowStockItems={lowStockItems}
            onOpenDeliveryModal={() => setIsDeliveryModalOpen(true)}
            onOpenAddIngredientModal={() => setIsAddIngredientModalOpen(true)}
            onRefresh={fetchAllData}
            onQuickUpdateStock={handleQuickUpdateStock}
            onDeleteIngredient={handleDeleteIngredient}
          />
        )}

        {/* Tab 3: Orders History */}
        {activeTab === 'orders' && (
          <OrdersView
            orders={orders}
            statusFilter={statusFilter}
            onSelectStatusFilter={handleFilterOrders}
            onRefresh={fetchAllData}
            onOpenPaymentModal={(ord) => {
              setPaymentOrder(ord);
              setIsPaymentModalOpen(true);
            }}
            onCancelOrder={handleCancelOrder}
          />
        )}

        {/* Tab 4: Recipes */}
        {activeTab === 'recipes' && (
          <RecipesView
            products={products}
            ingredients={ingredients}
            onToggleStatus={handleToggleProductStatus}
            onOpenAddProductModal={() => setIsAddProductModalOpen(true)}
          />
        )}
      </main>

      {/* Modals */}
      <DeliveryModal
        isOpen={isDeliveryModalOpen}
        onClose={() => setIsDeliveryModalOpen(false)}
        suppliers={suppliers}
        ingredients={ingredients}
        onSubmitDelivery={handleSubmitDelivery}
      />

      <PaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => {
          setIsPaymentModalOpen(false);
          setPaymentOrder(null);
        }}
        order={paymentOrder}
        onSettlePayment={handleSettlePayment}
      />

      <CustomerModal
        isOpen={isCustomerModalOpen}
        onClose={() => setIsCustomerModalOpen(false)}
        onSubmitCustomer={handleSubmitCustomer}
      />

      <AddIngredientModal
        isOpen={isAddIngredientModalOpen}
        onClose={() => setIsAddIngredientModalOpen(false)}
        onSubmitIngredient={handleSubmitIngredient}
      />

      <AddProductModal
        isOpen={isAddProductModalOpen}
        onClose={() => setIsAddProductModalOpen(false)}
        ingredients={ingredients}
        categories={categories.filter(c => c !== 'All')}
        onSubmitProduct={handleSubmitProduct}
      />

      {/* Global Confirmation Modal */}
      <ConfirmationModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmText={confirmModal.confirmText}
        variant={confirmModal.variant}
        itemHighlight={confirmModal.itemHighlight}
      />
    </div>
  );
}
