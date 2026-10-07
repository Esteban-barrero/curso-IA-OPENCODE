/* ============================================================
   DIARIO DE ESTUDIO - app.js
   ============================================================
   Aquí está TODA la inteligencia de la web:
     - Guardar y leer sesiones en localStorage.
     - Calcular la racha de días seguidos.
     - Pintar la lista y el número de la racha en pantalla.
     - Leer, guardar y pintar el objetivo semanal.
     - Escuchar el formulario del objetivo (guardar, editar, quitar
       y avisar de los cuatro errores posibles).

   Los cálculos (racha, minutos de la semana, avance del objetivo)
   viven en logica.js, que es lógica pura y se puede probar con
   `node --test`. Aquí solo se guardan, se leen y se pintan.

   Lo he dividido en funciones pequeñas y comentadas, para que
   cada una haga UNA sola cosa y sea fácil de entender.
   ============================================================ */


/* ------------------------------------------------------------
   CONSTANTES Y REFERENCIAS A ELEMENTOS DEL HTML
   ------------------------------------------------------------
   Guardamos en variables los elementos del HTML que vamos a usar.
   Así no los buscamos una y otra vez, y el código queda más claro.

   document.getElementById("...") busca un elemento por su id.
------------------------------------------------------------ */

// Clave con la que guardamos los datos en localStorage.
// (localStorage guarda texto en el navegador, aunque cierres la pestaña).
const CLAVE_STORAGE = "diarioEstudio.sesiones";

// Clave del OBJETIVO SEMANAL: es una clave NUEVA y PROPIA.
// OJO: no se guarda dentro de "diarioEstudio.sesiones" (las sesiones
// siguen igual: ni se leen ni se escriben para el objetivo).
// Aquí solo hay un entero escrito como texto, por ejemplo "300".
const CLAVE_OBJETIVO = "diarioEstudio.objetivo";

// Los CUATRO mensajes de error del campo del objetivo, uno por cada
// motivo por el que se puede rechazar lo escrito.
//
// Son cuatro textos DISTINTOS a propósito: tienen que distinguir
// "no hay nada escrito", "no es un número", "tiene que ser más de 0"
// y "no se admiten decimales", para que la persona entienda qué ha
// hecho mal y no lea un aviso genérico.
//
// Las CLAVES son los mismos motivos que devuelve normalizarObjetivo()
// en logica.js: vacio, noNumero, noPositivo y decimales. El cálculo va
// allí (es lógica pura y testeable); el TEXTO es de interfaz, así que
// vive aquí, en app.js.
const MENSAJES_ERROR = {
  vacio: "Escribe los minutos de tu objetivo semanal.",
  noNumero: "Eso no es un número. Escribe solo cifras.",
  noPositivo: "El objetivo tiene que ser más de 0 minutos.",
  decimales: "Los minutos van en enteros, sin decimales.",
};

// El <form> con los campos.
const formulario = document.getElementById("formulario");

// Los 3 campos del formulario.
const campoFecha = document.getElementById("fecha");
const campoTema = document.getElementById("tema");
const campoMinutos = document.getElementById("minutos");

// Donde pintamos el número grande de la racha.
const elementoRacha = document.getElementById("racha");

// Donde pintamos la MEJOR racha (la más larga conseguida nunca).
const elementoMejorRacha = document.getElementById("mejor-racha");

// Donde pintamos el total de minutos estudiados esta semana.
const elementoMinutosSemana = document.getElementById("minutos-semana");

// Donde pintamos cuántos días distintos se ha estudiado este mes.
const elementoDiasMes = document.getElementById("dias-mes");

// La "cadena" de días: un cuadrito por cada día de la racha actual.
const elementoCadena = document.getElementById("cadena");

// La lista <ul> donde van las sesiones.
const listaSesiones = document.getElementById("lista");

// El mensaje "todavía no hay sesiones".
const mensajeVacio = document.getElementById("mensaje-vacio");

// ----- Elementos del bloque del objetivo semanal -----
// La invitación (lo que se ve cuando todavía no hay objetivo).
const elementoInvitacion = document.getElementById("objetivo-invitacion");

// Las cifras "45.000 de 100.000 min".
const elementoCifras = document.getElementById("objetivo-cifras");

// El porcentaje "15,7 %".
const elementoPorcentaje = document.getElementById("objetivo-porcentaje");

// El aviso "¡Meta cumplida!".
const elementoCumplida = document.getElementById("objetivo-cumplida");

// El relleno de la barra: es lo único a lo que hay que tocar para
// cambiarle el ancho (la barra solo decora, no aporta información).
const elementoRelleno = document.getElementById("objetivo-relleno");

// La nota que explica la diferencia con "Esta semana".
const elementoNota = document.getElementById("objetivo-nota");

// El campo donde se escriben los minutos del objetivo.
const campoObjetivo = document.getElementById("objetivo-minutos");

// El <form> del objetivo: lo escuchamos cuando se envía
// (pulsando "Guardar objetivo" o la tecla Intro dentro del campo).
const formularioObjetivo = document.getElementById("formulario-objetivo");

