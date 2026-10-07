/* ============================================================
   Tests de la lógica pura del Diario de Estudio
   ============================================================
   Se ejecutan con:  node --test ejemplo1/tests/logica.test.js
   OJO: hay que poner la RUTA DEL ARCHIVO, no la carpeta del tests.
   Con la carpeta ("node --test ejemplo1/tests/") falla en Node 24,
   porque la trata como un módulo (ver MEMORY.md).

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
  normalizarObjetivo,
  rangoSemana,
  calcularMinutosSemana,
  calcularMinutosAvance,
  calcularPorcentajeObjetivo,
  formatearMinutos,
  calcularAvanceObjetivo,
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

/* ============================================================
   RF-1 — normalizarObjetivo
   ============================================================
   La lista de formas de entrada está CERRADA: lo escrito se
   convierte en el entero del objetivo, o se rechaza diciendo por
   qué (el "motivo"). Los cuatro motivos posibles son:
     "vacio"      -> no hay nada escrito
     "noNumero"   -> no se puede leer como un número
     "noPositivo" -> es 0 o negativo
     "decimales"  -> lleva punto o coma

   Cuando se acepta, "motivo" es null y "valor" es el entero ya
   normalizado (lo que se guarda y lo que se vuelve a mostrar).
   ============================================================ */

/* --- Formas ACEPTADAS: todas valen lo mismo que escribir 300 --- */
test("normalizarObjetivo: acepta las formas equivalentes a 300", () => {
  assert.deepEqual(normalizarObjetivo("300"), { valor: 300, motivo: null });
  assert.deepEqual(normalizarObjetivo("0300"), { valor: 300, motivo: null });
  assert.deepEqual(normalizarObjetivo("+300"), { valor: 300, motivo: null });
  assert.deepEqual(normalizarObjetivo(" 300 "), { valor: 300, motivo: null });
  assert.deepEqual(normalizarObjetivo("3e2"), { valor: 300, motivo: null });
});

test("normalizarObjetivo: la notación científica da el entero ('1e3')", () => {
  assert.deepEqual(normalizarObjetivo("1e3"), { valor: 1000, motivo: null });
});

/* --- Sin nada escrito --- */
test("normalizarObjetivo: vacío o solo espacios -> motivo 'vacio'", () => {
  assert.deepEqual(normalizarObjetivo(""), { valor: null, motivo: "vacio" });
  assert.deepEqual(normalizarObjetivo("   "), { valor: null, motivo: "vacio" });
});

/* --- No se puede leer como un número --- */
test("normalizarObjetivo: 'abc', 'Infinity' y '0x10' -> 'noNumero'", () => {
  assert.deepEqual(normalizarObjetivo("abc"), { valor: null, motivo: "noNumero" });
  // "Infinity" no es un número real (no es finito).
  assert.deepEqual(normalizarObjetivo("Infinity"), { valor: null, motivo: "noNumero" });
  // "0x10" es hexadecimal: el navegador lo leería como 16, no como
  // lo que la persona ha escrito.
  assert.deepEqual(normalizarObjetivo("0x10"), { valor: null, motivo: "noNumero" });
});

/* --- Los minutos tienen que ser más de 0 --- */
test("normalizarObjetivo: '0' y '-5' -> motivo 'noPositivo'", () => {
  assert.deepEqual(normalizarObjetivo("0"), { valor: null, motivo: "noPositivo" });
  assert.deepEqual(normalizarObjetivo("-5"), { valor: null, motivo: "noPositivo" });
});

/* --- Con separador decimal, aunque el número valga entero --- */
test("normalizarObjetivo: punto o coma -> motivo 'decimales'", () => {
  assert.deepEqual(normalizarObjetivo("300.5"), { valor: null, motivo: "decimales" });
  assert.deepEqual(normalizarObjetivo("300,5"), { valor: null, motivo: "decimales" });
  // "300.0" vale 300, pero el campo es de minutos enteros.
  assert.deepEqual(normalizarObjetivo("300.0"), { valor: null, motivo: "decimales" });
});

/* --- Normalización: lo escrito se guarda y se muestra normalizado --- */
test("normalizarObjetivo: normaliza '0300' a 300", () => {
  const resultado = normalizarObjetivo("0300");
  assert.equal(resultado.valor, 300);
  assert.equal(resultado.motivo, null);
});

/* --- Si no llega texto, no hay nada que interpretar --- */
test("normalizarObjetivo: si no es texto -> 'noNumero'", () => {
  // Por ejemplo, si alguien guardara un 300 en vez de "300".
  assert.deepEqual(normalizarObjetivo(300), { valor: null, motivo: "noNumero" });
  assert.deepEqual(normalizarObjetivo(null), { valor: null, motivo: "noNumero" });
  assert.deepEqual(normalizarObjetivo(undefined), { valor: null, motivo: "noNumero" });
});

/* --- Número desbordado: "1e999" se pasa de grande --- */
test("normalizarObjetivo: '1e999' (desbordado) -> 'noNumero'", () => {
  assert.deepEqual(normalizarObjetivo("1e999"), { valor: null, motivo: "noNumero" });
});

