import React, { useState } from 'react';
import { X, Plus, Trash2, BookOpen, Sparkles } from 'lucide-react';

export default function AddProductModal({
  isOpen,
  onClose,
  ingredients = [],
  categories = ['Coffee', 'Pastry', 'Beverage', 'Meals'],
  onSubmitProduct
}) {
  const [productName, setProductName] = useState('');
  const [category, setCategory] = useState(categories[0] || 'Coffee');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [availabilityPeriod, setAvailabilityPeriod] = useState('All Day');

  const [recipeItems, setRecipeItems] = useState([
    { ingredientId: ingredients[0]?.IngredientID || '', quantityRequired: '' }
  ]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const handleAddItemRow = () => {
    setRecipeItems([
      ...recipeItems,
      { ingredientId: ingredients[0]?.IngredientID || '', quantityRequired: '' }
    ]);
  };

  const handleRemoveItemRow = (index) => {
    if (recipeItems.length === 1) return;
    setRecipeItems(recipeItems.filter((_, idx) => idx !== index));
  };

  const handleItemChange = (index, field, value) => {
    const updated = [...recipeItems];
    updated[index][field] = value;
    setRecipeItems(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!productName.trim()) {
      setError('Product name is required.');
      return;
    }

    const parsedPrice = parseFloat(price);
    if (isNaN(parsedPrice) || parsedPrice <= 0) {
      setError('Please enter a valid price greater than zero.');
      return;
    }

    // Format and validate recipe items if specified
    const formattedIngredients = [];
    for (const item of recipeItems) {
      if (!item.ingredientId) continue;
      const qty = parseFloat(item.quantityRequired);
      if (isNaN(qty) || qty <= 0) {
        setError('Please enter a valid positive quantity for all selected recipe ingredients.');
        return;
      }
      formattedIngredients.push({
        ingredientId: Number(item.ingredientId),
        quantityRequired: qty
      });
    }

    try {
      setIsSubmitting(true);
      await onSubmitProduct({
        productName: productName.trim(),
        category,
        price: parsedPrice,
        description: description.trim() || null,
        availabilityPeriod: availabilityPeriod || 'All Day',
        ingredients: formattedIngredients
      });

      // Reset form
      setProductName('');
      setPrice('');
      setDescription('');
      setRecipeItems([{ ingredientId: ingredients[0]?.IngredientID || '', quantityRequired: '' }]);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to create menu item & recipe.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 border border-slate-200/80 shadow-2xl relative animate-in zoom-in-95 duration-150 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center pb-3.5 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center text-slate-800">
              <BookOpen className="w-4 h-4 stroke-[2]" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">
                Create Menu Item & Recipe
              </h3>
              <p className="text-xs text-slate-400">
                Maps a new product to raw stock deduction formulas.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className="mt-3 p-2.5 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl shrink-0">
            {error}
          </div>
        )}

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="mt-4 space-y-4 text-xs overflow-y-auto pr-1 flex-1">
          {/* Product Name & Category */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Product Name *
              </label>
              <input
                type="text"
                placeholder="e.g. Vanilla Cold Foam Latte"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-slate-400 focus:bg-white font-medium"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Category *
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-slate-400 focus:bg-white cursor-pointer font-medium"
              >
                {['Coffee', 'Pastry', 'Beverage', 'Meals'].map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Price & Availability Period */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Price (₱) *
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                placeholder="e.g. 150.00"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-bold focus:outline-none focus:border-slate-400 focus:bg-white tabular-nums"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Serving Period
              </label>
              <select
                value={availabilityPeriod}
                onChange={(e) => setAvailabilityPeriod(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-slate-400 focus:bg-white cursor-pointer"
              >
                <option value="All Day">All Day</option>
                <option value="Breakfast (6AM-11AM)">Breakfast (6AM-11AM)</option>
                <option value="Lunch (11AM-2PM)">Lunch (11AM-2PM)</option>
                <option value="Evening (5PM-10PM)">Evening (5PM-10PM)</option>
              </select>
            </div>
          </div>

          {/* Description (Optional) */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Description / Flavor Notes (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Slow-steeped cold brew with velvety Madagascar vanilla foam"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-slate-400 focus:bg-white"
            />
          </div>

          {/* Recipe Ingredients Mapping Section */}
          <div className="pt-2 border-t border-slate-100">
            <div className="flex justify-between items-center mb-2">
              <div>
                <label className="text-xs font-bold text-slate-900">
                  Recipe Ingredients Formula
                </label>
                <span className="text-[11px] text-slate-400 block">
                  Deducted from kitchen stock on every POS order.
                </span>
              </div>
              <button
                type="button"
                onClick={handleAddItemRow}
                className="text-xs text-slate-900 font-bold hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Add Ingredient</span>
              </button>
            </div>

            <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
              {recipeItems.map((row, index) => {
                const selectedIng = ingredients.find(i => i.IngredientID === Number(row.ingredientId));
                return (
                  <div key={index} className="flex items-center gap-2 bg-slate-50 p-2 rounded-xl border border-slate-200">
                    <select
                      value={row.ingredientId}
                      onChange={(e) => handleItemChange(index, 'ingredientId', e.target.value)}
                      className="flex-1 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-900 text-xs font-medium cursor-pointer"
                      required
                    >
                      {ingredients.map(ing => (
                        <option key={ing.IngredientID} value={ing.IngredientID}>
                          {ing.IngredientName} ({ing.UnitOfMeasurement}) • Stock: {ing.CurrentQuantity}
                        </option>
                      ))}
                    </select>

                    <div className="w-28 relative">
                      <input
                        type="number"
                        placeholder="Qty"
                        step="0.001"
                        min="0.001"
                        value={row.quantityRequired}
                        onChange={(e) => handleItemChange(index, 'quantityRequired', e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-900 font-bold text-xs focus:border-slate-400 focus:outline-none tabular-nums"
                        required
                      />
                      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 font-semibold">
                        {selectedIng?.UnitOfMeasurement || ''}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemoveItemRow(index)}
                      disabled={recipeItems.length === 1}
                      className="text-slate-400 hover:text-rose-600 p-1.5 disabled:opacity-25 transition-colors cursor-pointer"
                      title="Remove row"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Form Actions */}
          <div className="pt-3 border-t border-slate-100 flex justify-end gap-2 shrink-0">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl border border-slate-200 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 text-xs font-bold rounded-xl bg-slate-900 hover:bg-black text-white cursor-pointer shadow-xs disabled:opacity-50"
            >
              {isSubmitting ? 'Saving Recipe...' : 'Save & Publish Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
