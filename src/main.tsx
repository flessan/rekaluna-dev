import { StrictMode, Suspense, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import "./index.css";
import "@fortawesome/fontawesome-svg-core/styles.css";
import { config } from "@fortawesome/fontawesome-svg-core";
import { AppShell } from "./components/AppShell";
import { SettingsModal } from "./components/SettingsModal";
import { MobileSearch, MoreSheet } from "./components/MobileSheets";
import { CommandProvider } from "./lib/commands";
import { ToastProvider } from "./lib/toast";
import { initTheme } from "./lib/theme";
import { Icon } from "./lib/icons";
import { I18nProvider, useI18n } from "./lib/i18n";
import PageLoading from "./components/PageLoading";
import {
  WorkspacePage,
  QuickPrintPage,
  PriceDeskPage,
  ResourcesPage,
  SupportPage,
  AboutPage,
} from "./pages/route-pages";

// Prevent FontAwesome from auto-inserting CSS (we already import it)
config.autoAddCss = false;

function App() {
  const [modal, setModal] = useState<string | null>(null);
  const nav = useNavigate();
  const loc = useLocation();

  useEffect(() => {
    initTheme();
  }, []);

  // Close modal on route change
  useEffect(() => {
    setModal(null);
  }, [loc.pathname]);

  // Scroll to top on route change
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [loc.pathname]);

  // Keep /donate available even when the host serves the SPA fallback instead
  // of the static public/donate/index.html file.
  if (loc.pathname === "/donate" || loc.pathname === "/donate/") {
    return (
      <main
        style={{
          minHeight: "100dvh",
          display: "grid",
          placeItems: "center",
          margin: 0,
          background: "#fff",
        }}
      >
        <img
          src="/qris.svg"
          alt="QRIS donation code"
          width={342}
          height={345}
          style={{
            display: "block",
            width: "min(100vw, 100dvh)",
            maxWidth: "100vw",
            maxHeight: "100dvh",
            height: "auto",
            objectFit: "contain",
          }}
        />
      </main>
    );
  }

  const openModal = (id: string) => setModal(id);
  const closeModal = () => setModal(null);

  return (
    <CommandProvider navigate={(p) => nav(p)} openModal={openModal}>
      <ToastProvider>
        <AppShell onOpenModal={openModal}>
          <Suspense fallback={<PageLoading />}>
            <Routes>
              <Route path="/" element={<WorkspacePage />} />
              <Route path="/print" element={<QuickPrintPage />} />
              <Route path="/price" element={<PriceDeskPage />} />
              <Route path="/resources" element={<ResourcesPage />} />
              <Route path="/support" element={<SupportPage />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </AppShell>

        <SettingsModal open={modal === "settings"} onClose={closeModal} />
        <MobileSearch open={modal === "mobile-search"} onClose={closeModal} />
        <MoreSheet open={modal === "more"} onClose={closeModal} onOpenModal={openModal} />

        <OfflineBanner />
      </ToastProvider>
    </CommandProvider>
  );
}

function NotFound() {
  const nav = useNavigate();
  const { t } = useI18n();
  return (
    <div className="max-w-xl mx-auto text-center py-20">
      <div className="w-16 h-16 mx-auto rounded-2xl flex items-center justify-center mb-4" style={{ background: "color-mix(in srgb, var(--brand) 10%, transparent)", color: "var(--brand)" }}>
        <Icon name="circle-exclamation" size="lg" />
      </div>
      <h1 className="text-2xl font-bold">{t("notFound")}</h1>
      <p className="text-sm text-muted mt-1">{t("pageMissing")}</p>
      <button className="btn btn-primary mt-4" onClick={() => nav("/")}>
        <Icon name="house" /> {t("backWorkspace")}
      </button>
    </div>
  );
}

function OfflineBanner() {
  const { t } = useI18n();
  const [online, setOnline] = useState(typeof navigator === "undefined" ? true : navigator.onLine);
  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, []);
  if (online) return null;
  return (
    <div className="fixed top-3 left-1/2 -translate-x-1/2 z-50 card px-4 py-2 text-sm shadow-pop flex items-center gap-2 fade-in">
      <Icon name="wifi" className="text-muted" />
      {t("offline")}
    </div>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <I18nProvider>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </I18nProvider>
  </StrictMode>
);
