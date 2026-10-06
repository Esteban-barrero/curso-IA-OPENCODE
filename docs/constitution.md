# Constitución del Diario de Estudio

Principios innegociables del proyecto. Si el código contradice uno, se corrige el código o se actualiza este documento con aprobación.

1. **Stack simple por defecto.** HTML, CSS y JS puro; sin build. Se abre con doble clic en `index.html`. Se puede añadir una librería puntual + **aprobación previa**.
2. **La spec manda sobre el código.** `AGENTS.md` y esta constitución son la fuente de verdad. → *Cada comportamiento está documentado.*
3. **Lógica separada de la interfaz.** Los cálculos son funciones puras (sin tocar el DOM); el HTML/CSS solo presenta. → *Ninguna función de cálculo usa `document`.*
4. **Verificación sin dependencias externas.** Se prueba con los tests nativos de Node (`node --test`) y con el MCP de Chrome DevTools (abrir, probar, revisar consola y móvil). → *No hay framework de tests externo.*
5. **Datos solo en el navegador del usuario.** Todo en `localStorage`; sin backend ni envíos externos. → *No hay peticiones a servidores.*
6. **Todo en español.** Comentarios, textos de interfaz y nombres de funciones. → *No hay texto en inglés salvo términos técnicos.*
