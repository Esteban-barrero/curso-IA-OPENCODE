# Tareas 001 — Mapa de calor de estudio

Checklist de implementación derivada de `plan.md`. Se hace **una tarea a la vez**.

## T1 — Lógica pura + tests (sin DOM) ✅ COMPLETADA
- [x] Crear `ejemplo1/logica.js` con las funciones puras:
  `obtenerFechaLocalISO`, `sumarDias`, `nivelDeMinutos`, `minutosPorDia`,
  `construirMapa`, `etiquetasDeMes`, `formatearFechaDetalle`.
- [x] Crear `ejemplo1/tests/logica.test.js` con tests nativos de Node.
- [x] Pasar `node --test ejemplo1/tests/logica.test.js` (10/10 en verde).
- **RF cubre:** RF-1 (parte de cálculo), RF-2, RF-4 (formato), RF-5.

## T2 — Pintar el mapa en el DOM ✅ COMPLETADA
- [x] Crear `ejemplo1/mapa.js` (cuadrícula, niveles, leyenda, detalle mouse/toque).
- [x] Añadir el panel y la leyenda en `index.html`; enlazar `logica.js` y `mapa.js`.
- **RF cubre:** RF-1, RF-3, RF-4.

## T3 — Estilos y responsive ✅ COMPLETADA
- [x] Estilos del mapa, los 5 niveles de verde, leyenda y tooltip en `styles.css`.
- [x] Ver a 375 px sin scroll horizontal (verificado con emulación móvil).
- **RF cubre:** RF-3.

## T4 — Integración y verificación ✅ COMPLETADA
- [x] Reutilizar `logica.js` desde `app.js` (quitadas las funciones de fecha duplicadas).
- [x] Verificar con el MCP de Chrome DevTools (mapa, leyenda, detalle, consola, móvil).
- **RF cubre:** RF-5 y criterios de finalización.
