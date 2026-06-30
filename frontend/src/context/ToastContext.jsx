import React, { createContext, useState, useCallback } from 'react';
import { CheckCircle, AlertCircle, X, Info } from 'lucide-react';

export const ToastContext = createContext();

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message, type = 'info', duration = 4000) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, duration);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      
      {/* Toast Render Portal-like Overlay */}
      <div className="fixed bottom-5 right-5 z-[9999] flex flex-col gap-3 max-w-sm w-full">
        {toasts.map((toast) => {
          let bgColor = 'bg-white text-slate-800 border-slate-100';
          let Icon = Info;
          let iconColor = 'text-primary';

          if (toast.type === 'success') {
            bgColor = 'bg-green-50 text-green-900 border-green-150';
            Icon = CheckCircle;
            iconColor = 'text-accent';
          } else if (toast.type === 'error') {
            bgColor = 'bg-red-50 text-red-900 border-red-150';
            Icon = AlertCircle;
            iconColor = 'text-red-500';
          }

          return (
            <div
              key={toast.id}
              className={`flex items-center gap-3 p-4 rounded-custom border shadow-lg transition-all duration-300 transform translate-y-0 animate-slide-in ${bgColor}`}
            >
              <Icon className={`w-5 h-5 shrink-0 ${iconColor}`} />
              <div className="flex-1 text-sm font-medium">{toast.message}</div>
              <button
                onClick={() => removeToast(toast.id)}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};
