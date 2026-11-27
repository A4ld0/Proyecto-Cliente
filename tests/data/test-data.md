# Datos de pruebas

Todos los nombres, correos y contraseñas de esta carpeta son ficticios.
`example.test` identifica datos de prueba. Las claves de servicio o tokens reales
se obtienen del entorno local y no se guardan en fixtures ni reportes públicos.

## Identidades y registros de referencia

| Alias | Datos | Uso |
| --- | --- | --- |
| C1 | Cliente Uno, `cliente1@example.test`, contraseña `Prueba123`, CLIENT activo. | Operaciones propias y solicitud principal. |
| C2 | Cliente Dos, `cliente2@example.test`, contraseña `Prueba456`, CLIENT activo. | Aislamiento y perfil descartable. |
| ADM | Admin QA, `admin@example.test`, contraseña `AdminPrueba123`, ADMIN activo. | Preparación, verificación y administración local. |
| P1 | Soporte QA, categoría Hogar, PLA/PETG, Negro/Blanco, precio 120, entrega `3 días`, activo. | Catálogo y carrito; descripción `Soporte sintético de pruebas`. |
| Q1 | Cotización SENT de solicitud de C1, precio 250 y plazo 3 días. | Aceptación y pedido. Q2/Q3 usan solicitudes independientes. |

Los UUID los genera el entorno o una fixture con IDs distintos por caso. Conservar
los IDs en la evidencia de ejecución. Los alias son una especificación de los
datos a sembrar, no una afirmación de que estas cuentas ya existan en Supabase.

## Archivos externos

- [registration-cases.json](registration-cases.json): particiones y límites de validación consumidos por [registration-data.spec.ts](../../src/app/features/auth/registration-data.spec.ts).
- [registration-valid.csv](registration-valid.csv): entradas válidas para registro real o importación posterior a JMeter.
- [registration-invalid.csv](registration-invalid.csv): entradas inválidas con error esperado; diseño de caja negra.

Las variantes de JSON cambian un campo respecto de la entrada válida base. `repeat`
indica repetir el carácter `value` esa cantidad de veces; los casos no dependen de
contar manualmente cadenas largas. `error` identifica el validador esperado de
Angular. La suite llama al formulario real y comprueba que una entrada inválida
no invoque el registro. Los CSV no se presentan como ya ejecutados por un runner.

## Generación, aislamiento y limpieza

1. Inicializar el backend local y aplicar las migraciones de pruebas cuando estén disponibles.
2. Sembrar usuarios y productos con el rol administrativo del entorno aislado.
3. Para registros válidos repetidos, añadir un sufijo único al correo y conservarlo en el reporte.
4. Para límites de archivo generar los tamaños en bytes; no versionar archivos de 20 MiB.
5. Separar los datos por caso o reiniciar el entorno local entre suites que comparten estado.
6. Limpiar únicamente registros del entorno local de pruebas. La app habitual conserva su propia conexión.

No depender del orden de las pruebas, salvo precondiciones explícitas como TC-018
tras TC-016. No usar clientes reales ni enviar correo a direcciones externas.
