# Documentación de PrintLab 3D

## Descripción

PrintLab 3D es una aplicación web para cotizar y gestionar trabajos de impresión 3D y corte láser. El cliente puede consultar el catálogo, preparar una solicitud y seguir su pedido. El personal de administración revisa las solicitudes, emite cotizaciones y actualiza los pedidos, el catálogo y los perfiles de usuario.

El flujo comienza con una solicitud, que puede partir del catálogo o incluir un archivo de referencia. Un administrador prepara la cotización. El cliente puede aceptarla para generar un pedido o rechazarla desde su panel.

## Requerimientos

### Funcionales

| Área | Funciones |
| --- | --- |
| Sitio público | Consultar el catálogo, filtrar productos, crear una cuenta e iniciar sesión. |
| Cliente | Preparar una solicitud desde el carrito o el formulario, adjuntar una imagen o un STL, consultar cotizaciones, aceptar o rechazar una propuesta y consultar pedidos y perfil. |
| Administración | Consultar indicadores, revisar solicitudes, crear o editar cotizaciones, gestionar pedidos, mantener el catálogo y actualizar perfiles de usuario. |

Los paneles requieren una cuenta activa con el rol `CLIENT` o `ADMIN`, según la ruta que se quiera abrir. [Rutas y controles de acceso](src/app/app.routes.ts)

### Técnicos

- Git, Node.js y npm. Se recomienda Node.js 24 para trabajar con las versiones declaradas de Angular y las herramientas de desarrollo. El manifiesto identifica `npm@10.9.2` como gestor del proyecto. [Manifiesto](package.json)
- Un navegador para acceder a la aplicación Angular.
- Un proyecto de Supabase configurado para los flujos con datos. La aplicación usa Auth, las tablas `profiles`, `catalog_products`, `requests`, `quotes` y `orders`, las funciones `accept_quote` y `reject_quote`, y los buckets `avatars`, `catalog-products` y `request-files`. También escucha cambios de solicitudes, cotizaciones y pedidos con Realtime. [Servicios de acceso a datos](src/app/core/services)
- Para usar una instancia propia de Supabase, se deben preparar el esquema, las funciones, los buckets y sus políticas de acceso. El repositorio contiene el cliente Angular y la configuración de conexión. El acceso con Google requiere configurar ese proveedor y autorizar la URL de retorno `/auth/callback`. [Configuración de conexión](src/environments/environment.ts)

## Herramientas utilizadas

| Herramienta | Uso |
| --- | --- |
| Angular 21, TypeScript y SCSS | Interfaz, formularios, navegación por roles y estilos. |
| Supabase y PostgreSQL | Autenticación, persistencia, archivos y actualizaciones en tiempo real. |
| Angular CLI y npm | Instalación, servidor local, compilación y ejecución de pruebas. |
| Vitest y jsdom | Pruebas de Angular en un entorno de navegador simulado. |
| ESLint, Angular ESLint y Prettier | Reglas de análisis estático y formato. |
| Git y GitHub | Control de versiones y revisión por pull request. |
| Vercel | Reescribe las rutas para que Angular las resuelva desde `index.html`. |

Los cambios de integración continua se pueden consultar en los PR de [análisis estático](https://github.com/A4ld0/Proyecto-Cliente/pull/2) y [pruebas, cobertura y escenarios BDD con Playwright](https://github.com/A4ld0/Proyecto-Cliente/pull/3).

## Dependencias

Las versiones declaradas están en [`package.json`](package.json) y la instalación reproducible utiliza [`package-lock.json`](package-lock.json).

| Tipo | Paquetes principales |
| --- | --- |
| Aplicación | `@angular/core`, `@angular/common`, `@angular/compiler`, `@angular/forms`, `@angular/platform-browser` y `@angular/router` para el frontend. `@supabase/supabase-js` para la conexión con Supabase. `rxjs` y `tslib` para operaciones asíncronas y utilidades de TypeScript. El manifiesto también declara el paquete `angular` de AngularJS. |
| Compilación y pruebas | `@angular/cli`, `@angular/build`, `@angular/compiler-cli`, `typescript`, `vitest` y `jsdom`. |
| Análisis y formato | `eslint`, `angular-eslint`, `typescript-eslint`, `eslint-config-prettier` y `prettier`. |

## Cómo correr la aplicación

1. Clona el repositorio e instala las dependencias desde su raíz.

   ```bash
   git clone https://github.com/A4ld0/Proyecto-Cliente.git
   cd Proyecto-Cliente
   npm ci
   ```

2. Si vas a usar tu propio proyecto de Supabase, configura `environment.supabase.url` y `environment.supabase.anonKey` en [`src/environments/environment.ts`](src/environments/environment.ts). Usa la clave pública de cliente para la aplicación Angular.
3. Arranca el servidor de desarrollo.

   ```bash
   npm start
   ```

4. Abre [http://localhost:4200](http://localhost:4200).

Usa estos comandos para ejecutar las pruebas una vez y generar la compilación de producción.

```bash
npm test -- --watch=false
npm run build
```

La compilación de producción se guarda en `dist/printlab/browser/`. [Configuración de Angular](angular.json)

## Cómo contribuir

1. Actualiza `main` y crea una rama para tu cambio.

   ```bash
   git switch main
   git pull --ff-only origin main
   git switch -c feat/descripcion-del-cambio
   ```

2. Implementa el cambio y ejecuta `npm test -- --watch=false` y `npm run build` antes de enviarlo. Para cambios visibles, recorre el flujo afectado en el navegador.
3. Sube tu rama con `git push -u origin feat/descripcion-del-cambio` y abre un pull request hacia `main`. Describe qué cambió, qué verificaste y cómo reproducir el resultado.
4. Solicita la revisión de otra persona del equipo. Revisa el resultado de los checks que figuran en el PR y atiende los comentarios antes de integrarlo.

## Estructura general de archivos

```text
Proyecto-Cliente/
├── docs/capturas/              Capturas de las pantallas para documentación
├── public/                    Archivos estáticos públicos
├── src/
│   ├── app/
│   │   ├── core/              Servicios, guards, interceptores y utilidades
│   │   ├── features/          Pantallas de administración, acceso, catálogo,
│   │   │                      cliente e inicio
│   │   ├── interfaces/        Tipos de usuarios, solicitudes, cotizaciones,
│   │   │                      pedidos y productos
│   │   ├── layouts/           Estructura común de las páginas
│   │   ├── shared/            Componentes reutilizables de navegación
│   │   └── app.routes.ts      Rutas públicas y protegidas
│   ├── assets/                Imágenes y otros recursos de la interfaz
│   ├── environments/          Configuración de conexión a Supabase
│   ├── main.ts                Arranque de Angular
│   └── styles.scss            Estilos globales
├── angular.json               Configuración de Angular CLI
├── DOCUMENTACION.md           Guía de instalación y contribución
├── package.json               Scripts y dependencias
├── package-lock.json          Versiones exactas de las dependencias
├── README.md                  Resumen y capturas del proyecto
└── vercel.json                Reescritura de rutas de la aplicación
```
