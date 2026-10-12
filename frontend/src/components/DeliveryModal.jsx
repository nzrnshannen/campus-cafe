import React, { useState } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import ConfirmationModal from './ui/ConfirmationModal';

export default function DeliveryModal({
  isOpen,
  onClose,
  suppliers,
  ingredients,
  onSubmitDelivery
}) {
  const [supplierId, setSupplierId] = useState(suppliers[0]?.SupplierID || '');
  const [deliveryDate, setDeliveryDate] = useState(new Date().toISOString().slice(0, 10));
  const [items, setItems] = useState([
    { ingredientId: ingredients[0]?.IngredientID || '', quantityReceived: '' }
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [confirmRowIndex, setConfirmRowIndex] = useState(null);

  if (!isOpen) return null;

  const handleAddItemRow = () => {
    setItems([
      ...items,
      { ingredientId: ingredients[0]?.IngredientID || '', quantityReceived: '' }
    ]);
  };

  const handleRemoveItemRow = (index) => {
    if (items.length === 1) return;
    const item = items[index];
    if (item.quantityReceived && parseFloat(item.quantityReceived) > 0) {
      setConfirmRowIndex(index);
    } else {
      setItems(items.filter((_, idx) => idx !== index));
    }
  };

  const handleItemChange = (index, field, value) => {
    const updated = [...items];
    updated[index][field] = value;
    setItems(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!supplierId) {
      setError('Please select a supplier.');
      return;
    }

    const formattedItems = items.map(i => ({
      ingredientId: Number(i.ingredientId),
      quantityReceived: parseFloat(i.quantityReceived)
    }));

    for (const item of formattedItems) {
      if (!item.ingredientId || isNaN(item.quantityReceived) || item.quantityReceived <= 0) {
        setError('Please enter a valid positive quantity for all ingredients.');
        return;
      }
    }

    try {
      setIsSubmitting(true);
      await onSubmitDelivery({
        supplierId: Number(supplierId),
        deliveryDate,
        items: formattedItems
      });
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to log delivery');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 border border-slate-200/80 shadow-2xl relative animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex justify-between items-center pb-4 border-b border-slate-100">
          <div>
            <h3 className="font-bold text-slate-900 text-sm">
              Receive Inventory Delivery
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">Increments stock quantities upon receipt.</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 p-1 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className="mt-3 p-2.5 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Vendor / Supplier
              </label>
              <select
                value={supplierId}
                onChange={(e) => setSupplierId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-slate-400 focus:bg-white cursor-pointer"
                required
              >
                {suppliers.map(s => (
                  <option key={s.SupplierID} value={s.SupplierID}>
                    {s.CompanyName}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Delivery Date
              </label>
              <input
                type="date"
                value={deliveryDate}
                onChange={(e) => setDeliveryDate(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-slate-400 focus:bg-white"
                required
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-xs font-semibold text-slate-700">
                Delivered Items
              </label>
              <button
                type="button"
                onClick={handleAddItemRow}
                className="text-xs text-slate-900 font-bold hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3 h-3" /> Add Item
              </button>
            </div>

            <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
              {items.map((row, index) => {
                const selectedIng = ingredients.find(i => i.IngredientID === Number(row.ingredientId));
                return (
                  <div key={index} className="flex items-center gap-2 bg-slate-50 p-2 rounded-xl border border-slate-200">
                    <select
                      value={row.ingredientId}
                      onChange={(e) => handleItemChange(index, 'ingredientId', e.target.value)}
                      className="flex-1 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-900 text-xs"
                      required
                    >
                      {ingredients.map(ing => (
                        <option key={ing.IngredientID} value={ing.IngredientID}>
                          {ing.IngredientName} ({ing.UnitOfMeasurement})
                        </option>
                      ))}
                    </select>

                    <div className="w-28 relative">
                      <input
                        type="number"
                        placeholder="Qty"
                        step="0.01"
                        min="0.01"
                        value={row.quantityReceived}
                        onChange={(e) => handleItemChange(index, 'quantityReceived', e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-900 font-bold text-xs focus:border-slate-400 focus:outline-none"
                        required
                      />
                      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 font-medium">
                        {selectedIng?.UnitOfMeasurement || ''}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemoveItemRow(index)}
                      disabled={items.length === 1}
                      className="text-slate-400 hover:text-rose-600 p-1.5 disabled:opacity-25 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
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
              className="px-5 py-2 text-xs font-bold rounded-xl bg-slate-900 hover:bg-slate-800 text-white cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? 'Recording...' : 'Confirm Delivery'}
            </button>
          </div>
        </form>
      </div>

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={confirmRowIndex !== null}
        onClose={() => setConfirmRowIndex(null)}
        onConfirm={() => {
          if (confirmRowIndex !== null) {
            setItems(items.filter((_, idx) => idx !== confirmRowIndex));
            setConfirmRowIndex(null);
          }
        }}
        title="Are you sure you want to remove?"
        message="This ingredient line and its recorded quantity will be removed from the shipment draft."
        confirmText="Yes, Remove"
      />
    </div>
  );
}
