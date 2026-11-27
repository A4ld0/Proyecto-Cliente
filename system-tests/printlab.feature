# language: es
Característica: Solicitudes y pedidos de impresión 3D

  Escenario: El catálogo pide iniciar sesión antes de agregar productos
    Dado que visito el catálogo público
    Cuando agrego "Organizador de escritorio" al carrito
    Entonces veo el formulario de acceso con el catálogo como destino
    Cuando intento entrar con una contraseña incorrecta
    Entonces veo el error de credenciales y sigo en el formulario de acceso

  Escenario: Un cliente convierte el carrito en una solicitud
    Dado que inicio sesión como cliente
    Cuando elijo el material "PETG" y el color "Blanco" en el catálogo
    Y agrego "Organizador de escritorio" al carrito
    Y convierto el carrito en una solicitud
    Entonces el borrador contiene "Organizador de escritorio" con material "PETG" y color "Blanco"
    Cuando envío la solicitud
    Entonces la solicitud "Cotizacion catalogo: Organizador de escritorio" aparece como "Pendiente" tras recargar

  Escenario: Un cliente no accede a los pedidos de administración
    Dado que inicio sesión como cliente
    Cuando intento abrir los pedidos de administración
    Entonces vuelvo a mi panel de cliente

  Escenario: Una cotización enviada y aceptada aparece como pedido del cliente
    Dado que existe la solicitud pendiente "Soporte para sensor"
    Y que inicio sesión como administrador
    Cuando envío una cotización de 180 pesos para "Soporte para sensor"
    Entonces la solicitud "Soporte para sensor" aparece como cotizada por 180 pesos
    Cuando cierro sesión
    Y entro con la cuenta del cliente
    Y acepto la cotización de "Soporte para sensor"
    Entonces veo el pedido "Soporte para sensor" con estado "En cola" y cotización "Aceptada"
