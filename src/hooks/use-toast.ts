
// Import toast from sonner 
import { toast as sonnerToast } from "sonner";

// Create a re-usable toast object that extends sonner's functionality if needed
const toast = {
  ...sonnerToast,
  // Add any custom methods here
};

// Export the toast object
export { toast };

// Re-export the toast function for convenience
export default toast;
