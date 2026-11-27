# language: es
Característica: Solicitudes de impresión

  Escenario: Un cliente convierte el carrito en una solicitud
    Dado que inicio sesión como cliente
    Cuando elijo el material "PETG" y el color "Blanco" en el catálogo
    Y agrego "Organizador de escritorio" al carrito
    Y convierto el carrito en una solicitud
    Entonces el borrador contiene "Organizador de escritorio" con material "PETG" y color "Blanco"
    Cuando envío la solicitud
    Entonces la solicitud "Cotizacion catalogo: Organizador de escritorio" aparece como "Pendiente" tras recargar

  Escenario: Los límites del formulario impiden guardar una solicitud incompleta
    Dado que inicio sesión como cliente
    Y que abro mis solicitudes
    Cuando escribo el título "AB" y la descripción "123456789"
    Entonces no puedo enviar la solicitud
    Cuando escribo el título "ABC" y la descripción "1234567890"
    Y envío la solicitud
    Entonces la solicitud "ABC" aparece como "Pendiente" tras recargar

  Escenario: Un PDF se rechaza como archivo de referencia
    Dado que inicio sesión como cliente
    Y que abro mis solicitudes
    Cuando selecciono un archivo PDF
    Entonces veo el error de formato y el selector queda vacío
