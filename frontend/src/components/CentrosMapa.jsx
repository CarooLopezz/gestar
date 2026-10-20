import "leaflet/dist/leaflet.css";
import { useEffect, useMemo, useRef, useState } from "react";
import { CircleMarker, MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
import { api } from "../api/client";
import useConexion from "../hooks/useConexion";
import useUbicacion from "../hooks/useUbicacion";
import { TIPOS_CENTRO, iconoCentro, linkComoLlegar } from "../utils/centros";
import { formatDistancia, ordenarCentros } from "../utils/distancia";

// Centro del Gran Mendoza (Ciudad de Mendoza).
const MENDOZA = [-32.8895, -68.8458];
const POR_PAGINA = 8;
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

// Lleva el mapa al centro elegido en la lista y abre su cartel.
function Enfocar({ centro, markers }) {
  const map = useMap();
  useEffect(() => {
    if (!centro) return;
    map.flyTo([centro.lat, centro.lng], 16, { duration: 0.6 });
    markers.current[centro.id]?.openPopup();
  }, [centro, map, markers]);
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

export default function CentrosMapa() {
  const { estado, coords, pedir } = useUbicacion();
  const online = useConexion();
  const [centros, setCentros] = useState([]);
  // "cargando" | "ok" | "cache" (sin conexión, lista guardada) | "error"
  const [carga, setCarga] = useState("cargando");
  const [mapaSinTiles, setMapaSinTiles] = useState(false);
  const [tipo, setTipo] = useState("todos");
  const [visibles, setVisibles] = useState(POR_PAGINA);
  const [elegido, setElegido] = useState(null);
  const markers = useRef({});
  const mapaRef = useRef(null);

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

  // Con ubicación: del más cercano al más lejano. Sin ella: por nombre.
  const lista = useMemo(() => ordenarCentros(centros, coords, tipo), [centros, tipo, coords]);

  const elegir = (c) => {
    setElegido(c);
    mapaRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

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
          Los centros siguen en la lista de abajo. Probá recargar la página en un momento.
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

      {/* z-0 crea un contexto propio: sin esto las capas de Leaflet (z-index 400)
          quedan por encima del menú lateral en el celular. */}
      <div ref={mapaRef} className="relative z-0 h-[55vh] min-h-[320px] rounded-2xl overflow-hidden border border-gray-100 shadow-sm">
        <MapContainer center={MENDOZA} zoom={13} scrollWheelZoom className="h-full w-full">
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            eventHandlers={{ tileerror: () => setMapaSinTiles(true) }}
          />
          <Recentrar punto={coords} zoom={14} />
          <Enfocar centro={elegido} markers={markers} />
          {lista.map((c) => (
            <Marker
              key={c.id}
              position={[c.lat, c.lng]}
              icon={iconoCentro(c.tipo)}
              ref={(m) => {
                if (m) markers.current[c.id] = m;
              }}
            >
              <Popup>
                <div className="space-y-1 text-sm">
                  <p className="font-semibold text-gray-800">{c.nombre}</p>
                  <p className="text-gray-500">{TIPOS_CENTRO[c.tipo]?.nombre}</p>
                  <p>
                    <Direccion centro={c} />
                  </p>
                  <p>
                    <Horario centro={c} />
                  </p>
                  <a href={linkComoLlegar(c)} target="_blank" rel="noreferrer">
                    Cómo llegar
                  </a>
                </div>
              </Popup>
            </Marker>
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

      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="font-medium text-gray-700">
            {coords ? "Más cercanos a vos" : "Todos los centros"}
          </h3>
          <div className="flex flex-wrap gap-1.5">
            {[["todos", "Todos"], ...Object.entries(TIPOS_CENTRO).map(([k, t]) => [k, t.nombre])].map(
              ([k, label]) => (
                <button
                  key={k}
                  onClick={() => {
                    setTipo(k);
                    setVisibles(POR_PAGINA);
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
              )
            )}
          </div>
        </div>

        {!coords && (
          <p className="text-xs text-gray-400">
            Activá tu ubicación para ordenarlos del más cercano al más lejano.
          </p>
        )}

        {carga === "cargando" && centros.length === 0 && (
          <p className="text-sm text-gray-400">Cargando centros de salud...</p>
        )}

        <div className="space-y-2">
          {lista.slice(0, visibles).map((c) => {
            const t = TIPOS_CENTRO[c.tipo];
            return (
              <div key={c.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 text-sm">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <span className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full ${t?.chip}`}>
                      {t?.icono} {t?.nombre}
                    </span>
                    <p className="font-semibold text-gray-800 mt-1">{c.nombre}</p>
                  </div>
                  {c.distancia !== null && (
                    <span className="shrink-0 text-sm font-medium text-gray-700">{formatDistancia(c.distancia)}</span>
                  )}
                </div>
                <p className="text-gray-600 mt-1">
                  <Direccion centro={c} />
                </p>
                <p className="text-gray-600">
                  <Horario centro={c} />
                </p>
                {c.telefono && <p className="text-gray-600">📞 {c.telefono}</p>}
                <div className="flex gap-4 mt-2">
                  <button onClick={() => elegir(c)} className="text-xs font-medium text-pink-600 hover:text-pink-800">
                    Ver en el mapa
                  </button>
                  <a
                    href={linkComoLlegar(c)}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs font-medium text-pink-600 hover:text-pink-800"
                  >
                    Cómo llegar
                  </a>
                </div>
              </div>
            );
          })}
        </div>

        {visibles < lista.length && (
          <button
            onClick={() => setVisibles((v) => v + POR_PAGINA)}
            className="w-full text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg py-2 hover:bg-gray-50"
          >
            Ver más ({lista.length - visibles} restantes)
          </button>
        )}
      </section>
    </div>
  );
}
