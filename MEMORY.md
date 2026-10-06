# MEMORY.md — Diario de Estudio

Memoria del proyecto entre sesiones. Máximo ~50 líneas: resume o elimina lo que ya no aporte.

## Estado actual
- v5 funcionando: registrar sesiones (fecha, tema, minutos), racha actual, mejor racha,
  total de minutos de la semana, días estudiados del mes y lista de sesiones.
- Rediseño visual "cuaderno de estudio" (papel cuadriculado, resaltador, cadena de 7 días).
- Datos en localStorage (clave `diarioEstudio.sesiones`).

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

## Aprendizajes y errores a evitar
- AGENTS.md tenía la clave de localStorage mal (`diario-estudio-sesiones`); la real es `diarioEstudio.sesiones`.
- Al probar render con mocks, `innerHTML = ""` debe vaciar el array de hijos del mock;
  si no, los cuadros se acumulan y dan falsos fallos.

## Próximos pasos
- (vacío por ahora)
