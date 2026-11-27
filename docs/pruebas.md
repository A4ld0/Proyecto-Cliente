# Ejecutar las pruebas

## Preparación

Usar Node.js 24 y npm. Desde la raíz del repositorio:

```bash
npm ci
npx playwright install --only-shell chromium
```

En Linux, el workflow instala también las dependencias del navegador con
`npx playwright install --with-deps --only-shell chromium`.
En PowerShell, si los argumentos después de `--` no llegan a Angular, usar `npm.cmd` y `npx.cmd`.

## Comandos

| Comando | Qué verifica | Resultado |
| --- | --- | --- |
| `npm run lint` | TypeScript y plantillas con ESLint y Angular ESLint. | Salida de consola; falla ante infracciones. |
| `npm run test:ci` | Pruebas unitarias e integraciones del frontend, una vez. | Resultado de Vitest. |
| `npm run test:coverage-guard` | Contrato del comparador: disminuciones, mínimo exacto, precisión e informes inválidos. | Pruebas de Node.js independientes de Angular. |
| `npm run test:coverage` | Suite completa y cobertura de `src/app/**/*.ts`, excluyendo tests. | HTML, JSON y LCOV en `coverage/printlab/`. |
| `npm run test:system` | Escenarios Gherkin de la interfaz Angular en Chromium. | HTML en `tmp/system-report/index.html`; JUnit en `tmp/system-results.xml`. |
| `npm run build` | Compilación de producción. | `dist/printlab/browser/`. |

Para generar el mismo reporte de pruebas que CI:

```bash
npm run test:ci -- --reporters=junit --reporters=default --output-file=tmp/unit-results.xml
```

Los screenshots de fallos y las trazas Playwright se guardan en `tmp/system-results/`.
Los directorios de salida se ignoran en Git. Los workflows adjuntan sus reportes como artifacts,
con retención de 14 días; deben descargarse para la entrega antes de que expiren.

## Qué prueba cada suite

- `*.spec.ts`: validadores, carrito, autenticación, guards, navegación y lógica de páginas con dependencias aisladas.
- `auth.integration.spec.ts`: interacción de autenticación, interceptor y rutas, con respuestas HTTP simuladas.
- `supabase.integration.spec.ts`: composición de peticiones de los servicios y manejo de datos HTTP simulados.
- `client-requests-page.component.integration.spec.ts`: solicitudes, carrito, adjuntos y decisiones de cotizaciones entre componentes y servicios reales del frontend, con HTTP simulado.
- `system-tests/`: interacción con la interfaz Angular en un navegador real; `support/supabase.ts` simula las respuestas de Supabase.

Estas integraciones verifican el frontend. La verificación de PostgreSQL, políticas de acceso,
Storage y funciones RPC requiere la instancia local de pruebas prevista en el [plan](implementacion.md).

## Cobertura y regresiones

El [workflow Coverage](../.github/workflows/coverage.yml) mide el commit base exacto del PR y
su versión propuesta, usando el mismo alcance. El [comparador](../scripts/check-coverage.mjs)
falla si baja cualquiera de las cuatro métricas o si alguna queda por debajo de 90%.
Compara cantidades exactas, incluso cuando el porcentaje mostrado tiene el mismo redondeo.

```bash
node scripts/check-coverage.mjs ruta/base/coverage-summary.json coverage/printlab/coverage-summary.json
```

El mínimo del proyecto es 90%; la guía general exige al menos 80% global.
La medición de cobertura del frontend no mide el código SQL ni demuestra la seguridad de la BD.

## Evidencia de entrega

En cada PR guardar los enlaces a los checks `lint`, `tests`, `coverage` y `system-tests`,
el SHA revisado, la aprobación y sus artifacts. Actualizar [la matriz](rubrica.md) con resultados
reales. La presentación debe mostrar también un caso que falla por el comportamiento esperado,
por ejemplo una regresión sintética que el comparador rechaza.
