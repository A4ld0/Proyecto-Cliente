# M3 — Plan de pruebas de caja negra

## Funciones, prioridad y técnicas

EP = particiones de equivalencia; BVA = valores límite; DT = tabla de decisiones;
ST = transición de estados. Las prioridades proceden de [M1](../M1/requirements.md).

| Requisito | Prioridad | Técnicas | Casos |
| --- | --- | --- | --- |
| RF-01 Registro | A | EP, BVA | TC-001–TC-004, TC-014 |
| RF-02 Sesión | A | EP, ST, errores | TC-005, TC-006, TC-019 |
| RF-03 Autorización | A | DT, EP | TC-007, TC-028 |
| RF-04 Catálogo público | A | EP | TC-008 |
| RF-05 Carrito | A | EP, ST | TC-009 |
| RF-06 Crear solicitud | A | BVA, DT, errores | TC-010, TC-011, TC-015, TC-020 |
| RF-07 Adjuntos | A | EP, BVA, errores | TC-012, TC-013, TC-015, TC-020 |
| RF-08 Solicitudes propias | A | DT, ST | TC-018, TC-022, TC-028 |
| RF-09 Decidir cotización | A | DT, ST, errores | TC-016–TC-018, TC-021 |
| RF-10 Consultar pedidos | A | ST, EP | TC-016, TC-018, TC-024, TC-028 |
| RF-11 Cotizar como ADMIN | A | EP | TC-023 |
| RF-12 Administrar pedidos | A | ST, EP | TC-024 |
| RF-13 Administrar catálogo | M | EP | TC-025 |
| RF-14 Administrar perfiles | M | EP | TC-026 |
| RF-15 Editar perfil propio | M | BVA, EP | TC-014, TC-027 |

## Particiones y límites

| Entrada | Particiones / límites | Casos |
| --- | --- | --- |
| Correo | Vacío, mal formado, válido libre, válido ya registrado. | TC-001, TC-002, TC-004 |
| Contraseña de registro | Sin letra, sin número, válida; 7, 8 y 9 caracteres. No se inventa un máximo ausente. | TC-003 |
| Nombre | 2, 3, 80 y 81 caracteres. | Datos externos de RF-01 y TC-027 |
| Título de solicitud | 2, 3, 80 y 81 caracteres. | TC-010 |
| Descripción | 9, 10, 500 y 501 caracteres. | TC-011 |
| Tipo de adjunto | PNG, JPEG, WEBP, MIME STL y extensión `.STL`; PDF no admitido. | TC-012 |
| Tamaño de adjunto | 20 MiB −1, 20 MiB y 20 MiB +1 bytes. | TC-013 |
| Teléfono opcional | Vacío válido; 6, 7, 20 y 21 caracteres permitidos; letras no admitidas. | TC-014 |
| Acceso | Sin sesión, CLIENT, ADMIN y perfil inactivo; dueño/otro cliente. | TC-007, TC-028 |
| Cotización | Vigente SENT, pendiente de respuesta, obsoleta, ACCEPTED, REJECTED, DRAFT y EXPIRED. | TC-016–TC-018, TC-021 |

Se diseñan 28 [casos detallados](test-cases.md), incluyendo al menos cinco con EP,
cinco con BVA, dos tablas de decisiones y dos diagramas de estado en
[modelos de decisión y estados](diagrams/decisions-and-states.md).

## Preparación y datos

Los datos externos están en [tests/data](../../../tests/data/test-data.md).
Se usan dos clientes para probar aislamiento y un administrador ficticio. Cada
caso parte de su estado indicado; las decisiones aceptada y rechazada usan
cotizaciones diferentes. Los casos destructivos se ejecutan en Supabase local.

En el nivel simulado, interceptar respuestas no demuestra persistencia ni RLS.
La prueba que requiere backend permanece pendiente o bloqueada hasta disponer
de ese entorno; no se sustituye su resultado por el de una prueba con mocks.

## Orden y responsables

1. Integrante 2 verifica instalación, datos y autenticación (TC-001–TC-007).
2. Integrantes 2 y 3 ejecutan catálogo, carrito, validaciones y adjuntos (TC-008–TC-015).
3. Integrantes 2 y 3 ejecutan estados y recuperación (TC-016–TC-022).
4. Integrante 2 verifica administración y aislamiento real (TC-023–TC-028).
5. Integrante 4 conserva logs/artifacts y el SHA; Integrante 1 actualiza matriz y defectos.

Las fechas objetivo están en [planificación](../M1/planning.md). Se repite un caso
al corregir su defecto o modificar una dependencia que pueda alterar su resultado.

## Registro y aceptación

Cada caso contiene resultado real, estado, responsable, fecha, entorno y evidencia.
Para una batería de datos se registran sus subcasos; el caso se aprueba cuando
todas sus variantes satisfacen el resultado esperado. `Pendiente` es diseño sin
ejecutar; `Bloqueado` indica una precondición faltante durante una ejecución intentada.

La salida se decide con la [estrategia](test-strategy.md). La
[trazabilidad](traceability-matrix.md) acredita cobertura del diseño, no porcentaje
de código ni aprobación de los casos.
