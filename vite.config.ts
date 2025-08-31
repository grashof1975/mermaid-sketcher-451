import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  console.log('🔧 vite.config.ts: Configuring Vite for mode:', mode);
  
  return {
    server: {
      host: "::",
      port: 8080,
    },
    plugins: [
      react(),
      mode === 'development' && componentTagger(),
    ].filter(Boolean),
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    optimizeDeps: {
      include: ['mermaid', 'react', 'react-dom'],
      exclude: [],
      force: true // Force re-optimization in case of issues
    },
    build: {
      sourcemap: mode === 'development',
      rollupOptions: {
        external: (id) => {
          // Don't externalize any dependencies
          return false;
        },
        onwarn(warning, warn) {
          // Suppress certain warnings that can cause blank screens
          if (warning.code === 'MODULE_LEVEL_DIRECTIVE') return;
          if (warning.code === 'SOURCEMAP_ERROR') return;
          warn(warning);
        }
      },
      commonjsOptions: {
        include: [/node_modules/],
        transformMixedEsModules: true
      }
    },
    esbuild: {
      // Ensure JSX is handled correctly
      jsx: 'automatic',
      target: 'es2020'
    },
    define: {
      // Ensure process.env is available
      'process.env.NODE_ENV': JSON.stringify(mode)
    }
  };
});
