import { useEffect, useMemo, useRef, useState } from "react";
import { Icon } from "../../lib/icons";
import { format, storage, uid, type TransactionItem, type Service } from "../../lib/storage";
import { useStorage } from "../../lib/storage-hooks";
import { useToast } from "../../lib/toast";

export default function PriceDeskPage() {
  const { data, update } = useStorage();
  const toast = useToast();
  const [items, setItems] = useState<TransactionItem[]>([]);
  const [cashGiven, setCashGiven] = useState<number>(0);
  const [fastMoneyMode, setFastMoneyMode] = useState(false);
  const [customOpen, setCustomOpen] = useState(false);
  const [customPrice, setCustomPrice] = useState<string>("");
  const [customName, setCustomName] = useState<string>("");
  const [editServices, setEditServices] = useState(false);
  const lastRemoved = useRef<{ items: TransactionItem[]; index: number } | null>(null);

  const total = useMemo(() => items.reduce((s, it) => s + it.price * it.qty, 0), [items]);
  const change = cashGiven - total;

  useEffect(() => {
    storage.addRecent({ kind: "price", label: "Price Desk opened", meta: format.rupiah(total) });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const addItem = (name: string, price: number, serviceId?: string) => {
    // merge same name+price that was just added
    setItems((list) => {
      const last = list[list.length - 1];
      if (last && last.name === name && last.price === price && !last.note) {
        return [...list.slice(0, -1), { ...last, qty: last.qty + 1 }];
      }
      return [
        ...list,
        { id: uid(), name, price, qty: 1, serviceId, createdAt: Date.now() },
      ];
    });
  };

  const quickAdd = (amount: number) => {
    if (fastMoneyMode) {
      setCashGiven((c) => c + amount);
    } else {
      addItem("Cash", amount);
    }
  };

  const updateQty = (id: string, delta: number) => {
    setItems((list) =>
      list
        .map((it) => (it.id === id ? { ...it, qty: Math.max(1, it.qty + delta) } : it))
        .filter((it) => it.qty > 0)
    );
  };

  const setItemQty = (id: string, qty: number) => {
    setItems((list) => list.map((it) => (it.id === id ? { ...it, qty: Math.max(1, Math.floor(qty) || 1) } : it)));
  };

  const setItemPrice = (id: string, price: number) => {
    setItems((list) => list.map((it) => (it.id === id ? { ...it, price: Math.max(0, Math.round(price)) } : it)));
  };

  const removeItem = (id: string) => {
    const idx = items.findIndex((i) => i.id === id);
    if (idx < 0) return;
    lastRemoved.current = { items: [...items], index: idx };
    setItems((list) => list.filter((it) => it.id !== id));
    toast.push("Item removed");
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
      toast.push("Undone");
    } else if (items.length) {
      lastRemoved.current = { items: [...items], index: items.length - 1 };
      setItems((list) => list.slice(0, -1));
    }
  };

  const clear = () => {
    if (items.length === 0) return;
    lastRemoved.current = { items: [...items], index: 0 };
    setItems([]);
    setCashGiven(0);
    toast.push("Transaction cleared");
  };

  const addCustom = () => {
    const price = format.parse(customPrice);
    if (!customName.trim() || price <= 0) {
      toast.push("Enter name and price", "error");
      return;
    }
    addItem(customName.trim(), price);
    setCustomName("");
    setCustomPrice("");
    setCustomOpen(false);
  };

  const saveService = (svc: Service) => {
    update((d) => {
      const exists = d.services.find((s) => s.id === svc.id);
      return {
        ...d,
        services: exists ? d.services.map((s) => (s.id === svc.id ? svc : s)) : [...d.services, svc],
      };
    });
  };

  const deleteService = (id: string) => {
    update((d) => ({ ...d, services: d.services.filter((s) => s.id !== id) }));
  };

  const copyTotal = () => {
    navigator.clipboard?.writeText(`${format.rupiah(total)}`).then(() => toast.push("Total copied"));
  };

  // Keyboard: numeric quick money via Numpad numbers mapped via Shift? Too complex. Skip.

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-end justify-between mb-5 gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Price Desk</h1>
          <p className="text-sm text-muted mt-1">Answer "How much?" with one hand.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setFastMoneyMode((v) => !v)}
            className={`btn ${fastMoneyMode ? "btn-primary" : "btn-secondary"}`}
            title="Toggle fast money check mode"
          >
            <Icon name="cash" /> {fastMoneyMode ? "Cash mode: on" : "Cash mode"}
          </button>
          <button onClick={() => setEditServices((v) => !v)} className="btn btn-secondary">
            <Icon name={editServices ? "check" : "edit"} /> {editServices ? "Done" : "Edit services"}
          </button>
        </div>
      </div>

      <div className="grid md:grid-cols-[340px_1fr_300px] gap-4">
        {/* Services / Quick money */}
        <section className="card p-4 space-y-4 h-fit md:sticky md:top-20 order-2 md:order-1">
          <div>
            <div className="label mb-2">Services</div>
            <div className="grid grid-cols-2 gap-2">
              {data.services.map((s) => (
                <div key={s.id} className="relative group">
                  <button
                    onClick={() => {
                      if (editServices) return;
                      addItem(s.name, s.price, s.id);
                    }}
                    className={`w-full rounded-xl border text-left px-3 py-3 transition-snappy ${
                      editServices ? "cursor-default" : "hover:border-[color:var(--brand)] hover:text-[color:var(--brand)]"
                    }`}
                    style={{ borderColor: "var(--line)", background: "var(--surface)" }}
                  >
                    <div className="text-[11px] text-muted uppercase tracking-wide">
                      {editServices ? "Tap to edit" : "Tap to add"}
                    </div>
                    <div className="font-semibold text-sm truncate mt-0.5">{s.name}</div>
                    <div className="num text-sm mt-0.5" style={{ color: "var(--brand)" }}>{format.rupiah(s.price)}</div>
                  </button>
                  {editServices && (
                    <ServiceEditor
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
                    const svc: Service = { id: "svc-" + uid(), name: "New service", price: 1000 };
                    saveService(svc);
                  }}
                  className="w-full rounded-xl border border-dashed px-3 py-3 text-sm text-muted hover:text-[color:var(--brand)] hover:border-[color:var(--brand)] transition-snappy"
                  style={{ borderColor: "var(--line)" }}
                >
                  <Icon name="plus" /> Add service
                </button>
              )}
              {!editServices && (
                <button
                  onClick={() => setCustomOpen(true)}
                  className="w-full rounded-xl border border-dashed px-3 py-3 text-sm text-muted hover:text-[color:var(--brand)] hover:border-[color:var(--brand)] transition-snappy"
                  style={{ borderColor: "var(--line)" }}
                >
                  <Icon name="plus" /> Custom
                </button>
              )}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="label">Quick money</div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {data.settings.quickMoney.map((amt) => (
                <button
                  key={amt}
                  onClick={() => quickAdd(amt)}
                  className="money-btn num"
                >
                  {format.number(amt)}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Transaction */}
        <section className="card order-1 md:order-2">
          <div className="px-4 py-3 flex items-center justify-between border-b" style={{ borderColor: "var(--line)" }}>
            <div className="font-semibold flex items-center gap-2">
              <Icon name="cash" /> Transaction
            </div>
            <div className="flex items-center gap-1">
              <button onClick={undo} className="btn btn-ghost !py-1.5 !px-2 text-xs" title="Undo (last)">
                <Icon name="undo" /> Undo
              </button>
              <button onClick={clear} className="btn btn-danger !py-1.5 !px-2 text-xs" title="Clear all">
                <Icon name="trash" /> Clear
              </button>
            </div>
          </div>

          {items.length === 0 ? (
            <div className="py-16 px-6 text-center">
              <div className="w-14 h-14 mx-auto rounded-full flex items-center justify-center mb-3" style={{ background: "color-mix(in srgb, var(--brand) 10%, transparent)", color: "var(--brand)" }}>
                <Icon name="calculator" size="lg" />
              </div>
              <div className="font-semibold">Ready to calculate</div>
              <p className="text-sm text-muted mt-1 max-w-sm mx-auto">
                Tap a service, press a quick money button, or type a custom price. No confirmations — it just adds.
              </p>
            </div>
          ) : (
            <ul className="divide-y" style={{ borderColor: "var(--line)" }}>
              {items.map((it) => (
                <li key={it.id} className="px-4 py-3 flex items-center gap-3 group">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm truncate">{it.name}</span>
                      <button
                        className="opacity-0 group-hover:opacity-100 text-muted hover:text-[color:var(--brand)] text-xs transition"
                        onClick={() => duplicateItem(it.id)}
                        title="Duplicate"
                      >
                        <Icon name="copy" />
                      </button>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex items-center border rounded-md text-xs" style={{ borderColor: "var(--line)" }}>
                        <button className="w-7 h-7 flex items-center justify-center hover:bg-[rgba(26,26,27,0.04)]" onClick={() => updateQty(it.id, -1)}><Icon name="minus" size="2xs" /></button>
                        <input
                          type="text"
                          inputMode="numeric"
                          className="w-10 text-center bg-transparent outline-none num font-semibold text-xs"
                          value={it.qty}
                          onChange={(e) => setItemQty(it.id, Number(e.target.value.replace(/[^0-9]/g, "")))}
                        />
                        <button className="w-7 h-7 flex items-center justify-center hover:bg-[rgba(26,26,27,0.04)]" onClick={() => updateQty(it.id, 1)}><Icon name="plus" size="2xs" /></button>
                      </div>
                      <span className="text-muted text-xs">×</span>
                      <div className="flex items-center gap-1">
                        <span className="text-muted text-xs">Rp</span>
                        <input
                          type="text"
                          inputMode="numeric"
                          className="w-20 bg-transparent outline-none num text-xs font-medium"
                          value={format.number(it.price)}
                          onChange={(e) => setItemPrice(it.id, format.parse(e.target.value))}
                        />
                      </div>
                      <button onClick={() => removeItem(it.id)} className="ml-auto text-muted hover:text-[color:#b42318] text-xs" title="Remove">
                        <Icon name="trash" />
                      </button>
                    </div>
                  </div>
                  <div className="text-right num font-bold text-base">{format.rupiah(it.price * it.qty)}</div>
                </li>
              ))}
            </ul>
          )}

          {/* Total bar */}
          <div className="px-4 py-4 border-t flex items-center justify-between" style={{ borderColor: "var(--line)", background: "color-mix(in srgb, var(--brand) 4%, transparent)" }}>
            <div>
              <div className="text-xs uppercase tracking-wide text-muted">Total</div>
              <div className="num text-3xl md:text-4xl font-extrabold tracking-tight">
                {format.rupiah(total)}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={copyTotal} className="btn btn-secondary" title="Copy total">
                <Icon name="copy" /> Copy
              </button>
            </div>
          </div>
        </section>

        {/* Cash check */}
        <aside className="card p-4 space-y-3 h-fit md:sticky md:top-20 order-3">
          <div className="label">Cash check</div>
          <div>
            <div className="text-xs text-muted mb-1">Amount received</div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted">Rp</span>
              <input
                type="text"
                inputMode="numeric"
                className="input num font-bold text-lg"
                placeholder="0"
                value={cashGiven ? format.number(cashGiven) : ""}
                onChange={(e) => setCashGiven(format.parse(e.target.value))}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setCashGiven(total)}
              className="btn btn-secondary"
            >
              Exact
            </button>
            <button
              onClick={() => setCashGiven(0)}
              className="btn btn-ghost text-muted border"
              style={{ borderColor: "var(--line)" }}
            >
              Reset
            </button>
          </div>
          <hr className="sep" />
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <div className="text-[11px] uppercase text-muted">Expected</div>
              <div className="num font-semibold">{format.rupiah(total)}</div>
            </div>
            <div>
              <div className="text-[11px] uppercase text-muted">Received</div>
              <div className="num font-semibold">{format.rupiah(cashGiven)}</div>
            </div>
          </div>
          <div
            className="rounded-xl p-3 text-center"
            style={{
              background: cashGiven === 0
                ? "color-mix(in srgb, var(--ink) 4%, transparent)"
                : change >= 0
                ? "rgba(22,163,74,0.10)"
                : "rgba(180,35,24,0.10)",
              color: cashGiven === 0 ? "var(--muted)" : change >= 0 ? "#15803d" : "#b42318",
            }}
          >
            <div className="text-[11px] uppercase tracking-wide">
              {cashGiven === 0 ? "Change" : change >= 0 ? "Change" : "Short"}
            </div>
            <div className="num text-2xl font-bold">
              {cashGiven === 0 ? "—" : format.rupiah(Math.abs(change))}
            </div>
          </div>
          <div className="text-[11px] text-muted text-center leading-relaxed pt-1">
            Tip: turn on <b>Cash mode</b> so quick-money buttons add to cash received.
          </div>
        </aside>
      </div>

      {customOpen && (
        <CustomEntry
          name={customName}
          price={customPrice}
          onName={setCustomName}
          onPrice={setCustomPrice}
          onCancel={() => setCustomOpen(false)}
          onAdd={addCustom}
        />
      )}
    </div>
  );
}

function ServiceEditor({
  svc,
  onSave,
  onDelete,
}: {
  svc: Service;
  onSave: (s: Service) => void;
  onDelete: () => void;
}) {
  const [name, setName] = useState(svc.name);
  const [price, setPrice] = useState(String(svc.price));
  return (
    <div className="absolute inset-0 card p-2.5 flex flex-col gap-1.5 z-10">
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
          onClick={() => onSave({ ...svc, name: name.trim() || svc.name, price: Number(price) || svc.price })}
        >
          Save
        </button>
        <button className="btn btn-danger !py-1 !px-2 text-xs" onClick={onDelete} title="Delete service">
          <Icon name="trash" />
        </button>
      </div>
    </div>
  );
}

function CustomEntry({
  name,
  price,
  onName,
  onPrice,
  onCancel,
  onAdd,
}: {
  name: string;
  price: string;
  onName: (s: string) => void;
  onPrice: (s: string) => void;
  onCancel: () => void;
  onAdd: () => void;
}) {
  return (
    <div className="fixed inset-0 z-40 backdrop flex items-end md:items-center justify-center no-print fade-in p-0 md:p-4" onClick={onCancel}>
      <div className="card w-full max-w-sm sheet md:!rounded-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="px-5 py-4 flex items-center justify-between border-b" style={{ borderColor: "var(--line)" }}>
          <h3 className="font-semibold">Add custom item</h3>
          <button className="btn btn-ghost !p-2" onClick={onCancel} aria-label="Close"><Icon name="xmark" /></button>
        </div>
        <div className="p-5 space-y-3">
          <div>
            <div className="label mb-1">Name</div>
            <input autoFocus className="input" value={name} onChange={(e) => onName(e.target.value)} placeholder="e.g. Jilid, Design" />
          </div>
          <div>
            <div className="label mb-1">Price (Rp)</div>
            <input
              className="input num font-semibold"
              inputMode="numeric"
              value={price}
              onChange={(e) => onPrice(e.target.value.replace(/[^0-9]/g, ""))}
              placeholder="0"
              onKeyDown={(e) => e.key === "Enter" && onAdd()}
            />
          </div>
        </div>
        <div className="px-5 py-3 border-t flex items-center justify-end gap-2" style={{ borderColor: "var(--line)" }}>
          <button className="btn btn-secondary" onClick={onCancel}>Cancel</button>
          <button className="btn btn-primary" onClick={onAdd}><Icon name="plus" /> Add item</button>
        </div>
      </div>
    </div>
  );
}
