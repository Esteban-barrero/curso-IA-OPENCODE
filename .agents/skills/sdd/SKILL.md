---
name: sdd
description: Úsala para cualquier trabajo con el flujo SDD (Spec-Driven Development): redactar specs en EARS, planes, tareas y validaciones. La usan los agentes coordinator, planner, implementer y reviewer del Diario de Estudio.
---

# SDD — Desarrollo guiado por especificaciones

El SDD invierte el orden habitual: **primero se escribe QUÉ se quiere y POR QUÉ**, se aprueba, y solo después se decide cómo y se implementa. La spec manda sobre el código (constitución, principio 2).

## Flujo completo

```
Spec → Clarificación → Plan y tareas → Implementación → Validación → Cierre
```

1. **Spec** (planner): redacta `specs/NNN-nombre/spec.md`. Solo el QUÉ y el POR QUÉ.
2. **Clarificación** (reviewer): revisa la spec como QA. Solo detecta problemas, no propone soluciones.
3. **Plan y tareas** (planner): `plan.md` y `tasks.md` a partir de la spec aprobada.
4. **Implementación** (implementer): UNA tarea a la vez, tests primero.
5. **Validación** (reviewer): recorre la spec RF por RF.
6. **Cierre** (coordinator): resumen, veredicto y pendientes.

## Estructura de una spec

```
specs/
└── NNN-nombre/          NNN = número de 3 dígitos (001, 002…), siguiente libre
    ├── spec.md          qué y por qué
    ├── plan.md          cómo (archivos, lógica, decisiones, tests)
    └── tasks.md         tareas ordenadas
```

Reglas del nombre: `NNN-nombre`, en minúsculas, con guiones, sin tildes ni espacios (por ejemplo `002-objetivo-semanal`).

## Requisitos en EARS

Cada requisito funcional (RF) se escribe en formato **EARS**. Identifícalo con `RF-1`, `RF-2`… y usa solo uno de estos patrones:

| Tipo | Patrón | Ejemplo |
|------|--------|---------|
| Ubicuo | El sistema deberá… | El sistema deberá mostrar la racha actual. |
| Por evento (WHEN) | **Cuando** \<evento\>, el sistema deberá… | Cuando el usuario registra una sesión, el sistema deberá recalcular la racha. |
| Por estado (WHILE) | **Mientras** \<estado\>, el sistema deberá… | Mientras no haya sesiones, el sistema deberá mostrar 0. |
| Opcional (WHERE) | **Donde** \<característica\>, el sistema deberá… | Donde exista una meta semanal, el sistema deberá mostrar el progreso. |
| Comportamiento no deseado (IF/THEN) | **Si** \<condición\>, **entonces** el sistema deberá… | Si la fecha es futura, entonces el sistema deberá ignorarla. |

Cada RF debe ser **verificable**: debe poder comprobarse con un test `node --test` o con el MCP de Chrome DevTools.

### Casos límite
Junto a los RF, lista los casos límite conocidos (por ejemplo: sesión a las 00:30, cambio de hora, fecha futura, lista vacía).

## Plantillas

Usa las plantillas de apoyo al crear cada archivo:

- `references/spec-template.md` → copia a `specs/NNN-nombre/spec.md`
- `references/plan-template.md` → copia a `specs/NNN-nombre/plan.md`
- `references/tasks-template.md` → copia a `specs/NNN-nombre/tasks.md`

Las rutas son relativas a esta carpeta `SKILL.md`.

## Reglas de cada fase

### Spec
- **Solo el QUÉ y el POR QUÉ.** Nada de stack, arquitectura ni nombres de archivos.
- Si la petición es ambigua, **no supongas**: devuelve una lista numerada de preguntas (máximo 5).
- Estado inicial: `Estado: borrador`. Tras la aprobación del usuario: `Estado: aprobada`.

### Clarificación (reviewer)
- Revisa como QA: (1) ambigüedades, (2) contradicciones, (3) casos límite no cubiertos, (4) conflictos con `docs/constitution.md`.
- **Solo detecta**, no propongas soluciones.

### Plan
- Parte SIEMPRE de una spec aprobada.
- Indica archivos a tocar, las funciones puras con `hoy` como parámetro (constitución, principio 3), decisiones con su alternativa descartada y qué RF cubre cada parte.
- Estrategia de tests con `node --test` (nota: pasar la ruta del archivo, no el directorio).

### Tareas
- **Máximo 10 tareas**, en orden de dependencia.
- Cada tarea indica: número (T1, T2…), RF que cubre y **"Hecho cuando:"** (criterio verificable).

### Implementación (implementer)
- Lee la tarea, su `plan.md`, `docs/constitution.md` y `AGENTS.md`.
- Una sola tarea. Primero el test en rojo, después el código (para la lógica).
- Ejecuta `node --test`; nunca dar por hecha una tarea con tests en rojo.
- Cambios visuales: verificar con el MCP de Chrome DevTools, incluida la vista móvil.
- Marca la tarea como hecha y PARA.

### Validación (reviewer)
- Recorre la spec RF por RF: qué test lo cubre y su resultado.
- RF de interfaz: verificar con el MCP de Chrome DevTools, incluida la vista móvil.
- Empieza siempre con `VEREDICTO: APROBADO` o `VEREDICTO: CAMBIOS NECESARIOS`.
- Si hay cambios: lista numerada con `archivo:línea`, qué incumple (tarea, RF o principio) y qué se espera. Las sugerencias no bloqueantes van aparte, en "Opcional".

## Principios del proyecto que la spec debe respetar

- Stack simple: HTML + CSS + JS plano, sin build (constitución, principio 1).
- Lógica separada de la interfaz: funciones puras sin `document` (principio 3).
- Verificación con `node --test` y el MCP de Chrome DevTools, sin framework externo (principio 4).
- Datos solo en `localStorage`, sin backend (principio 5).
- Todo en español (principio 6).
