# M3 — Estrategia de pruebas

## Alcance

Se cubren los 15 [requisitos funcionales](../M1/requirements.md): autenticación,
autorización, catálogo, carrito, solicitudes, adjuntos, cotizaciones, pedidos,
administración y perfil. Se prueban entradas válidas e inválidas, límites,
decisiones, estados y recuperación frente a errores.

Rendimiento se ejecuta en M7. Las pruebas de penetración y la disponibilidad del
proveedor Google quedan fuera de esta estrategia. OAuth se simula; las políticas
de acceso de Supabase sí requieren pruebas funcionales de integración reales.

## Niveles y entornos

| Nivel | Herramientas / entorno | Evidencia y límite |
| --- | --- | --- |
| Unitario | Vitest, TestBed, fixtures sintéticos | Reglas, validación y lógica de servicios; no acredita BD. |
| Integración de frontend | TestBed + HttpTestingController | Componentes, servicios y contratos HTTP con respuestas controladas. Incluye errores y reintentos. |
| Integración de backend | API y Supabase local en Docker | Auth, persistencia, RLS, RPC y archivos reales. Se prepara en M4; requiere esquema y datos versionados. |
| Sistema | Gherkin + Playwright en navegador | Flujos completos observables. Los escenarios actuales interceptan Supabase; se declara ese alcance en el reporte. |
| Aceptación | Demostración y checklist del equipo | Recorridos prioritarios, materiales finales y presentación de los cinco integrantes. |

Los proveedores externos se simulan. Los entornos de pruebas utilizan datos
ficticios; ningún caso requiere datos personales ni credenciales del Supabase habitual.
La máquina, versiones, SHA, destino y fecha se anotan en cada reporte.

## Criterios de entrada

- Requisito y resultado esperado identificados y revisables.
- Aplicación instalable con `npm ci`; servicios necesarios disponibles.
- Datos y precondiciones reproducibles, con aislamiento entre ejecuciones.
- Para integración real: migraciones aplicadas, usuarios sembrados y motor local saludable.

## Criterios de salida de ejecución

- Todos los casos de prioridad alta ejecutados y al menos 90% del conjunto aprobado.
- Ningún defecto crítico o alto sin resolver que permita acceso ajeno, pérdida de datos o duplicación de pedidos.
- Cobertura global >=80%, cumpliendo además el guard existente de >=90% y ausencia de regresión en sus cuatro métricas.
- M4: >=50 unitarias y >=20 integraciones, con evidencia de API/BD real.
- M6: >=5 features, >=15 escenarios, >=5 Page Objects y reportes accesibles.
- Lint y checks del SHA final en verde; revisión independiente antes de integrar.

El criterio documental de M3 exige diseño, técnicas y trazabilidad completos.
No exige declarar aprobados casos que todavía no se han ejecutado.

## Métricas

| Métrica | Cálculo / objetivo |
| --- | --- |
| Trazabilidad de diseño | Requisitos A con al menos un TC / requisitos A: 100%. |
| Progreso de ejecución | Casos ejecutados / casos diseñados, mostrando pendientes y bloqueados por separado. |
| Aprobación | Casos aprobados / casos ejecutados; reportar también aprobados / total para evitar ocultar pendientes. |
| Defectos | Conteo por severidad, estado y requisito; enlazar incidencia y corrección. |
| Cobertura | V8 sobre archivos de aplicación, con comparador base/PR y desglose de módulos críticos. |
| Automatización | Casos vinculados con una prueba ejecutable / casos diseñados; no equivale a ejecución del caso completo. |

## Responsabilidad y defectos

Integrante 2 mantiene diseño y resultados; Integrante 3 los escenarios de sistema;
Integrante 4 CI y entorno; Integrante 1 trazabilidad y prioridades. Integrante 5
reutiliza datos y contratos para M7. Cualquier integrante puede registrar un fallo.

Cada defecto conserva pasos, entrada mínima, resultado esperado/observado,
captura o log, entorno y SHA. La corrección añade una prueba de regresión y se
verifica con el mismo caso. Las ejecuciones históricas no se sobrescriben.
