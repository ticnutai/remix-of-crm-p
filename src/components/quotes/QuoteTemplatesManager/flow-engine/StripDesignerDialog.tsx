import React, { useEffect, useMemo, useRef, useState } from "react";
import { Rnd } from "react-rnd";
import {
  ExternalLink,
  ImagePlus,
  Library,
  Lock,
  Move,
  RotateCcw,
  Save,
  SlidersHorizontal,
  Trash2,
  Unlock,
  Upload,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
  deleteCloudBrandAsset,
  deleteLocalBrandAsset,
  listBrandAssets,
  makeBrandAsset,
  saveCloudBrandAsset,
  saveLocalBrandAsset,
  type FlowBrandAsset,
} from "./brandAssetLibrary";

export type StripPosition = "header" | "footer";

export interface FlowStripDesignState {
  version: 1;
  canvas: {
    width: number;
    height: number;
    backgroundColor: string;
    backgroundImageUrl?: string;
    backgroundFit: "cover" | "contain" | "stretch";
  };
  logo: {
    url?: string;
    x: number;
    y: number;
    width: number;
    height: number;
    rotation: number;
    opacity: number;
    borderRadius: number;
    lockAspect: boolean;
  };
}

interface StripDesignerDialogProps {
  open: boolean;
  position: StripPosition;
  designSettings?: any;
  onOpenChange: (open: boolean) => void;
  onApply: (payload: {
    position: StripPosition;
    dataUrl: string;
    state: FlowStripDesignState;
    logoSourceUrl?: string;
  }) => void;
}

const DEFAULT_CANVAS_WIDTH = 1200;
const DEFAULT_HEADER_HEIGHT = 150;
const DEFAULT_FOOTER_HEIGHT = 90;
const VECTOR_EDITOR_URL = "/vector-logo-strip-editor.html?host=flow-v2-strip-designer&v=2";

function numberValue(value: unknown, fallback: number, min: number, max: number) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return fallback;
  return Math.max(min, Math.min(max, Math.round(numeric)));
}

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(typeof reader.result === "string" ? reader.result : "");
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function loadImage(src?: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    if (!src) {
      reject(new Error("Missing image source"));
      return;
    }
    const img = new Image();
    if (!src.startsWith("data:")) img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function colorDistance(a: [number, number, number], b: [number, number, number]) {
  const dr = a[0] - b[0];
  const dg = a[1] - b[1];
  const db = a[2] - b[2];
  return Math.sqrt(dr * dr + dg * dg + db * db);
}

function sampleCornerColor(data: Uint8ClampedArray, width: number, height: number): [number, number, number] {
  const sample = Math.max(4, Math.min(18, Math.floor(Math.min(width, height) * 0.08)));
  const points: Array<[number, number]> = [];

  for (let y = 0; y < sample; y += 1) {
    for (let x = 0; x < sample; x += 1) {
      points.push([x, y], [width - 1 - x, y], [x, height - 1 - y], [width - 1 - x, height - 1 - y]);
    }
  }

  let r = 0;
  let g = 0;
  let b = 0;
  let count = 0;

  points.forEach(([x, y]) => {
    const index = (y * width + x) * 4;
    if (data[index + 3] < 16) return;
    r += data[index];
    g += data[index + 1];
    b += data[index + 2];
    count += 1;
  });

  if (!count) return [255, 255, 255];
  return [Math.round(r / count), Math.round(g / count), Math.round(b / count)];
}

async function removeSimilarBackground(src: string) {
  const image = await loadImage(src);
  const canvas = document.createElement("canvas");
  canvas.width = image.naturalWidth || image.width;
  canvas.height = image.naturalHeight || image.height;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) throw new Error("Canvas is unavailable");

  ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;
  const sampledBg = sampleCornerColor(data, canvas.width, canvas.height);
  const bgBrightness = (sampledBg[0] + sampledBg[1] + sampledBg[2]) / 3;
  const hardThreshold = bgBrightness > 210 ? 42 : 34;
  const softThreshold = bgBrightness > 210 ? 112 : 82;

  for (let i = 0; i < data.length; i += 4) {
    const alpha = data[i + 3];
    if (alpha === 0) continue;

    const pixel: [number, number, number] = [data[i], data[i + 1], data[i + 2]];
    const distance = colorDistance(pixel, sampledBg);
    const max = Math.max(pixel[0], pixel[1], pixel[2]);
    const min = Math.min(pixel[0], pixel[1], pixel[2]);
    const nearWhite = max > 238 && min > 224 && max - min < 32;

    if (distance <= hardThreshold || nearWhite) {
      data[i + 3] = 0;
    } else if (distance < softThreshold) {
      const keep = (distance - hardThreshold) / (softThreshold - hardThreshold);
      data[i + 3] = Math.round(alpha * Math.max(0, Math.min(1, keep)));
    }
  }

  ctx.putImageData(imageData, 0, 0);
  return canvas.toDataURL("image/png");
}

function getCurrentStripUrl(position: StripPosition, settings?: any) {
  if (position === "header") {
    return settings?.headerStripUrl || settings?.header_strip_url || "";
  }
  return settings?.footerStripUrl || settings?.footer_strip_url || "";
}

function getCurrentHeight(position: StripPosition, settings?: any) {
  return numberValue(
    position === "header" ? settings?.headerStripHeight : settings?.footerStripHeight,
    position === "header" ? DEFAULT_HEADER_HEIGHT : DEFAULT_FOOTER_HEIGHT,
    24,
    520,
  );
}

