# MEMORY.md — Diario de Estudio

Memoria del proyecto entre sesiones. Máximo ~50 líneas: resume o elimina lo que ya no aporte.

## Estado actual
- v7 funcionando: registrar sesiones (fecha, tema, minutos), racha actual, mejor racha,
  minutos de la semana, días del mes, lista, mapa de calor (16 semanas) y **objetivo
  semanal** (fijar, editar y quitar la meta; avance, % con coma, "¡Meta cumplida!").
- Spec 002 "Objetivo semanal" **implementada y validada**: T1-T11 cerradas, 63 tests en
  verde y revisión RF por RF en el navegador.
- Lógica de fechas/cálculo separada en `logica.js` (pura, testeable con `node --test`); el
  texto de interfaz en `index.html`/`app.js` (constitución, principio 3).
- Datos en localStorage: `diarioEstudio.sesiones` (JSON) y `diarioEstudio.objetivo`
  (texto plano, p. ej. `"300"`). Sin backend ni dependencias: doble clic y ya está.
- Diseño "cuaderno de estudio" (skill frontend-design): papel cuadriculado con CSS puro,
  resaltador, Georgia serif, cadena de 7 días. Mapa de calor: 16 semanas, 5 niveles fijos,
  verde GitHub, lógica pura en `logica.js` y pintado en `mapa.js`.

## Decisiones (y por qué)
- Fecha editable: permite registrar días pasados y ver la racha crecer.
- Mejor racha = la corrida de días consecutivos más larga del historial, **incluida la
  actual**; 1 día ya cuenta como 1. Antes se probó excluyendo la actual (mostraba 0 con 3
  días seguidos) y exigiendo 2+ días; se simplificó.
- Minutos de la semana = semana natural de lunes a domingo (convención en español).
- Días del mes = días DISTINTOS (dos sesiones el mismo día cuentan como 1) y solo hasta
  hoy (se ignoran fechas futuras).
- Objetivo semanal (002), decisiones **no obvias**:
  - **Dos reglas deliberadas para las fechas futuras**: el avance del objetivo las ignora
    y el marcador "Esta semana" **sigue sumándolas**. Por eso los dos números pueden
    diferir, y el bloque lo explica en texto visible llevando los dos números.
  - **Meta cumplida con minutos ≥ objetivo** (justo igual ya cuenta).
  - **Un decimal con coma y empate al alza**: se redondea en **décimas enteras**
    (`Math.floor(x + 0.5)`), nunca con `toFixed`, que depende de la representación
    binaria (49/400 = 12,25 % debe dar "12,3 %").
  - **Clave propia de localStorage en texto plano**: no se toca el formato de las sesiones
    y el dato se puede corromper a mano desde la consola para probar el caso "dato feo".
  - **Recálculo dentro de `renderizar()`, sin un solo temporizador**: el avance sale al
    abrir y tras cada acción; con la página quieta un cambio de semana **no** se refleja
    hasta la siguiente interacción (limitación conocida y aceptada).
  - `calcularMinutosSemana` se mudó de `app.js` a `logica.js` recibiendo `hoy` como
    parámetro; `renderizar()` lee el reloj **una sola vez** y pasa ese mismo `hoy` al
    total de la semana y al avance, para que no puedan discrepar.

## Aprendizajes y errores a evitar
- **El `node` del PATH no sirve para los tests**: en esta máquina es el v14.17.0 de nvm (o
  no está), y `--test` no existe ("bad option: --test"). Hay que llamar al `node.exe` de
  la carpeta `nvm\v24.21.0\`, y siempre con la **ruta del archivo de test**, no la carpeta.
- La zona horaria de esta máquina es `America/Bogota`, **sin horario de verano**: el test
  del cambio de hora (25 oct 2026) no muerde aquí; pasaría igual en cualquier zona.
- AGENTS.md tenía la clave de localStorage mal (`diario-estudio-sesiones`); la real es
  `diarioEstudio.sesiones`.
- Al probar render con mocks, `innerHTML = ""` debe vaciar el array de hijos del mock;
  si no, los cuadros se acumulan y dan falsos fallos.
- Para verificar móvil de verdad, usar `emulate` (viewport 375px); `resize_page(375)` no
  baja de ~500px y da capturas falsamente cortadas.

## Próximos pasos
- Decidir si abrir **spec 003** para los dos bugs preexistentes de `mapa.js`:
  `pintarMapa()` crea un `.mapa-tooltip` **por repintado** (1 → 2 → 4 en `document.body`)
  y los cuadros del mapa llevan `aria-label` en un `<span>` **sin `role` válido**, que un
  lector de pantalla puede no leer. Ninguno de los dos se ha arreglado.
- Proponer mover a `AGENTS.md` la **regla del objetivo recurrente**: la misma meta sirve
  para todas las semanas (no se guarda historial de metas) y el avance se recalcula al
  abrir y tras cada acción, sin temporizadores.
