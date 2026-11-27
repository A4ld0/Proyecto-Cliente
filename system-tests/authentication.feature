# language: es
Característica: Autenticación de clientes

  Escenario: El catálogo pide iniciar sesión antes de agregar productos
    Dado que visito el catálogo público
    Cuando agrego "Organizador de escritorio" al carrito
    Entonces veo el formulario de acceso con el catálogo como destino
    Cuando intento entrar con una contraseña incorrecta
    Entonces veo el error de credenciales y sigo en el formulario de acceso

  Escenario: El cliente inicia y cierra sesión
    Dado que inicio sesión como cliente
    Cuando cierro sesión
    Y intento abrir la ruta "/client/requests"
    Entonces veo el formulario de acceso

  Escenario: El registro impide una contraseña menor al mínimo
    Dado que completo el registro con una contraseña de siete caracteres
    Entonces no puedo crear la cuenta y veo el error del mínimo
