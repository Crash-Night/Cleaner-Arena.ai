# Cleaner-Arena.ai
Herramienta no oficial para borrar en masa conversaciones archivadas de Arena.ai desde la consola del navegador.

# ⚠️ Advertencia ⚠️
    ¡CUIDADO! Esta acción es IRREVERSIBLE. Una vez borradas, las conversaciones no se pueden recuperar.

    ✅ Usa el script bajo tu propia responsabilidad.
    ✅ Siempre puedes hacer una copia de seguridad antes.
    ✅ El script te pedirá confirmación antes de empezar.

# Video de Demostracion

https://github.com/user-attachments/assets/adf98bf4-ce03-42e8-b023-51dffad515f5

# 🚀 ¿Cómo Funciona? 

# Cleaner-Arena.ai no utiliza APIs internas ni envía peticiones HTTP directas a servidores de Arena. En su lugar:

    Simula clics de usuario reales en la interfaz
    Sigue el flujo: More options → Delete → Yes, delete
    Hace scroll automático para cargar más conversaciones
    Reintenta si algún elemento no aparece inmediatamente
    Termina cuando no encuentra más menús después de varios intentos
    
# Requisitos

    Navegador moderno (Chrome, Firefox, Edge)
    Sesión iniciada en Arena.ai
    Estar en la sección de Conversaciones Archivadas

# Tutorial paso a paso

    Abre Arena.ai y ve a Conversaciones Archivadas

    Abre la consola del navegador:
        F12 → pestaña Console (Chrome/Edge/Firefox)
        ⌘ + ⌥ + I en Mac

    Copia y pega el script completo de:

    # /~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~\ 
    
    # /~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~\

#      Ejecuta y confirma:
        El navegador te pedirá que escribas BORRAR
        El script empezará a eliminar conversaciones automáticamente

#    Siéntate y relájate 🍿
        Verás en la consola cuántas conversaciones se han borrado
        El proceso termina cuando ya no encuentra más

# Preguntas frecuentes 

# ¿Es seguro? ¿Puede banearme?
=> Es tan seguro como hacer los clics tú mismo. No altera servidores ni envía peticiones extrañas.

 # ¿Funciona en móvil?
=> No probado oficialmente, pero la consola de Chrome en Android podría funcionar.

 # ¿Cuánto tarda?
=> Depende de la cantidad. Aproximadamente 2-3 segundos por conversación.

# ¿Puedo pausarlo?
=> Usando los siguientes comando en la Consola:
# Pausar    -> window.__arenaDeleteStop = true    = El script se detendrá en la siguiente iteración,
# Reanudar  -> window.__arenaDeleteStop = false   = El script continúa donde lo dejó,
# Parar     -> location.reload()                  = Recarga la página y mata el script,
# Parar     -> Cierra la ventana                  = Mata el proceso

# ¿Borrará conversaciones activas (no archivadas)?
=> No. Solo opera sobre las que están en la sección Archivadas.
