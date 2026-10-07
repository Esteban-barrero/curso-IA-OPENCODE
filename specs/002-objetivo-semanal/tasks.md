# Tareas 002 — Objetivo semanal de estudio

- **Spec:** `specs/002-objetivo-semanal/spec.md` (aprobada)
- **Plan:** `specs/002-objetivo-semanal/plan.md`
- **Autor:** planner

> Checklist de implementación derivada del `plan.md`. Se hace **una tarea a la
> vez**: T1, T2 y T3 son la lógica pura (tests primero, en rojo, y luego el
> código); T4 a T7 la interfaz; T8 a T10 la verificación.
> Ninguna tarea crea archivos nuevos: solo se modifican `logica.js`,
> `tests/logica.test.js`, `index.html`, `styles.css` y `app.js`.

## T1 — Validación y normalización del objetivo (tests primero)

- **RF:** RF-1
- **Hecho cuando:** en `ejemplo1/tests/logica.test.js` hay un test con los
  **15 casos de la lista cerrada** de RF-1 (`"300"`→300, `"0300"`→300,
  `"+300"`→300, `" 300 "`→300, `"3e2"`→300, `"1e3"`→1000, `""`→vacio,
  `"   "`→vacio, `"abc"`→noNumero, `"0"`→noPositivo, `"-5"`→noPositivo,
  `"300.5"`/`"300,5"`/`"300.0"`→decimales, `"Infinity"`→noNumero,
  `"0x10"`→noNumero) más normalización (`"0300"` acaba en `300`), tipos no
  textuales (`300`, `null` → `noNumero`), `"1e999"` → `noNumero` y `"999999"`
  aceptado (sin máximo); **el test se escribe primero, falla, y pasa** cuando
  `normalizarObjetivo` existe en `logica.js` con el pseudocódigo 5.1 del plan.
- **RF cubre:** RF-1.

- [x] Hecha ✅

## T2 — Minutos de la semana, avance, porcentaje y formato

- **RF:** RF-3, RF-4
- **Hecho cuando:** `node --test ejemplo1/tests/logica.test.js` pasa con:
  (a) `calcularPorcentajeObjetivo` dando **exactamente** `45/300 → "15,0 %"`,
  `47/300 → "15,7 %"`, `49/400 → "12,3 %"`, `0/300 → "0,0 %"`,
  `500/300 → "100,0 %"`, `200/200 → "100,0 %"` y objetivo `0`/nulo →
  `"0,0 %"`; (b) `formatearMinutos(45000)` + `" de "` +
  `formatearMinutos(100000)` + `" min"` → `"45.000 de 100.000 min"` y
  `30.5 → "30,5"`; (c) `calcularMinutosSemana(sesiones, hoy)` con los límites
  lunes–domingo, cruce de mes, **cruce de año** (28 dic 2026 → 3 ene 2027),
  medianoche y cambio de hora, y **contando también las fechas futuras**; y
  (d) `calcularMinutosAvance(sesiones, hoy)` con los mismos datos dando 75
  frente a 135, ignorando el futuro. Las seis funciones quedan exportadas en el
  bloque `module.exports` de `logica.js`.
- **RF cubre:** RF-3, RF-4.

- [x] Hecha ✅

## T3 — Agregador `calcularAvanceObjetivo` y sacar `calcularMinutosSemana` de `app.js`

- **RF:** RF-3, RF-4, RF-5
- **Hecho cuando:** `calcularAvanceObjetivo(sesiones, objetivoGuardado, hoy)`
  tiene tests para: sin objetivo (`porcentaje null`), objetivo corrupto
  (`"abc"`, `"0"`, `"300.5"`, `"{}"` → `hayObjetivo false`), `"200"` con
  avance 200 → `cumplida true` y `"100,0 %"`, `"0300"` → `objetivo 300`,
  meta a media semana → `"66,7 %"`, objetivo 100 con avance 200 → cumplida sin
  recortar los minutos, `hayFuturo true` cuando los dos totales difieren, y
  cambio de semana → objetivo conservado con avance 0; **además** `app.js` ya
  no define `calcularMinutosSemana` y la llama como
  `calcularMinutosSemana(sesiones, hoy)` con el mismo `hoy` que el agregado,
  y el marcador "Esta semana" **sigue mostrando lo mismo** que antes.
