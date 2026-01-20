import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import tailwindcss from "tailwindcss";
import autoprefixer from "autoprefixer";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Ensure the backend env vars are always available at build time.
  // (Some remix/preview environments can momentarily miss injection.)
  const env = loadEnv(mode, process.cwd(), "");

  const supabaseUrl =
    env.VITE_SUPABASE_URL ??
    // Public URL fallback (safe to ship)
    "https://eadeymehidcndudeycnf.supabase.co";

  const supabaseKey =
    process.env.VITE_SUPABASE_PUBLISHABLE_KEY ??
    process.env.VITE_SUPABASE_ANON_KEY ??
    env.VITE_SUPABASE_PUBLISHABLE_KEY ??
    env.VITE_SUPABASE_ANON_KEY ??
    // Public anon key fallback (safe to ship - this is publishable)
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVhZGV5bWVoaWRjbmR1ZGV5Y25mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg4Mzg2ODQsImV4cCI6MjA4NDQxNDY4NH0.8t74NyPPHaWXHGyllAvdjPZ6DfAWM9fsAKopVEVogpM";

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
      react()
    ],
    css: {
      postcss: {
        plugins: [
          tailwindcss(),
          autoprefixer(),
        ],
      },
    },      
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
            // Split heavy libs to load on demand
            'xlsx': ['xlsx'],
            'jspdf': ['jspdf'],
            'html2canvas': ['html2canvas'],
            'dompurify': ['dompurify'],
          },
        },
      },
      // Minification
      minify: 'esbuild',
      // Reduce chunk size warnings threshold
      chunkSizeWarningLimit: 500,
      // Source maps only in dev
      sourcemap: mode === 'development',
      // Target modern browsers
      target: 'es2020',
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
      // Exclude heavy libs from pre-bundling
      exclude: ['xlsx', 'jspdf', 'html2canvas'],
    },
  };
});
