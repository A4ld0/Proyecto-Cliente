# M3 — Casos de prueba

Diseño: **28 casos**. A = prioridad alta; M = media. Técnicas y reglas en el
[plan](test-plan.md) y los [modelos](diagrams/decisions-and-states.md).
Datos C1, C2, ADM, P1 y Q1 en [test-data.md](../../../tests/data/test-data.md).

**Estado inicial de todos los casos: Pendiente.** Resultado real: sin ejecutar.
Ejecutor, fecha, entorno, SHA y enlace de evidencia: por completar en cada
ejecución. Este documento no convierte las suites históricas en ejecución de estos
casos completos. Al ejecutarlos, añadir debajo del caso una fila con esos campos,
resultado observado y defecto asociado; conservar las ejecuciones anteriores.

## TC-001 — Registro válido

**Requisito:** RF-01. **Técnica:** EP. **Prioridad:** A.
**Precondición:** sin sesión, correo de C1 libre en el entorno local; configuración de confirmación de correo conocida.
**Datos:** nombre `Cliente Uno`, correo único `cliente1@example.test`, contraseña `Prueba123`, teléfono vacío.

1. Abrir `/register`, completar los cuatro campos y enviar una vez.
2. Observar la respuesta y consultar el usuario/perfil creado en el entorno de pruebas.
3. Repetir con otro correo libre y teléfono `5512345678`.

**Esperado:** cuenta y perfil coherentes, rol CLIENT y teléfono correspondiente.
Si Auth devuelve sesión, navegar a `/client/dashboard`; si exige confirmación sin
sesión, navegar a `/login`. No exigir ambas respuestas en la misma configuración.
**Registro:** Pendiente.

## TC-002 — Correo vacío o mal formado

**Requisito:** RF-01. **Técnica:** EP. **Prioridad:** A.
**Precondición:** formulario sin sesión y contador de llamadas de registro observable.
**Datos:** nombre y contraseña válidos; correos `""`, `sin-arroba` y `persona@`.

1. Introducir cada correo en un formulario limpio.
2. Enviar y observar el campo y las llamadas HTTP.
3. Corregirlo a `cliente1@example.test` y comprobar que desaparece el error de formato.

**Esperado:** los valores inválidos muestran error y no llaman al registro; el
correo corregido permite continuar si los demás campos son válidos.
**Registro:** Pendiente.

## TC-003 — Límite y composición de contraseña de registro

**Requisito:** RF-01. **Técnica:** BVA y EP. **Prioridad:** A.
**Precondición:** otros campos válidos; servicio de registro controlado o correos únicos por variante.
**Datos:** `Abc1234` (7), `Abc12345` (8), `Abc123456` (9), `abcdefgh` y `12345678`.

1. Cargar cada contraseña y enviar el formulario de registro limpio.
2. Registrar validez, mensaje y cantidad de llamadas al servicio.
3. Para las entradas válidas, verificar que se entrega la contraseña completa al servicio.

**Esperado:** 7 caracteres, solo letras y solo números se rechazan sin registro;
8 y 9 con letra y número son aceptados por la validación. No se impone un máximo ausente.
**Registro:** Pendiente.

## TC-004 — Registro de correo existente

**Requisito:** RF-01. **Técnica:** EP. **Prioridad:** A.
**Precondición:** C1 ya existe; sin sesión. Documentar si Auth oculta la existencia del correo.
**Datos:** mismo correo C1 y datos válidos de registro.

1. Enviar el registro con el correo existente.
2. Observar la respuesta de Auth y el mensaje de la aplicación.
3. Consultar el número de usuarios/perfiles asociados al correo y comprobar que C1 aún inicia sesión.

**Esperado:** no crear una segunda identidad ni sobrescribir privilegios. Si
Auth devuelve error, mostrarlo y permitir reintento; si devuelve una respuesta
genérica por privacidad, no interpretarla como prueba de una segunda cuenta.
**Registro:** Pendiente.

