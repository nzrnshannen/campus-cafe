import React, { useState } from 'react';
import { ChevronDown, ChevronUp, RefreshCw, Search, X, Receipt, CheckCircle, Clock, Ban } from 'lucide-react';

export default function OrdersView({
  orders,
  statusFilter,
  onSelectStatusFilter,
  onRefresh,
  onOpenPaymentModal,
  onCancelOrder
}) {
  const [expandedOrderId, setExpandedOrderId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const toggleExpand = (id) => {
    setExpandedOrderId(expandedOrderId === id ? null : id);
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch =
      order.OrderID.toString().includes(searchQuery) ||
      order.CustomerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.CashierName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const paidOrders = orders.filter(o => o.OrderStatus === 'Paid');
  const pendingOrders = orders.filter(o => o.OrderStatus === 'Pending');
  const cancelledOrders = orders.filter(o => o.OrderStatus === 'Cancelled');
  const totalRevenue = paidOrders.reduce((sum, o) => sum + (o.TotalAmount || 0), 0);

  return (
    <div className="space-y-4">
      {/* Metric KPI Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700">
            <Receipt className="w-5 h-5 stroke-[1.8]" />
          </div>
          <div>
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              Total Receipts
            </span>
            <span className="text-xl font-extrabold text-slate-900 tabular-nums">
              {orders.length}
            </span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle className="w-5 h-5 stroke-[1.8]" />
          </div>
          <div>
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              Settled Revenue
            </span>
            <span className="text-xl font-extrabold text-emerald-700 tabular-nums">
              ₱{totalRevenue.toFixed(2)}
            </span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Clock className="w-5 h-5 stroke-[1.8]" />
          </div>
          <div>
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              Pending Tabs
            </span>
            <span className="text-xl font-extrabold text-amber-700 tabular-nums">
              {pendingOrders.length}
            </span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center">
            <Ban className="w-5 h-5 stroke-[1.8]" />
          </div>
          <div>
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              Voided / Cancelled
            </span>
            <span className="text-xl font-extrabold text-slate-700 tabular-nums">
              {cancelledOrders.length}
            </span>
          </div>
        </div>
      </div>

      {/* Header, Search & Filter Pills */}
      <div className="p-4 rounded-2xl flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 border border-slate-200/80 bg-white shadow-xs">
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search order #, customer, cashier..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-slate-400 focus:bg-white transition-all shadow-2xs"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          {[
            { id: 'All', label: 'All Orders', count: orders.length },
            { id: 'Paid', label: 'Paid', count: paidOrders.length },
            { id: 'Pending', label: 'Pending', count: pendingOrders.length },
            { id: 'Cancelled', label: 'Cancelled', count: cancelledOrders.length }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => onSelectStatusFilter(tab.id)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                statusFilter === tab.id
                  ? 'bg-slate-900 text-white shadow-xs font-bold'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200/70'
              }`}
            >
              <span>{tab.label}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full tabular-nums font-bold ${
                statusFilter === tab.id ? 'bg-slate-800 text-white' : 'bg-slate-200/80 text-slate-600'
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
          <button
            onClick={onRefresh}
            title="Refresh Ledger"
            className="p-1.5 border border-slate-200 rounded-xl hover:bg-slate-100 text-slate-600 transition-colors cursor-pointer shrink-0 ml-1"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Orders List */}
      <div className="space-y-2.5">
        {filteredOrders.length === 0 ? (
          <div className="rounded-2xl p-12 text-center text-slate-400 border border-slate-200 bg-white">
            <p className="text-sm font-bold text-slate-800">No orders recorded</p>
            <p className="text-xs text-slate-400 mt-0.5">
              {searchQuery ? `No orders matched "${searchQuery}"` : 'Transactions will appear here when submitted at the POS register.'}
            </p>
          </div>
        ) : (
          filteredOrders.map((order) => {
            const isExpanded = expandedOrderId === order.OrderID;
            const isPaid = order.OrderStatus === 'Paid';
            const isPending = order.OrderStatus === 'Pending';
            const isCancelled = order.OrderStatus === 'Cancelled';

            return (
              <div
                key={order.OrderID}
                className="rounded-2xl border border-slate-200/80 bg-white hover:border-slate-300 transition-all overflow-hidden shadow-xs"
              >
                {/* Main Order Row */}
                <div className="p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  {/* Left: ID & Customer */}
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold px-2.5 py-1 bg-slate-100 border border-slate-200 rounded-lg text-slate-900 tabular-nums">
                      #{order.OrderID}
                    </span>
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">
                        {order.CustomerName}
                        <span className="ml-2 text-xs font-normal text-slate-500">
                          ({order.CustomerType})
                        </span>
                      </h4>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Cashier: <span className="text-slate-800 font-medium">{order.CashierName}</span> • {order.OrderDate} {order.OrderTime}
                      </p>
                    </div>
                  </div>

                  {/* Middle: Status Badge & Total */}
                  <div className="flex items-center gap-4 self-stretch md:self-auto justify-between md:justify-end">
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">Total Amount</span>
                      <span className="text-base font-extrabold text-slate-900 tabular-nums">
                        ₱{order.TotalAmount.toFixed(2)}
                      </span>
                    </div>

                    <span
                      className={`text-[11px] font-semibold px-2.5 py-1 rounded-md border ${
                        isPaid
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          : isPending
                          ? 'bg-amber-50 text-amber-800 border-amber-200'
                          : 'bg-slate-100 text-slate-600 border-slate-200'
                      }`}
                    >
                      {order.OrderStatus}
                    </span>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      {isPending && (
                        <>
                          <button
                            onClick={() => onOpenPaymentModal(order)}
                            className="py-1.5 px-3 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition-colors cursor-pointer shadow-2xs"
                          >
                            Settle Pay
                          </button>
                          <button
                            onClick={() => onCancelOrder(order.OrderID)}
                            className="px-2.5 py-1.5 bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-700 text-xs font-semibold rounded-xl border border-slate-200 transition-colors cursor-pointer"
                          >
                            Void
                          </button>
                        </>
                      )}

                      <button
                        onClick={() => toggleExpand(order.OrderID)}
                        className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
                        title="View items"
                      >
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Expanded Details: Line items */}
                {isExpanded && (
                  <div className="bg-slate-50/80 p-4 border-t border-slate-200 space-y-2.5 text-xs animate-in fade-in duration-150">
                    <div className="text-slate-600 text-xs flex justify-between font-semibold">
                      <span>Order Line Items</span>
                      {order.PaymentMethod && (
                        <span className="text-emerald-700 font-medium">
                          Paid via {order.PaymentMethod} • {order.PaymentDate?.replace('T', ' ').slice(0, 19)}
                        </span>
                      )}
                    </div>

                    <div className="rounded-xl border border-slate-200/80 bg-white overflow-hidden divide-y divide-slate-100">
                      {order.Items.map((item) => (
                        <div key={item.OrderDetailID} className="p-3 flex justify-between items-center text-slate-700">
                          <div>
                            <span className="font-bold text-slate-900">{item.ProductName}</span>
                            <span className="text-slate-500 text-xs ml-2">({item.Category})</span>
                          </div>
                          <div className="tabular-nums">
                            {item.Quantity} × ₱{item.SellingPriceAtOrder.toFixed(2)} = <span className="font-extrabold text-slate-900">₱{item.Subtotal.toFixed(2)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

