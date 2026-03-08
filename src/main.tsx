import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

// Minimal test to debug blank page
console.log("🔥 main.tsx executing");

const rootEl = document.getElementById("root");
console.log("🔥 root element:", rootEl);

if (rootEl) {
  try {
    console.log("🔥 About to import App...");
    import("./App.tsx").then((mod) => {
      console.log("🔥 App imported successfully");
      const App = mod.default;
      createRoot(rootEl).render(
        <StrictMode>
          <App />
        </StrictMode>
      );
      console.log("🔥 render() called");
    }).catch((err) => {
      console.error("🔥 Failed to import App:", err);
      rootEl.innerHTML = `<pre style="color:red;padding:20px;">Failed to load App:\n${err.message}\n${err.stack}</pre>`;
    });
  } catch (err: any) {
    console.error("🔥 Sync error:", err);
    rootEl.innerHTML = `<pre style="color:red;padding:20px;">Sync error:\n${err.message}</pre>`;
  }
} else {
  console.error("🔥 No #root element found!");
}
