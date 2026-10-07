# Especificación 002 — Objetivo semanal de estudio

- **Estado:** implementada y validada
- **Fecha:** 2026-10-06
- **Autor:** planner
- **Aprobada por el usuario:** 2026-10-06

> Solo el QUÉ y el POR QUÉ. Nada de stack, arquitectura ni nombres de archivos.

## Contexto y objetivo
El Diario de Estudio ya guarda las sesiones y muestra los minutos estudiados **de la semana
actual** (lunes a domingo), pero ese número va suelto: no dice si es suficiente ni si falta
mucho. Falta una meta con la que comparar. Objetivo: que la persona pueda **fijar cuántos
minutos quiere estudiar cada semana** y **ver cuánto lleva de esa meta**, para motivarse a
cumplirla.

## Usuarios
- Persona que estudia por su cuenta y necesita un objetivo concreto para motivarse.
- Proyecto educativo: debe poder mantenerlo alguien que empieza a programar.

## Historias de usuario
- Como estudiante, quiero decir cuántos minutos quiero estudiar a la semana para tener una meta.
- Como estudiante, quiero ver cuántos minutos llevo de esa meta para saber si voy bien.
- Como estudiante, quiero enterarme cuando he cumplido la meta, para motivarme.
- Como estudiante, quiero cambiar o quitar la meta cuando mis condiciones cambien, sin perder
  lo que ya he estudiado.
- Como estudiante en el móvil, quiero ver y cambiar la meta sin zoom.

## Requisitos funcionales (RF)

RF-1 — Aceptar solo un objetivo válido.
- El sistema deberá aceptar únicamente un **número entero mayor que 0** como objetivo.
- La **decisión de válido o inválido** no dependerá de la pantalla: el sistema la tomará en
  un cálculo propio, sin acceso a la interfaz, y será **lógica comprobable con `node --test`**
  (ver requisitos no funcionales).
- **Regla general:** el sistema convierte lo escrito en un número y solo lo acepta si ese
  número es un **entero finito mayor que 0**; en cualquier otro caso lo rechaza y no lo
  guarda. Los minutos se cuentan enteros: por eso se rechaza cualquier texto que lleve
  separador decimal, aunque el número valga lo mismo que un entero (por ejemplo, "300.0").
- La lista de formas de entrada es **cerrada**. Estos son los únicos resultados:

  | Texto escrito | ¿Se acepta? | Por qué |
  |---|---|---|
  | `300` | Sí | Entero mayor que 0 |
  | `0300` | Sí | Cero a la izquierda: es el mismo entero (300) |
  | `+300` | Sí | Signo más: es el mismo entero (300) |
  | `" 300 "` (con espacios) | Sí | Los espacios alrededor se ignoran |
  | `3e2` | Sí | Notación científica: es el mismo entero (300) |
  | `1e3` | Sí | Notación científica: es el mismo entero (1000) |
  | `""` (vacío) | No | No hay nada escrito |
  | `"   "` (solo espacios) | No | Equivale a vacío |
  | `abc` | No | No es un número |
  | `0` | No | Los minutos tienen que ser mayores que 0 |
  | `-5` | No | Negativo |
  | `300.5` | No | Contiene punto decimal |
  | `300,5` | No | Contiene coma decimal |
  | `300.0` | No | Contiene punto decimal: aunque valga 300, el campo es de minutos enteros y no se admiten decimales |
  | `Infinity` | No | No es un número finito |
  | `0x10` | No | Es hexadecimal, no decimal: "0x10" se leería como 16, no como lo que la persona escribió |

- **No hay máximo**: el sistema no pone un techo de minutos. Lo único que se rechaza por
  grande que sea son los valores **no finitos** (`Infinity`, `-Infinity`, y lo que no sea
  número).
- El sistema deberá **normalizar** lo escrito al entero equivalente y **guardar y volver a
  mostrar siempre ese entero normalizado**: si la persona escribe "0300", lo que queda
  guardado y lo que reaparece en el control es **300**.
- El objetivo se guardará como **texto plano** (el entero escrito tal cual), no como dato
  estructurado, para que los casos de dato guardado corrupto sean reproducibles a mano.
