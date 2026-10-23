import { test } from "node:test";
import assert from "node:assert/strict";
import { coincideBusqueda } from "./busqueda.js";

const ana = { nombre: "Ana", apellido: "Martínez", dni: "30000001", email: "ana@demo.com" };
const maria = { nombre: "María", apellido: "López", dni: "30000004", email: "maria@demo.com" };

test("sin búsqueda aparecen todas", () => {
  assert.equal(coincideBusqueda(ana, ""), true);
  assert.equal(coincideBusqueda(ana, "   "), true);
});

test("no importan los acentos ni las mayúsculas", () => {
  assert.equal(coincideBusqueda(maria, "maria"), true);
  assert.equal(coincideBusqueda(ana, "MARTINEZ"), true);
  assert.equal(coincideBusqueda(ana, "martínez"), true);
});

test("encuentra con nombre y apellido juntos, en cualquier orden", () => {
  assert.equal(coincideBusqueda(ana, "Ana Martinez"), true);
  assert.equal(coincideBusqueda(ana, "martinez ana"), true);
  assert.equal(coincideBusqueda(ana, "ana lopez"), false);
});

test("busca también por DNI y email", () => {
  assert.equal(coincideBusqueda(ana, "30000001"), true);
  assert.equal(coincideBusqueda(maria, "maria@demo"), true);
});

test("no encuentra a quien no coincide", () => {
  assert.equal(coincideBusqueda(ana, "sofia"), false);
});
