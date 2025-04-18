
import { Toast as ShadcnToast } from "@/components/ui/toast";
import { type ToastProps as ShadcnToastProps } from "@/components/ui/toast";
import { toast as sonnerToast } from "sonner";
// Import ToastProvider from the tsx file to re-export it
import { ToastProvider } from "./use-toast.tsx";

export type ToastProps = ShadcnToastProps;
// Re-export the ToastProvider component
export { ToastProvider };

// Create a unified toast interface that uses Sonner under the hood
interface ToastInterface {
  (props: ShadcnToastProps): React.ReactNode;
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
  promise: <T>(promise: Promise<T>, options: any) => sonnerToast.promise(promise, options),
  loading: (message: string) => sonnerToast.loading(message),
  dismiss: () => sonnerToast.dismiss(),
};

// Create a function that can be called directly with props for custom toasts
const customToast = (props: ShadcnToastProps) => ShadcnToast(props);

// Combine the custom function with all methods
const toast = customToast as ToastInterface;
Object.assign(toast, toastMethods);

export const useToast = () => {
  return {
    toasts: [],
    toast,
  };
};

export { toast };
export default toast;