/* --- No hay máximo: un objetivo enorme se acepta --- */
test("normalizarObjetivo: no hay máximo (999999 y 100000 se aceptan)", () => {
  assert.deepEqual(normalizarObjetivo("999999"), { valor: 999999, motivo: null });
  assert.deepEqual(normalizarObjetivo("100000"), { valor: 100000, motivo: null });
});

/* ============================================================
   RF-3 / RF-4 — rangoSemana (los dos límites de la semana)
   ============================================================
   Es el ÚNICO sitio donde se calcula el lunes y el domingo de la
   semana actual. Las dos funciones de minutos lo usan, así que los
   límites se calculan igual en los dos y no pueden discrepar.

   IMPORTANTE: el día ("hoy") llega siempre como parámetro. Ninguna
   de estas funciones mira la hora del reloj por su cuenta
   (constitución, principio 3).
   ============================================================ */

test("rangoSemana: un lunes da de ese lunes al domingo", () => {
  const hoy = new Date(2026, 9, 5); // lunes 5 oct 2026
  assert.deepEqual(rangoSemana(hoy), {
    lunesISO: "2026-10-05",
    domingoISO: "2026-10-11",
  });
});

test("rangoSemana: un domingo sigue siendo la misma semana", () => {
  const hoy = new Date(2026, 9, 11); // domingo 11 oct 2026
  // El domingo pertenece a la semana que empezó el lunes 5.
  assert.deepEqual(rangoSemana(hoy), {
    lunesISO: "2026-10-05",
    domingoISO: "2026-10-11",
  });
});

test("rangoSemana: el lunes siguiente empieza otra semana", () => {
  const hoy = new Date(2026, 9, 12); // lunes 12 oct 2026
  assert.deepEqual(rangoSemana(hoy), {
    lunesISO: "2026-10-12",
    domingoISO: "2026-10-18",
  });
});

test("rangoSemana: la semana que cruza de mes y de año", () => {
  // Miércoles 28 oct 2026: la semana va del 26 de octubre al 1 de noviembre.
  assert.deepEqual(rangoSemana(new Date(2026, 9, 28)), {
    lunesISO: "2026-10-26",
    domingoISO: "2026-11-01",
  });
  // Lunes 28 dic 2026: la semana va del 28 de diciembre al 3 de enero.
  assert.deepEqual(rangoSemana(new Date(2026, 11, 28)), {
    lunesISO: "2026-12-28",
    domingoISO: "2027-01-03",
  });
});

/* ============================================================
   RF-3 — calcularPorcentajeObjetivo
   ============================================================
   Devuelve el progreso en las DOS formas en que se usa:
     - texto: lo que se lee en pantalla, con un decimal y coma
       española, empate al alza y topado en 100 %.
     - ancho: el porcentaje entero (0..100) para la barra.

   No usa toFixed: redondea en DÉCIMAS ENTERAS (0,1 % = 10) para que
   el resultado no dependa de cómo representa el número el motor.
   ============================================================ */

test("calcularPorcentajeObjetivo: los valores exactos de la especificación", () => {
  // 45 de 300 -> 15 % exacto.
  assert.deepEqual(calcularPorcentajeObjetivo(45, 300), {
    texto: "15,0 %",
    ancho: 15,
  });
  // 47 de 300 -> 15,666… % -> 15,7 %.
  assert.deepEqual(calcularPorcentajeObjetivo(47, 300), {
    texto: "15,7 %",
    ancho: 16,
  });
  // 49 de 400 -> 12,25 %: empate, SUBE a 12,3 % (nunca 12,2 %).
  assert.deepEqual(calcularPorcentajeObjetivo(49, 400), {
    texto: "12,3 %",
    ancho: 12,
  });
  // Nada estudiado todavía.
  assert.deepEqual(calcularPorcentajeObjetivo(0, 300), {
    texto: "0,0 %",
    ancho: 0,
  });
  // Meta superada: se TOPA en 100 %, nunca 166,7 %.
  assert.deepEqual(calcularPorcentajeObjetivo(500, 300), {
    texto: "100,0 %",
    ancho: 100,
  });
});

test("calcularPorcentajeObjetivo: minutos iguales al objetivo -> 100,0 %", () => {
  assert.deepEqual(calcularPorcentajeObjetivo(200, 200), {
    texto: "100,0 %",
    ancho: 100,
  });
});

test("calcularPorcentajeObjetivo: sin objetivo no se divide (0,0 %)", () => {
  // Objetivo 0 o nulo: no hay meta, así que no se puede dividir.
  // (Con objetivo 0 el resultado sería Infinity o NaN sin esta protección.)
  assert.deepEqual(calcularPorcentajeObjetivo(45, 0), { texto: "0,0 %", ancho: 0 });
  assert.deepEqual(calcularPorcentajeObjetivo(45, null), { texto: "0,0 %", ancho: 0 });
  assert.deepEqual(calcularPorcentajeObjetivo(45, undefined), { texto: "0,0 %", ancho: 0 });
});

