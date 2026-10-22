import "leaflet/dist/leaflet.css";
import { useEffect, useMemo, useState } from "react";
import { CircleMarker, MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
import { api } from "../api/client";
import useConexion from "../hooks/useConexion";
import useUbicacion from "../hooks/useUbicacion";
import { TIPOS_CENTRO, iconoCentro, linkComoLlegar } from "../utils/centros";
import { formatDistancia, ordenarCentros } from "../utils/distancia";

// Centro del Gran Mendoza (Ciudad de Mendoza).
const MENDOZA = [-32.8895, -68.8458];
const CACHE_KEY = "gestar.centros";

// Qué decirle a la paciente según por qué no hay ubicación.
const MENSAJES_UBICACION = {
  denegada: {
    titulo: "No tenemos permiso para ver tu ubicación",
    texto:
      "Para activarlo, tocá el candado al lado de la dirección de la página, buscá \"Ubicación\" y elegí \"Permitir\". Mientras tanto podés ver todos los centros.",
  },
  sin_senal: {
    titulo: "No pudimos encontrar tu ubicación",
    texto: "Revisá que el GPS o la ubicación del celular estén activados y volvé a intentar.",
  },
  tardo: {
    titulo: "Tu ubicación está tardando demasiado",
    texto: "Puede pasar con poca señal. Probá de nuevo en un lugar abierto o cerca de una ventana.",
  },
  no_disponible: {
    titulo: "Tu navegador no permite obtener la ubicación",
    texto: "Podés ver todos los centros igual, ordenados por nombre.",
  },
};

function leerCache() {
  try {
    return JSON.parse(localStorage.getItem(CACHE_KEY));
  } catch {
    return null;
  }
}

function Aviso({ color, titulo, children, accion, onAccion }) {
  const colores = {
    amber: "bg-amber-50 border-amber-200 text-amber-800",
    red: "bg-red-50 border-red-200 text-red-800",
  };
  return (
    <div role="alert" className={`border rounded-xl px-4 py-3 text-sm flex flex-wrap items-start gap-3 ${colores[color]}`}>
      <div className="flex-1 min-w-[12rem]">
        <p className="font-medium">{titulo}</p>
        {children && <p className="mt-0.5 opacity-90">{children}</p>}
      </div>
      {accion && (
        <button onClick={onAccion} className="shrink-0 text-sm font-medium underline underline-offset-2">
          {accion}
        </button>
      )}
    </div>
  );
}

// Mueve el mapa cuando cambia el punto a mostrar.
function Recentrar({ punto, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (punto) map.setView(punto, zoom);
  }, [punto, zoom, map]);
  return null;
}

// Lleva el mapa al centro elegido.
function Enfocar({ centro }) {
  const map = useMap();
  useEffect(() => {
    if (centro) map.flyTo([centro.lat, centro.lng], Math.max(map.getZoom(), 15), { duration: 0.6 });
  }, [centro, map]);
  return null;
}

function Direccion({ centro }) {
  if (!centro.direccion) return <span className="text-gray-400">Dirección no informada</span>;
  return (
    <>
      {centro.direccion}
      {centro.localidad && `, ${centro.localidad}`}
      {centro.direccion_aproximada && <span className="text-gray-400"> (aproximada)</span>}
    </>
  );
}

function Horario({ centro }) {
  return centro.horario ? (
    <>🕐 {centro.horario}</>
  ) : (
    <span className="text-gray-400">🕐 Horario no informado: consultá antes de ir</span>
  );
}

