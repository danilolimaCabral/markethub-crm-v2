import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  
  build: {
    // Diretório de saída
    outDir: 'dist',
    
    // Assets directory
    assetsDir: 'assets',
    
    // Minificação
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info', 'console.debug'],
      },
      format: {
        comments: false,
      },
    },
    
    // Code splitting
    rollupOptions: {
      output: {
        // Manual chunks para otimizar carregamento
        manualChunks: {
          // Vendor chunk (React e libs principais)
          vendor: [
            'react',
            'react-dom',
            'react-router-dom',
          ],
          
          // UI components chunk
          ui: [
            '@radix-ui/react-dialog',
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-label',
            '@radix-ui/react-select',
            '@radix-ui/react-tabs',
            '@radix-ui/react-toast',
          ],
          
          // Utils chunk
          utils: [
            'axios',
            'date-fns',
            'zod',
          ],
        },
        
        // Naming pattern para assets
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name.split('.');
          const ext = info[info.length - 1];
          
          // Organizar assets por tipo
          if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(ext)) {
            return `assets/images/[name]-[hash][extname]`;
          }
          if (/woff|woff2|eot|ttf|otf/i.test(ext)) {
            return `assets/fonts/[name]-[hash][extname]`;
          }
          if (/css/i.test(ext)) {
            return `assets/css/[name]-[hash][extname]`;
          }
          return `assets/[name]-[hash][extname]`;
        },
      },
    },
    
    // Chunk size warnings
    chunkSizeWarningLimit: 1000,
    
    // Source maps (desabilitar em produção)
    sourcemap: false,
    
    // Report compressed size
    reportCompressedSize: true,
    
    // CSS code splitting
    cssCodeSplit: true,
    
    // Target
    target: 'es2015',
    
    // Polyfills
    polyfillModulePreload: true,
  },
  
  // Server configuration
  server: {
    port: 5173,
    strictPort: false,
    host: true,
    open: false,
  },
  
  // Preview configuration
  preview: {
    port: 4173,
    strictPort: false,
    host: true,
    open: false,
  },
  
  // Optimizations
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
    ],
    exclude: [],
  },
  
  // CSS configuration
  css: {
    devSourcemap: false,
    modules: {
      localsConvention: 'camelCase',
    },
  },
  
  // Environment variables prefix
  envPrefix: 'VITE_',
  
  // Base public path
  base: '/',
  
  // Public directory
  publicDir: 'public',
  
  // Esbuild options
  esbuild: {
    logOverride: { 'this-is-undefined-in-esm': 'silent' },
    drop: ['console', 'debugger'],
  },
});
