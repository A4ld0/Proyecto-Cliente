# PrintLab 3D

PrintLab 3D es una aplicacion web para gestionar servicios de impresion 3D, solicitudes de clientes, cotizaciones, pedidos, catalogo de productos y administracion de usuarios.

El sistema esta orientado a digitalizar el flujo de trabajo entre cliente y administrador: el cliente consulta el catalogo, crea solicitudes y da seguimiento a sus pedidos; el administrador revisa solicitudes, gestiona productos, usuarios y estados del proceso.

## Entrega

- Demo completa del sistema.
- Documentacion final del proyecto.
- Capturas de las pantallas principales para integrar en el documento de Word.

## Tecnologias utilizadas

- Angular 21.
- TypeScript.
- SCSS.
- Supabase Auth para autenticacion.
- Supabase Database sobre PostgreSQL para persistencia de datos.
- Supabase Storage para carga y gestion de archivos.
- Supabase Realtime para actualizaciones en tiempo real.
- Vitest para pruebas unitarias.

## Modulos principales

### Sitio publico

Incluye la pagina de inicio, el catalogo publico, inicio de sesion y registro de clientes.

### Cliente

El cliente puede consultar su panel, crear solicitudes, revisar pedidos, actualizar su perfil y navegar el catalogo de productos o servicios disponibles.

### Administrador

El administrador puede supervisar indicadores generales, revisar solicitudes, gestionar pedidos, administrar el catalogo y mantener actualizada la informacion de usuarios.

## Backend con Supabase

Supabase se utiliza como backend principal del sistema. Desde Angular se consumen los servicios de autenticacion, base de datos, almacenamiento y realtime mediante servicios centralizados.

La base de datos almacena perfiles, productos del catalogo, solicitudes, cotizaciones y pedidos. Las operaciones principales se realizan mediante servicios Angular que mantienen separada la logica de datos de las pantallas.

## Realtime

El sistema utiliza Supabase Realtime para escuchar cambios relevantes en la base de datos y reflejarlos en la interfaz sin recargar la pagina. Esto permite que el seguimiento de solicitudes y pedidos sea mas dinamico, especialmente cuando el administrador actualiza estados o registra avances.

## Carga de archivos

La carga de archivos se realiza mediante Supabase Storage. Los archivos se guardan en buckets y la aplicacion almacena en la base de datos la URL o referencia asociada al registro correspondiente.

Este enfoque evita guardar archivos pesados directamente en la base de datos y permite mantener una relacion ordenada entre solicitudes, productos del catalogo, imagenes y documentos cargados por los usuarios.

## Catalogo

El catalogo muestra los productos y servicios disponibles para los clientes. Es util porque centraliza la oferta de impresion en un solo lugar y ayuda al cliente a consultar opciones antes de realizar una solicitud.

El administrador puede crear, editar, activar o desactivar productos, modificar informacion y actualizar imagenes. El cliente puede consultar nombres, imagenes, categorias, descripciones, precios de referencia, materiales, colores y tiempos de entrega.

Las imagenes del catalogo se almacenan en un bucket de Supabase Storage. La base de datos conserva la referencia de la imagen para mostrarla dentro de la aplicacion.

## Flujo general

1. El cliente accede a la plataforma.
2. Consulta el catalogo o inicia sesion.
3. Crea una solicitud y adjunta informacion o archivos.
4. El administrador revisa la solicitud.
5. Se genera o actualiza el seguimiento del pedido.
6. Los cambios se reflejan para el cliente mediante el sistema.

## Capturas para documentacion

Las capturas se guardan localmente en `docs/capturas/`. Esta carpeta esta excluida de Git porque contiene imagenes generadas para la documentacion final.

### Pantallas publicas

![Landing](docs/capturas/01-landing.png)

![Catalogo publico](docs/capturas/02-catalogo-publico.png)

![Login](docs/capturas/03-login.png)

![Registro](docs/capturas/04-registro.png)

### Modulo cliente

![Cliente - Dashboard](docs/capturas/05-cliente-dashboard.png)

![Cliente - Solicitudes](docs/capturas/06-cliente-solicitudes.png)

![Cliente - Pedidos](docs/capturas/07-cliente-pedidos.png)

![Cliente - Perfil](docs/capturas/08-cliente-perfil.png)

![Cliente - Catalogo](docs/capturas/09-cliente-catalogo-publico.png)

### Modulo administrador

![Admin - Dashboard](docs/capturas/10-admin-dashboard.png)

![Admin - Solicitudes](docs/capturas/11-admin-solicitudes.png)

![Admin - Pedidos](docs/capturas/12-admin-pedidos.png)

![Admin - Catalogo](docs/capturas/13-admin-catalogo.png)

![Admin - Usuarios](docs/capturas/14-admin-usuarios.png)

## Instalacion y ejecucion

Instalar dependencias:

```bash
npm install
```

Iniciar servidor local:

```bash
npm start
```

Abrir la aplicacion en:

```text
http://localhost:4200
```

## Build

Para generar una version de produccion:

```bash
npm run build
```

Los archivos compilados se generan en la carpeta `dist/`.

## Pruebas

Para ejecutar pruebas:

```bash
npm test
```

## Estructura general

```text
src/app/core/        Servicios, guards, constantes y utilidades principales
src/app/features/    Modulos funcionales por dominio
src/app/layouts/     Layouts compartidos de la aplicacion
src/app/shared/      Componentes reutilizables
src/app/interfaces/  Interfaces compartidas del sistema
src/assets/          Recursos estaticos del proyecto
docs/capturas/       Capturas locales para documentacion final
```

## Conclusiones

PrintLab 3D entrega una base funcional y escalable para la gestion digital de servicios de impresion. La combinacion de Angular y Supabase permite contar con una aplicacion moderna, mantenible y preparada para crecer con nuevas funcionalidades como pagos en linea, notificaciones, reportes y seguimiento avanzado de pedidos.