## TC-005 — Inicio y cierre de sesión por rol

**Requisito:** RF-02. **Técnica:** EP y ST. **Prioridad:** A.
**Precondición:** C1 y ADM activos; sin sesión ni `redirectTo`.
**Datos:** credenciales sintéticas de C1 y ADM.

1. Iniciar sesión como C1 y comprobar `/client/dashboard`.
2. Cerrar sesión e intentar volver a `/client/requests` mediante URL directa.
3. Iniciar sesión como ADM, comprobar `/admin/dashboard`, cerrar e intentar `/admin/orders`.

**Esperado:** cada rol entra a su panel; cerrar elimina la sesión de la app y
las rutas protegidas requieren iniciar sesión de nuevo.
**Registro:** Pendiente.

## TC-006 — Credenciales inválidas

**Requisito:** RF-02. **Técnica:** EP. **Prioridad:** A.
**Precondición:** C1 existe, navegador sin sesión y API disponible.
**Datos:** C1 con contraseña incorrecta `Incorrecta123`; correo inexistente con contraseña de formato válido.

1. Enviar cada combinación en `/login`.
2. Observar mensaje, carga y destino.
3. Corregir a credenciales válidas de C1 y reenviar.

**Esperado:** no abrir ruta protegida ni conservar una sesión inválida; mostrar
aviso y finalizar carga. El reintento válido permite entrar.
**Registro:** Pendiente.

## TC-007 — Acceso administrativo según sesión y rol

**Requisito:** RF-03. **Técnica:** DT-02. **Prioridad:** A.
**Precondición:** perfiles CLIENT activo, ADMIN activo e inactivo disponibles.
**Datos:** cuatro filas A1–A4 de DT-02; URL `/admin/orders`.

1. Abrir la URL sin sesión.
2. Repetir con CLIENT activo, ADMIN activo y usuario con perfil inactivo.
3. Registrar destino, sesión resultante y visibilidad de controles administrativos.

**Esperado:** A1 va a login; A2 cierra/deniega; A3 vuelve al panel de cliente;
A4 permite acceso. El resultado del guard se complementa con API real en TC-028.
**Registro:** Pendiente.

## TC-008 — Catálogo, filtros y ausencia de resultados

**Requisito:** RF-04. **Técnica:** EP. **Prioridad:** A.
**Precondición:** catálogo de pruebas con P1 activo, otro producto activo con material/color diferentes y uno inactivo; respuesta normal de API.
**Datos:** P1 PLA/PETG y Negro/Blanco a $120; filtros PETG, Blanco y precio máximo 119/120.

1. Abrir `/catalogo` y comprobar productos visibles y datos de referencia.
2. Filtrar por material y color; comprobar las combinaciones con y sin coincidencias.
3. Fijar máximo 119, luego 120 y finalmente restablecer los filtros.

**Esperado:** solo productos activos del catálogo cargado; filtros reducen las
coincidencias; máximo 119 excluye P1 y 120 lo incluye; estado vacío sin errores
cuando no hay resultados; limpiar restaura
la lista. Un catálogo de respaldo no acredita persistencia del catálogo remoto.
**Registro:** Pendiente.

## TC-009 — Variantes, total y persistencia del carrito

**Requisito:** RF-05. **Técnica:** EP y ST. **Prioridad:** A.
**Precondición:** carrito vacío y P1 disponible.
**Datos:** P1/PLA/Negro a $120; P1/PLA/Blanco a $120.

1. Añadir dos veces la variante negra y una vez la blanca.
2. Comprobar dos filas, cantidades 2 y 1, contador 3 y total $360.
3. Recargar; eliminar la variante blanca; comprobar contador 2 y total $240.
4. Generar el texto para cotizar y después vaciar el carrito y recargar.

**Esperado:** las variantes se conservan y calculan correctamente; el texto
incluye producto, material, color y cantidad; tras vaciar, contador y total quedan en cero.
**Registro:** Pendiente.

