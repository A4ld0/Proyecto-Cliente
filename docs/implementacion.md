# Plan de implementación y entrega

Entrega: **2 de diciembre de 2026**. Nombres provisionales por acuerdo del equipo.

## Roles

| Integrante | Rol principal | Entregables |
| --- | --- | --- |
| Integrante 1 | Coordinación y documentación | Propuesta, matriz, requisitos, trazabilidad, informe y coordinación de revisiones. |
| Integrante 2 | QA e integración | Unitarias, datos parametrizados, API/BD real de pruebas y desarrollo TDD junto con Integrante 4. |
| Integrante 3 | Frontend y pruebas de sistema | Gherkin, Playwright, Page Objects, capturas y demostración de los flujos. |
| Integrante 4 | DevOps y calidad | Resolución de dependencias, CI, ESLint, pre-commit, cobertura y revisión técnica. |
| Integrante 5 | Rendimiento y preparación de demo | JMeter, resultados, recomendaciones, organización de diapositivas y video de respaldo. |

Todos revisan cambios de otra persona, escriben su reflexión y participan en la presentación.
Los roles distribuyen responsabilidades; los resultados y contribuciones se registran al producirse.

## Secuencia

| Fecha objetivo | Bloque | Resultado verificable |
| --- | --- | --- |
| 26 de noviembre | Base y matriz | Rama local con main + PR #2 + PR #3, conflictos resueltos, instalación limpia y verificaciones conjuntas. Rúbrica original y matriz en el repositorio. |
| 27 de noviembre | Documentación y diseño | Requisitos, estrategia, 20 casos y trazabilidad. Guía de contribución y controles de calidad. Inicio de Supabase local y especificación TDD. |
| 28 de noviembre | Integración y BDD | Datos externos, pruebas reales de API/BD y ampliación de Gherkin/Page Objects hasta los mínimos de M6. |
| 27–30 de noviembre | TDD | Una funcionalidad nueva con pruebas escritas y ejecutadas antes de cada implementación; commits reales y registro del proceso. |
| 30 de noviembre | Rendimiento | Tres planes JMeter ejecutados en el entorno de pruebas, reportes y recomendaciones basados en mediciones. |
| 1 de diciembre | Consolidación | Informe, diapositivas, reflexiones, clon limpio, revisión de enlaces, CI y ensayo de 10–15 minutos con todos. |
| 2 de diciembre | Entrega | Matriz con evidencias, versión acordada en main, enlaces de PR/CI, materiales y presentación. |

## Integración de ramas

1. Partir de `main` actualizado en `feat/rubric-foundation`.
2. Incorporar localmente `ci/tests` y `ci/eslint`, preservando su historial.
3. Resolver `package.json` y `package-lock.json` con los scripts y dependencias de ambas ramas.
4. Ejecutar `npm ci`, lint, pruebas, comparador, cobertura, Playwright y build.
5. Publicar la propuesta de integración por PR y verificar CI sobre su SHA final.
6. Registrar revisión por otra persona y acordar la integración de los PR originales, evitando duplicar cambios.

Una revisión debe evaluar los cambios incluidos en su PR. El cumplimiento total del proyecto se
comprueba con la [matriz](rubrica.md). Cada aprobación y fusión se registra cuando realmente ocurre.

## Supabase de pruebas

Se preparará una instancia local con usuarios y registros ficticios para probar la API,
persistencia, permisos por rol y RPC. Esta instancia permitirá repetir y limpiar los datos de
forma controlada. Los mocks actuales seguirán cubriendo los errores HTTP y los flujos del frontend.

## Cierre

- Todos los comandos documentados funcionan desde un clon limpio.
- Los checks requeridos del PR están en verde y el comparador rechaza una regresión controlada.
- Los reportes distinguen simulaciones, verificaciones reales y trabajo pendiente.
- Los documentos enlazan archivos, PR y ejecuciones existentes.
- Todos los integrantes tienen una sección de la presentación y una reflexión individual.
