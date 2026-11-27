# M1 — Propuesta de PrintLab 3D

Equipo: **PrintLab QA**. Entrega: **2 de diciembre de 2026**.
El profesor autorizó reutilizar Angular + Supabase, según la confirmación del equipo.
Las pruebas y evidencias de esta materia se documentan en este repositorio.

## Equipo y responsabilidades

Los nombres se mantienen provisionales por indicación del equipo. Matrículas,
correos y cuentas de GitHub quedan pendientes de que cada integrante los complete.

| Integrante | Rol | Responsabilidad |
| --- | --- | --- |
| Integrante 1 | Coordinación y documentación | Mantiene requisitos, riesgos y trazabilidad. Coordina revisiones y consolida el informe con evidencias reales. |
| Integrante 2 | QA e integración | Diseña y ejecuta pruebas de servicios, API y BD. Desarrolla la funcionalidad TDD junto con Integrante 4 y registra cada ciclo. |
| Integrante 3 | Frontend y sistema | Prepara escenarios Gherkin y Page Objects. Verifica recorridos del usuario, capturas y demostración. |
| Integrante 4 | DevOps y calidad | Mantiene lint, hooks, CI y comparador de cobertura. Verifica instalaciones reproducibles y revisa cambios del equipo. |
| Integrante 5 | Rendimiento y demo | Prepara JMeter y analiza sus mediciones. Organiza diapositivas, ensayo y video de respaldo. |

Todos contribuyen código o documentación, revisan el trabajo de otra persona,
redactan su reflexión y presentan. La tabla asigna responsabilidades futuras;
el historial de Git y los registros de ejecución acreditan las contribuciones realizadas.

## Problema y elección

PrintLab 3D permite solicitar servicios de impresión 3D y seguir el trabajo entre
cliente y administrador. El catálogo ofrece productos de referencia; una solicitud
reúne descripción y archivos; la cotización propone precio y plazo; el pedido
permite consultar el avance de producción.

Los visitantes consultan la oferta y crean una cuenta. Los clientes administran
sus solicitudes, deciden cotizaciones y consultan pedidos. Los administradores
gestionan catálogo, solicitudes, cotizaciones, pedidos y perfiles.

Reutilizar la aplicación permite concentrar el proyecto de la materia en validar
comportamientos existentes y añadir pruebas nuevas. El dominio ofrece validación
de entradas, permisos, almacenamiento, operaciones con efectos persistentes y
transiciones de estado, adecuados para caja negra, caja blanca, BDD y rendimiento.

## Alcance

Los [15 requisitos funcionales y objetivos de calidad](requirements.md) delimitan
el trabajo. La [arquitectura y el esquema preliminar](architecture.md) se obtienen
del código disponible. La [planificación y los riesgos](planning.md) indican
dependencias y criterios para completar la entrega.

Se reutiliza el frontend y su backend como servicio autorizado. Los proveedores
externos, como Google OAuth, se simulan en las pruebas deterministas. La integración
con Auth, PostgreSQL, RPC y Storage se ejecutará en Supabase local, con datos ficticios.

## Herramientas y justificación

| Capa | Herramienta | Justificación |
| --- | --- | --- |
| Interfaz | Angular 21, TypeScript, SCSS | Conserva las pantallas y formularios del proyecto autorizado. |
| Backend | Supabase Auth, REST/PostgREST, PostgreSQL, Storage y Realtime | Es el backend real de la aplicación; ofrece contratos de autenticación, datos y archivos que deben probarse. |
| Unitarias e integración de frontend | Vitest, Angular TestBed y HttpTestingController | Permiten probar lógica y comunicación HTTP con errores repetibles. |
| Integración de backend | Supabase CLI y Docker | Aíslan usuarios y registros para comprobar persistencia y permisos. Preparación pendiente. |
| Sistema | Gherkin, playwright-bdd y Playwright | Vinculan escenarios de negocio con recorridos observables del navegador. |
| Calidad | ESLint, pre-commit, Conventional Commits, GitHub Actions | Detectan fallos antes de integrar y conservan evidencia por PR. |
| Cobertura | V8 y comparador de métricas | Miden código de aplicación y rechazan regresiones entre base y PR. |
| Rendimiento | JMeter | Permitirá medir carga, estrés y picos en el entorno aislado de M7. Pendiente. |

Las versiones reproducibles de JavaScript se fijan en `package-lock.json`.
Los comandos y dependencias se describen en [README](../../../README.md),
[CONTRIBUTING](../../../CONTRIBUTING.md) y [guía de pruebas](../../pruebas.md).

## Evidencia y aceptación

Los PR [#2](https://github.com/A4ld0/Proyecto-Cliente/pull/2),
[#3](https://github.com/A4ld0/Proyecto-Cliente/pull/3) y
[#4](https://github.com/A4ld0/Proyecto-Cliente/pull/4) ya están integrados.
La [matriz de cumplimiento](../../rubrica.md) distingue lo verificado de lo pendiente.
Esta propuesta formaliza M1; los nombres y contactos provisionales deben completarse
para la entrega definitiva.
