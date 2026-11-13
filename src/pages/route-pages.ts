import { lazy } from "react";

export const WorkspacePage = lazy(() => import("./Workspace"));
export const QuickPrintPage = lazy(() => import("../features/quickprint/QuickPrintPage"));
export const PriceDeskPage = lazy(() => import("../features/pricedesk/PriceDeskPage"));
export const ResourcesPage = lazy(() => import("./Resources"));
export const SupportPage = lazy(() => import("./Support"));
export const AboutPage = lazy(() => import("./About"));