// El hueco reservado donde se mete el mensaje de error. Está SIEMPRE
// en el HTML y nunca lleva texto: el mensaje se inserta DENTRO de él
// y, como el hueco ya ocupa su sitio (min-height en el CSS), la página
// no salta de alto cuando aparece el error.
const huecoAyudaObjetivo = document.getElementById("objetivo-ayuda");

// El botón "Quitar objetivo" (solo se ve si hay objetivo guardado).
const botonQuitarObjetivo = document.getElementById("boton-quitar-objetivo");


/* ------------------------------------------------------------
   FUNCIÓN: cargarSesiones
   ------------------------------------------------------------
   Lee las sesiones guardadas en localStorage y las devuelve
   como un ARRAY de objetos.

   Si no hay nada guardado (primera visita), devuelve [].

   Cada sesión tiene esta forma:
     { fecha: "2026-10-05", tema: "JavaScript", minutos: 45 }
------------------------------------------------------------ */
function cargarSesiones() {
  // localStorage.getItem devuelve un TEXTO (string) o null.
  const datosGuardados = localStorage.getItem(CLAVE_STORAGE);

  // Si no hay nada, devolvemos una lista vacía y terminamos.
  if (!datosGuardados) {
    return [];
  }

  // Convertimos el texto JSON de vuelta a un array de objetos.
  // try/catch protege contra datos corruptos: si falla, usamos [].
  try {
    const sesiones = JSON.parse(datosGuardados);
    // Nos aseguramos de que sea un array de verdad.
    return Array.isArray(sesiones) ? sesiones : [];
  } catch (error) {
    console.error("No se pudieron leer las sesiones guardadas:", error);
    return [];
  }
}


/* ------------------------------------------------------------
   FUNCIÓN: guardarSesiones
   ------------------------------------------------------------
   Recibe un array de sesiones y lo guarda en localStorage
   convertido a texto JSON.

   localStorage solo guarda texto, por eso usamos JSON.stringify.
------------------------------------------------------------ */
function guardarSesiones(sesiones) {
  localStorage.setItem(CLAVE_STORAGE, JSON.stringify(sesiones));
}


/* ------------------------------------------------------------
   FUNCIÓN: leerObjetivo
   ------------------------------------------------------------
   Lee el objetivo semanal guardado y lo devuelve como un ENTERO
   ya normalizado (300), o null si no hay ninguno válido.

   Tres casos distintos, y no es lo mismo:

     1) No hay nada guardado (o está vacío): nunca se fijó un
        objetivo. Devolvemos null y NO avisamos por consola,
        porque no es ningún problema: es simplemente que la
        persona todavía no ha escrito su meta.

     2) Hay algo guardado pero no es un número válido ("abc",
        "0", "300.5"...): esto SÍ es un dato corrupto. Escribimos
        un aviso en la consola (para que se pueda depurar) pero
        seguimos devolviendo null, así que la web no se rompe
        nunca y la pantalla se queda con la invitación.

     3) Hay un objetivo válido: devolvemos el entero.

   El texto se normaliza con normalizarObjetivo() de logica.js,
   que es quien decide qué se acepta (por eso "0300" sale 300).
------------------------------------------------------------ */
function leerObjetivo() {
  // localStorage.getItem devuelve el texto guardado, o null si
  // esa clave no existe (porque nunca se guardó nada).
  const texto = localStorage.getItem(CLAVE_OBJETIVO);

  // 1) Caso "no hay objetivo": no hay nada, o solo espacios.
  if (texto === null || texto.trim() === "") {
    return null;
  }

  // 2) Hay texto: le pedimos a la lógica pura que lo normalice.
  const { valor } = normalizarObjetivo(texto);

  // 3) Si no sale un entero, el dato guardado está corrupto.
  //    Avisamos (en español) pero seguimos: sin objetivo.
  if (valor === null) {
    console.warn(
      "El objetivo guardado no es válido, se trata como si no tuvieras objetivo:"
    );
    return null;
  }

  // 4) Objetivo válido: aquí está el entero limpio.
  return valor;
}


/* ------------------------------------------------------------
   FUNCIÓN: guardarObjetivo
   ------------------------------------------------------------
   Guarda el objetivo semanal en su propia clave de localStorage.

   Se guarda como TEXTO PLANO con String() (por ejemplo "300"),
   nunca como JSON. Así el dato se puede leer y estropear a mano
   desde la consola del navegador, que es como se comprueba que la
   web aguanta un objetivo corrupto sin romperse.

   OJO: esta función solo toca la clave del objetivo. Las sesiones
   no se leen ni se escriben aquí (viven en su propia clave).
------------------------------------------------------------ */
function guardarObjetivo(valorEntero) {
  localStorage.setItem(CLAVE_OBJETIVO, String(valorEntero));
}


