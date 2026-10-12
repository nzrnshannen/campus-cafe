import React, { useState } from 'react';
import { BookOpen, Layers, CheckCircle2, AlertTriangle, Coffee, Ban, Check, Plus } from 'lucide-react';
import { getProductImage } from '../utils/productImages';

export default function RecipesView({ products, ingredients, onToggleStatus, onOpenAddProductModal }) {
  const [selectedCat, setSelectedCat] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');

  // Map ingredients for quick lookup of CurrentQuantity
  const ingredientStockMap = (ingredients || []).reduce((acc, ing) => {
    acc[ing.IngredientID] = parseFloat(ing.CurrentQuantity) || 0;
    return acc;
  }, {});

  const categories = ['All', ...new Set(products.map(p => p.Category))];

  const filteredProducts = products.filter(p => {
    const matchesCat = selectedCat === 'All' || p.Category === selectedCat;
    const isAvail = p.AvailabilityStatus === 'Available';
    const matchesStatus =
      statusFilter === 'All' ||
      (statusFilter === 'Available' && isAvail) ||
      (statusFilter === 'Unavailable' && !isAvail);
    return matchesCat && matchesStatus;
  });

  const availableCount = products.filter(p => p.AvailabilityStatus === 'Available').length;
  const unavailableCount = products.filter(p => p.AvailabilityStatus !== 'Available').length;

  return (
    <div className="space-y-4">
      {/* Header & Category Filters */}
      <div className="p-4 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-3 border border-slate-200/80 bg-white shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-slate-900 text-sm">
              Menu Recipes & Ingredient Formulas
            </h3>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
              {availableCount} Active in POS • {unavailableCount} Toggled Off
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time stock deduction formulas and POS availability controls.
          </p>
        </div>

        <div className="flex flex-wrap gap-1.5 items-center">
          {/* Category Filter Pills */}
          <div className="flex gap-1.5 overflow-x-auto pb-1 md:pb-0 items-center">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCat(cat)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
                  selectedCat === cat
                    ? 'bg-slate-900 text-white shadow-xs font-bold'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200/70'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Quick Availability Status Filter */}
          <div className="inline-flex rounded-xl bg-slate-100 p-0.5 border border-slate-200/80 text-xs ml-1">
            <button
              onClick={() => setStatusFilter('All')}
              className={`px-2.5 py-1 rounded-lg font-semibold transition-colors cursor-pointer ${
                statusFilter === 'All' ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              All ({products.length})
            </button>
            <button
              onClick={() => setStatusFilter('Available')}
              className={`px-2.5 py-1 rounded-lg font-semibold transition-colors cursor-pointer ${
                statusFilter === 'Available' ? 'bg-white text-emerald-800 shadow-2xs font-bold' : 'text-slate-500 hover:text-emerald-700'
              }`}
            >
              Active ({availableCount})
            </button>
            <button
              onClick={() => setStatusFilter('Unavailable')}
              className={`px-2.5 py-1 rounded-lg font-semibold transition-colors cursor-pointer ${
                statusFilter === 'Unavailable' ? 'bg-white text-rose-800 shadow-2xs font-bold' : 'text-slate-500 hover:text-rose-700'
              }`}
            >
              Toggled Off ({unavailableCount})
            </button>
          </div>

          {/* New Recipe Action Button */}
          {onOpenAddProductModal && (
            <button
              onClick={onOpenAddProductModal}
              className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-slate-900 hover:bg-black text-white transition-colors cursor-pointer shadow-xs flex items-center gap-1.5 ml-1"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>+ New Recipe</span>
            </button>
          )}
        </div>
      </div>

      {/* Grid of Product Recipes */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredProducts.map((product) => {
          const imageUrl = getProductImage(product.ProductName);
          const isAvailable = product.AvailabilityStatus === 'Available';

          // Calculate kitchen yield / feasible servings based on ingredients in stock
          let maxServings = Infinity;
          let bottleneckIngredient = null;

          if (product.Recipe && product.Recipe.length > 0) {
            product.Recipe.forEach((rec) => {
              const currentStock = ingredientStockMap[rec.IngredientID] ?? parseFloat(rec.CurrentQuantity) ?? 0;
              const required = parseFloat(rec.QuantityRequired) || 1;
              const possible = Math.floor(currentStock / required);
              if (possible < maxServings) {
                maxServings = possible;
                bottleneckIngredient = rec.IngredientName;
              }
            });
          } else {
            maxServings = 0;
          }

          const canFulfill = maxServings > 0 && maxServings !== Infinity;

          return (
            <div
              key={product.ProductID}
              className={`rounded-2xl border transition-all flex flex-col justify-between shadow-xs overflow-hidden ${
                isAvailable
                  ? 'border-slate-200/80 bg-white hover:border-slate-300'
                  : 'border-slate-200 bg-slate-50/70 opacity-90'
              }`}
            >
              {/* Product Thumbnail Header */}
              <div className="relative h-32 w-full overflow-hidden bg-slate-100">
                <img
                  src={imageUrl}
                  alt={product.ProductName}
                  className={`w-full h-full object-cover transition-all duration-300 ${
                    !isAvailable ? 'grayscale-[50%] opacity-75' : ''
                  }`}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />

                {/* Top Badges */}
                <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/95 text-slate-800 shadow-xs border border-slate-200/60 backdrop-blur-xs">
                    {product.Category}
                  </span>
                  {!isAvailable && (
                    <span className="text-[10px] font-bold tracking-wide px-2 py-0.5 rounded-full bg-rose-600 text-white shadow-xs">
                      Toggled Off
                    </span>
                  )}
                </div>

                {/* Toggle Button in Header */}
                {onToggleStatus && (
                  <button
                    type="button"
                    onClick={() => onToggleStatus(product.ProductID, isAvailable ? 'Unavailable' : 'Available')}
                    title={`Click to ${isAvailable ? 'disable' : 'enable'} in POS register`}
                    className={`absolute top-2.5 right-2.5 px-2.5 py-1 rounded-full text-[10px] font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1 ${
                      isAvailable
                        ? 'bg-white/90 hover:bg-white text-slate-700 hover:text-slate-900 border border-slate-200/70'
                        : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                    }`}
                  >
                    {isAvailable ? (
                      <>
                        <Ban className="w-2.5 h-2.5 text-slate-500" />
                        <span>Toggle Off</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-2.5 h-2.5 text-white stroke-[3]" />
                        <span>Enable POS</span>
                      </>
                    )}
                  </button>
                )}

                <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-baseline justify-between text-white">
                  <span className="text-sm font-black drop-shadow-xs">
                    {product.ProductName}
                  </span>
                  <span className="text-xs font-bold tabular-nums drop-shadow-xs">
                    ₱{product.Price.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Recipe Formula Content */}
              <div className="p-4 flex-1 flex flex-col justify-between">
                <div>
                  {/* Kitchen Readiness & POS Status Pill */}
                  <div className="mb-3">
                    {!isAvailable ? (
                      <span className="text-[11px] font-semibold px-2.5 py-1 rounded-lg border inline-flex items-center gap-1.5 bg-rose-50 text-rose-800 border-rose-200">
                        <Ban className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                        <span>
                          Toggled Off in POS {canFulfill ? `(${maxServings} servings possible)` : `(Lacks ${bottleneckIngredient || 'stock'})`}
                        </span>
                      </span>
                    ) : canFulfill ? (
                      <span className="text-[11px] font-semibold px-2.5 py-1 rounded-lg border inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-800 border-emerald-200">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>Ready for Orders ({maxServings} servings left)</span>
                      </span>
                    ) : (
                      <span className="text-[11px] font-semibold px-2.5 py-1 rounded-lg border inline-flex items-center gap-1.5 bg-amber-50 text-amber-800 border-amber-200">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                        <span>Lacks {bottleneckIngredient || 'stock'}</span>
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                    {product.Description || 'Crafted with premium selected ingredients.'}
                  </p>

                  {/* Required Ingredients Breakdown */}
                  <div className="mt-3 pt-3 border-t border-slate-100 space-y-1.5">
                    <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block">
                      Required Ingredients:
                    </span>

                    {product.Recipe && product.Recipe.length > 0 ? (
                      <div className="space-y-1.5 bg-slate-50/80 p-2.5 rounded-xl border border-slate-200/70">
                        {product.Recipe.map((rec) => {
                          const currentStock = ingredientStockMap[rec.IngredientID] ?? parseFloat(rec.CurrentQuantity) ?? 0;
                          const required = parseFloat(rec.QuantityRequired);
                          const isLow = currentStock < required;

                          return (
                            <div
                              key={rec.IngredientID}
                              className="flex justify-between items-center text-xs"
                            >
                              <span className="text-slate-700 font-medium">
                                {rec.IngredientName}
                              </span>
                              <span
                                className={`text-xs tabular-nums font-semibold ${
                                  isLow ? 'text-rose-600 font-bold' : 'text-slate-500'
                                }`}
                              >
                                {required} {rec.UnitOfMeasurement}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-xs text-slate-400 italic">No recipe mapped.</div>
                    )}
                  </div>
                </div>

                <div className="mt-4 pt-2.5 text-[11px] text-slate-400 flex justify-between items-center border-t border-slate-100">
                  <span>Serving Schedule:</span>
                  <span className="font-semibold text-slate-700">{product.AvailabilityPeriod || 'All Day'}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
