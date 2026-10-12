import React from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';

export default function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title = "Are you sure you want to remove?",
  message = "This action will remove the selected item. Please confirm to proceed.",
  confirmText = "Yes, Remove",
  cancelText = "Cancel",
  variant = "danger",
  isSubmitting = false,
  itemHighlight = null
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl max-w-sm w-full p-6 border border-slate-200 shadow-2xl relative animate-in zoom-in-95 duration-150">
        {/* Close Button */}
        <button
          onClick={onClose}
          disabled={isSubmitting}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header Icon */}
        <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-200/80 text-rose-600 flex items-center justify-center mb-4 shadow-2xs">
          {variant === 'danger' ? (
            <Trash2 className="w-5 h-5 stroke-[2]" />
          ) : (
            <AlertTriangle className="w-5 h-5 stroke-[2]" />
          )}
        </div>

        {/* Content */}
        <div>
          <h3 className="font-extrabold text-slate-900 text-base leading-snug">
            {title}
          </h3>
          <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
            {message}
          </p>

          {/* Highlight Badge if provided */}
          {itemHighlight && (
            <div className="mt-3.5 p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-xs font-semibold text-slate-800">
              {itemHighlight}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="mt-6 flex items-center gap-2.5">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="flex-1 py-2.5 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl border border-slate-200 transition-colors cursor-pointer disabled:opacity-50"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isSubmitting}
            className={`flex-1 py-2.5 text-xs font-bold text-white rounded-xl shadow-xs transition-all cursor-pointer active:scale-[0.98] disabled:opacity-50 ${
              variant === 'danger'
                ? 'bg-rose-600 hover:bg-rose-700'
                : 'bg-amber-600 hover:bg-amber-700'
            }`}
          >
            {isSubmitting ? 'Processing...' : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
