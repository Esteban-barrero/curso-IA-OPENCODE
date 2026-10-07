# MEMORY.md — Diario de Estudio

Memoria del proyecto entre sesiones. Máximo ~50 líneas: resume o elimina lo que ya no aporte.

## Estado actual
- v6 funcionando: registrar sesiones (fecha, tema, minutos), racha actual, mejor racha,
  total de minutos de la semana, días estudiados del mes, lista de sesiones y **mapa de
  calor** (16 semanas, estilo GitHub).
- Rediseño visual "cuaderno de estudio" (papel cuadriculado, resaltador, cadena de 7 días).
- Lógica de fechas/cálculo separada en `logica.js` (pura, testeable con `node --test`).
- Datos en localStorage (clave `diarioEstudio.sesiones`).
- **Spec 002 "Objetivo semanal" en borrador**: spec redactada y pasada por 3 revisiones de
  aclaración (constitución+fechas / interfaz+móvil / tests). Falta: aprobación del usuario,
  plan, tareas e implementación. No hay código de la 002 todavía.

## Decisiones (y por qué)
- Sin backend ni dependencias: cualquiera debe poder abrirlo con doble clic.
- Fecha editable en el formulario: permite registrar días pasados y ver la racha crecer.
- Mejor racha = la corrida de días consecutivos más larga del historial (incluye la
  actual); una racha de 1 día ya cuenta como 1. Primero se probó excluyendo la racha
  actual (mostraba 0 con 3 días seguidos) y luego exigiendo 2+ días; se simplificó.
- Minutos de la semana = semana natural de lunes a domingo (no domingo a sábado); es la
  convención en español.
- Días del mes = días DISTINTOS (no sesiones: dos el mismo día cuentan como 1) y solo
  hasta hoy (se ignoran fechas futuras del mes).
- Diseño (skill frontend-design): identidad de "cuaderno de estudio" (papel cuadriculado
  con CSS puro, resaltador amarillo, serif Georgia para títulos). La "cadena" muestra los
  últimos 7 días (cuadro lleno = con estudio). Se evitó a propósito el look genérico
  (degradados decorativos, tarjetas idénticas, etiquetas en MAYÚSCULAS).
- Mapa de calor (spec 001): 16 semanas configurables, 5 niveles fijos (0/1-30/31-60/
  61-120/121+), verde tipo GitHub, tooltip con fecha+minutos, lunes a domingo. La lógica
  pura vive en `logica.js`; el pintado, en `mapa.js` (constitución, principio 3).
- Se actualizó el principio 4 de la constitución para permitir tests nativos `node --test`
  (Node los trae incluidos: no son dependencia externa).
- Objetivo semanal (spec 002, en borrador): el usuario eligió (a) que el avance **ignore**
  las fechas futuras mientras el marcador "Esta semana" **sigue sumándolas** — dos reglas
  deliberadas, así que ambos números pueden diferir y el bloque del objetivo debe explicarlo
  en texto; (b) meta cumplida con minutos **≥** objetivo; (c) un decimal con coma y empate
  redondeado **al alza**; (d) clave de `localStorage` propia, sin tocar el formato de las
  sesiones; (e) recálculo al abrir y en cada acción, **sin temporizadores**.
- `calcularMinutosSemana` vive en `app.js`, que **no se puede importar en Node** (usa
  `document.getElementById` a nivel superior). Para testear el avance habrá que moverla a
  `logica.js` como función pura con `hoy` como parámetro.

## Aprendizajes y errores a evitar
- AGENTS.md tenía la clave de localStorage mal (`diario-estudio-sesiones`); la real es `diarioEstudio.sesiones`.
- Al probar render con mocks, `innerHTML = ""` debe vaciar el array de hijos del mock;
  si no, los cuadros se acumulan y dan falsos fallos.
- `node --test <directorio>` falla en Node 24 (lo trata como módulo); usar la ruta del
  archivo de test: `node --test ejemplo1/tests/logica.test.js`.
- Para verificar móvil de verdad, usar `emulate` (viewport 375px); `resize_page(375)` no
  baja de ~500px y da capturas falsamente cortadas.

## Próximos pasos
- Spec 002: el usuario debe **aprobar** la spec; luego `plan.md` + `tasks.md`, e implementar
  las tareas de una en una con el subagente `implementer`.
- Pendiente de decidir en el plan: barra o solo texto, redacción exacta de "cumplida" y del
  texto que explica la diferencia con "Esta semana".