/* ------------------------------------------------------------
   FUNCIÓN: quitarObjetivo
   ------------------------------------------------------------
   Borra el objetivo semanal guardado.

   removeItem elimina la clave entera del navegador, así que a
   partir de aquí volveremos al estado "sin objetivo" (se verá la
   invitación). Las sesiones tampoco se tocan.
------------------------------------------------------------ */
function quitarObjetivo() {
  localStorage.removeItem(CLAVE_OBJETIVO);
}


/* ------------------------------------------------------------
   FUNCIÓN: pintarObjetivo
   ------------------------------------------------------------
   Dibuja el bloque "Objetivo semanal" a partir de las sesiones y
   del objetivo guardado. La llama renderizar() cada vez que
   cambian los datos.

   Todo el cálculo se lo pide a calcularAvanceObjetivo() de
   logica.js, que devuelve el objetivo ya normalizado, los minutos
   de avance, el porcentaje, el ancho de la barra, si la meta está
   cumplida y si hay sesiones con fecha futura. Aquí solo se
   escribe ese resultado en la pantalla.

   Recibe "hoy" como parámetro (no mira el reloj por su cuenta):
   es el MISMO día que usa "Esta semana", así los dos números que
   compara la nota se calculan en el mismo momento y no pueden
   discrepar.

   OJO: el bloque sin objetivo lo resuelve el CSS a partir de la
   invitación (si la invitación está visible, las cifras, el
   porcentaje, la barra y la nota se ocultan solos). Por eso aquí,
   sin objetivo, solo hay que mostrar la invitación y terminar.
------------------------------------------------------------ */
function pintarObjetivo(sesiones, hoy) {
  // 1) Leemos el objetivo guardado: un entero (300) o null. Si el
  //    dato está corrupto, leerObjetivo avisa por consola y da null.
  const objetivo = leerObjetivo();

  // 2) El agregador de logica.js normaliza por su cuenta el TEXTO
  //    guardado, y normalizarObjetivo() solo admite texto (un número
  //    suelto lo rechaza como "no es un número"). Por eso le pasamos
  //    el entero como texto: "300". Con null no hay objetivo.
  const objetivoGuardado = objetivo === null ? null : String(objetivo);

  // 3) Pedimos todos los números de una vez a la lógica pura.
  const estado = calcularAvanceObjetivo(sesiones, objetivoGuardado, hoy);

  // 4) El botón "Quitar objetivo" solo tiene sentido si hay algo
  //    que quitar. La clase "oculto" es la que lo esconde.
  if (estado.hayObjetivo) {
    botonQuitarObjetivo.classList.remove("oculto");
  } else {
    botonQuitarObjetivo.classList.add("oculto");
  }

  // 5) SIN objetivo: dejamos visible la invitación y nos vamos.
  //    Aquí no se pone ninguna cifra: sin meta no hay progreso que
  //    enseñar (ni un "0 de 0 min", ni un "0,0 %", ni la barra).
  if (!estado.hayObjetivo) {
    elementoInvitacion.classList.remove("oculto");
    return;
  }

  // 6) CON objetivo: escondemos la invitación y ya puede verse
  //    todo lo de abajo.
  elementoInvitacion.classList.add("oculto");

  // 7) Las cifras: cuántos minutos llevas de los que te pediste.
  //    formatearMinutos pone el punto de miles (45.000).
  elementoCifras.textContent =
    formatearMinutos(estado.minutosAvance) +
    " de " +
    formatearMinutos(estado.objetivo) +
    " min";

  // 8) El porcentaje, que ya viene escrito como "15,7 %"
  //    (con coma y un solo decimal).
  elementoPorcentaje.textContent = estado.porcentaje;

  // 9) La barra: solo se le cambia el ancho (0..100).
  //    La barra lleva aria-hidden porque el número ya está escrito
  //    justo encima en texto de verdad.
  elementoRelleno.style.width = estado.ancho + "%";

  // 10) "¡Meta cumplida!" solo se ve si has llegado al objetivo
  //     (o lo has pasado).
  if (estado.cumplida) {
    elementoCumplida.classList.remove("oculto");
  } else {
    elementoCumplida.classList.add("oculto");
  }

  // 11) La nota: solo aparece cuando hay sesiones con fecha futura,
  //     porque es el único caso en que "Esta semana" (arriba) y el
  //     avance (aquí) dan números distintos. Lleva los DOS números
  //     para que se vea cuánto difieren.
  if (estado.hayFuturo) {
    // En el HTML la nota nace con la clase "oculto" (sin objetivo
    // no hay nada que comparar), así que hay que quitársela para
    // que se vea.
    elementoNota.classList.remove("oculto");
    elementoNota.textContent =
      "El avance ignora las sesiones con fecha futura y «Esta semana» las cuenta:"
      + " aquí " + formatearMinutos(estado.minutosAvance) + " min,"
      + " arriba " + formatearMinutos(estado.minutosSemana) + " min.";
  } else {
    // Sin fechas futuras los dos números coinciden: la nota se
    // vacía y se esconde (para no dejar un hueco con el borde).
    elementoNota.classList.add("oculto");
    elementoNota.textContent = "";
  }
}


