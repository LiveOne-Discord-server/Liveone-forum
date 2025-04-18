
import { toast } from '@/hooks/use-toast';

// Export functions that properly handle toast calls
export const showToast = {
  success: (message: string) => toast.success(message),
  error: (message: string) => toast.error(message),
  info: (message: string) => toast.info(message),
  warning: (message: string) => toast.warning(message),
  custom: (props: any) => toast(props),
};
