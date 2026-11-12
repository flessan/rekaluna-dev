import { useCallback, useEffect, useMemo, useRef, useState, type DragEvent as ReactDragEvent, type PointerEvent as ReactPointerEvent } from "react";
import { Icon } from "../../lib/icons";
import { useStorage } from "../../lib/storage-hooks";
import { storage, uid } from "../../lib/storage";
import { useI18n } from "../../lib/i18n";

type PaperSize = "A4" | "F4" | "Letter" | "Legal";
type Orientation = "portrait" | "landscape";
type Margin = "none" | "small" | "normal" | "large";
type FrameShape = "square" | "rounded" | "circle" | "oval";
type ImageFit = "cover" | "contain";

interface CanvasObject {
  id: string;
  kind: "image" | "frame";
  src: string | null;
  name: string;
  naturalWidth: number;
  naturalHeight: number;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  shape: FrameShape;
  fit: ImageFit;
  zIndex: number;
}

interface DragState {
  id: string;
  pointerId: number;
  mode: "move" | "resize";
  clientX: number;
  clientY: number;
  x: number;
  y: number;
  width: number;
  height: number;
  initialObjects: CanvasObject[];
}

const PAPER_DIMS: Record<PaperSize, { w: number; h: number }> = {
  A4: { w: 210, h: 297 },
  F4: { w: 215, h: 330 },
  Letter: { w: 215.9, h: 279.4 },
  Legal: { w: 215.9, h: 355.6 },
};

const MARGINS: Record<Margin, number> = { none: 0, small: 5, normal: 10, large: 15 };

const PAPER_COLORS = [
  { value: "#FFFFFF", key: "white" },
  { value: "#F3EEE5", key: "warm" },
  { value: "#E7F1FA", key: "sky" },
  { value: "#E7F3E9", key: "mint" },
  { value: "#FCE9E8", key: "blush" },
  { value: "#F0EAF8", key: "lavender" },
  { value: "#DCE3EA", key: "slate" },
  { value: "#27313D", key: "charcoal" },
] as const;

const SHAPE_STYLE: Record<FrameShape, { borderRadius: string; clipPath: string }> = {
  square: { borderRadius: "0", clipPath: "none" },
  rounded: { borderRadius: "14%", clipPath: "inset(0 round 14%)" },
  circle: { borderRadius: "50%", clipPath: "circle(50% at 50% 50%)" },
  oval: { borderRadius: "50%", clipPath: "ellipse(50% 50% at 50% 50%)" },
};

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), Math.max(min, max));
}