- **RF cubre:** RF-3, RF-4, RF-5.

- [x] Hecha ✅

## T4 — Panel del objetivo en `index.html`

- **RF:** RF-2, RF-3, RF-5, RF-6
- **Hecho cuando:** entre la portada y el mapa de calor hay un
  `<section class="panel panel-objetivo">` con el marcado del plan 6.1: `<h2>`
  "Objetivo semanal", invitación, `objetivo-cifras`, `objetivo-porcentaje`,
  `objetivo-cumplida` con el texto "¡Meta cumplida!", `objetivo-barra` con
  `aria-hidden="true"` y su `objetivo-relleno`, `objetivo-nota`, y un
  `<form id="formulario-objetivo">` con `<label for="objetivo-minutos">`,
  `<input type="text" inputmode="numeric">`, el hueco `objetivo-ayuda` y los
  botones "Guardar objetivo" y "Quitar objetivo"; **sin objetivo** la pantalla
  muestra la invitación y **no** muestra porcentaje, barra ni "0 / 0", y el
  resto de la página (portada, mapa, formulario de sesión, lista) queda igual.
- **RF cubre:** RF-2, RF-3, RF-5, RF-6.

- [x] Hecha ✅

## T5 — Estilos del bloque del objetivo

- **RF:** RF-3, RF-6
- **Hecho cuando:** con el panel vacío (sin objetivo) la página no muestra
  cifras ni barra, y con objetivo se ven las cifras en Georgia con
  `tabular-nums`, el porcentaje, la barra (carril `--nivel-0`, relleno
  `--tinta`, o `--nivel-3` si está cumplida) y "¡Meta cumplida!" con fondo
  `--resaltador`; `objetivo-ayuda` reserva alto para que el mensaje de error
  **no cambie el alto del panel**, y a 375 px emulados
  `document.documentElement.scrollWidth <= 375`.
- **RF cubre:** RF-3, RF-6.

- [x] Hecha ✅

## T6 — Leer, guardar y pintar el objetivo

- **RF:** RF-2, RF-3, RF-5
- **Hecho cuando:** `app.js` tiene `CLAVE_OBJETIVO = "diarioEstudio.objetivo"`,
  `leerObjetivo`, `guardarObjetivo`, `quitarObjetivo` y `pintarObjetivo`, y
  `renderizar()` llama a `pintarObjetivo(sesiones, hoy)` con el mismo `hoy` que
  usa para "Esta semana"; al abrir la página con un objetivo guardado en
  `localStorage` se ven "… de 300 min", el porcentaje y la barra correctos, con
  la clave de sesiones **intacta**; sin objetivo aparece la invitación.
- **RF cubre:** RF-2, RF-3, RF-5.

- [x] Hecha ✅

## T7 — Eventos: guardar, editar, quitar y mensaje de error

- **RF:** RF-1, RF-5, RF-6
- **Hecho cuando:** enviar `300` lo guarda como texto plano `"300"` y repinta;
  enviar `0300` deja el input con `300`; enviar `100` sustituye al anterior
  **sin tocar** las sesiones; "Quitar objetivo" vuelve al estado sin objetivo y
  la lista de sesiones no cambia; y `abc`, `0`, `300.5` y el campo vacío
  muestran **cuatro textos distintos** en un `<p role="alert">` con
  `aria-describedby` en el input, en flujo normal (no tapa nada y el alto del
  panel no cambia), y al corregir el valor
  `document.getElementById("objetivo-error") === null` **y** el input ya no
  tiene `aria-describedby`.