- Si el valor enviado se rechaza, entonces el sistema deberá mostrar **el motivo en texto
  visible** (no solo un color) y conservar el objetivo que hubiera guardado antes; si no
  había ninguno, la persona seguirá sin objetivo.
- Si la persona corrige el valor y lo reenvía como entero mayor que 0, entonces el sistema
  deberá guardar el objetivo nuevo y **quitar el mensaje de error** de la entrada anterior.
- Donde el control del objetivo ya tenga un valor guardado, el sistema deberá mostrar ese
  valor, para que se pueda editar.
- Si la persona fija el objetivo por primera vez **a media semana**, entonces el sistema
  deberá contar como avance los minutos ya estudiados en esa misma semana (quien fija 300
  el miércoles con 200 min del lunes y martes ya va por 66,7 %).

RF-2 — Conservar y recuperar el objetivo.
- El sistema deberá guardar el objetivo en el navegador del usuario bajo una **clave propia,
  distinta de la de las sesiones**. El formato de las sesiones guardadas **no se modifica**.
- El sistema no deberá guardar el objetivo **dentro** de la clave de las sesiones: es un dato
  añadido al navegador, no un cambio en los datos ya guardados.
- El sistema deberá conservar el objetivo entre recargas y cierres de pestaña.
- Cuando la persona abre la página, el sistema deberá recuperar el objetivo guardado.
- Si **no existe la clave**, está vacía, contiene un texto no numérico, un número 0, un
  número negativo, un número decimal, un objeto o un array, entonces el sistema deberá
  tratarlo como **"sin objetivo fijado"**. En ese caso la pantalla quedará exactamente así:
  - el control del objetivo aparece **vacío**, listo para escribir;
  - se muestra la **invitación a fijar un objetivo**;
  - **no** se muestra porcentaje, ni barra de progreso, ni un "0 / 0";
  - el marcador "Esta semana" sigue mostrando los minutos de la semana como hasta ahora.
- Mientras no exista objetivo, el sistema deberá seguir funcionando con normalidad: las
  sesiones se siguen registrando y el resto de datos no cambian.

RF-3 — Mostrar el avance hacia el objetivo.
- Mientras exista un objetivo fijado, el sistema deberá mostrar, **como texto visible**, los
  minutos estudiados de la semana actual y el objetivo, de forma que se puedan comparar.
- Los minutos que el bloque del objetivo muestra son **los del avance**: los de las sesiones
  de la semana actual **ignorando las fechas futuras** (mismo criterio que en RF-4). No son
  necesariamente los mismos que los del marcador "Esta semana".
- El porcentaje se calcula **sobre esos mismos minutos de avance**, nunca sobre los del
  marcador "Esta semana": el avance y su porcentaje son coherentes entre sí.
- El sistema deberá mostrar la proporción cumplida en porcentaje, con **un solo decimal y
  coma decimal española**.
- El porcentaje se obtiene dividiendo los minutos de avance entre el objetivo y
  multiplicando por 100, y se **redondea al primer decimal al alza en los empates**
  (redondeo "media hacia arriba": si el segundo decimal es exactamente 5, sube). El resultado
  se **topa en 100 %**. Estos son los valores exactos que debe dar:

  | Minutos de avance | Objetivo | Resultado | Por qué |
  |---|---|---|---|
  | 45 | 300 | "15,0 %" | 15 % exacto |
  | 47 | 300 | "15,7 %" | 15,666… % |
  | 49 | 400 | "12,3 %" | 12,25 %: empate, sube |
  | 0 | 300 | "0,0 %" | Nada estudiado todavía |
  | 500 | 300 | "100,0 %" | Topado en 100 %, nunca 166,7 % |

- La meta se considera **cumplida cuando los minutos de avance son iguales o mayores que el
  objetivo** (comparación "igual o mayor"). Con 200 minutos de avance y objetivo 200 la meta
  está cumplida y se muestra "100,0 %".
