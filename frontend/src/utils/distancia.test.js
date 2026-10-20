// Pruebas de aceptación de GT-148 (orden y distancia de los centros).
// Correr con: npm test
import { test } from "node:test";
import assert from "node:assert/strict";
import { distanciaKm, formatDistancia, ordenarCentros } from "./distancia.js";

// Centro del mapa (Ciudad de Mendoza), y cuatro centros con sus coordenadas
// reales, copiadas de backend/data/centros_mendoza.json.
const CENTRO_MAPA = [-32.8895, -68.8458];
const CENTROS = [
  { id: 1, nombre: "Hospital Italiano", tipo: "hospital", lat: -32.89628, lng: -68.821517 },
  { id: 2, nombre: "Clínica de Cuyo", tipo: "clinica", lat: -32.895348, lng: -68.839911 },
  { id: 3, nombre: "Hospital Español", tipo: "hospital", lat: -32.915057, lng: -68.844136 },
  { id: 4, nombre: "Centro de Salud N°30", tipo: "centro_salud", lat: -32.928273, lng: -68.846237 },
];

test("la distancia entre dos puntos conocidos es correcta", () => {
  // Centro del mapa a Centro de Salud N°30 (Godoy Cruz): ~4,3 km al sur.
  const km = distanciaKm(CENTRO_MAPA, [-32.928273, -68.846237]);
  assert.ok(km > 4.2 && km < 4.4, `dio ${km}`);
  assert.equal(distanciaKm(CENTRO_MAPA, CENTRO_MAPA), 0);
});

test("la distancia se muestra en metros o en km con coma", () => {
  assert.equal(formatDistancia(0.4567), "457 m");
  assert.equal(formatDistancia(4.16), "4,2 km");
});

test("con ubicación, los centros quedan del más cercano al más lejano", () => {
  const lista = ordenarCentros(CENTROS, CENTRO_MAPA);
  assert.deepEqual(
    lista.map((c) => c.id),
    [2, 1, 3, 4]
  );
  for (let i = 1; i < lista.length; i++) assert.ok(lista[i - 1].distancia <= lista[i].distancia);
});

test("sin ubicación, quedan por nombre y sin distancia", () => {
  const lista = ordenarCentros(CENTROS, null);
  assert.deepEqual(
    lista.map((c) => c.nombre),
    ["Centro de Salud N°30", "Clínica de Cuyo", "Hospital Español", "Hospital Italiano"]
  );
  assert.ok(lista.every((c) => c.distancia === null));
});

test("el filtro por tipo deja solo ese tipo", () => {
  const lista = ordenarCentros(CENTROS, CENTRO_MAPA, "hospital");
  assert.deepEqual(
    lista.map((c) => c.id),
    [1, 3]
  );
});

test("ordenar no modifica la lista original", () => {
  const copia = structuredClone(CENTROS);
  ordenarCentros(CENTROS, CENTRO_MAPA);
  assert.deepEqual(CENTROS, copia);
});
