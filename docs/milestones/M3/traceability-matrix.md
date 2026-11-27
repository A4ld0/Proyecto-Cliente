# M3 — Matriz de trazabilidad

Esta tabla mide **cobertura del diseño**. Cada requisito tiene casos detallados;
las suites indicadas sirven como punto de partida para automatizarlo. Su enlace
no significa que cubran todas las variantes ni que los casos se hayan ejecutado.

| Requisito | Prioridad | Casos diseñados | Automatización relacionada / ampliación |
| --- | --- | --- | --- |
| RF-01 | A | TC-001–TC-004, TC-014 | `auth-pages.spec.ts`, `registration-data.spec.ts`; duplicados y persistencia real pendientes. |
| RF-02 | A | TC-005, TC-006, TC-019 | `auth.service.spec.ts`, `auth-pages.spec.ts`; sesión real por ampliar. |
| RF-03 | A | TC-007, TC-028 | `role.guard.spec.ts`; RLS/API real pendiente. |
| RF-04 | A | TC-008 | `catalog-navigation.spec.ts`, Gherkin actual; catálogo real por ampliar. |
| RF-05 | A | TC-009 | `cart.service.spec.ts`, Gherkin actual. |
| RF-06 | A | TC-010, TC-011, TC-015, TC-020 | `client-requests-page.component.integration.spec.ts`; persistencia real pendiente. |
| RF-07 | A | TC-012, TC-013, TC-015, TC-020 | Integración de solicitudes con HTTP simulado; Storage real pendiente. |
| RF-08 | A | TC-018, TC-022, TC-028 | Integración de solicitudes; estados y permisos en API real pendientes. |
| RF-09 | A | TC-016–TC-018, TC-021 | Integración de solicitudes y `services.spec.ts`; atomicidad RPC real pendiente. |
| RF-10 | A | TC-016, TC-018, TC-024, TC-028 | `client-pages.spec.ts`, `orders.service.integration.spec.ts`; lectura real pendiente. |
| RF-11 | A | TC-023 | `admin-management.spec.ts`; verificar efectos persistentes. |
| RF-12 | A | TC-024 | `admin-management.spec.ts`; propagación real pendiente. |
| RF-13 | M | TC-025 | `admin-management.spec.ts`; Storage y catálogo público real pendientes. |
| RF-14 | M | TC-026, TC-028 | `admin-management.spec.ts`; autorización real pendiente. |
| RF-15 | M | TC-014, TC-027 | `client-pages.spec.ts`; persistencia y avatar real pendientes. |

Requisitos de prioridad alta trazados: **12/12 = 100%**. Requisitos totales
trazados: **15/15 = 100%**. Casos completos de este diseño ejecutados: **0/28**
al crear el documento; su registro permanece pendiente. Los resultados históricos
de la aplicación se conservan aparte en [reportes](../../reportes/2026-11-26.md).

Rutas de automatización:

- [Autenticación](../../../src/app/features/auth/), [guards](../../../src/app/core/guards/) y [servicios](../../../src/app/core/services/).
- [Cliente](../../../src/app/features/client/) y [administración](../../../src/app/features/admin/).
- [Catálogo](../../../src/app/features/catalog/) y [BDD](../../../system-tests/).
- [Datos externos y uso](../../../tests/data/test-data.md).

## Calidad

| Objetivo | Evidencia / caso |
| --- | --- |
| RNF-01 y RNF-08 | Workflows y artifacts del SHA del PR, instalación documentada. |
| RNF-02 | Reporte de cobertura y 12 pruebas del comparador. |
| RNF-03 | Conteos y clasificación de las suites; ampliaciones M4/M6 pendientes. |
| RNF-04 | TC-007 y TC-028, especialmente backend real. |
| RNF-05 | TC-019–TC-021. |
| RNF-06 | Planes y mediciones de M7 pendientes. |
| RNF-07 | Revisión de viewports en M6 pendiente. |