function getStoredDesign(position: StripPosition, settings?: any): FlowStripDesignState | null {
  const value =
    position === "header"
      ? settings?.headerStripDesign || settings?.header_strip_design
      : settings?.footerStripDesign || settings?.footer_strip_design;
  if (!value || value.version !== 1 || !value.canvas || !value.logo) return null;
  return {
    version: 1,
    canvas: {
      width: numberValue(value.canvas.width, DEFAULT_CANVAS_WIDTH, 320, 2400),
      height: numberValue(value.canvas.height, getCurrentHeight(position, settings), 24, 520),
      backgroundColor: value.canvas.backgroundColor || settings?.stripBgColor || "#ffffff",
      backgroundImageUrl: value.canvas.backgroundImageUrl || undefined,
      backgroundFit: value.canvas.backgroundFit || "cover",
    },
    logo: {
      url: value.logo.url || undefined,
      x: numberValue(value.logo.x, 0, -2400, 2400),
      y: numberValue(value.logo.y, 0, -520, 520),
      width: numberValue(value.logo.width, DEFAULT_CANVAS_WIDTH, 8, 2400),
      height: numberValue(value.logo.height, getCurrentHeight(position, settings), 8, 520),
      rotation: numberValue(value.logo.rotation, 0, -180, 180),
      opacity: Math.max(0, Math.min(1, Number(value.logo.opacity) || 1)),
      borderRadius: numberValue(value.logo.borderRadius, 0, 0, 240),
      lockAspect: Boolean(value.logo.lockAspect),
    },
  };
}

function buildInitialState(position: StripPosition, settings?: any): FlowStripDesignState {
  const stored = getStoredDesign(position, settings);
  if (stored) return stored;

  const height = getCurrentHeight(position, settings);
  const url = getCurrentStripUrl(position, settings);
  return {
    version: 1,
    canvas: {
      width: DEFAULT_CANVAS_WIDTH,
      height,
      backgroundColor: settings?.stripBgColor || "#ffffff",
      backgroundImageUrl: url || undefined,
      backgroundFit: url ? "stretch" : "cover",
    },
    logo: {
      url: undefined,
      x: 0,
      y: 0,
      width: 360,
      height: Math.min(120, Math.max(56, height - 24)),
      rotation: 0,
      opacity: 1,
      borderRadius: 0,
      lockAspect: false,
    },
  };
}

