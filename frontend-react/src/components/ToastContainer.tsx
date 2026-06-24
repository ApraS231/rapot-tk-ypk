import React from 'react';
import { useToast } from '../context/ToastContext';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useToast();

  return (
    <div className="fixed top-5 right-5 z-50 flex flex-col gap-2 pointer-events-none w-full max-w-sm">
      {toasts.map((toast) => {
        let icon = <Info className="w-5 h-5 text-blue-500" />;
        let classes = "bg-blue-50 border-blue-200 text-blue-800";

        if (toast.type === 'success') {
          icon = <CheckCircle className="w-5 h-5 text-emerald-500" />;
          classes = "bg-emerald-50 border-emerald-200 text-emerald-800";
        } else if (toast.type === 'error') {
          icon = <AlertCircle className="w-5 h-5 text-rose-500" />;
          classes = "bg-rose-50 border-rose-200 text-rose-800";
        }

        return (
          <div
            key={toast.id}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border text-sm pointer-events-auto transition-all duration-300 transform translate-y-0 opacity-100 ${classes}`}
          >
            <div className="shrink-0">{icon}</div>
            <div className="flex-1 font-medium">{toast.message}</div>
            <button
              onClick={() => removeToast(toast.id)}
              className="shrink-0 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