- Cuando la meta esté cumplida, el sistema deberá expresarlo **en texto legible** (por
  ejemplo "¡Meta cumplida!"), además de cualquier representación visual; la forma exacta del
  texto y de la barra se decide en el plan.
- El sistema **nunca recortará los minutos reales** estudiados para que "quepan" en el
  objetivo: si se han estudiado 500 con objetivo 300, se muestran los 500 y el progreso va
  al 100 %.
- Los minutos y el objetivo mostrados se escribirán en **convención española**, con
  separador de miles **con punto**: 100.000, nunca "100 000" ni "100000". Ejemplo exacto:
  objetivo 100000 y avance 45000 → "45.000 de 100.000 min".
- Cuando los minutos de avance y los del marcador "Esta semana" **se diferencien**, el
  bloque del objetivo deberá mostrar **un texto visible que explique esa diferencia**, para
  que los dos números no parezcan un error de la página. La redacción exacta se decide en el
  plan; lo que no puede cambiar es que el texto esté y se lea.
- Mientras no exista objetivo fijado, el sistema no deberá mostrar porcentaje ni barra de
  progreso: solo los minutos de la semana y la invitación (ver RF-2).

RF-4 — Qué cuenta como avance y cuándo se recalcula.
- El sistema deberá contar como avance únicamente las sesiones comprendidas entre el **lunes
  y el domingo de la semana actual**, en **hora local** del usuario (nunca UTC).
- Los dos límites de la semana (lunes y domingo) se obtienen **reutilizando las funciones de
  fecha locales ya existentes** en el proyecto, las que traducen una fecha a texto
  "AAAA-MM-DD" en hora local y las que suman o restan días. Nunca con UTC ni sumando
  milisegundos (86.400.000 ms por día).
- Donde haya sesiones con **fecha futura**, el sistema deberá ignorarlas para el avance.
- **El marcador "Esta semana" que ya existe mantiene su comportamiento actual** y sigue
  sumando también las sesiones con fecha futura. Son **dos reglas distintas y deliberadas**:
  el avance del objetivo ignora el futuro, el total de la semana no. Por eso, cuando existan
  sesiones con fecha futura, los dos números de la pantalla **pueden no coincidir**, y eso es
  lo correcto; el bloque del objetivo explica esa diferencia en texto visible (ver RF-3).
- Cuando la semana natural cambia (de lunes a domingo a un nuevo lunes), el sistema deberá
  mostrar el avance de la nueva semana y conservar el mismo objetivo.
- El sistema deberá recalcular el avance **al cargar la página** y **después de cada
  interacción**: registrar una sesión, cambiar el objetivo o quitarlo.
- El sistema **no** deberá usar temporizadores ni esperas automáticas para refrescar el
  avance: se calcula siempre al abrir y tras cada acción.
- El avance no depende de la pantalla: se calcula a partir de las sesiones y del día actual.

RF-5 — Ciclo de vida del objetivo: fijar, editar y quitar.
- Cuando la persona envía un objetivo válido (validado según RF-1), el sistema deberá
  guardarlo como el objetivo vigente de la semana actual **y de las semanas siguientes**: es
  una meta recurrente, no distinta cada semana.
- Cuando la persona envía un objetivo válido y **ya había** uno guardado, el sistema deberá
  sustituir el valor anterior por el nuevo.
- Si la persona cambia el objetivo, entonces el sistema deberá hacerlo **sin modificar las
  sesiones ya registradas ni los minutos ya estudiados** de la semana en curso: solo cambia
  la referencia contra la que se mide el avance.
- Si el objetivo se cambia a un valor **menor o igual** que los minutos ya estudiados esta
  semana, entonces el sistema deberá mostrar la meta como cumplida de inmediato.
- Cuando la persona quita el objetivo, el sistema deberá volver al estado **"sin objetivo
  fijado"** (invitación, sin porcentaje ni barra) y los minutos de la semana seguirán
  mostrándose.
- Si la persona quita el objetivo, entonces el sistema no deberá borrar ni modificar ninguna
  sesión.

