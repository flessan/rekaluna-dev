import { useEffect, useMemo, useRef, useState } from "react";
import { Icon } from "../../lib/icons";
import { fmt, storage, uid } from "../../lib/storage";
import { useStorage } from "../../hooks/useStorage";
import { useToast } from "../../lib/toast";
import type { PrintService, TransactionItem } from "../../types";

export default function PriceDeskPage() {
  const { data, update } = useStorage();
  const toast = useToast();

  const [items, setItems] = useState<TransactionItem[]>([]);
  const [cashGiven, setCashGiven] = useState<number>(0);
  const [counterMode, setCounterMode] = useState(data.settings.counterMode ?? false);
  const [editServices, setEditServices] = useState(false);
  const [smartInput, setSmartInput] = useState("");
  const [customOpen, setCustomOpen] = useState(false);
  const [customName, setCustomName] = useState("");
  const [customPrice, setCustomPrice] = useState("");

  const lastRemoved = useRef<{ items: TransactionItem[]; index: number } | null>(null);

  const total = useMemo(
    () => items.reduce((s: number, it: TransactionItem) => s + it.price * it.qty, 0),
    [items]
  );
  const change = cashGiven - total;

  useEffect(() => {
    storage.addRecent({
      kind: "price",
      label: "Price Desk opened",
    });
  }, []);

  // ── Item management ──

  const addItem = (name: string, price: number, serviceId?: string) => {
    setItems((list) => {
      const last = list[list.length - 1];
      if (last && last.name === name && last.price === price && !last.note) {
        return [...list.slice(0, -1), { ...last, qty: last.qty + 1 }];
      }
      return [
        ...list,
        {
          id: uid(),
          name,
          price,
          qty: 1,
          serviceId,
          createdAt: Date.now(),
        },
      ];
    });
  };

  const quickAddMoney = (amount: number) => {
    addItem("Quick Item", amount);
  };

  const updateQty = (id: string, delta: number) => {
    setItems((list) =>
      list
        .map((it) =>
          it.id === id ? { ...it, qty: Math.max(1, it.qty + delta) } : it
        )
        .filter((it) => it.qty > 0)
    );
  };

  const setItemQty = (id: string, qty: number) => {
    setItems((list) =>
      list.map((it) =>
        it.id === id ? { ...it, qty: Math.max(1, Math.floor(qty) || 1) } : it
      )
    );
  };

  const setItemPrice = (id: string, price: number) => {
    setItems((list) =>
      list.map((it) =>
        it.id === id ? { ...it, price: Math.max(0, Math.round(price)) } : it
      )
    );
  };

  const removeItem = (id: string) => {
    const idx = items.findIndex((i) => i.id === id);
    if (idx < 0) return;
    lastRemoved.current = { items: [...items], index: idx };
    setItems((list) => list.filter((it) => it.id !== id));
  };

  const duplicateItem = (id: string) => {
    setItems((list) => {
      const it = list.find((i) => i.id === id);
      if (!it) return list;
      return [...list, { ...it, id: uid(), createdAt: Date.now() }];
    });
  };

  const undo = () => {
    if (lastRemoved.current) {
      setItems(lastRemoved.current.items);
      lastRemoved.current = null;
    } else if (items.length) {
      lastRemoved.current = { items: [...items], index: items.length - 1 };
      setItems((list) => list.slice(0, -1));
    }
  };

  const clearAll = () => {
    if (items.length === 0) return;
    lastRemoved.current = { items: [...items], index: 0 };
    setItems([]);
    setCashGiven(0);
    toast.push("Transaction cleared");
  };

  // ── Service editing ──

  const saveService = (svc: PrintService) => {
    update((d) => {
      const exists = d.services.find((s: PrintService) => s.id === svc.id);
      return {
        ...d,
        services: exists
          ? d.services.map((s: PrintService) => (s.id === svc.id ? svc : s))
          : [...d.services, svc],
      };
    });
  };

  const deleteService = (id: string) => {
    update((d) => ({ ...d, services: d.services.filter((s: PrintService) => s.id !== id) }));
  };

  // ── Smart input ──

  const handleSmartInput = () => {
    const q = smartInput.trim().toLowerCase();
    if (!q) return;

    const quantityMatch = q.match(/^(\d+)\s*(?:x\s*)?/);
    const qty = quantityMatch ? parseInt(quantityMatch[1], 10) : 1;
    const rest = q.replace(quantityMatch?.[0] ?? "", "").trim();

    const matchedService = data.services.find(
      (s: PrintService) =>
        s.name.toLowerCase().includes(rest) ||
        rest.includes(s.name.toLowerCase())
    );

    if (matchedService) {
      for (let i = 0; i < qty; i++) {
        addItem(matchedService.name, matchedService.price, matchedService.id);
      }
      toast.push(`Added ${qty}× ${matchedService.name}`);
    } else {
      const priceMatch = rest.match(/^([\d,.]+)\s*/);
      if (priceMatch) {
        const price = fmt.parse(priceMatch[1]);
        const name = rest.replace(priceMatch[0], "").trim() || "Custom Item";
        for (let i = 0; i < qty; i++) {
          addItem(name, price);
        }
        toast.push(`Added ${qty}× ${name}`);
      } else if (rest) {
        addItem(rest, 0);
        toast.push(`Added: ${rest} (set price manually)`);
      }
    }
    setSmartInput("");
  };

  // ── Custom entry ──

  const addCustom = () => {
    const price = fmt.parse(customPrice);
    if (!customName.trim() || price <= 0) {
      toast.push("Enter name and price", "error");
      return;
    }
    addItem(customName.trim(), price);
    setCustomName("");
    setCustomPrice("");
    setCustomOpen(false);
  };

  // ── Copy ──

  const copyTotal = () => {
    navigator.clipboard
      ?.writeText(fmt.rupiah(total))
      .then(() => toast.push("Total copied to clipboard"));
  };

  const copyReceipt = () => {
    const lines = items.map(
      (it) => `${it.qty}× ${it.name} @ ${fmt.rupiah(it.price)} = ${fmt.rupiah(it.price * it.qty)}`
    );
    lines.push(`\nTotal: ${fmt.rupiah(total)}`);
    if (cashGiven > 0) {
      lines.push(`Received: ${fmt.rupiah(cashGiven)}`);
      lines.push(`Change: ${fmt.rupiah(Math.abs(change))}`);
    }
    navigator.clipboard
      ?.writeText(lines.join("\n"))
      .then(() => toast.push("Receipt copied to clipboard"));
  };

  // ── Toggle counter mode ──

  const toggleCounterMode = () => {
    const next = !counterMode;
    setCounterMode(next);
    update((d) => ({ ...d, settings: { ...d.settings, counterMode: next } }));
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div
        className={`flex items-end justify-between mb-5 gap-3 flex-wrap ${
          counterMode ? "hidden" : ""
        }`}
      >
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
            Price Desk
          </h1>
          <p className="text-sm text-muted mt-1">
            Answer "How much?" in seconds.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={toggleCounterMode}
            className={`btn ${
              counterMode ? "btn-primary" : "btn-secondary"
            }`}
            title="Counter mode for busy hours"
          >
            <Icon name="gauge" />
            <span className="hidden sm:inline">
              {counterMode ? "Counter Mode: ON" : "Counter Mode"}
            </span>
          </button>
          <button
            onClick={() => setEditServices((v) => !v)}
            className="btn btn-secondary"
          >
            <Icon name={editServices ? "check" : "edit"} />
            <span className="hidden sm:inline">
              {editServices ? "Done" : "Edit Services"}
            </span>
          </button>
        </div>
      </div>

      {/* Counter mode header */}
      {counterMode && (
        <div className="flex items-center justify-between mb-3">
          <div className="num text-3xl md:text-4xl font-extrabold tracking-tight">
            {fmt.rupiah(total)}
          </div>
          <button
            onClick={toggleCounterMode}
            className="btn btn-ghost text-sm"
          >
            <Icon name="xmark" /> Exit Counter
          </button>
        </div>
      )}

      {/* Smart input */}
      {!counterMode && (
        <div
          className="card p-3 mb-4 flex items-center gap-2"
          style={{ borderColor: "var(--brand)", borderWidth: 1 }}
        >
          <span style={{ color: "var(--brand)" }}>
            <Icon name="bolt" />
          </span>
          <input
            className="flex-1 bg-transparent outline-none text-sm"
            placeholder='Quick add — "10 color print" or "5 x 5000 binding"'
            value={smartInput}
            onChange={(e) => setSmartInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSmartInput();
            }}
          />
          <button
            onClick={handleSmartInput}
            className="btn btn-primary !py-1.5 !px-3 text-xs"
          >
            Add
          </button>
        </div>
      )}

      {/* Main grid */}
      <div className="grid md:grid-cols-[320px_1fr_300px] gap-4">
        {/* Services + Quick Money */}
        <section
          className={`card p-4 space-y-4 h-fit md:sticky md:top-20 ${
            counterMode ? "hidden md:block" : ""
          }`}
        >
          {/* Services */}
          <div>
            <div className="label mb-2">Services</div>
            <div className="grid grid-cols-2 gap-2">
              {data.services.map((s: PrintService) => (
                <div key={s.id} className="relative">
                  <button
                    onClick={() => {
                      if (editServices) return;
                      addItem(s.name, s.price, s.id);
                    }}
                    className={`w-full rounded-xl border text-left px-3 py-3 transition-snappy ${
                      editServices
                        ? "cursor-default"
                        : "hover:border-[color:var(--brand)] active:scale-[0.98]"
                    }`}
                    style={{
                      borderColor: "var(--line)",
                      background: "var(--surface)",
                    }}
                  >
                    <div
                      className={`text-[11px] text-muted uppercase tracking-wide ${
                        editServices ? "text-brand" : ""
                      }`}
                    >
                      {editServices ? "Tap to edit" : "Tap to add"}
                    </div>
                    <div className="font-semibold text-sm truncate mt-0.5">
                      {s.name}
                    </div>
                    <div
                      className="num text-sm mt-0.5 font-medium"
                      style={{ color: "var(--brand)" }}
                    >
                      {fmt.rupiah(s.price)}
                    </div>
                  </button>
                  {editServices && (
                    <ServiceEditorPopup
                      svc={s}
                      onSave={saveService}
                      onDelete={() => deleteService(s.id)}
                    />
                  )}
                </div>
              ))}
              {editServices && (
                <button
                  onClick={() => {
                    const svc: PrintService = {
                      id: "svc-" + uid(),
                      name: "New Service",
                      price: 1000,
                    };
                    saveService(svc);
                  }}
                  className="w-full rounded-xl border border-dashed px-3 py-3 text-sm text-muted hover:text-brand hover:border-[color:var(--brand)] transition-snappy"
                  style={{ borderColor: "var(--line)" }}
                >
                  <Icon name="plus" /> Add
                </button>
              )}
              {!editServices && (
                <button
                  onClick={() => setCustomOpen(true)}
                  className="w-full rounded-xl border border-dashed px-3 py-3 text-sm text-muted hover:text-brand hover:border-[color:var(--brand)] transition-snappy"
                  style={{ borderColor: "var(--line)" }}
                >
                  <Icon name="plus" /> Custom
                </button>
              )}
            </div>
          </div>

          {/* Quick money buttons */}
          <div>
            <div className="label mb-2">Quick Amounts</div>
            <div
              className={`grid gap-2 ${
                counterMode ? "grid-cols-2" : "grid-cols-3"
              }`}
            >
              {data.settings.quickMoney.map((amt: number) => (
                <button
                  key={amt}
                  onClick={() => quickAddMoney(amt)}
                  className="money-btn num"
                >
                  {fmt.number(amt)}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Transaction list */}
        <section className="card">
          {/* Toolbar */}
          <div
            className="px-4 py-3 flex items-center justify-between border-b"
            style={{ borderColor: "var(--line)" }}
          >
            <div className="font-semibold flex items-center gap-2">
              <Icon name="receipt" className="text-muted" />
              Transaction
              {items.length > 0 && (
                <span
                  className="text-xs px-2 py-0.5 rounded-full font-normal"
                  style={{
                    background: "color-mix(in srgb, var(--brand) 10%, transparent)",
                    color: "var(--brand)",
                  }}
                >
                  {items.length}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={undo}
                className="btn btn-ghost !py-1.5 !px-2 text-xs"
                title="Undo"
              >
                <Icon name="undo" />
              </button>
              <button
                onClick={clearAll}
                className="btn btn-ghost !py-1.5 !px-2 text-xs text-red-600"
                title="Clear all"
              >
                <Icon name="trash" />
              </button>
            </div>
          </div>

          {/* Empty state */}
          {items.length === 0 && (
            <div className="py-16 px-6 text-center">
              <div
                className="w-16 h-16 mx-auto rounded-2xl flex items-center justify-center mb-4"
                style={{
                  background: "color-mix(in srgb, var(--brand) 10%, transparent)",
                  color: "var(--brand)",
                }}
              >
                <Icon name="calculator" size="lg" />
              </div>
              <div className="font-semibold text-lg">Ready to Calculate</div>
              <p className="text-sm text-muted mt-1 max-w-sm mx-auto">
                Tap a service or quick amount to start. No confirmations — it
                just adds.
              </p>
            </div>
          )}

          {/* Items */}
          {items.length > 0 && (
            <ul className="divide-y" style={{ borderColor: "var(--line)" }}>
              {items.map((it: TransactionItem, idx: number) => (
                <li
                  key={it.id}
                  className="px-4 py-3 flex items-center gap-3 group hover:bg-[rgba(26,26,27,0.02)]"
                >
                  <span
                    className="text-xs text-muted w-6 tabular-nums"
                  >
                    {idx + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm truncate">
                        {it.name}
                      </span>
                      <button
                        className="opacity-0 group-hover:opacity-100 text-muted hover:text-brand text-xs transition"
                        onClick={() => duplicateItem(it.id)}
                        title="Duplicate"
                      >
                        <Icon name="clone" />
                      </button>
                    </div>
                    <div className="flex items-center gap-2 mt-1.5">
                      {/* Qty controls */}
                      <div
                        className="flex items-center border rounded-md text-xs"
                        style={{ borderColor: "var(--line)" }}
                      >
                        <button
                          className="w-7 h-7 flex items-center justify-center hover:bg-[rgba(26,26,27,0.04)]"
                          onClick={() => updateQty(it.id, -1)}
                        >
                          <Icon name="minus" size="2xs" />
                        </button>
                        <input
                          type="text"
                          inputMode="numeric"
                          className="w-10 text-center bg-transparent outline-none num font-semibold text-xs"
                          value={it.qty}
                          onChange={(e) =>
                            setItemQty(
                              it.id,
                              Number(e.target.value.replace(/[^0-9]/g, ""))
                            )
                          }
                        />
                        <button
                          className="w-7 h-7 flex items-center justify-center hover:bg-[rgba(26,26,27,0.04)]"
                          onClick={() => updateQty(it.id, 1)}
                        >
                          <Icon name="plus" size="2xs" />
                        </button>
                      </div>
                      <span className="text-muted text-xs">×</span>
                      <span className="text-muted text-xs">Rp</span>
                      <input
                        type="text"
                        inputMode="numeric"
                        className="w-20 bg-transparent outline-none num text-xs font-medium"
                        value={fmt.number(it.price)}
                        onChange={(e) =>
                          setItemPrice(it.id, fmt.parse(e.target.value))
                        }
                      />
                      <button
                        onClick={() => removeItem(it.id)}
                        className="ml-auto text-muted hover:text-red-500 text-xs opacity-0 group-hover:opacity-100 transition"
                        title="Remove"
                      >
                        <Icon name="trash" />
                      </button>
                    </div>
                  </div>
                  <div
                    className={`text-right num font-bold ${
                      counterMode ? "text-xl" : "text-base"
                    } shrink-0`}
                  >
                    {fmt.rupiah(it.price * it.qty)}
                  </div>
                </li>
              ))}
            </ul>
          )}

          {/* Total bar */}
          {items.length > 0 && (
            <div
              className={`px-4 py-4 border-t flex items-center justify-between ${
                counterMode ? "hidden" : ""
              }`}
              style={{
                borderColor: "var(--line)",
                background: "color-mix(in srgb, var(--brand) 4%, transparent)",
              }}
            >
              <div>
                <div className="text-xs uppercase tracking-wide text-muted">
                  Total
                </div>
                <div className="num text-3xl md:text-4xl font-extrabold tracking-tight">
                  {fmt.rupiah(total)}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={copyReceipt}
                  className="btn btn-ghost !py-1.5 text-xs"
                  title="Copy receipt"
                >
                  <Icon name="copy" />
                </button>
                <button
                  onClick={copyTotal}
                  className="btn btn-secondary"
                  title="Copy total"
                >
                  <Icon name="copy" /> Copy
                </button>
              </div>
            </div>
          )}
        </section>

        {/* Cash calculator */}
        <aside
          className={`card p-4 space-y-3 h-fit md:sticky md:top-20 ${
            counterMode ? "hidden md:block" : ""
          }`}
        >
          <div className="label">Cash Check</div>
          <div>
            <div className="text-xs text-muted mb-1">Amount Received</div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted">Rp</span>
              <input
                type="text"
                inputMode="numeric"
                className="input num font-bold text-lg"
                placeholder="0"
                value={cashGiven ? fmt.number(cashGiven) : ""}
                onChange={(e) => setCashGiven(fmt.parse(e.target.value))}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setCashGiven(total)}
              className="btn btn-secondary text-sm"
            >
              Exact
            </button>
            <button
              onClick={() => setCashGiven(0)}
              className="btn btn-ghost text-muted text-sm border"
              style={{ borderColor: "var(--line)" }}
            >
              Reset
            </button>
          </div>
          <hr className="sep" />
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <div className="text-[11px] uppercase text-muted">Total</div>
              <div className="num font-semibold">{fmt.rupiah(total)}</div>
            </div>
            <div>
              <div className="text-[11px] uppercase text-muted">Received</div>
              <div className="num font-semibold">
                {fmt.rupiah(cashGiven)}
              </div>
            </div>
          </div>
          <div
            className="rounded-xl p-3 text-center"
            style={{
              background:
                cashGiven === 0
                  ? "color-mix(in srgb, var(--ink) 4%, transparent)"
                  : change >= 0
                    ? "rgba(22,163,74,0.10)"
                    : "rgba(180,35,24,0.10)",
              color:
                cashGiven === 0
                  ? "var(--muted)"
                  : change >= 0
                    ? "#15803d"
                    : "#b42318",
            }}
          >
            <div className="text-[11px] uppercase tracking-wide">
              {cashGiven === 0
                ? "Enter amount"
                : change >= 0
                  ? "Change"
                  : "Short"}
            </div>
            <div className="num text-2xl font-bold">
              {cashGiven === 0 ? "—" : fmt.rupiah(Math.abs(change))}
            </div>
          </div>
        </aside>
      </div>

      {/* Custom item modal */}
      {customOpen && (
        <div
          className="fixed inset-0 z-40 flex items-end md:items-center justify-center no-print fade-in"
          style={{ background: "rgba(10,10,10,0.4)" }}
          onClick={() => setCustomOpen(false)}
        >
          <div
            className="card w-full max-w-sm sheet md:!rounded-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="px-5 py-4 flex items-center justify-between border-b"
              style={{ borderColor: "var(--line)" }}
            >
              <h3 className="font-semibold">Add Custom Item</h3>
              <button
                className="btn btn-ghost !p-2"
                onClick={() => setCustomOpen(false)}
              >
                <Icon name="xmark" />
              </button>
            </div>
            <div className="p-5 space-y-3">
              <div>
                <div className="label mb-1">Name</div>
                <input
                  autoFocus
                  className="input"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  placeholder="e.g. Binding, Design"
                />
              </div>
              <div>
                <div className="label mb-1">Price (Rp)</div>
                <input
                  className="input num font-semibold"
                  inputMode="numeric"
                  value={customPrice}
                  onChange={(e) =>
                    setCustomPrice(e.target.value.replace(/[^0-9]/g, ""))
                  }
                  placeholder="0"
                  onKeyDown={(e) => e.key === "Enter" && addCustom()}
                />
              </div>
            </div>
            <div
              className="px-5 py-3 border-t flex items-center justify-end gap-2"
              style={{ borderColor: "var(--line)" }}
            >
              <button
                className="btn btn-secondary"
                onClick={() => setCustomOpen(false)}
              >
                Cancel
              </button>
              <button className="btn btn-primary" onClick={addCustom}>
                <Icon name="plus" /> Add Item
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Service editor popup ──

function ServiceEditorPopup({
  svc,
  onSave,
  onDelete,
}: {
  svc: PrintService;
  onSave: (s: PrintService) => void;
  onDelete: () => void;
}) {
  const [name, setName] = useState(svc.name);
  const [price, setPrice] = useState(String(svc.price));

  return (
    <div className="absolute inset-0 card p-2.5 flex flex-col gap-1.5 z-10 fade-in">
      <input
        className="input !py-1.5 text-xs"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Service name"
      />
      <input
        className="input !py-1.5 text-xs num"
        value={price}
        inputMode="numeric"
        onChange={(e) => setPrice(e.target.value.replace(/[^0-9]/g, ""))}
        placeholder="Price"
      />
      <div className="flex gap-1">
        <button
          className="btn btn-primary !py-1 !px-2 text-xs flex-1"
          onClick={() =>
            onSave({
              ...svc,
              name: name.trim() || svc.name,
              price: Number(price) || svc.price,
            })
          }
        >
          Save
        </button>
        <button
          className="btn btn-danger !py-1 !px-2 text-xs"
          onClick={onDelete}
          title="Delete service"
        >
          <Icon name="trash" />
        </button>
      </div>
    </div>
  );
}
