# Requisitos de PrintLab 3D

Versión: 26 de noviembre de 2026. Prioridad: A = alta; M = media.
Los requisitos describen el comportamiento que debe verificarse. Su presencia
en el código no acredita una ejecución ni garantiza las políticas del servidor.

## Funcionales

| ID | Prioridad | Requisito y aceptación |
| --- | --- | --- |
| RF-01 | A | Registrar clientes con nombre de 3–80 caracteres, correo válido y contraseña de al menos 8 caracteres con letra y número. Teléfono opcional de 7–20 caracteres permitidos. El registro público asigna CLIENT y muestra errores sin aparentar éxito. |
| RF-02 | A | Iniciar sesión con correo y contraseña válidos, mostrar errores recuperables y cerrar sesión. El acceso dirige al panel correspondiente al rol; el formulario de acceso acepta contraseñas desde 6 caracteres para cuentas existentes. |
| RF-03 | A | Restringir pantallas y operaciones según sesión, rol y perfil activo. CLIENT no puede ejecutar operaciones administrativas ni leer o modificar datos de otro cliente, incluso mediante API directa. |
| RF-04 | A | Consultar el catálogo activo y filtrar por texto y categoría, mostrando precio de referencia, materiales y colores. Una búsqueda sin coincidencias muestra un estado vacío. |
| RF-05 | A | Añadir variantes al carrito, acumular la cantidad de una misma combinación nombre/material/color, separar variantes distintas y calcular la suma de precio de referencia por cantidad. Conservar el carrito al recargar y permitir eliminar o vaciarlo. |
| RF-06 | A | Crear una solicitud de tipo GENERAL_3D o CUTTER con título de 3–80 y descripción de 10–500 caracteres. Asociarla al cliente autenticado con estado PENDING y evitar envíos simultáneos duplicados. |
| RF-07 | A | Adjuntar PNG, JPEG, WEBP o STL de hasta 20 MiB (20 971 520 bytes) a una solicitud. Informar fallos y permitir reintentar sin duplicar una solicitud ya creada ni un archivo ya subido en el mismo intento recuperable. |
| RF-08 | A | Consultar solicitudes propias; editar o eliminar las PENDING y cancelar las IN_REVIEW o QUOTED previa confirmación. Actualizar la información visible tras la operación. |
| RF-09 | A | Aceptar o rechazar una cotización propia vigente SENT previa confirmación. Bloquear decisiones simultáneas, repetidas o sobre una cotización que ya no sea la vigente de la solicitud. Aceptar genera un único pedido; rechazar no genera pedido. La atomicidad se verifica en backend real. |
| RF-10 | A | Consultar los pedidos del cliente con su cotización y estado de producción persistido. Los cambios recibidos deben reflejarse en la vista; una recarga conserva el estado confirmado por el servidor. |
| RF-11 | A | Permitir al administrador revisar solicitudes y crear o actualizar cotizaciones con precio total >=1 y plazo opcional >=1 día. Al enviar la cotización, reflejar QUOTED en la solicitud. |
| RF-12 | A | Permitir al administrador consultar pedidos y actualizar su estado entre los valores admitidos QUEUE, PRINTING, POSTPROCESS, READY, DELIVERED y CANCELED. Verificar la persistencia del cambio y su visibilidad para el cliente. No se presupone una restricción secuencial que el código actual no define. |
| RF-13 | M | Permitir al administrador crear, editar, activar, desactivar y eliminar productos del catálogo, incluyendo sus imágenes. Validar nombre, descripción, precio >=1, materiales, colores y plazo antes de guardar. |
| RF-14 | M | Permitir al administrador administrar perfiles, rol CLIENT/ADMIN y estado activo, mostrando el resultado y los errores de persistencia. Un cliente no puede elevar su rol mediante su perfil. |
| RF-15 | M | Permitir al cliente actualizar nombre de 3–80 caracteres, teléfono opcional válido y avatar de su perfil. Los campos rol y estado activo no son editables por el cliente. |

## No funcionales

Son objetivos de aceptación; las mediciones pendientes se anotan como tales.

| ID | Objetivo medible | Verificación |
| --- | --- | --- |
| RNF-01 | Lint y suites automatizadas exitosos en cada PR antes de integrarlo. | Checks de GitHub Actions asociados al SHA revisado. |
| RNF-02 | Cobertura global de líneas >=80% según M4. El control existente exige >=90% en statements, branches, functions y lines, sin caída frente a la base. Objetivo >=95% en autenticación y negocio crítico. | Reporte V8 y comparador; analizar módulos críticos por separado. |
| RNF-03 | Al menos 50 pruebas unitarias y 20 de integración, incluyendo API/BD real aislada; M6: 5 features, 15 escenarios y 5 Page Objects. | Reportes, código y clasificación del alcance; mocks HTTP se identifican expresamente. |
| RNF-04 | Un cliente no obtiene ni cambia registros ajenos y no ejecuta operaciones de ADMIN; secretos de servicio no se entregan al navegador. | Pruebas negativas de API y políticas RLS en Supabase local. Pendiente. |
| RNF-05 | Tras un error de red o servidor, finalizar indicadores de carga, mostrar un aviso y conservar los datos necesarios para reintentar la operación. | TC-019–TC-021 y pruebas de componentes/HTTP. |
| RNF-06 | En carga local de 100 usuarios, objetivo p95 de respuesta <2 s y errores <1%; estrés y pico se analizan por separado. | JMeter: 30 s de rampa y 5 min de carga; registrar equipo, consultas y percentiles. Objetivo pendiente de medir, no un SLA demostrado. |
| RNF-07 | Flujos principales utilizables en vistas de 390×844 y 1366×768, sin ocultar controles necesarios ni errores de validación. | Revisión de sistema y capturas con viewport documentado. Pendiente ampliar. |
| RNF-08 | Un clon limpio instala con npm ci y ejecuta los comandos documentados. Reportes de CI descargables durante 14 días. | Instalación y ejecución registradas; artifacts de Actions. |

## Fuentes y límites

Los límites provienen de los formularios de
[registro](../../../src/app/features/auth/pages/register-page/register-page.component.ts),
[solicitudes](../../../src/app/features/client/pages/client-requests-page/client-requests-page.component.ts),
[cotizaciones](../../../src/app/features/admin/pages/admin-requests-page/admin-requests-page.component.ts)
y [catálogo administrativo](../../../src/app/features/admin/pages/admin-catalog-page/admin-catalog-page.component.ts).
Los roles se observan en [guards](../../../src/app/core/guards/role.guard.ts);
el carrito en [CartService](../../../src/app/core/services/cart.service.ts).
La [matriz de trazabilidad](../M3/traceability-matrix.md) enlaza cada requisito con su diseño de prueba.

Los filtros y guards del frontend no prueban autorización del backend.
Los RF-03, RF-07 y RF-09 requieren comprobar las políticas, Storage y RPC reales.
