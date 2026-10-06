/* ============================================================
   Tests de la lógica pura del Diario de Estudio
   ============================================================
   Se ejecutan con:  node --test ejemplo1/tests/
   (node:test es nativo de Node, no instala nada.)

   Probamos solo funciones puras de logica.js. La parte visual se
   verifica aparte con el MCP de Chrome DevTools.
   ============================================================ */

const { test } = require("node:test");
const assert = require("node:assert");

const {
  obtenerFechaLocalISO,
  sumarDias,
  nivelDeMinutos,
  minutosPorDia,
  construirMapa,
  formatearFechaDetalle,
} = require("../logica.js");

/* ------------------------------------------------------------
   RF-2 — nivelDeMinutos (umbrales exactos)
------------------------------------------------------------ */
test("nivelDeMinutos: aplica los 5 umbrales", () => {
  assert.equal(nivelDeMinutos(0), 0);
  assert.equal(nivelDeMinutos(1), 1);
  assert.equal(nivelDeMinutos(30), 1);
  assert.equal(nivelDeMinutos(31), 2);
  assert.equal(nivelDeMinutos(60), 2);
  assert.equal(nivelDeMinutos(61), 3);
  assert.equal(nivelDeMinutos(120), 3);
  assert.equal(nivelDeMinutos(121), 4);
  assert.equal(nivelDeMinutos(1000), 4);
});

test("nivelDeMinutos: valores vacíos o inválidos -> 0", () => {
  assert.equal(nivelDeMinutos(0), 0);
  assert.equal(nivelDeMinutos(-5), 0);
  assert.equal(nivelDeMinutos(undefined), 0);
});

/* ------------------------------------------------------------
   RF-2 — minutosPorDia (suma de sesiones del mismo día)
------------------------------------------------------------ */
test("minutosPorDia: suma varias sesiones del mismo día", () => {
  const sesiones = [
    { fecha: "2026-10-05", minutos: 30 },
    { fecha: "2026-10-05", minutos: 40 },
    { fecha: "2026-10-04", minutos: 50 },
  ];
  const totales = minutosPorDia(sesiones);
  assert.equal(totales.get("2026-10-05"), 70);
  assert.equal(totales.get("2026-10-04"), 50);
  assert.equal(totales.get("2026-10-03"), undefined);
});

/* ------------------------------------------------------------
   RF-1 — construirMapa: dimensiones y forma
------------------------------------------------------------ */
test("construirMapa: devuelve 'semanas' columnas de 7 días", () => {
  const hoy = new Date(2026, 9, 5); // lunes 5 oct 2026
  const mapa = construirMapa([], hoy, 16);
  assert.equal(mapa.length, 16);
  mapa.forEach((columna) => assert.equal(columna.length, 7));
});

test("construirMapa: la primera fila es lunes y la última domingo", () => {
  const hoy = new Date(2026, 9, 5);
  const mapa = construirMapa([], hoy, 1);
  // 5 oct 2026 es lunes.
  assert.equal(mapa[0][0].fechaISO, "2026-10-05");
  assert.equal(mapa[0][6].fechaISO, "2026-10-11");
});

/* ------------------------------------------------------------
   RF-5 — construirMapa: la fecha de hoy cae en el día correcto
------------------------------------------------------------ */
test("construirMapa: hoy está en la última columna", () => {
  const hoy = new Date(2026, 9, 5);
  const mapa = construirMapa([], hoy, 16);
  const ultimaColumna = mapa[mapa.length - 1];
  const fechas = ultimaColumna.map((c) => c.fechaISO);
  assert.ok(fechas.includes("2026-10-05"));
});

/* ------------------------------------------------------------
   RF-1 — días futuros: nivel 0 aunque tengan sesión
------------------------------------------------------------ */
test("construirMapa: un día futuro con sesión se muestra en nivel 0", () => {
  const hoy = new Date(2026, 9, 5); // lunes
  const sesiones = [{ fecha: "2026-10-07", minutos: 90 }]; // miércoles futuro
  const mapa = construirMapa(sesiones, hoy, 1);
  const miercoles = mapa[0].find((c) => c.fechaISO === "2026-10-07");
  assert.equal(miercoles.nivel, 0);
  assert.equal(miercoles.minutos, 0);
});

test("construirMapa: un día pasado con sesión se colorea", () => {
  const hoy = new Date(2026, 9, 7); // miércoles 7 oct 2026
  const sesiones = [{ fecha: "2026-10-05", minutos: 90 }]; // lunes pasado
  const mapa = construirMapa(sesiones, hoy, 1);
  const lunes = mapa[0].find((c) => c.fechaISO === "2026-10-05");
  assert.equal(lunes.nivel, 3);
  assert.equal(lunes.minutos, 90);
});

/* ------------------------------------------------------------
   RF-4 — formato del detalle
------------------------------------------------------------ */
test("formatearFechaDetalle: formato 'lun 5 oct 2026'", () => {
  assert.equal(formatearFechaDetalle("2026-10-05"), "lun 5 oct 2026");
  assert.equal(formatearFechaDetalle("2026-10-04"), "dom 4 oct 2026");
});

/* ------------------------------------------------------------
   RF-5 — fechas locales
------------------------------------------------------------ */
test("obtenerFechaLocalISO / sumarDias: respetan la fecha local", () => {
  const f = new Date(2026, 9, 5); // 5 oct 2026 (mes 9 = octubre)
  assert.equal(obtenerFechaLocalISO(f), "2026-10-05");
  assert.equal(obtenerFechaLocalISO(sumarDias(f, 1)), "2026-10-06");
  assert.equal(obtenerFechaLocalISO(sumarDias(f, -1)), "2026-10-04");
});