## TC-010 — Límites del título de solicitud

**Requisito:** RF-06. **Técnica:** BVA. **Prioridad:** A.
**Precondición:** C1 autenticado; descripción válida y sin archivo; formulario limpio por variante.
**Datos:** títulos de 2, 3, 80 y 81 letras `A`; tipo GENERAL_3D.

1. Introducir cada título con descripción `Pieza para prueba local`.
2. Enviar y registrar validación y llamadas de creación.
3. Para títulos aceptados, consultar la solicitud persistida del cliente.

**Esperado:** 2 y 81 se rechazan sin crear; 3 y 80 se admiten y crean una sola
solicitud propia PENDING con el título completo.
**Registro:** Pendiente.

## TC-011 — Límites de descripción de solicitud

**Requisito:** RF-06. **Técnica:** BVA. **Prioridad:** A.
**Precondición:** C1 autenticado; título válido; formulario limpio por variante.
**Datos:** descripciones de 9, 10, 500 y 501 letras `D`; título `Pieza QA`, tipo CUTTER.

1. Completar y enviar cada variante.
2. Observar errores y llamadas al servicio.
3. Consultar contenido y tipo de las solicitudes aceptadas.

**Esperado:** 9 y 501 no crean registros; 10 y 500 se aceptan y conservan
descripción y tipo completos sin truncar.
**Registro:** Pendiente.

## TC-012 — Particiones de tipo de adjunto

**Requisito:** RF-07. **Técnica:** EP. **Prioridad:** A.
**Precondición:** formulario válido de C1, selector limpio por variante.
**Datos:** PNG, JPEG, WEBP y STL sintéticos <1 MiB; `.STL` con MIME genérico; PDF no admitido.

1. Seleccionar cada archivo y comprobar selección o mensaje de error.
2. En las variantes admitidas, enviar y consultar referencia del archivo.
3. Comprobar vista previa en imágenes y clasificación STL en los modelos.

**Esperado:** formatos admitidos se adjuntan con metadatos correctos; la extensión
STL se reconoce sin distinguir mayúsculas; PDF se rechaza sin subirlo.
**Registro:** Pendiente.

## TC-013 — Límite exacto de tamaño de adjunto

**Requisito:** RF-07. **Técnica:** BVA. **Prioridad:** A.
**Precondición:** C1 autenticado; tipo permitido; formulario limpio por variante.
**Datos:** objetos de archivo `pieza.stl` de 20 971 519, 20 971 520 y 20 971 521 bytes.

1. Generar cada archivo localmente y verificar su tamaño en bytes.
2. Seleccionarlo y observar validación; enviar las dos variantes admitidas en el entorno aislado.
3. Comprobar que la variante excedida no produce llamada a Storage.

**Esperado:** límite −1 y límite exacto se admiten; límite +1 muestra error
y no se sube. Para prueba de validador basta un File sintético; Storage se prueba
aparte con un archivo real compatible con la política del bucket.
**Registro:** Pendiente.

## TC-014 — Teléfono opcional y límites

**Requisito:** RF-01, RF-15. **Técnica:** BVA y EP. **Prioridad:** A.
**Precondición:** registro o perfil abierto; demás campos válidos.
**Datos:** vacío; cadenas de dígitos de 6, 7, 20 y 21 caracteres; `55ABC123`.

1. Cargar cada valor en registro y perfil, en formularios independientes.
2. Enviar y registrar validación, mensaje y llamada de guardado.
3. Consultar los valores admitidos en el backend local cuando se ejecute integración.

**Esperado:** vacío, 7 y 20 se aceptan; 6, 21 y letras se rechazan sin guardar.
No se exige que el teléfono sea un número móvil de un país específico.
**Registro:** Pendiente.

## TC-015 — Envío simultáneo de solicitud

