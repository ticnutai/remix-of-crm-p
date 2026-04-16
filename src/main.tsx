import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Environment validation
const requiredEnvVars = [
  "VITE_SUPABASE_URL",
  "VITE_SUPABASE_PUBLISHABLE_KEY",
] as const;
const missingEnvVars = requiredEnvVars.filter((key) => !import.meta.env[key]);

if (missingEnvVars.length > 0 && import.meta.env.DEV) {
  console.warn(
    `⚠️ Missing environment variables: ${missingEnvVars.join(", ")}\n` +
      "Using fallback values from vite.config.ts",
  );
}

const DEV_CACHE_RESET_KEY = "dev-cache-reset-v1";

async function clearDevelopmentCache() {
  if (!import.meta.env.DEV || !("serviceWorker" in navigator)) {
    return false;
  }

  if (window.sessionStorage.getItem(DEV_CACHE_RESET_KEY) === "done") {
    return false;
  }

  window.sessionStorage.setItem(DEV_CACHE_RESET_KEY, "done");

  const registrations = await navigator.serviceWorker.getRegistrations();
  const hadRegistrations = registrations.length > 0;

  if (hadRegistrations) {
    await Promise.all(
      registrations.map((registration) => registration.unregister()),
    );
  }

  let hadCaches = false;
  if ("caches" in window) {
    const cacheNames = await caches.keys();
    hadCaches = cacheNames.length > 0;
    await Promise.all(cacheNames.map((cacheName) => caches.delete(cacheName)));
  }

  return hadRegistrations || hadCaches;
}

// Register Service Worker for PWA
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    if (import.meta.env.DEV) {
      void clearDevelopmentCache().then((didClearCache) => {
        if (didClearCache) {
          window.location.reload();
        }
      });
      return;
    }

    navigator.serviceWorker
      .register("/sw.js")
      .then((registration) => {
        setInterval(
          () => {
            registration.update();
          },
          60 * 60 * 1000,
        );

        registration.addEventListener("updatefound", () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener("statechange", () => {
              if (
                newWorker.state === "installed" &&
                navigator.serviceWorker.controller
              ) {
                const shouldUpdate = window.confirm(
                  "גרסה חדשה זמינה! לרענן עכשיו?",
                );
                if (shouldUpdate) {
                  newWorker.postMessage({ type: "SKIP_WAITING" });
                  window.location.reload();
                }
              }
            });
          }
        });
      })
      .catch((error) => {
        console.error("SW registration failed:", error);
      });
  });
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
