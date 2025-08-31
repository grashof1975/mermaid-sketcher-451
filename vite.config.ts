import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  optimizeDeps: {
    include: ['mermaid'],
    exclude: []
  },
  build: {
    rollupOptions: {
      external: (id) => {
        if (id.includes('?commonjs-external')) {
          return false;
        }
        return false;
      }
    },
    commonjsOptions: {
      include: [/node_modules/],
      transformMixedEsModules: true
    }
  }
}));
