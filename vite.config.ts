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
              if (id.includes('react-dom') || id.includes('react-router-dom')) {
                return 'vendor-react';
              }
              if (id.includes('react') && !id.includes('react-')) {
                return 'vendor-react';
              }
              if (id.includes('@radix-ui')) {
                return 'vendor-ui';
              }
              if (id.includes('@tanstack/react-query')) {
                return 'vendor-query';
              }
              if (id.includes('@tanstack/react-table')) {
                return 'vendor-table';
              }
              if (id.includes('date-fns')) {
                return 'vendor-utils';
              }
              if (id.includes('@supabase')) {
                return 'vendor-supabase';
              }
              if (id.includes('recharts') || id.includes('d3-')) {
                return 'vendor-charts';
              }
              if (id.includes('xlsx')) {
                return 'xlsx';
              }
              if (id.includes('jspdf')) {
                return 'jspdf';
              }
              if (id.includes('html2canvas')) {
                return 'html2canvas';
              }
              if (id.includes('dompurify')) {
                return 'dompurify';
              }
              if (id.includes('pdfjs-dist')) {
                return 'pdfjs';
              }
              if (id.includes('mammoth')) {
                return 'mammoth';
              }
              if (id.includes('lucide-react')) {
                return 'icons';
              }
              if (id.includes('@dnd-kit')) {
                return 'dnd-kit';
              }
            }
            return undefined;
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
