// Pruebas de GT-153 (bienvenida y horario) y GT-156 (bienvenida una vez por sesión).
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  borrarConversacion,
  conversacionInicial,
  estaEnHorario,
  guardarConversacion,
  mensajeBienvenida,
} from "./chatbot.js";

// 2026-10-21 fue miércoles; 2026-10-24, sábado.
const miercoles = (h) => new Date(2026, 9, 21, h, 30);
const sabado = (h) => new Date(2026, 9, 24, h, 30);

test("dentro del horario: lunes a viernes de 8 a 20", () => {
  assert.equal(estaEnHorario(miercoles(8)), true);
  assert.equal(estaEnHorario(miercoles(19)), true);
});

test("fuera del horario: antes de las 8, desde las 20 y fines de semana", () => {
  assert.equal(estaEnHorario(miercoles(7)), false);
  assert.equal(estaEnHorario(miercoles(20)), false);
  assert.equal(estaEnHorario(sabado(11)), false);
});

test("la bienvenida saluda por el nombre y muestra el horario", () => {
  const texto = mensajeBienvenida("Ana", miercoles(10));
  assert.match(texto, /Hola, Ana/);
  assert.match(texto, /lunes a viernes de 8 a 20 h/);
  assert.match(texto, /Ahora enfermería está atendiendo/);
  assert.match(texto, /107/);
});

test("fuera de horario, la bienvenida lo avisa", () => {
  assert.match(mensajeBienvenida("Ana", sabado(11)), /fuera de ese horario/);
});

// GT-156: la bienvenida no se repite durante la misma sesión.

function storageFalso() {
  const datos = new Map();
  return {
    getItem: (k) => (datos.has(k) ? datos.get(k) : null),
    setItem: (k, v) => datos.set(k, String(v)),
    removeItem: (k) => datos.delete(k),
  };
}

test("la primera vez en la sesión, la conversación arranca con la bienvenida", () => {
  const inicial = conversacionInicial("111", "Ana", storageFalso(), miercoles(10));
  assert.equal(inicial.length, 1);
  assert.equal(inicial[0].rol, "asistente");
  assert.match(inicial[0].texto, /Hola, Ana/);
});

test("en la misma sesión se retoma la conversación y no se repite la bienvenida", () => {
  const storage = storageFalso();
  const conversacion = [
    { rol: "asistente", texto: mensajeBienvenida("Ana", miercoles(10)) },
    { rol: "usuaria", texto: "¿Cuál es el horario?" },
    { rol: "asistente", texto: "De lunes a viernes de 8 a 20 h." },
  ];
  guardarConversacion("111", conversacion, storage);
  const retomada = conversacionInicial("111", "Ana", storage, miercoles(11));
  assert.deepEqual(retomada, conversacion);
  assert.equal(retomada.filter((m) => /Hola, Ana/.test(m.texto)).length, 1);
});

test("al salir se borra la conversación y la próxima sesión vuelve a saludar", () => {
  const storage = storageFalso();
  guardarConversacion("111", [{ rol: "usuaria", texto: "hola" }], storage);
  borrarConversacion("111", storage);
  assert.equal(conversacionInicial("111", "Ana", storage)[0].rol, "asistente");
});

test("la conversación de una paciente no aparece en la de otra", () => {
  const storage = storageFalso();
  guardarConversacion("111", [{ rol: "usuaria", texto: "soy Ana" }], storage);
  assert.match(conversacionInicial("222", "Sofía", storage)[0].texto, /Hola, Sofía/);
});

test("si no hay almacenamiento disponible, igual arranca con la bienvenida", () => {
  assert.match(conversacionInicial("111", "Ana", null)[0].texto, /Hola, Ana/);
});