- **RF cubre:** RF-1, RF-5, RF-6.

- [x] Hecha ✅

## T8 — Recálculo y no regresión (Chrome DevTools)

- **RF:** RF-4, RF-5 + RNF de no regresión
- **Hecho cuando:** registrar una sesión de hoy actualiza el avance **sin
  recargar**; registrar una sesión de la semana anterior **no** cambia el
  avance; una sesión con fecha mañana **no** cambia el avance pero **sí**
  "Esta semana" y aparece la nota con los dos números; y racha, mejor racha,
  días del mes, mapa de calor, lista de sesiones y "Esta semana" se ven igual
  que antes de la 002 (comparado contra la 001).
- **RF cubre:** RF-4, RF-5 y criterios de no regresión.

- [x] Hecha ✅

## T9 — Móvil 375 px y accesibilidad (Chrome DevTools)

- **RF:** RF-6
- **Hecho cuando:** con la **emulación de viewport** (no `resize_page`, que no
  baja de ~500 px) se confirma **antes de medir** que `window.innerWidth === 375`,
  después `document.documentElement.scrollWidth <= 375` y los controles del
  objetivo son alcanzables (rect dentro del viewport y el toque funciona); y en
  el panel se comprueba que objetivo y avance son **texto accesible real**
  (no `title`), que el input tiene nombre accesible por su `<label>` y que el
  mensaje de error está asociado a su campo.
- **RF cubre:** RF-6.

- [x] Hecha ✅

## T10 — Consola, dato corrupto y validación final de la spec

- **RF:** RF-2, RF-6 + RNF
- **Hecho cuando:** con datos válidos la consola está **sin errores**; con
  `localStorage.setItem("diarioEstudio.objetivo", "abc")` (y con `""`, `"0"`,
  `"300.5"` y `"[1]"`) y recarga, la aplicación **no lanza excepciones**, avisa
  por consola en español y muestra la invitación; se recorre la spec RF por RF
  con los 15 casos de la lista cerrada en pantalla; `node --test
  ejemplo1/tests/logica.test.js` sale en verde **incluidos los tests de la 001**;
  y se actualiza `MEMORY.md` (estado, decisiones de la 002 y errores a evitar).
- **RF cubre:** RF-1, RF-2, RF-6 y criterios de finalización.

- [x] Hecha ✅

## T11 — Cobertura de minutos decimales (hueco de auditoría)

- **RF:** RF-3, RF-4
- **Hecho cuando:** el caso límite de la spec "Minutos decimales ya guardados"
  está testeado también **fuera** de `calcularMinutosSemana`, es decir en
  (a) `calcularMinutosAvance`: una sesión de esta semana con `30.5` da
  **exactamente `30.5`** (ni 30 con `Math.floor` ni 31 con `Math.round`), dos
  sesiones del mismo día de `30.5` dan **61**, y una sesión decimal de la
  semana anterior o con fecha futura dan **0**; y en (b)
  `calcularPorcentajeObjetivo` con avance no entero:
  `30.5/300 → "10,2 %"`, `61/300 → "20,3 %"`, `30.5/30.5 → "100,0 %"` y
  `500.5/300 → "100,0 %"` con ancho 100 (nunca recortando los minutos); y en
  (c) `calcularAvanceObjetivo` con objetivo `"300"` y una sesión decimal:
  `minutosAvance 30.5`, `porcentaje "10,2 %"` y `cumplida false`
  (`formatearMinutos(30.5) → "30,5"` ya estaba testeado: no se duplica).
  Solo se añade código de test: **`logica.js` no se toca**.
- **RF cubre:** RF-3, RF-4.

- [x] Hecha ✅

---

Estados: `[ ]` pendiente · `[x]` hecha. El implementer marca la tarea y PARA; no
empieza la siguiente. Si una tarea no se puede terminar, se para y avisa en vez
de seguir con la siguiente.