RF-6 — Presentación medible en pantalla y en móvil.
- Mientras la pantalla mida **375 px** de ancho, el sistema deberá mostrar el objetivo, el
  avance y el control para fijarlo **sin scroll horizontal**, comprobable con
  `document.documentElement.scrollWidth <= 375`.
  - El ancho de 375 px se consigue **emulando el tamaño de pantalla**, no redimensionando la
    ventana del navegador: redimensionar no baja de unos 500 px y daría capturas falsamente
    cortadas. Antes de mirar el `scrollWidth` hay que **comprobar que el ancho emulado es
    375 px**; si no lo es, la comprobación no vale.
  - `scrollWidth <= 375` **no detecta contenido tapado** por un `overflow: hidden`. Por eso
    además hay que comprobar que los controles del objetivo son **alcanzables**: que se ven
    dentro de la pantalla y que se pueden tocar o pulsar.
- El objetivo y el avance deberán existir **como contenido textual visible** (no solo como
  barra o color), también a 375 px.
- El sistema deberá expresar el estado "cumplida" y el porcentaje como **texto legible**, sin
  depender del color ni de una barra.
- El sistema debe alcanzar el mismo **listón de accesibilidad** que la especificación 001: el
  avance y el estado "cumplida" deben existir como **texto accesible real**, no solo en un
  atributo `title` de esos mismos elementos.
- El control del objetivo tendrá **nombre accesible** (una etiqueta visible o el equivalente)
  asociado a él, para que se sepa qué se está escribiendo.
- Si hay barra de progreso, tendrá su **equivalente accesible**: el avance debe poder leerse
  con un lector de pantalla aunque la barra no se vea.
- El mensaje de error estará **asociado semánticamente a su campo**, para que un lector de
  pantalla lo anuncie al leer el campo del objetivo.
- El mensaje de error será **distinguible por su causa**, no un texto genérico: se distingue
  entre "no hay nada escrito", "no es un número", "tiene que ser más de 0" y "no se admiten
  decimales". Las cuatro causas proceden de la lista cerrada de RF-1.
- Cuando ya no hay error, el texto del mensaje **dejará de estar en el documento**: desaparece
  **eliminando su nodo del texto del documento**, no basta con esconderlo con `display: none`.
- El mensaje de error **no superpondrá** ningún otro elemento de la página (no se coloca
  encima de otro texto ni lo tapa) y el resto de la página seguirá siendo usable: al
  aparecer el mensaje, la página **no crece de alto** de forma que empuje o tape la sección
  siguiente, y se puede seguir usando el resto sin problema.
- El sistema deberá usar **minutos como unidad** y todos sus textos en español.

## Requisitos no funcionales
- Debe verse bien en móvil (375 px): objetivo, avance y control sin scroll horizontal.
- Debe ser coherente visualmente con el resto del Diario de Estudio (reutiliza el lenguaje de
  "cuaderno de estudio" ya existente).
- Sin backend: el objetivo y las sesiones viven solo en el navegador del usuario
  (constitución, principio 5).
- Accesible con el mismo listón que la especificación 001: **la información no depende solo
  del color ni de una barra**, el avance y "cumplida" son texto accesible real, el control
  tiene nombre accesible y el mensaje de error está asociado a su campo (ver RF-6).
- Todo en español: comentarios, textos de interfaz y nombres de funciones (constitución,
  principio 6).
- **El cálculo del avance, del porcentaje, de la validación y normalización del objetivo y del
  total de minutos de la semana deben ser lógica pura sin acceso al DOM, recibiendo el día
  actual como dato de entrada, para poder verificarse con `node --test`** (constitución,
  principio 3). Las cuatro reciben "hoy" como parámetro, con el mismo patrón que ya usa el
  mapa de calor (`construirMapa(sesiones, hoy, semanas)`): ninguna lee la fecha del reloj por
  su cuenta, así que los tests pueden fijar el día y obtener siempre el mismo resultado.
- Verificación sin dependencias externas: `node --test` para la lógica y MCP de Chrome
  DevTools para la pantalla (constitución, principio 4). El comando se ejecuta sobre **la ruta
  del archivo de test**, nunca sobre el directorio de tests.
