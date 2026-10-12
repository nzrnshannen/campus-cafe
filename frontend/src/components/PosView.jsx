import React, { useState } from 'react';
import { Search, Layers, X } from 'lucide-react';
import { getProductImage } from '../utils/productImages';

export default function PosView({
  products,
  categories,
  selectedCategory,
  onSelectCategory,
  onAddToCart,
  cartItems = []
}) {
  const [searchQuery, setSearchQuery] = useState('');

  // Map cart items for quick quantity lookup
  const cartQtyMap = cartItems.reduce((acc, item) => {
    acc[item.ProductID] = item.quantity;
    return acc;
  }, {});

  const filteredProducts = products.filter(product => {
    const matchesCategory = selectedCategory === 'All' || product.Category === selectedCategory;
    const matchesSearch = product.ProductName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="flex flex-col space-y-4">
      {/* Category Filter Pills & Search Bar - Sleek Control Bar */}
      <div className="p-3 bg-white border border-slate-200/80 rounded-2xl flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between shadow-xs">
        {/* Category Pills */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 md:pb-0 items-center">
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat;
            const count = cat === 'All'
              ? products.length
              : products.filter(p => p.Category === cat).length;

            return (
              <button
                key={cat}
                onClick={() => onSelectCategory(cat)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold tracking-normal transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer active:scale-95 ${
                  isSelected
                    ? 'bg-slate-900 text-white shadow-xs font-bold'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-200/70'
                }`}
              >
                <span>{cat}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold tabular-nums ${
                  isSelected ? 'bg-slate-800 text-white' : 'bg-slate-200/80 text-slate-600'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Minimal Search Input */}
        <div className="relative min-w-[270px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-slate-400 focus:bg-white transition-all shadow-2xs font-medium"
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
      </div>

      {/* Clean, Minimal & Compact Product Grid */}
      <div>
        {filteredProducts.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center text-center rounded-2xl border border-slate-200 bg-white shadow-xs p-6">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
              <Layers className="w-6 h-6 stroke-[1.5]" />
            </div>
            <p className="text-sm font-bold text-slate-800">No items match your filter</p>
            <p className="text-xs text-slate-500 mt-1 max-w-sm">
              We couldn't find any menu item matching "{searchQuery}". Try selecting another category or resetting the search.
            </p>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="mt-3 px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-700 transition-colors cursor-pointer"
              >
                Clear Search
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 2xl:grid-cols-5 gap-3.5">
            {filteredProducts.map((product) => {
              const isAvailable = product.AvailabilityStatus === 'Available';
              const imageUrl = getProductImage(product.ProductName);
              const inCartQty = cartQtyMap[product.ProductID] || 0;
              const recipeCount = product.Recipe?.length || 0;

              return (
                <div
                  key={product.ProductID}
                  onClick={() => {
                    if (isAvailable) onAddToCart(product);
                  }}
                  className={`bg-white rounded-2xl border border-slate-200/80 overflow-hidden flex flex-col justify-between select-none transition-all duration-200 ${
                    isAvailable
                      ? 'cursor-pointer hover:border-slate-300 hover:shadow-md hover:-translate-y-0.5 active:scale-[0.98]'
                      : 'opacity-55 cursor-not-allowed bg-slate-50'
                  } ${inCartQty > 0 ? 'ring-2 ring-slate-900 ring-offset-1' : ''}`}
                >
                  {/* Clean Photo (Aspect Ratio) */}
                  <div className="relative aspect-[4/3] w-full overflow-hidden bg-slate-100">
                    <img
                      src={imageUrl}
                      alt={product.ProductName}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      loading="lazy"
                    />

                    {/* Subtle In-Ticket Quantity Pill (top-right) if item is in cart */}
                    {inCartQty > 0 && (
                      <div className="absolute top-2 right-2 bg-slate-900/90 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-md flex items-center gap-1 backdrop-blur-xs">
                        <span>{inCartQty} in order</span>
                      </div>
                    )}
                  </div>

                  {/* Under the image */}
                  <div className="p-3 flex-1 flex flex-col justify-between">
                    {/* Top Row: Product Name on left, Price on right */}
                    <div className="flex items-baseline justify-between gap-2">
                      <h3
                        className="font-semibold text-gray-900 text-xs sm:text-sm truncate"
                        title={product.ProductName}
                      >
                        {product.ProductName}
                      </h3>
                      <span className="font-bold text-gray-900 text-xs sm:text-sm tabular-nums shrink-0">
                        ₱{product.Price.toFixed(2)}
                      </span>
                    </div>

                    {/* Bottom Row: Subtle recipe badge on left, Stock status badge on right */}
                    <div className="flex items-center justify-between gap-2 mt-2 text-[11px]">
                      <span className="text-slate-400 font-medium text-[11px] truncate">
                        {recipeCount > 0 ? `${recipeCount} ingredients` : 'Direct item'}
                      </span>

                      <span
                        className={`px-2 py-0.5 rounded-full font-semibold text-[10px] shrink-0 border ${
                          isAvailable
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200/80'
                            : 'bg-rose-50 text-rose-700 border-rose-200/80'
                        }`}
                      >
                        {isAvailable ? 'In Stock' : 'Out of Stock'}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
