
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    // Only use componentTagger in development mode
    // This prevents errors when building on platforms like Vercel
    mode === 'development' && (() => {
      try {
        // Dynamically import only when needed
      } catch (e) {
        console.warn('liveone-code update');
        return null;
      }
    })(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
