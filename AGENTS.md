# AGENTS.md

Repositorio de ejercicios del curso **"Curso de Desarrollo con IA: el Nuevo Programador"**.
No es una aplicación real: es material de aprendizaje.

## Contexto que no se ve en los archivos

- **El usuario está aprendiendo a programar.** Todo el código debe ser simple y estar
  **comentado en español**, explicando qué hace y por qué cada función/bloque. Esto es un
  requisito, no un extra.
- **Idioma:** comentarios y textos de interfaz en **español**.
- **No hay build, tests, lint ni dependencias.** No inventes comandos como `npm test` o
  `npm install`; no existen.

## Estructura y convención

- Cada ejercicio vive en su **propia carpeta numerada**: `ejemplo1/`, `ejemplo2/`, ...
- Cada ejercicio es **HTML + CSS + JS plano**, sin frameworks, sin librerías, sin compilar.
- Debe funcionar abriendo `index.html` con doble clic (sin servidor ni instalación).
- Nombres de archivo estándar dentro de cada ejemplo: `index.html`, `styles.css`, `app.js`.

## Reglas de negocio (Diario de Estudio)
- **Racha actual**: días consecutivos con sesión que terminan hoy. Regla "viva": si hoy
  no hay sesión pero ayer sí, la racha sigue viva (no se rompe hasta que termina el día).
- **Mejor racha**: la corrida de días consecutivos más larga del historial
  (INCLUYE la racha actual). Una racha de 1 solo día ya cuenta como 1.
- **Minutos de la semana**: suma de minutos de las sesiones de la semana actual,
  de **lunes a domingo** (hora local).
- **Días del mes**: número de días DISTINTOS del mes actual (hora local) con al
  menos una sesión, contando solo hasta hoy (se ignoran las fechas futuras).
- Fechas siempre en **hora local del usuario** (nunca UTC).

## Forma de trabajar
- Haz solo lo que se pide: no añadas funcionalidades por tu cuenta.
- Cambios pequeños y enfocados; no reescribas lo que ya funciona.
- Al terminar, resume qué has cambiado y cualquier decisión que deba revisar.

## Memoria
- Al empezar, lee `MEMORY.md` para conocer el estado del proyecto y las decisiones tomadas.
- Al terminar una tarea, actualízalo: estado actual, decisiones importantes (con su porqué) y errores a evitar.
- Mantenlo breve (máximo ~50 líneas): resume o elimina lo que ya no aporte.
- Si algo se convierte en una regla permanente, propón moverlo a `AGENTS.md` en lugar de dejarlo en la memoria.
- No guardes nunca datos sensibles (claves, tokens, datos personales).

## Comandos
- Tests: `node --test`

## Reglas
- Lee `docs/constitution.md` y la spec activa (`specs/NNN-*/`) antes de tocar código.

## Límites
- ✅ Siempre: respetar las reglas de fechas y racha, mantener los textos en español.
- ✅ Siempre: actualizar 'MEMORY.md' al terminar la tarea.
- ⚠️ Pregunta antes: crear archivos nuevos, cambiar el formato de los datos guardados.
- ❌ Nunca: añadir dependencias, frameworks o un paso de build.

## Verificación
- No hay tests automáticos. Después de cada cambio, verifica con el MCP de Chrome DevTools: abre `index.html`, prueba la funcionalidad, revisa la consola y comprueba la vista móvil.
- Para empezar de cero: DevTools -> Application -> Local Storage -> borrar la clave `diarioEstudio.sesiones`.