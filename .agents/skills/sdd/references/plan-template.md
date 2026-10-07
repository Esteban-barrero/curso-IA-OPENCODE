# Plan NNN — \<título corto\>

- **Spec:** specs/NNN-nombre/spec.md (aprobada)
- **Autor:** planner

> El CÓMO. Parte siempre de la spec aprobada.

## Archivos afectados

| Archivo | Acción | Qué cambia |
|---------|--------|------------|
| `ejemplo1/logica.js` | modificar | … |

## Lógica (funciones puras)

Las funciones de cálculo van en `logica.js`, sin tocar el DOM (constitución, principio 3). Reciben `hoy` como parámetro para poder testearlas.

- `nombreFuncion(parametros, hoy)` → devuelve … (cubre RF-N)

## Decisiones y alternativas descartadas

- **Decisión:** …
  - **Por qué:** …
  - **Alternativa descartada:** … porque …

## Estrategia de tests (`node --test`)

- Archivo de test: `ejemplo1/tests/logica.test.js`
- Casos: …
- Nota: pasar la ruta del archivo de test, no el directorio.

## Verificación visual (MCP Chrome DevTools)

- Qué comprobar en pantalla, consola y vista móvil (emular 375px).

## Cobertura de requisitos

| RF | Qué parte del plan lo cubre |
|----|-----------------------------|
| RF-1 | … |
