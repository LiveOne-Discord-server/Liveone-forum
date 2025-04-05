
import { 
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast"
import { toast } from "@/hooks/use-toast"

export function Toaster() {
  return (
    <ToastProvider>
      <ToastViewport />
      {/* Default toast location for react-hot-toast */}
      <div id="toast-container" />
    </ToastProvider>
  )
}
