# Plan 001 — Mapa de calor de estudio

Este plan implementa `specs/001-heat-map/spec.md` respetando `docs/constitution.md`.
Marca, por sección, qué requisitos funcionales (RF) cubre.

## 1. Archivos (qué se crea y qué se modifica)

| Archivo | Acción | Responsabilidad | RF |
|---|---|---|---|
| `ejemplo1/logica.js` | **Crear** | Funciones **puras** de cálculo del mapa (niveles, matriz de semanas, totales por día). Sin DOM. Se comparte entre navegador y tests. | RF-1, RF-2, RF-5 |
| `ejemplo1/mapa.js` | **Crear** | Pinta el mapa de calor en el DOM: cuadrícula, colores, leyenda, detalle (mouse/toque). Solo interfaz. | RF-1, RF-3, RF-4 |
| `ejemplo1/index.html` | **Modificar** | Añadir el panel del mapa y la leyenda; enlazar `logica.js` y `mapa.js`. | RF-1, RF-3 |
| `ejemplo1/styles.css` | **Modificar** | Estilos del mapa, los 5 niveles de verde, leyenda, tooltip y responsive. | RF-3 |
| `ejemplo1/app.js` | **Modificar** | Reutilizar `logica.js`; dejar de duplicar cálculo de fechas. Mantener su lógica actual. | RF-5 |
| `ejemplo1/tests/logica.test.js` | **Crear** | Tests nativos de Node (`node --test`) sobre `logica.js`. | RF-1, RF-2, RF-5 |

> Decisión: extraer la lógica pura a `logica.js` cumple el **principio 3** de la
> constitución (lógica separada de la interfaz) y, a la vez, la hace testeable con
> `node --test` sin navegador.

## 2. Funciones puras de lógica (todas con "hoy" como parámetro)

Regla de oro: **ninguna recibe la fecha por `new Date()` internamente**; reciben `hoy`
como parámetro para ser deterministas y testeables.

| Función | Firma | Qué hace | RF |
|---|---|---|---|
| `nivelDeMinutos(minutos)` | `(number) -> 0..4` | Aplica los 5 umbrales (0 / 1–30 / 31–60 / 61–120 / 121+). | RF-2 |
| `minutosPorDia(sesiones)` | `(sesiones) -> Map<"YYYY-MM-DD", number>` | Suma minutos de todas las sesiones por día. | RF-2 |
| `construirMapa(sesiones, hoy, semanas)` | `(sesiones, Date, number) -> string[][]` | Devuelve una matriz de columnas (semanas) × 7 filas (lun–dom), con las fechas ISO de cada cuadro. | RF-1, RF-5 |
| `etiquetasDeMes(mapa)` | `(matriz) -> etiqueta por columna` | Decide en qué columnas rotular el mes. | RF-1 |
| `formatearFechaDetalle(fechaISO)` | `("YYYY-MM-DD") -> string` | Texto del detalle: `lun 3 oct 2026`. | RF-4 |
| `obtenerFechaLocalISO(fecha)` | `(Date) -> "YYYY-MM-DD"` | **Ya existe** en `app.js`; se mueve/reutiliza desde `logica.js`. | RF-5 |

## 3. Algoritmo del mapa (pseudocódigo)

```
FUNCIÓN construirMapa(sesiones, hoy, semanas):
    minutos = minutosPorDia(sesiones)          # Mapa fecha -> minutos

    # 1) Encontrar el lunes de la semana actual (la que contiene "hoy")
    diasDesdeLunes = (diaDeSemana(hoy) + 6) mód 7
    lunesActual = sumarDías(hoy, -diasDesdeLunes)

    # 2) El lunes más antiguo: (semanas - 1) semanas antes
    lunesInicial = sumarDías(lunesActual, -7 * (semanas - 1))

    # 3) Recorrer semana a semana, de lunes a domingo
    mapa = []
    PARA cada semana desde lunesInicial hasta lunesActual (paso 7 días):
        columna = []
        PARA cada día desde lunes de esa semana hasta domingo (7 días):
            fechaISO = obtenerFechaLocalISO(eseDía)
            SI fechaISO > obtenerFechaLocalISO(hoy):
                minutosDia = 0            # días futuros => nivel 0
            SINO:
                minutosDia = minutos[fechaISO] o 0
            nivel = nivelDeMinutos(minutosDia)
            columna.agregar({ fechaISO, minutosDia, nivel })
        mapa.agregar(columna)
    DEVOLVER mapa
```

