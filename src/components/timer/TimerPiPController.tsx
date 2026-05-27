// Document Picture-in-Picture controller for the floating timer.
// 3 modes: compact (single-row), full (with client name), mini (icon-only).
// Controls hide by default and fade in on hover.
import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { createPortal } from "react-dom";
import { useTimer } from "@/hooks/useTimer";
import { useClients } from "@/hooks/useClients";
import { Play, Pause, Square, PictureInPicture2, Maximize2, Minimize2, Minus } from "lucide-react";
import { toast } from "sonner";

const AUTO_PIP_KEY = "timer-auto-pip";
const PIP_MODE_KEY = "timer-pip-mode";
const PIP_OPEN_EVENT = "timer:open-pip";
const PIP_TOGGLE_AUTO_EVENT = "timer:toggle-auto-pip";
export const PIP_REQUEST_STOP_EVENT = "timer:request-stop-dialog";

export function requestStopFromPiP() {
  window.dispatchEvent(new CustomEvent(PIP_REQUEST_STOP_EVENT));
}

type PipMode = "compact" | "full" | "mini";

const MODE_SIZES: Record<PipMode, { width: number; height: number }> = {
  full: { width: 280, height: 150 },
  compact: { width: 260, height: 64 },
  mini: { width: 110, height: 110 },
};

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
function getInitialMode(): PipMode {
  if (typeof window === "undefined") return "compact";
  const v = window.localStorage.getItem(PIP_MODE_KEY) as PipMode | null;
  return v && ["compact", "full", "mini"].includes(v) ? v : "compact";
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
  const [mode, setModeState] = useState<PipMode>(getInitialMode);
  const [hovered, setHovered] = useState(false);
  const autoOpenedRef = useRef(false);

  const clientName = timerState.currentEntry?.client_id
    ? clients.find((c) => c.id === timerState.currentEntry?.client_id)?.name
    : null;

  const setMode = useCallback((next: PipMode) => {
    setModeState(next);
    window.localStorage.setItem(PIP_MODE_KEY, next);
    if (pipWindow) {
      const { width, height } = MODE_SIZES[next];
      try {
        pipWindow.resizeTo(width, height);
      } catch {
        /* ignore */
      }
    }
  }, [pipWindow]);

  const cycleMode = useCallback(() => {
    const order: PipMode[] = ["full", "compact", "mini"];
    const next = order[(order.indexOf(mode) + 1) % order.length];
    setMode(next);
  }, [mode, setMode]);

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
      const { width, height } = MODE_SIZES[mode];
      // @ts-expect-error - Document PiP API not yet in lib.dom
      const pip: Window = await window.documentPictureInPicture.requestWindow({ width, height });

      [...document.styleSheets].forEach((sheet) => {
        try {
          const rules = [...sheet.cssRules].map((r) => r.cssText).join("");
          const style = pip.document.createElement("style");
          style.textContent = rules;
          pip.document.head.appendChild(style);
        } catch {
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
      pip.document.body.style.background = "transparent";
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
  }, [pipWindow, mode]);

  useEffect(() => {
    const handler = () => void openPiP();
    window.addEventListener(PIP_OPEN_EVENT, handler);
    return () => window.removeEventListener(PIP_OPEN_EVENT, handler);
  }, [openPiP]);

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

  // Tokens — kept in JS because PiP is in a sibling document.
  const NAVY = "hsl(220, 60%, 13%)";
  const NAVY_DEEP = "hsl(220, 65%, 9%)";
  const GOLD = "hsl(45, 70%, 50%)";
  const GOLD_SOFT = "hsla(45, 70%, 60%, 0.85)";
  const WHITE = "hsl(0, 0%, 100%)";
  const RUNNING_GLOW = "0 0 14px hsla(45,80%,55%,0.55)";

  const timeColor = timerState.isRunning ? GOLD : WHITE;
  const timeText = formatHMS(timerState.elapsed);

  const shell: React.CSSProperties = useMemo(() => ({
    height: "100vh",
    width: "100vw",
    boxSizing: "border-box",
    background: `linear-gradient(135deg, ${NAVY_DEEP}, ${NAVY})`,
    border: `1px solid hsla(45, 70%, 55%, 0.45)`,
    borderRadius: mode === "mini" ? "50%" : 18,
    boxShadow:
      "0 12px 40px -8px hsla(220, 80%, 5%, 0.6), inset 0 1px 0 hsla(0,0%,100%,0.05)",
    overflow: "hidden",
    position: "relative",
    userSelect: "none",
  }), [mode]);

  const iconBtn = (variant: "ghost" | "primary"): React.CSSProperties => ({
    height: 28,
    width: 28,
    borderRadius: 10,
    border: `1px solid hsla(45,70%,55%,${variant === "primary" ? 1 : 0.35})`,
    background:
      variant === "primary"
        ? `linear-gradient(135deg, ${GOLD}, hsl(45, 80%, 42%))`
        : "hsla(0,0%,100%,0.06)",
    color: variant === "primary" ? NAVY : WHITE,
    cursor: timerState.currentEntry ? "pointer" : "not-allowed",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "transform 150ms ease, background 150ms ease",
    padding: 0,
  });

  if (!container) return null;

  // Toolbar (mode switch + controls). Hidden until hover.
  const Toolbar = (
    <div
      style={{
        display: "flex",
        gap: 6,
        alignItems: "center",
        opacity: hovered ? 1 : 0,
        transform: hovered ? "translateY(0)" : "translateY(2px)",
        transition: "opacity 180ms ease, transform 180ms ease",
        pointerEvents: hovered ? "auto" : "none",
      }}
    >
      <button
        onClick={() => (timerState.isRunning ? pauseTimer() : resumeTimer())}
        disabled={!timerState.currentEntry}
        title={timerState.isRunning ? "השהה" : "המשך"}
        style={iconBtn("ghost")}
      >
        {timerState.isRunning ? <Pause size={14} /> : <Play size={14} />}
      </button>
      <button
        onClick={() => void stopTimer()}
        disabled={!timerState.currentEntry}
        title="עצור ושמור"
        style={iconBtn("primary")}
      >
        <Square size={12} fill="currentColor" />
      </button>
      <button
        onClick={cycleMode}
        title="החלף מצב תצוגה"
        style={{ ...iconBtn("ghost"), width: 26, height: 26 }}
      >
        {mode === "full" ? (
          <Minimize2 size={12} />
        ) : mode === "compact" ? (
          <Minus size={12} />
        ) : (
          <Maximize2 size={12} />
        )}
      </button>
    </div>
  );

  // ===== MINI MODE — round badge with time only =====
  if (mode === "mini") {
    return createPortal(
      <div
        dir="rtl"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onDoubleClick={() => setMode("compact")}
        style={{
          ...shell,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
        }}
        title="לחץ פעמיים להגדלה"
      >
        <div
          style={{
            fontFamily: "JetBrains Mono, monospace",
            fontSize: 18,
            fontWeight: 500,
            color: timeColor,
            textShadow: timerState.isRunning ? RUNNING_GLOW : "none",
            letterSpacing: "0.04em",
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {timeText.slice(0, 5)}
        </div>
        <div
          style={{
            position: "absolute",
            bottom: 6,
            fontSize: 9,
            color: GOLD_SOFT,
            fontVariantNumeric: "tabular-nums",
          }}
        >
          :{timeText.slice(6)}
        </div>
        {/* hover overlay: cycle button */}
        <button
          onClick={cycleMode}
          title="הגדל"
          style={{
            position: "absolute",
            top: 4,
            right: 4,
            ...iconBtn("ghost"),
            width: 22,
            height: 22,
            opacity: hovered ? 1 : 0,
            transition: "opacity 180ms ease",
          }}
        >
          <Maximize2 size={10} />
        </button>
      </div>,
      container,
    );
  }

  // ===== COMPACT MODE — single row: time + hover controls =====
  if (mode === "compact") {
    return createPortal(
      <div
        dir="rtl"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          ...shell,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 14px",
          gap: 10,
        }}
      >
        {/* status dot + time */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: timerState.isRunning ? GOLD : "hsla(0,0%,100%,0.3)",
              boxShadow: timerState.isRunning ? RUNNING_GLOW : "none",
              flexShrink: 0,
            }}
          />
          <div
            style={{
              fontFamily: "JetBrains Mono, monospace",
              fontSize: 22,
              fontWeight: 400,
              color: timeColor,
              letterSpacing: "0.06em",
              fontVariantNumeric: "tabular-nums",
              textShadow: timerState.isRunning ? RUNNING_GLOW : "none",
            }}
          >
            {timeText}
          </div>
        </div>
        {Toolbar}
      </div>,
      container,
    );
  }

  // ===== FULL MODE — client name + time + controls =====
  return createPortal(
    <div
      dir="rtl"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        ...shell,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
        padding: "10px 14px",
      }}
    >
      {clientName && (
        <div
          style={{
            fontSize: 11,
            color: GOLD_SOFT,
            maxWidth: "92%",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            letterSpacing: "0.02em",
          }}
        >
          {clientName}
        </div>
      )}
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span
          style={{
            width: 7,
            height: 7,
            borderRadius: "50%",
            background: timerState.isRunning ? GOLD : "hsla(0,0%,100%,0.3)",
            boxShadow: timerState.isRunning ? RUNNING_GLOW : "none",
          }}
        />
        <div
          style={{
            fontFamily: "JetBrains Mono, monospace",
            fontSize: 30,
            fontWeight: 300,
            color: timeColor,
            letterSpacing: "0.08em",
            fontVariantNumeric: "tabular-nums",
            textShadow: timerState.isRunning ? RUNNING_GLOW : "none",
          }}
        >
          {timeText}
        </div>
      </div>
      <div style={{ marginTop: 4 }}>{Toolbar}</div>
    </div>,
    container,
  );
}

export { PictureInPicture2 as PiPIcon };
