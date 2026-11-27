# language: es
Característica: Cotizaciones y pedidos

  Escenario: Una cotización enviada y aceptada aparece como pedido del cliente
    Dado que existe la solicitud pendiente "Soporte para sensor"
    Y que inicio sesión como administrador
    Cuando envío una cotización de 180 pesos para "Soporte para sensor"
    Entonces la solicitud "Soporte para sensor" aparece como cotizada por 180 pesos
    Cuando cierro sesión
    Y entro con la cuenta del cliente
    Y acepto la cotización de "Soporte para sensor"
    Entonces veo el pedido "Soporte para sensor" con estado "En cola" y cotización "Aceptada"

  Escenario: Rechazar una cotización no crea un pedido
    Dado que existe una cotización enviada para "Pieza a rechazar"
    Y que inicio sesión como cliente
    Y que abro mis solicitudes
    Cuando rechazo la cotización de "Pieza a rechazar"
    Entonces la cotización de "Pieza a rechazar" aparece como "Rechazada"
    Y no tengo pedidos

  Escenario: Cancelar la confirmación conserva la cotización enviada
    Dado que existe una cotización enviada para "Pieza sin decisión"
    Y que inicio sesión como cliente
    Y que abro mis solicitudes
    Cuando cancelo la confirmación de aceptación para "Pieza sin decisión"
    Entonces la cotización de "Pieza sin decisión" aparece como "Enviada"
    Y no tengo pedidos
