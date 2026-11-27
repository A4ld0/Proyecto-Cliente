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
| R2: revisiones (3) | Integrantes 1 y 4 | Verificado en GitHub | [Aprobación de #2](https://github.com/A4ld0/Proyecto-Cliente/pull/2#pullrequestreview-6082846239), [aprobación de #3](https://github.com/A4ld0/Proyecto-Cliente/pull/3#pullrequestreview-6082874805). | Ambos aprobados por Luis-045 y fusionados en main el 26 de noviembre: #2 con tres checks exitosos y #3 con seis. |
| R3: análisis estático (4) | Integrante 4 | Verificado en main | [ESLint](../eslint.config.js), [workflow Lint](../.github/workflows/lint.yml), [ejecución exitosa](https://github.com/A4ld0/Proyecto-Cliente/actions/runs/45930941644). | Mantener el check en cada PR y volver a verificarlo cuando cambie la versión revisada. |
| R4: unitarias e integración (5) | Integrante 2 | Verificado en main; ampliación M4 pendiente | [Pruebas de aplicación](../src/app/), [workflow Tests](../.github/workflows/tests.yml), [ejecución exitosa](https://github.com/A4ld0/Proyecto-Cliente/actions/runs/45930941593). | Las 124 pruebas están integradas. Las integraciones actuales usan componentes, servicios y HTTP simulado; la BD real de M4 se evalúa aparte. Los nuevos artifacts se verificarán en el PR de seguimiento. |
| R5: cobertura (3) | Integrante 4 | Check verificado en main; reportes nuevos pendientes de CI | [Workflow](../.github/workflows/coverage.yml), [comparador](../scripts/check-coverage.mjs), [pruebas del comparador](../scripts/check-coverage.test.mjs), [ejecución exitosa](https://github.com/A4ld0/Proyecto-Cliente/actions/runs/45930941681). | El check compara base/PR y rechaza caídas o valores menores a 90%. Las 12 verificaciones y el guardado de artifacts se verifican también en el PR de seguimiento. |
| R6: sistema (5) | Integrante 3 | Verificado en main; ampliación M6 pendiente | [Gherkin](../system-tests/printlab.feature), [steps](../system-tests/printlab.steps.ts), [workflow](../.github/workflows/system-tests.yml), [ejecución exitosa](https://github.com/A4ld0/Proyecto-Cliente/actions/runs/45930941600). | Cuatro escenarios BDD aprobados con Supabase simulado. El PR de seguimiento añade los reportes HTML/JUnit; M6 todavía requiere ampliar escenarios y Page Objects. |
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
