# Planificación y riesgos

Entrega: **2 de diciembre de 2026**. Responsables y calendario común en el
[plan de implementación](../../implementacion.md).

| Fecha objetivo | Resultado | Dependencia |
| --- | --- | --- |
| 26 de noviembre | Lint, pruebas, cobertura y reportes integrados por los PR #2, #3 y #4. | Completado; enlaces en la matriz. |
| 27 de noviembre | M1–M3 documentados, datos externos, hooks y entorno local iniciado. | Revisión de requisitos y motor Docker disponible. |
| 28 de noviembre | Integración real y ampliación BDD/POM. | Migraciones y datos ficticios del backend de pruebas. |
| 27–30 de noviembre | Funcionalidad nueva con ciclos TDD y al menos 15 commits reales. | Especificación pequeña y comprobable; conservar ejecuciones RED y GREEN. |
| 30 de noviembre | JMeter: carga, estrés y pico con reportes. | Backend local estable; registrar recursos de la máquina. |
| 1 de diciembre | Informe de 15–20 páginas, 12–15 diapositivas, video y ensayo. | Evidencias verificadas y participación de todos. |
| 2 de diciembre | Entrega y exposición. | CI final en verde y materiales accesibles. |

## Riesgos

| Riesgo | Probabilidad / impacto | Mitigación y responsable |
| --- | --- | --- |
| Quedan pocos días y se intenta cerrar todo en un único PR. | Alta / alto | Bloques pequeños con aceptación verificable y prioridades de la matriz. Integrante 1. |
| Las pruebas HTTP simuladas se interpretan como prueba de RLS o BD real. | Alta / alto | Etiquetar su alcance y añadir API/BD local con persistencia y casos negativos. Integrante 2. |
| El esquema desplegado y el modelo inferido no coinciden. | Media / alto | Cotejar migraciones y RPC; registrar diferencias. No presentar el diagrama preliminar como dump del servidor. Integrantes 2 y 4. |
| Docker o imágenes de Supabase requieren recursos o tiempo de descarga. | Media / alto | Verificar el motor pronto, fijar CLI y documentar inicio/limpieza. Integrante 4. |
| Las pruebas de carga afectan datos reales. | Baja / alto | Ejecutar en el entorno local con usuarios sintéticos y limitar explícitamente el destino. Integrante 5. |
| CI está en verde pero no se conservan reportes al entregar. | Media / medio | Artifacts por 14 días y enlaces al SHA; descargar evidencias definitivas antes de que expiren. Integrante 4. |
| La cobertura alta oculta reglas de negocio sin comprobar. | Media / alto | Trazabilidad, límites, errores y revisión de aserciones además del porcentaje. Integrante 2. |
| TDD se documenta después de implementar y pierde evidencia RED. | Media / alto | Elegir una funcionalidad aún no implementada y registrar ciclos contemporáneos, sin reconstruir historial. Integrantes 2 y 4. |
| Nombres, contactos, licencia o permisos remotos quedan sin confirmar. | Media / medio | Marcar pendientes y pedir los datos al cerrar la entrega; solo el titular define la licencia. Integrante 1. |

## Control de cambios

Cada cambio sale de `main` actualizado en una rama temática, enlaza requisitos,
incluye validación y se integra por PR revisado con CI verde. Los requisitos
modificados actualizan también los casos y la trazabilidad. Si se utiliza `develop`,
debe aplicarse el mismo proceso antes de integrar su PR hacia `main`.

Un documento diseñado puede revisarse antes de ejecutar sus casos. El estado de
ejecución se registra con fecha, entorno, responsable y evidencia; no se deduce
del número de casos ni del estado de otro PR.
