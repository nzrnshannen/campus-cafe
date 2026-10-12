import React, { useState } from 'react';
import { X } from 'lucide-react';

export default function PaymentModal({
  isOpen,
  onClose,
  order,
  onSettlePayment
}) {
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen || !order) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      setIsSubmitting(true);
      await onSettlePayment(order.OrderID, {
        paymentMethod,
        amountPaid: order.TotalAmount
      });
      onClose();
    } catch (err) {
      setError(err.message || 'Payment settlement failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl max-w-sm w-full p-6 border border-slate-200/80 shadow-2xl relative animate-in zoom-in-95 duration-150">
        <div className="flex justify-between items-center pb-3 border-b border-slate-100">
          <h3 className="font-bold text-slate-900 text-sm">
            Payment Settlement • Order #{order.OrderID}
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 p-1 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className="mt-3 p-2.5 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-center">
            <span className="text-xs text-slate-500 block font-medium">Total Amount Due</span>
            <div className="text-3xl font-black text-slate-900 mt-1">
              ₱{order.TotalAmount.toFixed(2)}
            </div>
            <div className="text-xs text-slate-500 mt-1">
              Customer: <span className="text-slate-800 font-semibold">{order.CustomerName}</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-2">
              Payment Method
            </label>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {['Cash', 'Digital Payment', 'Debit Card', 'Credit Card'].map((method) => (
                <button
                  type="button"
                  key={method}
                  onClick={() => setPaymentMethod(method)}
                  className={`p-2.5 rounded-xl border text-center transition-colors cursor-pointer font-semibold ${
                    paymentMethod === method
                      ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {method}
                </button>
              ))}
            </div>
          </div>

          <div className="pt-2 flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl border border-slate-200 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-2.5 text-xs font-bold rounded-xl bg-slate-900 hover:bg-slate-800 text-white cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? 'Recording...' : 'Complete Payment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
