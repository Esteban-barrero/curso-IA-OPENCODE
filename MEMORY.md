# MEMORY.md — Diario de Estudio

Memoria del proyecto entre sesiones. Máximo ~50 líneas: resume o elimina lo que ya no aporte.

## Estado actual
- v2 funcionando: registrar sesiones (fecha, tema, minutos), racha actual, mejor racha y lista de sesiones.
- Datos en localStorage (clave `diarioEstudio.sesiones`).

## Decisiones (y por qué)
- Sin backend ni dependencias: cualquiera debe poder abrirlo con doble clic.
- Fecha editable en el formulario: permite registrar días pasados y ver la racha crecer.
- Mejor racha = la corrida de días consecutivos más larga del historial (incluye la
  actual); una racha de 1 día ya cuenta como 1. Primero se probó excluyendo la racha
  actual (mostraba 0 con 3 días seguidos) y luego exigiendo 2+ días; se simplificó.

## Aprendizajes y errores a evitar
- AGENTS.md tenía la clave de localStorage mal (`diario-estudio-sesiones`); la real es `diarioEstudio.sesiones`.

## Próximos pasos
- (vacío por ahora)