**Requisito:** RF-06, RF-07. **Técnica:** DT. **Prioridad:** A.
**Precondición:** C1, formulario y adjunto válidos; respuesta de creación retenida temporalmente.
**Datos:** `Solicitud simultánea QA`, descripción válida y PNG pequeño.

1. Enviar y, antes de recibir respuesta, volver a pulsar el botón o invocar el mismo envío.
2. Liberar la respuesta; completar subida y asociación de archivo.
3. Contar llamadas y registros creados para esa entrada.

**Esperado:** con guardado activo, el segundo envío no inicia otra operación;
una solicitud y una subida para el intento completado. No equivale a garantizar
idempotencia entre pestañas distintas, que requiere control del servidor.
**Registro:** Pendiente.

## TC-016 — Aceptación, rechazo y cancelación de confirmación

**Requisito:** RF-09, RF-10. **Técnica:** DT-01 y ST-01. **Prioridad:** A.
**Precondición:** C1 tiene tres cotizaciones propias SENT vigentes e independientes, sin pedidos asociados.
**Datos:** Q1 para aceptar, Q2 para rechazar y Q3 para cancelar el diálogo.

1. Aceptar Q1 y confirmar; consultar cotización y pedido por API local.
2. Rechazar Q2 y confirmar; consultar cotización y número de pedidos.
3. Abrir aceptación de Q3 y cancelar; observar llamadas y estado.

**Esperado:** Q1 ACCEPTED y exactamente un pedido propio asociado; Q2 REJECTED
sin pedido nuevo; Q3 SENT sin RPC. Los mensajes corresponden al resultado confirmado.
**Registro:** Pendiente.

## TC-017 — Decisiones inválidas o concurrentes

**Requisito:** RF-09. **Técnica:** DT-01 y ST-01. **Prioridad:** A.
**Precondición:** cotizaciones vigentes en DRAFT, ACCEPTED, REJECTED y EXPIRED; un ID obsoleto y otra SENT con RPC retenida.
**Datos:** filas D3, D4 y D5 de DT-01.

1. Intentar aceptar y rechazar cada estado no SENT y el ID obsoleto.
2. Iniciar aceptación de la SENT; antes de responder, intentar aceptar y rechazar de nuevo.
3. Liberar la respuesta y volver a intentar decidir la aceptada.

**Esperado:** ninguna RPC para estados/ID inválidos; solo la primera RPC durante
la operación en curso; después del éxito, se bloquea una nueva decisión.
**Registro:** Pendiente.

## TC-018 — Persistencia de decisión y consulta posterior

**Requisito:** RF-08, RF-09, RF-10. **Técnica:** ST. **Prioridad:** A.
**Precondición:** TC-016 completado en Supabase local; sesión C1.
**Datos:** IDs de Q1/Q2 y pedido de Q1 registrados en esa ejecución.

1. Recargar `/client/requests` y comprobar decisiones recuperadas del servidor.
2. Abrir `/client/orders`, cerrar sesión e iniciar como C1 de nuevo.
3. Consultar otra vez cotizaciones y pedido por interfaz y API.

**Esperado:** decisiones conservadas, mismo ID de pedido de Q1 y sin duplicados;
Q2 no produce pedido. El resultado no depende solo del estado en memoria del navegador.
**Registro:** Pendiente.

## TC-019 — Error de red en inicio de sesión

**Requisito:** RF-02, RNF-05. **Técnica:** error y EP. **Prioridad:** A.
**Precondición:** sin sesión; credenciales válidas; fallo de red controlado solo para la petición de login.
**Datos:** C1; petición abortada o HttpErrorResponse de estado 0.

1. Enviar credenciales y provocar el error.
2. Observar mensaje y finalización de carga.
3. Restablecer la red y enviar las mismas credenciales.

**Esperado:** aviso recuperable sin sesión falsa; el botón deja de estar ocupado
y el reintento permite acceder. Conservar log del fallo controlado.
**Registro:** Pendiente.