/* ------------------------------------------------------------
   FUNCIÓN: mostrarError
   ------------------------------------------------------------
   Crea el mensaje de error del campo del objetivo y lo mete dentro
   del hueco reservado ("objetivo-ayuda").

   Decisiones importantes (vienen de la especificación):

     1) Se CREA el <p> con document.createElement. Cuando no hay
        error ese nodo no existe: desaparece de verdad del documento,
        no se esconde con "display: none" (la spec lo prohíbe).

     2) Se inserta DENTRO del hueco, que está en el flujo normal de
        la página. Nunca es flotante ni se superpone: no puede tapar
        la sección siguiente.

     3) Se le pone role="alert" para que el lector de pantalla lo
        avise en cuanto aparece.

     4) Se añade aria-describedby="objetivo-error" al campo. Así el
        error queda ASOCIADO a su campo: al leer el campo, el lector
        de pantalla lee también el motivo.

   Antes de crearlo quitamos el que hubiera (si la persona vuelve a
   enviar algo malo dos veces seguidas), para que nunca se acumulen
   dos mensajes.
------------------------------------------------------------ */
function mostrarError(motivo) {
  // Si ya había un mensaje (o un error anterior), lo eliminamos primero.
  quitarError();

  // Creamos el <p> del mensaje.
  const mensaje = document.createElement("p");

  // El id es el que usará aria-describedby y el que nos permite
  // encontrarlo luego para borrarlo.
  mensaje.id = "objetivo-error";

  // Clase propia para poder darle estilo si hiciera falta. El estilo
  // que se aplica de verdad es ".objetivo-ayuda > p" del CSS.
  mensaje.className = "objetivo-error";

  // El texto es el del motivo que nos ha dado la lógica pura.
  mensaje.textContent = MENSAJES_ERROR[motivo];

  // role="alert": el lector de pantalla lo anuncia al aparecer.
  mensaje.setAttribute("role", "alert");

  // Lo metemos DENTRO del hueco reservado, en el flujo normal.
  huecoAyudaObjetivo.appendChild(mensaje);

  // Asociamos el mensaje a su campo (mensaje accesible por causa).
  campoObjetivo.setAttribute("aria-describedby", "objetivo-error");
}


/* ------------------------------------------------------------
   FUNCIÓN: quitarError
   ------------------------------------------------------------
   Borra el mensaje de error del campo del objetivo, si hay alguno.

   Hace dos cosas:
     1) Elimina el nodo del documento con .remove() (no lo esconde:
        el texto desaparece de verdad de la página).
     2) Quita también aria-describedby del campo, porque si lo
        dejáramos apuntaría a un id que ya no existe.

   Puede ejecutarse aunque NO haya ningún error: en ese caso el
   getElementById devuelve null, no hace falta el nodo y la función
   no se queja.
------------------------------------------------------------ */
function quitarError() {
  // Buscamos el mensaje por su id.
  const mensaje = document.getElementById("objetivo-error");

  // Si existe, lo eliminamos del documento de verdad.
  if (mensaje) {
    mensaje.remove();
  }

  // Y quitamos la referencia del campo (getAttribute devuelve null
  // si el atributo no estaba, así que no falla nunca).
  campoObjetivo.removeAttribute("aria-describedby");
}


/* ------------------------------------------------------------
   FUNCIÓN: calcularRacha
   ------------------------------------------------------------
   Calcula cuántos días CONSECUTIVOS se ha estudiado, terminando
   en HOY (o en el último día con actividad si hoy aún no se ha
   estudiado pero ayer sí).

   Reglas (las del enunciado):
     - Un día cuenta si tiene al menos UNA sesión.
     - La racha son días consecutivos que terminan hoy.
     - Si hoy todavía no hay sesión pero ayer sí, la racha sigue
       viva (no se rompe hasta que termine el día).

   Estrategia:
     1. Sacamos una lista de fechas ÚNICAS en las que hubo sesión.
     2. Empezamos a contar desde hoy hacia atrás.
     3. Si hoy no hay sesión, probamos desde ayer (la racha viva).
     4. Vamos restando un día y sumando mientras exista sesión.
------------------------------------------------------------ */
function calcularRacha(sesiones) {
  // Si no hay sesiones, la racha es 0.
  if (sesiones.length === 0) {
    return 0;
  }

  // 1) Creamos un Set (colección sin duplicados) con las fechas
  //    únicas en las que hubo al menos una sesión.
  const diasConEstudio = new Set(sesiones.map((sesion) => sesion.fecha));

  // 2) Fecha de hoy, normalizada a "YYYY-MM-DD".
  const hoy = new Date();
  let diaActual = hoy;

  // 3) Si HOY no hay sesión, pero AYER sí, la racha sigue viva:
  //    empezamos a contar desde ayer.
  if (!diasConEstudio.has(obtenerFechaLocalISO(diaActual))) {
    diaActual = sumarDias(hoy, -1);
  }

  // 4) Contamos hacia atrás mientras cada día tenga sesión.
  let racha = 0;
  while (diasConEstudio.has(obtenerFechaLocalISO(diaActual))) {
    racha++;                                  // sumamos un día a la racha
    diaActual = sumarDias(diaActual, -1);     // retrocedemos un día más
  }

  return racha;
}


