/* ============================================================
   DIARIO DE ESTUDIO - mapa.js
   ============================================================
   Pinta el MAPA DE CALOR en el DOM. Es la parte de INTERFAZ:
   no calcula niveles ni fechas, solo usa las funciones puras de
   logica.js y dibuja el resultado.

   Cumple la constitución (principio 3): la lógica está en
   logica.js y aquí solo se muestra.
   ============================================================ */

// Número de semanas que muestra el mapa. Configurable en un solo sitio.
const SEMANAS_MAPA = 16;

// Elemento donde se dibuja la cuadrícula (lo definimos al usarlo).
let contenedorMapa = null;

/* ------------------------------------------------------------
   FUNCIÓN: crearTooltip
   ------------------------------------------------------------
   Crea (una sola vez) el cuadro de detalle que aparece al pasar el
   mouse por un día. Lo devolvemos para reutilizarlo.

   Usamos un elemento propio en vez del atributo "title" porque en
   móvil "title" no funciona.
------------------------------------------------------------ */
function crearTooltip() {
  const tooltip = document.createElement("div");
  tooltip.className = "mapa-tooltip oculto";
  document.body.appendChild(tooltip);
  return tooltip;
}

/* ------------------------------------------------------------
   FUNCIÓN: mostrarTooltip
   ------------------------------------------------------------
   Muestra el detalle de un día en una posición concreta.
     - texto: "lun 5 oct 2026 · 45 min"
     - x, y: coordenadas del puntero o del toque.
------------------------------------------------------------ */
function mostrarTooltip(tooltip, texto, x, y) {
  tooltip.textContent = texto;
  tooltip.classList.remove("oculto");
  // Colocamos el tooltip un poco por encima del punto señalado.
  tooltip.style.left = `${x}px`;
  tooltip.style.top = `${y}px`;
}

/* ------------------------------------------------------------
   FUNCIÓN: ocultarTooltip
------------------------------------------------------------ */
function ocultarTooltip(tooltip) {
  tooltip.classList.add("oculto");
}

/* ------------------------------------------------------------
   FUNCIÓN: pintarMapa
   ------------------------------------------------------------
   Dibuja el mapa completo a partir de las sesiones.

   Pasos:
     1. Calcular la cuadrícula con la función pura construirMapa.
     2. Crear una columna por semana, con la etiqueta del mes encima.
     3. Dentro de cada columna, un cuadro por día con su nivel de color.
     4. Conectar el detalle (mouse para escritorio, toque para móvil).
------------------------------------------------------------ */
function pintarMapa(sesiones) {
  if (!contenedorMapa) {
    contenedorMapa = document.getElementById("mapa-calor");
  }
  if (!contenedorMapa) {
    return; // por si el panel no existe
  }

  // 1) Cuadrícula calculada con la lógica pura. "hoy" se pasa como parámetro.
  const mapa = construirMapa(sesiones, new Date(), SEMANAS_MAPA);
  const etiquetas = etiquetasDeMes(mapa);

  // 2) Vaciamos y creamos el elemento del detalle.
  contenedorMapa.innerHTML = "";
  const tooltip = crearTooltip();

  // 3) Una columna por semana.
  mapa.forEach((columna, indiceSemana) => {
    const semana = document.createElement("div");
    semana.className = "semana";

    // Etiqueta del mes (solo cuando cambia de mes).
    const etiqueta = document.createElement("span");
    etiqueta.className = "mes-etiqueta";
    etiqueta.textContent = etiquetas[indiceSemana];
    semana.appendChild(etiqueta);

    // 4) Un cuadro por día (lunes a domingo).
    columna.forEach((dia) => {
      const celda = document.createElement("span");
      celda.className = `celda nivel-${dia.nivel}`;

      // Texto del detalle, también accesible.
      const texto = `${formatearFechaDetalle(dia.fechaISO)} · ${dia.minutos} min`;
      celda.setAttribute("aria-label", texto);

      // Escritorio: mostrar al pasar el mouse.
      celda.addEventListener("mouseenter", (evento) => {
        mostrarTooltip(tooltip, texto, evento.clientX, evento.clientY);
      });
      celda.addEventListener("mouseleave", () => ocultarTooltip(tooltip));

      // Móvil/táctil: mostrar al tocar (donde no hay "hover").
      celda.addEventListener("click", (evento) => {
        mostrarTooltip(tooltip, texto, evento.clientX, evento.clientY);
      });

      semana.appendChild(celda);
    });

    contenedorMapa.appendChild(semana);
  });
}
