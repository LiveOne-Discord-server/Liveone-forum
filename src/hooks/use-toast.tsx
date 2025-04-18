
import { Toast as ShadcnToast } from "@/components/ui/toast";
import { type ToastProps as ShadcnToastProps } from "@/components/ui/toast";
import { toast as sonnerToast } from "sonner";
import React, { createContext, useContext, useState } from "react";

// Extended toast props that include description
export interface ToastProps extends ShadcnToastProps {
  description?: React.ReactNode;
}

// Define a type for the toast state
type ToasterToast = ToastProps & {
  id: string;
  title?: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
};

// Create a toast context for state management
const ToastContext = createContext<{
  toasts: ToasterToast[];
  addToast: (toast: ToasterToast) => void;
  removeToast: (id: string) => void;
}>({
  toasts: [],
  addToast: () => {},
  removeToast: () => {},
});

// Provider component for the toast context
export function ToastProvider({
  children,
}: {
  children: React.ReactNode;
}): JSX.Element {
  const [toasts, setToasts] = useState<ToasterToast[]>([]);

  const addToast = (toast: ToasterToast) => {
    setToasts((prev) => [...prev, toast]);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
    </ToastContext.Provider>
  );
}

// Hook to use the toast context
export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}

// Create a unified toast interface that uses Sonner under the hood
interface ToastInterface {
  (props: ToastProps): React.ReactNode;
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
  warning: (message: string) => void;
  custom: typeof ShadcnToast;
  promise: <T>(promise: Promise<T>, options: any) => void;
  loading: (message: string) => void;
  dismiss: () => void;
}

// Create methods that call the sonner toast functions
const toastMethods = {
  // Basic toast variants
  success: (message: string) => sonnerToast.success(message),
  error: (message: string) => sonnerToast.error(message),
  info: (message: string) => sonnerToast.message(message),
  warning: (message: string) => sonnerToast.warning ? sonnerToast.warning(message) : sonnerToast.message(message),
  
  // Default toast function for custom options
  custom: ShadcnToast,
  
  // Additional sonner methods
  promise: function<T>(promise: Promise<T>, options: any) {
    return sonnerToast.promise(promise, options);
  },
  loading: (message: string) => sonnerToast.loading(message),
  dismiss: () => sonnerToast.dismiss(),
};

// Create a function that can be called directly with props for custom toasts
const customToast = (props: ToastProps) => {
  const { title, description, ...rest } = props;
  return sonnerToast(title as string, {
    description,
    ...rest
  });
};

// Combine the custom function with all methods
const toast = customToast as ToastInterface;
Object.assign(toast, toastMethods);

export { toast };
export default toast;
