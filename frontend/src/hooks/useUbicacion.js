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
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords([pos.coords.latitude, pos.coords.longitude]);
        setEstado("ok");
      },
      (err) =>
        setEstado(
          err.code === err.PERMISSION_DENIED ? "denegada" : err.code === err.TIMEOUT ? "tardo" : "sin_senal"
        ),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  }, []);

  useEffect(() => {
    pedir();
  }, [pedir]);

  return { estado, coords, pedir };
}