/* ============================================================
   RF-3 — formatearMinutos (convención española)
   ============================================================
   Los números se escriben como en español: punto de miles y coma
   decimal. Es lo que produce "45.000 de 100.000 min".
   ============================================================ */

test("formatearMinutos: el ejemplo exacto de la especificación", () => {
  const texto = formatearMinutos(45000) + " de " + formatearMinutos(100000) + " min";
  assert.equal(texto, "45.000 de 100.000 min");
});

test("formatearMinutos: miles con punto, decimales con coma", () => {
  assert.equal(formatearMinutos(45000), "45.000");
  assert.equal(formatearMinutos(100000), "100.000");
  assert.equal(formatearMinutos(300), "300");
  assert.equal(formatearMinutos(30.5), "30,5");
  assert.equal(formatearMinutos(0), "0");
});

/* ============================================================
   RF-4 — calcularMinutosSemana (el marcador "Esta semana")
   ============================================================
   Esta función NO cambia de comportamiento: sigue contando las
   sesiones con fecha FUTURA. Lo que se mueve es que el día "hoy"
   llega como parámetro, para que se pueda probar.
   ============================================================ */

test("calcularMinutosSemana: cuenta desde el lunes hasta el domingo", () => {
  const hoy = new Date(2026, 9, 5); // lunes 5 oct 2026
  const sesiones = [
    { fecha: "2026-10-05", minutos: 45 }, // lunes (sí)
    { fecha: "2026-10-08", minutos: 30 }, // jueves (sí)
    { fecha: "2026-10-11", minutos: 45 }, // domingo (sí, es el límite)
  ];
  assert.equal(calcularMinutosSemana(sesiones, hoy), 120);
});

test("calcularMinutosSemana: una sesión con fecha futura también cuenta", () => {
  // El 11 oct es futuro respecto al lunes 5, pero esta función
  // (el marcador "Esta semana") sigue sumándolo: es lo que
  // exige la especificación. El avance del objetivo, en cambio,
  // lo ignorará (se comprueba más abajo).
  const hoy = new Date(2026, 9, 5); // lunes 5 oct 2026
  const sesiones = [{ fecha: "2026-10-11", minutos: 45 }];
  assert.equal(calcularMinutosSemana(sesiones, hoy), 45);
});

test("calcularMinutosSemana: el domingo anterior ya es otra semana", () => {
  const hoy = new Date(2026, 9, 5); // lunes 5 oct 2026
  const sesiones = [{ fecha: "2026-10-04", minutos: 45 }]; // domingo 4 oct
  assert.equal(calcularMinutosSemana(sesiones, hoy), 0);
});

test("calcularMinutosSemana: la semana que cruza de mes", () => {
  // Miércoles 28 oct 2026 -> semana del lunes 26 oct al domingo 1 nov.
  const hoy = new Date(2026, 9, 28);
  const sesiones = [
    { fecha: "2026-10-25", minutos: 60 }, // semana anterior: fuera
    { fecha: "2026-10-26", minutos: 45 }, // lunes
    { fecha: "2026-11-01", minutos: 30 }, // domingo, ya en noviembre
  ];
  assert.equal(calcularMinutosSemana(sesiones, hoy), 75);
});

test("calcularMinutosSemana: la semana que cruza de año", () => {
  // Lunes 28 dic 2026 -> semana del 28 dic 2026 al 3 ene 2027.
  const hoy = new Date(2026, 11, 28);
  const sesiones = [
    { fecha: "2026-12-27", minutos: 60 }, // domingo anterior: fuera
    { fecha: "2026-12-28", minutos: 45 }, // lunes
    { fecha: "2027-01-03", minutos: 30 }, // domingo, ya en 2027
  ];
  assert.equal(calcularMinutosSemana(sesiones, hoy), 75);

  // El rango se compara con el texto COMPLETO "AAAA-MM-DD": el
  // lunes 4 de enero de 2027 queda FUERA aunque su mes (enero) y
  // su año coincidan con días de la semana. Nunca se compara
  // solo con un prefijo "AAAA-MM".
  const conEneroFuera = [...sesiones, { fecha: "2027-01-04", minutos: 20 }];
  assert.equal(calcularMinutosSemana(conEneroFuera, hoy), 75);
});

test("calcularMinutosSemana: a las 00:30 del lunes manda la semana nueva", () => {
  const hoy = new Date(2026, 9, 5, 0, 30); // lunes 5 oct 2026 a las 00:30
  const sesiones = [
    { fecha: "2026-10-04", minutos: 50 }, // domingo anterior: fuera
    { fecha: "2026-10-05", minutos: 45 }, // el lunes de esta semana: dentro
  ];
  assert.equal(calcularMinutosSemana(sesiones, hoy), 45);
});