// Tarjeta con la información del centro tocado en el mapa.
function TarjetaCentro({ centro, onCerrar }) {
  const t = TIPOS_CENTRO[centro.tipo];
  return (
    <div className="absolute bottom-3 left-3 right-3 z-[1000] max-h-[70%] overflow-y-auto bg-white rounded-xl shadow-lg border border-gray-100 p-4 text-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <span className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full ${t?.chip}`}>
            {t?.icono} {t?.nombre}
          </span>
          <p className="font-semibold text-gray-800 mt-1">{centro.nombre}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {centro.distancia !== null && (
            <span className="text-sm font-medium text-gray-700">{formatDistancia(centro.distancia)}</span>
          )}
          <button
            onClick={onCerrar}
            aria-label="Cerrar"
            className="w-7 h-7 rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            ✕
          </button>
        </div>
      </div>
      <div className="mt-2 space-y-0.5 text-gray-600">
        <p>
          📍 <Direccion centro={centro} />
        </p>
        <p>
          <Horario centro={centro} />
        </p>
        {centro.telefono && (
          <p>
            📞{" "}
            <a href={`tel:${centro.telefono.replace(/\s/g, "")}`} className="text-pink-600 hover:text-pink-800">
              {centro.telefono}
            </a>
          </p>
        )}
      </div>
      <a
        href={linkComoLlegar(centro)}
        target="_blank"
        rel="noreferrer"
        className="inline-block mt-3 bg-pink-600 hover:bg-pink-700 text-white text-sm font-medium px-4 py-2 rounded-lg"
      >
        Cómo llegar
      </a>
    </div>
  );
}

