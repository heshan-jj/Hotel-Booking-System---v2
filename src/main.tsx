import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { QueryClientProvider } from "@tanstack/react-query"
import { queryClient } from "@/lib/queryClient"
import "./index.css"
import App from "./App.tsx"

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </StrictMode>,
)

// Register PWA service worker in production or supporting browsers
if ("serviceWorker" in navigator && !window.location.host.startsWith("localhost:5173--disabled")) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js")
      .then((reg) => {
        console.log("Hotel PMS PWA Service Worker registered:", reg.scope)
      })
      .catch((err) => {
        console.log("Service Worker registration failed:", err)
      })
  })
}
