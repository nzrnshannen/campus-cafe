import React, { useState } from 'react';
import { X } from 'lucide-react';

export default function CustomerModal({
  isOpen,
  onClose,
  onSubmitCustomer
}) {
  const [name, setName] = useState('');
  const [univId, setUnivId] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [customerType, setCustomerType] = useState('Student');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    if (!name.trim()) {
      setError('Customer name is required.');
      return;
    }

    try {
      setIsSubmitting(true);
      await onSubmitCustomer({
        name: name.trim(),
        univId: univId.trim() || null,
        contactNumber: contactNumber.trim() || null,
        customerType
      });
      setName('');
      setUnivId('');
      setContactNumber('');
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to register customer');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl max-w-sm w-full p-6 border border-slate-200/80 shadow-2xl relative animate-in zoom-in-95 duration-150">
        <div className="flex justify-between items-center pb-3 border-b border-slate-100">
          <h3 className="font-bold text-slate-900 text-sm">Register New Customer</h3>
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
              Full Name *
            </label>
            <input
              type="text"
              placeholder="e.g. Maria Santos"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-slate-400 focus:bg-white"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Classification *
            </label>
            <select
              value={customerType}
              onChange={(e) => setCustomerType(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-slate-400 focus:bg-white cursor-pointer"
            >
              <option value="Student">Student</option>
              <option value="Faculty">Faculty</option>
              <option value="Employee">Employee</option>
              <option value="Other">Other / Visitor</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              University ID (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. 2024-00123"
              value={univId}
              onChange={(e) => setUnivId(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-slate-400 focus:bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Contact Number (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. 09171234567"
              value={contactNumber}
              onChange={(e) => setContactNumber(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-slate-400 focus:bg-white"
            />
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
              {isSubmitting ? 'Registering...' : 'Add Customer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
