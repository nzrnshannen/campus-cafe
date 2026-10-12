import React, { useState } from 'react';
import { X } from 'lucide-react';

export default function AddIngredientModal({
  isOpen,
  onClose,
  onSubmitIngredient
}) {
  const [ingredientName, setIngredientName] = useState('');
  const [unitOfMeasurement, setUnitOfMeasurement] = useState('g');
  const [currentQuantity, setCurrentQuantity] = useState('1000');
  const [minimumStockLevel, setMinimumStockLevel] = useState('200');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!ingredientName.trim()) {
      setError('Ingredient name is required.');
      return;
    }

    try {
      setIsSubmitting(true);
      await onSubmitIngredient({
        ingredientName: ingredientName.trim(),
        unitOfMeasurement,
        currentQuantity: parseFloat(currentQuantity) || 0,
        minimumStockLevel: parseFloat(minimumStockLevel) || 0
      });
      setIngredientName('');
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to add ingredient.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl max-w-sm w-full p-6 border border-slate-200/80 shadow-2xl relative animate-in zoom-in-95 duration-150">
        <div className="flex justify-between items-center pb-3 border-b border-slate-100">
          <h3 className="font-bold text-slate-900 text-sm">Add New Ingredient</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 p-1 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className="mt-3 p-2.5 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-3.5 text-xs">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Ingredient Name *
            </label>
            <input
              type="text"
              placeholder="e.g. Arabica Espresso Beans"
              value={ingredientName}
              onChange={(e) => setIngredientName(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-slate-400 focus:bg-white"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Unit of Measurement *
            </label>
            <select
              value={unitOfMeasurement}
              onChange={(e) => setUnitOfMeasurement(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-slate-400 focus:bg-white cursor-pointer"
            >
              <option value="g">Grams (g)</option>
              <option value="ml">Milliliters (ml)</option>
              <option value="pcs">Pieces (pcs)</option>
              <option value="kg">Kilograms (kg)</option>
              <option value="L">Liters (L)</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Initial Stock
              </label>
              <input
                type="number"
                step="0.01"
                value={currentQuantity}
                onChange={(e) => setCurrentQuantity(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-bold focus:outline-none focus:border-slate-400 focus:bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Min. Threshold
              </label>
              <input
                type="number"
                step="0.01"
                value={minimumStockLevel}
                onChange={(e) => setMinimumStockLevel(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-bold focus:outline-none focus:border-slate-400 focus:bg-white"
              />
            </div>
          </div>

          <div className="pt-2 flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 font-semibold text-xs text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl border border-slate-200 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-2.5 text-xs font-bold rounded-xl bg-slate-900 hover:bg-slate-800 text-white cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : 'Add Ingredient'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
