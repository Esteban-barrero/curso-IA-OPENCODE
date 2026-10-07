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
   FUNCIÓN: normalizarObjetivo
   ------------------------------------------------------------
   Convierte lo que la persona ha escrito en el entero del
   objetivo semanal, o explica por qué no se puede aceptar.

   Recibe TEXTO (lo que sale del campo del formulario o de lo
   guardado en el navegador) y devuelve un objeto:

     { valor: <el entero> o null, motivo: <el motivo> o null }

   Hay cuatro motivos posibles, para poder escribir un mensaje
   distinto para cada causa:

     "vacio"      -> no hay nada escrito
     "noNumero"   -> no se puede leer como un número
     "noPositivo" -> es cero o negativo
     "decimales"  -> lleva punto o coma

   Ejemplos:
     "300"   -> { valor: 300, motivo: null }
     "0300"  -> { valor: 300, motivo: null }   (se normaliza)
     "+300"  -> { valor: 300, motivo: null }
     " 300 " -> { valor: 300, motivo: null }
     "3e2"   -> { valor: 300, motivo: null }
     ""      -> { valor: null, motivo: "vacio" }
     "abc"   -> { valor: null, motivo: "noNumero" }
     "0x10"  -> { valor: null, motivo: "noNumero" }
     "0"     -> { valor: null, motivo: "noPositivo" }
     "-5"    -> { valor: null, motivo: "noPositivo" }
     "300.5" -> { valor: null, motivo: "decimales" }
------------------------------------------------------------ */
function normalizarObjetivo(texto) {
  // 1) Solo admitimos texto. Si llega otra cosa (un número, un
  //    objeto que venga del almacenamiento) no hay nada que
  //    interpretar y lo tratamos como "no es un número".
  if (typeof texto !== "string") {
    return { valor: null, motivo: "noNumero" };
  }

  // 2) Los espacios de fuera se ignoran: " 300 " vale 300.
  const limpio = texto.trim();

  // 3) Si después de quitar los espacios no queda nada escrito.
  if (limpio === "") {
    return { valor: null, motivo: "vacio" };
  }

  // 4) Un punto o una coma SIEMPRE son decimales, aunque el
  //    número valga entero: "300.0" vale 300, pero aquí los
  //    minutos se cuentan enteros, así que se rechaza.
  if (limpio.includes(".") || limpio.includes(",")) {
    return { valor: null, motivo: "decimales" };
  }

  // 5) La FORMA del número: un signo opcional, cifras y un
  //    exponente opcional (por eso valen "+300", "3e2", "1e3").
  //    Esta comprobación también descarta "abc" y "0x10" (esa
  //    lleva una "x": es hexadecimal, no decimal).
  const formaNumero = /^[+-]?\d+([eE][+-]?\d+)?$/;
  if (!formaNumero.test(limpio)) {
    return { valor: null, motivo: "noNumero" };
  }

  // 6) La forma ya es correcta, así que convertimos a número.
  //    Aquí es donde se normaliza: "0300" -> 300, "+300" -> 300.
  const numero = Number(limpio);

  // 7) Sin valores desbordados: "1e999" se pasa de grande y da
  //    Infinity, que no es un número real (no es finito).
  if (!Number.isFinite(numero)) {
    return { valor: null, motivo: "noNumero" };
  }

  // 8) Cinturón de seguridad: si ha salido un decimal (por
  //    ejemplo "1e-2", que vale 0,01), el motivo es "decimales".
  if (!Number.isInteger(numero)) {
    return { valor: null, motivo: "decimales" };
  }

  // 9) Los minutos tienen que ser más de 0: "0" y "-5" caen aquí.
  if (numero <= 0) {
    return { valor: null, motivo: "noPositivo" };
  }

  // 10) No hay máximo: 999999 o 100000 se aceptan tal cual.
  return { valor: numero, motivo: null };
}

