# Contribuir a PrintLab 3D

## Preparar el entorno

Usar Node.js 24 (como CI), npm y Python 3.12 para las herramientas de calidad.
Las dependencias del frontend se instalan con `npm ci`. La aplicación se inicia
con `npm start`; consultar [README](README.md) y [DOCUMENTACION](DOCUMENTACION.md).

Instalar pre-commit en un entorno virtual del repositorio:

```powershell
python -m venv .venv-quality
.\.venv-quality\Scripts\python.exe -m pip install -r requirements-quality.txt
.\.venv-quality\Scripts\python.exe -m pre_commit install --install-hooks
.\.venv-quality\Scripts\python.exe -m pre_commit run --all-files
```

En Linux/macOS usar `.venv-quality/bin/python` en los tres últimos comandos.
No es necesario activar el entorno para usar su Python directamente. `install`
registra tanto `pre-commit` como `commit-msg` según la configuración versionada.
Los hooks requieren que `npm ci` ya se haya ejecutado.

La configuración comprueba ESLint para cambios de la aplicación, el contrato del
comparador cuando cambia su código y Conventional Commits al crear un commit.
CI ejecuta los hooks y valida los mensajes nuevos del PR. Las verificaciones
completas de pruebas, cobertura y sistema permanecen en sus workflows.

## Ramas, commits y revisión

1. Actualizar `main` con `git pull --ff-only` y crear una rama temática, por ejemplo `test/quote-permissions` o `docs/test-plan`.
2. Hacer cambios acotados, con pruebas y documentación pertinentes.
3. Usar mensajes `tipo(alcance): descripción`, por ejemplo `test(auth): cubrir límites de registro` o `docs(testing): documentar trazabilidad`.
4. Ejecutar los comandos aplicables de la siguiente sección y publicar un PR hacia `main`. Si el equipo utiliza `develop`, revisarlo primero allí y después abrir su PR hacia `main`.
5. Una persona distinta del autor revisa el diff final; integrar con checks verdes. Si cambia el SHA, revisar los cambios y los nuevos resultados.

Tipos habituales: `feat`, `fix`, `docs`, `test`, `ci`, `chore`, `refactor`, `perf`,
`build`, `style` y `revert`. Los commits de fusión generados por Git se permiten;
no se reescribe el historial previo para aparentar esta convención.

La protección remota de `main` debe exigir una revisión, los checks de calidad
y bloquear cambios directos. Su configuración efectiva y permisos de colaboradores
se verifican aparte en GitHub; este documento no afirma que ya estén activos.

## Validación

```bash
npm run lint
npm run test:ci
npm run test:coverage-guard
npm run test:coverage
npm run test:system
npm run build
```

Antes del primer `test:system`, instalar el navegador con
`npx playwright install chromium`; en CI Linux se usa `--with-deps --only-shell`.
Los comandos y ubicaciones de los reportes están en [guía de pruebas](docs/pruebas.md).
Para cambios documentales se revisan enlaces y criterios; no se crean pruebas que
solo repitan el texto. Las pruebas de API/BD real se ejecutarán en Supabase local
y se identificarán por separado de las integraciones con HTTP simulado.

## Estilo, datos y defectos

Seguir ESLint y el estilo del archivo editado; evitar reformatear archivos ajenos
al cambio. Mantener requisitos y casos en `docs/milestones/` y datos sintéticos
en `tests/data/`. Actualizar [trazabilidad](docs/milestones/M3/traceability-matrix.md)
cuando cambie un requisito o su prueba.

Un defecto incluye pasos, entrada, esperado/observado, entorno, SHA y evidencia.
La corrección debe comprobar el caso y evitar su regresión. El trabajo TDD conserva
sus ciclos RED/GREEN/REFACTOR al ocurrir; no se inventan ejecuciones ni contribuciones.

## Autoría y licencia

Conservar atribuciones del proyecto reutilizado. El titular debe confirmar la
licencia antes de añadir `LICENSE`; su ausencia permanece señalada en M2.
