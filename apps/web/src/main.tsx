import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App.tsx";
import "@fontsource-variable/archivo/wdth.css";
import "@fontsource-variable/jetbrains-mono/wght.css";
import "./styles.css";

const root = document.getElementById("root");
if (!root) throw new Error("Falta #root");
createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
