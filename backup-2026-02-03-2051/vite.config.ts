import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { componentTagger } from "lovable-tagger";

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function devMigrationsPlugin() {
  const migrationsDir = path.resolve(__dirname, "supabase", "migrations");
  
  return {
    name: "dev-migrations-plugin",
    apply: "serve" as const,
    configureServer(server: any) {
      server.middlewares.use((req: any, res: any, next: any) => {
        // Only handle our specific routes
        if (!req?.url || typeof req.url !== "string") {
          return next();
        }
        if (!req.url.startsWith("/__dev/migrations")) {
          return next();
        }

        // Handle async operations
        (async () => {
          try {
            if (req.method !== "GET") {
              res.statusCode = 405;
              res.setHeader("Content-Type", "text/plain; charset=utf-8");
              res.end("Method Not Allowed");
              return;
            }

            const url = new URL(req.url, "http://localhost");
            const pathname = url.pathname;

            // List migrations
            if (pathname === "/__dev/migrations" || pathname === "/__dev/migrations/") {
              const dirents = await fs.readdir(migrationsDir, { withFileTypes: true });
              const files = dirents
                .filter((d) => d.isFile() && d.name.toLowerCase().endsWith(".sql"))
                .map((d) => ({
                  name: d.name,
                  path: `supabase/migrations/${d.name}`,
                }))
                .sort((a, b) => a.name.localeCompare(b.name));

              res.statusCode = 200;
              res.setHeader("Content-Type", "application/json; charset=utf-8");
              res.end(JSON.stringify({ files }));
              return;
            }

            // Read a specific migration content
            const fileNameRaw = pathname.replace("/__dev/migrations/", "");
            const fileName = decodeURIComponent(fileNameRaw);

            // Prevent path traversal
            if (!fileName || fileName.includes("/") || fileName.includes("\\") || fileName.includes("..")) {
              res.statusCode = 400;
              res.setHeader("Content-Type", "text/plain; charset=utf-8");
              res.end("Bad Request");
              return;
            }

            const absoluteFilePath = path.resolve(migrationsDir, fileName);
            if (!absoluteFilePath.startsWith(migrationsDir)) {
              res.statusCode = 403;
              res.setHeader("Content-Type", "text/plain; charset=utf-8");
              res.end("Forbidden");
              return;
            }

            const content = await fs.readFile(absoluteFilePath, "utf8");
            res.statusCode = 200;
            res.setHeader("Content-Type", "text/plain; charset=utf-8");
            res.end(content);
          } catch (err: any) {
            console.error("[dev-migrations-plugin] Error:", err.message);
            res.statusCode = 500;
            res.setHeader("Content-Type", "text/plain; charset=utf-8");
            res.end(`Server Error: ${err.message}`);
          }
        })();
      });
    },
  };
}

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
      react(), 
      mode === "development" && componentTagger(),
      mode === "development" && devMigrationsPlugin(),
    ].filter(Boolean),
    // Remove console.log and debugger in production
    esbuild: {
      drop: mode === 'production' ? ['console', 'debugger'] : [],
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
          manualChunks(id) {
            // Vendor chunks - rarely change, better caching
            if (id.includes('node_modules')) {
              // React ecosystem - split into smaller chunks
              if (id.includes('react-dom/client')) {
                return 'vendor-react-dom-client';
              }
              if (id.includes('react-dom')) {
                return 'vendor-react-dom';
              }
              if (id.includes('react-router-dom')) {
                return 'vendor-router';
              }
              if (id.includes('scheduler')) {
                return 'vendor-scheduler';
              }
              if (id.includes('react-day-picker')) {
                return 'vendor-day-picker';
              }
              if (id.includes('react-hook-form')) {
                return 'vendor-form';
              }
              if (id.includes('react-resizable-panels')) {
                return 'vendor-panels';
              }
              // Keep react core small - don't catch other react-* packages
              if (id.match(/[\\/]node_modules[\\/]react[\\/]/)) {
                return 'vendor-react-core';
              }
              
              // UI libraries - split by category
              if (id.includes('@radix-ui/react-dialog') || id.includes('@radix-ui/react-popover') || id.includes('@radix-ui/react-dropdown') || id.includes('@radix-ui/react-alert-dialog')) {
                return 'vendor-ui-overlays';
              }
              if (id.includes('@radix-ui/react-select') || id.includes('@radix-ui/react-checkbox') || id.includes('@radix-ui/react-radio') || id.includes('@radix-ui/react-switch')) {
                return 'vendor-ui-forms';
              }
              if (id.includes('@radix-ui/react-tabs') || id.includes('@radix-ui/react-accordion') || id.includes('@radix-ui/react-collapsible')) {
                return 'vendor-ui-panels';
              }
              if (id.includes('@radix-ui/react-toast') || id.includes('@radix-ui/react-tooltip') || id.includes('@radix-ui/react-hover-card')) {
                return 'vendor-ui-feedback';
              }
              if (id.includes('@radix-ui/react-menu') || id.includes('@radix-ui/react-context-menu') || id.includes('@radix-ui/react-navigation-menu')) {
                return 'vendor-ui-menus';
              }
              if (id.includes('@radix-ui')) {
                return 'vendor-ui-core';
              }
              
              // Data & forms
              if (id.includes('@tanstack/react-query')) {
                return 'vendor-query';
              }
              if (id.includes('@tanstack/react-table')) {
                return 'vendor-table';
              }
              if (id.includes('@tanstack/react-virtual')) {
                return 'vendor-virtual';
              }
              if (id.includes('@hookform') || id.includes('zod')) {
                return 'vendor-validation';
              }
              
              // Utilities
              if (id.includes('date-fns')) {
                return 'vendor-date-fns';
              }
              if (id.includes('clsx') || id.includes('class-variance-authority') || id.includes('tailwind-merge')) {
                return 'vendor-classnames';
              }
              
              // Supabase - split realtime from core
              if (id.includes('@supabase/realtime')) {
                return 'vendor-supabase-realtime';
              }
              if (id.includes('@supabase/functions')) {
                return 'vendor-supabase-functions';
              }
              if (id.includes('@supabase/storage')) {
                return 'vendor-supabase-storage';
              }
              if (id.includes('@supabase/postgrest')) {
                return 'vendor-supabase-postgrest';
              }
              if (id.includes('@supabase/gotrue')) {
                return 'vendor-supabase-auth';
              }
              if (id.includes('@supabase')) {
                return 'vendor-supabase-core';
              }
              
              // Charts - split d3 from recharts
              if (id.includes('d3-shape') || id.includes('d3-path')) {
                return 'vendor-d3-shapes';
              }
              if (id.includes('d3-scale') || id.includes('d3-interpolate') || id.includes('d3-color')) {
                return 'vendor-d3-scales';
              }
              if (id.includes('d3-')) {
                return 'vendor-d3-core';
              }
              if (id.includes('recharts')) {
                return 'vendor-recharts';
              }
              
              // Heavy document libraries - keep separate for lazy loading
              if (id.includes('xlsx')) {
                return 'lib-xlsx';
              }
              if (id.includes('jspdf-autotable')) {
                return 'lib-jspdf-table';
              }
              if (id.includes('jspdf')) {
                return 'lib-jspdf';
              }
              if (id.includes('html2canvas')) {
                return 'lib-html2canvas';
              }
              if (id.includes('html2pdf')) {
                return 'lib-html2pdf';
              }
              if (id.includes('pdfjs-dist/build/pdf.worker')) {
                return 'lib-pdfjs-worker';
              }
              if (id.includes('pdfjs-dist')) {
                return 'lib-pdfjs';
              }
              if (id.includes('mammoth')) {
                return 'lib-mammoth';
              }
              if (id.includes('dompurify')) {
                return 'lib-dompurify';
              }
              
              // Icons - split by letter range for better distribution
              if (id.includes('lucide-react')) {
                return 'vendor-icons';
              }
              
              // Drag and drop
              if (id.includes('@dnd-kit/core')) {
                return 'vendor-dnd-core';
              }
              if (id.includes('@dnd-kit/sortable')) {
                return 'vendor-dnd-sortable';
              }
              if (id.includes('@dnd-kit')) {
                return 'vendor-dnd-utils';
              }
              
              // Other UI libs
              if (id.includes('cmdk')) {
                return 'vendor-cmdk';
              }
              if (id.includes('embla-carousel')) {
                return 'vendor-carousel';
              }
              if (id.includes('sonner')) {
                return 'vendor-sonner';
              }
              if (id.includes('vaul')) {
                return 'vendor-vaul';
              }
              if (id.includes('next-themes')) {
                return 'vendor-themes';
              }
              if (id.includes('zustand')) {
                return 'vendor-state';
              }
              if (id.includes('input-otp')) {
                return 'vendor-otp';
              }
              
              // Floating UI (used by radix)
              if (id.includes('@floating-ui')) {
                return 'vendor-floating-ui';
              }
              
              // Aria & accessibility
              if (id.includes('aria-') || id.includes('@react-aria')) {
                return 'vendor-aria';
              }
              
              // Animation
              if (id.includes('framer-motion') || id.includes('motion')) {
                return 'vendor-motion';
              }
              
              // Additional heavy libraries - split more granularly
              if (id.includes('lodash')) {
                return 'vendor-lodash';
              }
              if (id.includes('uuid') || id.includes('nanoid')) {
                return 'vendor-ids';
              }
              if (id.includes('immer')) {
                return 'vendor-immer';
              }
              if (id.includes('react-intersection-observer') || id.includes('react-resize')) {
                return 'vendor-observers';
              }
              if (id.includes('react-virtualized') || id.includes('react-window')) {
                return 'vendor-virtualization';
              }
              if (id.includes('react-error-boundary')) {
                return 'vendor-error-boundary';
              }
              if (id.includes('react-dropzone')) {
                return 'vendor-dropzone';
              }
              if (id.includes('react-beautiful-dnd')) {
                return 'vendor-dnd-beautiful';
              }
              if (id.includes('react-icons')) {
                return 'vendor-react-icons';
              }
              if (id.includes('i18n') || id.includes('intl')) {
                return 'vendor-i18n';
              }
              if (id.includes('prop-types')) {
                return 'vendor-prop-types';
              }
              if (id.includes('hoist-non-react-statics')) {
                return 'vendor-hoist';
              }
              
              // Everything else from node_modules
              return 'vendor-misc';
            }
            return undefined;
          },
        },
      },
      // Minification
      minify: 'esbuild',
      // Chunk size warning - these large libs cannot be split further:
      // - lib-xlsx (429KB) - Excel library, used for import/export
      // - lib-jspdf (340KB) - PDF generation
      // - lib-pdfjs (325KB) - PDF viewing
      // - vendor-recharts (298KB) - Charts library
      // - vendor-react-core (788KB) - React core (cannot be reduced)
      chunkSizeWarningLimit: 800,
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