- Consola: con **datos válidos**, la página debe abrir y funcionar sin errores en la consola.
  Con **dato guardado corrupto**, la aplicación tampoco debe lanzar excepciones: puede avisar
  por consola del dato que no ha podido leer y seguir, que es lo que ya hace hoy la lectura
  de datos corruptos.
- El objetivo no debe modificar ni romper el comportamiento actual de la racha, la mejor
  racha, los días del mes, el mapa de calor, la lista de sesiones ni el marcador
  "Esta semana".

## Casos límite
- **No hay meta fijada**: se muestran los minutos de la semana (como ahora) más la invitación
  a fijar una; nunca "0 / 0" ni porcentaje.
- **Objetivo 0, negativo, decimal con punto, decimal con coma, vacío o texto**: se rechaza con
  un mensaje visible y se conserva el objetivo anterior (o se sigue sin objetivo).
- **Formas de entrada**: manda la lista cerrada de RF-1. Se aceptan "0300", "+300", " 300 ",
  "3e2" y "1e3" (todas equivalen al mismo entero); se rechazan "", "   ", "abc", "0", "-5",
  "300.5", "300,5", "300.0", "Infinity" y "0x10".
- **Normalización**: se escribe "0300" y lo que queda guardado y se vuelve a mostrar es
  **300**.
- **Minutos == objetivo**: con objetivo 200 y 200 minutos la meta aparece **cumplida** y el
  progreso muestra "100,0 %".
- **Emparejamiento del redondeo**: 49 minutos con objetivo 400 dan "12,3 %", no "12,2 %".
- **Sin nada estudiado y con objetivo**: 0 minutos dan "0,0 %" y la meta **no** está
  cumplida.
- **Objetivo muy bajo (1 min) o muy alto (100 000 min)**: se acepta (no hay máximo); el
  avance se ajusta sin romperse y los minutos reales siguen siendo legibles.
- **Números grandes**: objetivo 100000 y avance 45000 se ven como "45.000 de 100.000 min",
  con punto y nunca con espacio ni sin separador.
- **Meta fijada a media semana**: los minutos ya estudiados esa semana cuentan desde el
  principio (fijar 300 el miércoles con 200 min ya acumulada da 66,7 %).
- **Meta superada**: avance al 100 %, marca de "cumplida" y total real visible (500 de 300 →
  "100,0 %" y 500 min, nunca 166,7 %).
- **Cambio de semana**: el avance vuelve a 0 con los minutos de la nueva semana; el objetivo
  se mantiene intacto.
- **Objetivo editado**: los minutos ya estudiados no se pierden ni se recalculan; si el nuevo
  objetivo es menor o igual que lo estudiado, la meta se cumple al momento.
- **Objetivo quitado**: se vuelve al estado "sin objetivo" y los minutos siguen visibles.
- **Mensaje de error**: dice la causa concreta (no es genérico), desaparece **quitando su
  nodo del texto del documento** (no solo escondiéndolo), no se superpone a ningún otro
  elemento y el resto de la página sigue usándose con normalidad.
- **Dato guardado corrupto, vacío o de tipo inesperado**: se trata como "sin objetivo" y la
  aplicación sigue funcionando, sin excepciones.
- **Sesiones con fecha futura**: no cuentan para el avance, pero **sí** para el marcador
  "Esta semana"; por eso los dos números pueden no coincidir y aparece el texto visible que lo
  explica.
- **Sesiones de la semana anterior**: no cuentan para el avance.
- **Minutos decimales ya guardados** en sesiones antiguas (p. ej. 30,5 min): se suman tal
  cual, el avance usa esa suma y el porcentaje se redondea a un solo decimal; no se descartan
  ni se truncan los minutos.
- **Varias sesiones el mismo día**: suman entre sí.
- **Cruce de mes y de año**: una semana de diciembre que cruza a enero (lunes 28 dic 2026 →
  domingo 3 ene 2027) se calcula igual. El rango lunes–domingo se obtiene con el texto de
  fecha **completo "AAAA-MM-DD"** en hora local; nunca comparando solo el mes y el año ni
  usando un prefijo del tipo "AAAA-MM", que metería en la semana días de meses vecinos.
