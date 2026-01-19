import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Ensure the backend env vars are always available at build time.
  // (Some remix/preview environments can momentarily miss injection.)
  const env = loadEnv(mode, process.cwd(), "");

  const supabaseUrl =
    env.VITE_SUPABASE_URL ??
    // Public URL fallback (safe to ship)
    "https://cxzrjgkjikglkrjcmmhe.supabase.co";

  const supabaseKey =
    env.VITE_SUPABASE_PUBLISHABLE_KEY ??
    env.VITE_SUPABASE_ANON_KEY ??
    // Public anon/publishable key fallback (safe to ship)
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN4enJqZ2tqaWtnbGtyamNtbWhlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg0MDAxMDUsImV4cCI6MjA4Mzk3NjEwNX0.msBnOg6bvcLr7eaGZBhjM4uPFlRXV3zcUl5fuaW9W2E";

  return {
    server: {
      host: "localhost",
      port: 8080,
      hmr: {
        overlay: true,
      },
    },
    define: {
      "import.meta.env.VITE_SUPABASE_URL": JSON.stringify(supabaseUrl),
      "import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY": JSON.stringify(supabaseKey),       
    },
    plugins: [
      react(), 
      mode === "development" && componentTagger()
    ].filter(Boolean),      
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    // Performance optimizations
    build: {
      // Code splitting for better caching
      rollupOptions: {
        output: {
          manualChunks: {
            // Vendor chunks - rarely change, better caching
            'vendor-react': ['react', 'react-dom', 'react-router-dom'],
            'vendor-ui': ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu', '@radix-ui/react-popover', '@radix-ui/react-tooltip'],
            'vendor-utils': ['date-fns', 'clsx', 'tailwind-merge'],
            'vendor-supabase': ['@supabase/supabase-js'],
            'vendor-charts': ['recharts'],
          },
        },
      },
      // Minification
      minify: 'esbuild',
      // Reduce chunk size warnings threshold
      chunkSizeWarningLimit: 1000,
      // Source maps only in dev
      sourcemap: mode === 'development',
    },
    // Optimize deps pre-bundling
    optimizeDeps: {
      include: [
        'react',
        'react-dom',
        'react-router-dom',
        '@supabase/supabase-js',
        'date-fns',
        'lucide-react',
      ],
    },
  };
});
