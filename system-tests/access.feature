# language: es
Característica: Acceso a rutas según sesión y rol

  Escenario: Un cliente no accede a los pedidos de administración
    Dado que inicio sesión como cliente
    Cuando intento abrir los pedidos de administración
    Entonces vuelvo a mi panel de cliente

  Escenario: Una visita sin sesión no accede a solicitudes privadas
    Cuando intento abrir la ruta "/client/requests"
    Entonces veo el formulario de acceso

  Escenario: Un administrador vuelve a su panel al abrir una ruta de cliente
    Dado que inicio sesión como administrador
    Cuando intento abrir la ruta "/client/requests"
    Entonces vuelvo a mi panel de administrador