/* ------------------------------------------------------------
   FUNCIÓN: rangoSemana
   ------------------------------------------------------------
   Devuelve los dos límites de la semana natural (de lunes a
   domingo) como texto "YYYY-MM-DD":

     { lunesISO: "2026-10-05", domingoISO: "2026-10-11" }

   El día "hoy" entra como PARÁMETRO: aquí dentro no se mira el
   reloj, igual que en construirMapa.

   Este es el ÚNICO sitio donde se calculan el lunes y el domingo.
   Las dos funciones de minutos de abajo lo usan, así que los dos
   totales de la semana se calculan siempre igual y no pueden
   discrepar entre sí.

   Cómo se averigua el lunes:
     getDay() devuelve 0=domingo, 1=lunes ... 6=sábado. Con la
     fórmula (dia + 6) % 7 el lunes sale 0 y el domingo 6, que es
     justo el reparto que necesitamos.
   ------------------------------------------------------------ */
function rangoSemana(hoy) {
  // 1) Cuántos días lleva "hoy" desde el lunes de su semana.
  const diasDesdeLunes = (hoy.getDay() + 6) % 7;

  // 2) El lunes de esta semana y el domingo (lunes + 6 días).
  const lunes = sumarDias(hoy, -diasDesdeLunes);
  const domingo = sumarDias(lunes, 6);

  return {
    lunesISO: obtenerFechaLocalISO(lunes),
    domingoISO: obtenerFechaLocalISO(domingo),
  };
}

/* ------------------------------------------------------------
   FUNCIÓN: calcularMinutosSemana
   ------------------------------------------------------------
   Suma los MINUTOS de todas las sesiones que caen en la semana
   ACTUAL (de lunes a domingo), usando la fecha local del usuario.

   OJO: esta función CUENTA TAMBIÉN las sesiones con fecha futura.
   Es el marcador "Esta semana" de la portada y su comportamiento
   no cambia en esta especificación. El avance del objetivo, que
   sí ignora el futuro, es otra función más abajo.

   "Hoy" llega como parámetro: antes esta función vivía en app.js
   y se miraba el reloj por su cuenta con new Date(). Ahora recibe
   el día, y por eso se puede probar con node --test.

   Truco: para comparar fechas usamos el texto COMPLETO
   "YYYY-MM-DD", que se ordena igual que el calendario
   ("2026-10-05" < "2026-10-06"), nunca un prefijo "AAAA-MM".
   ------------------------------------------------------------ */
function calcularMinutosSemana(sesiones, hoy) {
  // 1 y 2) Los dos límites de la semana, calculados por rangoSemana.
  const { lunesISO, domingoISO } = rangoSemana(hoy);

  // 3) Sumamos los minutos de las sesiones dentro de ese rango.
  let total = 0;
  sesiones.forEach((sesion) => {
    if (sesion.fecha >= lunesISO && sesion.fecha <= domingoISO) {
      total += sesion.minutos;
    }
  });

  return total;
}

/* ------------------------------------------------------------
   FUNCIÓN: calcularMinutosAvance
   ------------------------------------------------------------
   Minutos de la semana ACTUAL (de lunes a domingo) IGNORANDO las
   sesiones con fecha futura. Son los minutos que se comparan con
   el objetivo semanal.

   Es la misma suma que calcularMinutosSemana con una única
   diferencia: además de estar dentro de la semana, la sesión tiene
   que ser de hoy o de un día anterior ("sesion.fecha <= hoyISO").
   Por eso, cuando hay sesiones con fecha futura, el avance y
   "Esta semana" dan números distintos... y eso es lo correcto:
   son dos reglas deliberadas.

   Sin fechas futuras, las dos funciones dan el mismo resultado.
   ------------------------------------------------------------ */