/* ------------------------------------------------------------
   FUNCIÓN: calcularMejorRacha
   ------------------------------------------------------------
   Calcula la MEJOR racha: la corrida de días consecutivos más
   larga que se ha conseguido NUNCA.

   Decisiones tomadas (las que eligió el usuario):
     - La mejor racha INCLUYE la racha actual. Es decir, si la
       racha que tienes ahora mismo es la más larga, se muestra.
     - Una racha de 1 solo día ya cuenta como 1. Es decir, si
       únicamente has estudiado un día suelto, la mejor racha es 1.

   Estrategia:
     1. Sacar las fechas únicas con estudio y ordenarlas de la
        más antigua a la más nueva.
     2. Recorrerlas agrupando días consecutivos en "rachas".
     3. Quedarnos con la más larga (de 2+ días).

   Ojo: las fechas son "YYYY-MM-DD" (texto), y ese formato se
   ordena solo alfabéticamente de la más antigua a la más nueva.
------------------------------------------------------------ */
function calcularMejorRacha(sesiones) {
  // Si no hay sesiones, no hay mejor racha posible.
  if (sesiones.length === 0) {
    return 0;
  }

  // 1) Fechas únicas (sin duplicados) ordenadas de antigua a nueva.
  //    El formato "YYYY-MM-DD" se ordena solo alfabéticamente = cronológicamente.
  const diasConEstudio = [...new Set(sesiones.map((sesion) => sesion.fecha))].sort();

  let mejor = 0;        // la racha más larga encontrada hasta ahora
  let inicioRacha = 0;  // índice donde empieza la racha que estamos mirando

  // 2) Recorremos cada día y, cuando la racha se rompe, la evaluamos.
  for (let i = 0; i < diasConEstudio.length; i++) {
    const diaActual = diasConEstudio[i];
    const diaSiguiente = diasConEstudio[i + 1];

    // ¿El día siguiente (si existe) es justo el día después de este?
    const continua =
      diaSiguiente !== undefined &&
      obtenerFechaLocalISO(sumarDias(new Date(`${diaActual}T00:00:00`), 1)) === diaSiguiente;

    // Si la racha continúa, seguimos. Si se rompe, la evaluamos.
    if (!continua) {
      const longitud = i - inicioRacha + 1; // días que tiene esta racha

      // Una racha de cualquier tamaño cuenta (incluso la de 1 día).
      if (longitud > mejor) {
        mejor = longitud;
      }

      // La siguiente racha empezará en el día siguiente a este.
      inicioRacha = i + 1;
    }
  }

  return mejor;
}


/* ------------------------------------------------------------
   FUNCIÓN: calcularMinutosSemana (ahora vive en logica.js)
   ------------------------------------------------------------
   Este cálculo se ha mudado a logica.js (la lógica pura) porque
   antes miraba el reloj por su cuenta con new Date(), y así no se
   podía probar con `node --test`.

   Ahora vive en logica.js y recibe el día "hoy" como PARÁMETRO:
   calcularMinutosSemana(sesiones, hoy). Su cuerpo es el mismo de
   siempre (de lunes a domingo, contando también las fechas
   futuras), así que el número de la portada NO cambia.

   Aquí solo hay que llamarla. OJO: si se escribiera aquí otra
   copia, esta pisaría la de logica.js (que se carga antes) y
   habría dos copias del mismo cálculo pudiendo divergir.
------------------------------------------------------------ */


/* ------------------------------------------------------------
   FUNCIÓN: calcularDiasEstudiadosMes
   ------------------------------------------------------------
   Cuenta cuántos DÍAS DISTINTOS se ha estudiado en el MES ACTUAL.

   Si estudias dos veces el mismo día, cuenta como UN solo día.
   Solo cuentan los días hasta HOY: se IGNORAN las fechas futuras.

   Estrategia:
     1. Sacar el año y el mes actuales en hora local.
     2. Construir el prefijo del mes como texto "AAAA-MM"
        (por ejemplo "2026-10").
     3. Recorrer las sesiones y quedarnos con las que:
          - su fecha empieza por ese prefijo (son de este mes), y
          - su fecha es menor o igual a HOY (no son futuras).
     4. Guardar esas fechas en un Set (para no repetir días) y
        devolver cuántos días distintos hay.

   Truco: comparar fechas como texto "AAAA-MM-DD" funciona igual
   que comparar el calendario, y respeta la hora local.
------------------------------------------------------------ */
function calcularDiasEstudiadosMes(sesiones) {
  // 1) Año y mes actuales, en hora local.
  const hoy = new Date();
  const anio = hoy.getFullYear();                       // 2026
  const mes = String(hoy.getMonth() + 1).padStart(2, "0"); // "10"

  // 2) Prefijo del mes: "2026-10".
  const prefijoMes = `${anio}-${mes}`;

  // Fecha de hoy como texto "AAAA-MM-DD", para descartar futuras.
  const hoyISO = obtenerFechaLocalISO(hoy);

  // 3) Nos quedamos con los días válidos de este mes.
  //    Usamos un Set para que cada día cuente una sola vez.
  const diasConEstudio = new Set();

  sesiones.forEach((sesion) => {
    const esDeEsteMes = sesion.fecha.startsWith(prefijoMes);
    const noEsFutura = sesion.fecha <= hoyISO;

    if (esDeEsteMes && noEsFutura) {
      diasConEstudio.add(sesion.fecha);
    }
  });

  // 4) El número de días distintos es el tamaño del Set.
  return diasConEstudio.size;
}