test("calcularMinutosSemana: el día del cambio de hora (25 oct 2026)", () => {
  // El cambio de hora en España es de madrugada. Como los límites
  // se calculan con sumarDias (que usa setDate, nunca milisegundos),
  // la semana sigue siendo la misma.
  const hoy = new Date(2026, 9, 25, 12, 0); // domingo 25 oct 2026
  const sesiones = [
    { fecha: "2026-10-19", minutos: 45 }, // lunes
    { fecha: "2026-10-22", minutos: 30 }, // jueves
    { fecha: "2026-10-25", minutos: 60 }, // domingo
  ];
  assert.equal(calcularMinutosSemana(sesiones, hoy), 135);
});

test("calcularMinutosSemana: varias sesiones el mismo día y decimales", () => {
  const hoy = new Date(2026, 9, 7); // miércoles 7 oct 2026
  const sesiones = [
    { fecha: "2026-10-06", minutos: 30.5 },
    { fecha: "2026-10-06", minutos: 30.5 }, // mismo día: suman
    { fecha: "2026-10-07", minutos: 20 },
  ];
  // 30,5 + 30,5 = 61 y 61 + 20 = 81. Los decimales se suman
  // tal cual: no se truncan.
  assert.equal(calcularMinutosSemana(sesiones, hoy), 81);
});

/* ============================================================
   RF-4 — calcularMinutosAvance (el avance del objetivo)
   ============================================================
   Es IGUAL que calcularMinutosSemana con una única diferencia:
   IGNORA las sesiones con fecha futura. Las dos dan el mismo
   resultado cuando no hay fechas futuras.
   ============================================================ */

test("calcularMinutosAvance: ignora la sesión con fecha futura", () => {
  const hoy = new Date(2026, 9, 7); // miércoles 7 oct 2026
  const sesiones = [
    { fecha: "2026-10-05", minutos: 45 }, // lunes: cuenta
    { fecha: "2026-10-07", minutos: 30 }, // hoy: cuenta
    { fecha: "2026-10-09", minutos: 60 }, // viernes FUTURO: no cuenta
    { fecha: "2026-10-04", minutos: 50 }, // semana anterior: no cuenta
  ];
  // El avance es 45 + 30 = 75; "Esta semana" además suma los 60
  // futuros: 45 + 30 + 60 = 135. La diferencia son exactamente los
  // 60 minutos con fecha futura (y eso es lo correcto).
  assert.equal(calcularMinutosAvance(sesiones, hoy), 75);
  assert.equal(calcularMinutosSemana(sesiones, hoy), 135);
});

test("calcularMinutosAvance: sin fechas futuras, avance y total coinciden", () => {
  const hoy = new Date(2026, 9, 7);
  const sesiones = [
    { fecha: "2026-10-05", minutos: 45 },
    { fecha: "2026-10-07", minutos: 30 },
    { fecha: "2026-10-04", minutos: 50 }, // semana anterior, fuera de las dos
  ];
  assert.equal(calcularMinutosAvance(sesiones, hoy), 75);
  assert.equal(calcularMinutosAvance(sesiones, hoy), calcularMinutosSemana(sesiones, hoy));
});

test("calcularMinutosAvance: solo con una sesión de la semana anterior -> 0", () => {
  const hoy = new Date(2026, 9, 7); // miércoles 7 oct 2026
  const sesiones = [{ fecha: "2026-10-04", minutos: 50 }]; // domingo anterior
  assert.equal(calcularMinutosAvance(sesiones, hoy), 0);
});

test("calcularMinutosAvance: la semana que cruza de mes", () => {
  const hoy = new Date(2026, 9, 28); // miércoles 28 oct 2026
  const sesiones = [
    { fecha: "2026-10-26", minutos: 45 }, // lunes: cuenta
    { fecha: "2026-10-27", minutos: 30 }, // martes: cuenta
    { fecha: "2026-11-01", minutos: 30 }, // domingo futuro: NO cuenta
    { fecha: "2026-10-25", minutos: 60 }, // semana anterior: fuera
  ];
  assert.equal(calcularMinutosAvance(sesiones, hoy), 75);
  assert.equal(calcularMinutosSemana(sesiones, hoy), 105);
});

test("calcularMinutosAvance: la semana que cruza de año", () => {
  // Miércoles 30 dic 2026 -> semana del lunes 28 dic 2026 al domingo 3 ene 2027.
  const hoy = new Date(2026, 11, 30);
  const sesiones = [
    { fecha: "2026-12-28", minutos: 45 }, // lunes: cuenta
    { fecha: "2026-12-29", minutos: 30 }, // martes: cuenta
    { fecha: "2027-01-03", minutos: 30 }, // domingo futuro: NO cuenta
    { fecha: "2027-01-04", minutos: 20 }, // lunes siguiente: fuera de las dos
  ];
  assert.equal(calcularMinutosAvance(sesiones, hoy), 75);
  assert.equal(calcularMinutosSemana(sesiones, hoy), 105);
});

/* ============================================================
   RNF — pruebas de que la lógica es PURA (recibe "hoy")
   ============================================================
   Estas pruebas pasan un "hoy" lejanísimo. Si alguna función
   leyera la hora del reloj por su cuenta (hoy son los 6 de octubre
   de 2026) devolvería 0 y el test fallaría. Sirven para las dos
   funciones de minutos.
   ============================================================ */

