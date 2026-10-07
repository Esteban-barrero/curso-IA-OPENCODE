# Plan 002 — Objetivo semanal de estudio

- **Spec:** `specs/002-objetivo-semanal/spec.md` (aprobada)
- **Autor:** planner
- **Fecha:** 2026-10-06

> El CÓMO. Parte siempre de la spec aprobada (constitución, principio 2).
> Marca, por sección, qué requisitos funcionales (RF) cubre.
> Los detalles visuales que la spec delegó en el plan están decididos aquí:
> barra **más** porcentaje en texto, texto de "cumplida", redacción de la nota
> de la diferencia, sitio del bloque y forma del mensaje de error.

## 1. Archivos (qué se modifica)

**No se crea ningún archivo nuevo**: todo entra en los que ya existen. Por eso
no hace falta la pregunta previa de `AGENTS.md:54` ("preguntar antes de crear
archivos nuevos"). La aprobación de este plan cubre cualquier cambio de
contenido dentro de estos cinco archivos.

| Archivo | Acción | Responsabilidad | RF |
|---|---|---|---|
| `ejemplo1/logica.js` | **Modificar** | Añadir las funciones **puras** del objetivo y mover aquí `calcularMinutosSemana` (hoy vive en `app.js`, que no se puede importar en Node). Sin DOM ni `localStorage`. Se comparte entre navegador y tests. | RF-1, RF-3, RF-4, RF-5 |
| `ejemplo1/tests/logica.test.js` | **Modificar** | Tests nativos de Node (`node --test`) de las funciones nuevas. Los tests de la 001 se quedan **intactos** (no se tocan ni se reescriben). | RF-1, RF-3, RF-4, RF-5 |
| `ejemplo1/index.html` | **Modificar** | Añadir el panel del objetivo (título, invitación, cifras, porcentaje, marca de cumplida, barra, nota, formulario con su etiqueta, hueco de error). No cambia el orden de los scripts ni el resto de la página. | RF-2, RF-3, RF-5, RF-6 |
| `ejemplo1/styles.css` | **Modificar** | Estilos del bloque del objetivo: cifras, porcentaje, barra (relleno y carril), estado "cumplida", mensaje de error, hueco reservado y responsive a 420 px. | RF-3, RF-6 |
| `ejemplo1/app.js` | **Modificar** | Quitar `calcularMinutosSemana` (ahora en `logica.js`) y **llamarla con `new Date()`**; añadir `leerObjetivo`, `guardarObjetivo`, `quitarObjetivo`, `pintarObjetivo` y los escuchas de eventos. Todo lo demás igual. | RF-1, RF-2, RF-3, RF-5, RF-6 |

> **No se toca** `ejemplo1/mapa.js`, `calcularRacha`, `calcularMejorRacha`,
> `calcularDiasEstudiadosMes`, `formatearFecha`, `crearElementoSesion`,
> `pintarCadena` ni la clave `diarioEstudio.sesiones`.

### 1.1 Clave propia en `localStorage`

| Clave | Contenido | Nota |
|---|---|---|
| `diarioEstudio.sesiones` | JSON de las sesiones | **No se modifica** (RF-2) |
| `diarioEstudio.objetivo` | **Texto plano** con el entero, p. ej. `"300"` | Clave nueva y propia |

Se guarda `String(valor)`, nunca un objeto: así el dato guardado se puede
reproducir y corromper a mano desde DevTools (RF-1).

## 2. Funciones puras (con `hoy` como parámetro)

Regla de oro (constitución, principio 3): **ninguna lee la fecha del reloj por su
cuenta**; el día llega siempre como parámetro, igual que en
`construirMapa(sesiones, hoy, semanas)`. Las que dependen de una fecha
(avance, total semanal y el agregador) reciben `hoy`; las que no dependen de
ninguna fecha (porcentaje, validación y formato) **no lo necesitan** y no lo
reciben: poner un parámetro que luego se ignora solo confunde. Ver la
**pregunta 1** al final del plan.

### 2.1 Las cuatro que pide la spec

| Función | Firma exacta | Qué hace | RF |
|---|---|---|---|
| `normalizarObjetivo(texto)` | `("string") -> { valor: number\|null, motivo: string\|null }` | Convierte lo escrito en el entero equivalente o explica por qué lo rechaza. `motivo` es `"vacio"`, `"noNumero"`, `"noPositivo"`, `"decimales"` o `null`. | RF-1 |
| `calcularMinutosAvance(sesiones, hoy)` | `({fecha, minutos}[], Date) -> number` | Minutos de la semana actual (lunes a domingo) **ignorando las fechas futuras**. Son los minutos que usa el objetivo. | RF-3, RF-4 |
| `calcularPorcentajeObjetivo(minutosAvance, objetivo)` | `(number, number) -> { texto: string, ancho: number }` | Progreso en las dos formas en que se usa: `texto` es lo que se lee en pantalla (`"15,7 %"`, un decimal y coma, empate al alza, topado en 100 %) y `ancho` es el porcentaje entero redondeado (0..100) para la barra. | RF-3 |
| `calcularMinutosSemana(sesiones, hoy)` | `({fecha, minutos}[], Date) -> number` | Total de la semana actual **incluyendo las fechas futuras**. Es la función que ya existía en `app.js:230-257`, movida tal cual y con `hoy` como parámetro. | RF-4 |

### 2.2 Dos auxiliares puros que hacen falta de verdad

| Función | Firma exacta | Qué hace | RF |
|---|---|---|---|
| `formatearMinutos(numero)` | `(number) -> string` | Escribe un número en convención española: `45000` → `"45.000"`, `30.5` → `"30,5"`. Es lo que produce `"45.000 de 100.000 min"`. | RF-3 |
| `calcularAvanceObjetivo(sesiones, objetivoGuardado, hoy)` | `({fecha, minutos}[], string\|null, Date) -> objeto` | **Agregador**: normaliza el objetivo guardado, calcula avance, total semanal, porcentaje y si la meta está cumplida, y devuelve todo junto. Es el único punto de entrada del bloque de objetivo y **recibe `hoy`**. | RF-2, RF-3, RF-5 |

Objeto que devuelve `calcularAvanceObjetivo`:

```
{
  hayObjetivo: boolean,      // ¿hay una meta válida fijada?
  objetivo: number|null,     // entero ya normalizado (300) o null
  minutosAvance: number,     // minutos de la semana SIN fechas futuras
  minutosSemana: number,     // minutos de la semana CON fechas futuras
  porcentaje: string|null,   // "15,7 %" o null si no hay objetivo
  ancho: number,             // 0..100 para la barra (0 si no hay objetivo)
  cumplida: boolean,         // minutosAvance >= objetivo
  hayFuturo: boolean,        // minutosAvance != minutosSemana
}
```

### 2.3 Helper de fechas

| Función | Firma exacta | Qué hace |
|---|---|---|
| `rangoSemana(hoy)` | `(Date) -> { lunesISO: "AAAA-MM-DD", domingoISO: "AAAA-MM-DD" }` | Reutiliza `sumarDias` y `obtenerFechaLocalISO` para dar los dos límites de la semana natural. Lo usan las dos funciones de minutos, así los límites se calculan **igual** en los dos sitios. |

Todos los cálculos de semana comparan el texto completo `"AAAA-MM-DD"` (que se
ordena como el calendario) y **nunca** un prefijo `"AAAA-MM"`, ni UTC, ni
milisegundos (`AGENTS.md`, skill `local-dates`, RF-4). `rangoSemana` es el
único sitio que calcula el lunes y el domingo, con el mismo reparto que ya usa
el mapa de calor, así los dos totales de la semana no pueden discrepar.

`logica.js` además debe **exportar las siete funciones nuevas** en su bloque
`module.exports` (final del archivo) para que los tests puedan importarlas.

## 3. Dónde va el bloque del objetivo

**Decisión: un `<section class="panel panel-objetivo">` nuevo, justo después de
la portada y antes del mapa de calor.**

Por qué:

1. El marcador "Esta semana" vive en la portada, arriba. El objetivo va debajo:
   los dos números que la nota explica quedan **uno encima del otro**, en la
   misma pantalla y a la vista, así que "arriba" y "aquí" son literalmente
   ciertos.
2. El objetivo es un dato de **esta semana** (presente) y el mapa es un
   histórico (pasado): el orden de lectura presente → pasado se respeta.
3. Si el bloque se metiera **dentro** de la portada, el héroe crecería, competiría
   con la racha (que es su protagonista) y metería un formulario con mensaje de
   error dentro del bloque protagonista; es justo lo que RF-6 pide evitar.
4. Si fuera **después** del mapa, la comparación con "Esta semana" quedaría
   separada por un bloque entero y la nota tendría que decir "más arriba".

Orden final de la página: portada → **objetivo** → mapa de calor → nueva
sesión → mis sesiones.

## 4. Textos exactos de la interfaz

Están decididos aquí porque la spec los delegaba en el plan. Todos en español.

| Cuándo | Texto | Dónde |
|---|---|---|
| Título del panel | `Objetivo semanal` | `<h2>` |
| **Invitación** (no hay objetivo) | `Todavía no tienes un objetivo. Escribe cuántos minutos quieres estudiar cada semana y verás tu avance.` | `<p id="objetivo-invitacion">` |
| Cifras (con objetivo) | `45.000 de 100.000 min` → `{avance} de {objetivo} min`, con puntos de miles | `<p id="objetivo-cifras">` |
| Porcentaje (con objetivo) | `15,7 %` | `<p id="objetivo-porcentaje">` |
| **Cumplida** (minutos ≥ objetivo) | `¡Meta cumplida!` | `<p id="objetivo-cumplida">` |
| **Nota** (los dos números difieren) | `El avance ignora las sesiones con fecha futura y «Esta semana» las cuenta: aquí 45 min, arriba 90 min.` (los dos números van formateados con `formatearMinutos`) | `<p id="objetivo-nota">` |
| Etiqueta del campo | `Objetivo semanal (minutos por semana)` | `<label for="objetivo-minutos">` |
| Botón | `Guardar objetivo` | `submit` |
| Botón (solo con objetivo guardado) | `Quitar objetivo` | `type="button"` |
| Error: `vacio` | `Escribe los minutos de tu objetivo semanal.` | `role="alert"` |
| Error: `noNumero` | `Eso no es un número. Escribe solo cifras.` | `role="alert"` |
| Error: `noPositivo` | `El objetivo tiene que ser más de 0 minutos.` | `role="alert"` |
| Error: `decimales` | `Los minutos van en enteros, sin decimales.` | `role="alert"` |

Notas de redacción:

- **"cumplida"**: se escribe exactamente `¡Meta cumplida!`, como propone la
  spec. **No** se añade "te faltan X minutos" cuando no se cumple: está
  prohibido en "Fuera de alcance" (avisos).
- **Nota de la diferencia**: lleva los dos números, no solo la explicación, para
  que se entienda cuánto difieren. Sale **solo si hay objetivo y hay sesiones
  futuras**; sin objetivo no se muestra avance, así que no hay nada que comparar
  (ver pregunta 2).
- Los cuatro mensajes de error son **cuatro textos distintos** (RF-6): se
  distinguen "no hay nada escrito", "no es un número", "tiene que ser más de 0"
  y "no se admiten decimales". Viven en `app.js` (`MENSAJES_ERROR`), no en
  `logica.js`: son texto de interfaz, no cálculo.

### 4.1 Cómo se muestra el avance: **porcentaje en texto + barra**

- El **texto es lo obligatorio**: las cifras (`45.000 de 100.000 min`) y el
  porcentaje (`15,7 %`) son `<p>` con contenido real, se leen sin color y sin
  barra, y se ven a 375 px (RF-3, RF-6).
- La **barra es un refuerzo visual**: un carril con un relleno cuyo ancho es el
  porcentaje. Va marcada `aria-hidden="true"` porque su información ya está
  **entera** en el texto de al lado; así un lector de pantalla no lee el número
  dos veces y el avance "se puede leer aunque la barra no se vea" (RF-6).
- **Colores** (solo variables que ya existen en `styles.css`):
  - Relleno sin cumplir: `var(--tinta)` (la tinta del cuaderno).
  - Relleno con la meta cumplida: `var(--nivel-3)` (el verde del mapa de calor).
  - Carril: `var(--nivel-0)` con borde `var(--linea)`, como los huecos de la
    "cadena".
  - Porcentaje y cifras: Georgia (serif) y `font-variant-numeric:
    tabular-nums`, igual que `.marcador dd`.
  - `¡Meta cumplida!`: fondo `--resaltador` con `var(--tinta)`, el mismo recurso
    que usa el número de la portada. El resaltador es el único color fuerte del
    proyecto y es el que ya marca "lo importante".
- **Colores que NO se usan**: `--rojo-margen` (es del margen del cuaderno, uso
  mínimo) y `--nivel-4` (verde casi negro, ilegible sobre papel para un texto).

### 4.2 Cómo se muestra el mensaje de error

- Va en **flujo normal**, dentro del mismo `.campo` del input y justo debajo de
  él: nunca `position: absolute`, así que **no puede tapar nada** (RF-6).
- Se **crea y se elimina** con `document.createElement` / `.remove()`: cuando ya
  no hay error **no existe el nodo** (`document.getElementById("objetivo-error")`
  devuelve `null`), no está escondido con `display: none` (RF-6).
- Al crearlo se pone `role="alert"` y se añade `aria-describedby="objetivo-error"`
  al input; al eliminarlo se **quita también** `aria-describedby` para no dejar
  una referencia a un id que ya no existe (así el lector de pantalla anuncia el
  error al leer el campo).
- Para que la página **no salte de alto** al aparecer el mensaje, hay un hueco
  reservado: un `<p class="objetivo-ayuda" id="objetivo-ayuda">` que está
  siempre en el HTML, con `min-height` suficiente para dos líneas cortas y
  **vacío**. El mensaje se **inserta dentro** de ese hueco. El hueco es un
  elemento distinto del mensaje y no lleva texto, así que el requisito de
  "quitar el nodo del mensaje" se cumple igual.

## 5. Algoritmos (pseudocódigo)

### 5.1 `normalizarObjetivo(texto)` — la lista cerrada de RF-1

```
FUNCIÓN normalizarObjetivo(texto):
    # 1) Solo admitimos texto escrito por la persona.
    SI typeof texto != "string":
        DEVOLVER { valor: null, motivo: "noNumero" }

    # 2) Los espacios de fuera no cuentan (" 300 " vale 300).
    limpio = texto.trim()

    # 3) Vacío o solo espacios.
    SI limpio == "":
        DEVOLVER { valor: null, motivo: "vacio" }

    # 4) Un punto o una coma SIEMPRE es decimal, aunque el número valga
    #    entero ("300.0" = 300, pero el campo es de minutos enteros).
    SI limpio contiene "." o ",":
        DEVOLVER { valor: null, motivo: "decimales" }

    # 5) Forma del número: signo opcional, cifras y exponente opcional.
    #    Esta regla también descarta "0x10" (lleva una "x": es hexadecimal,
    #    no decimal) y "abc". NO acepta punto ni coma (ya filtrados).
    SI limpio NO cumple  /^[+-]?\d+([eE][+-]?\d+)?$/:
        DEVOLVER { valor: null, motivo: "noNumero" }

    # 6) Convertimos. "0300" -> 300, "+300" -> 300, "3e2" -> 300, "1e3" -> 1000.
    numero = Number(limpio)

    # 7) Sin Infinity ni valores desbordados: "1e999" es no finito.
    SI Number.isFinite(numero) es falso:
        DEVOLVER { valor: null, motivo: "noNumero" }

    # 8) Cinturón de seguridad: si no es entero, es decimal.
    SI Number.isInteger(numero) es falso:
        DEVOLVER { valor: null, motivo: "decimales" }

    # 9) Tiene que ser más de 0 ("0" y "-5" caen aquí).
    SI numero <= 0:
        DEVOLVER { valor: null, motivo: "noPositivo" }

    # 10) No hay máximo: 100000, 999999... se aceptan tal cual.
    DEVOLVER { valor: numero, motivo: null }
```

Consecuencia derivada y esperada de los pasos 4 y 5: `"1e-2"` se rechaza
como `"decimales"` (pasa la forma, vale 0,01, no es entero) y `"300 min"` se
rechaza como `"noNumero"`. Ninguno de los dos está en la lista cerrada, así que
no hay conflicto con la spec.

### 5.2 `calcularPorcentajeObjetivo(minutosAvance, objetivo)` — empate al alza

```
FUNCIÓN calcularPorcentajeObjetivo(minutosAvance, objetivo):
    # Si no hay objetivo (o no vale), no hay progreso: 0,0 %.
    SI objetivo no es un número mayor que 0:
        DEVOLVER { texto: "0,0 %", ancho: 0 }

    # Trabajamos en DÉCIMAS (una unidad = 0,1 %) para no depender de que
    # toFixed redondee de una manera u otra.
    #   45/300  -> 45000/300  = 150,0   -> 150 -> "15,0 %"
    #   47/300  -> 47000/300  = 156,66… -> 157 -> "15,7 %"
    #   49/400  -> 49000/400  = 122,5   -> 123 -> "12,3 %"  (empate: sube)
    #   0/300   -> 0          -> 0     -> "0,0 %"
    #   500/300 -> 500000/300 = 1666,66 -> 1667 -> topado a 1000 -> "100,0 %"
    decimas = Math.floor((minutosAvance * 1000) / objetivo + 0.5)

    # Nunca por encima de 100 %.
    decimas = Math.min(decimas, 1000)

    # Un decimal con coma española (la coma va pegada, como en "15,7 %").
    texto = Math.floor(decimas / 10) + "," + (decimas % 10) + " %"

    # Para la barra: el mismo número redondeado al entero más cercano.
    DEVOLVER { texto: texto, ancho: Math.round(decimas / 10) }
```

Por qué se suman `+ 0.5` y se corta con `Math.floor` en vez de usar `toFixed`:
`toFixed` redondea a la mitad hacia arriba en la mayoría de navegadores pero
depende de la representación binaria del número (12,25 % puede dar "12,2 %" o
"12,3 %"). Con enteros de décimas el resultado es siempre el mismo, y el test
`49/400 → "12,3 %"` lo deja demostrado.

### 5.3 `calcularMinutosSemana` (movida) y `calcularMinutosAvance` (nueva)

```
FUNCIÓN rangoSemana(hoy):
    # getDay(): 0=domingo … 6=sábado. Con esta fórmula el lunes es 0.
    diasDesdeLunes = (hoy.getDay() + 6) % 7
    lunes = sumarDias(hoy, -diasDesdeLunes)
    domingo = sumarDias(lunes, 6)
    DEVOLVER { lunesISO: obtenerFechaLocalISO(lunes),
               domingoISO: obtenerFechaLocalISO(domingo) }


FUNCIÓN calcularMinutosSemana(sesiones, hoy):        # EXISTENTE, MOVIDA DE app.js
    { lunesISO, domingoISO } = rangoSemana(hoy)

    total = 0
    PARA cada sesion de sesiones:
        SI lunesISO <= sesion.fecha Y sesion.fecha <= domingoISO:
            total += sesion.minutos          # sin cambios: hoy ya sumaba así

    DEVOLVER total        # OJO: aquí NO se miran las fechas futuras


FUNCIÓN calcularMinutosAvance(sesiones, hoy):        # NUEVA
    { lunesISO, domingoISO } = rangoSemana(hoy)
    hoyISO = obtenerFechaLocalISO(hoy)

    total = 0
    PARA cada sesion de sesiones:
        SI lunesISO <= sesion.fecha Y sesion.fecha <= domingoISO
           Y sesion.fecha <= hoyISO:            # <-- lo único que cambia
            total += Number(sesion.minutos)     # Number por si viene guardado como texto

    DEVOLVER total
```

Las dos dan **exactamente el mismo resultado** cuando no hay sesiones con
fecha futura. La única diferencia entre ellas es la comparación con `hoyISO`.

### 5.4 `calcularAvanceObjetivo` (agregador)

```
FUNCIÓN calcularAvanceObjetivo(sesiones, objetivoGuardado, hoy):
    # 1) ¿Hay una meta válida? (el texto guardado se normaliza aquí)
    { valor: objetivo, motivo } = normalizarObjetivo(objetivoGuardado)
    hayObjetivo = (objetivo != null)

    # 2) Los dos totales de la semana, con el MISMO "hoy" para que no
    #    puedan discrepar por caer en dos momentos distintos.
    minutosAvance = calcularMinutosAvance(sesiones, hoy)
    minutosSemana = calcularMinutosSemana(sesiones, hoy)

    # 3) Sin meta no hay porcentaje ni avance: se devuelve null.
    SI hayObjetivo es falso:
        DEVOLVER { hayObjetivo: false, objetivo: null,
                   minutosAvance, minutosSemana,
                   porcentaje: null, ancho: 0,
                   cumplida: false, hayFuturo: false }

    # 4) Progreso y estado de "cumplida" (igual o mayor cuenta).
    { texto: porcentaje, ancho } = calcularPorcentajeObjetivo(minutosAvance, objetivo)
    cumplida = (minutosAvance >= objetivo)

    # 5) Los dos números difieren cuando hay sesiones con fecha futura.
    hayFuturo = (minutosAvance != minutosSemana)

    DEVOLVER { hayObjetivo: true, objetivo, minutosAvance, minutosSemana,
               porcentaje, ancho, cumplida, hayFuturo }
```

`minutosAvance`, `porcentaje` y `cumplida` salen todos de **los mismos
minutos**, así que el avance y su porcentaje nunca se contradicen (RF-3).

## 6. Cómo se pinta en la interfaz (flujo)

`app.js` queda así (solo se muestran las partes nuevas o tocadas):

```
CONSTANTE: CLAVE_OBJETIVO = "diarioEstudio.objetivo"


leerObjetivo() -> number | null            # Devuelve el entero ya normalizado
    texto = localStorage.getItem(CLAVE_OBJETIVO)
    SI texto es null o es solo espacios:
        DEVOLVER null                      # Nunca se fijó: NO es dato corrupto
    { valor, motivo } = normalizarObjetivo(texto)
    SI valor es null:
        console.warn("El objetivo guardado no es válido: se trata como sin objetivo.")
        DEVOLVER null                      # corrupto, pero la web sigue
    DEVOLVER valor


guardarObjetivo(valorEntero):
    localStorage.setItem(CLAVE_OBJETIVO, String(valorEntero))    # texto plano


quitarObjetivo():
    localStorage.removeItem(CLAVE_OBJETIVO)


pintarObjetivo(sesiones, hoy):
    estado = calcularAvanceObjetivo(sesiones, leerObjetivo(), hoy)

    # El botón de quitar solo tiene sentido si hay algo que quitar.
    SI estado.hayObjetivo:
        quitar la clase "oculto" de "Quitar objetivo"
    SI NO:
        poner la clase "oculto" en "Quitar objetivo"

    SI estado.hayObjetivo es falso:
        quitar la clase "oculto" de la invitación   # esa clase ya existe
        devolver                         # <- ¡sin porcentaje, sin barra, sin "0 / 0"!
    SI NO:
        ocultar invitación
        cifras.textContent     = formatearMinutos(estado.minutosAvance) + " de "
                               + formatearMinutos(estado.objetivo) + " min"
        porcentaje.textContent = estado.porcentaje
        barra-relleno.style.width = estado.ancho + "%"     # aria-hidden: solo decora
        marcar/ocultar "¡Meta cumplida!"
        SI estado.hayFuturo:
            nota.textContent = "El avance ignora las sesiones con fecha futura
                                y «Esta semana» las cuenta: aquí X min, arriba Y min."
        SI NO:
            nota.textContent = ""


alEnviarObjetivo(evento):
    evento.preventDefault()
    { valor, motivo } = normalizarObjetivo(campoObjetivo.value)
    SI valor es null:
        mostrar error con MENSAJES_ERROR[motivo]     # crea el nodo + aria-describedby
        devolver                                      # NO guarda nada, no toca el objetivo anterior
    guardarObjetivo(valor)
    quitar el nodo del error (+ quitar aria-describedby)
    renderizar(cargarSesiones())          # repinta con el entero normalizado


alQuitarObjetivo():
    quitarObjetivo()
    quitar el nodo del error
    renderizar(cargarSesiones())


renderizar(sesiones):                     # punto ÚNICO de refresco (ya existía)
    hoy = new Date()                       # el único lugar que mira el reloj para el objetivo
    …
    minutos-semana.textContent = calcularMinutosSemana(sesiones, hoy)   # misma llamada, mismo resultado
    pintarObjetivo(sesiones, hoy)          # NUEVO
    pintarCadena(sesiones)
    pintarMapa(sesiones)                   # sin cambios


iniciar():
    …
    formularioObjetivo.addEventListener("submit", alEnviarObjetivo)
    botonQuitarObjetivo.addEventListener("click", alQuitarObjetivo)
    renderizar(cargarSesiones())
```

Quién llama a qué y por qué **la pantalla no cambia** en "Esta semana":

- `calcularMinutosSemana` **sale** de `app.js` (donde usaba `new Date()` por su
  cuenta) y **entra** en `logica.js` **con el mismo cuerpo**: cambia solo la
  primera línea (`hoy = new Date()` → `hoy` recibido como parámetro). Ni una
  línea más.
- La sigue usando el mismo sitio, `renderizar`, y ahora con `new Date()` como
  argumento explícito. Sigue **sin mirar las fechas futuras**, igual que antes.
  Por eso el número de la portada no se mueve: es la misma función con el
  mismo resultado, y `MEMORY.md` ya avisa de que esos cálculos (`racha`, mejor
  racha, días del mes) no se pueden testear en Node porque viven en `app.js`.
- El avance del objetivo es una función **nueva y aparte**
  (`calcularMinutosAvance`), que sí mira `hoyISO`. No se toca ni se reescribe el
  cálculo existente.
- `renderizar()` ya se llama al cargar y después de registrar una sesión, y
  ahora también después de guardar o quitar el objetivo. Con eso se cumple el
  "recálculo al cargar y en cada interacción" **sin un solo temporizador**
  (RF-4).

El mensaje de error lo lleva **solo** el manejador del formulario de objetivo
(nunca `pintarObjetivo`), para que registrar una sesión no borre un error que
la persona todavía no ha corregido y quitar el objetivo sí lo borre.

### 6.1 Estructura del panel en `index.html`

```html
<section class="panel panel-objetivo" aria-labelledby="objetivo-titulo">
  <h2 id="objetivo-titulo">Objetivo semanal</h2>

  <!-- Sin objetivo: solo la invitación (RF-2). -->
  <p id="objetivo-invitacion">Todavía no tienes un objetivo. Escribe cuántos
     minutos quieres estudiar cada semana y verás tu avance.</p>

  <!-- Con objetivo: cifras, porcentaje, cumplida, barra y nota. -->
  <p class="objetivo-cifras" id="objetivo-cifras"></p>
  <p class="objetivo-porcentaje" id="objetivo-porcentaje"></p>
  <p class="objetivo-cumplida oculto" id="objetivo-cumplida">¡Meta cumplida!</p>

  <!-- Barra decorativa: el equivalente accesible es el texto de arriba. -->
  <div class="objetivo-barra" id="objetivo-barra" aria-hidden="true">
    <div class="objetivo-relleno" id="objetivo-relleno"></div>
  </div>

  <p class="objetivo-nota oculto" id="objetivo-nota"></p>

  <form id="formulario-objetivo">
    <div class="campo">
      <label for="objetivo-minutos">Objetivo semanal (minutos por semana)</label>
      <!-- type="text" a propósito: con type="number" el navegador se
           tragaría "abc" y .value saldría vacío, y no podríamos
           distinguir "no hay nada escrito" de "no es un número" (RF-6). -->
      <input type="text" id="objetivo-minutos" inputmode="numeric"
             autocomplete="off" placeholder="Ej: 300" />
      <!-- Hueco reservado: el mensaje de error se inserta aquí dentro. -->
      <p class="objetivo-ayuda" id="objetivo-ayuda"></p>
    </div>
    <div class="objetivo-botones">
      <button type="submit" class="boton">Guardar objetivo</button>
      <button type="button" class="boton boton-suave oculto" id="boton-quitar-objetivo">
        Quitar objetivo
      </button>
    </div>
  </form>
</section>
```

`inputmode="numeric"` pone el teclado numérico en el móvil sin que el
navegador pueda corregir por su cuenta lo que se escribe.

## 7. Decisiones técnicas (con alternativa descartada)

| Decisión | Por qué | Alternativa descartada |
|---|---|---|
| Avance con **porcentaje en texto + barra decorativa** (`aria-hidden`) | El texto es lo que exige RF-3/RF-6 y se lee sin color; la barra solo da la sensación visual de avance, y con `aria-hidden` no se lee dos veces | Solo barra (descartada: el avance no podría leerse sin ver el color) · Solo texto (descartada: la barra motiva sin quitar accesibilidad) |
| Barra con `aria-hidden` y texto equivalente al lado | Cumple "el avance se puede leer aunque la barra no se vea" sin duplicar la lectura | `role="progressbar"` con `aria-valuenow` (descartada: obliga a calcular y mantener un segundo número del progreso; el texto visible ya es el equivalente accesible) |
| Bloque del objetivo **entre la portada y el mapa** | "Esta semana" queda justo arriba: la nota puede decir "aquí… arriba…" y es verdad | Dentro de la portada (descartada: el héroe crece y compite con la racha, que es su protagonista) · Después del mapa (descartada: separa los dos números que hay que comparar) |
| `calcularPorcentajeObjetivo` devuelve `{ texto, ancho }` | El mismo número se usa en dos formatos: lo que se lee y el ancho de la barra | Devolver solo texto y parsear el ancho con `parseFloat` (descartada: frágil y feo) · Devolver solo el número (descartada: el texto con coma es lo que pide RF-3 y hay que testearlo) |
| Redondeo con **décimas enteras** (`+ 0.5` y `Math.floor`) y `Math.min(…, 1000)` | El empate 49/400 = 12,25 % sube siempre a "12,3 %" y el resultado no depende del motor | `toFixed(1)` (descartada: depende de la representación binaria y en algunos navegadores redondea el empate hacia abajo) · `Intl.NumberFormat` con 1 decimal (descartada: CLDR no garantiza "media hacia arriba" en todos los navegadores) |
| `type="text"` + `inputmode="numeric"` en el campo del objetivo | Con `type="number"` el navegador descarta "abc" y `.value` sale vacío: se perdería la diferencia entre "no hay nada escrito" y "no es un número" (RF-6) | `type="number"` (descartada: come uno de los cuatro motivos de error y añade los botones de subir/bajar) |
| Mensaje de error **creado y eliminado del DOM**, en flujo normal, en un hueco con `min-height` | Cumple "desaparece quitando su nodo", no se superpone a nada y la página no salta de alto | `display: none` sobre un `<p>` fijo (descartada: la spec lo prohíbe explícitamente) · `position: absolute` flotante (descartada: puede tapar la sección siguiente) · `alert()` como hace hoy el formulario de sesiones (descartada: no es texto visible en la página ni se asocia a su campo) |
| Clave nueva `diarioEstudio.objetivo` con **texto plano** | No se toca el formato de las sesiones y el dato se puede corromper a mano para probar | Meter el objetivo dentro de `diarioEstudio.sesiones` (descartada: la spec lo prohíbe) · Guardar JSON `{objetivo: 300}` (descartada: la spec pide texto plano para poder reproducir el caso corrupto) |
| `calcularMinutosSemana` **se mueve** a `logica.js` y `app.js` la llama con `new Date()` | La spec y el principio 3 exigen que el cálculo sea lógica pura con `hoy`; el resultado es idéntico porque el cuerpo no cambia | Dejarla en `app.js` (descartada: no se puede importar en Node, `app.js:28` usa el DOM en el nivel superior, así que no habría test posible) · Copiarla y dejar la original (descartada: dos copias del mismo cálculo divergen) |
| Recálculo **dentro de `renderizar()`** | `renderizar()` ya se llama al cargar y tras cada interacción: cero temporizadores y un solo sitio al que tocar | `setInterval` (descartada: la spec lo prohíbe) · Recalcular en cada manejador por separado (descartada: se olvida alguno y hay dos caminos) |
| Todo el JS del objetivo en **`app.js`**, sin archivo nuevo | Menos archivos nuevos que aprobar (`AGENTS.md:54`), sin añadir otro `<script>` en el HTML y el bloque de la interfaz junto al formulario y al `localStorage` que ya gestiona `app.js` | `ejemplo1/objetivo.js` como hizo la 001 con el mapa (descartada: `mapa.js` se separó porque pinta 112 celdas con su propio tooltip; aquí son ~120 líneas de lectura/escritura y pintado de un bloque, y el objetivo vive en el mismo `localStorage` que ya gestiona `app.js`) |
| Formato de números con `Intl.NumberFormat("es-ES", { useGrouping: "always" })` | Es una herramienta **nativa** (no es dependencia), y `app.js` ya usa `Intl.DateTimeFormat("es-ES")`. `useGrouping: "always"` agrupa siempre los miles | Regex de agrupación a mano (descartada: no maneja bien "30,5" y es más código de leer) · `toLocaleString` suelto en `app.js` (descartada: el formato debe ser lógica pura para poder testearlo) |
| La nota de la diferencia **solo con objetivo fijado** | Sin objetivo el bloque no muestra avance, así que no hay dos números que comparar ni nada que explicar (RF-2) | Mostrarla siempre (descartada: hablaría de un "avance" que no se ve). Ver pregunta 2 |

## 8. Estrategia de tests (`node --test`)

- **Archivo:** `ejemplo1/tests/logica.test.js` (**se amplía**; los tests de la
  001 no se tocan y deben seguir en verde).
- **Comando:** `node --test ejemplo1/tests/logica.test.js` — **siempre la ruta
  del archivo**, nunca el directorio (Node 24 lo trata como módulo;
  `MEMORY.md:49-50`).
- **Importar** en el test: `normalizarObjetivo`, `calcularPorcentajeObjetivo`,
  `calcularMinutosAvance`, `calcularMinutosSemana`, `formatearMinutos`,
  `calcularAvanceObjetivo`, `rangoSemana`.

### RF-1 — `normalizarObjetivo` (los 15 casos de la lista cerrada)

| Entrada | `valor` | `motivo` |
|---|---|---|
| `"300"` | `300` | `null` |
| `"0300"` | `300` | `null` |
| `"+300"` | `300` | `null` |
| `" 300 "` | `300` | `null` |
| `"3e2"` | `300` | `null` |
| `"1e3"` | `1000` | `null` |
| `""` | `null` | `"vacio"` |
| `"   "` | `null` | `"vacio"` |
| `"abc"` | `null` | `"noNumero"` |
| `"0"` | `null` | `"noPositivo"` |
| `"-5"` | `null` | `"noPositivo"` |
| `"300.5"` | `null` | `"decimales"` |
| `"300,5"` | `null` | `"decimales"` |
| `"300.0"` | `null` | `"decimales"` |
| `"Infinity"` | `null` | `"noNumero"` |
| `"0x10"` | `null` | `"noNumero"` |

Extras: **normalización** (`"0300"` → `300`, criterio de finalización), tipos
que no son texto (`normalizarObjetivo(300)`, `normalizarObjetivo(null)`,
`normalizarObjetivo(undefined)` → `noNumero`), no finito escrito
(`"1e999"` → `noNumero`) y **sin máximo** (`"999999"` → `999999`,
`"100000"` → `100000`).

### RF-3 — `calcularPorcentajeObjetivo` (valores exactos de la spec)

| `minutosAvance` | `objetivo` | `.texto` | `.ancho` |
|---|---|---|---|
| 45 | 300 | `"15,0 %"` | 15 |
| 47 | 300 | `"15,7 %"` | 16 |
| 49 | 400 | `"12,3 %"` | 12 |
| 0 | 300 | `"0,0 %"` | 0 |
| 500 | 300 | `"100,0 %"` | 100 |

Extras: 200/200 → `"100,0 %"`; objetivo `0` o `null` → `"0,0 %"` (no se divide
entre cero).

### RF-3 — `formatearMinutos` (punto de miles y decimales)

`45000` → `"45.000"`, `100000` → `"100.000"`, `300` → `"300"`, `30.5` →
`"30,5"`, `0` → `"0"`, y el **ejemplo literal de la spec**:
`formatearMinutos(45000) + " de " + formatearMinutos(100000) + " min"` →
`"45.000 de 100.000 min"`.

Sobre los números de **cuatro cifras** (`1000`): con
`useGrouping: "always"` sale `"1.000"`, y en un motor que no agrupe cuatro
cifras saldría `"1000"`. Las dos formas son correctas en español y la spec solo
exige el punto de miles en `45.000` y `100.000`, así que **ese caso no se
testea**: lo que sí se testea son los valores que la spec fija.

### RF-4 — `calcularMinutosSemana` (el marcador "Esta semana", sin cambios)

- `hoy = 2026-10-05` (lunes): sesión del `"2026-10-11"` (domingo **futuro**)
  **sí** cuenta → 45. *(Documenta en el propio test que el futuro se sigue
  sumando: es lo que la spec exige.)*
- `hoy = 2026-10-05`: sesión del `"2026-10-04"` (domingo anterior) no cuenta → 0.
- **Cruce de mes**: `hoy = new Date(2026, 9, 28)` (mié 28 oct 2026) → semana
  lunes 26 oct a domingo 1 nov: 26 oct 45 + 1 nov 30 = **75**; 25 oct 60 (semana
  anterior) fuera.
- **Cruce de año**: `hoy = new Date(2026, 11, 28)` (lun 28 dic 2026) → semana
  28 dic 2026 a 3 ene 2027: `"2026-12-28"` 45 + `"2027-01-03"` 30 = **75**;
  `"2026-12-27"` 60 y `"2027-01-04"` 20 fuera.
- **Medianoche**: `hoy = new Date(2026, 9, 5, 0, 30)` (lunes 00:30) con sesión
  del `"2026-10-04"` → 0 (la semana que manda es la del lunes, aunque la sesión
  sea del día anterior).
- **Cambio de hora**: `hoy = new Date(2026, 9, 25, 12, 0)` (domingo 25 oct,
  día del cambio en España) con sesiones del 19, 22 y 25 oct → suma de las tres.
- **Decimales y varios días**: dos sesiones el mismo día suman; `30.5` se suma
  tal cual (`30.5`, sin truncar).

### RF-4 — `calcularMinutosAvance` (lo mismo, pero sin el futuro)

- `hoy = 2026-10-07` (mié), semana 5–11 oct: sesiones 5 oct 45, 7 oct 30,
  9 oct 60 (**futura**), 4 oct 50 (semana anterior) →
  **avance 75** y **`calcularMinutosSemana` = 135**: la diferencia son
  exactamente los 60 minutos futuros.
- Sin fechas futuras: avance y total coinciden.
- Solo con una sesión de la semana anterior: avance **0** (criterio: "registrar
  una sesión de la semana anterior no cambia el avance").
- Mismo cruce de mes y **mismo cruce de año** que arriba (el rango se calcula
  igual).
- La última línea del test del cruce de año demuestra que no se usa el prefijo
  `"AAAA-MM"`: `"2027-01-04"` (4 ene) queda fuera aunque el prefijo de enero
  coincidiría con días de la semana.

### RF-3/RF-5 — `calcularAvanceObjetivo` (el agregado)

- Sin objetivo (`null`): `hayObjetivo false`, `porcentaje null`, `ancho 0`, y
  `minutosAvance` sigue calculado.
- Objetivo guardado corrupto (`"abc"`, `"0"`, `"300.5"`, `"{}"`): `hayObjetivo
  false`, sin excepciones.
- Objetivo `"200"` con avance 200 → `cumplida true` y `porcentaje "100,0 %"`
  (criterio de finalización).
- Objetivo `"0300"` → `objetivo 300` (normalización al leer).
- **Meta fijada a media semana**: `hoy = 2026-10-07` (mié), objetivo `"300"`,
  100 min del lunes + 100 del martes → avance 200, `porcentaje "66,7 %"`.
- **Objetivo menor que lo estudiado**: objetivo `"100"`, avance 200 →
  `cumplida true`, `"100,0 %"`, y `minutosAvance` sigue siendo 200 (nunca se
  recortan los minutos reales).
- **Con futuro**: mismo caso que el avance → `hayFuturo true`.
- **Cambio de semana**: `hoy = new Date(2026, 9, 12)` (jue 12 nov 2026, semana
  del lunes 9 al domingo 15 nov) con objetivo `"300"` → `objetivo 300`
  (conservado) y `minutosAvance 0`.

### RNF — pruebas de que la lógica es pura (recibir `hoy`)

Un test con un `hoy` **muy antiguo** (marzo de 2024) y sesiones de esa semana:
si alguna función leyera el reloj por su cuenta (hoy es 6 oct 2026) devolvería
0 y el test fallaría. Sirve para las dos funciones de minutos y para el
agregador. Se repite con `hoy` un año por delante para la otra mitad.

> Los tests solo importan `logica.js` (puro). La parte visual, el
> `localStorage` y los eventos se verifican aparte con el MCP de Chrome
> DevTools (sección 10).

## 9. Cobertura de RF

| RF | Qué parte del plan lo cubre |
|----|-----------------------------|
| **RF-1** (validar, normalizar, guardar texto plano, mensaje visible, editar, meta a media semana) | Secciones 2.1 (`normalizarObjetivo`), 4 (cuatro mensajes de error), 5.1, 6 (`alEnviarObjetivo`, `guardarObjetivo`), 8 (los 15 casos) |
| **RF-2** (clave propia, recuperar, dato corrupto = sin objetivo, seguir funcionando) | Secciones 1.1, 2.2 (`calcularAvanceObjetivo` normaliza al leer), 6 (`leerObjetivo` con `console.warn` y sin excepciones), 7 (texto plano), 8 |
| **RF-3** (cifras visibles, porcentaje con coma, empate al alza, topado, cumplida, punto de miles, nota de la diferencia, sin objetivo sin porcentaje) | Secciones 2.1–2.2, 4 (textos exactos), 4.1 (barra y colores), 5.2, 5.4, 6, 8 |
| **RF-4** (lunes a domingo en hora local, ignorar el futuro, "Esta semana" igual, cambio de semana, recálculo sin temporizadores, lógica pura) | Secciones 2.1, 2.3, 5.3, 6 (dentro de `renderizar`), 8 (cruces de mes y año, medianoche, cambio de hora) |
| **RF-5** (fijar, editar, quitar, sin tocar sesiones, meta recurrente, cumplimiento inmediato) | Sección 6 (`guardarObjetivo`, `quitarObjetivo`, `alEnviarObjetivo`, `alQuitarObjetivo`; las sesiones no se tocan en ningún camino) |
| **RF-6** (375 px, texto accesible, nombre accesible, error asociado y por causa, sin solape, unidades en español) | Secciones 4.1, 4.2, 6.1 (`label`, `aria-describedby`, `role="alert"`, `aria-hidden` en la barra), 10 |
| **RNF** (pureza con `hoy`, sin dependencias, consola, no regresión) | Secciones 2, 8 (test de `hoy` lejanos), 10 (consola, no regresión) |

## 10. Verificación final

### 10.1 Lógica

```
node --test ejemplo1/tests/logica.test.js
```

Todos en verde, **incluidos los tests de la 001** (no se modifican).

### 10.2 MCP de Chrome DevTools

Abrir `ejemplo1/index.html` (doble clic, sin servidor) y recorrer:

1. **Sin objetivo** (borrando `diarioEstudio.objetivo` desde la consola):
   invitación visible, input vacío, **sin** porcentaje, **sin** barra, **sin**
   "0 / 0", y "Esta semana" con sus minutos de siempre.
2. **Fijar 300**: aparecen "… de 300 min", el porcentaje y la barra; el input
   queda con `300`. Recargar: el objetivo sigue ahí.
3. **Editar**: enviar `0300` → el input vuelve a mostrar `300` y el guardado es
   `"300"`. Enviar `300` seguido de `100` → sustituye, sin tocar ninguna sesión
   (la lista no cambia de largo).
4. **Errores**: probar `abc`, `0`, `300.5` y campo vacío → **cuatro textos
   distintos**, cada uno en su `<p>` con `role="alert"`, visible, con
   `aria-describedby` apuntando al input, **sin tapar** la sección siguiente
   (`getBoundingClientRect()` del mensaje y del panel siguiente no se cruzan) y
   con el alto del panel **igual** antes y después
   (`panel-objetivo.offsetHeight`). Corregir a `300` →
   `document.getElementById("objetivo-error") === null` (nodo eliminado, no
   escondido) y `objetivo-minutos` sin `aria-describedby`.
5. **Cumplida**: objetivo 200 con 200 min → `¡Meta cumplida!` y `100,0 %`.
6. **Meta superada**: objetivo 300 con 500 min → `100,0 %`, `¡Meta cumplida!` y
   las cifras siguen diciendo 500 (nunca 166,7 % ni 300).
7. **Números grandes**: objetivo 100000 y 45000 min → `45.000 de 100.000 min`.
8. **Fechas futuras**: registrar una sesión con fecha mañana → "Esta semana"
   **sube**, el avance **no**, y aparece la nota explicando la diferencia.
   Registrar una sesión de la semana anterior → el avance **no** cambia.
9. **Quitar objetivo**: vuelve la invitación, no hay porcentaje ni barra, las
   sesiones siguen todas en la lista y en `localStorage` con el mismo contenido.
10. **Consola**: con datos válidos, cero errores. Con
    `localStorage.setItem("diarioEstudio.objetivo", "abc")` y recarga → aviso en
    consola en español, invitación y **ninguna excepción**.
11. **No regresión**: racha, mejor racha, días del mes, mapa de calor, lista de
    sesiones y "Esta semana" se ven igual que antes de la 002.
12. **Accesibilidad**: `label` asociado al input; cifras, porcentaje y
    "¡Meta cumplida!" presentes en el texto accesible (no en `title`); la barra
    no aporta nada al lector de pantalla y el texto de al lado sí.

### 10.3 Vista móvil (375 px **emulados**)

- Usar la emulación de viewport del MCP (`emulate`), **no** `resize_page(375)`:
  `resize_page` no baja de unos 500 px y daría capturas falsamente cortadas
  (`MEMORY.md:51-52`).
- **Antes de medir nada, comprobar que el ancho emulado es 375**
  (`window.innerWidth === 375`). Si no lo es, la comprobación no vale.
- `document.documentElement.scrollWidth <= 375`.
- Los controles son **alcanzables**: el rect del input y el del botón están
  dentro del viewport y un toque funciona (`scrollWidth` no detecta lo que está
  tapado por un `overflow: hidden`).
- Objetivo, avance y porcentaje **visibles como texto** a 375 px.

## 11. Puntos que requieren decisión del usuario

1. **Firma de las funciones puras y el parámetro `hoy`.** La spec dice, en los
   requisitos no funcionales y en el criterio "Las cuatro funciones son puras y
   reciben 'hoy'", que **las cuatro** reciben `hoy`; pero el porcentaje y la
   validación/normalización del objetivo no dependen de ninguna fecha (no tienen
   ni un `Date` que mirar). Este plan hace lo sensato: las que necesitan el día
   lo reciben (`calcularMinutosAvance`, `calcularMinutosSemana` y el agregador
   `calcularAvanceObjetivo`) y las otras dos no, de forma que ninguna lee el reloj
   por su cuenta, que es el motivo que da la propia spec. **Si prefieres el
   literal**, `calcularPorcentajeObjetivo(minutosAvance, objetivo, hoy)` y
   `normalizarObjetivo(texto, hoy)` recibirían `hoy` sin usarlo, y habría que
   actualizar la spec antes de implementar.
2. **La nota que explica la diferencia con "Esta semana" sin objetivo fijado.**
   RF-3 pide el texto cuando los dos números difieren; RF-2 dice que sin
   objetivo la pantalla queda exactamente con la invitación y los minutos de la
   semana, y en ese caso **no se muestra ningún avance**, así que no hay dos
   números que comparar. Este plan **solo muestra la nota si hay objetivo
   fijado** y hay sesiones futuras. La alternativa sería mostrarla siempre que
   haya futuro, aunque no haya meta.