- **Medianoche**: una sesión registrada a las 00:30 cuenta en su día local. Lo que decide en
  qué semana cae es **el momento del recálculo**: si la página se abre a las 00:30 del lunes,
  ya está en la semana nueva, aunque la sesión de las 00:30 sea del día anterior.
- **Cambio de hora (DST)**: en España ocurre de madrugada (a las 02:00/03:00). Una semana que
  contenga ese cambio se calcula igual, reutilizando las funciones de fecha locales ya
  existentes, como hacen la racha y el mapa de calor.
- **Página abierta sin interacción**: al no haber temporizadores, si el cambio de semana o el
  cruce de medianoche ocurre con la página quieta, **no se refleja en pantalla** hasta la
  siguiente interacción o recarga. Es el comportamiento aceptado: se documenta como
  limitación conocida.
- **Móvil**: a 375 px emulados se ven el objetivo, el avance y el control sin scroll
  horizontal, y los controles se pueden tocar.

## Fuera de alcance
- Objetivos distintos por día de la semana (p. ej. "más los lunes").
- Objetivos por mes, por trimestre o por año.
- Historial de objetivos: no se guardará qué meta había cada semana pasada ni se verá la
  evolución de la meta en el tiempo.
- Notificaciones, recordatorios, correos o avisos de "te faltan X minutos".
- Gráficas o comparativas nuevas entre semanas.
- Dividir la meta en tareas o en días concretos.
- Editar o borrar sesiones desde la zona del objetivo.
- Reiniciar el avance a mano.
- Cambiar el comportamiento del marcador "Esta semana" (sigue sumando las fechas futuras).
- Cambiar la racha, la mejor racha, los días del mes, el mapa de calor o la lista de sesiones.
- Refresco automático por temporizador: el avance se calcula al abrir y tras cada acción.
- Poner un máximo o un mínimo al objetivo (salvo que sea un entero mayor que 0).

## Criterios de finalización
- Se puede fijar un objetivo (por ejemplo 300) y queda visible en pantalla con el avance.
- El porcentaje sale con **un decimal y coma** y da exactamente estos valores:
  45/300 → "15,0 %"; 47/300 → "15,7 %"; 49/400 → "12,3 %"; 0/300 → "0,0 %";
  500/300 → "100,0 %" (topado, nunca 166,7 %).
- **200 minutos de avance con objetivo 200** muestran la marca de "cumplida" y "100,0 %".
- El estado "cumplida" y el avance se leen **en texto accesible real**, no solo en color,
  barra ni en un atributo `title`.
- El control del objetivo tiene nombre accesible y el mensaje de error está asociado a su
  campo; si hay barra de progreso, tiene equivalente accesible.
- Las formas de entrada se comportan **exactamente como dice la lista cerrada de RF-1**: por
  ejemplo "0300" se acepta y acaba guardado y mostrado como "300", y "300.0" se rechaza.
- Los minutos y el objetivo grandes usan **punto de miles**: 45000 de 100000 se ve
  "45.000 de 100.000 min".
- Al recargar la página, el objetivo sigue ahí; si no se había fijado nunca (o el dato está
  corrupto), se muestra la invitación y **no** aparece un "0 / 0".
- Registrar una sesión de la semana actual actualiza el avance sin recargar.
- Registrar una sesión de la semana anterior **no** cambia el avance.
- Una sesión con fecha futura **no** cambia el avance, pero **sí** el marcador "Esta semana",
  y en ese caso aparece el **texto visible que explica la diferencia** entre los dos números.
- Al cambiar de semana, el avance se reinicia con los minutos de la nueva semana y el
  objetivo se conserva.
- Un objetivo 0, negativo, decimal o no numérico se rechaza con un mensaje visible que dice la
  causa, ese mensaje desaparece al corregirlo **quitando su nodo del texto del documento**, no
  se superpone a ningún otro elemento ni tapa la sección siguiente, y no se destruye el
  objetivo anterior.