test("las funciones de minutos no miran el reloj (hoy = marzo de 2024)", () => {
  const hoy = new Date(2024, 2, 6); // miércoles 6 mar 2024
  const sesiones = [
    { fecha: "2024-03-04", minutos: 45 }, // lunes: cuenta
    { fecha: "2024-03-06", minutos: 30 }, // hoy: cuenta
    { fecha: "2024-03-10", minutos: 60 }, // domingo futuro: no cuenta
  ];
  assert.equal(calcularMinutosAvance(sesiones, hoy), 75);
  assert.equal(calcularMinutosSemana(sesiones, hoy), 135);
});

test("las funciones de minutos no miran el reloj (hoy = marzo de 2027)", () => {
  // Un año por delante: el otro extremo.
  const hoy = new Date(2027, 2, 3); // miércoles 3 mar 2027
  const sesiones = [
    { fecha: "2027-03-01", minutos: 45 }, // lunes: cuenta
    { fecha: "2027-03-03", minutos: 30 }, // hoy: cuenta
    { fecha: "2027-03-07", minutos: 60 }, // domingo futuro: no cuenta
  ];
  assert.equal(calcularMinutosAvance(sesiones, hoy), 75);
  assert.equal(calcularMinutosSemana(sesiones, hoy), 135);
});

/* ============================================================
   RF-3 / RF-5 — calcularAvanceObjetivo (el agregador)
   ============================================================
   Es el ÚNICO punto de entrada del bloque del objetivo. Junta
   en un solo objeto todo lo que hay que pintar:

     - normaliza el texto del objetivo guardado (si está corrupto
       lo trata como "sin objetivo", pero sin lanzar errores),
     - calcula los minutos de avance (SIN fechas futuras) y el
       total de la semana (CON fechas futuras),
     - y devuelve el porcentaje, el ancho de la barra y si la
       meta está cumplida.

   Los minutos de avance, el porcentaje y "cumplida" salen TODOS
   de los mismos minutos: por eso el avance y su porcentaje no
   pueden contradecirse.

   Y recibe "hoy" como parámetro: no mira el reloj por su cuenta.
   ============================================================ */

/* --- Sin objetivo fijado: invitación, sin porcentaje y sin barra --- */
test("calcularAvanceObjetivo: sin objetivo no hay porcentaje ni barra", () => {
  const hoy = new Date(2026, 9, 7); // miércoles 7 oct 2026
  const sesiones = [
    { fecha: "2026-10-05", minutos: 100 }, // lunes: cuenta
    { fecha: "2026-10-07", minutos: 100 }, // hoy: cuenta
    { fecha: "2026-10-09", minutos: 60 },  // viernes futuro: no cuenta
  ];
  // null = nunca se fijó un objetivo.
  const estado = calcularAvanceObjetivo(sesiones, null, hoy);

  assert.equal(estado.hayObjetivo, false);
  assert.equal(estado.objetivo, null);
  assert.equal(estado.porcentaje, null); // sin meta no hay progreso
  assert.equal(estado.ancho, 0);         // y la barra no se llena
  assert.equal(estado.cumplida, false);
  assert.equal(estado.hayFuturo, false);
  // Los minutos SÍ se calculan igualmente (el "Esta semana" de la
  // portada no depende de que haya objetivo).
  assert.equal(estado.minutosAvance, 200);
  assert.equal(estado.minutosSemana, 260);
});

/* --- Objetivo guardado corrupto: se trata como "sin objetivo" --- */
test("calcularAvanceObjetivo: un objetivo corrupto se trata como sin objetivo", () => {
  const hoy = new Date(2026, 9, 7); // miércoles 7 oct 2026
  const sesiones = [{ fecha: "2026-10-07", minutos: 45 }];

  // Ninguno de estos cuatro textos es un objetivo válido. La web
  // debe seguir funcionando y enseñar la invitación (sin excepciones).
  const corruptos = ["abc", "0", "300.5", "{}"];
  corruptos.forEach((guardado) => {
    const estado = calcularAvanceObjetivo(sesiones, guardado, hoy);
    assert.equal(estado.hayObjetivo, false, `objetivo "${guardado}"`);
    assert.equal(estado.objetivo, null, `objetivo "${guardado}"`);
    assert.equal(estado.porcentaje, null, `objetivo "${guardado}"`);
    assert.equal(estado.ancho, 0, `objetivo "${guardado}"`);
    // Los minutos de la semana no se pierden por tener el dato feo.
    assert.equal(estado.minutosAvance, 45, `objetivo "${guardado}"`);
  });
});

/* --- Minutos iguales al objetivo: está cumplida (igual o mayor) --- */
test("calcularAvanceObjetivo: 200 minutos con objetivo 200 -> cumplida", () => {
  const hoy = new Date(2026, 9, 7); // miércoles 7 oct 2026
  const sesiones = [
    { fecha: "2026-10-05", minutos: 100 }, // lunes
    { fecha: "2026-10-07", minutos: 100 }, // miércoles
  ];
  const estado = calcularAvanceObjetivo(sesiones, "200", hoy);

  assert.equal(estado.hayObjetivo, true);
  assert.equal(estado.objetivo, 200);
  assert.equal(estado.minutosAvance, 200);
  assert.equal(estado.porcentaje, "100,0 %");
  assert.equal(estado.ancho, 100);
  assert.equal(estado.cumplida, true);
  assert.equal(estado.hayFuturo, false);
});