/* ------------------------------------------------------------
   FUNCIÓN: formatearFecha
   ------------------------------------------------------------
   Convierte una fecha "YYYY-MM-DD" en algo legible en español,
   por ejemplo: "5 oct 2026".

   Usamos Intl.DateTimeFormat, que ya sabe los nombres de los
   meses en español (locale "es-ES").
------------------------------------------------------------ */
function formatearFecha(fechaISO) {
  // Ojo: al construir la fecha con "YYYY-MM-DD", JavaScript la
  // interpreta como UTC. Para mostrarla tal cual el usuario la
  // escribió, añadimos "T00:00:00" (hora local).
  const fecha = new Date(`${fechaISO}T00:00:00`);

  return new Intl.DateTimeFormat("es-ES", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(fecha);
}


/* ------------------------------------------------------------
   FUNCIÓN: crearElementoSesion
   ------------------------------------------------------------
   Recibe UNA sesión y nos devuelve un <li> listo para mostrar:
     <li class="sesion">
       <span class="sesion-tema">JavaScript</span>
       <span class="sesion-detalle">
         <span>5 oct 2026</span>
         <span>45 min</span>
       </span>
     </li>

   Usamos createElement en vez de innerHTML para evitar problemas
   si el texto del usuario tuviera caracteres raros (más seguro).
------------------------------------------------------------ */
function crearElementoSesion(sesion) {
  // Creamos el <li> contenedor.
  const li = document.createElement("li");
  li.className = "sesion";

  // Título con el tema.
  const tema = document.createElement("span");
  tema.className = "sesion-tema";
  tema.textContent = sesion.tema;

  // Detalle (fecha + minutos).
  const detalle = document.createElement("span");
  detalle.className = "sesion-detalle";

  const fecha = document.createElement("span");
  fecha.textContent = formatearFecha(sesion.fecha);

  const minutos = document.createElement("span");
  minutos.textContent = `${sesion.minutos} min`;

  // Encajamos las piezas: detalle contiene fecha y minutos.
  detalle.appendChild(fecha);
  detalle.appendChild(minutos);

  // Encajamos todo dentro del <li>.
  li.appendChild(tema);
  li.appendChild(detalle);

  return li;
}


/* ------------------------------------------------------------
   FUNCIÓN: pintarCadena
   ------------------------------------------------------------
   Dibuja la "cadena" de los ÚLTIMOS 7 DÍAS (del más antiguo al
   más reciente). Cada cuadro representa un día:
     - Si hay sesión ese día, el cuadro va lleno (clase "día-on").
     - Si no, el cuadro queda vacío (como un hueco en la cadena).

   Es información útil: de un vistazo ves tus últimos días.
------------------------------------------------------------ */
function pintarCadena(sesiones) {
  // 1) Vaciamos la cadena antes de volver a pintarla.
  elementoCadena.innerHTML = "";

  // 2) Días únicos con estudio (para saber si un día concreto cuenta).
  const diasConEstudio = new Set(sesiones.map((sesion) => sesion.fecha));

  // 3) Recorremos del día 6 (hace 6 días) hasta hoy (día 0).
  //    Así el cuadro de la derecha siempre es HOY.
  for (let i = 6; i >= 0; i--) {
    const fecha = sumarDias(new Date(), -i);
    const fechaISO = obtenerFechaLocalISO(fecha);

    // Creamos el cuadro del día.
    const cuadro = document.createElement("span");
    cuadro.className = "dia";

    // Si ese día hubo estudio, lo marcamos como "lleno".
    if (diasConEstudio.has(fechaISO)) {
      cuadro.classList.add("dia-on");
    }

    // Guardamos la fecha en un atributo para poder mostrarla en hover.
    cuadro.title = fechaISO;

    elementoCadena.appendChild(cuadro);
  }
}


/* ------------------------------------------------------------
   FUNCIÓN: renderizar
   ------------------------------------------------------------
   Dibuja en pantalla todo lo que depende de las sesiones:
     - La lista de sesiones (ordenada de más reciente a más antigua).
     - El mensaje de "vacío" (solo si no hay sesiones).
     - El número de la racha.
     - La cadena de los últimos 7 días.
     - El bloque del objetivo semanal (con su avance).

   La llamamos cada vez que cambian los datos. Es el ÚNICO sitio
   donde se refresca la pantalla, también para el objetivo.
------------------------------------------------------------ */
function renderizar(sesiones) {
  // 1) Vaciamos la lista antes de volver a pintarla.
  listaSesiones.innerHTML = "";

  // 2) Si no hay sesiones, mostramos el mensaje de vacío.
  if (sesiones.length === 0) {
    mensajeVacio.classList.remove("oculto");
  } else {
    mensajeVacio.classList.add("oculto");
  }

  // 3) Ordenamos una COPIA de las sesiones de más reciente a más antigua.
  //    Usamos [...sesiones] para no modificar el array original.
  const ordenadas = [...sesiones].sort((a, b) => {
    // Comparamos las fechas como texto: "2026-10-05" > "2026-10-01".
    // Si son iguales, desempatamos por el orden de creación (la última va primero).
    if (a.fecha === b.fecha) {
      return b.creadaEn - a.creadaEn;
    }
    return a.fecha < b.fecha ? 1 : -1;
  });

  // 4) Creamos y añadimos cada sesión a la lista.
  ordenadas.forEach((sesion) => {
    listaSesiones.appendChild(crearElementoSesion(sesion));
  });

  // 5) Actualizamos el número grande de la racha.
  elementoRacha.textContent = calcularRacha(sesiones);

  // 6) Actualizamos también la mejor racha.
  elementoMejorRacha.textContent = calcularMejorRacha(sesiones);

  // 7) Leemos el día de HOY UNA sola vez para toda la pantalla.
  //    calcularMinutosSemana ya no está en este archivo (vive en
  //    logica.js) y recibe el día como parámetro, así que el número
  //    es EXACTAMENTE el mismo que antes.
  //    El bloque del objetivo se pinta con ESTE MISMO "hoy": si
  //    calculara cada uno el suyo por su cuenta, los dos números
  //    que compara la nota (aquí el avance, arriba "Esta semana")
  //    podrían salir de dos momentos distintos y discrepar.
  const hoy = new Date();

  // 8) Actualizamos el total de minutos estudiados esta semana.
  elementoMinutosSemana.textContent = calcularMinutosSemana(sesiones, hoy);

  // 9) Actualizamos los días distintos estudiados este mes.
  elementoDiasMes.textContent = calcularDiasEstudiadosMes(sesiones);

  // 10) Pintamos la cadena de los últimos 7 días.
  pintarCadena(sesiones);

  // 11) Pintamos el bloque del objetivo semanal.
  pintarObjetivo(sesiones, hoy);

  // 12) Pintamos el mapa de calor (función de mapa.js).
  pintarMapa(sesiones);
}


/* ------------------------------------------------------------
   FUNCIÓN MANEJADORA: alEnviarFormulario
   ------------------------------------------------------------
   Se ejecuta cuando el usuario pulsa "Guardar sesión".
   Pasos:
     1. Frenamos el envío normal (que recargaría la página).
     2. Leemos los valores de los campos.
     3. Validamos que sean correctos.
     4. Creamos la sesión, la guardamos y refrescamos la pantalla.
     5. Limpiamos el formulario para la siguiente.
------------------------------------------------------------ */
function alEnviarFormulario(evento) {
  // 1) Evitamos que el navegador recargue la página.
  evento.preventDefault();

  // 2) Leemos los valores (trim quita espacios sobrantes del tema).
  const fecha = campoFecha.value;
  const tema = campoTema.value.trim();
  const minutos = Number(campoMinutos.value);

  // 3) Validación: fecha y tema no vacíos, minutos > 0.
  if (!fecha || !tema) {
    alert("Por favor rellena la fecha y el tema.");
    return;
  }
  if (!minutos || minutos <= 0) {
    alert("Los minutos deben ser un número mayor que 0.");
    return;
  }

  // 4) Creamos el objeto de la nueva sesión.
  const nuevaSesion = {
    fecha,               // "YYYY-MM-DD"
    tema,                // texto
    minutos,             // número
    creadaEn: Date.now(), // marca de tiempo (para desempatar en el orden)
  };

  // Cargamos las sesiones actuales, añadimos la nueva y guardamos.
  const sesiones = cargarSesiones();
  sesiones.push(nuevaSesion);
  guardarSesiones(sesiones);

  // Volvemos a pintar todo para reflejar los cambios.
  renderizar(sesiones);

  // 5) Limpiamos el formulario y reseteamos la fecha a hoy.
  formulario.reset();
  campoFecha.value = obtenerFechaLocalISO();
}


/* ------------------------------------------------------------
   FUNCIÓN MANEJADORA: alEnviarObjetivo
   ------------------------------------------------------------
   Se ejecuta cuando la persona envía el formulario del objetivo
   (pulsando "Guardar objetivo" o Intro dentro del campo).

   Pasos:
     1. Frenamos el envío normal (que recargaría la página).
     2. Le pasamos el TEXTO escrito a normalizarObjetivo(), que es
        quien decide si vale (es lógica pura de logica.js).
     3. Si no vale: mostramos el mensaje del motivo y NO GUARDAMOS
        NADA. El objetivo que hubiera antes se queda como estaba.
     4. Si vale: lo guardamos como texto plano, quitamos el error y
        repintamos la pantalla.

   OJO con el paso 2: a normalizarObjetivo() hay que pasarle el
   TEXTO del campo (campoObjetivo.value), no un número suelto, porque
   esa función solo admite texto (un número le daría "no es un
   número"). Si no hay objetivo todavía tampoco usamos leerObjetivo():
   aquí no estamos leyendo lo guardado, estamos validando lo escrito.
------------------------------------------------------------ */
function alEnviarObjetivo(evento) {
  // 1) Evitamos que el navegador recargue la página.
  evento.preventDefault();

  // 2) Validamos y normalizamos lo escrito (0300 -> 300).
  const { valor, motivo } = normalizarObjetivo(campoObjetivo.value);

  // 3) NO VALE: enseñamos el motivo y paramos aquí.
  //    No se guarda nada y no se toca el objetivo anterior
  //    (sigue en su sitio, guardado y en pantalla).
  if (valor === null) {
    mostrarError(motivo);
    return;
  }

  // 4) VALE: lo guardamos como texto plano en su propia clave
  //    (las sesiones no se tocan para nada).
  guardarObjetivo(valor);

  // 5) Dejamos el campo con el entero normalizado, para que se vea
  //    exactamente lo que queda guardado (si se escribió "0300",
  //    aquí se ve "300").
  campoObjetivo.value = String(valor);

  // 6) El error anterior ya no vale: quitamos su nodo del documento.
  quitarError();

  // 7) Repintamos la pantalla con el objetivo nuevo. pintarObjetivo
  //    lo vuelve a leer de localStorage, así que las cifras, el
  //    porcentaje y la barra salen ya del entero guardado.
  renderizar(cargarSesiones());
}


/* ------------------------------------------------------------
   FUNCIÓN MANEJADORA: alQuitarObjetivo
   ------------------------------------------------------------
   Se ejecuta cuando la persona pulsa "Quitar objetivo".

   Pasos:
     1. Borramos la clave del objetivo en localStorage.
     2. Quitamos el mensaje de error, si había alguno.
     3. Vaciamos el campo (si no se queda escrito el número que se
        acababa de quitar y parece que sigue puesto).
     4. Repintamos: vuelve la invitación y desaparecen cifras,
        porcentaje y barra.

   OJO: aquí NO se toca ninguna sesión. Quitar la meta no puede
   borrar ni un minuto de lo ya estudiado (localStorage.removeItem
   solo toca la clave del objetivo, que es la suya).
------------------------------------------------------------ */
function alQuitarObjetivo() {
  // 1) Borramos SOLO la clave del objetivo.
  quitarObjetivo();

  // 2) Si había un mensaje de error, desaparece (y el campo deja de
  //    apuntar a él con aria-describedby).
  quitarError();

  // 3) Vaciamos el campo para que no quede el número puesto.
  campoObjetivo.value = "";

  // 4) Repintamos la pantalla: invitation, sin cifras ni barra.
  renderizar(cargarSesiones());
}


/* ------------------------------------------------------------
   FUNCIÓN: iniciar
   ------------------------------------------------------------
   Punto de arranque. Se ejecuta al cargar la página.
     - Pone la fecha de hoy por defecto en el formulario.
     - Rellena el campo del objetivo con lo que haya guardado.
     - Escucha el envío del formulario.
     - Escucha el envío del formulario del objetivo y su botón de
       "Quitar objetivo".
     - Dibuja las sesiones que ya estuvieran guardadas.
------------------------------------------------------------ */
function iniciar() {
  // Fecha de hoy por defecto en el campo fecha.
  campoFecha.value = obtenerFechaLocalISO();

  // Si ya había un objetivo guardado, lo escribimos en su campo
  // (ya normalizado: "0300" se ve como 300). Si no hay ninguno,
  // el campo se queda vacío.
  const objetivoGuardado = leerObjetivo();
  if (objetivoGuardado !== null) {
    campoObjetivo.value = objetivoGuardado;
  }

  // Escuchamos el evento "submit" del formulario.
  formulario.addEventListener("submit", alEnviarFormulario);

  // Enviar el formulario del objetivo: guardar o avisar del error.
  formularioObjetivo.addEventListener("submit", alEnviarObjetivo);

  // Botón "Quitar objetivo": lo quita y vuelve al estado sin objetivo.
  botonQuitarObjetivo.addEventListener("click", alQuitarObjetivo);

  // Primer dibujado con lo que haya guardado.
  renderizar(cargarSesiones());
}

// Ejecutamos el arranque.
iniciar();
