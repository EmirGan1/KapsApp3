import { getCachedHardwareFingerprint, getHardwareFingerprint } from "./deviceFingerprint";

// Detect if running in local dev, Capacitor webview, or native container
const isLocal = typeof window !== "undefined" && (
  window.location.hostname === "localhost" ||
  window.location.hostname === "127.0.0.1" ||
  window.location.hostname.endsWith(".localhost") ||
  window.location.protocol === "file:" ||
  window.location.protocol === "capacitor:" ||
  window.location.protocol === "ionic:"
);

const isHttp = typeof window !== "undefined" && window.location.protocol.startsWith("http");

// Frontend API & WebSocket Absolute Address Guarantee (Capacitor / Android WebView / Web)
export const BASE_URL = (
  (import.meta.env.VITE_BACKEND_URL as string | undefined) ||
  (import.meta.env.VITE_API_URL as string | undefined) ||
  (isHttp && !isLocal ? window.location.origin : "https://kapsapp.online")
).replace(/\/$/, "");

export const BACKEND_URL = BASE_URL;

/**
 * Returns absolute API URL
 */
export function getApiUrl(path: string = ""): string {
  if (!path) return BASE_URL;
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return `${BASE_URL}${cleanPath}`;
}

/**
 * Returns Socket.IO URL
 */
export function getSocketUrl(): string {
  return BASE_URL || "https://kapsapp.online";
}

/**
 * Safe fetch JSON wrapper with automatic Physical Hardware Fingerprint headers
 * (`X-Hardware-Fingerprint` & `X-Device-Id`) and instantaneous Device Ban interception.
 */
export async function safeFetchJson<T = any>(input: string, init?: RequestInit): Promise<T> {
  const targetUrl = getApiUrl(input);
  
  // Ensure physical hardware fingerprint is ready
  let hwFingerprint = getCachedHardwareFingerprint();
  if (!hwFingerprint || hwFingerprint === "hw_pending_init") {
    hwFingerprint = await getHardwareFingerprint();
  }

  const headers = new Headers(init?.headers || {});
  if (hwFingerprint) {
    headers.set("X-Hardware-Fingerprint", hwFingerprint);
    headers.set("X-Device-Id", hwFingerprint);
  }

  const res = await fetch(targetUrl, {
    ...init,
    headers
  });

  const contentType = res.headers.get("content-type");

  if (!contentType || !contentType.includes("application/json")) {
    const text = await res.text();
    console.error("Beklenmeyen sunucu yanıtı (HTML/404):", text);
    throw new Error("Sunucuya bağlanılamadı. Backend servisi henüz uyanmamış veya çevrimdışı olabilir.");
  }

  const data = await res.json();
  
  // Hardware / Device Ban interceptor
  if (res.status === 403 && (data.banned || data.type === "device_banned" || data.error === "DEVICE_BANNED")) {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("kaps:device_banned", { detail: data }));
    }
    throw new Error(data.message || data.error || "Bu cihaz platform kurallarının ihlali nedeniyle kalıcı olarak yasaklanmıştır.");
  }

  if (!res.ok) {
    throw new Error(data.message || data.error || "İşlem gerçekleştirilemedi.");
  }

  return data;
}
