import { useCallback, useEffect, useState } from "react";

// Ubicación actual del dispositivo. El navegador pide permiso la primera vez.
// estado: "pidiendo" | "ok" | "denegada" | "no_disponible" | "sin_senal" | "tardo"
export default function useUbicacion() {
  const [estado, setEstado] = useState("pidiendo");
  const [coords, setCoords] = useState(null);

  const pedir = useCallback(() => {
    if (!("geolocation" in navigator)) {
      setEstado("no_disponible");
      return;
    }
    setEstado("pidiendo");
    const ok = (pos) => {
      setCoords([pos.coords.latitude, pos.coords.longitude]);
      setEstado("ok");
    };
    const fallo = (err) =>
      setEstado(err.code === err.PERMISSION_DENIED ? "denegada" : err.code === err.TIMEOUT ? "tardo" : "sin_senal");
    // Primero con GPS; si no hay (por ejemplo, en una compu), se reintenta con la
    // ubicación aproximada por wifi o red, que no necesita GPS.
    navigator.geolocation.getCurrentPosition(
      ok,
      (err) =>
        err.code === err.PERMISSION_DENIED
          ? fallo(err)
          : navigator.geolocation.getCurrentPosition(ok, fallo, {
              enableHighAccuracy: false,
              timeout: 15000,
              maximumAge: 300000,
            }),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  }, []);

  useEffect(() => {
    pedir();
  }, [pedir]);

  return { estado, coords, pedir };
}
