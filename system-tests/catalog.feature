# language: es
Característica: Catálogo y carrito

  Escenario: El filtro de precio permite recuperar un catálogo sin resultados
    Dado que visito el catálogo público
    Cuando limito el precio máximo a 110 pesos
    Entonces no hay productos que coincidan
    Cuando restablezco los filtros
    Entonces vuelve a mostrarse "Organizador de escritorio"

  Escenario: Dos productos iguales se acumulan y el carrito persiste al recargar
    Dado que inicio sesión como cliente
    Cuando elijo el material "PETG" y el color "Blanco" en el catálogo
    Y agrego "Organizador de escritorio" al carrito
    Y agrego "Organizador de escritorio" al carrito
    Entonces el carrito tiene 2 unidades de "PETG" y "Blanco" con total 240 pesos
    Cuando recargo la página
    Entonces el carrito tiene 2 unidades de "PETG" y "Blanco" con total 240 pesos

  Escenario: Vaciar el carrito conserva su estado vacío al recargar
    Dado que inicio sesión como cliente
    Cuando elijo el material "PLA" y el color "Negro" en el catálogo
    Y agrego "Organizador de escritorio" al carrito
    Y vacío el carrito
    Y recargo la página
    Entonces el carrito está vacío
