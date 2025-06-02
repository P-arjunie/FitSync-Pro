/* eslint-disable @typescript-eslint/no-unused-vars */
// import toast from "react-hot-toast";

// const Toast = (props) => {
//   // Success toast
//   if (props.type === "success") {
//     toast.success(props.message);
//   }
//   // Error toast
//   else if (props.type === "error") {
//     toast.error(props.message);
//   }
//   // Loading toast
//   else if (props.type === "loading") {
//     toast.loading(props.message);
//   }
//   // Promise toast
//   else if (props.type === "promise") {
//     toast.promise(props.myPromise, {
//       loading: props.loadingMessage,
//       success: props.successMessage,
//       error: props.errorMessage,
//     });
//   }
//   // Default toast
//   else {
//     toast(props.message);
//   }
// };

// export default Toast;
// utils/Toast.tsx
import { useEffect, useState } from 'react';
import { CheckCircle, XCircle, Info, AlertCircle, X } from 'lucide-react';

interface ToastProps {
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
  duration?: number;
}

interface ToastItem extends ToastProps {
  id: number;
}

let toastCounter = 0;
const toastList: ToastItem[] = [];
let addToastHandler: ((toast: ToastItem) => void) | null = null;

// Toast function to be called from anywhere
export default function Toast({ type, message, duration = 3000 }: ToastProps) {
  const newToast: ToastItem = {
    id: toastCounter++,
    type,
    message,
    duration,
  };
  
  if (addToastHandler) {
    addToastHandler(newToast);
  }
}

// Toast Container Component
export function ToastContainer() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  useEffect(() => {
    addToastHandler = (toast: ToastItem) => {
      setToasts((prev) => [...prev, toast]);
      
      // Auto remove toast after duration
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== toast.id));
      }, toast.duration);
    };

    return () => {
      addToastHandler = null;
    };
  }, []);

  const removeToast = (id: number) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'info':
        return <Info className="w-5 h-5 text-blue-500" />;
      case 'warning':
        return <AlertCircle className="w-5 h-5 text-yellow-500" />;
      default:
        return null;
    }
  };

  const getBackgroundColor = (type: string) => {
    switch (type) {
      case 'success':
        return 'bg-green-50 border-green-200';
      case 'error':
        return 'bg-red-50 border-red-200';
      case 'info':
        return 'bg-blue-50 border-blue-200';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`flex items-center gap-3 px-4 py-3 rounded-lg border shadow-md transition-all duration-300 ${getBackgroundColor(
            toast.type
          )}`}
        >
          {getIcon(toast.type)}
          <p className="flex-1 text-gray-800">{toast.message}</p>
          <button
            onClick={() => removeToast(toast.id)}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