## TC-020 — Fallo de archivo y reintento de solicitud

**Requisito:** RF-06, RF-07, RNF-05. **Técnica:** error y ST. **Prioridad:** A.
**Precondición:** C1; formulario con archivo válido. Creación exitosa y fallo controlado en subida o asociación posterior.
**Datos:** ejecutar por separado: Storage falla antes de completar; Storage tiene éxito y falla la actualización de metadatos.

1. Enviar y provocar cada fallo tras crear la solicitud.
2. Registrar ID, número de subidas completadas, borrador y mensaje.
3. Reintentar sin modificar los datos; consultar la solicitud y el archivo finales.

**Esperado:** se conserva el borrador e ID; el reintento no crea otra solicitud;
una subida ya completada no se repite para reparar solo los metadatos. Se limpia
el formulario/carrito únicamente tras completar la operación.
**Registro:** Pendiente.

## TC-021 — Error 500 al decidir cotización

**Requisito:** RF-09, RNF-05. **Técnica:** error y ST-01. **Prioridad:** A.
**Precondición:** Q1 SENT propia; la RPC responde 500 sin ejecutar la transacción.
**Datos:** fallo simulado antes de efectos persistentes y posterior respuesta exitosa.

1. Confirmar aceptación y devolver 500.
2. Comprobar mensaje, estado y bloqueo liberado.
3. Reintentar con respuesta exitosa y consultar el pedido.

**Esperado:** primer intento no muestra éxito ni cambia SENT localmente;
segundo intento puede completarse. Para una respuesta perdida después de ejecutar
la transacción, verificar por API la unicidad antes de asumir que no hubo efectos.
**Registro:** Pendiente.

## TC-022 — Edición, eliminación y cancelación por estado

**Requisito:** RF-08. **Técnica:** DT-03 y ST. **Prioridad:** A.
**Precondición:** C1 con solicitudes independientes en los cinco estados de DT-03.
**Datos:** una PENDING para editar, otra para eliminar; IN_REVIEW y QUOTED para cancelar.

1. Verificar disponibilidad de acciones en cada estado de la tabla.
2. Editar la PENDING y recargar; cancelar primero un diálogo de eliminación y luego confirmar la eliminación de la otra PENDING.
3. Cancelar IN_REVIEW y QUOTED previa confirmación; recargar.

**Esperado:** edición persistida; cancelar el diálogo no elimina; confirmar sí;
cancelaciones persisten CANCELED. No se ofrecen acciones prohibidas en los otros estados.
**Registro:** Pendiente.

## TC-023 — Cotización administrativa y validación de precio

**Requisito:** RF-11. **Técnica:** EP y BVA. **Prioridad:** A.
**Precondición:** ADM activo; solicitud de C1 PENDING sin cotización.
**Datos:** precio 0 y luego 250; plazo 0 y luego 3; nota `Cotización QA`.

1. Abrir revisión de la solicitud y comprobar cambio a IN_REVIEW.
2. Intentar guardar precio 0 y plazo 0; corregir a 250 y 3 y enviar SENT.
3. Recargar y abrir como C1 para consultar la cotización.

**Esperado:** valores inferiores a 1 no se guardan; cotización válida asociada
a solicitud y administrador, precio/plazo correctos; solicitud QUOTED y visible a su cliente.
**Registro:** Pendiente.

## TC-024 — Cambio de estado de pedido y vista del cliente

**Requisito:** RF-10, RF-12. **Técnica:** ST y EP. **Prioridad:** A.
**Precondición:** ADM y C1 en sesiones separadas; pedido local de C1 en QUEUE.
**Datos:** estados PRINTING, POSTPROCESS, READY y DELIVERED; otro pedido para CANCELED.

1. Actualizar como ADM cada estado y observar la vista abierta de C1.
2. Tras cada actualización, recargar y consultar el pedido por API.
3. Cancelar el pedido independiente y comprobar su visualización.