function calcularMinutosAvance(sesiones, hoy) {
  // 1 y 2) Los mismos límites que usa la función de arriba.
  const { lunesISO, domingoISO } = rangoSemana(hoy);

  // El día de hoy como texto, para poder descartar lo que sea futuro.
  const hoyISO = obtenerFechaLocalISO(hoy);

  let total = 0;
  sesiones.forEach((sesion) => {
    const estaEnSemana = sesion.fecha >= lunesISO && sesion.fecha <= domingoISO;
    const noEsFutura = sesion.fecha <= hoyISO;

    // Number(...) por si los minutos vinieran guardados como texto.
    if (estaEnSemana && noEsFutura) {
      total += Number(sesion.minutos);
    }
  });

  return total;
}

/* ------------------------------------------------------------
   FUNCIÓN: calcularPorcentajeObjetivo
   ------------------------------------------------------------
   Calcula el progreso hacia el objetivo en las dos formas en que
   se usa:

     { texto: "15,7 %", ancho: 16 }

       - texto: lo que se LEE en pantalla. Un solo decimal, con
         coma española, empate al alza y topado en 100 %.
       - ancho: el porcentaje entero (0..100) para el ancho de la
         barra de progreso.

   Esta función NO recibe "hoy": no depende de ninguna fecha, así
   que no tiene nada que mirar del reloj.

   El redondeo se hace en DÉCIMAS ENTERAS (una unidad = 0,1 %) en
   lugar de usar toFixed, porque toFixed depende de cómo el motor
   representa el número en binario (12,25 % puede salir "12,2 %" o
   "12,3 %" según el navegador). Con enteros el resultado siempre
   es el mismo, y el empate 49/400 sube a "12,3 %".
   ------------------------------------------------------------ */
function calcularPorcentajeObjetivo(minutosAvance, objetivo) {
  // Sin objetivo (nulo, cero, negativo o algo que no es número) no se
  // puede dividir: no hay progreso y se muestra 0,0 %.
  if (typeof objetivo !== "number" || !Number.isFinite(objetivo) || objetivo <= 0) {
    return { texto: "0,0 %", ancho: 0 };
  }

  // Paso 1: el porcentaje en DÉCIMAS (diez veces más grande):
  //   45/300  ->  45000/300  = 150,0   -> 150 -> "15,0 %"
  //   47/300  ->  47000/300  = 156,66… -> 157 -> "15,7 %"
  //   49/400  ->  49000/400  = 122,5   -> 123 -> "12,3 %" (empate: sube)
  //   500/300 -> 500000/300  = 1666,66 -> 1667 -> topado a 1000
  // El "+ 0.5" antes de cortar con Math.floor es lo que hace que un
  // empate exacto (el .5) SUBA en vez de bajar.
  let decimas = Math.floor((minutosAvance * 1000) / objetivo + 0.5);

  // Nunca por encima de 100 % (100,0 % son 1000 décimas).
  decimas = Math.min(decimas, 1000);

  // Paso 2: el texto, con un decimal y la coma pegada ("15,7 %").
  const texto = Math.floor(decimas / 10) + "," + (decimas % 10) + " %";

  // Paso 3: el entero de la barra, redondeado al más cercano.
  return { texto: texto, ancho: Math.round(decimas / 10) };
}

/* ------------------------------------------------------------
   FUNCIÓN: formatearMinutos
   ------------------------------------------------------------
   Escribe un número en convención española, para que los minutos
   grandes se lean con punto de miles:

     formatearMinutos(45000) -> "45.000"
     formatearMinutos(30.5)  -> "30,5"

   Con eso se monta la línea de cifras del objetivo:
     "45.000 de 100.000 min"

   Usamos Intl, que ya viene en el navegador y en Node (no es una
   dependencia que haya que instalar). "es-ES" pone el punto de
   miles y la coma decimal, y useGrouping: "always" agrupa siempre.
   ------------------------------------------------------------ */
function formatearMinutos(numero) {
  const formato = new Intl.NumberFormat("es-ES", { useGrouping: "always" });
  return formato.format(numero);
}

