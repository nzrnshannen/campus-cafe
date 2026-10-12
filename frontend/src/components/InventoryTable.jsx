import React, { useState } from 'react';
import { RefreshCw, Check, X, Search, Package, AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';

export default function InventoryTable({
  ingredients,
  lowStockItems,
  onOpenDeliveryModal,
  onOpenAddIngredientModal,
  onRefresh,
  onQuickUpdateStock,
  onDeleteIngredient
}) {
  const [editingId, setEditingId] = useState(null);
  const [editQty, setEditQty] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const startEdit = (ing) => {
    setEditingId(ing.IngredientID);
    setEditQty(ing.CurrentQuantity.toString());
  };

  const saveEdit = (ingId) => {
    const val = parseFloat(editQty);
    if (!isNaN(val) && val >= 0) {
      onQuickUpdateStock(ingId, val);
    }
    setEditingId(null);
  };

  const filteredIngredients = ingredients.filter(ing =>
    ing.IngredientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    ing.UnitOfMeasurement.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const outOfStockCount = ingredients.filter(i => parseFloat(i.CurrentQuantity) <= 0).length;
  const optimalCount = ingredients.filter(i => {
    const curr = parseFloat(i.CurrentQuantity);
    const min = parseFloat(i.MinimumStockLevel);
    return curr > min;
  }).length;

  return (
    <div className="space-y-4">
      {/* KPI Summary Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700">
            <Package className="w-5 h-5 stroke-[1.8]" />
          </div>
          <div>
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              Total Raw Items
            </span>
            <span className="text-xl font-extrabold text-slate-900 tabular-nums">
              {ingredients.length}
            </span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5 stroke-[1.8]" />
          </div>
          <div>
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              Optimal Stock
            </span>
            <span className="text-xl font-extrabold text-emerald-700 tabular-nums">
              {optimalCount}
            </span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 stroke-[1.8]" />
          </div>
          <div>
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              Low Stock Alert
            </span>
            <span className="text-xl font-extrabold text-amber-700 tabular-nums">
              {lowStockItems.length}
            </span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
            <XCircle className="w-5 h-5 stroke-[1.8]" />
          </div>
          <div>
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              Out of Stock
            </span>
            <span className="text-xl font-extrabold text-rose-700 tabular-nums">
              {outOfStockCount}
            </span>
          </div>
        </div>
      </div>

      {/* Low Stock Warning Banner */}
      {lowStockItems && lowStockItems.length > 0 && (
        <div className="rounded-2xl p-4 bg-amber-50 border border-amber-200/90 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
          <div>
            <h4 className="font-bold text-amber-950 text-xs">
              Reorder Attention Needed ({lowStockItems.length} {lowStockItems.length === 1 ? 'ingredient' : 'ingredients'} below minimum threshold)
            </h4>
            <p className="text-xs text-amber-800 mt-0.5 leading-relaxed">
              {lowStockItems.map(i => `${i.IngredientName} (${i.CurrentQuantity} ${i.UnitOfMeasurement})`).join(', ')}
            </p>
          </div>
          <button
            onClick={onOpenDeliveryModal}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-700 hover:bg-amber-800 text-white transition-colors cursor-pointer shrink-0 shadow-xs"
          >
            Record Inbound Delivery
          </button>
        </div>
      )}

      {/* Main Table Card */}
      <div className="rounded-2xl overflow-hidden border border-slate-200/80 bg-white shadow-xs">
        {/* Actions Bar */}
        <div className="p-4 border-b border-slate-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 bg-white">
          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search raw ingredients..."
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

          <div className="flex items-center gap-2 w-full md:w-auto justify-end">
            <button
              onClick={onRefresh}
              title="Refresh ledger"
              className="p-2 border border-slate-200 rounded-xl hover:bg-slate-100 text-slate-600 transition-colors cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={onOpenAddIngredientModal}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-white hover:bg-slate-50 border border-slate-200 text-slate-800 transition-colors cursor-pointer"
            >
              + New Ingredient
            </button>
            <button
              onClick={onOpenDeliveryModal}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-900 hover:bg-black text-white transition-colors cursor-pointer shadow-xs"
            >
              Receive Delivery
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 text-slate-500 font-bold uppercase tracking-wider text-[11px] border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Ingredient Name</th>
                <th className="py-3 px-4">Current Stock</th>
                <th className="py-3 px-4">Min. Threshold</th>
                <th className="py-3 px-4">Stock Health</th>
                <th className="py-3 px-4">Unit</th>
                <th className="py-3 px-4 text-right">Adjustment</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredIngredients.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400 text-xs">
                    No ingredients match "{searchQuery}"
                  </td>
                </tr>
              ) : (
                filteredIngredients.map((ing) => {
                  const current = parseFloat(ing.CurrentQuantity);
                  const min = parseFloat(ing.MinimumStockLevel);
                  const isOutOfStock = current <= 0;
                  const isLow = current <= min && !isOutOfStock;
                  const percent = min > 0 ? Math.min(Math.round((current / (min * 2)) * 100), 100) : 100;

                  return (
                    <tr key={ing.IngredientID} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        {ing.IngredientName}
                      </td>

                      <td className="py-3.5 px-4">
                        {editingId === ing.IngredientID ? (
                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              value={editQty}
                              onChange={(e) => setEditQty(e.target.value)}
                              className="w-24 px-2 py-1 text-xs bg-white border border-slate-400 rounded-lg text-slate-900 font-bold focus:outline-none"
                              autoFocus
                            />
                            <button
                              onClick={() => saveEdit(ing.IngredientID)}
                              className="p-1 text-emerald-600 hover:bg-emerald-50 rounded-lg cursor-pointer"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setEditingId(null)}
                              className="p-1 text-slate-400 hover:bg-slate-100 rounded-lg cursor-pointer"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <span className="font-extrabold text-sm text-slate-900 tabular-nums">
                            {current.toLocaleString()}
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-slate-500 tabular-nums">
                        {min.toLocaleString()}
                      </td>

                      <td className="py-3.5 px-4 min-w-[170px]">
                        <div className="flex items-center gap-2 mb-1.5">
                          <span
                            className={`text-[10px] font-semibold px-2 py-0.5 rounded-md inline-flex items-center border ${
                              isOutOfStock
                                ? 'bg-rose-50 text-rose-800 border-rose-200'
                                : isLow
                                ? 'bg-amber-50 text-amber-800 border-amber-200'
                                : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            }`}
                          >
                            {isOutOfStock ? 'Out of Stock' : isLow ? 'Low Stock' : 'Optimal'}
                          </span>
                        </div>
                        {/* Solid Clean Progress Bar */}
                        <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden border border-slate-200/80">
                          <div
                            className={`h-full rounded-full transition-all duration-300 ${
                              isOutOfStock
                                ? 'bg-rose-500'
                                : isLow
                                ? 'bg-amber-500'
                                : 'bg-emerald-500'
                            }`}
                            style={{ width: `${isOutOfStock ? 4 : Math.max(percent, 8)}%` }}
                          />
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-slate-500 font-medium">
                        {ing.UnitOfMeasurement}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        {editingId !== ing.IngredientID && (
                          <div className="flex items-center justify-end gap-2.5">
                            <button
                              onClick={() => startEdit(ing)}
                              className="text-xs text-slate-700 hover:text-slate-900 font-semibold cursor-pointer transition-colors"
                            >
                              Adjust
                            </button>
                            {onDeleteIngredient && (
                              <button
                                onClick={() => onDeleteIngredient(ing)}
                                className="text-xs text-slate-400 hover:text-rose-600 font-semibold cursor-pointer transition-colors"
                                title={`Remove ${ing.IngredientName} from inventory`}
                              >
                                Remove
                              </button>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

