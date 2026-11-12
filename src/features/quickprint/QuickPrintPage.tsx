import { useCallback, useEffect, useMemo, useRef, useState, type DragEvent as ReactDragEvent, type PointerEvent as ReactPointerEvent } from "react";
import { createPortal } from "react-dom";
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
  cropScale: number;
  cropX: number;
  cropY: number;
  zIndex: number;
}

interface DragState {
  id: string;
  pointerId: number;
  mode: "move" | "resize" | "crop" | "rotate";
  clientX: number;
  clientY: number;
  x: number;
  y: number;
  width: number;
  height: number;
  cropX: number;
  cropY: number;
  rotation: number;
  startAngle: number;
  selectedIds: string[];
  initialObjects: CanvasObject[];
  resizeHandle?: "nw" | "n" | "ne" | "e" | "se" | "s" | "sw" | "w";
}

interface MarqueeState {
  pointerId: number;
  startX: number;
  startY: number;
  additive: boolean;
}

type ToolPanelTab = "media" | "layouts" | "frames";
type InspectorTab = "page" | "position" | "layers";

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
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [toolPanelTab, setToolPanelTab] = useState<ToolPanelTab>("media");
  const [inspectorTab, setInspectorTab] = useState<InspectorTab>("page");
  const [selectionRect, setSelectionRect] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const [layoutShape, setLayoutShape] = useState<FrameShape>("square");
  const [cropMode, setCropMode] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; objectId: string | null } | null>(null);
  const [contextMenuPosition, setContextMenuPosition] = useState<{ left: number; top: number } | null>(null);
  const contextMenuRef = useRef<HTMLDivElement>(null);
  const [dropTargetId, setDropTargetId] = useState<string | null>(null);
  const clipboardRef = useRef<CanvasObject[]>([]);
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
  const marqueeRef = useRef<MarqueeState | null>(null);

  const paper = PAPER_DIMS[prefs.paper as PaperSize] ?? PAPER_DIMS.A4;
  // Print media remains portrait for consistent printer output. The orientation
  // control is a content-rotation mode, not a physical page-orientation switch.
  const paperWidth = paper.w;
  const paperHeight = paper.h;
  const defaultObjectRotation = prefs.orientation === "landscape" ? 90 : 0;
  const margin = MARGINS[prefs.margin as Margin] ?? MARGINS.normal;
  const paperBackground = /^#[\da-f]{6}$/i.test(prefs.background ?? "") ? prefs.background : "#FFFFFF";
  const innerWidth = Math.max(10, paperWidth - margin * 2);
  const innerHeight = Math.max(10, paperHeight - margin * 2);
  const selected = objects.find((item) => item.id === selectedId) ?? null;
  const selectedCount = selectedIds.length || (selectedId ? 1 : 0);
  const contextObject = contextMenu?.objectId ? objects.find((item) => item.id === contextMenu.objectId) ?? null : null;

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
    setSelectedIds(previous.length ? [previous[previous.length - 1].id] : []);
  }, [replaceWithoutHistory]);

  const redo = useCallback(() => {
    const next = redoStack.current.pop();
    if (!next) return;
    undoStack.current = [...undoStack.current.slice(-39), objectsRef.current];
    replaceWithoutHistory(next);
    setSelectedId(next.length ? next[next.length - 1].id : null);
    setSelectedIds(next.length ? [next[next.length - 1].id] : []);
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

  const addFrame = (shape: FrameShape = layoutShape) => {
    const width = shape === "oval" ? 70 : 62;
    const height = shape === "oval" ? 44 : width;
    const item: CanvasObject = {
      id: uid(), kind: "frame", src: null, name: t("frame"),
      naturalWidth: 0, naturalHeight: 0,
      x: clamp((paperWidth - width) / 2, margin, paperWidth - margin - width),
      y: clamp((paperHeight - height) / 2, margin, paperHeight - margin - height),
      width, height,
      rotation: defaultObjectRotation, shape, fit: "cover", cropScale: 1, cropX: 50, cropY: 50,
      zIndex: objectsRef.current.length + 1,
    };
    commit([...objectsRef.current, item]);
    setSelectedId(item.id);
    setSelectedIds([item.id]);
    setInspectorTab("position");
  };

  const addLayout = (count: number) => {
    const columns = prefs.orientation === "landscape" ? Math.min(count, 3) : Math.min(count, 2);
    const rows = Math.ceil(count / columns), gap = 5;
    const cellWidth = (innerWidth - gap * (columns - 1)) / columns;
    const cellHeight = (innerHeight - gap * (rows - 1)) / rows;
    const next = Array.from({ length: count }, (_, index) => {
      const column = index % columns, row = Math.floor(index / columns);
      let slotX = margin + column * (cellWidth + gap);
      const slotY = margin + row * (cellHeight + gap);
      if (count === 3 && index === 2 && columns === 2) slotX = margin + (innerWidth - cellWidth) / 2;
      const keepsSquareRatio = layoutShape === "square" || layoutShape === "circle";
      const width = keepsSquareRatio ? Math.min(cellWidth, cellHeight) : cellWidth;
      const height = keepsSquareRatio ? width : cellHeight;
      return {
        id: uid(), kind: "frame" as const, src: null, name: t("frame") + " " + (index + 1),
        naturalWidth: 0, naturalHeight: 0,
        x: slotX + (cellWidth - width) / 2, y: slotY + (cellHeight - height) / 2,
        width, height, rotation: defaultObjectRotation, shape: layoutShape, fit: "cover" as ImageFit,
        cropScale: 1, cropX: 50, cropY: 50, zIndex: objectsRef.current.length + index + 1,
      };
    });
    commit([...objectsRef.current, ...next]);
    setSelectedId(next[0]?.id ?? null);
    setSelectedIds(next.map((item) => item.id));
    setInspectorTab("position");
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
              ? { ...item, src, name: file.name || t("image"), naturalWidth: image.naturalWidth, naturalHeight: image.naturalHeight, fit: "cover" as ImageFit, cropScale: 1, cropX: 50, cropY: 50 }
              : item);
            commit(filled);
            setSelectedId(frameTarget.id);
            setSelectedIds([frameTarget.id]);
            setInspectorTab("position");
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
              width, height, rotation: defaultObjectRotation, shape: "square",
              fit: "contain", cropScale: 1, cropX: 50, cropY: 50, zIndex: current.length + 1,
            };
            commit([...objectsRef.current, item]);
            setSelectedId(item.id);
            setSelectedIds([item.id]);
            setInspectorTab("position");
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
  }, [commit, defaultObjectRotation, innerHeight, innerWidth, margin, paperHeight, paperWidth, t]);

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

  const getFrameAtClientPoint = useCallback((clientX: number, clientY: number, excludeId?: string) => {
    const rect = artboardRef.current?.getBoundingClientRect();
    if (!rect) return null;
    const x = (clientX - rect.left) / previewScale, y = (clientY - rect.top) / previewScale;
    return objectsRef.current.filter((item) => item.kind === "frame" && item.id !== excludeId
      && x >= item.x && x <= item.x + item.width && y >= item.y && y <= item.y + item.height)
      .sort((a, b) => b.zIndex - a.zIndex)[0] ?? null;
  }, [previewScale]);

  const startDrag = (
    event: ReactPointerEvent<HTMLElement>,
    item: CanvasObject,
    mode: "move" | "resize" | "rotate" = "move",
    resizeHandle: DragState["resizeHandle"] = "se",
  ) => {
    event.stopPropagation();
    if (event.button !== 0) return;
    if (mode === "move" && (event.ctrlKey || event.metaKey || event.shiftKey)) {
      event.preventDefault();
      const nextIds = event.shiftKey
        ? (selectedIds.includes(item.id) ? selectedIds : [...selectedIds, item.id])
        : (selectedIds.includes(item.id) ? selectedIds.filter((id) => id !== item.id) : [...selectedIds, item.id]);
      setSelectedIds(nextIds);
      setSelectedId(nextIds.includes(item.id) ? item.id : nextIds[nextIds.length - 1] ?? null);
      setInspectorTab("position");
      setContextMenu(null);
      return;
    }
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    const ids = selectedIds.includes(item.id) ? selectedIds : [item.id];
    setSelectedId(item.id);
    setInspectorTab("position");
    if (!selectedIds.includes(item.id)) setSelectedIds([item.id]);
    const boardRect = artboardRef.current?.getBoundingClientRect();
    const centerX = boardRect ? boardRect.left + (item.x + item.width / 2) * previewScale : event.clientX;
    const centerY = boardRect ? boardRect.top + (item.y + item.height / 2) * previewScale : event.clientY;
    dragRef.current = {
      id: item.id, pointerId: event.pointerId,
      mode: mode === "resize" ? "resize" : mode === "rotate" ? "rotate" : cropMode && item.src ? "crop" : "move",
      clientX: event.clientX, clientY: event.clientY,
      x: item.x, y: item.y, width: item.width, height: item.height,
      cropX: item.cropX, cropY: item.cropY, rotation: item.rotation,
      startAngle: Math.atan2(event.clientY - centerY, event.clientX - centerX),
      selectedIds: ids, initialObjects: objectsRef.current,
      resizeHandle,
    };
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const marquee = marqueeRef.current;
    if (marquee && marquee.pointerId === event.pointerId) {
      const rect = artboardRef.current?.getBoundingClientRect();
      if (!rect) return;
      const x = (event.clientX - rect.left) / previewScale;
      const y = (event.clientY - rect.top) / previewScale;
      setSelectionRect({
        x: Math.min(marquee.startX, x),
        y: Math.min(marquee.startY, y),
        width: Math.abs(x - marquee.startX),
        height: Math.abs(y - marquee.startY),
      });
      return;
    }
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    const dx = (event.clientX - drag.clientX) / previewScale, dy = (event.clientY - drag.clientY) / previewScale;
    const current = objectsRef.current, item = current.find((object) => object.id === drag.id);
    if (!item) return;
    if (drag.mode === "resize") {
      const handle = drag.resizeHandle ?? "se";
      let x = drag.x, y = drag.y, width = drag.width, height = drag.height;
      if (handle.includes("e")) width = clamp(drag.width + dx, 8, paperWidth - drag.x);
      if (handle.includes("s")) height = clamp(drag.height + dy, 8, paperHeight - drag.y);
      if (handle.includes("w")) {
        x = clamp(drag.x + dx, 0, drag.x + drag.width - 8);
        width = drag.width - (x - drag.x);
      }
      if (handle.includes("n")) {
        y = clamp(drag.y + dy, 0, drag.y + drag.height - 8);
        height = drag.height - (y - drag.y);
      }
      replaceWithoutHistory(current.map((object) => object.id === drag.id ? { ...object, x, y, width, height } : object));
      setGuides({ x: null, y: null }); return;
    }
    if (drag.mode === "rotate") {
      const rect = artboardRef.current?.getBoundingClientRect();
      if (!rect) return;
      const centerX = rect.left + (drag.x + drag.width / 2) * previewScale;
      const centerY = rect.top + (drag.y + drag.height / 2) * previewScale;
      const currentAngle = Math.atan2(event.clientY - centerY, event.clientX - centerX);
      const delta = (currentAngle - drag.startAngle) * (180 / Math.PI);
      const rotation = ((drag.rotation + delta) % 360 + 360) % 360;
      replaceWithoutHistory(current.map((object) => object.id === drag.id ? { ...object, rotation } : object));
      setGuides({ x: null, y: null });
      setDropTargetId(null);
      return;
    }
    if (drag.mode === "crop") {
      const cropX = clamp(drag.cropX - dx / Math.max(8, drag.width) * 100, 0, 100);
      const cropY = clamp(drag.cropY - dy / Math.max(8, drag.height) * 100, 0, 100);
      replaceWithoutHistory(current.map((object) => object.id === drag.id ? { ...object, cropX, cropY } : object));
      setGuides({ x: null, y: null }); setDropTargetId(null); return;
    }
    if (drag.selectedIds.length > 1) {
      const moving = drag.initialObjects.filter((object) => drag.selectedIds.includes(object.id));
      const minX = Math.min(...moving.map((object) => object.x)), minY = Math.min(...moving.map((object) => object.y));
      const maxX = Math.max(...moving.map((object) => object.x + object.width)), maxY = Math.max(...moving.map((object) => object.y + object.height));
      const moveX = clamp(dx, -minX, paperWidth - maxX), moveY = clamp(dy, -minY, paperHeight - maxY);
      const byId = new Map<string, CanvasObject>(moving.map((object) => [object.id, object] as const));
      replaceWithoutHistory(current.map((object) => {
        const original = byId.get(object.id);
        return original ? { ...object, x: original.x + moveX, y: original.y + moveY } : object;
      }));
      setGuides({ x: null, y: null }); setDropTargetId(null); return;
    }
    let x = clamp(drag.x + dx, 0, paperWidth - item.width), y = clamp(drag.y + dy, 0, paperHeight - item.height);
    let guideX: number | null = null, guideY: number | null = null;
    if (snapEnabled) {
      const sx = snapAxis(x, item.width, "x", item.id), sy = snapAxis(y, item.height, "y", item.id);
      x = sx.value; y = sy.value; guideX = sx.guide; guideY = sy.guide;
    }
    replaceWithoutHistory(current.map((object) => object.id === drag.id ? { ...object, x, y } : object));
    setGuides({ x: guideX, y: guideY });
    const frame = item.src ? getFrameAtClientPoint(event.clientX, event.clientY, item.id) : null;
    setDropTargetId(frame?.id ?? null);
  };

  const handlePointerUp = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.type === "pointercancel") {
      marqueeRef.current = null;
      dragRef.current = null;
      setSelectionRect(null);
      setGuides({ x: null, y: null });
      setDropTargetId(null);
      return;
    }
    const marquee = marqueeRef.current;
    if (marquee && marquee.pointerId === event.pointerId) {
      const rect = artboardRef.current?.getBoundingClientRect();
      if (rect) {
        const endX = (event.clientX - rect.left) / previewScale;
        const endY = (event.clientY - rect.top) / previewScale;
        const x = Math.min(marquee.startX, endX);
        const y = Math.min(marquee.startY, endY);
        const width = Math.abs(endX - marquee.startX);
        const height = Math.abs(endY - marquee.startY);
        const hits = objectsRef.current.filter((item) =>
          item.x < x + width &&
          item.x + item.width > x &&
          item.y < y + height &&
          item.y + item.height > y
        ).map((item) => item.id);
        const nextIds = marquee.additive
          ? Array.from(new Set([...selectedIds, ...hits]))
          : hits;
        setSelectedIds(nextIds);
        setSelectedId(nextIds[nextIds.length - 1] ?? null);
        if (nextIds.length) setInspectorTab("position");
      }
      marqueeRef.current = null;
      setSelectionRect(null);
      return;
    }
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    let finalObjects = objectsRef.current;
    const source = drag.initialObjects.find((object) => object.id === drag.id);
    const target = dropTargetId ? finalObjects.find((object) => object.id === dropTargetId && object.kind === "frame") : null;
    if (drag.mode === "move" && drag.selectedIds.length === 1 && source?.src && target && source.id !== target.id) {
      finalObjects = finalObjects.filter((object) => object.id !== source.id).map((object) => object.id === target.id
        ? { ...object, src: source.src, name: source.name, naturalWidth: source.naturalWidth, naturalHeight: source.naturalHeight, fit: "cover" as ImageFit, cropScale: 1, cropX: 50, cropY: 50 }
        : object);
      setSelectedId(target.id); setSelectedIds([target.id]);
    }
    if (JSON.stringify(drag.initialObjects) !== JSON.stringify(finalObjects)) {
      undoStack.current = [...undoStack.current.slice(-39), drag.initialObjects];
      redoStack.current = [];
      objectsRef.current = finalObjects; setObjects(finalObjects);
    }
    dragRef.current = null; setGuides({ x: null, y: null }); setDropTargetId(null);
  };

  const updateSelected = (patch: Partial<CanvasObject>) => {
    const ids = selectedIds.length ? selectedIds : selectedId ? [selectedId] : [];
    if (!ids.length) return;
    commit((current) => current.map((item) => ids.includes(item.id) ? { ...item, ...patch } : item));
  };

  const updateSelectedShape = (shape: FrameShape) => {
    const ids = selectedIds.length ? selectedIds : selectedId ? [selectedId] : [];
    if (!ids.length) return;
    commit((current) => current.map((item) => {
      if (!ids.includes(item.id)) return item;
      if (shape !== "square" && shape !== "circle") return { ...item, shape };
      const side = Math.min(item.width, item.height);
      const centerX = item.x + item.width / 2;
      const centerY = item.y + item.height / 2;
      return {
        ...item,
        shape,
        width: side,
        height: side,
        x: clamp(centerX - side / 2, 0, paperWidth - side),
        y: clamp(centerY - side / 2, 0, paperHeight - side),
      };
    }));
  };

  const duplicateSelected = () => {
    const ids = selectedIds.length ? selectedIds : selectedId ? [selectedId] : [];
    const current = objectsRef.current, chosen = current.filter((item) => ids.includes(item.id));
    if (!chosen.length) return;
    const copies = chosen.map((item, index) => ({
      ...item, id: uid(), name: item.name + " (" + t("copySuffix") + ")",
      x: clamp(item.x + 8, 0, paperWidth - item.width), y: clamp(item.y + 8, 0, paperHeight - item.height),
      zIndex: current.length + index + 1,
    }));
    commit([...current, ...copies]); setSelectedId(copies[copies.length - 1].id); setSelectedIds(copies.map((item) => item.id));
  };
  const deleteSelected = () => {
    const ids = selectedIds.length ? selectedIds : selectedId ? [selectedId] : [];
    if (!ids.length) return;
    commit(objectsRef.current.filter((item) => !ids.includes(item.id)));
    setSelectedId(null); setSelectedIds([]); setCropMode(false);
  };
  const copySelection = () => {
    const ids = selectedIds.length ? selectedIds : selectedId ? [selectedId] : [];
    clipboardRef.current = objectsRef.current.filter((item) => ids.includes(item.id)).map((item) => ({ ...item }));
  };
  const pasteSelection = () => {
    if (!clipboardRef.current.length) return;
    const current = objectsRef.current;
    const copies = clipboardRef.current.map((item, index) => ({
      ...item, id: uid(), name: item.name + " (" + t("copySuffix") + ")",
      x: clamp(item.x + 8, 0, paperWidth - item.width), y: clamp(item.y + 8, 0, paperHeight - item.height),
      zIndex: current.length + index + 1,
    }));
    commit([...current, ...copies]); setSelectedId(copies[copies.length - 1].id); setSelectedIds(copies.map((item) => item.id));
  };
  const rotateSelected = () => {
    if (!selected) return;
    const ids = selectedIds.length ? selectedIds : [selected.id], chosen = objectsRef.current.filter((item) => ids.includes(item.id));
    if (chosen.length === 1) { updateSelected({ rotation: (selected.rotation + 90) % 360 }); return; }
    const cx = (Math.min(...chosen.map((item) => item.x)) + Math.max(...chosen.map((item) => item.x + item.width))) / 2;
    const cy = (Math.min(...chosen.map((item) => item.y)) + Math.max(...chosen.map((item) => item.y + item.height))) / 2;
    commit((current) => current.map((item) => {
      if (!ids.includes(item.id)) return item;
      const ox = item.x + item.width / 2, oy = item.y + item.height / 2;
      return { ...item, x: clamp(cx - (oy - cy) - item.width / 2, 0, paperWidth - item.width),
        y: clamp(cy + (ox - cx) - item.height / 2, 0, paperHeight - item.height), rotation: (item.rotation + 90) % 360 };
    }));
  };
  const alignSelected = () => {
    if (!selected) return;
    const ids = selectedIds.length ? selectedIds : [selected.id], chosen = objectsRef.current.filter((item) => ids.includes(item.id));
    const minX = Math.min(...chosen.map((item) => item.x)), minY = Math.min(...chosen.map((item) => item.y));
    const maxX = Math.max(...chosen.map((item) => item.x + item.width)), maxY = Math.max(...chosen.map((item) => item.y + item.height));
    const dx = paperWidth / 2 - (minX + maxX) / 2, dy = paperHeight / 2 - (minY + maxY) / 2;
    commit((current) => current.map((item) => ids.includes(item.id)
      ? { ...item, x: clamp(item.x + dx, 0, paperWidth - item.width), y: clamp(item.y + dy, 0, paperHeight - item.height) } : item));
  };

  const changeOrientationMode = (orientation: Orientation) => {
    if (orientation === prefs.orientation) return;
    const rotationDelta = orientation === "landscape" ? 90 : -90;
    if (objectsRef.current.length) {
      commit((current) => current.map((item) => ({
        ...item,
        rotation: ((item.rotation + rotationDelta) % 360 + 360) % 360,
      })));
    }
    setPrefs({ orientation });
  };

  const printSheet = useCallback(async () => {
    const source = document.getElementById("print-area");
    if (!source || objectsRef.current.length === 0) return;

    const frame = document.createElement("iframe");
    frame.title = t("printSheet");
    frame.style.cssText = "position:fixed;inset:0;width:100vw;height:100vh;border:0;opacity:0;pointer-events:none;z-index:2147483647;";
    frame.setAttribute("aria-hidden", "true");
    frame.tabIndex = -1;
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
      await Promise.all(Array.from(printDocument.images).map((image) => {
        if (typeof image.decode === "function") return image.decode().catch(() => undefined);
        if (image.complete) return Promise.resolve();
        return new Promise<void>((resolve) => {
          image.addEventListener("load", () => resolve(), { once: true });
          image.addEventListener("error", () => resolve(), { once: true });
        });
      }));
      if (printDocument.fonts?.ready) await printDocument.fonts.ready.catch(() => undefined);
    } catch {
      // Keep printing even if a browser cannot decode an image or wait for fonts.
    }

    const cleanup = () => {
      if (frame.isConnected) frame.remove();
    };
    const requestFrame = printWindow.requestAnimationFrame?.bind(printWindow);
    if (requestFrame) {
      await new Promise<void>((resolve) => requestFrame(() => requestFrame(() => resolve())));
    } else {
      await new Promise<void>((resolve) => window.setTimeout(resolve, 80));
    }

    printWindow.addEventListener("afterprint", cleanup, { once: true });
    window.addEventListener("afterprint", cleanup, { once: true });
    printWindow.focus();
    try {
      printWindow.print();
    } catch {
      cleanup();
      window.print();
    }
    window.setTimeout(cleanup, 120000);
  }, [paperBackground, paperHeight, paperWidth, t]);

  useEffect(() => {
    const onPrintRequest = () => { void printSheet(); };
    window.addEventListener("rekaluna:print-sheet", onPrintRequest);
    return () => window.removeEventListener("rekaluna:print-sheet", onPrintRequest);
  }, [printSheet]);

  const reorderLayers = (sourceId: string, targetId: string) => {
    if (!sourceId || !targetId || sourceId === targetId) return;
    const ordered = [...objectsRef.current].sort((a, b) => a.zIndex - b.zIndex);
    const from = ordered.findIndex((item) => item.id === sourceId);
    const to = ordered.findIndex((item) => item.id === targetId);
    if (from < 0 || to < 0) return;
    const [moving] = ordered.splice(from, 1);
    ordered.splice(to, 0, moving);
    commit(ordered.map((item, index) => ({ ...item, zIndex: index + 1 })));
  };

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
  const bringToFront = () => {
    const ids = selectedIds.length ? selectedIds : selectedId ? [selectedId] : [];
    if (!ids.length) return;
    const all = [...objectsRef.current].sort((a, b) => a.zIndex - b.zIndex);
    const moving = all.filter((item) => ids.includes(item.id)), rest = all.filter((item) => !ids.includes(item.id));
    commit([...rest, ...moving].map((item, index) => ({ ...item, zIndex: index + 1 })));
  };
  const sendToBack = () => {
    const ids = selectedIds.length ? selectedIds : selectedId ? [selectedId] : [];
    if (!ids.length) return;
    const all = [...objectsRef.current].sort((a, b) => a.zIndex - b.zIndex);
    const moving = all.filter((item) => ids.includes(item.id)), rest = all.filter((item) => !ids.includes(item.id));
    commit([...moving, ...rest].map((item, index) => ({ ...item, zIndex: index + 1 })));
  };
  const runContextAction = (action: string) => {
    const target = contextMenu?.objectId ? objectsRef.current.find((item) => item.id === contextMenu.objectId) : null;
    setContextMenu(null);
    switch (action) {
      case "select-all": setSelectedIds(objectsRef.current.map((item) => item.id)); setSelectedId(objectsRef.current[objectsRef.current.length - 1]?.id ?? null); break;
      case "copy": copySelection(); break;
      case "cut": copySelection(); deleteSelected(); break;
      case "paste": pasteSelection(); break;
      case "add-selected-frame": addFrame(); break;
      case "duplicate": duplicateSelected(); break;
      case "delete": deleteSelected(); break;
      case "replace": if (target) { setFileTargetId(target.id); fileInputRef.current?.click(); } break;
      case "crop": setCropMode(true); if (target?.src) updateSelected({ fit: "cover" }); break;
      case "cover": updateSelected({ fit: "cover", cropScale: 1 }); break;
      case "contain": updateSelected({ fit: "contain", cropScale: 1 }); break;
      case "reset-crop": updateSelected({ cropScale: 1, cropX: 50, cropY: 50 }); break;
      case "rotate": rotateSelected(); break;
      case "front": bringToFront(); break;
      case "back": sendToBack(); break;
      default: break;
    }
  };
  useEffect(() => {
    if (!contextMenu) return;
    const frame = window.requestAnimationFrame(() => {
      contextMenuRef.current?.querySelector<HTMLButtonElement>('[role="menuitem"]')?.focus({ preventScroll: true });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [contextMenu]);

  useEffect(() => {
    if (!contextMenu) {
      setContextMenuPosition(null);
      return;
    }

    const positionMenu = () => {
      const menu = contextMenuRef.current;
      if (!menu) return;
      const rect = menu.getBoundingClientRect();
      const edge = 10;
      const gap = 8;
      const viewportWidth = document.documentElement.clientWidth || window.innerWidth;
      const viewportHeight = document.documentElement.clientHeight || window.innerHeight;

      let left = contextMenu.x + gap;
      let top = contextMenu.y + gap;
      if (left + rect.width > viewportWidth - edge) left = contextMenu.x - rect.width - gap;
      if (top + rect.height > viewportHeight - edge) top = contextMenu.y - rect.height - gap;

      setContextMenuPosition({
        left: clamp(left, edge, viewportWidth - rect.width - edge),
        top: clamp(top, edge, viewportHeight - rect.height - edge),
      });
    };

    positionMenu();
    window.addEventListener("resize", positionMenu);
    window.addEventListener("scroll", positionMenu, true);
    const dismiss = (event: PointerEvent) => {
      if ((event.target as HTMLElement | null)?.closest("[data-context-menu]")) return;
      setContextMenu(null);
    };
    document.addEventListener("pointerdown", dismiss);
    return () => {
      window.removeEventListener("resize", positionMenu);
      window.removeEventListener("scroll", positionMenu, true);
      document.removeEventListener("pointerdown", dismiss);
    };
  }, [contextMenu, contextObject]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.closest("[data-context-menu]")) return;
      if (target && (["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName) || target.isContentEditable)) return;
      const modifier = event.ctrlKey || event.metaKey, key = event.key.toLowerCase();
      if (event.key === "Escape") {
        if (contextMenu) setContextMenu(null);
        else { setSelectedId(null); setSelectedIds([]); setCropMode(false); }
        return;
      }
      if (modifier && key === "a") { event.preventDefault(); setSelectedIds(objectsRef.current.map((item) => item.id)); setSelectedId(objectsRef.current[objectsRef.current.length - 1]?.id ?? null); return; }
      if (modifier && key === "c" && selectedCount) { event.preventDefault(); copySelection(); return; }
      if (modifier && key === "x" && selectedCount) { event.preventDefault(); copySelection(); deleteSelected(); return; }
      if (modifier && key === "v" && clipboardRef.current.length) { event.preventDefault(); pasteSelection(); return; }
      if (modifier && key === "z") { event.preventDefault(); if (event.shiftKey) redo(); else undo(); return; }
      if (modifier && key === "y") { event.preventDefault(); redo(); return; }
      if (modifier && key === "d" && selectedCount) { event.preventDefault(); duplicateSelected(); return; }
      if (modifier && key === "]" && selectedCount) { event.preventDefault(); bringToFront(); return; }
      if (modifier && key === "[" && selectedCount) { event.preventDefault(); sendToBack(); return; }
      if (modifier && key === "0") { event.preventDefault(); setZoom(1); return; }
      if (modifier && (key === "+" || key === "=")) { event.preventDefault(); setZoom((value) => clamp(value + 0.1, 0.5, 2)); return; }
      if (modifier && key === "-") { event.preventDefault(); setZoom((value) => clamp(value - 0.1, 0.5, 2)); return; }
      if ((event.key === "Delete" || event.key === "Backspace") && selectedCount) { event.preventDefault(); deleteSelected(); return; }
      if (!selectedCount || !["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(event.key)) return;
      event.preventDefault();
      const step = event.shiftKey ? 10 : event.altKey || precise ? 0.1 : 1;
      const ids = selectedIds.length ? selectedIds : selectedId ? [selectedId] : [];
      const chosen = objectsRef.current.filter((item) => ids.includes(item.id));
      if (!chosen.length) return;
      const minX = Math.min(...chosen.map((item) => item.x)), minY = Math.min(...chosen.map((item) => item.y));
      const maxX = Math.max(...chosen.map((item) => item.x + item.width)), maxY = Math.max(...chosen.map((item) => item.y + item.height));
      const dx = event.key === "ArrowLeft" ? -step : event.key === "ArrowRight" ? step : 0;
      const dy = event.key === "ArrowUp" ? -step : event.key === "ArrowDown" ? step : 0;
      const moveX = clamp(dx, -minX, paperWidth - maxX), moveY = clamp(dy, -minY, paperHeight - maxY);
      commit((current) => current.map((item) => ids.includes(item.id) ? { ...item, x: item.x + moveX, y: item.y + moveY } : item));
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [bringToFront, commit, contextMenu, copySelection, deleteSelected, duplicateSelected, pasteSelection, paperHeight, paperWidth, precise, redo, selectedCount, selectedId, selectedIds, sendToBack, undo]);

  const handleDrop = (event: ReactDragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragOver(false); setDropTargetId(null);
    const files = Array.from(event.dataTransfer.files ?? []);
    if (!files.length) return;
    const element = (event.target as HTMLElement).closest("[data-object-id]") as HTMLElement | null;
    const frame = getFrameAtClientPoint(event.clientX, event.clientY);
    const targetId = frame?.id ?? element?.dataset.objectId;
    const rect = artboardRef.current?.getBoundingClientRect();
    const point = rect ? { x: (event.clientX - rect.left) / previewScale, y: (event.clientY - rect.top) / previewScale } : undefined;
    loadFiles(files, targetId, point);
  };

  const handleClear = () => {
    if (!objectsRef.current.length || !window.confirm(t("confirmClear"))) return;
    commit([]);
    setSelectedId(null); setSelectedIds([]); setCropMode(false); setDropTargetId(null);
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

      <div className="grid grid-cols-1 lg:grid-cols-[190px_minmax(0,1fr)] xl:grid-cols-[220px_minmax(0,1fr)_320px] gap-4 items-start">
        <aside className="card p-3 space-y-3 no-print">
          <div className="grid grid-cols-3 xl:grid-cols-1 gap-1" role="tablist" aria-label={t("toolbox")}>
            {([
              { id: "media", label: t("addImages"), icon: "image" },
              { id: "layouts", label: t("quickLayouts"), icon: "object-group" },
              { id: "frames", label: t("frame"), icon: "frame" },
            ] as const).map((tab) => (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={toolPanelTab === tab.id}
                onClick={() => setToolPanelTab(tab.id)}
                className={"flex xl:w-full flex-col xl:flex-row items-center justify-center xl:justify-start gap-1.5 xl:gap-2 rounded-lg px-2 py-2.5 text-[11px] xl:text-xs font-medium transition-snappy " + (toolPanelTab === tab.id ? "bg-[rgba(156,28,38,.09)] text-[color:var(--brand)]" : "text-muted hover:bg-[color:var(--canvas)]")}
              >
                <Icon name={tab.icon} />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          <div className="border-t pt-3 space-y-3" style={{ borderColor: "var(--line)" }}>
            {toolPanelTab === "media" && (
              <div className="space-y-3">
                <div>
                  <div className="font-semibold text-sm">{t("addImages")}</div>
                  <p className="text-xs text-muted mt-1">{t("emptyHint")}</p>
                </div>
                <button className="btn btn-primary w-full" onClick={() => { setFileTargetId(undefined); fileInputRef.current?.click(); }}>
                  <Icon name="plus" /> {t("addImages")}
                </button>
                <div className="rounded-lg p-3 text-xs text-muted leading-relaxed" style={{ background: "var(--canvas)" }}>
                  <div className="font-semibold text-[color:var(--ink)] mb-1">{t("keyboardFirst")}</div>
                  <span className="kbd">Ctrl V</span> {t("pasteIntoPrint")}
                </div>
                {selected?.kind === "frame" && !selected.src && (
                  <button className="btn btn-secondary w-full" onClick={() => { setFileTargetId(selected.id); fileInputRef.current?.click(); }}>
                    <Icon name="image" /> {t("dropToFill")}
                  </button>
                )}
              </div>
            )}

            {toolPanelTab === "layouts" && (
              <div className="space-y-3">
                <div>
                  <div className="font-semibold text-sm">{t("quickLayouts")}</div>
                  <p className="text-xs text-muted mt-1">{t("addLayout")}</p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {[2, 3, 4, 6].map((count) => (
                    <button key={count} className="btn btn-secondary !py-3 flex-col" onClick={() => addLayout(count)}>
                      <span className="text-base font-semibold num">{count}</span>
                      <span className="text-[10px]">{t(count === 2 ? "twoUp" : count === 3 ? "threeUp" : count === 4 ? "fourUp" : "sixUp")}</span>
                    </button>
                  ))}
                </div>
                <p className="text-[11px] text-muted">{t("layoutShape")}: {t(layoutShape)}</p>
              </div>
            )}

            {toolPanelTab === "frames" && (
              <div className="space-y-3">
                <div>
                  <div className="font-semibold text-sm">{t("frame")}</div>
                  <p className="text-xs text-muted mt-1">{t("frameHint")}</p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {(["square", "rounded", "circle", "oval"] as FrameShape[]).map((shape) => (
                    <button
                      key={shape}
                      type="button"
                      aria-pressed={layoutShape === shape}
                      onClick={() => setLayoutShape(shape)}
                      className={"rounded-lg border px-2 py-3 flex flex-col items-center justify-center gap-2 text-xs transition-snappy " + (layoutShape === shape ? "border-[color:var(--brand)] bg-[rgba(156,28,38,.08)] text-[color:var(--brand)]" : "border-[color:var(--line)] hover:bg-[color:var(--canvas)]")}
                    >
                      <span className={"border-2 border-current inline-block " + (shape === "oval" ? "w-8 h-5 rounded-full" : shape === "circle" ? "w-6 h-6 rounded-full" : shape === "rounded" ? "w-6 h-6 rounded-lg" : "w-6 h-6")} />
                      <span>{t(shape)}</span>
                    </button>
                  ))}
                </div>
                <button className="btn btn-primary w-full" onClick={() => addFrame()}>
                  <Icon name="plus" /> {t("addFrame")}
                </button>
              </div>
            )}
          </div>

          <label className="flex items-center gap-2 border-t pt-3 text-xs text-muted cursor-pointer" style={{ borderColor: "var(--line)" }}>
            <input type="checkbox" checked={snapEnabled} onChange={(event) => setSnapEnabled(event.target.checked)} />
            <span>{t("snapping")}</span>
          </label>
        </aside>

        <section className="card p-3 md:p-4 min-w-0">
          <div className="rounded-xl border p-2 mb-3 no-print space-y-2" style={{ borderColor: "var(--line)", background: "var(--surface)" }}>
            <div className="flex items-center justify-between gap-2 min-w-0">
              <div className="min-w-0">
                <div className="font-semibold text-xs truncate">
                  {selectedCount > 1 ? selectedCount + " " + t("selectedCount") : selected?.name ?? t("noSelection")}
                </div>
                <div className="text-[10px] text-muted">{selectedCount > 0 ? t("position") : t("moveHint")}</div>
              </div>
              {selectedCount > 0 && (
                <button className="btn btn-ghost !px-2 !py-1.5 text-xs" onClick={() => { setSelectedId(null); setSelectedIds([]); setCropMode(false); }}>
                  {t("close")}
                </button>
              )}
            </div>
            {selectedCount > 0 && (
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
                {selectedCount === 1 && selected?.src && (
                  <>
                    <button className={"btn btn-secondary !px-2.5 !py-1.5 text-xs shrink-0 " + (cropMode ? "!border-[color:var(--brand)] !text-[color:var(--brand)]" : "")} onClick={() => { setCropMode((value) => !value); updateSelected({ fit: "cover" }); }}>
                      <Icon name="crop" /> {cropMode ? t("finishCrop") : t("cropMode")}
                    </button>
                    <button className="btn btn-secondary !px-2.5 !py-1.5 text-xs shrink-0" onClick={() => { setFileTargetId(selected.id); fileInputRef.current?.click(); }}>
                      <Icon name="image" /> {t("replaceImage")}
                    </button>
                    <button className={"btn btn-secondary !px-2.5 !py-1.5 text-xs shrink-0 " + (selected.fit === "cover" ? "!border-[color:var(--brand)] !text-[color:var(--brand)]" : "")} onClick={() => updateSelected({ fit: "cover" })}>{t("cover")}</button>
                    <button className={"btn btn-secondary !px-2.5 !py-1.5 text-xs shrink-0 " + (selected.fit === "contain" ? "!border-[color:var(--brand)] !text-[color:var(--brand)]" : "")} onClick={() => updateSelected({ fit: "contain" })}>{t("contain")}</button>
                  </>
                )}
                <button className="btn btn-secondary !px-2.5 !py-1.5 text-xs shrink-0" onClick={duplicateSelected}><Icon name="copy" /> {t("duplicate")}</button>
                <button className="btn btn-secondary !px-2.5 !py-1.5 text-xs shrink-0" onClick={rotateSelected}><Icon name="rotate" /> 90°</button>
                <button className="btn btn-secondary !px-2.5 !py-1.5 text-xs shrink-0" onClick={alignSelected}><Icon name="object-group" /> {t("centerPage")}</button>
                <button className="btn btn-secondary !px-2.5 !py-1.5 text-xs shrink-0" onClick={bringToFront}><Icon name="chevron-up" /> {t("bringToFront")}</button>
                <button className="btn btn-secondary !px-2.5 !py-1.5 text-xs shrink-0" onClick={sendToBack}><Icon name="chevron-down" /> {t("sendToBack")}</button>
                <button className="btn btn-danger !px-2.5 !py-1.5 text-xs shrink-0" onClick={deleteSelected}><Icon name="trash" /> {t("delete")}</button>
              </div>
            )}
          </div>

          <div
            ref={previewRef}
            className={"relative min-h-[420px] md:min-h-[560px] rounded-xl flex items-center justify-center overflow-auto p-3 md:p-6 transition-snappy " + (dragOver ? "ring-2 ring-[color:var(--brand)]" : "")}
            style={{ background: "color-mix(in srgb, var(--canvas) 88%, var(--ink))" }}
            onDragOver={(event) => {
              event.preventDefault(); setDragOver(true);
              const frame = getFrameAtClientPoint(event.clientX, event.clientY);
              setDropTargetId(frame?.id ?? null);
            }}
            onDragLeave={(event) => {
              if (!event.currentTarget.contains(event.relatedTarget as Node | null)) { setDragOver(false); setDropTargetId(null); }
            }}
            onDrop={handleDrop}
            onContextMenu={(event) => {
              event.preventDefault();
              const element = (event.target as HTMLElement).closest("[data-object-id]") as HTMLElement | null;
              const objectId = element?.dataset.objectId ?? null;
              if (objectId) { setSelectedId(objectId); setSelectedIds([objectId]); setInspectorTab("position"); }
              const targetRect = element?.getBoundingClientRect();
              const keyboardContextMenu = event.clientX === 0 && event.clientY === 0;
              const anchorX = keyboardContextMenu && targetRect ? targetRect.left + targetRect.width / 2 : event.clientX;
              const anchorY = keyboardContextMenu && targetRect ? targetRect.top + targetRect.height / 2 : event.clientY;
              setContextMenuPosition(null);
              setContextMenu({ x: anchorX, y: anchorY, objectId });
            }}
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
              onPointerDown={(event) => {
                if ((event.target as HTMLElement).id === "print-area") {
                  event.preventDefault();
                  event.currentTarget.setPointerCapture(event.pointerId);
                  const rect = artboardRef.current?.getBoundingClientRect();
                  if (!rect) return;
                  const x = (event.clientX - rect.left) / previewScale;
                  const y = (event.clientY - rect.top) / previewScale;
                  marqueeRef.current = {
                    pointerId: event.pointerId,
                    startX: x,
                    startY: y,
                    additive: event.shiftKey,
                  };
                  setSelectionRect({ x, y, width: 0, height: 0 });
                  setContextMenu(null);
                  setCropMode(false);
                  if (!event.shiftKey) {
                    setSelectedId(null);
                    setSelectedIds([]);
                    setInspectorTab("page");
                  }
                }
              }}
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
                const active = selectedIds.includes(item.id) || item.id === selectedId;
                const isDropTarget = item.id === dropTargetId;
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
                      outline: isDropTarget ? "2px solid #1677d2" : active ? "2px solid #9C1C26" : "none",
                      outlineOffset: isDropTarget || active ? "2px" : "0",
                    }}
                    title={item.name}
                  >
                    <div className="absolute inset-0 overflow-hidden" style={{ borderRadius: shape.borderRadius, clipPath: shape.clipPath }}>
                      {item.src ? (
                        <img src={item.src} alt={item.name} draggable={false} className="w-full h-full pointer-events-none" style={{ objectFit: item.fit, objectPosition: item.cropX + "% " + item.cropY + "%", transform: "scale(" + item.cropScale + ")", transformOrigin: "center center", display: "block" }} />
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
                        {selectedCount <= 1 && (
                          <>
                            <div className="absolute left-1/2 -top-5 -translate-x-1/2 w-px h-4 no-print" style={{ background: "var(--brand)" }} />
                            <button
                              type="button"
                              className="absolute left-1/2 -top-9 -translate-x-1/2 w-5 h-5 rounded-full border-2 border-white bg-[color:var(--brand)] text-white shadow-sm flex items-center justify-center no-print"
                              style={{ cursor: "grab", touchAction: "none" }}
                              onPointerDown={(event) => startDrag(event, item, "rotate")}
                              aria-label={t("rotateObject")}
                              title={t("rotateObject")}
                            >
                              <Icon name="rotate" size="2xs" />
                            </button>
                          </>
                        )}
                        {selectedCount <= 1 && ([
                          { id: "nw", style: { left: "-5px", top: "-5px", cursor: "nwse-resize" } },
                          { id: "n", style: { left: "calc(50% - 5px)", top: "-5px", cursor: "ns-resize" } },
                          { id: "ne", style: { right: "-5px", top: "-5px", cursor: "nesw-resize" } },
                          { id: "e", style: { right: "-5px", top: "calc(50% - 5px)", cursor: "ew-resize" } },
                          { id: "se", style: { right: "-5px", bottom: "-5px", cursor: "nwse-resize" } },
                          { id: "s", style: { left: "calc(50% - 5px)", bottom: "-5px", cursor: "ns-resize" } },
                          { id: "sw", style: { left: "-5px", bottom: "-5px", cursor: "nesw-resize" } },
                          { id: "w", style: { left: "-5px", top: "calc(50% - 5px)", cursor: "ew-resize" } },
                        ] as const).map((handle) => (
                          <button
                            key={handle.id}
                            type="button"
                            className="absolute w-[10px] h-[10px] rounded-[3px] border-2 border-white bg-[color:var(--brand)] shadow-sm no-print"
                            style={{ ...handle.style, touchAction: "none" }}
                            onPointerDown={(event) => startDrag(event, item, "resize", handle.id)}
                            aria-label={t("resize")}
                            title={t("resize")}
                          />
                        ))}
                      </>
                    )}
                  </div>
                );
              })}
              {selectionRect && (
                <div
                  className="absolute pointer-events-none no-print"
                  style={{
                    left: selectionRect.x + "mm",
                    top: selectionRect.y + "mm",
                    width: selectionRect.width + "mm",
                    height: selectionRect.height + "mm",
                    border: "1px solid #1677d2",
                    background: "rgba(22,119,210,.12)",
                    zIndex: 9999,
                  }}
                />
              )}
              </div>
            </div>
          </div>

          {contextMenu && createPortal((
            <div
              ref={contextMenuRef}
              data-context-menu
              role="menu"
              aria-label={contextObject ? contextObject.name : t("quickActions")}
              className="fixed z-[10000] w-[224px] max-w-[calc(100vw-20px)] max-h-[calc(100dvh-20px)] overflow-y-auto overscroll-contain rounded-xl border p-1.5 shadow-xl no-print"
              style={{
                left: contextMenuPosition?.left ?? clamp(contextMenu.x + 8, 10, window.innerWidth - 234),
                top: contextMenuPosition?.top ?? clamp(contextMenu.y + 8, 10, window.innerHeight - 260),
                background: "var(--surface)",
                borderColor: "var(--line)",
              }}
              onContextMenu={(event) => event.preventDefault()}
              onPointerDown={(event) => event.stopPropagation()}
              onKeyDown={(event) => {
                if (event.key === "Escape") {
                  event.preventDefault();
                  event.stopPropagation();
                  setContextMenu(null);
                  return;
                }
                const items = Array.from(contextMenuRef.current?.querySelectorAll<HTMLButtonElement>('[role="menuitem"]') ?? []);
                if (!items.length) return;
                const currentIndex = items.indexOf(document.activeElement as HTMLButtonElement);
                let nextIndex = currentIndex;
                if (event.key === "ArrowDown") nextIndex = currentIndex < 0 ? 0 : (currentIndex + 1) % items.length;
                else if (event.key === "ArrowUp") nextIndex = currentIndex < 0 ? items.length - 1 : (currentIndex - 1 + items.length) % items.length;
                else if (event.key === "Home") nextIndex = 0;
                else if (event.key === "End") nextIndex = items.length - 1;
                else return;
                event.preventDefault();
                items[nextIndex]?.focus();
              }}
            >
              {contextObject ? (
                <>
                  <div className="px-2.5 pt-1.5 pb-2">
                    <div className="text-xs font-semibold truncate">{contextObject.name}</div>
                    <div className="text-[10px] text-muted mt-0.5">
                      {contextObject.src ? t("image") : t("frame")} · {Math.round(contextObject.width)} × {Math.round(contextObject.height)} mm
                    </div>
                  </div>
                  <div className="my-1 border-t" style={{ borderColor: "var(--line)" }} />
                  <ContextAction label={t("copy")} icon="copy" onClick={() => runContextAction("copy")} />
                  <ContextAction label={t("cut")} icon="scissors" onClick={() => runContextAction("cut")} />
                  <ContextAction label={t("duplicate")} icon="copy" onClick={() => runContextAction("duplicate")} />
                  {objects.length > 1 && <ContextAction label={t("selectAll")} icon="object-group" onClick={() => runContextAction("select-all")} />}
                  {contextObject.src && (
                    <>
                      <div className="px-2.5 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-wide text-muted">{t("imageFit")}</div>
                      <ContextAction label={t("cropMode")} icon="crop" onClick={() => runContextAction("crop")} />
                      <ContextAction label={t("cover")} icon="expand" onClick={() => runContextAction("cover")} />
                      <ContextAction label={t("contain")} icon="compress" onClick={() => runContextAction("contain")} />
                      <ContextAction label={t("resetCrop")} icon="rotate" onClick={() => runContextAction("reset-crop")} />
                      <ContextAction label={t("replaceImage")} icon="image" onClick={() => runContextAction("replace")} />
                    </>
                  )}
                  {!contextObject.src && contextObject.kind === "frame" && (
                    <ContextAction label={t("addImage")} icon="image" onClick={() => runContextAction("replace")} />
                  )}
                  <div className="my-1 border-t" style={{ borderColor: "var(--line)" }} />
                  <ContextAction label={t("rotateLeft")} icon="rotate" onClick={() => runContextAction("rotate")} />
                  {objects.length > 1 && (
                    <>
                      <ContextAction label={t("bringToFront")} icon="chevron-up" onClick={() => runContextAction("front")} />
                      <ContextAction label={t("sendToBack")} icon="chevron-down" onClick={() => runContextAction("back")} />
                    </>
                  )}
                  <div className="my-1 border-t" style={{ borderColor: "var(--line)" }} />
                  <ContextAction label={t("delete")} icon="trash" danger onClick={() => runContextAction("delete")} />
                </>
              ) : (
                <>
                  {objects.length > 0 && <ContextAction label={t("selectAll")} icon="object-group" onClick={() => runContextAction("select-all")} />}
                  {clipboardRef.current.length > 0 && <ContextAction label={t("paste")} icon="paste" onClick={() => runContextAction("paste")} />}
                  {objects.length > 0 && <div className="my-1 border-t" style={{ borderColor: "var(--line)" }} />}
                  <ContextAction label={t("addFrame")} icon="frame" onClick={() => runContextAction("add-selected-frame")} />
                </>
              )}
            </div>
          ), document.body)}

          <div className="flex flex-wrap items-center justify-between gap-3 mt-3 text-xs text-muted no-print">
            <div className="flex items-center gap-2">
              <span className="font-medium">{t("page")}</span>
              <span className="chip">{prefs.paper} · {t(prefs.orientation)}</span>
              <span>{objectCount} {t("objectCount")}</span>
            </div>
            <div className="flex items-center gap-2 ml-auto">
              <button className="btn btn-ghost !p-1.5" aria-label={t("zoomOut")} title={t("zoomOut")} onClick={() => setZoom((value) => clamp(value - 0.1, 0.5, 2))}>
                <Icon name="minus" />
              </button>
              <input aria-label={t("zoom")} type="range" min="0.5" max="2" step="0.05" value={zoom} onChange={(event) => setZoom(Number(event.target.value))} className="w-24 md:w-32" />
              <span className="num w-11 text-right">{Math.round(zoom * 100)}%</span>
              <button className="btn btn-ghost !p-1.5" aria-label={t("zoomIn")} title={t("zoomIn")} onClick={() => setZoom((value) => clamp(value + 0.1, 0.5, 2))}>
                <Icon name="plus" />
              </button>
              <button className="btn btn-secondary !px-2.5 !py-1.5 text-xs" onClick={() => setZoom(1)}>{t("zoomFit")}</button>
            </div>
          </div>
        </section>

        <aside className="space-y-4 no-print lg:col-span-2 xl:col-span-1">
          <div className="card p-1.5 grid grid-cols-3 gap-1" role="tablist" aria-label={t("inspector")}>
            {([
              { id: "page", label: t("paper"), icon: "file-pdf" },
              { id: "position", label: t("position"), icon: "expand" },
              { id: "layers", label: t("layers"), icon: "object-group" },
            ] as const).map((tab) => (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={inspectorTab === tab.id}
                onClick={() => setInspectorTab(tab.id)}
                className={"rounded-lg px-2 py-2 flex items-center justify-center gap-1.5 text-xs font-medium transition-snappy " + (inspectorTab === tab.id ? "bg-[rgba(156,28,38,.09)] text-[color:var(--brand)]" : "text-muted hover:bg-[color:var(--canvas)]")}
              >
                <Icon name={tab.icon} />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          {inspectorTab === "page" && (
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
                <button key={orientation} onClick={() => changeOrientationMode(orientation)} className={"rounded-lg py-2 text-xs font-semibold border capitalize transition-snappy " + (prefs.orientation === orientation ? "bg-[color:var(--brand)] text-white border-[color:var(--brand)]" : "border-[color:var(--line)] hover:bg-[color:var(--canvas)]")}>
                  <Icon name={orientation === "portrait" ? "mobile" : "image"} className="mr-1" />{t(orientation)}
                </button>
              ))}
            </div>
            <p className="text-[11px] text-muted leading-relaxed">{t("orientationPrintHint")}</p>
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
          )}

          {inspectorTab === "position" && (
          <section className="card p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="label">{t("selectedObject")}</div>
              {selected && <span className="text-[11px] text-muted truncate max-w-[130px]">{selectedCount > 1 ? selectedCount + " " + t("selectedCount") : selected.name}</span>}
            </div>
            {!selected ? (
              <p className="text-sm text-muted">{t("noSelection")}</p>
            ) : selectedCount > 1 ? (
              <p className="rounded-lg p-3 text-xs text-muted leading-relaxed" style={{ background: "var(--canvas)" }}>
                {t("multipleSelectionHint")}
              </p>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-2">
                  <NumberField label={t("xPosition")} value={selected.x} step={precise ? 0.1 : 1} onChange={(value) => updateSelected({ x: clamp(value, 0, paperWidth - selected.width) })} />
                  <NumberField label={t("yPosition")} value={selected.y} step={precise ? 0.1 : 1} onChange={(value) => updateSelected({ y: clamp(value, 0, paperHeight - selected.height) })} />
                  <NumberField label={t("width")} value={selected.width} step={precise ? 0.1 : 1} onChange={(value) => updateSelected({ width: clamp(value, 8, paperWidth - selected.x) })} />
                  <NumberField label={t("height")} value={selected.height} step={precise ? 0.1 : 1} onChange={(value) => updateSelected({ height: clamp(value, 8, paperHeight - selected.y) })} />
                  <NumberField label={t("rotation")} value={selected.rotation} step={1} suffix="°" onChange={(value) => updateSelected({ rotation: ((value % 360) + 360) % 360 })} />
                </div>
                <div>
                  <div className="label mb-1.5">{t("shape")}</div>
                  <div className="grid grid-cols-4 gap-1">
                    {(["square", "rounded", "circle", "oval"] as FrameShape[]).map((shape) => (
                      <button key={shape} aria-pressed={selected.shape === shape} onClick={() => updateSelectedShape(shape)} className={"border rounded-lg py-2 text-[10px] capitalize " + (selected.shape === shape ? "border-[color:var(--brand)] text-[color:var(--brand)] bg-[rgba(156,28,38,.06)]" : "border-[color:var(--line)]")}>{t(shape)}</button>
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
                    <div className="grid grid-cols-2 gap-1.5 mt-2">
                      <button className={"btn btn-secondary !py-1.5 text-xs " + (cropMode ? "!border-[color:var(--brand)] !text-[color:var(--brand)]" : "")} onClick={() => { setCropMode((value) => !value); updateSelected({ fit: "cover" }); }}>
                        <Icon name="crop" />{cropMode ? t("finishCrop") : t("cropMode")}
                      </button>
                      <button className="btn btn-secondary !py-1.5 text-xs" onClick={() => updateSelected({ cropScale: 1, cropX: 50, cropY: 50 })}>
                        <Icon name="rotate" />{t("resetCrop")}
                      </button>
                    </div>
                    <label className="block mt-2 text-xs text-muted">
                      <span className="flex justify-between mb-1"><span>{t("cropZoom")}</span><span className="num">{(selected.cropScale || 1).toFixed(2)}×</span></span>
                      <input type="range" min="1" max="3" step="0.05" value={selected.cropScale || 1} onChange={(event) => updateSelected({ cropScale: Number(event.target.value), fit: "cover" })} className="w-full" />
                    </label>
                    <label className="block mt-2 text-xs text-muted">
                      <span className="flex justify-between mb-1"><span>{t("cropHorizontal")}</span><span className="num">{Math.round(selected.cropX)}%</span></span>
                      <input type="range" min="0" max="100" step="1" value={selected.cropX} onChange={(event) => updateSelected({ cropX: Number(event.target.value) })} className="w-full" />
                    </label>
                    <label className="block mt-2 text-xs text-muted">
                      <span className="flex justify-between mb-1"><span>{t("cropVertical")}</span><span className="num">{Math.round(selected.cropY)}%</span></span>
                      <input type="range" min="0" max="100" step="1" value={selected.cropY} onChange={(event) => updateSelected({ cropY: Number(event.target.value) })} className="w-full" />
                    </label>
                    {cropMode && <p className="text-[11px] text-muted mt-1">{t("cropDragHint")}</p>}
                  </div>
                )}
                <div className="grid grid-cols-2 gap-2">
                  <button className="btn btn-secondary" onClick={() => changeLayer(1)}><Icon name="chevron-up" />{t("bringForward")}</button>
                  <button className="btn btn-secondary" onClick={() => changeLayer(-1)}><Icon name="chevron-down" />{t("sendBackward")}</button>
                </div>
              </>
            )}
          </section>
          )}

          {inspectorTab === "layers" && (
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
                  <button
                    key={item.id}
                    draggable
                    onClick={() => { setSelectedId(item.id); setSelectedIds([item.id]); }}
                    onDragStart={(event) => {
                      event.dataTransfer.setData("text/plain", item.id);
                      event.dataTransfer.effectAllowed = "move";
                    }}
                    onDragOver={(event) => event.preventDefault()}
                    onDrop={(event) => {
                      event.preventDefault();
                      reorderLayers(event.dataTransfer.getData("text/plain"), item.id);
                    }}
                    className={"w-full text-left flex items-center gap-2 rounded-lg px-2.5 py-2 text-xs cursor-grab active:cursor-grabbing " + (selectedIds.includes(item.id) || selectedId === item.id ? "bg-[rgba(156,28,38,.09)] text-[color:var(--brand)]" : "hover:bg-[color:var(--canvas)]")}
                    title={t("reorderLayers")}
                  >
                    <Icon name="grip" className="text-muted" />
                    <Icon name={item.src ? "image" : "frame"} />
                    <span className="flex-1 truncate">{item.name || (item.src ? t("image") : t("frame"))}</span>
                    <span className="text-[10px] opacity-65">{Math.round(item.width)}×{Math.round(item.height)}</span>
                  </button>
                ))}
              </div>
            )}
          </section>
          )}

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

function ContextAction({ label, icon, onClick, danger = false }: {
  label: string;
  icon: string;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button type="button" role="menuitem" className={"w-full flex items-center gap-2 rounded-lg px-2.5 py-2 text-left text-xs transition-snappy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--brand)] " + (danger ? "text-red-600 hover:bg-red-50" : "hover:bg-[color:var(--canvas)]")} onClick={onClick}>
      <Icon name={icon} /><span>{label}</span>
    </button>
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