Notas del algoritmo:
- La cuadrícula es **siempre rectangular** `semanas × 7` (spec, casos límite).
- Las fechas futuras se fuerzan a nivel 0, aunque tengan sesión registrada.
- Suma de minutos por día antes de calcular el nivel.

## 4. Cómo se pinta en la interfaz

```
pintarMapa(sesiones):
    mapa = construirMapa(sesiones, new Date(), SEMANAS_MAPA)

    contenedor = document.getElementById("mapa-calor")
    vaciar(contenedor)

    PARA cada columna (semana) del mapa:
        crear <div class="semana">
        PARA cada cuadro (día) de la columna:
            crear <span class="celda nivel-N">
            celda.dataset.fecha = cuadro.fechaISO
            celda.setAttribute("aria-label", formatearFechaDetalle + " · " + minutos + " min")
            aplicar evento: mouseenter (mouse) y click/touch (móvil) => mostrar detalle
        contenedor.agregar(semana)

    pintarEtiquetasDeMes(mapa)   # encima de las columnas
```

El detalle (tooltip) se muestra con un elemento propio (no `title`), para funcionar
igual en móvil. En `aria-label` va el mismo texto (accesibilidad, RF-4).

## 5. Decisiones técnicas (con alternativa descartada)

| Decisión | Por qué | Alternativa descartada |
|---|---|---|
| Lógica pura en `logica.js` separada del DOM | Cumple constitución (principio 3) y permite `node --test` | Todo en `app.js` (descartado: no testeable sin navegador) |
| Cuadrícula con `div`/`span` + clases CSS | Simple, sin dependencias, estilo GitHub | `<canvas>` (descartado: complejo y peor para accesibilidad) |
| Colores en CSS (variables `--nivel-N`) | Editable en un sitio; coherencia con el tema | Colores fijos en JS (descartado: mezcla lógica y estilo) |
| `construirMapa` recibe `hoy` por parámetro | Determinista y testeable | Usar `new Date()` dentro (descartado: no reproducible en tests) |
| Detalle propio en vez de `title` | `title` no funciona bien en táctil ni se ve | Atributo `title` nativo (descartado: mala accesibilidad/móvil) |
| Tests con `node --test` | Nativo de Node, sin instalar nada (constitución actualizada) | Framework externo (descartado: rompe "sin dependencias") |

## 6. Estrategia de tests (`node --test`)

Comando: `node --test ejemplo1/tests/`

Casos a cubrir en `logica.test.js`:
- **RF-2** `nivelDeMinutos`: 0→0, 1→1, 30→1, 31→2, 60→2, 61→3, 120→3, 121→4.
- **RF-2** `minutosPorDia`: varias sesiones del mismo día se suman.
- **RF-1** `construirMapa`: devuelve `semanas` columnas × 7 filas; la última columna
  contiene a "hoy"; la primera fila es lunes.
- **RF-5** `construirMapa`: con un `hoy` fijo, la fecha de hoy cae en el día correcto.
- **RF-1** días futuros: un día posterior a `hoy` dentro de la semana actual → nivel 0
  aunque tenga sesión.
- **RF-4** `formatearFechaDetalle`: formato `lun 3 oct 2026`.

> Los tests solo importan `logica.js` (puro). La parte visual se verifica aparte con
> el MCP de Chrome DevTools (criterios de finalización de la spec).

## 7. Cobertura de RF (resumen)

- **RF-1** (cuadrícula, semanas, configurables, etiquetas de mes): secciones 2, 3, 4.
- **RF-2** (niveles y suma de minutos): sección 2 (`nivelDeMinutos`, `minutosPorDia`).
- **RF-3** (colores y leyenda): secciones 1 y 4 (CSS + leyenda en HTML).
- **RF-4** (detalle mouse/táctil y accesible): sección 4.
- **RF-5** (fechas locales): sección 2 (`obtenerFechaLocalISO`) y 3.

## 8. Verificación final

1. `node --test ejemplo1/tests/` → tests de lógica en verde.
2. Con el MCP de Chrome DevTools: abrir `index.html`, comprobar el mapa, la leyenda,
   el detalle (mouse y móvil), la consola sin errores y la vista a 375 px.
