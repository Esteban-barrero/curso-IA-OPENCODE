# Especificación 001 — Mapa de calor de estudio

## Contexto y objetivo
El Diario de Estudio guarda sesiones (fecha, tema y minutos) y muestra rachas y
totales numéricos. Falta una vista que deje ver de un vistazo el patrón de estudio
en el tiempo. Objetivo: un mapa de calor tipo GitHub que muestre los días estudiados
de las últimas semanas, donde más minutos estudiados implica un color más intenso.

## Usuarios
- Persona que estudia por su cuenta y quiere visualizar su constancia.
- Proyecto educativo: debe poder mantenerlo alguien que empieza a programar.

## Historias de usuario
- Como estudiante, quiero ver un mapa de mis últimas semanas para saber si soy constante.
- Como estudiante, quiero distinguir los días en que estudié más, para reconocer mi ritmo.
- Como estudiante, quiero ver la fecha y los minutos de un día concreto para recordarlo.
- Como estudiante en el móvil, quiero ver el mapa sin zoom y tocar un día para ver su detalle.

## Requisitos funcionales (RF)

RF-1 — Mostrar el mapa de calor.
- Cuando la persona abre la página, el sistema deberá mostrar una cuadrícula de
  semanas y días.
- El sistema deberá mostrar por defecto las **16 semanas** más recientes, contando la
  semana actual. La semana actual es la que contiene el día de hoy.
- El sistema deberá organizar la cuadrícula en **columnas (semanas) y 7 filas (días)**,
  siempre lunes a domingo. La cuadrícula es **rectangular y completa**: todos los
  cuadros existen, incluso los de semanas extremas o días futuros.
- El sistema deberá tratar el número de semanas como **un único valor configurable**
  (por defecto 16). Cambiar ese valor debe cambiar la cantidad de semanas mostradas.
- El sistema deberá etiquetar las columnas por **mes** (inicial o nombre corto) cuando
  la semana corresponda a un mes nuevo.

RF-2 — Colorear cada día según los minutos (5 niveles).
- El sistema deberá calcular los minutos de cada día **sumando** los minutos de todas
  las sesiones de ese día.
- Cuando un día tiene 0 minutos, el sistema deberá mostrarlo en nivel 0 (sin color).
- Cuando un día tiene entre 1 y 30 minutos (ambos incluidos), nivel 1.
- Cuando un día tiene entre 31 y 60 minutos (ambos incluidos), nivel 2.
- Cuando un día tiene entre 61 y 120 minutos (ambos incluidos), nivel 3.
- Cuando un día tiene 121 minutos o más, nivel 4.
- El sistema deberá tratar los minutos como números; si son decimales, se comparan
  numéricamente con los mismos umbrales.

RF-3 — Color e intensidad.
- El sistema deberá usar una escala de verde tipo GitHub: nivel 0 = color neutro
  claro; niveles 1 a 4 = verde de más claro a más oscuro.
- El sistema deberá mostrar una leyenda "menos / más" con los 5 niveles junto al mapa.
- Los valores de color exactos (hex) se fijan en el plan, no en esta spec.

RF-4 — Detalle de un día.
- Cuando la persona pasa el mouse sobre un día (escritorio), el sistema deberá mostrar
  la fecha y los minutos totales de ese día.
- Cuando la persona toca un día (móvil/táctil), el sistema deberá mostrar el mismo
  detalle, ya que en táctil no existe "hover".
- El detalle deberá usar el formato: `lun 3 oct 2026 · 45 min`. Un día sin sesiones
  muestra `· 0 min`.
- El sistema deberá exponer ese mismo detalle como texto accesible (por ejemplo, en
  `aria-label`), para que no dependa solo del color ni del mouse.

RF-5 — Fechas locales.
- El sistema deberá situar cada día según la fecha local del usuario, nunca en UTC.
- El sistema deberá reutilizar las funciones de fecha ya existentes en el proyecto.

## Requisitos no funcionales
- Debe verse bien en móvil: con el valor por defecto (16 semanas), la cuadrícula debe
  caber en 375 px **sin scroll horizontal**, ajustando el tamaño del cuadro. Si el
  valor configurable hiciera que no quepa, el contenedor podrá desplazarse
  horizontalmente sin romper el resto de la página.
- Debe ser coherente visualmente con el resto del Diario de Estudio.
- Sin backend: los datos provienen de las sesiones ya guardadas en el navegador.
- Todos los textos de la interfaz en español.
- Accesible: la información de cada día no debe depender solo del color (ver RF-4).
- El mapa se muestra en su propio panel, ancho y destacado (estilo GitHub), ubicado
  después de la tarjeta de racha y antes del formulario.

## Casos límite
- Sin sesiones guardadas: el mapa se muestra completo en nivel 0.
- Días de la semana actual que aún no han llegado: se muestran como nivel 0, aunque
  tengan una sesión registrada con fecha futura (las fechas futuras se ignoran).
- Varias sesiones el mismo día: se suman sus minutos.
- Sesiones anteriores al rango mostrado: no aparecen en el mapa.
- El rango puede cruzar entre meses y entre años.
- La cuadrícula es siempre rectangular 16×7; no hay semanas recortadas.
- Cambio de hora (DST): se resuelve reutilizando las funciones de fecha locales ya
  existentes (igual que en la racha y en los totales).

## Fuera de alcance
- Crear o editar sesiones desde el mapa.
- Vista de año completo o selector visible de rango.
- Etiquetas con los días de la semana (L, M, X…) y filas de guía; solo etiquetas de mes.
- Exportar el mapa como imagen.
- Tooltip persistente o múltiple; solo el del día señalado o tocado.

## Criterios de finalización
- El mapa muestra por defecto 16 semanas (lunes–domingo) con los datos reales.
- Cambiar el valor configurable cambia el número de semanas mostradas.
- Se aplican los 5 niveles con los umbrales acordados, sumando sesiones del mismo día.
- El detalle (mouse o toque) muestra fecha y minutos en el formato acordado.
- Existe una leyenda "menos / más" junto al mapa.
- El cálculo del nivel es una **función pura sin acceso al DOM** (principio 3 de la
  constitución).
- No hay errores en la consola del navegador.
- Se ve bien en móvil (375 px, sin scroll horizontal con 16 semanas) y en escritorio.
- Verificado con el MCP de Chrome DevTools: abrir, probar el mapa, comprobar la leyenda
  y el detalle, revisar la consola y comprobar la vista móvil.

## Dudas abiertas
Ninguna pendiente. Las decisiones tomadas en esta revisión están reflejadas arriba;
las que eran de detalle visual (colores hex, tamaño exacto del cuadro) se delegan
explícitamente al plan.