/* --- Normalización al leer: "0300" es el mismo objetivo que 300 --- */
test("calcularAvanceObjetivo: '0300' se lee como objetivo 300", () => {
  const hoy = new Date(2026, 9, 7); // miércoles 7 oct 2026
  const sesiones = [{ fecha: "2026-10-07", minutos: 150 }];
  const estado = calcularAvanceObjetivo(sesiones, "0300", hoy);

  assert.equal(estado.hayObjetivo, true);
  assert.equal(estado.objetivo, 300);
  assert.equal(estado.porcentaje, "50,0 %");
});

/* --- Meta fijada A MEDIA SEMANA: cuenta lo ya estudiado --- */
test("calcularAvanceObjetivo: meta fijada a media semana cuenta lo estudiado", () => {
  // Miércoles 7 oct 2026: si se fija 300 cuando ya hay 200 min del
  // lunes y el martes, se va por 66,7 % (el valor exacto de RF-1).
  const hoy = new Date(2026, 9, 7);
  const sesiones = [
    { fecha: "2026-10-05", minutos: 100 }, // lunes
    { fecha: "2026-10-06", minutos: 100 }, // martes
  ];
  const estado = calcularAvanceObjetivo(sesiones, "300", hoy);

  assert.equal(estado.objetivo, 300);
  assert.equal(estado.minutosAvance, 200);
  assert.equal(estado.porcentaje, "66,7 %");
  assert.equal(estado.ancho, 67);
  assert.equal(estado.cumplida, false);
});

/* --- Objetivo menor que lo estudiado: los minutos NO se recortan --- */
test("calcularAvanceObjetivo: objetivo menor que lo estudiado -> cumplida sin recortar", () => {
  const hoy = new Date(2026, 9, 7); // miércoles 7 oct 2026
  const sesiones = [{ fecha: "2026-10-07", minutos: 200 }];

  const estado = calcularAvanceObjetivo(sesiones, "100", hoy);
  assert.equal(estado.cumplida, true);
  assert.equal(estado.porcentaje, "100,0 %");
  // Los minutos reales se muestran enteros: nunca se recortan.
  assert.equal(estado.minutosAvance, 200);

  // Meta superada (el caso 500 de 300 de la especificación).
  const muchas = [{ fecha: "2026-10-07", minutos: 500 }];
  const superado = calcularAvanceObjetivo(muchas, "300", hoy);
  assert.equal(superado.cumplida, true);
  assert.equal(superado.porcentaje, "100,0 %"); // topado, nunca 166,7 %
  assert.equal(superado.minutosAvance, 500);    // se ven los 500
});

/* --- Con fechas futuras: los dos números difieren y hay que avisar --- */
test("calcularAvanceObjetivo: hayFuturo cuando los dos totales difieren", () => {
  const hoy = new Date(2026, 9, 7); // miércoles 7 oct 2026
  const sesiones = [
    { fecha: "2026-10-05", minutos: 45 }, // lunes: cuenta
    { fecha: "2026-10-07", minutos: 30 }, // hoy: cuenta
    { fecha: "2026-10-09", minutos: 60 }, // viernes FUTURO: no cuenta
  ];
  const estado = calcularAvanceObjetivo(sesiones, "300", hoy);

  assert.equal(estado.minutosAvance, 75);   // lo que se ve en el objetivo
  assert.equal(estado.minutosSemana, 135);  // lo que ve "Esta semana"
  assert.equal(estado.hayFuturo, true);    // por eso hay que explicarlo
  assert.equal(estado.porcentaje, "25,0 %");
  assert.equal(estado.cumplida, false);
});

/* --- Cambio de semana: el avance se reinicia, el objetivo se guarda --- */
test("calcularAvanceObjetivo: al cambiar de semana el avance es 0 y el objetivo sigue", () => {
  // Las sesiones son de la semana ANTERIOR: no cuentan para el avance.
  const sesiones = [
    { fecha: "2026-11-05", minutos: 45 }, // jueves 5 nov 2026
    { fecha: "2026-11-06", minutos: 30 }, // viernes 6 nov 2026
  ];

  // Jueves 12 nov 2026 -> semana del lunes 9 al domingo 15 de noviembre.
  const nuevoMes = calcularAvanceObjetivo(sesiones, "300", new Date(2026, 10, 12));
  assert.equal(nuevoMes.hayObjetivo, true);
  assert.equal(nuevoMes.objetivo, 300);      // la meta NO se pierde
  assert.equal(nuevoMes.minutosAvance, 0);   // la semana nueva empieza a cero
  assert.equal(nuevoMes.minutosSemana, 0);
  assert.equal(nuevoMes.porcentaje, "0,0 %");
  assert.equal(nuevoMes.cumplida, false);
  assert.equal(nuevoMes.hayFuturo, false);

  // El mismo caso un lunes (16 nov 2026, semana del 16 al 22): da igual,
  // porque el cálculo depende solo del día recibido.
  const nuevoDia = calcularAvanceObjetivo(sesiones, "300", new Date(2026, 10, 16));
  assert.equal(nuevoDia.objetivo, 300);
  assert.equal(nuevoDia.minutosAvance, 0);
});