**Esperado:** estados confirmados se persisten y se reflejan para C1 mediante
actualización o recarga; ninguna modificación afecta otro pedido. No se exige
rechazo de saltos entre estados hasta especificar esa regla de negocio.
**Registro:** Pendiente.

## TC-025 — Administración de catálogo

**Requisito:** RF-13, RF-04. **Técnica:** EP. **Prioridad:** M.
**Precondición:** ADM activo, bucket de catálogo local disponible y producto único para esta prueba.
**Datos:** P1, imagen sintética, materiales PLA/PETG, colores Negro/Blanco y precio 120.

1. Crear producto válido, editar su descripción y recargar.
2. Consultarlo en el catálogo público; desactivarlo y comprobar que deja de formar parte del catálogo activo.
3. Reactivarlo y eliminarlo previa confirmación; consultar ausencia por API.
4. Intentar crear otro con nombre vacío y precio 0.

**Esperado:** cambios válidos persisten; visibilidad respeta activo/inactivo;
eliminación afecta solo ese producto; datos inválidos no crean registros.
**Registro:** Pendiente.

## TC-026 — Roles y estado de perfiles administrados

**Requisito:** RF-14, RF-03. **Técnica:** EP. **Prioridad:** M.
**Precondición:** ADM activo y perfil de prueba descartable; conservar otro administrador activo.
**Datos:** perfil C2 con roles CLIENT/ADMIN y estado activo/inactivo.

1. Como ADM, editar teléfono y rol del perfil descartable y recargar.
2. Cambiarlo a inactivo; intentar navegar con una sesión de ese usuario.
3. Restablecerlo a CLIENT activo y comprobar acceso correspondiente.

**Esperado:** cambios autorizados persisten; guard deniega perfil inactivo;
la restauración recupera acceso. TC-028 verifica que CLIENT no pueda cambiar roles por API.
**Registro:** Pendiente.

## TC-027 — Perfil propio y límites de nombre

**Requisito:** RF-15. **Técnica:** EP y BVA. **Prioridad:** M.
**Precondición:** C1, perfil y bucket de avatar locales disponibles.
**Datos:** nombres de 2, 3, 80 y 81 caracteres; teléfono válido y PNG sintético.

1. Intentar guardar cada longitud en un formulario limpio.
2. Con nombre válido, cambiar teléfono/avatar, guardar y recargar.
3. Comprobar que rol y estado activo son campos deshabilitados y mantienen sus valores.

**Esperado:** 2 y 81 rechazados; 3 y 80 aceptados; datos permitidos persistidos;
el cliente no modifica sus privilegios. La API negativa se verifica en TC-028.
**Registro:** Pendiente.

## TC-028 — Aislamiento entre clientes y operaciones administrativas por API

**Requisito:** RF-03, RF-08, RF-10, RF-14. **Técnica:** EP y DT. **Prioridad:** A.
**Precondición:** Supabase local real con RLS; C1/C2 tienen solicitudes, cotizaciones y pedidos distintos; tokens de ambos clientes y ADM.
**Datos:** IDs de C2 conocidos por C1; payload que intenta cambiar rol de C1 a ADMIN.

1. Con token C1, consultar y modificar IDs de C2 directamente por REST, omitiendo la interfaz.
2. Intentar decidir una cotización ajena por RPC y crear/editar catálogo o elevar el rol propio.
3. Verificar mediante ADM que los registros originales no cambiaron; repetir lecturas propias válidas.

**Esperado:** lectura ajena no devuelve registros; escritura/RPC administrativa
se deniega o no afecta filas según el contrato de RLS; no se crea pedido ajeno ni
se elevan privilegios. Las operaciones propias autorizadas siguen funcionando.
Un HTTP 200 con cero filas puede ser correcto para RLS: verificar datos y efectos,
no solo el código de estado. **Registro:** Pendiente.
