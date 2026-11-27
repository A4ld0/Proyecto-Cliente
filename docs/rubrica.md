# Matriz de cumplimiento

Fecha de revisión: 26 de noviembre de 2026. Entrega: **2 de diciembre de 2026**.

Fuentes: [rúbrica de 30 puntos](rubricas/README.md) y
[guía general M1–M7](https://github.com/jp-garduno/software-testing-fall-2026/tree/main/team-project).
La verificación local acredita una ejecución en la copia de trabajo. Un criterio que requiere
Actions, aprobación o presentación permanece pendiente hasta tener esa evidencia.

## Rúbrica de entrega

| ID | Responsable | Estado | Evidencia disponible | Condición para cerrar |
| --- | --- | --- | --- | --- |
| R1: documentación (5) | Integrante 1 | En revisión | [Documentación](../DOCUMENTACION.md), [README](../README.md), [14 capturas](capturas/), [guía de pruebas](pruebas.md). | Verificar los ocho apartados y sus enlaces en la rama publicada. |
| R2: revisiones (3) | Integrantes 1 y 4 | Pendiente | [PR #2](https://github.com/A4ld0/Proyecto-Cliente/pull/2), [PR #3](https://github.com/A4ld0/Proyecto-Cliente/pull/3). | Registrar revisión aprobada por otra persona del equipo y CI exitoso sobre la versión revisada. Ambos PR estaban sin aprobaciones en la revisión del 26 de noviembre. |
| R3: análisis estático (4) | Integrante 4 | Implementado; pendiente CI de la integración | [ESLint](../eslint.config.js), [workflow Lint](../.github/workflows/lint.yml). | ESLint pasa sobre la combinación final y queda una ejecución exitosa del PR. |
| R4: unitarias e integración (5) | Integrante 2 | Implementado; pendiente CI de la integración | [Pruebas de aplicación](../src/app/), [workflow Tests](../.github/workflows/tests.yml). | Pruebas exitosas y reporte del PR. Las integraciones actuales son entre componentes, servicios y HTTP simulado; la BD real de M4 se evalúa aparte. |
| R5: cobertura (3) | Integrante 4 | Implementado; pendiente CI de la integración | [Workflow Coverage](../.github/workflows/coverage.yml), [comparador](../scripts/check-coverage.mjs), [pruebas del comparador](../scripts/check-coverage.test.mjs). | Demostrar que una disminución falla, conservar la comparación exacta base/PR y guardar el reporte. El mínimo de 90% es una regla del proyecto. |
| R6: sistema (5) | Integrante 3 | Implementado; ampliación M6 pendiente | [Gherkin](../system-tests/printlab.feature), [steps](../system-tests/printlab.steps.ts), [workflow](../.github/workflows/system-tests.yml). | Escenarios BDD exitosos, reporte HTML y evidencia de ejecución. Los cuatro escenarios existentes usan Supabase simulado. |
| R7: presentación (5) | Todo el equipo | Pendiente | [Roles y cronograma](implementacion.md). | Materiales, ensayo y participación real de los cinco integrantes. |

## Entregables adicionales de la guía general

| Hito | Responsable | Estado | Trabajo pendiente y aceptación |
| --- | --- | --- | --- |
| M1: propuesta | Integrante 1 | Parcial | Formalizar requisitos identificados, arquitectura, esquema, riesgos y cronograma. Los nombres se mantienen como Integrante 1–5 por acuerdo del equipo. |
| M2: base y proceso | Integrante 4 | Parcial | Pre-commit, contribución, plantilla de PR y protección de ramas. La configuración remota debe verificarse con una cuenta autorizada. |
| M3: caja negra | Integrantes 1 y 2 | Pendiente | Estrategia, plan, al menos 20 casos, EP/BVA, tabla de decisiones, transiciones, datos y trazabilidad. |
| M4: caja blanca | Integrante 2 | Parcial | Conservar cobertura global >=80%, mínimo 50 unitarias y 20 integraciones; añadir integración real de API/BD aislada y documentar cobertura y bugs. Los nombres de los archivos no prueban por sí solos integración real. |
| M5: TDD | Integrantes 2 y 4 | Pendiente | Especificar una funcionalidad nueva y registrar ciclos reales Red–Green–Refactor con al menos 15 commits y retrospectiva. |
| Datos parametrizados | Integrante 2 | Parcial | Ya existe `it.each`; incorporar y consumir datos externos CSV/JSON. |
| M6: sistema | Integrante 3 | Parcial | Ampliar de 1 feature y 4 escenarios a 5 features, 15 escenarios y 5 Page Objects; generar reporte y capturas. |
| M7: rendimiento y entrega | Integrante 5 | Pendiente | Planes JMeter de carga, estrés y picos, resultados y recomendaciones; informe de 15–20 páginas, presentación de 12–15 diapositivas y reflexión individual. |

## Evidencia y actualización

- [Reporte histórico del 21 de noviembre](reportes/2026-11-21.md): evidencia de las ramas originales.
- [Verificación de la integración del 26 de noviembre](reportes/2026-11-26.md): 124 pruebas, 12 verificaciones del comparador, cuatro escenarios BDD y compilación local.
- [Guía para ejecutar y consultar resultados](pruebas.md): comandos reproducibles y ubicación de reportes.
- Añadir a cada cierre el enlace del PR, el SHA revisado, la ejecución de CI y la revisión aprobada.
- Actualizar esta tabla al terminar cada bloque del [plan](implementacion.md).
- Las pruebas reales usarán un entorno local de Supabase con datos ficticios; su ejecución queda pendiente de preparar e iniciar ese entorno.
