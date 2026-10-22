// Pruebas de GT-153 (mensaje de bienvenida y horario de atención).
import { test } from "node:test";
import assert from "node:assert/strict";
import { estaEnHorario, mensajeBienvenida } from "./chatbot.js";

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
