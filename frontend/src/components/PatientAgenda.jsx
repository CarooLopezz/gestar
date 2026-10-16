import { useEffect, useMemo, useState } from "react";
import { api } from "../api/client";
import { formatFecha } from "../utils/fecha";

const DURACION_DIAS = 280; // 40 semanas desde la última menstruación
const DIA_MS = 24 * 60 * 60 * 1000;

const TRIMESTRES = {
  1: { nombre: "1.er trimestre", dia: "bg-pink-100 text-pink-800", barra: "bg-pink-300", chip: "bg-pink-50 text-pink-700" },
  2: { nombre: "2.º trimestre", dia: "bg-violet-100 text-violet-800", barra: "bg-violet-300", chip: "bg-violet-50 text-violet-700" },
  3: { nombre: "3.er trimestre", dia: "bg-amber-100 text-amber-800", barra: "bg-amber-300", chip: "bg-amber-50 text-amber-700" },
};

const MESES = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];

// Las fechas se manejan como fechas locales sin hora para que la zona horaria
// no corra los días.
function parseISO(iso) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function toISO(date) {
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${m}-${d}`;
}

function addDays(date, days) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
}

function hoy() {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function trimestreDeSemana(semana) {
  if (semana < 14) return 1;
  if (semana < 28) return 2;
  return 3;
}

// Semana de embarazo de un día cualquiera, o null si cae fuera del embarazo.
function semanaDelDia(dia, fechaParto) {
  const diasGestacion = DURACION_DIAS - Math.round((fechaParto - dia) / DIA_MS);
  if (diasGestacion < 0 || diasGestacion > DURACION_DIAS) return null;
  return Math.floor(diasGestacion / 7);
}

function trimestreDelDia(dia, fechaParto) {
  const semana = semanaDelDia(dia, fechaParto);
  return semana === null ? null : trimestreDeSemana(semana);
}

// Días del calendario en los que conviene hacerse un estudio, a partir de
// su ventana de semanas.
function ventanaEstudio(estudio, fechaParto) {
  const inicio = addDays(fechaParto, -DURACION_DIAS);
  return {
    desde: addDays(inicio, estudio.semana_desde * 7),
    hasta: addDays(inicio, (estudio.semana_hasta + 1) * 7 - 1),
  };
}

function fechaLarga(date) {
  return `${date.getDate()} de ${MESES[date.getMonth()]}`;
}

export default function PatientAgenda({ patient, showToast }) {
  const [agenda, setAgenda] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editandoFecha, setEditandoFecha] = useState(false);
  const [busyKey, setBusyKey] = useState(null);

  useEffect(() => {
    let cancelled = false;
    api
      .getAgenda(patient.dni)
      .then((data) => !cancelled && setAgenda(data))
      .catch((err) => !cancelled && showToast(err.message || "No se pudo cargar tu agenda", false))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [patient.dni]);

  const toggleEstudio = async (estudio) => {
    setBusyKey(estudio.key);
    try {
      const data =
        estudio.estado === "hecho"
          ? await api.desmarcarEstudio(patient.dni, estudio.key)
          : await api.marcarEstudio(patient.dni, estudio.key);
      setAgenda(data);
    } catch (err) {
      showToast(err.message || "No se pudo actualizar el estudio", false);
    } finally {
      setBusyKey(null);
    }
  };

  if (loading) {
    return <p className="text-gray-400 text-sm py-8">Cargando tu agenda...</p>;
  }
  if (!agenda) return null;

  if (!agenda.fecha_parto || editandoFecha) {
    return (
      <div className="fade-in w-full max-w-2xl">
        <h2 className="text-xl font-semibold text-gray-800 mb-1">Agenda</h2>
        <p className="text-sm text-gray-500 mb-4">
          Con tu fecha probable de parto armamos tu calendario: en qué trimestre estás, qué controlar y qué
          estudios te tocan.
        </p>
        <FechaPartoForm
          patient={patient}
          fechaActual={agenda.fecha_parto}
          onSaved={(data) => {
            setAgenda(data);
            setEditandoFecha(false);
            showToast("Fecha probable de parto guardada");
          }}
          onCancel={agenda.fecha_parto ? () => setEditandoFecha(false) : null}
          showToast={showToast}
        />
      </div>
    );
  }

  const { embarazo, estudios, monitoreo, turnos } = agenda;
  const fechaParto = parseISO(agenda.fecha_parto);
  const t = TRIMESTRES[embarazo.trimestre];
  const enVentana = estudios.filter((e) => e.estado === "pendiente" || e.estado === "atrasado");
  const hechos = estudios.filter((e) => e.estado === "hecho");
  const proximos = estudios.filter((e) => e.estado === "proximo");

  return (
    <div className="fade-in w-full max-w-2xl space-y-6">
      <h2 className="text-xl font-semibold text-gray-800">Agenda</h2>

      <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <span className={`inline-block text-xs font-medium px-3 py-1 rounded-full ${t.chip}`}>{t.nombre}</span>
            <p className="text-2xl font-semibold text-gray-800 mt-2">
              Semana {embarazo.semana}
              {embarazo.dias > 0 && (
                <span className="text-base font-normal text-gray-500">
                  {" "}y {embarazo.dias} {embarazo.dias === 1 ? "día" : "días"}
                </span>
              )}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              {embarazo.dias_para_el_parto > 0
                ? `Faltan ${embarazo.dias_para_el_parto} días · `
                : embarazo.dias_para_el_parto === 0
                ? "¡Hoy es tu fecha probable de parto! · "
                : "Ya pasó tu fecha probable de parto · "}
              Fecha probable de parto: {formatFecha(agenda.fecha_parto)}
            </p>
          </div>
          <button
            onClick={() => setEditandoFecha(true)}
            className="shrink-0 text-xs font-medium text-pink-600 hover:text-pink-800"
          >
            Cambiar fecha
          </button>
        </div>
        <BarraTrimestres semana={embarazo.semana} fechaParto={fechaParto} />
      </section>

      <Calendario fechaParto={fechaParto} turnos={turnos} estudios={estudios} />

      <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-5">
        <div>
          <h3 className="font-medium text-gray-700 mb-2">Este trimestre te toca controlar</h3>
          <ul className="space-y-1.5 text-sm text-gray-600">
            {monitoreo.map((m) => (
              <li key={m} className="flex gap-2">
                <span className="text-pink-500">•</span>
                {m}
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="font-medium text-gray-700 mb-2">Estudios que te tocan ahora</h3>
          {enVentana.length === 0 ? (
            <p className="text-sm text-gray-400">No tenés estudios pendientes por ahora.</p>
          ) : (
            <div className="space-y-2">
              {enVentana.map((e) => (
                <EstudioRow
                  key={e.key}
                  estudio={e}
                  fechaParto={fechaParto}
                  busy={busyKey === e.key}
                  onToggle={() => toggleEstudio(e)}
                />
              ))}
            </div>
          )}
        </div>

        {hechos.length > 0 && (
          <div>
            <h3 className="font-medium text-gray-700 mb-2">Ya te hiciste</h3>
            <div className="space-y-2">
              {hechos.map((e) => (
                <EstudioRow
                  key={e.key}
                  estudio={e}
                  fechaParto={fechaParto}
                  busy={busyKey === e.key}
                  onToggle={() => toggleEstudio(e)}
                />
              ))}
            </div>
          </div>
        )}

        {proximos.length > 0 && <ProximosEstudios estudios={proximos} fechaParto={fechaParto} />}
      </section>

      {turnos.length > 0 && (
        <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h3 className="font-medium text-gray-700 mb-3">Tus próximos turnos</h3>
          <div className="space-y-2">
            {turnos.map((turno) => (
              <div key={turno.id} className="flex items-center justify-between gap-4 text-sm bg-gray-50 rounded-lg px-3 py-2">
                <span className="text-gray-700">{turno.tipo}</span>
                <span className="shrink-0 text-gray-500">
                  📅 {formatFecha(turno.fecha)} · 🕐 {turno.hora}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      <p className="text-xs text-gray-400">
        Si te sentís muy mal, no esperes: andá a la guardia más cercana o llamá al 107.
      </p>
    </div>
  );
}

// Solo el próximo estudio, para no llenar la pantalla: el resto se ve en el
// calendario (🧪) a medida que se acerca.
function ProximosEstudios({ estudios, fechaParto }) {
  const proximo = estudios[0];
  const mismoDia = estudios.filter((e) => e.semana_desde === proximo.semana_desde);
  return (
    <div className="border-t border-gray-100 pt-4 text-sm">
      <p className="text-gray-500">
        Tu próximo estudio: <span className="text-gray-700">{mismoDia.map((e) => e.nombre).join(" y ")}</span>, a
        partir del {fechaLarga(ventanaEstudio(proximo, fechaParto).desde)}.
      </p>
    </div>
  );
}

function EstudioRow({ estudio, fechaParto, busy, onToggle }) {
  const hecho = estudio.estado === "hecho";
  const atrasado = estudio.estado === "atrasado";
  const { desde, hasta } = ventanaEstudio(estudio, fechaParto);
  return (
    <div
      className={`flex items-center justify-between gap-4 rounded-lg px-3 py-2 text-sm ${
        hecho ? "bg-green-50" : atrasado ? "bg-red-50" : "bg-gray-50"
      }`}
    >
      <div className="min-w-0">
        <p className={hecho ? "text-green-800" : "text-gray-700"}>{estudio.nombre}</p>
        <p className={`text-xs ${atrasado ? "text-red-600" : "text-gray-400"}`}>
          {hecho
            ? `Hecho el ${formatFecha(estudio.fecha_realizado)}`
            : atrasado
            ? `Atrasado: era hasta el ${fechaLarga(hasta)}. Hacételo cuanto antes.`
            : `Hacételo antes del ${fechaLarga(hasta)} (desde el ${fechaLarga(desde)})`}
        </p>
      </div>
      <button
        onClick={onToggle}
        disabled={busy}
        className={`shrink-0 text-xs font-medium px-3 py-1.5 rounded-lg disabled:opacity-50 ${
          hecho ? "text-gray-400 hover:text-gray-600" : "bg-pink-600 text-white hover:bg-pink-700"
        }`}
      >
        {hecho ? "Desmarcar" : "Ya me lo hice"}
      </button>
    </div>
  );
}

function BarraTrimestres({ semana, fechaParto }) {
  const inicio = addDays(fechaParto, -DURACION_DIAS);
  // Semanas 0-13, 14-27 y 28-40.
  const tramos = [
    { n: 1, semanas: 14, desde: inicio },
    { n: 2, semanas: 14, desde: addDays(inicio, 14 * 7) },
    { n: 3, semanas: 12, desde: addDays(inicio, 28 * 7) },
  ];
  const posicion = Math.min(Math.max(semana, 0), 40) / 40;
  return (
    <div>
      <div className="relative flex h-3 rounded-full overflow-hidden">
        {tramos.map((tr) => (
          <div
            key={tr.n}
            className={`${TRIMESTRES[tr.n].barra} ${trimestreDeSemana(semana) === tr.n ? "" : "opacity-40"}`}
            style={{ flexGrow: tr.semanas }}
          />
        ))}
      </div>
      <div className="relative h-4">
        <span
          className="absolute -translate-x-1/2 text-[10px] font-semibold text-gray-700"
          style={{ left: `${posicion * 100}%` }}
        >
          ▲ hoy
        </span>
      </div>
      <div className="flex text-[11px] text-gray-500">
        {tramos.map((tr) => (
          <div key={tr.n} style={{ flexGrow: tr.semanas, flexBasis: 0 }} className="min-w-0">
            <p className="font-medium text-gray-600 truncate">{TRIMESTRES[tr.n].nombre}</p>
            <p className="truncate">
              desde {tr.desde.getDate()} de {MESES[tr.desde.getMonth()]}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

function Calendario({ fechaParto, turnos, estudios }) {
  const [mes, setMes] = useState(() => {
    const h = hoy();
    return new Date(h.getFullYear(), h.getMonth(), 1);
  });
  const [seleccionado, setSeleccionado] = useState(() => toISO(hoy()));

  const turnosPorDia = useMemo(() => {
    const map = new Map();
    turnos.forEach((t) => map.set(t.fecha, [...(map.get(t.fecha) || []), t]));
    return map;
  }, [turnos]);

  // Estudios que todavía no se hizo, con su ventana en fechas.
  const estudiosConFechas = useMemo(
    () =>
      estudios
        .filter((e) => e.estado !== "hecho")
        .map((e) => {
          const { desde, hasta } = ventanaEstudio(e, fechaParto);
          return { ...e, desdeISO: toISO(desde), hastaISO: toISO(hasta), hasta };
        }),
    [estudios, fechaParto]
  );
  const iniciosDeEstudio = useMemo(() => new Set(estudiosConFechas.map((e) => e.desdeISO)), [estudiosConFechas]);

  const hoyISO = toISO(hoy());
  const partoISO = toISO(fechaParto);
  // Semana empieza el lunes: getDay() 0 = domingo.
  const offset = (mes.getDay() + 6) % 7;
  const diasDelMes = new Date(mes.getFullYear(), mes.getMonth() + 1, 0).getDate();
  const celdas = [
    ...Array(offset).fill(null),
    ...Array.from({ length: diasDelMes }, (_, i) => new Date(mes.getFullYear(), mes.getMonth(), i + 1)),
  ];

  const cambiarMes = (delta) => setMes((m) => new Date(m.getFullYear(), m.getMonth() + delta, 1));

  return (
    <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => cambiarMes(-1)}
          aria-label="Mes anterior"
          className="w-8 h-8 rounded-full text-gray-500 hover:bg-gray-100"
        >
          ‹
        </button>
        <h3 className="font-medium text-gray-700 capitalize">
          {MESES[mes.getMonth()]} {mes.getFullYear()}
        </h3>
        <button
          onClick={() => cambiarMes(1)}
          aria-label="Mes siguiente"
          className="w-8 h-8 rounded-full text-gray-500 hover:bg-gray-100"
        >
          ›
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-xs">
        {["L", "M", "M", "J", "V", "S", "D"].map((d, i) => (
          <div key={i} className="text-gray-400 font-medium py-1">
            {d}
          </div>
        ))}
        {celdas.map((dia, i) => {
          if (!dia) return <div key={`v${i}`} />;
          const iso = toISO(dia);
          const tri = trimestreDelDia(dia, fechaParto);
          const marcas = [
            iso === partoISO && "👶",
            turnosPorDia.has(iso) && "📅",
            iniciosDeEstudio.has(iso) && "🧪",
          ].filter(Boolean);
          return (
            <button
              key={iso}
              onClick={() => setSeleccionado(iso)}
              aria-pressed={iso === seleccionado}
              className={`aspect-square flex flex-col items-center justify-center rounded-lg transition ${
                tri ? TRIMESTRES[tri].dia : "text-gray-400"
              } ${iso === hoyISO ? "font-bold" : ""} ${
                iso === seleccionado ? "ring-2 ring-pink-500" : "hover:ring-1 hover:ring-pink-300"
              }`}
            >
              {dia.getDate()}
              <span className="text-[10px] leading-none h-3">{marcas.join("")}</span>
            </button>
          );
        })}
      </div>

      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-4 text-[11px] text-gray-500">
        {[1, 2, 3].map((n) => (
          <span key={n} className="flex items-center gap-1">
            <span className={`w-3 h-3 rounded ${TRIMESTRES[n].dia}`} />
            {TRIMESTRES[n].nombre}
          </span>
        ))}
        <span>📅 turno</span>
        <span>🧪 empieza un estudio</span>
        <span>👶 fecha probable de parto</span>
      </div>

      <DetalleDia
        iso={seleccionado}
        esHoy={seleccionado === hoyISO}
        fechaParto={fechaParto}
        turnos={turnosPorDia.get(seleccionado) || []}
        estudios={estudiosConFechas.filter((e) => e.desdeISO <= seleccionado && seleccionado <= e.hastaISO)}
      />
    </section>
  );
}

function DetalleDia({ iso, esHoy, fechaParto, turnos, estudios }) {
  const dia = parseISO(iso);
  const semana = semanaDelDia(dia, fechaParto);
  const esParto = iso === toISO(fechaParto);
  const nada = turnos.length === 0 && estudios.length === 0 && !esParto;

  return (
    <div className="mt-4 pt-4 border-t border-gray-100 text-sm">
      <p className="font-medium text-gray-700">
        {esHoy ? "Hoy, " : ""}
        {fechaLarga(dia)}
        {semana !== null && <span className="font-normal text-gray-400"> · semana {semana}</span>}
      </p>
      <div className="mt-2 space-y-1.5">
        {esParto && <p className="text-pink-700">👶 Tu fecha probable de parto</p>}
        {turnos.map((t) => (
          <p key={t.id} className="text-gray-700">
            📅 Turno: {t.tipo} a las {t.hora}
          </p>
        ))}
        {estudios.map((e) => (
          <p key={e.key} className={e.estado === "atrasado" ? "text-red-700" : "text-gray-700"}>
            🧪 {e.nombre}
            <span className="text-xs text-gray-400"> · hasta el {fechaLarga(e.hasta)}</span>
          </p>
        ))}
        {nada && <p className="text-gray-400">No tenés nada para este día.</p>}
      </div>
    </div>
  );
}

function FechaPartoForm({ patient, fechaActual, onSaved, onCancel, showToast }) {
  const [modo, setModo] = useState(fechaActual ? "fpp" : "fum");
  const [fpp, setFpp] = useState(fechaActual || "");
  const [fum, setFum] = useState("");
  const [semanas, setSemanas] = useState("");
  const [dias, setDias] = useState("0");
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  // Fecha probable de parto calculada según el modo elegido.
  let calculada = null;
  let errorCalculo = null;
  if (modo === "fpp" && fpp) {
    calculada = fpp;
  } else if (modo === "fum" && fum) {
    const fechaFum = parseISO(fum);
    if (fechaFum > hoy()) errorCalculo = "La fecha de tu última menstruación no puede ser futura.";
    else calculada = toISO(addDays(fechaFum, DURACION_DIAS));
  } else if (modo === "semanas" && semanas !== "") {
    const s = Number(semanas);
    const d = Number(dias);
    if (!Number.isInteger(s) || s < 0 || s > 42 || !Number.isInteger(d) || d < 0 || d > 6) {
      errorCalculo = "Ingresá semanas entre 0 y 42 y días entre 0 y 6.";
    } else {
      calculada = toISO(addDays(hoy(), DURACION_DIAS - (s * 7 + d)));
    }
  }

  let semanaCalculada = null;
  if (calculada) {
    const diasGestacion = DURACION_DIAS - Math.round((parseISO(calculada) - hoy()) / DIA_MS);
    semanaCalculada = Math.max(0, Math.floor(diasGestacion / 7));
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!calculada) return;
    setErrors({});
    setSaving(true);
    try {
      onSaved(await api.setOwnFechaParto(patient.dni, calculada));
    } catch (err) {
      if (err.data?.errors) setErrors(err.data.errors);
      else showToast(err.message || "No se pudo guardar la fecha", false);
    } finally {
      setSaving(false);
    }
  };

  const opciones = [
    { id: "fum", label: "Sé la fecha de mi última menstruación" },
    { id: "semanas", label: "Sé de cuántas semanas estoy" },
    { id: "fpp", label: "Ya sé mi fecha probable de parto" },
  ];

  return (
    <form onSubmit={handleSubmit} noValidate className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
      <fieldset className="space-y-2">
        <legend className="block text-sm font-medium text-gray-600 mb-1">¿Qué dato tenés?</legend>
        {opciones.map((o) => (
          <label key={o.id} className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="radio"
              name="modo"
              value={o.id}
              checked={modo === o.id}
              onChange={() => setModo(o.id)}
              className="accent-pink-600"
            />
            {o.label}
          </label>
        ))}
      </fieldset>

      {modo === "fpp" && (
        <div>
          <label htmlFor="agenda-fpp" className="block text-sm font-medium text-gray-600 mb-1">
            Fecha probable de parto
          </label>
          <input
            id="agenda-fpp"
            type="date"
            value={fpp}
            onChange={(e) => setFpp(e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-300"
          />
        </div>
      )}

      {modo === "fum" && (
        <div>
          <label htmlFor="agenda-fum" className="block text-sm font-medium text-gray-600 mb-1">
            Primer día de tu última menstruación
          </label>
          <input
            id="agenda-fum"
            type="date"
            max={toISO(hoy())}
            value={fum}
            onChange={(e) => setFum(e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-300"
          />
        </div>
      )}

      {modo === "semanas" && (
        <div>
          <p className="text-xs text-gray-400 mb-2">Las semanas y días que te indicaron en tu último control.</p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="agenda-semanas" className="block text-sm font-medium text-gray-600 mb-1">
                Semanas
              </label>
              <input
                id="agenda-semanas"
                type="number"
                min="0"
                max="42"
                value={semanas}
                onChange={(e) => setSemanas(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-300"
              />
            </div>
            <div>
              <label htmlFor="agenda-dias" className="block text-sm font-medium text-gray-600 mb-1">
                Días
              </label>
              <input
                id="agenda-dias"
                type="number"
                min="0"
                max="6"
                value={dias}
                onChange={(e) => setDias(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-300"
              />
            </div>
          </div>
        </div>
      )}

      {errorCalculo && <p className="text-red-500 text-xs">{errorCalculo}</p>}

      {calculada && modo !== "fpp" && (
        <div className="bg-pink-50 text-pink-800 rounded-lg px-4 py-3 text-sm">
          Tu fecha probable de parto es el <strong>{formatFecha(calculada)}</strong>. Estás en la semana{" "}
          {semanaCalculada} ({TRIMESTRES[trimestreDeSemana(semanaCalculada)].nombre}).
        </div>
      )}

      {errors.fecha_parto && <p className="text-red-500 text-xs">{errors.fecha_parto}</p>}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={!calculada || saving}
          className="flex-1 bg-pink-600 hover:bg-pink-700 disabled:opacity-60 text-white font-medium py-2.5 rounded-lg transition"
        >
          {saving ? "Guardando..." : "Guardar"}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-4 text-sm font-medium text-gray-500 hover:text-gray-700"
          >
            Cancelar
          </button>
        )}
      </div>
    </form>
  );
}
