/* ============================================================
   DIARIO DE ESTUDIO - app.js
   ============================================================
   Aquí está TODA la inteligencia de la web:
     - Guardar y leer sesiones en localStorage.
     - Calcular la racha de días seguidos.
     - Pintar la lista y el número de la racha en pantalla.

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

// La lista <ul> donde van las sesiones.
const listaSesiones = document.getElementById("lista");

// El mensaje "todavía no hay sesiones".
const mensajeVacio = document.getElementById("mensaje-vacio");


/* ------------------------------------------------------------
   FUNCIÓN: obtenerFechaLocalISO
   ------------------------------------------------------------
   Devuelve la fecha de HOY en formato "YYYY-MM-DD" usando la
   fecha LOCAL del usuario (no UTC).

   ¿Por qué no usamos toISOString()? Porque toISOString() usa UTC
   y de noche podría dar el día equivocado. Aquí construimos la
   fecha "a mano" con el año, mes y día locales.

   Ejemplo de salida: "2026-10-05"
------------------------------------------------------------ */
function obtenerFechaLocalISO(fecha = new Date()) {
  const anio = fecha.getFullYear();               // 2026
  const mes = String(fecha.getMonth() + 1).padStart(2, "0"); // 10 (enero es 0)
  const dia = String(fecha.getDate()).padStart(2, "0");      // 05
  return `${anio}-${mes}-${dia}`;
}


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
   FUNCIÓN: sumarDias
   ------------------------------------------------------------
   Recibe una fecha (objeto Date) y un número de días (puede ser
   negativo), y devuelve una NUEVA fecha sumando esos días.

   La usamos para "retroceder" día a día al calcular la racha.

   Nota: creamos una copia de la fecha para no modificar la original.
------------------------------------------------------------ */
function sumarDias(fecha, dias) {
  const copia = new Date(fecha);      // copia de la fecha recibida
  copia.setDate(copia.getDate() + dias); // sumamos/restamos días
  return copia;
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
   FUNCIÓN: renderizar
   ------------------------------------------------------------
   Dibuja en pantalla todo lo que depende de las sesiones:
     - La lista de sesiones (ordenada de más reciente a más antigua).
     - El mensaje de "vacío" (solo si no hay sesiones).
     - El número de la racha.

   La llamamos cada vez que cambian los datos.
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
   FUNCIÓN: iniciar
   ------------------------------------------------------------
   Punto de arranque. Se ejecuta al cargar la página.
     - Pone la fecha de hoy por defecto en el formulario.
     - Escucha el envío del formulario.
     - Dibuja las sesiones que ya estuvieran guardadas.
------------------------------------------------------------ */
function iniciar() {
  // Fecha de hoy por defecto en el campo fecha.
  campoFecha.value = obtenerFechaLocalISO();

  // Escuchamos el evento "submit" del formulario.
  formulario.addEventListener("submit", alEnviarFormulario);

  // Primer dibujado con lo que haya guardado.
  renderizar(cargarSesiones());
}

// Ejecutamos el arranque.
iniciar();