/* ============================================================
   RNF — el agregador tampoco mira el reloj
   ============================================================
   Estas pruebas le pasan un "hoy" lejanísimo. Si el agregador
   leyera la hora del reloj por su cuenta (hoy son los 6 de octubre
   de 2026) devolvería 0 minutos y el test fallaría.
   ============================================================ */

test("calcularAvanceObjetivo no mira el reloj (hoy = marzo de 2024)", () => {
  const hoy = new Date(2024, 2, 6); // miércoles 6 mar 2024
  const sesiones = [
    { fecha: "2024-03-04", minutos: 45 }, // lunes: cuenta
    { fecha: "2024-03-06", minutos: 30 }, // hoy: cuenta
    { fecha: "2024-03-10", minutos: 60 }, // domingo futuro: no cuenta
  ];
  const estado = calcularAvanceObjetivo(sesiones, "300", hoy);

  assert.equal(estado.objetivo, 300);
  assert.equal(estado.minutosAvance, 75);
  assert.equal(estado.minutosSemana, 135);
  assert.equal(estado.porcentaje, "25,0 %");
  assert.equal(estado.hayFuturo, true);
});

test("calcularAvanceObjetivo no mira el reloj (hoy = marzo de 2027)", () => {
  // Un año por delante: el otro extremo.
  const hoy = new Date(2027, 2, 3); // miércoles 3 mar 2027
  const sesiones = [
    { fecha: "2027-03-01", minutos: 45 }, // lunes: cuenta
    { fecha: "2027-03-03", minutos: 30 }, // hoy: cuenta
    { fecha: "2027-03-07", minutos: 60 }, // domingo futuro: no cuenta
  ];
  const estado = calcularAvanceObjetivo(sesiones, "300", hoy);

  assert.equal(estado.objetivo, 300);
  assert.equal(estado.minutosAvance, 75);
  assert.equal(estado.minutosSemana, 135);
  assert.equal(estado.porcentaje, "25,0 %");
  assert.equal(estado.hayFuturo, true);
});

/* ============================================================
   MINUTOS DECIMALES (hueco de auditoría)

   La especificación dice, en "Casos límite":

     "Minutos decimales ya guardados en sesiones antiguas
      (p. ej. 30,5 min): se suman tal cual, el avance usa esa
      suma y el porcentaje se redondea a un solo decimal; no se
      descartan ni se truncan los minutos."

   Antes esto solo se comprobaba en calcularMinutosSemana (el
   marcador "Esta semana"). NO había ningún test de decimales en
   calcularMinutosAvance ni en calcularPorcentajeObjetivo, así
   que una implementación que hiciera Math.floor(sesion.minutos)
   o Math.round en el avance habría pasado todos los tests en
   verde. Estos tests son los que faltan.
   ============================================================ */

/* ------------------------------------------------------------
   RF-3 / RF-4 — calcularMinutosAvance con minutos decimales
   ------------------------------------------------------------
   POR QUÉ importan estos casos: si alguien "arreglara" el avance
   poniendo Math.floor o Math.round sobre los minutos (para que
   los números salieran enteros), estos tests se Pondrían rojos:

     - 30,5 min se truncan a 30 con Math.floor y a 31 con
       Math.round: aquí tiene que quedar 30,5.
     - 30,5 + 30,5 con Math.floor daría 60 (y con Math.round, 61):
       aquí tiene que dar 61.
   Los minutos son REALES: no se pierden décimas por el camino.
   ------------------------------------------------------------ */
test("calcularMinutosAvance: 30,5 min de esta semana -> 30,5 (sin truncar)", () => {
  const hoy = new Date(2026, 9, 7); // miércoles 7 oct 2026
  const sesiones = [{ fecha: "2026-10-07", minutos: 30.5 }]; // hoy

  // Ni Math.floor (30) ni Math.round (31): el decimal se conserva.
  assert.equal(calcularMinutosAvance(sesiones, hoy), 30.5);
});

test("calcularMinutosAvance: dos sesiones decimales el mismo día suman 61", () => {
  const hoy = new Date(2026, 9, 7); // miércoles 7 oct 2026
  const sesiones = [
    { fecha: "2026-10-06", minutos: 30.5 },
    { fecha: "2026-10-06", minutos: 30.5 }, // mismo día: suman entre sí
  ];
  // 30,5 + 30,5 = 61. Si se truncara cada sesión antes de sumar,
  // saldrían 30 + 30 = 60 y este test fallaría.
  assert.equal(calcularMinutosAvance(sesiones, hoy), 61);
});