function drawRoundedRect(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number) {
  const r = Math.max(0, Math.min(radius, width / 2, height / 2));
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + width - r, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + r);
  ctx.lineTo(x + width, y + height - r);
  ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
  ctx.lineTo(x + r, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function fitRect(mode: FlowStripDesignState["canvas"]["backgroundFit"], sourceW: number, sourceH: number, targetW: number, targetH: number) {
  if (mode === "stretch") return { x: 0, y: 0, width: targetW, height: targetH };
  const ratio =
    mode === "contain"
      ? Math.min(targetW / sourceW, targetH / sourceH)
      : Math.max(targetW / sourceW, targetH / sourceH);
  const width = sourceW * ratio;
  const height = sourceH * ratio;
  return {
    x: (targetW - width) / 2,
    y: (targetH - height) / 2,
    width,
    height,
  };
}

async function renderStripToDataUrl(state: FlowStripDesignState) {
  const canvas = document.createElement("canvas");
  canvas.width = state.canvas.width;
  canvas.height = state.canvas.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas is unavailable");

  if (state.canvas.backgroundColor && state.canvas.backgroundColor !== "transparent") {
    ctx.fillStyle = state.canvas.backgroundColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  if (state.canvas.backgroundImageUrl) {
    const bg = await loadImage(state.canvas.backgroundImageUrl);
    const box = fitRect(state.canvas.backgroundFit, bg.width, bg.height, canvas.width, canvas.height);
    ctx.drawImage(bg, box.x, box.y, box.width, box.height);
  }

  if (state.logo.url) {
    const logo = await loadImage(state.logo.url);
    const centerX = state.logo.x + state.logo.width / 2;
    const centerY = state.logo.y + state.logo.height / 2;
    ctx.save();
    ctx.globalAlpha = state.logo.opacity;
    ctx.translate(centerX, centerY);
    ctx.rotate((state.logo.rotation * Math.PI) / 180);
    drawRoundedRect(
      ctx,
      -state.logo.width / 2,
      -state.logo.height / 2,
      state.logo.width,
      state.logo.height,
      state.logo.borderRadius,
    );
    ctx.clip();
    ctx.drawImage(logo, -state.logo.width / 2, -state.logo.height / 2, state.logo.width, state.logo.height);
    ctx.restore();
  }

  return canvas.toDataURL("image/png");
}

function clampLogoToCanvas(state: FlowStripDesignState): FlowStripDesignState {
  return {
    ...state,
    logo: {
      ...state.logo,
      x: Math.max(-state.logo.width, Math.min(state.canvas.width, state.logo.x)),
      y: Math.max(-state.logo.height, Math.min(state.canvas.height, state.logo.y)),
      width: Math.max(8, Math.min(state.logo.width, state.canvas.width * 2)),
      height: Math.max(8, Math.min(state.logo.height, state.canvas.height * 2)),
    },
  };
}

function defaultLogoLayer(canvas: FlowStripDesignState["canvas"]): FlowStripDesignState["logo"] {
  return {
    url: undefined,
    x: Math.round((canvas.width - 360) / 2),
    y: Math.round((canvas.height - Math.min(120, Math.max(56, canvas.height - 24))) / 2),
    width: 360,
    height: Math.min(120, Math.max(56, canvas.height - 24)),
    rotation: 0,
    opacity: 1,
    borderRadius: 0,
    lockAspect: false,
  };
}

function logoCoversCanvas(state: FlowStripDesignState, currentStripUrl?: string) {
  if (!state.logo.url) return false;
  const sameSource = currentStripUrl && state.logo.url === currentStripUrl;
  const coversWidth = state.logo.width >= state.canvas.width * 0.92;
  const coversHeight = state.logo.height >= state.canvas.height * 0.88;
  const startsAtTop = Math.abs(state.logo.x) <= 4 && Math.abs(state.logo.y) <= 4;
  return Boolean(sameSource && coversWidth && coversHeight && startsAtTop);
}

function logoLooksLikeFullStripLayer(state: FlowStripDesignState) {
  if (!state.logo.url || state.canvas.backgroundImageUrl) return false;
  if (Math.abs(state.logo.rotation) > 0.5) return false;

  const coversMostWidth = state.logo.width >= state.canvas.width * 0.48;
  const coversMostHeight = state.logo.height >= state.canvas.height * 0.62;
  const startsNearLeft = state.logo.x <= state.canvas.width * 0.12;
  const extendsPastMiddle = state.logo.x + state.logo.width >= state.canvas.width * 0.42;

  return coversMostWidth && coversMostHeight && startsNearLeft && extendsPastMiddle;
}

function promoteStripLikeLogoToBackground(state: FlowStripDesignState) {
  if (!logoLooksLikeFullStripLayer(state)) return { state, promoted: false };

  return {
    promoted: true,
    state: {
      ...state,
      canvas: {
        ...state.canvas,
        backgroundImageUrl: state.logo.url,
        backgroundFit: "stretch" as const,
      },
      logo: defaultLogoLayer(state.canvas),
    },
  };
}

function vectorPayloadToDataUrl(payload: { dataUrl?: string; svgXml?: string }) {
  if (typeof payload.dataUrl === "string" && payload.dataUrl.startsWith("data:image/svg+xml")) {
    return payload.dataUrl;
  }
  if (typeof payload.svgXml === "string" && payload.svgXml.trim().startsWith("<svg")) {
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(payload.svgXml)}`;
  }
  return "";
}

export default function StripDesignerDialog({
  open,
  position,
  designSettings,
  onOpenChange,
  onApply,
}: StripDesignerDialogProps) {
  const [state, setState] = useState<FlowStripDesignState>(() => buildInitialState(position, designSettings));
  const [logoSourceUrl, setLogoSourceUrl] = useState<string | undefined>(() => getStoredDesign(position, designSettings)?.logo.url);
  const [renderingTarget, setRenderingTarget] = useState<StripPosition | null>(null);
  const [processingAction, setProcessingAction] = useState<"logo-bg" | "canvas-bg" | null>(null);
  const [showVectorEditor, setShowVectorEditor] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [brandAssets, setBrandAssets] = useState<FlowBrandAsset[]>([]);
  const [brandLibraryLoading, setBrandLibraryLoading] = useState(false);
  const [brandAssetName, setBrandAssetName] = useState("");
  const [saveLogoToLibrary, setSaveLogoToLibrary] = useState(true);
  const [saveStripToLibrary, setSaveStripToLibrary] = useState(true);
  const [applyLogoFromLibrary, setApplyLogoFromLibrary] = useState(true);
  const [applyStripFromLibrary, setApplyStripFromLibrary] = useState(true);
  const [brandActionId, setBrandActionId] = useState<string | null>(null);
  const logoInputRef = useRef<HTMLInputElement | null>(null);
  const backgroundInputRef = useRef<HTMLInputElement | null>(null);
  const vectorFrameRef = useRef<HTMLIFrameElement | null>(null);

  useEffect(() => {
    if (!open) return;
    setError(null);
    const stored = getStoredDesign(position, designSettings);
    const normalized = promoteStripLikeLogoToBackground(stored || buildInitialState(position, designSettings));
    setState(normalized.state);
    setLogoSourceUrl(normalized.promoted ? undefined : stored?.logo.url);
    setBrandAssetName(position === "header" ? "סטריפ עליון" : "סטריפ תחתון");
    setShowVectorEditor(false);
  }, [open, position, designSettings]);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setBrandLibraryLoading(true);
    listBrandAssets()
      .then((assets) => {
        if (!cancelled) setBrandAssets(assets);
      })
      .finally(() => {
        if (!cancelled) setBrandLibraryLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const handleVectorEditorApply = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      const payload = event.data as {
        type?: string;
        dataUrl?: string;
        svgXml?: string;
      };

      if (!payload || payload.type !== "flow-v2-strip:apply") return;
      const incomingStrip = vectorPayloadToDataUrl(payload);
      if (!incomingStrip) return;

      setError(null);
      setState((prev) =>
        clampLogoToCanvas({
          ...prev,
          canvas: {
            ...prev.canvas,
            backgroundImageUrl: incomingStrip,
            backgroundFit: "stretch",
          },
          logo: {
            ...prev.logo,
            url: undefined,
            x: Math.round((prev.canvas.width - 360) / 2),
            y: Math.round((prev.canvas.height - Math.min(120, Math.max(56, prev.canvas.height - 24))) / 2),
            width: 360,
            height: Math.min(120, Math.max(56, prev.canvas.height - 24)),
            rotation: 0,
            opacity: 1,
          },
        }),
      );
      setLogoSourceUrl(undefined);
      setShowVectorEditor(false);
    };

    window.addEventListener("message", handleVectorEditorApply);
    return () => window.removeEventListener("message", handleVectorEditorApply);
  }, [open]);

  const previewWidth = Math.min(860, state.canvas.width);
  const previewScale = previewWidth / state.canvas.width;
  const previewHeight = Math.max(36, Math.round(state.canvas.height * previewScale));
  const title = position === "header" ? "עיצוב סטריפ עליון" : "עיצוב סטריפ תחתון";
  const colorValue = state.canvas.backgroundColor === "transparent" ? "#ffffff" : state.canvas.backgroundColor;

  const sendCurrentSourceToVectorEditor = () => {
    const source = state.logo.url || state.canvas.backgroundImageUrl || getCurrentStripUrl(position, designSettings);
    const frame = vectorFrameRef.current?.contentWindow;
    if (!frame || !source) return;

    frame.postMessage(
      {
        type: "vector-logo-strip:load-source",
        source,
        sourceKind: state.logo.url ? "logo" : "strip",
        refOpacity: 35,
      },
      window.location.origin,
    );
  };

  const updateCanvas = (patch: Partial<FlowStripDesignState["canvas"]>) => {
    setState((prev) => clampLogoToCanvas({ ...prev, canvas: { ...prev.canvas, ...patch } }));
  };

  const updateLogo = (patch: Partial<FlowStripDesignState["logo"]>) => {
    setState((prev) => clampLogoToCanvas({ ...prev, logo: { ...prev.logo, ...patch } }));
  };

  const setLogoFromFile = async (file?: File | null) => {
    if (!file) return;
    try {
      setError(null);
      const dataUrl = await readFileAsDataUrl(file);
      const img = await loadImage(dataUrl);
      const ratio = Math.min(state.canvas.width * 0.58 / img.width, state.canvas.height * 0.76 / img.height, 1.2);
      const width = Math.max(24, Math.round(img.width * ratio));
      const height = Math.max(24, Math.round(img.height * ratio));
      updateLogo({
        url: dataUrl,
        width,
        height,
        x: Math.round((state.canvas.width - width) / 2),
        y: Math.round((state.canvas.height - height) / 2),
        lockAspect: true,
        opacity: 1,
      });
      setLogoSourceUrl(dataUrl);
    } catch {
      setError("לא ניתן לטעון את הלוגו. נסה תמונת PNG/JPG אחרת.");
    }
  };

  const setLogoFromSource = async (source?: string) => {
    if (!source) return;
    try {
      setError(null);
      const img = await loadImage(source);
      const ratio = Math.min(state.canvas.width * 0.42 / img.width, state.canvas.height * 0.64 / img.height, 1.15);
      const width = Math.max(24, Math.round(img.width * ratio));
      const height = Math.max(24, Math.round(img.height * ratio));
      updateLogo({
        url: source,
        width,
        height,
        x: Math.round((state.canvas.width - width) / 2),
        y: Math.round((state.canvas.height - height) / 2),
        lockAspect: true,
        opacity: 1,
        rotation: 0,
      });
      setLogoSourceUrl(source);
    } catch {
      setError("לא ניתן לטעון את הלוגו מהספרייה.");
    }
  };

  const setBackgroundFromFile = async (file?: File | null) => {
    if (!file) return;
    try {
      setError(null);
      const dataUrl = await readFileAsDataUrl(file);
      await loadImage(dataUrl);
      updateCanvas({ backgroundImageUrl: dataUrl, backgroundFit: "stretch" });

      const currentStripUrl = getCurrentStripUrl(position, designSettings);
      if (logoCoversCanvas(state, currentStripUrl)) {
        updateLogo({
          url: undefined,
          x: Math.round((state.canvas.width - 360) / 2),
          y: Math.round((state.canvas.height - Math.min(120, Math.max(56, state.canvas.height - 24))) / 2),
          width: 360,
          height: Math.min(120, Math.max(56, state.canvas.height - 24)),
        });
        setLogoSourceUrl(undefined);
      }
    } catch {
      setError("לא ניתן לטעון את תמונת הרקע. נסה קובץ תמונה אחר.");
    }
  };

  const removeLogoBackground = async () => {
    if (!state.logo.url) return;
    setProcessingAction("logo-bg");
    setError(null);
    try {
      const cleaned = await removeSimilarBackground(state.logo.url);
      updateLogo({ url: cleaned });
      setLogoSourceUrl(cleaned);
    } catch {
      setError("ניקוי הרקע נכשל. נסה תמונה חדה יותר או PNG.");
    } finally {
      setProcessingAction(null);
    }
  };

  const removeCanvasBackground = async () => {
    if (!state.canvas.backgroundImageUrl) return;
    setProcessingAction("canvas-bg");
    setError(null);
    try {
      const cleaned = await removeSimilarBackground(state.canvas.backgroundImageUrl);
      updateCanvas({ backgroundImageUrl: cleaned });
    } catch {
      setError("ניקוי רקע התמונה נכשל. נסה תמונה חדה יותר או PNG.");
    } finally {
      setProcessingAction(null);
    }
  };

  const applyPreset = (preset: "contain" | "cover" | "stretch" | "center") => {
    if (preset === "stretch") {
      updateLogo({ x: 0, y: 0, width: state.canvas.width, height: state.canvas.height, rotation: 0 });
      return;
    }
    if (preset === "center") {
      updateLogo({
        x: Math.round((state.canvas.width - state.logo.width) / 2),
        y: Math.round((state.canvas.height - state.logo.height) / 2),
      });
      return;
    }
    const ratio =
      preset === "contain"
        ? Math.min(state.canvas.width / state.logo.width, state.canvas.height / state.logo.height)
        : Math.max(state.canvas.width / state.logo.width, state.canvas.height / state.logo.height);
    const width = Math.round(state.logo.width * ratio);
    const height = Math.round(state.logo.height * ratio);
    updateLogo({
      x: Math.round((state.canvas.width - width) / 2),
      y: Math.round((state.canvas.height - height) / 2),
      width,
      height,
      rotation: 0,
    });
  };

  const promoteLogoToBackground = () => {
    if (!state.logo.url) return;
    setState((prev) => ({
      ...prev,
      canvas: {
        ...prev.canvas,
        backgroundImageUrl: prev.logo.url,
        backgroundFit: "stretch",
      },
      logo: defaultLogoLayer(prev.canvas),
    }));
    setLogoSourceUrl(undefined);
  };

  const resetDesign = () => {
    setError(null);
    setState(buildInitialState(position, designSettings));
  };

  const refreshBrandLibrary = async () => {
    setBrandLibraryLoading(true);
    try {
      setBrandAssets(await listBrandAssets());
    } finally {
      setBrandLibraryLoading(false);
    }
  };

  const handleSaveBrandAsset = async () => {
    const shouldSaveLogo = saveLogoToLibrary && Boolean(state.logo.url || logoSourceUrl);
    const shouldSaveStrip = saveStripToLibrary;
    if (!shouldSaveLogo && !shouldSaveStrip) {
      setError("בחר לשמור לוגו, סטריפ או שניהם.");
      return;
    }

    setBrandActionId("save");
    setError(null);
    try {
      const normalized = promoteStripLikeLogoToBackground(state);
      const exportState = normalized.state;
      const stripDataUrl = shouldSaveStrip ? await renderStripToDataUrl(exportState) : undefined;
      const logoDataUrl = shouldSaveLogo ? exportState.logo.url || logoSourceUrl : undefined;
      const asset = makeBrandAsset({
        name: brandAssetName,
        kind: shouldSaveLogo && shouldSaveStrip ? "bundle" : shouldSaveLogo ? "logo" : "strip",
        logoDataUrl,
        stripDataUrl,
        designState: shouldSaveStrip ? exportState : undefined,
      });

      let savedLocally = false;
      try {
        await saveLocalBrandAsset(asset);
        savedLocally = true;
        setBrandAssets((prev) => [asset, ...prev.filter((item) => item.id !== asset.id)]);
      } catch (e: any) {
        console.warn("[brand library] local save failed", e);
      }

      try {
        const synced = await saveCloudBrandAsset(asset);
        setBrandAssets((prev) => [synced, ...prev.filter((item) => item.id !== asset.id)]);
        setError(null);
      } catch (e: any) {
        const msg = e?.message || String(e);
        console.error("[brand library] cloud save failed", e);
        if (savedLocally) {
          setError(`נשמר מקומית. סנכרון לענן נכשל: ${msg}`);
        } else {
          setError(`שמירה נכשלה: ${msg}`);
        }
      }
    } catch (e: any) {
      setError(`שמירת הנכס לספרייה נכשלה: ${e?.message || e}`);
    } finally {
      setBrandActionId(null);
    }
  };

  const handleApplyBrandAsset = async (asset: FlowBrandAsset) => {
    const logoSource = asset.logoDataUrl || asset.logoUrl;
    const stripSource = asset.stripDataUrl || asset.stripUrl;
    if (!applyLogoFromLibrary && !applyStripFromLibrary) {
      setError("בחר האם להכניס לוגו, סטריפ או שניהם.");
      return;
    }

    setBrandActionId(asset.id);
    setError(null);
    try {
      if (applyStripFromLibrary && stripSource) {
        setState((prev) =>
          clampLogoToCanvas({
            ...(asset.designState || prev),
            canvas: {
              ...(asset.designState?.canvas || prev.canvas),
              width: prev.canvas.width,
              height: prev.canvas.height,
              backgroundImageUrl: stripSource,
              backgroundFit: "stretch",
            },
            logo: applyLogoFromLibrary && logoSource ? prev.logo : defaultLogoLayer(prev.canvas),
          }),
        );
        setLogoSourceUrl(undefined);
      }

      if (applyLogoFromLibrary && logoSource) {
        await setLogoFromSource(logoSource);
      }
    } finally {
      setBrandActionId(null);
    }
  };

  const handleDeleteBrandAsset = async (asset: FlowBrandAsset) => {
    setBrandActionId(asset.id);
    try {
      await deleteLocalBrandAsset(asset.id);
      await deleteCloudBrandAsset(asset.id);
      setBrandAssets((prev) => prev.filter((item) => item.id !== asset.id));
    } finally {
      setBrandActionId(null);
    }
  };

  const handleApply = async (targetPosition: StripPosition) => {
    setRenderingTarget(targetPosition);
    setError(null);
    try {
      const normalized = promoteStripLikeLogoToBackground(state);
      const exportState = normalized.state;
      const dataUrl = await renderStripToDataUrl(exportState);
      onApply({ position: targetPosition, dataUrl, state: exportState, logoSourceUrl: normalized.promoted ? undefined : logoSourceUrl });
      onOpenChange(false);
    } catch {
      setError("לא ניתן לייצא את הסטריפ. נסה להעלות את התמונה מחדש מהמחשב.");
    } finally {
      setRenderingTarget(null);
    }
  };

  const presetButtons = useMemo(
    () => [
      { value: "contain" as const, label: "התאם" },
      { value: "cover" as const, label: "מלא" },
      { value: "stretch" as const, label: "מתח" },
      { value: "center" as const, label: "מרכז" },
    ],
    [],
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[1120px]" contentClassName="p-0">
        <DialogHeader className="border-b px-5 py-4">
          <DialogTitle className="flex items-center gap-2">
            <SlidersHorizontal className="h-5 w-5 text-primary" />
            {title}
          </DialogTitle>
        </DialogHeader>

        <div className="grid min-h-[560px] grid-cols-[minmax(0,1fr)_310px] gap-0 overflow-hidden">
          <div className="flex items-center justify-center overflow-auto bg-slate-100 p-5">
            <div
              className="relative overflow-hidden border border-primary/30 bg-white shadow-xl"
              style={{
                width: previewWidth,
                height: previewHeight,
                backgroundColor: state.canvas.backgroundColor === "transparent" ? undefined : state.canvas.backgroundColor,
                backgroundImage:
                  state.canvas.backgroundColor === "transparent"
                    ? "linear-gradient(45deg,#e2e8f0 25%,transparent 25%),linear-gradient(-45deg,#e2e8f0 25%,transparent 25%),linear-gradient(45deg,transparent 75%,#e2e8f0 75%),linear-gradient(-45deg,transparent 75%,#e2e8f0 75%)"
                    : undefined,
                backgroundSize: "20px 20px",
                backgroundPosition: "0 0,0 10px,10px -10px,-10px 0px",
              }}
            >
              {state.canvas.backgroundImageUrl && (
                <img
                  src={state.canvas.backgroundImageUrl}
                  alt=""
                  className="absolute inset-0 h-full w-full select-none"
                  style={{
                    objectFit: state.canvas.backgroundFit === "stretch" ? "fill" : state.canvas.backgroundFit,
                  }}
                  draggable={false}
                />
              )}

              {state.logo.url ? (
                <Rnd
                  bounds="parent"
                  position={{
                    x: Math.round(state.logo.x * previewScale),
                    y: Math.round(state.logo.y * previewScale),
                  }}
                  size={{
                    width: Math.round(state.logo.width * previewScale),
                    height: Math.round(state.logo.height * previewScale),
                  }}
                  lockAspectRatio={state.logo.lockAspect}
                  minWidth={12}
                  minHeight={12}
                  onDragStop={(_, data) => {
                    updateLogo({
                      x: Math.round(data.x / previewScale),
                      y: Math.round(data.y / previewScale),
                    });
                  }}
                  onResizeStop={(_, __, ref, ___, pos) => {
                    updateLogo({
                      x: Math.round(pos.x / previewScale),
                      y: Math.round(pos.y / previewScale),
                      width: Math.round(ref.offsetWidth / previewScale),
                      height: Math.round(ref.offsetHeight / previewScale),
                    });
                  }}
                  className="group border border-primary/70 bg-primary/5"
                >
                  <div className="relative h-full w-full overflow-hidden" style={{ borderRadius: state.logo.borderRadius * previewScale }}>
                    <img
                      src={state.logo.url}
                      alt=""
                      className="h-full w-full select-none"
                      style={{
                        opacity: state.logo.opacity,
                        transform: `rotate(${state.logo.rotation}deg)`,
                        transformOrigin: "center",
                        objectFit: "fill",
                      }}
                      draggable={false}
                    />
                    <div className="pointer-events-none absolute inset-0 opacity-0 ring-2 ring-primary transition-opacity group-hover:opacity-100" />
                    <Move className="pointer-events-none absolute right-1 top-1 h-4 w-4 rounded bg-background/80 p-0.5 text-primary opacity-0 shadow group-hover:opacity-100" />
                  </div>
                </Rnd>
              ) : state.canvas.backgroundImageUrl ? null : (
                <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
                  <ImagePlus className="h-10 w-10 opacity-40" />
                </div>
              )}
            </div>
          </div>

          <div className="overflow-y-auto border-r bg-background p-4">
            <input
              ref={logoInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(event) => {
                void setLogoFromFile(event.target.files?.[0]);
                event.currentTarget.value = "";
              }}
            />
            <input
              ref={backgroundInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(event) => {
                void setBackgroundFromFile(event.target.files?.[0]);
                event.currentTarget.value = "";
              }}
            />

            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-2">
                <Button type="button" variant="secondary" size="sm" onClick={() => logoInputRef.current?.click()}>
                  <Upload className="ml-1 h-4 w-4" />
                  לוגו
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={() => backgroundInputRef.current?.click()}>
                  <ImagePlus className="ml-1 h-4 w-4" />
                  רקע
                </Button>
              </div>
              <Button
                type="button"
                variant={showVectorEditor ? "default" : "outline"}
                size="sm"
                className="w-full"
                onClick={() => setShowVectorEditor((prev) => !prev)}
              >
                <SlidersHorizontal className="ml-1 h-4 w-4" />
                {showVectorEditor ? "סגור עורך וקטורי" : "עורך וקטורי מקצועי"}
              </Button>

              <section className="space-y-3 rounded-md border bg-muted/20 p-3">
                <div className="flex items-center justify-between gap-2">
                  <Label className="flex items-center gap-1 text-xs font-semibold">
                    <Library className="h-4 w-4" />
                    ספריית מותג
                  </Label>
                  <Button type="button" variant="ghost" size="sm" className="h-7 px-2 text-[11px]" onClick={refreshBrandLibrary}>
                    רענן
                  </Button>
                </div>

                <Input
                  value={brandAssetName}
                  onChange={(event) => setBrandAssetName(event.target.value)}
                  className="h-8 text-xs"
                  placeholder="שם לשמירה"
                />

                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <label className="flex items-center justify-between rounded border bg-background px-2 py-1">
                    <span>שמור לוגו</span>
                    <input
                      type="checkbox"
                      checked={saveLogoToLibrary}
                      onChange={(event) => setSaveLogoToLibrary(event.target.checked)}
                    />
                  </label>
                  <label className="flex items-center justify-between rounded border bg-background px-2 py-1">
                    <span>שמור סטריפ</span>
                    <input
                      type="checkbox"
                      checked={saveStripToLibrary}
                      onChange={(event) => setSaveStripToLibrary(event.target.checked)}
                    />
                  </label>
                </div>

                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  className="w-full"
                  disabled={brandActionId === "save"}
                  onClick={handleSaveBrandAsset}
                >
                  <Save className="ml-1 h-4 w-4" />
                  {brandActionId === "save" ? "שומר..." : "שמור לספרייה"}
                </Button>

                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <label className="flex items-center justify-between rounded border bg-background px-2 py-1">
                    <span>הכנס לוגו</span>
                    <input
                      type="checkbox"
                      checked={applyLogoFromLibrary}
                      onChange={(event) => setApplyLogoFromLibrary(event.target.checked)}
                    />
                  </label>
                  <label className="flex items-center justify-between rounded border bg-background px-2 py-1">
                    <span>הכנס סטריפ</span>
                    <input
                      type="checkbox"
                      checked={applyStripFromLibrary}
                      onChange={(event) => setApplyStripFromLibrary(event.target.checked)}
                    />
                  </label>
                </div>

                <div className="max-h-52 space-y-2 overflow-y-auto pr-1">
                  {brandLibraryLoading ? (
                    <p className="text-center text-xs text-muted-foreground">טוען ספרייה...</p>
                  ) : brandAssets.length === 0 ? (
                    <p className="text-center text-xs text-muted-foreground">עדיין אין נכסים שמורים</p>
                  ) : (
                    brandAssets.map((asset) => {
                      const previewUrl = asset.stripDataUrl || asset.stripUrl || asset.logoDataUrl || asset.logoUrl;
                      const sourceLabel = asset.source === "synced" ? "מקומי + ענן" : asset.source === "cloud" ? "ענן" : "מקומי";
                      const kindLabel = asset.kind === "bundle" ? "לוגו + סטריפ" : asset.kind === "strip" ? "סטריפ" : "לוגו";
                      return (
                        <div key={asset.id} className="rounded border bg-background p-2">
                          <div className="flex items-center gap-2">
                            <div className="h-10 w-16 shrink-0 overflow-hidden rounded border bg-muted">
                              {previewUrl ? (
                                <img src={previewUrl} alt="" className="h-full w-full object-contain" draggable={false} />
                              ) : null}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-xs font-medium">{asset.name}</p>
                              <p className="truncate text-[10px] text-muted-foreground">
                                {kindLabel} · {sourceLabel}
                              </p>
                            </div>
                          </div>
                          <div className="mt-2 grid grid-cols-[1fr_auto] gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="h-7 text-[11px]"
                              disabled={brandActionId === asset.id}
                              onClick={() => void handleApplyBrandAsset(asset)}
                            >
                              {brandActionId === asset.id ? "מחיל..." : "החל לבמה"}
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-7 w-8 px-0"
                              disabled={brandActionId === asset.id}
                              onClick={() => void handleDeleteBrandAsset(asset)}
                              title="מחק מהספרייה"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </section>

              <section className="space-y-3">
                <Label className="text-xs font-semibold">מידות סטריפ</Label>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label className="text-[11px] text-muted-foreground">רוחב</Label>
                    <Input
                      type="number"
                      min={320}
                      max={2400}
                      value={state.canvas.width}
                      onChange={(event) => updateCanvas({ width: numberValue(event.target.value, DEFAULT_CANVAS_WIDTH, 320, 2400) })}
                      dir="ltr"
                      className="h-8 text-center"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[11px] text-muted-foreground">גובה</Label>
                    <Input
                      type="number"
                      min={24}
                      max={520}
                      value={state.canvas.height}
                      onChange={(event) => updateCanvas({ height: numberValue(event.target.value, getCurrentHeight(position, designSettings), 24, 520) })}
                      dir="ltr"
                      className="h-8 text-center"
                    />
                  </div>
                </div>
              </section>

              <section className="space-y-3">
                <Label className="text-xs font-semibold">רקע</Label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={colorValue}
                    onChange={(event) => updateCanvas({ backgroundColor: event.target.value })}
                    className="h-8 w-10 cursor-pointer rounded border bg-background p-1"
                  />
                  <Button type="button" variant="outline" size="sm" onClick={() => updateCanvas({ backgroundColor: "transparent" })}>
                    שקוף
                  </Button>
                  {state.canvas.backgroundImageUrl && (
                    <Button type="button" variant="ghost" size="sm" onClick={() => updateCanvas({ backgroundImageUrl: undefined })}>
                      <X className="ml-1 h-4 w-4" />
                      נקה
                    </Button>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Button type="button" variant="outline" size="sm" onClick={() => backgroundInputRef.current?.click()}>
                    החלף תמונת רקע
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={!state.canvas.backgroundImageUrl || processingAction !== null}
                    onClick={removeCanvasBackground}
                  >
                    {processingAction === "canvas-bg" ? "מנקה..." : "הסר רקע בהיר"}
                  </Button>
                </div>
                {state.canvas.backgroundImageUrl && (
                  <select
                    className="h-8 w-full rounded border bg-background px-2 text-xs"
                    value={state.canvas.backgroundFit}
                    onChange={(event) =>
                      updateCanvas({ backgroundFit: event.target.value as FlowStripDesignState["canvas"]["backgroundFit"] })
                    }
                  >
                    <option value="cover">רקע ממלא</option>
                    <option value="contain">רקע מותאם</option>
                    <option value="stretch">רקע מתוח</option>
                  </select>
                )}
              </section>

              <section className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <Label className="text-xs font-semibold">לוגו</Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2"
                    onClick={() => updateLogo({ lockAspect: !state.logo.lockAspect })}
                  >
                    {state.logo.lockAspect ? <Lock className="ml-1 h-3.5 w-3.5" /> : <Unlock className="ml-1 h-3.5 w-3.5" />}
                    יחס
                  </Button>
                </div>
                <div className="grid grid-cols-4 gap-1">
                  {presetButtons.map((preset) => (
                    <Button
                      key={preset.value}
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-7 px-1 text-[11px]"
                      disabled={!state.logo.url}
                      onClick={() => applyPreset(preset.value)}
                    >
                      {preset.label}
                    </Button>
                  ))}
                </div>
                {state.logo.url && (
                  <Button type="button" variant="outline" size="sm" className="w-full" onClick={promoteLogoToBackground}>
                    פרוס כרקע מלא
                  </Button>
                )}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-full"
                  disabled={!state.logo.url || processingAction !== null}
                  onClick={removeLogoBackground}
                >
                  {processingAction === "logo-bg" ? "מנקה..." : "הסר רקע בהיר מהלוגו"}
                </Button>
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    type="number"
                    value={state.logo.width}
                    onChange={(event) => updateLogo({ width: numberValue(event.target.value, state.logo.width, 8, state.canvas.width * 2) })}
                    dir="ltr"
                    className="h-8 text-center"
                    title="רוחב לוגו"
                  />
                  <Input
                    type="number"
                    value={state.logo.height}
                    onChange={(event) => updateLogo({ height: numberValue(event.target.value, state.logo.height, 8, state.canvas.height * 2) })}
                    dir="ltr"
                    className="h-8 text-center"
                    title="גובה לוגו"
                  />
                  <Input
                    type="number"
                    value={state.logo.x}
                    onChange={(event) => updateLogo({ x: numberValue(event.target.value, state.logo.x, -state.canvas.width, state.canvas.width) })}
                    dir="ltr"
                    className="h-8 text-center"
                    title="מיקום X"
                  />
                  <Input
                    type="number"
                    value={state.logo.y}
                    onChange={(event) => updateLogo({ y: numberValue(event.target.value, state.logo.y, -state.canvas.height, state.canvas.height) })}
                    dir="ltr"
                    className="h-8 text-center"
                    title="מיקום Y"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-[11px] text-muted-foreground">סיבוב: {state.logo.rotation}°</Label>
                  <Slider value={[state.logo.rotation]} min={-180} max={180} step={1} onValueChange={([value]) => updateLogo({ rotation: value })} />
                </div>
                <div className="space-y-2">
                  <Label className="text-[11px] text-muted-foreground">שקיפות: {Math.round(state.logo.opacity * 100)}%</Label>
                  <Slider value={[Math.round(state.logo.opacity * 100)]} min={0} max={100} step={1} onValueChange={([value]) => updateLogo({ opacity: value / 100 })} />
                </div>
                <div className="space-y-2">
                  <Label className="text-[11px] text-muted-foreground">עיגול פינות: {state.logo.borderRadius}px</Label>
                  <Slider value={[state.logo.borderRadius]} min={0} max={160} step={1} onValueChange={([value]) => updateLogo({ borderRadius: value })} />
                </div>
              </section>

              {error && <p className="rounded border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">{error}</p>}
            </div>
          </div>
        </div>

        {showVectorEditor && (
          <section className="border-t bg-slate-50 p-3">
            <div className="mb-2 flex items-center justify-between gap-2">
              <div>
                <Label className="text-sm font-semibold">עורך וקטורי לסטריפ</Label>
                <p className="text-xs text-muted-foreground">
                  ערוך SVG, חלץ מתמונה, צבע שכבות ולחץ “החל ב-Flow” כדי להחזיר את הסטריפ לכאן.
                </p>
              </div>
              <Button type="button" variant="outline" size="sm" asChild>
                <a href={VECTOR_EDITOR_URL} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="ml-1 h-4 w-4" />
                  פתח בנפרד
                </a>
              </Button>
            </div>
            <iframe
              ref={vectorFrameRef}
              title="Flow V2 Vector Strip Editor"
              src={VECTOR_EDITOR_URL}
              className="h-[560px] w-full rounded-md border bg-white"
              onLoad={sendCurrentSourceToVectorEditor}
            />
          </section>
        )}

        <DialogFooter className="border-t px-5 py-3">
          <Button
            type="button"
            onClick={() => handleApply("header")}
            disabled={Boolean(renderingTarget)}
            variant={position === "header" ? "default" : "outline"}
          >
            <Save className="ml-1 h-4 w-4" />
            {renderingTarget === "header" ? "שומר..." : "החל על סטריפ עליון"}
          </Button>
          <Button
            type="button"
            onClick={() => handleApply("footer")}
            disabled={Boolean(renderingTarget)}
            variant={position === "footer" ? "default" : "outline"}
          >
            <Save className="ml-1 h-4 w-4" />
            {renderingTarget === "footer" ? "שומר..." : "החל על סטריפ תחתון"}
          </Button>
          <Button type="button" variant="outline" onClick={resetDesign}>
            <RotateCcw className="ml-1 h-4 w-4" />
            אפס
          </Button>
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
            סגור
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
