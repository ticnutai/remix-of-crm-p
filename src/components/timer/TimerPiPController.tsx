// Document Picture-in-Picture controller for the floating timer.
// Opens a small always-on-top window (Chrome/Edge/Brave 116+) that floats
// above all desktop windows, mirroring the timer state and controls.
import { useEffect, useRef, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { useTimer } from "@/hooks/useTimer";
import { useClients } from "@/hooks/useClients";
import { Play, Pause, Square, PictureInPicture2 } from "lucide-react";
import { toast } from "sonner";

const AUTO_PIP_KEY = "timer-auto-pip";
const PIP_OPEN_EVENT = "timer:open-pip";
const PIP_TOGGLE_AUTO_EVENT = "timer:toggle-auto-pip";

// Public helpers consumed by the FloatingTimer header buttons.
export function isDocumentPiPSupported() {
  return typeof window !== "undefined" && "documentPictureInPicture" in window;
}
export function requestOpenTimerPiP() {
  window.dispatchEvent(new CustomEvent(PIP_OPEN_EVENT));
}
export function getAutoPiPEnabled() {
  if (typeof window === "undefined") return true;
  const v = window.localStorage.getItem(AUTO_PIP_KEY);
  return v === null ? true : v === "true";
}
export function setAutoPiPEnabled(enabled: boolean) {
  window.localStorage.setItem(AUTO_PIP_KEY, String(enabled));
  window.dispatchEvent(new CustomEvent(PIP_TOGGLE_AUTO_EVENT, { detail: enabled }));
}

function formatHMS(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

export function TimerPiPController() {
  const { timerState, pauseTimer, resumeTimer, stopTimer } = useTimer();
  const { clients } = useClients();
  const [pipWindow, setPipWindow] = useState<Window | null>(null);
  const [container, setContainer] = useState<HTMLDivElement | null>(null);
  const autoOpenedRef = useRef(false);

  const clientName = timerState.currentEntry?.client_id
    ? clients.find((c) => c.id === timerState.currentEntry?.client_id)?.name
    : null;

  const openPiP = useCallback(async () => {
    if (!isDocumentPiPSupported()) {
      toast.error("הדפדפן לא תומך בחלון צף מעל כל החלונות. נסה Chrome / Edge / Brave 116+");
      return;
    }
    if (pipWindow) {
      pipWindow.focus();
      return;
    }
    try {
      // @ts-expect-error - Document PiP API not yet in lib.dom
      const pip: Window = await window.documentPictureInPicture.requestWindow({
        width: 280,
        height: 160,
      });

      // Copy stylesheets so Tailwind / app theme renders inside the PiP window.
      [...document.styleSheets].forEach((sheet) => {
        try {
          const rules = [...sheet.cssRules].map((r) => r.cssText).join("");
          const style = pip.document.createElement("style");
          style.textContent = rules;
          pip.document.head.appendChild(style);
        } catch {
          // Cross-origin sheet → re-link instead.
          if (sheet.href) {
            const link = pip.document.createElement("link");
            link.rel = "stylesheet";
            link.href = sheet.href;
            pip.document.head.appendChild(link);
          }
        }
      });

      pip.document.documentElement.dir = "rtl";
      pip.document.documentElement.lang = "he";
      pip.document.body.style.margin = "0";
      pip.document.body.style.background = "hsl(220, 60%, 12%)";
      pip.document.body.style.color = "hsl(0, 0%, 100%)";
      pip.document.body.style.fontFamily = "Heebo, sans-serif";
      pip.document.title = "טיימר tenarch";

      const root = pip.document.createElement("div");
      root.id = "pip-root";
      pip.document.body.appendChild(root);

      pip.addEventListener("pagehide", () => {
        setPipWindow(null);
        setContainer(null);
        autoOpenedRef.current = false;
      });

      setPipWindow(pip);
      setContainer(root);
    } catch (e) {
      console.error("PiP open failed", e);
      toast.error("פתיחת חלון צף נכשלה");
    }
  }, [pipWindow]);

  // Listen to external requests to open PiP.
  useEffect(() => {
    const handler = () => void openPiP();
    window.addEventListener(PIP_OPEN_EVENT, handler);
    return () => window.removeEventListener(PIP_OPEN_EVENT, handler);
  }, [openPiP]);

  // Auto-open when timer starts (if user enabled it).
  useEffect(() => {
    if (!timerState.isRunning) {
      autoOpenedRef.current = false;
      return;
    }
    if (autoOpenedRef.current || pipWindow) return;
    if (!getAutoPiPEnabled()) return;
    if (!isDocumentPiPSupported()) return;
    autoOpenedRef.current = true;
    void openPiP();
  }, [timerState.isRunning, pipWindow, openPiP]);

  if (!container) return null;

  return createPortal(
    <div
      dir="rtl"
      style={{
        height: "100vh",
        width: "100vw",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 12,
        padding: 12,
        background:
          "linear-gradient(135deg, hsl(220,60%,15%), hsl(220,60%,20%))",
        border: "2px solid hsl(45,80%,50%)",
        boxSizing: "border-box",
        userSelect: "none",
      }}
    >
      {clientName && (
        <div
          style={{
            fontSize: 12,
            color: "hsl(45,80%,70%)",
            maxWidth: "90%",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {clientName}
        </div>
      )}
      <div
        style={{
          fontSize: 36,
          fontFamily: "JetBrains Mono, monospace",
          letterSpacing: "0.1em",
          fontWeight: 300,
          color: timerState.isRunning
            ? "hsl(45,85%,55%)"
            : "hsl(0,0%,100%)",
          textShadow: timerState.isRunning
            ? "0 0 12px hsla(45,85%,55%,0.6)"
            : "none",
        }}
      >
        {formatHMS(timerState.elapsed)}
      </div>
      <div style={{ display: "flex", gap: 10 }}>
        <button
          onClick={() =>
            timerState.isRunning ? pauseTimer() : resumeTimer()
          }
          disabled={!timerState.currentEntry}
          title={timerState.isRunning ? "השהה" : "המשך"}
          style={{
            height: 40,
            width: 40,
            borderRadius: 12,
            border: "2px solid hsl(45,80%,55%)",
            background: timerState.isRunning
              ? "hsla(0,0%,100%,0.15)"
              : "hsl(0,0%,100%)",
            color: timerState.isRunning ? "hsl(0,0%,100%)" : "hsl(45,80%,40%)",
            cursor: timerState.currentEntry ? "pointer" : "not-allowed",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {timerState.isRunning ? (
            <Pause size={18} />
          ) : (
            <Play size={18} />
          )}
        </button>
        <button
          onClick={() => void stopTimer()}
          disabled={!timerState.currentEntry}
          title="עצור ושמור"
          style={{
            height: 40,
            width: 40,
            borderRadius: 12,
            border: "2px solid hsl(45,80%,55%)",
            background:
              "linear-gradient(135deg, hsl(45,80%,50%), hsl(45,90%,45%))",
            color: "hsl(220,60%,15%)",
            cursor: timerState.currentEntry ? "pointer" : "not-allowed",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Square size={16} fill="currentColor" />
        </button>
      </div>
    </div>,
    container,
  );
}

export { PictureInPicture2 as PiPIcon };
