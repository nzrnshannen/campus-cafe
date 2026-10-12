import React, { useState } from 'react';
import { Trash2, Plus, Minus, ShoppingBag, User, CreditCard, Sparkles, AlertCircle } from 'lucide-react';
import { getProductImage } from '../utils/productImages';

export default function Cart({
  cartItems,
  onUpdateQty,
  onRemoveItem,
  onClearCart,
  customers,
  employees,
  selectedCustomer,
  onSelectCustomer,
  selectedEmployee,
  onSelectEmployee,
  onOpenNewCustomerModal,
  onCheckout,
  isSubmitting,
  products = [],
  onAddToCart
}) {
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [checkoutMode, setCheckoutMode] = useState('immediate');
  const [errorMessage, setErrorMessage] = useState(null);

  const subtotal = cartItems.reduce((acc, item) => acc + item.Price * item.quantity, 0);
  const totalItemCount = cartItems.reduce((sum, i) => sum + i.quantity, 0);

  const selectedCustomerObj = customers.find(c => c.CustomerID === selectedCustomer);
  const selectedEmployeeObj = employees.find(e => e.EmployeeID === selectedEmployee);

  const handleCheckoutClick = () => {
    if (cartItems.length === 0) return;
    if (!selectedCustomer) {
      setErrorMessage('Please select a customer for this order.');
      setTimeout(() => setErrorMessage(null), 3500);
      return;
    }
    if (!selectedEmployee) {
      setErrorMessage('Please select a cashier processing this order.');
      setTimeout(() => setErrorMessage(null), 3500);
      return;
    }

    onCheckout({
      customerId: selectedCustomer,
      employeeId: selectedEmployee,
      items: cartItems.map(item => ({
        productId: item.ProductID,
        quantity: item.quantity
      })),
      paymentMethod: checkoutMode === 'immediate' ? paymentMethod : null
    });
  };

  return (
    <div className="rounded-2xl flex flex-col h-full bg-white border border-slate-200/80 shadow-xs overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-white">
        <div className="flex items-center gap-2">
          <h2 className="font-bold text-sm tracking-tight text-slate-900">
            Current Order
          </h2>
          <span className="text-xs bg-slate-100 text-slate-700 font-bold px-2 py-0.5 rounded-full tabular-nums">
            {totalItemCount} {totalItemCount === 1 ? 'item' : 'items'}
          </span>
        </div>

        {cartItems.length > 0 && (
          <button
            onClick={onClearCart}
            type="button"
            className="text-xs font-semibold text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
          >
            Clear Ticket
          </button>
        )}
      </div>

      {/* Cashier & Customer Selection Bar */}
      <div className="p-3.5 bg-slate-50/70 border-b border-slate-100 space-y-2.5">
        {/* Cashier */}
        <div className="flex items-center justify-between gap-2">
          <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider shrink-0">
            Cashier
          </label>
          <select
            value={selectedEmployee || ''}
            onChange={(e) => onSelectEmployee(Number(e.target.value))}
            className="flex-1 max-w-[210px] text-xs bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-slate-900 focus:outline-none focus:border-slate-400 cursor-pointer shadow-2xs font-medium"
          >
            {employees.map(emp => (
              <option key={emp.EmployeeID} value={emp.EmployeeID}>
                {emp.Name} • Staff #{emp.EmployeeID}
              </option>
            ))}
          </select>
        </div>

        {/* Customer */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Customer
            </label>
            <button
              onClick={onOpenNewCustomerModal}
              type="button"
              className="text-[11px] text-slate-900 hover:text-slate-700 font-bold cursor-pointer transition-colors"
            >
              + Add Customer
            </button>
          </div>
          <select
            value={selectedCustomer || ''}
            onChange={(e) => onSelectCustomer(Number(e.target.value))}
            className="w-full text-xs bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-slate-900 focus:outline-none focus:border-slate-400 cursor-pointer shadow-2xs font-medium"
          >
            {customers.map(cust => (
              <option key={cust.CustomerID} value={cust.CustomerID}>
                {cust.Name} • {cust.CustomerType} {cust.UnivID ? `(${cust.UnivID})` : ''}
              </option>
            ))}
          </select>
          {selectedCustomerObj && (
            <div className="mt-1.5 flex items-center justify-between text-[11px] text-slate-500">
              <span className="inline-flex items-center gap-1 font-medium text-slate-700">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                {selectedCustomerObj.CustomerType} Account
              </span>
              {selectedCustomerObj.UnivID && (
                <span className="text-slate-400 font-mono text-[10px]">ID: {selectedCustomerObj.UnivID}</span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Validation Warning Alert */}
      {errorMessage && (
        <div className="mx-3.5 mt-2.5 p-2 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center gap-2 animate-in fade-in duration-150">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Cart Items List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2.5 divide-y divide-slate-100">
        {cartItems.length === 0 ? (
          <div className="py-8 flex flex-col items-center justify-center text-center px-4">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 mb-2.5">
              <ShoppingBag className="w-6 h-6 stroke-[1.5]" />
            </div>
            <p className="text-sm font-bold text-slate-800">Your ticket is empty</p>
            <p className="text-xs text-slate-400 mt-0.5 max-w-[220px]">
              Tap any menu card on the left to add items to this order.
            </p>

            {/* Quick Favorites Suggestion Chips */}
            {products && products.length > 0 && onAddToCart && (
              <div className="mt-5 w-full pt-4 border-t border-slate-100">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2 text-left">
                  Popular Favorites:
                </span>
                <div className="flex flex-wrap gap-1.5 justify-start">
                  {products.slice(0, 3).map(fav => (
                    <button
                      key={fav.ProductID}
                      type="button"
                      onClick={() => onAddToCart(fav)}
                      className="text-xs px-2.5 py-1 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200/80 transition-colors cursor-pointer flex items-center gap-1 font-medium"
                    >
                      <Plus className="w-3 h-3 text-slate-400" />
                      <span>{fav.ProductName}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          cartItems.map((item) => {
            const itemImg = getProductImage(item.ProductName);
            return (
              <div key={item.ProductID} className="pt-2.5 first:pt-0 flex items-center justify-between gap-3">
                {/* Thumbnail */}
                <img
                  src={itemImg}
                  alt={item.ProductName}
                  className="w-11 h-11 rounded-xl object-cover border border-slate-200/80 shrink-0 shadow-2xs"
                />

                <div className="flex-1 min-w-0">
                  <h4 className="text-xs font-bold text-slate-900 truncate">{item.ProductName}</h4>
                  <div className="text-[11px] text-slate-500 mt-0.5 tabular-nums">
                    ₱{item.Price.toFixed(2)} × {item.quantity} = <span className="font-bold text-slate-900">₱{(item.Price * item.quantity).toFixed(2)}</span>
                  </div>
                </div>

                {/* Modern Quantity Stepper */}
                <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-1 border border-slate-200/60">
                  <button
                    onClick={() => onUpdateQty(item.ProductID, -1)}
                    className="w-6 h-6 flex items-center justify-center rounded-lg bg-white text-slate-700 hover:bg-slate-200 transition-colors text-xs cursor-pointer shadow-2xs active:scale-95"
                    title="Decrease quantity"
                  >
                    <Minus className="w-2.5 h-2.5" />
                  </button>
                  <span className="w-6 text-center text-xs font-bold text-slate-900 tabular-nums">{item.quantity}</span>
                  <button
                    onClick={() => onUpdateQty(item.ProductID, 1)}
                    className="w-6 h-6 flex items-center justify-center rounded-lg bg-white text-slate-700 hover:bg-slate-200 transition-colors text-xs cursor-pointer shadow-2xs active:scale-95"
                    title="Increase quantity"
                  >
                    <Plus className="w-2.5 h-2.5" />
                  </button>
                </div>

                {/* Remove */}
                <button
                  onClick={() => onRemoveItem(item.ProductID)}
                  className="text-slate-300 hover:text-rose-600 p-1 transition-colors cursor-pointer"
                  title="Remove item"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })
        )}
      </div>

      {/* Summary & Checkout Actions */}
      {cartItems.length > 0 && (
        <div className="p-4 bg-slate-50/80 border-t border-slate-200 space-y-3">
          <div className="flex justify-between items-center text-xs text-slate-500">
            <span>Subtotal</span>
            <span className="font-semibold text-slate-900 tabular-nums">₱{subtotal.toFixed(2)}</span>
          </div>

          <div className="flex justify-between items-baseline border-t border-slate-200/80 pt-2">
            <span className="text-xs text-slate-600 font-bold uppercase tracking-wider">Total Due</span>
            <span className="text-2xl font-black text-slate-900 tracking-tight tabular-nums">
              ₱{subtotal.toFixed(2)}
            </span>
          </div>

          {/* Mode Switcher */}
          <div className="space-y-2 pt-1">
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => setCheckoutMode('immediate')}
                className={`py-2 px-3 rounded-xl font-semibold flex items-center justify-center gap-1.5 border transition-all cursor-pointer active:scale-95 ${
                  checkoutMode === 'immediate'
                    ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                Pay Now
              </button>
              <button
                type="button"
                onClick={() => setCheckoutMode('pending')}
                className={`py-2 px-3 rounded-xl font-semibold flex items-center justify-center gap-1.5 border transition-all cursor-pointer active:scale-95 ${
                  checkoutMode === 'pending'
                    ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                Hold Order (Tab)
              </button>
            </div>

            {/* Payment Method Selector Grid */}
            {checkoutMode === 'immediate' && (
              <div className="grid grid-cols-4 gap-1.5 pt-1">
                {[
                  { id: 'Cash', label: 'Cash' },
                  { id: 'Digital Payment', label: 'GCash' },
                  { id: 'Debit Card', label: 'Maya' },
                  { id: 'Credit Card', label: 'Card' },
                ].map(method => (
                  <button
                    key={method.id}
                    type="button"
                    onClick={() => setPaymentMethod(method.id)}
                    className={`py-1.5 text-center rounded-xl text-xs font-semibold border transition-all cursor-pointer active:scale-95 ${
                      paymentMethod === method.id
                        ? 'bg-slate-900 text-white border-slate-900 shadow-2xs'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {method.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* High-Contrast Checkout Button */}
          <button
            onClick={handleCheckoutClick}
            disabled={isSubmitting}
            className="w-full py-3 text-xs font-bold tracking-wide rounded-xl bg-slate-900 hover:bg-black text-white shadow-xs transition-all cursor-pointer active:scale-[0.98] disabled:opacity-50 sheen-effect"
          >
            {isSubmitting ? (
              'Processing Order...'
            ) : checkoutMode === 'immediate' ? (
              `Charge ₱${subtotal.toFixed(2)}`
            ) : (
              'Place Order on Hold'
            )}
          </button>
        </div>
      )}
    </div>
  );
}
