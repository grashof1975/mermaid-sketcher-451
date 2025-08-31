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
      include: [
        'mermaid',
        'react', 
        'react-dom',
        'react-router-dom',
        '@tanstack/react-query'
      ],
      exclude: [
        // Exclude problematic mermaid modules
        'mermaid/dist/mermaid.esm.mjs'
      ],
      force: true
    },
    build: {
      sourcemap: mode === 'development',
      target: 'es2020',
      rollupOptions: {
        output: {
          // Separate mermaid into its own chunk to avoid conflicts
          manualChunks: {
            mermaid: ['mermaid']
          }
        },
        external: (id) => {
          // Handle commonjs-external pattern
          if (id.includes('?commonjs-external')) {
            return false;
          }
          return false;
        },
        onwarn(warning, warn) {
          // Suppress warnings that can cause build failures
          if (warning.code === 'MODULE_LEVEL_DIRECTIVE') return;
          if (warning.code === 'SOURCEMAP_ERROR') return;
          if (warning.code === 'CIRCULAR_DEPENDENCY' && warning.message.includes('mermaid')) return;
          warn(warning);
        }
      },
      commonjsOptions: {
        include: [/node_modules/, /mermaid/],
        transformMixedEsModules: true,
        requireReturnsDefault: 'auto'
      }
    },
    esbuild: {
      jsx: 'automatic',
      target: 'es2020'
    },
    define: {
      'process.env.NODE_ENV': JSON.stringify(mode),
      // Define global for better compatibility
      global: 'globalThis'
    }
  };
});