- Editar la meta y quitarla funcionan sin perder ni modificar ninguna sesión.
- La validación y normalización del objetivo, el avance, el porcentaje y el total de minutos
  de la semana son **funciones puras sin acceso al DOM**, cubiertas con `node --test` que pasan
  en verde. **Las que dependen de una fecha (el avance, el total de minutos de la semana y el
  cálculo del objetivo a partir de las sesiones) reciben el día actual como parámetro**; las que
  no tienen ninguna fecha que mirar (validar el objetivo y calcular el porcentaje) no lo
  necesitan. Lo que exige este requisito es que **ninguna lea la hora del reloj por su cuenta**,
  para que los tests puedan fijar el día y obtener siempre el mismo resultado.
- Con datos válidos no hay errores en la consola; con el objetivo guardado corrupto la
  aplicación **no lanza excepciones** (puede avisar por consola). Los textos están en español.
- A 375 px **emulados** (comprobando antes que el ancho emulado es 375) no hay scroll
  horizontal (`scrollWidth <= 375`) y los controles del objetivo son alcanzables; objetivo y
  avance son visibles como texto.
- La no regresión de racha, mejor racha, días del mes, mapa de calor y lista de sesiones
  sigue funcionando igual que antes de añadir el objetivo.
- Verificado con el MCP de Chrome DevTools: abrir, fijar y editar la meta, registrar una
  sesión, comprobar el avance, revisar la consola y comprobar la vista móvil.

### Reparto de herramientas

| Criterio | Cómo se comprueba |
|---|---|
| Porcentajes exactos (15,0 / 15,7 / 12,3 / 0,0 / 100,0) | `node --test` |
| Minutos iguales al objetivo → cumplida | `node --test` |
| Formas de entrada aceptadas y rechazadas, y normalización a entero | `node --test` |
| Avance con y sin fechas futuras | `node --test` |
| Total semanal (lunes–domingo, cruce de mes y de año, medianoche, cambio de hora) | `node --test` |
| Las funciones son puras y las que dependen de una fecha reciben "hoy" | `node --test` |
| Fijar, editar y quitar la meta | Chrome DevTools |
| Números grandes con punto de miles ("45.000 de 100.000 min") | Chrome DevTools |
| Objetivo conservado al recargar; dato corrupto → invitación y sin excepciones | Chrome DevTools |
| Texto visible que explica la diferencia con "Esta semana" | Chrome DevTools |
| Nombre accesible del control, texto accesible del avance, error asociado al campo | Chrome DevTools (auditoría de accesibilidad) |
| Consola sin errores con datos válidos | Chrome DevTools |
| Mensaje de error distinguible por causa, que no se superpone y que desaparece quitando su nodo | Chrome DevTools |
| Vista a 375 px emulados, sin scroll y con controles alcanzables | Chrome DevTools |
| Racha, mejor racha, días del mes, mapa de calor y lista sin cambios | Solo Chrome DevTools |

- Comando de la lógica:
  `node --test ejemplo1/tests/logica.test.js` (siempre la ruta del archivo de test; pasar el
  directorio no funciona en Node 24).
- La no regresión de **racha, mejor racha, días del mes y lista** solo se puede comprobar con
  DevTools: esos cálculos viven hoy en `app.js`, que no se puede importar en Node porque usa
  la pantalla ya en su nivel superior (`document.getElementById` al empezar). Los tests solo
  cubren la lógica separada.

## Dudas abiertas
Ninguna pendiente. Las decisiones que quedaban pendientes ya están resueltas en esta
revisión: clave propia en el navegador, un decimal con coma con redondeo "media hacia arriba",
meta cumplida con minutos iguales o mayores, el bloque del objetivo mostrando sus propios
minutos y un texto que explique la diferencia con "Esta semana", sin máximo para el objetivo,
texto plano en el almacenamiento, recálculo al abrir y en cada interacción sin temporizadores,
comando de tests por ruta de archivo y reparto de comprobaciones entre lógica y pantalla. Los
detalles que solo son visuales (barra o porcentaje visible, texto exacto de "cumplida", texto
explicativo de la diferencia, sitio donde se coloca el bloque de objetivo y cómo se muestra el
mensaje de error) se delegan explícitamente al plan.