export default function QuickPrintPage() {
  const { data, update } = useStorage();
  const { t } = useI18n();
  const prefs = data.settings.print;
  const setPrefs = (patch: Partial<typeof prefs>) =>
    update((d) => ({ ...d, settings: { ...d.settings, print: { ...d.settings.print, ...patch } } }));

  const [objects, setObjects] = useState<CanvasObject[]>([]);
  const objectsRef = useRef<CanvasObject[]>([]);
  const undoStack = useRef<CanvasObject[][]>([]);
  const redoStack = useRef<CanvasObject[][]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [snapEnabled, setSnapEnabled] = useState(true);
  const [precise, setPrecise] = useState(false);
  const [previewScale, setPreviewScale] = useState(1);
  const [zoom, setZoom] = useState(1);
  const [fileTargetId, setFileTargetId] = useState<string | undefined>();
  const [guides, setGuides] = useState<{ x: number | null; y: number | null }>({ x: null, y: null });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const artboardRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<DragState | null>(null);

  const paper = PAPER_DIMS[prefs.paper as PaperSize] ?? PAPER_DIMS.A4;
  const paperWidth = prefs.orientation === "portrait" ? paper.w : paper.h;
  const paperHeight = prefs.orientation === "portrait" ? paper.h : paper.w;
  const margin = MARGINS[prefs.margin as Margin] ?? MARGINS.normal;
  const paperBackground = /^#[\da-f]{6}$/i.test(prefs.background ?? "") ? prefs.background : "#FFFFFF";
  const innerWidth = Math.max(10, paperWidth - margin * 2);
  const innerHeight = Math.max(10, paperHeight - margin * 2);
  const selected = objects.find((item) => item.id === selectedId) ?? null;

  const replaceWithoutHistory = useCallback((next: CanvasObject[]) => {
    objectsRef.current = next;
    setObjects(next);
  }, []);

  const commit = useCallback((nextOrFn: CanvasObject[] | ((current: CanvasObject[]) => CanvasObject[])) => {
    const current = objectsRef.current;
    const next = typeof nextOrFn === "function" ? nextOrFn(current) : nextOrFn;
    if (next === current) return;
    undoStack.current = [...undoStack.current.slice(-39), current];
    redoStack.current = [];
    objectsRef.current = next;
    setObjects(next);
  }, []);

  const undo = useCallback(() => {
    const previous = undoStack.current.pop();
    if (!previous) return;
    redoStack.current = [...redoStack.current.slice(-39), objectsRef.current];
    replaceWithoutHistory(previous);
    setSelectedId(previous.length ? previous[previous.length - 1].id : null);
  }, [replaceWithoutHistory]);

  const redo = useCallback(() => {
    const next = redoStack.current.pop();
    if (!next) return;
    undoStack.current = [...undoStack.current.slice(-39), objectsRef.current];
    replaceWithoutHistory(next);
    setSelectedId(next.length ? next[next.length - 1].id : null);
  }, [replaceWithoutHistory]);

  useEffect(() => {
    const measure = () => {
      const width = previewRef.current?.clientWidth ?? 640;
      const available = Math.max(160, width - 72);
      setPreviewScale(Math.max(0.55, Math.min(2.2, (available / paperWidth) * zoom)));
    };
    measure();
    const observer = typeof ResizeObserver !== "undefined" && previewRef.current
      ? new ResizeObserver(measure)
      : null;
    if (observer && previewRef.current) observer.observe(previewRef.current);
    window.addEventListener("resize", measure);
    return () => {
      observer?.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [paperWidth, zoom]);

  const addFrame = (shape: FrameShape) => {
    const size = shape === "circle" ? 52 : shape === "oval" ? 70 : 62;
    const item: CanvasObject = {
      id: uid(), kind: "frame", src: null, name: t("frame"),
      naturalWidth: 0, naturalHeight: 0,
      x: clamp((paperWidth - size) / 2, margin, paperWidth - margin - size),
      y: clamp((paperHeight - size) / 2, margin, paperHeight - margin - size),
      width: size, height: shape === "oval" ? 44 : size,
      rotation: 0, shape, fit: "cover", zIndex: objectsRef.current.length + 1,
    };
    commit([...objectsRef.current, item]);
    setSelectedId(item.id);
  };

  const addLayout = (count: number) => {
    const columns = prefs.orientation === "landscape" ? Math.min(count, 3) : Math.min(count, 2);
    const rows = Math.ceil(count / columns);
    const gap = 5;
    const cellWidth = (innerWidth - gap * (columns - 1)) / columns;
    const cellHeight = (innerHeight - gap * (rows - 1)) / rows;
    const next = Array.from({ length: count }, (_, index) => {
      const column = index % columns;
      const row = Math.floor(index / columns);
      let x = margin + column * (cellWidth + gap);
      const y = margin + row * (cellHeight + gap);
      if (count === 3 && index === 2 && columns === 2) x = margin + (innerWidth - cellWidth) / 2;
      return {
        id: uid(), kind: "frame" as const, src: null, name: t("frame") + " " + (index + 1),
        naturalWidth: 0, naturalHeight: 0,
        x, y, width: cellWidth, height: cellHeight,
        rotation: 0, shape: "rounded" as FrameShape, fit: "cover" as ImageFit,
        zIndex: objectsRef.current.length + index + 1,
      };
    });
    commit([...objectsRef.current, ...next]);
    setSelectedId(next[0]?.id ?? null);
  };

  const loadFiles = useCallback((files: File[], targetId?: string, dropPoint?: { x: number; y: number }) => {
    const imageFiles = files.filter((file) => file.type.startsWith("image/"));
    if (!imageFiles.length) return;

    imageFiles.forEach((file, index) => {
      const reader = new FileReader();
      reader.onload = () => {
        const src = String(reader.result);
        const image = new Image();
        image.onload = () => {
          const current = objectsRef.current;
          const frameTarget = index === 0 && targetId
            ? current.find((item) => item.id === targetId)
            : undefined;

          if (frameTarget) {
            const filled = current.map((item) => item.id === frameTarget.id
              ? { ...item, src, name: file.name || t("image"), naturalWidth: image.naturalWidth, naturalHeight: image.naturalHeight }
              : item);
            commit(filled);
            setSelectedId(frameTarget.id);
          } else {
            const size = clamp(Math.min(innerWidth * 0.52, innerHeight * 0.36), 28, 90);
            const aspect = image.naturalWidth > 0 && image.naturalHeight > 0
              ? image.naturalWidth / image.naturalHeight
              : 1;
            const width = aspect >= 1 ? size : size * aspect;
            const height = aspect >= 1 ? size / aspect : size;
            const cascade = current.length % 7;
            const pointX = dropPoint ? dropPoint.x - width / 2 : margin + (innerWidth - width) / 2 + cascade * 3;
            const pointY = dropPoint ? dropPoint.y - height / 2 : margin + (innerHeight - height) / 2 + cascade * 3;
            const item: CanvasObject = {
              id: uid(), kind: "image", src, name: file.name || t("image"),
              naturalWidth: image.naturalWidth, naturalHeight: image.naturalHeight,
              x: clamp(pointX + index * 3, 0, paperWidth - width),
              y: clamp(pointY + index * 3, 0, paperHeight - height),
              width, height, rotation: 0, shape: "square",
              fit: "contain", zIndex: current.length + 1,
            };
            commit([...objectsRef.current, item]);
            setSelectedId(item.id);
          }

          storage.addRecent({
            kind: "print",
            label: file.name || "Pasted image",
            meta: image.naturalWidth + "×" + image.naturalHeight,
          });
        };
        image.src = src;
      };
      reader.readAsDataURL(file);
    });
  }, [commit, innerHeight, innerWidth, margin, paperHeight, paperWidth, t]);

  const handlePaste = useCallback((event: ClipboardEvent) => {
    const active = document.activeElement;
    if (active && ["INPUT", "TEXTAREA", "SELECT"].includes(active.tagName)) return;
    const files: File[] = [];
    for (const item of Array.from(event.clipboardData?.items ?? [])) {
      if (item.type.startsWith("image/")) {
        const file = item.getAsFile();
        if (file) files.push(file);
      }
    }
    if (files.length) {
      event.preventDefault();
      loadFiles(files);
    }
  }, [loadFiles]);

  useEffect(() => {
    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, [handlePaste]);

  const snapAxis = (value: number, size: number, axis: "x" | "y", id: string) => {
    const length = axis === "x" ? paperWidth : paperHeight;
    const candidates: Array<{ value: number; guide: number }> = [
      { value: 0, guide: 0 },
      { value: length - size, guide: length },
      { value: (length - size) / 2, guide: length / 2 },
    ];
    for (const other of objectsRef.current) {
      if (other.id === id) continue;
      const start = axis === "x" ? other.x : other.y;
      const extent = axis === "x" ? other.width : other.height;
      candidates.push(
        { value: start, guide: start },
        { value: start + extent - size, guide: start + extent },
        { value: start + (extent - size) / 2, guide: start + extent / 2 },
      );
    }
    let best = value;
    let guide: number | null = null;
    let distance = 2.6;
    for (const candidate of candidates) {
      const delta = Math.abs(candidate.value - value);
      if (delta < distance) {
        best = candidate.value;
        guide = candidate.guide;
        distance = delta;
      }
    }
    return { value: clamp(best, 0, length - size), guide };
  };

  const startDrag = (event: ReactPointerEvent<HTMLDivElement>, item: CanvasObject, mode: "move" | "resize") => {
    event.stopPropagation();
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    setSelectedId(item.id);
    dragRef.current = {
      id: item.id, pointerId: event.pointerId, mode,
      clientX: event.clientX, clientY: event.clientY,
      x: item.x, y: item.y, width: item.width, height: item.height,
      initialObjects: objectsRef.current,
    };
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    const dx = (event.clientX - drag.clientX) / previewScale;
    const dy = (event.clientY - drag.clientY) / previewScale;
    const current = objectsRef.current;
    const item = current.find((object) => object.id === drag.id);
    if (!item) return;

    if (drag.mode === "resize") {
      const width = clamp(drag.width + dx, 8, paperWidth - item.x);
      const height = clamp(drag.height + dy, 8, paperHeight - item.y);
      replaceWithoutHistory(current.map((object) => object.id === drag.id ? { ...object, width, height } : object));
      setGuides({ x: null, y: null });
      return;
    }

    let x = clamp(drag.x + dx, 0, paperWidth - item.width);
    let y = clamp(drag.y + dy, 0, paperHeight - item.height);
    let guideX: number | null = null;
    let guideY: number | null = null;
    if (snapEnabled) {
      const snappedX = snapAxis(x, item.width, "x", item.id);
      const snappedY = snapAxis(y, item.height, "y", item.id);
      x = snappedX.value;
      y = snappedY.value;
      guideX = snappedX.guide;
      guideY = snappedY.guide;
    }
    replaceWithoutHistory(current.map((object) => object.id === drag.id ? { ...object, x, y } : object));
    setGuides({ x: guideX, y: guideY });
  };

  const handlePointerUp = (event: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    if (JSON.stringify(drag.initialObjects) !== JSON.stringify(objectsRef.current)) {
      undoStack.current = [...undoStack.current.slice(-39), drag.initialObjects];
      redoStack.current = [];
    }
    dragRef.current = null;
    setGuides({ x: null, y: null });
  };

  const updateSelected = (patch: Partial<CanvasObject>) => {
    if (!selectedId) return;
    commit((current) => current.map((item) => item.id === selectedId ? { ...item, ...patch } : item));
  };

  const duplicateSelected = () => {
    if (!selected) return;
    const duplicate = { ...selected, id: uid(), name: selected.name + " (" + t("copySuffix") + ")", x: clamp(selected.x + 8, 0, paperWidth - selected.width), y: clamp(selected.y + 8, 0, paperHeight - selected.height), zIndex: objectsRef.current.length + 1 };
    commit([...objectsRef.current, duplicate]);
    setSelectedId(duplicate.id);
  };

  const deleteSelected = () => {
    if (!selectedId) return;
    commit(objectsRef.current.filter((item) => item.id !== selectedId));
    setSelectedId(null);
  };

  const rotateSelected = () => {
    if (!selected) return;
    updateSelected({ rotation: (selected.rotation + 90) % 360 });
  };

  const alignSelected = () => {
    if (!selected) return;
    updateSelected({
      x: (paperWidth - selected.width) / 2,
      y: (paperHeight - selected.height) / 2,
    });
  };

  const printSheet = useCallback(async () => {
    const source = document.getElementById("print-area");
    if (!source || objectsRef.current.length === 0) return;

    const frame = document.createElement("iframe");
    frame.title = t("printSheet");
    frame.style.cssText = "position:fixed;left:-10000px;top:0;width:1px;height:1px;border:0;opacity:0;pointer-events:none;";
    document.body.appendChild(frame);

    const printWindow = frame.contentWindow;
    const printDocument = frame.contentDocument;
    if (!printWindow || !printDocument) {
      frame.remove();
      return;
    }

    const printRoot = source.cloneNode(true) as HTMLElement;
    printRoot.querySelectorAll(".no-print").forEach((element) => element.remove());
    printRoot.style.position = "relative";
    printRoot.style.display = "block";
    printRoot.style.width = `${paperWidth}mm`;
    printRoot.style.height = `${paperHeight}mm`;
    printRoot.style.margin = "0";
    printRoot.style.transform = "none";
    printRoot.style.transformOrigin = "top left";
    printRoot.style.boxShadow = "none";
    printRoot.style.overflow = "hidden";
    printRoot.style.backgroundColor = paperBackground;

    printRoot.querySelectorAll<HTMLElement>(".canvas-object").forEach((element) => {
      element.style.outline = "none";
      element.style.cursor = "default";
    });

    const printStyles = `
      @page { size: ${paperWidth}mm ${paperHeight}mm; margin: 0; }
      * { box-sizing: border-box; }
      html, body {
        width: ${paperWidth}mm;
        height: ${paperHeight}mm;
        margin: 0 !important;
        padding: 0 !important;
        background: ${paperBackground} !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      body { display: block; overflow: hidden; }
      #print-area {
        position: relative !important;
        display: block !important;
        width: ${paperWidth}mm !important;
        height: ${paperHeight}mm !important;
        margin: 0 !important;
        overflow: hidden !important;
        transform: none !important;
        box-shadow: none !important;
        background: ${paperBackground} !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      #print-area .canvas-object {
        position: absolute !important;
        display: block !important;
        outline: none !important;
        user-select: none !important;
      }
      #print-area .canvas-object > div:first-child {
        position: absolute !important;
        inset: 0 !important;
        overflow: hidden !important;
      }
      #print-area .canvas-object img {
        display: block !important;
        width: 100% !important;
        height: 100% !important;
      }
      #print-area .canvas-frame-placeholder {
        display: block !important;
        width: 100% !important;
        height: 100% !important;
        background: transparent !important;
      }
      #print-area .canvas-frame-placeholder svg,
      #print-area .canvas-frame-hint { display: none !important; }
    `;

    printDocument.open();
    printDocument.write(`<!doctype html><html><head><meta charset="utf-8"><title>${t("printSheet")}</title><style>${printStyles}</style></head><body>${printRoot.outerHTML}</body></html>`);
    printDocument.close();

    try {
      await Promise.all(Array.from(printDocument.images).map((image) => image.decode().catch(() => undefined)));
    } catch {
      // Keep printing even if one browser cannot decode an image promise.
    }

    const cleanup = () => {
      if (frame.isConnected) frame.remove();
    };
    printWindow.addEventListener("afterprint", cleanup, { once: true });
    printWindow.focus();
    printWindow.print();
    window.setTimeout(cleanup, 120000);
  }, [paperBackground, paperHeight, paperWidth, t]);

  useEffect(() => {
    const onPrintRequest = () => { void printSheet(); };
    window.addEventListener("rekaluna:print-sheet", onPrintRequest);
    return () => window.removeEventListener("rekaluna:print-sheet", onPrintRequest);
  }, [printSheet]);

  const changeLayer = (direction: -1 | 1) => {
    if (!selected) return;
    const current = [...objectsRef.current].sort((a, b) => a.zIndex - b.zIndex);
    const index = current.findIndex((item) => item.id === selected.id);
    const nextIndex = clamp(index + direction, 0, current.length - 1);
    if (index === nextIndex) return;
    const swap = current[index];
    current[index] = current[nextIndex];
    current[nextIndex] = swap;
    const next = current.map((item, i) => ({ ...item, zIndex: i + 1 }));
    commit(next);
  };

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target && ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName)) return;
      const modifier = event.ctrlKey || event.metaKey;
      if (modifier && event.key.toLowerCase() === "z") {
        event.preventDefault();
        if (event.shiftKey) redo(); else undo();
        return;
      }
      if (modifier && event.key.toLowerCase() === "y") {
        event.preventDefault();
        redo();
        return;
      }
      if (modifier && event.key.toLowerCase() === "d" && selected) {
        event.preventDefault();
        duplicateSelected();
        return;
      }
      if ((event.key === "Delete" || event.key === "Backspace") && selected) {
        event.preventDefault();
        deleteSelected();
        return;
      }
      if (!selected || !["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(event.key)) return;
      event.preventDefault();
      const step = event.shiftKey ? 10 : event.altKey || precise ? 0.1 : 1;
      const patch: Partial<CanvasObject> = {};
      if (event.key === "ArrowLeft") patch.x = clamp(selected.x - step, 0, paperWidth - selected.width);
      if (event.key === "ArrowRight") patch.x = clamp(selected.x + step, 0, paperWidth - selected.width);
      if (event.key === "ArrowUp") patch.y = clamp(selected.y - step, 0, paperHeight - selected.height);
      if (event.key === "ArrowDown") patch.y = clamp(selected.y + step, 0, paperHeight - selected.height);
      updateSelected(patch);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [deleteSelected, duplicateSelected, paperHeight, paperWidth, precise, redo, selected, undo]);

  const handleDrop = (event: ReactDragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragOver(false);
    const files = Array.from(event.dataTransfer.files ?? []);
    if (!files.length) return;
    const target = (event.target as HTMLElement).closest("[data-object-id]") as HTMLElement | null;
    const targetId = target?.dataset.objectId;
    const rect = artboardRef.current?.getBoundingClientRect();
    const point = rect ? {
      x: (event.clientX - rect.left) / previewScale,
      y: (event.clientY - rect.top) / previewScale,
    } : undefined;
    loadFiles(files, targetId, point);
  };

  const handleClear = () => {
    if (!objectsRef.current.length || !window.confirm(t("confirmClear"))) return;
    commit([]);
    setSelectedId(null);
  };

  const objectCount = objects.length;
  const sortedObjects = useMemo(() => [...objects].sort((a, b) => b.zIndex - a.zIndex), [objects]);

  return (
    <div className="max-w-[1500px] mx-auto">
      <div className="flex flex-wrap items-end justify-between gap-3 mb-5">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{t("qpTitle")}</h1>
          <p className="text-sm text-muted mt-1">{t("qpSubtitle")} <span className="kbd ml-1">Ctrl V</span></p>
        </div>
        <div className="flex flex-wrap gap-2 no-print">
          <button className="btn btn-secondary" onClick={undo} disabled={!undoStack.current.length}><Icon name="undo" /> {t("undo")}</button>
          <button className="btn btn-secondary" onClick={redo} disabled={!redoStack.current.length}><Icon name="rotate-right" /> {t("redo")}</button>
          <button className="btn btn-secondary" onClick={handleClear} disabled={!objectCount}><Icon name="trash" /> {t("clearSheet")}</button>
          <button className="btn btn-primary" onClick={() => void printSheet()} disabled={!objectCount}><Icon name="print" /> {t("printSheet")}</button>
        </div>
      </div>

      <div className="grid xl:grid-cols-[minmax(0,1fr)_340px] gap-4 items-start">
        <section className="card p-3 md:p-4 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-3 no-print">
            <button className="btn btn-primary" onClick={() => { setFileTargetId(undefined); fileInputRef.current?.click(); }}><Icon name="plus" /> {t("addImages")}</button>
            <div className="flex items-center gap-1.5">
              <span className="label hidden sm:inline">{t("framePresets")}</span>
              {(["square", "rounded", "circle", "oval"] as FrameShape[]).map((shape) => (
                <button key={shape} className="btn btn-secondary !px-2.5" onClick={() => addFrame(shape)} title={t(shape)}>
                  <span className={"w-4 h-4 border-2 border-current inline-block " + (shape === "circle" || shape === "oval" ? "rounded-full" : shape === "rounded" ? "rounded-md" : "")} />
                  <span className="hidden lg:inline">{t(shape)}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 mb-3 no-print">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="label mr-1">{t("quickLayouts")}</span>
              {[2, 3, 4, 6].map((count) => (
                <button key={count} className="btn btn-secondary !py-1.5 !px-2.5 text-xs" onClick={() => addLayout(count)}>
                  {t(count === 2 ? "twoUp" : count === 3 ? "threeUp" : count === 4 ? "fourUp" : "sixUp")}
                </button>
              ))}
            </div>
            <label className="inline-flex items-center gap-2 text-xs text-muted cursor-pointer">
              <input type="checkbox" checked={snapEnabled} onChange={(event) => setSnapEnabled(event.target.checked)} />
              <span>{t("snapping")}</span>
            </label>
          </div>

          <div
            ref={previewRef}
            className={"relative min-h-[420px] md:min-h-[560px] rounded-xl flex items-center justify-center overflow-auto p-3 md:p-6 transition-snappy " + (dragOver ? "ring-2 ring-[color:var(--brand)]" : "")}
            style={{ background: "color-mix(in srgb, var(--canvas) 88%, var(--ink))" }}
            onDragOver={(event) => { event.preventDefault(); setDragOver(true); }}
            onDragLeave={(event) => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setDragOver(false); }}
            onDrop={handleDrop}
          >
            <div
              ref={artboardRef}
              className="canvas-artboard relative shrink-0"
              style={{
                width: paperWidth * previewScale,
                height: paperHeight * previewScale,
                touchAction: "none",
              }}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerUp}
              onPointerDown={(event) => { if ((event.target as HTMLElement).id === "print-area") setSelectedId(null); }}
            >
              <div
                id="print-area"
                className="relative bg-white"
                style={{
                  width: `${paperWidth}mm`,
                  height: `${paperHeight}mm`,
                  transform: `scale(${previewScale / (96 / 25.4)})`,
                  transformOrigin: "top left",
                  boxShadow: "0 8px 28px rgba(0,0,0,.16)",
                  overflow: "hidden",
                  backgroundColor: paperBackground,
                }}
              >
              <div
                className="absolute pointer-events-none no-print"
                style={{
                  left: `${margin}mm`, top: `${margin}mm`,
                  width: `${innerWidth}mm`, height: `${innerHeight}mm`,
                  border: "1px dashed #b9bec4", opacity: 0.75,
                }}
                aria-label={t("marginGuide")}
              />
              {guides.x !== null && (
                <div className="absolute top-0 bottom-0 pointer-events-none no-print" style={{ left: `${guides.x}mm`, borderLeft: "1px solid #1677d2", zIndex: 1000 }} />
              )}
              {guides.y !== null && (
                <div className="absolute left-0 right-0 pointer-events-none no-print" style={{ top: `${guides.y}mm`, borderTop: "1px solid #1677d2", zIndex: 1000 }} />
              )}

              {objects.length === 0 && (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6 pointer-events-none" style={{ color: "#858b91" }}>
                  <div className="w-12 h-12 rounded-full flex items-center justify-center mb-3" style={{ background: "#f8e9ea", color: "#9C1C26" }}><Icon name="image" size="lg" /></div>
                  <div className="font-semibold text-sm" style={{ color: "#4b5055" }}>{t("emptyTitle")}</div>
                  <p className="text-xs mt-1 max-w-[230px]">{t("emptyHint")}</p>
                </div>
              )}

              {objects.map((item) => {
                const shape = SHAPE_STYLE[item.shape];
                const active = item.id === selectedId;
                return (
                  <div
                    key={item.id}
                    data-object-id={item.id}
                    className="canvas-object absolute select-none"
                    onPointerDown={(event) => startDrag(event, item, "move")}
                    style={{
                      left: `${item.x}mm`, top: `${item.y}mm`,
                      width: `${item.width}mm`, height: `${item.height}mm`,
                      transform: "rotate(" + item.rotation + "deg)",
                      transformOrigin: "center center", zIndex: item.zIndex,
                      cursor: "move", touchAction: "none",
                      outline: active ? "2px solid #9C1C26" : "none",
                      outlineOffset: active ? "2px" : "0",
                    }}
                    title={item.name}
                    onClick={() => setSelectedId(item.id)}
                  >
                    <div className="absolute inset-0 overflow-hidden" style={{ borderRadius: shape.borderRadius, clipPath: shape.clipPath }}>
                      {item.src ? (
                        <img src={item.src} alt={item.name} draggable={false} className="w-full h-full pointer-events-none" style={{ objectFit: item.fit, display: "block" }} />
                      ) : (
                        <div className="canvas-frame-placeholder w-full h-full flex flex-col items-center justify-center text-center p-2" style={{ background: "transparent", border: "1.5px dashed #aeb4bb", color: "#666" }}>
                          <Icon name="image" size="lg" />
                          <span className="canvas-frame-hint text-[10px] font-medium mt-1">{t("dropToFill")}</span>
                        </div>
                      )}
                    </div>
                    {active && (
                      <>
                        <div className="absolute inset-0 pointer-events-none no-print" style={{ border: "1px solid #9C1C26", borderRadius: shape.borderRadius }} />
                        <button
                          type="button"
                          className="absolute -top-2 -left-2 w-5 h-5 rounded-full flex items-center justify-center text-white text-[10px] no-print"
                          style={{ background: "#9C1C26" }}
                          onPointerDown={(event) => event.stopPropagation()}
                          onClick={(event) => { event.stopPropagation(); deleteSelected(); }}
                          aria-label={t("delete")}
                        ><Icon name="xmark" size="2xs" /></button>
                        <div
                          className="absolute -bottom-2 -right-2 w-4 h-4 rounded-sm border-2 border-white no-print"
                          style={{ background: "#9C1C26", cursor: "nwse-resize", touchAction: "none" }}
                          onPointerDown={(event) => startDrag(event, item, "resize")}
                        />
                      </>
                    )}
                  </div>
                );
              })}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 mt-3 text-xs text-muted no-print">
            <span>{objectCount} {t("objectCount")} · {paperWidth} × {paperHeight} mm</span>
            <div className="flex items-center gap-2">
              <span>{t("zoom")}</span>
              <input aria-label={t("zoom")} type="range" min="0.75" max="1.35" step="0.05" value={zoom} onChange={(event) => setZoom(Number(event.target.value))} className="w-24" />
              <span className="num w-10 text-right">{Math.round(zoom * 100)}%</span>
            </div>
          </div>
        </section>

        <aside className="space-y-4 no-print">
          <section className="card p-4 space-y-3">
            <div className="label">{t("paper")}</div>
            <div className="grid grid-cols-4 gap-1.5">
              {(["A4", "F4", "Letter", "Legal"] as PaperSize[]).map((size) => (
                <button key={size} onClick={() => setPrefs({ paper: size })} className={"rounded-lg py-2 text-xs font-semibold border transition-snappy " + (prefs.paper === size ? "bg-[color:var(--brand)] text-white border-[color:var(--brand)]" : "border-[color:var(--line)] hover:bg-[color:var(--canvas)]")}>{size}</button>
              ))}
            </div>
            <div className="label">{t("orientation")}</div>
            <div className="grid grid-cols-2 gap-1.5">
              {(["portrait", "landscape"] as Orientation[]).map((orientation) => (
                <button key={orientation} onClick={() => setPrefs({ orientation })} className={"rounded-lg py-2 text-xs font-semibold border capitalize transition-snappy " + (prefs.orientation === orientation ? "bg-[color:var(--brand)] text-white border-[color:var(--brand)]" : "border-[color:var(--line)] hover:bg-[color:var(--canvas)]")}>
                  <Icon name={orientation === "portrait" ? "mobile" : "image"} className="mr-1" />{t(orientation)}
                </button>
              ))}
            </div>
            <div className="label">{t("margin")}</div>
            <div className="grid grid-cols-4 gap-1.5">
              {(["none", "small", "normal", "large"] as Margin[]).map((value) => (
                <button key={value} onClick={() => setPrefs({ margin: value })} className={"rounded-lg py-2 text-xs font-medium border capitalize transition-snappy " + (prefs.margin === value ? "bg-[color:var(--brand)] text-white border-[color:var(--brand)]" : "border-[color:var(--line)] hover:bg-[color:var(--canvas)]")}>{t(value === "none" ? "noMargin" : value)}</button>
              ))}
            </div>
            <div className="pt-2 border-t space-y-2" style={{ borderColor: "var(--line)" }}>
              <div className="label">{t("paperBackground")}</div>
              <div className="grid grid-cols-4 gap-2">
                {PAPER_COLORS.map((color) => {
                  const active = paperBackground.toUpperCase() === color.value;
                  return (
                    <button
                      key={color.value}
                      type="button"
                      title={t(color.key)}
                      aria-label={t(color.key)}
                      aria-pressed={active}
                      onClick={() => setPrefs({ background: color.value })}
                      className={"h-9 rounded-lg border-2 flex items-center justify-center transition-snappy " + (active ? "ring-2 ring-[color:var(--brand)] ring-offset-1" : "hover:scale-[1.03]")}
                      style={{ backgroundColor: color.value, borderColor: active ? "var(--brand)" : "var(--line)" }}
                    >
                      {active && <Icon name="check" className={color.key === "charcoal" ? "text-white" : "text-[color:var(--brand)]"} size="sm" />}
                    </button>
                  );
                })}
              </div>
              <label className="flex items-center justify-between gap-3 text-xs text-muted">
                <span>{t("customColor")}</span>
                <input
                  type="color"
                  aria-label={t("chooseBackground")}
                  value={paperBackground}
                  onChange={(event) => setPrefs({ background: event.target.value.toUpperCase() })}
                  className="w-10 h-8 rounded-md border cursor-pointer bg-transparent"
                  style={{ borderColor: "var(--line)" }}
                />
              </label>
              <p className="text-[11px] text-muted leading-relaxed">{t("colorPrintNote")}</p>
            </div>
          </section>

          <section className="card p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="label">{t("selectedObject")}</div>
              {selected && <span className="text-[11px] text-muted truncate max-w-[130px]">{selected.name}</span>}
            </div>
            {!selected ? (
              <p className="text-sm text-muted">{t("noSelection")}</p>
            ) : (
              <>
                <div className="flex flex-wrap gap-1.5">
                  <button className="btn btn-secondary !px-2.5 !py-1.5 text-xs" onClick={duplicateSelected}><Icon name="copy" />{t("duplicate")}</button>
                  <button className="btn btn-secondary !px-2.5 !py-1.5 text-xs" onClick={rotateSelected}><Icon name="rotate" />90°</button>
                  <button className="btn btn-secondary !px-2.5 !py-1.5 text-xs" onClick={alignSelected}>{t("centerPage")}</button>
                  <button className="btn btn-danger !px-2.5 !py-1.5 text-xs" onClick={deleteSelected}><Icon name="trash" />{t("delete")}</button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <NumberField label={t("xPosition")} value={selected.x} step={precise ? 0.1 : 1} onChange={(value) => updateSelected({ x: clamp(value, 0, paperWidth - selected.width) })} />
                  <NumberField label={t("yPosition")} value={selected.y} step={precise ? 0.1 : 1} onChange={(value) => updateSelected({ y: clamp(value, 0, paperHeight - selected.height) })} />
                  <NumberField label={t("width")} value={selected.width} step={precise ? 0.1 : 1} onChange={(value) => updateSelected({ width: clamp(value, 8, paperWidth - selected.x) })} />
                  <NumberField label={t("height")} value={selected.height} step={precise ? 0.1 : 1} onChange={(value) => updateSelected({ height: clamp(value, 8, paperHeight - selected.y) })} />
                  <NumberField label={t("rotation")} value={selected.rotation} step={1} suffix="°" onChange={(value) => updateSelected({ rotation: ((value % 360) + 360) % 360 })} />
                </div>
                <div>
                  <div className="label mb-1.5">{t("framePresets")}</div>
                  <div className="grid grid-cols-4 gap-1">
                    {(["square", "rounded", "circle", "oval"] as FrameShape[]).map((shape) => (
                      <button key={shape} onClick={() => updateSelected({ shape })} className={"border rounded-lg py-2 text-[10px] capitalize " + (selected.shape === shape ? "border-[color:var(--brand)] text-[color:var(--brand)] bg-[rgba(156,28,38,.06)]" : "border-[color:var(--line)]")}>{t(shape)}</button>
                    ))}
                  </div>
                </div>
                {selected.src && (
                  <div>
                    <div className="label mb-1.5">{t("imageFit")}</div>
                    <div className="grid grid-cols-2 gap-1.5">
                      {(["contain", "cover"] as ImageFit[]).map((fit) => (
                        <button key={fit} onClick={() => updateSelected({ fit })} className={"btn btn-secondary " + (selected.fit === fit ? "!border-[color:var(--brand)] !text-[color:var(--brand)]" : "")}>{t(fit)}</button>
                      ))}
                    </div>
                    <button className="btn btn-secondary w-full mt-2" onClick={() => { setFileTargetId(selected.id); fileInputRef.current?.click(); }}><Icon name="image" />{t("replaceImage")}</button>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-2">
                  <button className="btn btn-secondary" onClick={() => changeLayer(1)}><Icon name="chevron-up" />{t("bringForward")}</button>
                  <button className="btn btn-secondary" onClick={() => changeLayer(-1)}><Icon name="chevron-down" />{t("sendBackward")}</button>
                </div>
              </>
            )}
          </section>

          <section className="card p-4 space-y-2">
            <div className="flex items-center justify-between">
              <div className="label">{t("layers")} · {objectCount}</div>
              <label className="inline-flex gap-1.5 items-center text-[11px] text-muted">
                <input type="checkbox" checked={precise} onChange={(event) => setPrecise(event.target.checked)} />
                {t("precise")}
              </label>
            </div>
            <p className="text-[11px] text-muted">{t("moveHint")}</p>
            {sortedObjects.length === 0 ? <p className="text-sm text-muted py-2">{t("noObjects")}</p> : (
              <div className="space-y-1 max-h-56 overflow-auto">
                {sortedObjects.map((item) => (
                  <button key={item.id} onClick={() => setSelectedId(item.id)} className={"w-full text-left flex items-center gap-2 rounded-lg px-2.5 py-2 text-xs " + (selectedId === item.id ? "bg-[rgba(156,28,38,.09)] text-[color:var(--brand)]" : "hover:bg-[color:var(--canvas)]")}>
                    <Icon name={item.src ? "image" : "frame"} />
                    <span className="flex-1 truncate">{item.name || (item.src ? t("image") : t("frame"))}</span>
                    <span className="text-[10px] opacity-65">{Math.round(item.width)}×{Math.round(item.height)}</span>
                  </button>
                ))}
              </div>
            )}
          </section>

          <div className="card p-3 text-[11px] text-muted leading-relaxed text-center">
            <Icon name="shield" className="mr-1" />{t("localPrivacy")}
          </div>
        </aside>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(event) => {
          const files = Array.from(event.target.files ?? []);
          if (files.length) loadFiles(files, fileTargetId);
          setFileTargetId(undefined);
          event.target.value = "";
        }}
      />

      
    </div>
  );
}

function NumberField({ label, value, step, suffix, onChange }: {
  label: string;
  value: number;
  step: number;
  suffix?: string;
  onChange: (value: number) => void;
}) {
  return (
    <label className="block min-w-0">
      <span className="label block mb-1">{label}</span>
      <div className="relative">
        <input
          type="number"
          min="0"
          step={step}
          value={Number(value.toFixed(2))}
          onChange={(event) => { const raw = event.target.value; if (raw !== "" && Number.isFinite(Number(raw))) onChange(Number(raw)); }}
          className="input num !pr-7"
        />
        {suffix && <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted">{suffix}</span>}
        {!suffix && <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted">mm</span>}
      </div>
    </label>
  );
}
