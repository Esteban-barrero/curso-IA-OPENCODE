/* ============================================================
   DIARIO DE ESTUDIO - logica.js
   ============================================================
   Lógica PURA del proyecto: cálculos de fechas, niveles y mapa
   de calor. NO toca el DOM ni localStorage.

   ¿Por qué separado? Por la constitución (principio 3): la lógica
   debe estar separada de la interfaz. Así, además, se puede probar
   con `node --test` sin abrir el navegador.

   Este archivo funciona en DOS sitios:
     - En el navegador, cargado con <script> (las funciones quedan
       disponibles de forma global).
     - En Node, importado con require() en los tests (ver el final).
   ============================================================ */

/* ------------------------------------------------------------
   CONSTANTES DE IDIOMA
   ------------------------------------------------------------
   Nombres cortos en español. Los definimos a mano (en vez de usar
   Intl) para que el resultado sea siempre el mismo en cualquier
   navegador o versión de Node.
------------------------------------------------------------ */
const DIAS_SEMANA = ["dom", "lun", "mar", "mié", "jue", "vie", "sáb"];
const MESES_CORTOS = [
  "ene", "feb", "mar", "abr", "may", "jun",
  "jul", "ago", "sep", "oct", "nov", "dic",
];

/* ------------------------------------------------------------
   FUNCIÓN: obtenerFechaLocalISO
   ------------------------------------------------------------
   Devuelve una fecha como texto "YYYY-MM-DD" usando la fecha
   LOCAL (no UTC). Si no se le pasa fecha, usa hoy.

   Ejemplo: new Date(2026, 9, 5) -> "2026-10-05"
------------------------------------------------------------ */
function obtenerFechaLocalISO(fecha = new Date()) {
  const anio = fecha.getFullYear();
  const mes = String(fecha.getMonth() + 1).padStart(2, "0");
  const dia = String(fecha.getDate()).padStart(2, "0");
  return `${anio}-${mes}-${dia}`;
}

/* ------------------------------------------------------------
   FUNCIÓN: sumarDias
   ------------------------------------------------------------
   Devuelve una NUEVA fecha sumando (o restando) días. No modifica
   la fecha original. Usa setDate, nunca milisegundos (respetando
   las reglas de la skill local-dates).
------------------------------------------------------------ */
function sumarDias(fecha, dias) {
  const copia = new Date(fecha);
  copia.setDate(copia.getDate() + dias);
  return copia;
}

/* ------------------------------------------------------------
   FUNCIÓN: nivelDeMinutos
   ------------------------------------------------------------
   Traduce minutos a un nivel de color del 0 al 4 (umbrales de la
   especificación):

     0 min            -> 0
     1 a 30 min       -> 1
     31 a 60 min      -> 2
     61 a 120 min     -> 3
     121 min o más    -> 4
------------------------------------------------------------ */
function nivelDeMinutos(minutos) {
  const m = Number(minutos);
  if (!m || m <= 0) return 0;
  if (m <= 30) return 1;
  if (m <= 60) return 2;
  if (m <= 120) return 3;
  return 4;
}

/* ------------------------------------------------------------
   FUNCIÓN: minutosPorDia
   ------------------------------------------------------------
   Recibe las sesiones y devuelve un Map que relaciona cada fecha
   ("YYYY-MM-DD") con la SUMA de minutos de ese día.

   Si hay varias sesiones el mismo día, se suman.
------------------------------------------------------------ */
function minutosPorDia(sesiones) {
  const totales = new Map();
  sesiones.forEach((sesion) => {
    const previos = totales.get(sesion.fecha) || 0;
    totales.set(sesion.fecha, previos + Number(sesion.minutos));
  });
  return totales;
}

