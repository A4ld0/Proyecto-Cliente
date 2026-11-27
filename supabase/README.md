# Supabase local de pruebas

Esta instancia ejecuta Auth, PostgreSQL, REST, Storage y Realtime en Docker.
Usa datos ficticios y el identificador local `supabase-testbed`. La CLI 3.4.0
está fijada como dependencia del proyecto. No requiere iniciar sesión ni enlazar
la CLI con un proyecto de Supabase Cloud.

## Inicio

1. Iniciar Docker Desktop y esperar a que el motor esté disponible.
2. Desde la raíz del repositorio, ejecutar:

```bash
npm ci
npm run db:start
```

La primera ejecución descarga imágenes oficiales. API: `http://127.0.0.1:54321`;
PostgreSQL: `127.0.0.1:54322`. Studio, análisis y funciones Edge no se necesitan
para esta batería. Para detener esta instancia conservando sus datos:

```bash
npm run db:stop
```

`npm run db:status` muestra datos y claves **del entorno local**. No publicar esas
salidas completas en reportes.

## Alcance comprobable

El 26 de noviembre se inició el entorno y se observó PostgreSQL, Auth, REST,
Storage y Realtime activos. El endpoint local de salud de Auth respondió HTTP 200.
Esto verifica el arranque, no las reglas de negocio de la aplicación.
Después de comprobarlo se detuvo únicamente esta instancia, conservando sus datos,
para continuar el trabajo que no depende del SQL.
La confirmación por correo está deshabilitada en la configuración local para
poder crear usuarios sintéticos sin enviar mensajes externos.

Faltan las migraciones completas de `profiles`, `requests`, `quotes`, `orders`,
catálogo, políticas RLS, buckets y RPC de la aplicación. En el historial del repo
solo se encontró `supabase/catalog_setup.sql`. Las interfaces y el SQL histórico
permiten diseñar contratos, pero no recuperar todas las reglas del backend.

El 26 de noviembre no se pudo resolver desde esta máquina el dominio Supabase
configurado en `src/environments/environment.ts`, aunque `supabase.com` sí resolvió.
El equipo confirmó que dispone del SQL y lo compartirá después. Hasta entonces,
no se afirma que el esquema local reproduzca el desplegado.

La conexión habitual de Angular se mantiene en `src/environments/environment.ts`.
Los comandos de preparación local no modifican ese archivo. Las
pruebas de Auth/tablas/RLS/RPC/Storage y la configuración de Angular para backend local
se completan cuando se disponga del esquema; M4 permanece parcial.