export default function CentrosMapa() {
  const { estado, coords, pedir } = useUbicacion();
  const online = useConexion();
  const [centros, setCentros] = useState([]);
  // "cargando" | "ok" | "cache" (sin conexión, lista guardada) | "error"
  const [carga, setCarga] = useState("cargando");
  const [mapaSinTiles, setMapaSinTiles] = useState(false);
  const [tipo, setTipo] = useState("todos");
  const [elegidoId, setElegidoId] = useState(null);

  const cargarCentros = () => {
    setCarga("cargando");
    api
      .getCentros()
      .then((data) => {
        setCentros(data);
        setCarga("ok");
        try {
          localStorage.setItem(CACHE_KEY, JSON.stringify(data));
        } catch {
          // sin almacenamiento: la próxima vez sin conexión no habrá copia
        }
      })
      .catch(() => {
        // Sin conexión o servidor caído: si hay una copia de una visita
        // anterior, se muestra con un aviso.
        const guardados = leerCache();
        if (guardados?.length) {
          setCentros(guardados);
          setCarga("cache");
        } else {
          setCarga("error");
        }
      });
  };

  useEffect(cargarCentros, []);

  // Al volver la conexión, reintenta lo que no se pudo cargar.
  useEffect(() => {
    if (online && (carga === "error" || carga === "cache")) cargarCentros();
    if (online) setMapaSinTiles(false);
  }, [online]);

  // Con ubicación: del más cercano al más lejano (y con su distancia).
  const lista = useMemo(() => ordenarCentros(centros, coords, tipo), [centros, tipo, coords]);
  const elegido = lista.find((c) => c.id === elegidoId) || null;
  const masCercano = coords ? lista[0] : null;

  return (
    <div className="fade-in w-full max-w-3xl space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-gray-800">Centros de salud</h2>
          <p className="text-sm text-gray-500 mt-1">
            Encontrá hospitales y centros de salud cerca tuyo en el Gran Mendoza.
          </p>
        </div>
        <button
          onClick={pedir}
          disabled={estado === "pidiendo"}
          className="text-sm font-medium text-pink-600 hover:text-pink-800 disabled:opacity-50"
        >
          📍 {estado === "pidiendo" ? "Buscando tu ubicación..." : "Usar mi ubicación"}
        </button>
      </div>

      {!online && (
        <Aviso color="red" titulo="Estás sin conexión a internet">
          El mapa y la lista pueden no cargarse. Se actualizan solos cuando vuelva la conexión.
        </Aviso>
      )}
      {online && carga === "error" && (
        <Aviso color="red" titulo="No pudimos cargar los centros de salud" accion="Reintentar" onAccion={cargarCentros}>
          Revisá tu conexión y volvé a intentar.
        </Aviso>
      )}
      {carga === "cache" && (
        <Aviso color="amber" titulo="Mostrando la última lista guardada">
          No pudimos actualizarla. Los horarios pueden haber cambiado.
        </Aviso>
      )}
      {online && mapaSinTiles && (
        <Aviso color="amber" titulo="El mapa no terminó de cargar">
          Probá recargar la página en un momento.
        </Aviso>
      )}
      {MENSAJES_UBICACION[estado] && (
        <Aviso
          color="amber"
          titulo={MENSAJES_UBICACION[estado].titulo}
          accion={estado === "no_disponible" ? null : "Reintentar"}
          onAccion={pedir}
        >
          {MENSAJES_UBICACION[estado].texto}
        </Aviso>
      )}

      <div className="flex flex-wrap gap-1.5">
        {[["todos", "Todos"], ...Object.entries(TIPOS_CENTRO).map(([k, t]) => [k, t.nombre])].map(([k, label]) => (
          <button
            key={k}
            onClick={() => {
              setTipo(k);
              setElegidoId(null);
            }}
            aria-pressed={tipo === k}
            className={`text-xs font-medium px-3 py-1 rounded-full border ${
              tipo === k
                ? "bg-pink-600 border-pink-600 text-white"
                : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {masCercano ? (
        <p className="text-sm text-gray-600">
          El más cercano: <span className="font-medium text-gray-800">{masCercano.nombre}</span>, a{" "}
          {formatDistancia(masCercano.distancia)}.{" "}
          <button
            onClick={() => setElegidoId(masCercano.id)}
            className="font-medium text-pink-600 hover:text-pink-800"
          >
            Ver
          </button>
        </p>
      ) : (
        <p className="text-sm text-gray-500">Tocá un ícono del mapa para ver la información del centro.</p>
      )}

      {carga === "cargando" && centros.length === 0 && (
        <p className="text-sm text-gray-400">Cargando centros de salud...</p>
      )}

      {/* z-0 crea un contexto propio: sin esto las capas de Leaflet (z-index 400)
          quedan por encima del menú lateral en el celular. */}
      <div className="relative z-0 h-[65vh] min-h-[360px] rounded-2xl overflow-hidden border border-gray-100 shadow-sm">
        <MapContainer center={MENDOZA} zoom={13} scrollWheelZoom className="h-full w-full">
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            eventHandlers={{ tileerror: () => setMapaSinTiles(true) }}
          />
          <Recentrar punto={coords} zoom={14} />
          <Enfocar centro={elegido} />
          {lista.map((c) => (
            <Marker
              key={c.id}
              position={[c.lat, c.lng]}
              icon={iconoCentro(c.tipo)}
              title={c.nombre}
              eventHandlers={{ click: () => setElegidoId(c.id) }}
            />
          ))}
          {coords && (
            <CircleMarker
              center={coords}
              radius={9}
              pathOptions={{ color: "#ffffff", weight: 3, fillColor: "#2563eb", fillOpacity: 1 }}
            >
              <Popup>Estás acá</Popup>
            </CircleMarker>
          )}
        </MapContainer>
        {elegido && <TarjetaCentro centro={elegido} onCerrar={() => setElegidoId(null)} />}
      </div>

      <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-gray-600">
        {Object.entries(TIPOS_CENTRO).map(([key, t]) => (
          <span key={key} className="flex items-center gap-1.5">
            <span
              className="w-6 h-6 rounded-full bg-white flex items-center justify-center text-xs"
              style={{ border: `2px solid ${t.color}` }}
            >
              {t.icono}
            </span>
            {t.nombre}
          </span>
        ))}
        <span className="flex items-center gap-1.5">
          <span className="w-3.5 h-3.5 rounded-full bg-blue-600 ring-2 ring-white shadow" />
          Tu ubicación
        </span>
      </div>
    </div>
  );
}
