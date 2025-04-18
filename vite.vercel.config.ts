import { defineConfig } from "vite";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// Special configuration for Vercel deployment
export default defineConfig({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    // Disable native modules usage
    rollupOptions: {
      // Exclude all platform-dependent modules
      external: [
        /@rollup\/rollup-(linux|darwin|win32)/,
        /@rollup\/rollup-linux-x64-gnu/,
        /@rollup\/rollup-linux-x64-musl/,
        /@rollup\/rollup-linux-arm64-gnu/,
        /@rollup\/rollup-linux-arm64-musl/,
        /@rollup\/rollup-darwin-x64/,
        /@rollup\/rollup-darwin-arm64/
      ],
      // Disable platform-dependent optimizations
      treeshake: {
        moduleSideEffects: false,
        propertyReadSideEffects: false,
      },
      // Ignore warnings about missing optional dependencies
      onwarn(warning, warn) {
        if (
          warning.code === 'MODULE_LEVEL_DIRECTIVE' || 
          warning.message.includes('@rollup/rollup-') ||
          warning.message.includes('Could not resolve') ||
          warning.message.includes('native addon') ||
          warning.message.includes('optional dependency')
        ) {
          return;
        }
        warn(warning);
      },
      // Отключаем использование нативных модулей
      context: 'browser',
      // Используем специальную конфигурацию для Rollup
      plugins: [
        // Плагин для игнорирования платформо-зависимых модулей
        {
          name: 'ignore-platform-specific-modules',
          resolveId(id) {
            if (id.includes('@rollup/rollup-linux') || 
                id.includes('@rollup/rollup-darwin') || 
                id.includes('@rollup/rollup-win32')) {
              return { id: '@rollup/rollup-win32-x64-msvc', external: true };
            }
            return null;
          }
        }
      ]
    },
    // Disable sourcemap generation to reduce build size
    sourcemap: false,
    // Clear directory before building
    emptyOutDir: true,
    // Set target to esnext for maximum compatibility
    target: 'esnext',
    // Disable SSR
    ssr: false,
    // Settings for CommonJS modules
    commonjsOptions: {
      transformMixedEsModules: true,
      // Include node_modules
      include: [/node_modules/],
      // Exclude node_modules except @rollup
      exclude: [/node_modules\/(?!@rollup)/]
    },
    // Minimize output
    minify: true,
    // Disable chunk size warnings
    chunkSizeWarningLimit: 2000
  }
});