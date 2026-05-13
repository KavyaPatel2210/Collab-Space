  import { createRoot } from "react-dom/client";
  import App from "./app/App.tsx";
  import "./styles/index.css";

  // Register Service Worker for PWA
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js').then(
        (registration) => console.log('ServiceWorker registration successful with scope: ', registration.scope),
        (err) => console.log('ServiceWorker registration failed: ', err)
      );
    });
  }

  createRoot(document.getElementById("root")!).render(<App />);