import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Icon } from "../../lib/icons";
import { useStorage } from "../../lib/storage-hooks";
import { storage, format, uid } from "../../lib/storage";

type PaperSize = "A4" | "F4" | "Letter" | "Legal";
type Orientation = "portrait" | "landscape";
type Scaling = "fit" | "fill" | "original";
type Margin = "none" | "small" | "normal" | "large";

interface ImageState {
  src: string;
  width: number;
  height: number;
  name?: string;
  rotation: 0 | 90 | 180 | 270;
}

const PAPER_DIMS: Record<PaperSize, { w: number; h: number }> = {
  A4: { w: 210, h: 297 },
  F4: { w: 215, h: 330 },
  Letter: { w: 215.9, h: 279.4 },
  Legal: { w: 215.9, h: 355.6 },
};

const MARGIN_MM: Record<Margin, number> = {
  none: 0,
  small: 5,
  normal: 10,
  large: 15,
};

export default function QuickPrintPage() {
  const { data, update } = useStorage();
  const prefs = data.settings.print;
  const setPrefs = (patch: Partial<typeof prefs>) =>
    update((d) => ({ ...d, settings: { ...d.settings, print: { ...d.settings.print, ...patch } } }));

  const [image, setImage] = useState<ImageState | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);

  const loadFile = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = () => {
      const src = String(reader.result);
      const img = new Image();
      img.onload = () => {
        setImage({ src, width: img.naturalWidth, height: img.naturalHeight, name: file.name, rotation: 0 });
        storage.addRecent({
          kind: "print",
          label: file.name || "Pasted image",
          meta: `${img.naturalWidth}×${img.naturalHeight}`,
        });
      };
      img.src = src;
    };
    reader.readAsDataURL(file);
  }, []);

  const handlePaste = useCallback(
    (e: ClipboardEvent) => {
      if (document.activeElement?.tagName === "INPUT" || document.activeElement?.tagName === "TEXTAREA") return;
      const items = e.clipboardData?.items;
      if (!items) return;
      for (const item of Array.from(items)) {
        if (item.type.startsWith("image/")) {
          const f = item.getAsFile();
          if (f) {
            loadFile(f);
            e.preventDefault();
            break;
          }
        }
      }
    },
    [loadFile]
  );

  useEffect(() => {
    window.addEventListener("paste", handlePaste as any);
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === "p" || e.key === "P")) {
        if (image) {
          e.preventDefault();
          window.print();
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("paste", handlePaste as any);
      window.removeEventListener("keydown", onKey);
    };
  }, [handlePaste, image]);

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) loadFile(file);
  };

  const rotate = () => {
    setImage((i) => (i ? { ...i, rotation: ((i.rotation + 90) % 360) as 0 | 90 | 180 | 270 } : i));
  };

  const clearImage = () => setImage(null);

  // Compute CSS preview sizing to show print area
  const paper = PAPER_DIMS[prefs.paper];
  const marginMm = MARGIN_MM[prefs.margin];
  const orientedW = prefs.orientation === "portrait" ? paper.w : paper.h;
  const orientedH = prefs.orientation === "portrait" ? paper.h : paper.w;
  const innerW = orientedW - marginMm * 2;
  const innerH = orientedH - marginMm * 2;

  // Scale preview box to fit preview container (max width 520)
  const previewScale = useMemo(() => {
    if (!previewRef.current) return 1.6;
    const cw = Math.min(previewRef.current.clientWidth, 560);
    return (cw - 32) / orientedW; // px per mm
  }, [orientedW, image]);

  const [, setTick] = useState(0);
  useEffect(() => {
    const on = () => setTick((t) => t + 1);
    window.addEventListener("resize", on);
    return () => window.removeEventListener("resize", on);
  }, []);

  const copiesArr = Array.from({ length: prefs.copies }, (_, i) => i);

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-end justify-between mb-5">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Quick Print</h1>
          <p className="text-sm text-muted mt-1">Paste with <span className="kbd">Ctrl V</span>, drag a file, or click to select. Then print.</p>
        </div>
      </div>

      <div className="grid md:grid-cols-[1fr_320px] gap-5">
        {/* Preview / Drop zone */}
        <div
          ref={previewRef}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          className={`card p-5 relative overflow-hidden transition-snappy ${
            dragOver ? "ring-2 ring-[color:var(--brand)]" : ""
          }`}
          style={{ minHeight: 460 }}
        >
          {!image ? (
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full h-full min-h-[420px] rounded-xl flex flex-col items-center justify-center gap-3 border-2 border-dashed text-center px-6"
              style={{ borderColor: "var(--line)", color: "var(--muted)" }}
            >
              <div className="w-14 h-14 rounded-full flex items-center justify-center" style={{ background: "color-mix(in srgb, var(--brand) 10%, transparent)", color: "var(--brand)" }}>
                <Icon name="paste" size="lg" />
              </div>
              <div>
                <div className="text-[color:var(--ink)] font-semibold text-base">No image yet</div>
                <div className="text-sm mt-1">
                  Press <span className="kbd">Ctrl V</span> to paste, drop a file here, or click to browse.
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs mt-2">
                <span className="chip">PNG</span>
                <span className="chip">JPG</span>
                <span className="chip">WEBP</span>
                <span className="chip">BMP</span>
              </div>
            </button>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm">
                <span className="chip"><Icon name="image" size="sm" /> {image.name || "Image"}</span>
                <span className="chip num">{image.width}×{image.height}</span>
                <span className="chip">{prefs.paper} · {prefs.orientation}</span>
                <div className="flex-1" />
                <button onClick={rotate} className="btn btn-secondary !py-1.5 !px-2.5" title="Rotate">
                  <Icon name="rotate" /> Rotate
                </button>
                <button onClick={clearImage} className="btn btn-danger !py-1.5 !px-2.5" title="Remove">
                  <Icon name="trash" /> Remove
                </button>
              </div>

              {/* Preview pages */}
              <div className="flex flex-wrap gap-4 justify-center py-2">
                {copiesArr.map((_, i) => (
                  <div
                    key={i}
                    id={i === 0 ? "print-area" : "print-area-copy"}
                    className="print-area-page bg-white shadow-soft relative"
                    style={{
                      width: orientedW * previewScale,
                      height: orientedH * previewScale,
                      padding: marginMm * previewScale,
                      boxSizing: "border-box",
                    }}
                  >
                    <div
                      className="w-full h-full flex items-center justify-center overflow-hidden"
                      style={{
                        background: "#fff",
                        outline: "1px dashed #e5e7eb",
                        outlineOffset: -1,
                      }}
                    >
                      <img
                        src={image.src}
                        alt="Print preview"
                        style={{
                          transform: `rotate(${image.rotation}deg)`,
                          maxWidth: prefs.scaling === "original" ? "none" : "100%",
                          maxHeight: prefs.scaling === "original" ? "none" : "100%",
                          width:
                            prefs.scaling === "fill"
                              ? "100%"
                              : prefs.scaling === "original"
                              ? `${image.width * previewScale * 0.2645}px`
                              : "auto",
                          height:
                            prefs.scaling === "fill"
                              ? "100%"
                              : prefs.scaling === "original"
                              ? `${image.height * previewScale * 0.2645}px`
                              : "auto",
                          objectFit: prefs.scaling === "fill" ? "cover" : "contain",
                          imageRendering: "auto",
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="text-center text-xs text-muted">
                Print area preview — {orientedW}×{orientedH}mm · margin {prefs.margin} · {prefs.scaling}
              </div>
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) loadFile(f);
              e.target.value = "";
            }}
          />
        </div>

        {/* Settings panel */}
        <aside className="card p-4 space-y-4 h-fit md:sticky md:top-20">
          <div>
            <div className="label mb-2">Paper size</div>
            <div className="grid grid-cols-4 gap-1.5">
              {(["A4", "F4", "Letter", "Legal"] as PaperSize[]).map((p) => (
                <button
                  key={p}
                  onClick={() => setPrefs({ paper: p })}
                  className={`rounded-lg py-2 text-sm font-medium border transition-snappy ${
                    prefs.paper === p
                      ? "bg-[color:var(--brand)] text-white border-[color:var(--brand)]"
                      : "hover:bg-[rgba(26,26,27,0.04)]"
                  }`}
                  style={{ borderColor: "var(--line)" }}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="label mb-2">Orientation</div>
            <div className="grid grid-cols-2 gap-1.5">
              {(["portrait", "landscape"] as Orientation[]).map((o) => (
                <button
                  key={o}
                  onClick={() => setPrefs({ orientation: o })}
                  className={`rounded-lg py-2 text-sm font-medium border capitalize transition-snappy ${
                    prefs.orientation === o
                      ? "bg-[color:var(--brand)] text-white border-[color:var(--brand)]"
                      : "hover:bg-[rgba(26,26,27,0.04)]"
                  }`}
                  style={{ borderColor: "var(--line)" }}
                >
                  <Icon name={o === "portrait" ? "mobile" : "image"} className="mr-1" />
                  {o}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="label mb-2">Copies</div>
            <div className="flex items-center border rounded-lg overflow-hidden" style={{ borderColor: "var(--line)" }}>
              <button
                className="w-10 h-10 flex items-center justify-center hover:bg-[rgba(26,26,27,0.04)]"
                onClick={() => setPrefs({ copies: Math.max(1, prefs.copies - 1) })}
                aria-label="Decrease copies"
              >
                <Icon name="minus" />
              </button>
              <input
                type="number"
                min={1}
                max={99}
                className="flex-1 h-10 text-center num bg-transparent outline-none text-sm font-semibold"
                value={prefs.copies}
                onChange={(e) => {
                  const n = Math.max(1, Math.min(99, Number(e.target.value) || 1));
                  setPrefs({ copies: n });
                }}
              />
              <button
                className="w-10 h-10 flex items-center justify-center hover:bg-[rgba(26,26,27,0.04)]"
                onClick={() => setPrefs({ copies: Math.min(99, prefs.copies + 1) })}
                aria-label="Increase copies"
              >
                <Icon name="plus" />
              </button>
            </div>
          </div>

          <div>
            <div className="label mb-2">Scaling</div>
            <div className="grid grid-cols-3 gap-1.5">
              {(["fit", "fill", "original"] as Scaling[]).map((s) => (
                <button
                  key={s}
                  onClick={() => setPrefs({ scaling: s })}
                  className={`rounded-lg py-2 text-xs font-medium border capitalize transition-snappy ${
                    prefs.scaling === s
                      ? "bg-[color:var(--brand)] text-white border-[color:var(--brand)]"
                      : "hover:bg-[rgba(26,26,27,0.04)]"
                  }`}
                  style={{ borderColor: "var(--line)" }}
                >
                  {s === "fit" ? "Fit" : s === "fill" ? "Fill" : "Original"}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="label mb-2">Margin</div>
            <div className="grid grid-cols-4 gap-1.5">
              {(["none", "small", "normal", "large"] as Margin[]).map((m) => (
                <button
                  key={m}
                  onClick={() => setPrefs({ margin: m })}
                  className={`rounded-lg py-2 text-xs font-medium border capitalize transition-snappy ${
                    prefs.margin === m
                      ? "bg-[color:var(--brand)] text-white border-[color:var(--brand)]"
                      : "hover:bg-[rgba(26,26,27,0.04)]"
                  }`}
                  style={{ borderColor: "var(--line)" }}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          <hr className="sep" />

          <button
            onClick={() => window.print()}
            disabled={!image}
            className="btn btn-primary w-full !py-3 !text-base disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Icon name="print" /> Print {prefs.copies > 1 ? `(${prefs.copies})` : ""}
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="btn btn-secondary w-full"
          >
            <Icon name="folder" /> Select file
          </button>
          <div className="text-[11px] text-muted leading-relaxed text-center pt-1">
            Images stay on this device. Nothing is uploaded.
          </div>
          <div className="text-[11px] text-muted leading-relaxed text-center">
            Inner area: {Math.round(innerW)}×{Math.round(innerH)}mm
          </div>
        </aside>
      </div>

      {/* Print-only styles for multiple copies */}
      <style>{`
        @media print {
          @page { size: ${orientedW}mm ${orientedH}mm; margin: ${marginMm}mm; }
          body { background: white !important; }
          #print-area, #print-area-copy {
            width: ${orientedW}mm !important;
            height: ${orientedH}mm !important;
            padding: ${marginMm}mm !important;
            box-shadow: none !important;
            margin: 0 !important;
            page-break-after: always;
            break-after: page;
          }
          #print-area-copy:last-child { page-break-after: auto; }
          #print-area img, #print-area-copy img { max-width: 100% !important; max-height: 100% !important; }
        }
      `}</style>
      {void uid}
      {void format}
    </div>
  );
}
