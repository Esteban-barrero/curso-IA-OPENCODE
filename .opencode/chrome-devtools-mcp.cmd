@echo off
REM ============================================================
REM  Lanzador del MCP chrome-devtools
REM ============================================================
REM  ¿Por qué existe este archivo?
REM  OpenCode arranca este MCP como un proceso hijo. Si el PATH
REM  del proceso que lo lanzó no tiene a Node, "npx" no se
REM  encuentra y el MCP falla.
REM
REM  Este script antepone explícitamente la carpeta de Node 24 al
REM  PATH (solo para este proceso), así funciona siempre, sin
REM  importar qué versión tenga activada "nvm use".
REM
REM  Si algún día actualizas Node, cambia la ruta de abajo.
REM ============================================================

set "NODE24=C:\Users\ebarrero\AppData\Local\nvm\v24.21.0"
set "PATH=%NODE24%;%PATH%"

"%NODE24%\npx.cmd" -y chrome-devtools-mcp@latest --no-usage-statistics
