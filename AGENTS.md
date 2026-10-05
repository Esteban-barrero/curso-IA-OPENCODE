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

### Reglas aprendidas de `ejemplo1` (Diario de Estudio)

- Fechas: usar **siempre la fecha local**, nunca UTC. Al formatear una fecha `YYYY-MM-DD`,
  añadir `T00:00:00` para evitar desfases de zona horaria.
- Persistencia: `localStorage` (solo guarda texto → `JSON.stringify` / `JSON.parse`).
- Al pintar listas, preferir `createElement`/`textContent` sobre `innerHTML`.

## Flujo de trabajo

- Para **abrir un ejemplo** en el navegador desde el shell (Windows/PowerShell):
  `Start-Process "ruta\al\index.html"`.
- **Git ya está configurado** (usuario, email y credenciales de Windows). El remoto
  `origin` apunta a https://github.com/Esteban-barrero/curso-IA-OPENCODE.
- Subir cambios: `git add .` → `git commit -m "..."` → `git push`.
  PowerShell muestra los mensajes de `git` en rojo como si fueran error; **ignóralos si
  el código de salida es 0**.