/* ------------------------------------------------------------
   FUNCIÓN: construirMapa
   ------------------------------------------------------------
   Construye la cuadrícula del mapa de calor.

   Parámetros:
     - sesiones: array de sesiones.
     - hoy: objeto Date que representa el día actual (se pasa
       como parámetro para que la función sea pura y testeable).
     - semanas: cuántas columnas (semanas) mostrar.

   Devuelve un ARRAY DE COLUMNAS. Cada columna es un array de 7
   días (de lunes a domingo) con esta forma:
     { fechaISO, minutos, nivel }

   Reglas:
     - La última columna es la semana que contiene a "hoy".
     - Es siempre rectangular (semanas x 7), sin recortes.
     - Los días posteriores a hoy se fuerzan a nivel 0 (futuros).
------------------------------------------------------------ */
function construirMapa(sesiones, hoy, semanas) {
  const minutos = minutosPorDia(sesiones);
  const hoyISO = obtenerFechaLocalISO(hoy);

  // Día de la semana de hoy, con el lunes como 0.
  // getDay(): 0=domingo..6=sábado => (dia + 6) % 7 da lunes=0.
  const diasDesdeLunes = (hoy.getDay() + 6) % 7;

  // Lunes de la semana actual y lunes de la primera semana del rango.
  const lunesActual = sumarDias(hoy, -diasDesdeLunes);
  const lunesInicial = sumarDias(lunesActual, -7 * (semanas - 1));

  const mapa = [];
  for (let s = 0; s < semanas; s++) {
    const lunesSemana = sumarDias(lunesInicial, s * 7);
    const columna = [];

    for (let d = 0; d < 7; d++) {
      const dia = sumarDias(lunesSemana, d);
      const fechaISO = obtenerFechaLocalISO(dia);

      // Los días futuros no cuentan, aunque tengan sesión registrada.
      const esFuturo = fechaISO > hoyISO;
      let mins = minutos.get(fechaISO) || 0;
      if (esFuturo) mins = 0;

      columna.push({
        fechaISO,
        minutos: mins,
        nivel: nivelDeMinutos(mins),
      });
    }

    mapa.push(columna);
  }

  return mapa;
}

/* ------------------------------------------------------------
   FUNCIÓN: etiquetasDeMes
   ------------------------------------------------------------
   Devuelve una etiqueta por columna (semana) para rotular el mes
   encima del mapa, como en GitHub.

   Se rotula la columna cuando el mes de su primer día es distinto
   al de la columna anterior. Ejemplo de salida: ["", "", "oct", ...]
------------------------------------------------------------ */
function etiquetasDeMes(mapa) {
  const etiquetas = [];
  let mesAnterior = null;

  mapa.forEach((columna) => {
    // El primer día de la columna (lunes) marca el mes.
    const primerDia = columna[0].fechaISO;
    const mes = Number(primerDia.split("-")[1]) - 1; // 0..11

    if (mes !== mesAnterior) {
      etiquetas.push(MESES_CORTOS[mes]);
      mesAnterior = mes;
    } else {
      etiquetas.push("");
    }
  });

  return etiquetas;
}

/* ------------------------------------------------------------
   FUNCIÓN: formatearFechaDetalle
   ------------------------------------------------------------
   Convierte "YYYY-MM-DD" en un texto legible para el detalle del
   día. Ejemplo: "2026-10-05" -> "lun 5 oct 2026".
------------------------------------------------------------ */
function formatearFechaDetalle(fechaISO) {
  const [anio, mes, dia] = fechaISO.split("-").map(Number);
  // Construimos con componentes locales (regla de la constitución:
  // nunca new Date("YYYY-MM-DD"), que se interpreta en UTC).
  const fecha = new Date(anio, mes - 1, dia);
  const nombreDia = DIAS_SEMANA[fecha.getDay()];
  const nombreMes = MESES_CORTOS[mes - 1];
  return `${nombreDia} ${dia} ${nombreMes} ${anio}`;
}

/* ------------------------------------------------------------
   EXPORTACIÓN PARA NODE (tests)
   ------------------------------------------------------------
   En el navegador, "module" no existe, así que este bloque se
   ignora y las funciones quedan globales. En Node, se exportan
   para poder importarlas en los tests.
------------------------------------------------------------ */
if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    obtenerFechaLocalISO,
    sumarDias,
    nivelDeMinutos,
    minutosPorDia,
    construirMapa,
    etiquetasDeMes,
    formatearFechaDetalle,
  };
}