test("calcularMinutosAvance: una sesión decimal de la semana anterior -> 0", () => {
  const hoy = new Date(2026, 9, 7); // miércoles 7 oct 2026
  const sesiones = [{ fecha: "2026-10-04", minutos: 30.5 }]; // domingo anterior
  // Fuera de la semana, los decimales tampoco cuentan: 0 y no 30,5.
  assert.equal(calcularMinutosAvance(sesiones, hoy), 0);
});

test("calcularMinutosAvance: una sesión decimal con fecha futura -> 0", () => {
  const hoy = new Date(2026, 9, 7); // miércoles 7 oct 2026
  const sesiones = [{ fecha: "2026-10-09", minutos: 30.5 }]; // viernes FUTURO
  // El avance ignora el futuro, también cuando los minutos son
  // decimales. "Esta semana", en cambio, sí lo suma: esa es la
  // diferencia deliberada entre las dos funciones.
  assert.equal(calcularMinutosAvance(sesiones, hoy), 0);
  assert.equal(calcularMinutosSemana(sesiones, hoy), 30.5);
});

/* ------------------------------------------------------------
   RF-3 — calcularPorcentajeObjetivo con avance NO entero
   ------------------------------------------------------------
   El avance puede llegar con decimales (sesiones antiguas), así
   que el porcentaje tiene que estar preparado para eso. El
   redondeo es el del plan (5.2): se trabaja en DÉCIMAS enteras
   con Math.floor(x + 0.5), nunca con toFixed.
   ------------------------------------------------------------ */
test("calcularPorcentajeObjetivo: 30,5 de 300 -> '10,2 %'", () => {
  // 30,5 / 300 = 10,1666… %. En décimas: 30,5 * 1000 / 300 = 101,66…,
  // + 0,5 = 102,16… y Math.floor = 102 -> "10,2 %".
  assert.deepEqual(calcularPorcentajeObjetivo(30.5, 300), {
    texto: "10,2 %",
    ancho: 10,
  });
});

test("calcularPorcentajeObjetivo: 61 de 300 (30,5 + 30,5) -> '20,3 %'", () => {
  // 61 / 300 = 20,333… %. En décimas: 203,33 + 0,5 = 203,83 -> 203.
  assert.deepEqual(calcularPorcentajeObjetivo(61, 300), {
    texto: "20,3 %",
    ancho: 20,
  });
});

test("calcularPorcentajeObjetivo: 30,5 de 30,5 -> exactamente '100,0 %'", () => {
  // Un decimal que llega JUSTO al objetivo: 1000 décimas exactas.
  // Con un redondeo mal hecho podría salir "99,9 %" o "100,1 %".
  assert.deepEqual(calcularPorcentajeObjetivo(30.5, 30.5), {
    texto: "100,0 %",
    ancho: 100,
  });
});

test("calcularPorcentajeObjetivo: 500,5 de 300 -> '100,0 %' y sin recortar minutos", () => {
  // El avance NUNCA se recorta para que "quepa" en el objetivo:
  // el porcentaje se topa en 100 %, pero los minutos reales siguen
  // siendo 500,5 (de eso se encarga el agregador, que se testea abajo).
  assert.deepEqual(calcularPorcentajeObjetivo(500.5, 300), {
    texto: "100,0 %",
    ancho: 100,
  });
});

/* ------------------------------------------------------------
   RF-3 / RF-4 / RF-5 — decimales en el agregado y en el texto
   ------------------------------------------------------------
   formatearMinutos(30.5) -> "30,5" YA está testeado más arriba
   ("formatearMinutos: miles con punto, decimales con coma"), así
   que aquí no se repite: lo que se añade es que el decimal llega
   entero hasta la línea que se lee en pantalla ("30,5 de 300 min").
   ------------------------------------------------------------ */
test("calcularAvanceObjetivo: con 30,5 min el avance y el porcentaje son decimales", () => {
  const hoy = new Date(2026, 9, 7); // miércoles 7 oct 2026
  const sesiones = [{ fecha: "2026-10-07", minutos: 30.5 }]; // hoy

  const estado = calcularAvanceObjetivo(sesiones, "300", hoy);

  assert.equal(estado.hayObjetivo, true);
  assert.equal(estado.objetivo, 300);
  // El avance conserva el decimal: 30,5 y no 30 ni 31.
  assert.equal(estado.minutosAvance, 30.5);
  assert.equal(estado.minutosSemana, 30.5);
  // 30,5 de 300 = 10,1666… % -> "10,2 %" (un solo decimal, coma).
  assert.equal(estado.porcentaje, "10,2 %");
  assert.equal(estado.ancho, 10);
  assert.equal(estado.cumplida, false); // 30,5 es menos de 300
  assert.equal(estado.hayFuturo, false);

  // Y la línea de cifras que se lee en pantalla sale con el decimal
  // en español: "30,5 de 300 min".
  const cifras =
    formatearMinutos(estado.minutosAvance) + " de " + formatearMinutos(estado.objetivo) + " min";
  assert.equal(cifras, "30,5 de 300 min");
});
