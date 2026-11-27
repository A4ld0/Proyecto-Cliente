# M2 — Base y proceso de desarrollo

Fecha: 26 de noviembre de 2026. Este reporte diferencia configuración versionada,
verificación local y ajustes remotos pendientes.

## Configuración disponible

- [CONTRIBUTING](../../../CONTRIBUTING.md): instalación, ramas, commits, revisión y validación.
- [pre-commit](../../../.pre-commit-config.yaml): lint, contrato de cobertura y commit-msg.
- [Versión de la herramienta](../../../requirements-quality.txt): pre-commit 4.7.0.
- [Plantilla de PR](../../../.github/pull_request_template.md): problema, pruebas y revisión.
- [Workflow de hooks](../../../.github/workflows/quality-hooks.yml): verifica archivos y mensajes nuevos del PR.
- [Workflows existentes](../../../.github/workflows/): lint, unitarias/integración, cobertura y BDD.
- [README](../../../README.md): instalación, estructura, módulos y capturas.

## Verificación local

Entorno: Windows, Node.js 22.14.0, npm 10.9.2 y Python 3.12.14.
CI usa Node.js 24 y Python 3.12. Se instaló pre-commit en `.venv-quality`,
ignorado por Git, y se registraron los hooks `pre-commit` y `commit-msg`.

`pre_commit run --all-files` aprobó ESLint y las 12 verificaciones del comparador.
La batería Angular con cobertura aprobó **142 pruebas en 17 archivos**: 124 de
la base más 18 variantes externas de registro. Cobertura: statements 99.26%,
branches 96.25%, functions 100% y lines 99.17%, sin cambio respecto de la base.
Los seis YAML de configuración/workflows se pudieron leer sin errores de sintaxis.

La validación de mensajes y su ejecución en CI se comprueban junto con el commit
del bloque. Los reportes definitivos de Actions se vinculan cuando exista el PR.
Las instrucciones deben ser reproducidas por otro integrante antes de cerrar M2.

## Backend

La aplicación usa Supabase como backend autorizado, con perfiles, servicios y
guards existentes. Las pruebas históricas de HTTP usan respuestas simuladas.
Docker Desktop 28.3.2 está disponible; se prepara una instancia local para
verificar Auth, PostgreSQL/RLS, RPC y Storage con datos ficticios.
La instancia local no cambia por sí sola la conexión habitual del frontend.

## Pendientes para cerrar M2

- Verificar protección efectiva de `main`: una revisión, checks requeridos y ausencia de cambios directos.
- Confirmar colaboradores, contribuciones individuales y estrategia remota de ramas del equipo.
- Completar nombres/contactos provisionales.
- Confirmar la licencia con el titular antes de añadir `LICENSE`.
- Versionar y comprobar migraciones y contratos del backend local.
- Reproducir instalación con otra persona y registrar su resultado.

Los PR #2, #3 y #4 fusionados y sus checks están enlazados en la
[matriz](../../rubrica.md). El nuevo workflow de hooks se evalúa por separado en
el PR de este bloque; el verde de un PR anterior no acredita ese workflow nuevo.
