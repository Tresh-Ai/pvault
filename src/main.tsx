import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { registerServiceWorker } from "./lib/register-sw";
import { initTheme } from "./lib/theme";

initTheme();
registerServiceWorker();

createRoot(document.getElementById("root")!).render(<App />);
