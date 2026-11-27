# BDD con Playwright

La suite ejecuta Angular en Chromium y sustituye las respuestas de Supabase con
`page.route`. Cada escenario recibe usuarios y estado nuevos. No requiere la BD
del proyecto ni demuestra políticas RLS o transacciones reales.

| Feature | Escenarios | Comportamiento |
| --- | --- | --- |
| [authentication](authentication.feature) | 3 | Redirección a acceso, credenciales inválidas, cierre de sesión y límite de contraseña. |
| [catalog](catalog.feature) | 3 | Filtros, acumulación, total, persistencia local y vaciado. |
| [requests](requests.feature) | 3 | Carrito a solicitud, límites del formulario y rechazo de formato de archivo. |
| [access](access.feature) | 3 | Rutas privadas sin sesión y rutas correspondientes a cada rol. |
| [quotes](quotes.feature) | 3 | Cotización, aceptación/pedido, rechazo y cancelación del diálogo. |

Los cinco [Page Objects](pages/) centralizan selectores y acciones de Auth,
catálogo/carrito, solicitudes de cliente, cotización administrativa y pedidos.
Los [steps](printlab.steps.ts) traducen Gherkin a esas operaciones y el
[backend simulado](support/supabase.ts) controla los datos de cada escenario.
La integración real se verifica aparte cuando estén disponibles las migraciones.

```bash
npm ci
npx playwright install --only-shell chromium
npm run test:system:check
npm run test:system
```

La comprobación valida TypeScript de steps, Page Objects, fixtures y configuración.
La ejecución genera Gherkin compilado en `tmp/system-features/`, HTML en
`tmp/system-report/index.html`, JUnit en `tmp/system-results.xml` y capturas de
página completa por escenario en `tmp/system-results/`. Los fallos conservan
también su traza. CI publica esos archivos por 14 días.

[Reporte M6 y capturas versionadas](../docs/milestones/M6/e2e-test-report.md).