/* ------------------------------------------------------------
   FUNCIÓN: calcularAvanceObjetivo
   ------------------------------------------------------------
   El AGREGADOR del bloque del objetivo: es el único punto de
   entrada y devuelve TODO lo que hay que pintar, ya calculado.

   Parámetros:
     - sesiones: el array de sesiones guardado en el navegador.
     - objetivoGuardado: el TEXTO del objetivo tal como está
       guardado ("300"), o null si nunca se fijó ninguno. Puede
       estar corrupto: eso se trata como "sin objetivo fijado",
       sin lanzar ningún error (la web sigue funcionando).
     - hoy: el día actual como Date. Llega como parámetro y esta
       función NO mira el reloj, igual que las de arriba.

   Devuelve un objeto con esta forma:

     {
       hayObjetivo:   ¿hay una meta válida fijada?,
       objetivo:      el entero ya normalizado (300) o null,
       minutosAvance: minutos de la semana SIN fechas futuras,
       minutosSemana: minutos de la semana CON fechas futuras,
       porcentaje:    "15,7 %" (o null si no hay objetivo),
       ancho:         0..100 para la barra (0 si no hay objetivo),
       cumplida:      minutosAvance >= objetivo,
       hayFuturo:     minutosAvance != minutosSemana
     }

   Los minutos de avance, el porcentaje y "cumplida" salen TODOS
   de los mismos minutos: por eso el avance y su porcentaje no
   pueden contradecirse. Y los minutos reales nunca se recortan:
   si se han estudiado 500 con objetivo 300, se sigue viendo 500.
   ------------------------------------------------------------ */
function calcularAvanceObjetivo(sesiones, objetivoGuardado, hoy) {
  // 1) ¿Hay una meta válida? El texto guardado se normaliza AQUÍ
  //    (y en ningún otro sitio): así "0300" se lee como 300, y un
  //    texto feo ("", "abc", "0", "300.5", "{}") es simplemente
  //    "sin objetivo fijado".
  const { valor: objetivo } = normalizarObjetivo(objetivoGuardado);
  const hayObjetivo = objetivo !== null;

  // 2) Los DOS totales de la semana, calculados con el MISMO "hoy"
  //    para que no puedan discrepar por caer en dos momentos
  //    distintos:
  //      - minutosAvance: sin fechas futuras (es lo que se compara
  //        con el objetivo y lo que se pinta en el bloque).
  //      - minutosSemana: con fechas futuras (es el marcador
  //        "Esta semana" de la portada).
  const minutosAvance = calcularMinutosAvance(sesiones, hoy);
  const minutosSemana = calcularMinutosSemana(sesiones, hoy);

  // 3) Sin meta no hay porcentaje ni barra: la pantalla se queda
  //    con la invitación y "Esta semana" sigue donde estaba.
  if (!hayObjetivo) {
    return {
      hayObjetivo: false,
      objetivo: null,
      minutosAvance: minutosAvance,
      minutosSemana: minutosSemana,
      porcentaje: null,
      ancho: 0,
      cumplida: false,
      hayFuturo: false,
    };
  }

  // 4) Progreso y estado de "cumplida". "Igual o mayor" cuenta:
  //    con 200 minutos y objetivo 200, la meta está cumplida.
  const progreso = calcularPorcentajeObjetivo(minutosAvance, objetivo);
  const cumplida = minutosAvance >= objetivo;

  // 5) Los dos números difieren cuando hay sesiones con fecha
  //    futura: entonces el bloque tiene que explicarlo en texto.
  const hayFuturo = minutosAvance !== minutosSemana;

  return {
    hayObjetivo: true,
    objetivo: objetivo,
    minutosAvance: minutosAvance,
    minutosSemana: minutosSemana,
    porcentaje: progreso.texto,
    ancho: progreso.ancho,
    cumplida: cumplida,
    hayFuturo: hayFuturo,
  };
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
    normalizarObjetivo,
    rangoSemana,
    calcularMinutosSemana,
    calcularMinutosAvance,
    calcularPorcentajeObjetivo,
    formatearMinutos,
    calcularAvanceObjetivo,
  };
}
