# Suite maestra de pruebas QA — Konti

> Documento ejecutable de pruebas para el MVP móvil y la Fase 4 de rentas del trabajo 2026.

| Campo | Valor |
|---|---|
| Versión del documento | 1.0 |
| Fecha base | 2026-08-23 |
| Plataforma primaria | Android, development build |
| Plataforma secundaria | iOS, antes de una entrega para iOS |
| Plataforma excluida | Web |
| Ruleset tributario objetivo | `pe-2026.2.0` |
| Estado inicial de los casos | `NR` — no ejecutado |

## 1. Objetivo

Esta suite sirve para detectar y registrar errores funcionales, llamadas API incorrectas, pérdida de datos, cálculos inconsistentes, estados engañosos, problemas visuales y lenguaje difícil de entender.

No es una lista de pruebas unitarias. Debe demostrar que una persona puede completar los recorridos reales de Konti y recuperarse de un fallo sin conocer la arquitectura ni la terminología tributaria.

La fuente funcional principal para Fase 4 es [la especificación de cierre de rentas del trabajo](docs/superpowers/specs/2026-08-22-phase-4-work-income-completion-design.md). Si contradice una descripción histórica del [documento maestro](docs/KONTI_MASTER_IMPLEMENTATION_SPEC.md), prevalece la especificación de Fase 4. El [HTML maestro](<Konti Onboarding.dc.html>) es el oráculo de intención visual, no una promesa de que sus 14 secciones ya estén implementadas.

## 2. Método QA elegido

La búsqueda con `find-skills` encontró como mejor ajuste para planificación a [`breakdown-test`](https://www.skills.sh/github/awesome-copilot/breakdown-test), de GitHub. Se usa su enfoque de:

- pruebas basadas en riesgo;
- particiones de equivalencia y valores frontera;
- tablas de decisión y transiciones de estado;
- cobertura funcional, rendimiento, usabilidad, confiabilidad y seguridad;
- criterios de entrada y salida medibles.

Para la ejecución móvil se complementa con [`android-emulator-qa`](https://www.skills.sh/openai/plugins/android-emulator-qa), ya disponible en el entorno: recorridos con ADB, árbol de UI, capturas y `logcat`. No se instaló ninguna dependencia o skill en el proyecto.

## 3. Cómo usar este documento

1. Crear una copia de la tabla **Registro de ejecución** para cada build.
2. Ejecutar primero el **Smoke P0**.
3. Ejecutar después los casos P0 y P1 del área modificada.
4. Antes de cerrar Fase 4, ejecutar toda la regresión P0/P1 y las exploraciones.
5. Adjuntar captura, video, árbol UI, request/response sanitizado o log por cada fallo.
6. Registrar un defecto por causa; no agrupar errores distintos bajo “la pantalla falla”.

### Bandeja general de comentarios y hallazgos nuevos

Usa esta tabla cuando todavía no sepas a qué área o caso pertenece lo que encontraste. No es necesario que el hallazgo ya exista en la suite.

| Fecha | Pantalla/flujo | Tu comentario o hallazgo | Qué esperabas | Evidencia | Seguimiento |
|---|---|---|---|---|---|
| | | | | | Pendiente |

En los bloques de comentarios de cada área puedes referirte a un caso existente por su ID o escribir `NUEVO` si acabas de descubrir un escenario no contemplado.

Estados permitidos:

| Estado | Significado |
|---|---|
| `NR` | No ejecutado |
| `PASS` | Resultado esperado confirmado |
| `FAIL` | Resultado distinto al esperado |
| `BLOCKED` | No se pudo ejecutar por dependencia externa |
| `N/A` | Fuera del alcance declarado |

Prioridades:

| Prioridad | Uso |
|---|---|
| P0 | Cálculo, privacidad, autenticación, pérdida/duplicación de datos o recorrido principal |
| P1 | Recuperación, accesibilidad, diseño o caso frecuente con alternativa limitada |
| P2 | Acabado o caso poco frecuente sin afectar la verdad de los datos |

Severidad de defectos:

| Severidad | Ejemplo en Konti |
|---|---|
| Bloqueante | No se puede iniciar sesión, migrar o abrir la app |
| Crítica | Datos de otro usuario, cálculo incorrecto, doble ingreso, DNI expuesto |
| Alta | Guardado perdido, error API sin recuperación, fecha cambiada |
| Media | Lenguaje confuso, estado visual equivocado, accesibilidad parcial |
| Baja | Desalineación menor o detalle cosmético |

## 4. Alcance y trazabilidad visual

| Sección HTML | Alcance de esta suite | Tratamiento |
|---:|---|---|
| 1 | Experiencia inicial, login y onboarding | Probar |
| 2 | Acceso y permisos contextuales | Probar Google; cámara solo como regresión existente |
| 3 | Inicio y estado general | Probar |
| 4 | Subida, procesamiento, confirmación y error | Probar |
| 5 | Biblioteca y detalle | Probar; búsqueda/filtros aún no implementados son `N/A` |
| 6 | Situación, cálculo y deducciones | Probar |
| 7 | Explicaciones y preguntas contextuales | Probar; chat es `N/A` |
| 8 | Sistema visual, splash y onboarding | Probar consistencia |
| 9 | Notificaciones proactivas | `N/A` |
| 10 | Revisión por periodo | Probar |
| 11 | Estimación anual | Probar como estimación parcial; cierre anual oficial es `N/A` |
| 12 | Konti fuera de la app | `N/A` |
| 13 | Cuenta, privacidad y datos | Probar solo DNI contextual; gestión completa es `N/A` |
| 14 | Monetización | `N/A` |

### Comentarios — Alcance y diseño maestro

| Sección o `NUEVO` | Tu comentario/hallazgo | ¿Debe entrar ahora o después? | Decisión/seguimiento |
|---|---|---|---|
| | | | Pendiente |

## 5. Criterios de entrada

- Development build instalado con las dependencias nativas de la versión bajo prueba.
- API disponible y base de datos migrada hasta `0007_phase4_work_income_4_1_to_4_6.sql`.
- R2 configurado; OCR real o proveedor falso determinista disponible.
- Dos usuarios de prueba independientes, A y B.
- Al menos dos cuentas Google en el dispositivo para probar selección explícita.
- Ningún dato personal real salvo que el propietario haya autorizado expresamente su uso.
- Fecha, zona horaria y locale del dispositivo anotados. La referencia tributaria local es `America/Lima`.
- Capacidad de simular sin red, latencia de 2–5 s y respuestas 4xx/5xx.

### Comentarios — Entorno de prueba

| Build/dispositivo/dependencia | Tu comentario o bloqueo | Acción necesaria | Seguimiento |
|---|---|---|---|
| | | | Pendiente |

## 6. Datos reutilizables

| Alias | Datos |
|---|---|
| U-A / U-B | Usuarios distintos para aislamiento y cambio de sesión |
| P-NUEVO | Sin perfil tributario |
| P-4O | Perfil `independent`, cuarta ordinaria |
| P-4E | Perfil `independent`, cuarta especial |
| P-5 | Perfil `employment` |
| P-MIX | Perfil `mixed` |
| RHE-2024 | Emisión 2024-03-18, vencimiento 2024-04-19, S/6,720, retención S/0, sin fecha real de cobro |
| RHE-100K | Cuarta ordinaria S/100,000, retención S/5,000 |
| PLAN-650 | Planilla S/650, retención vacía |
| SNAP-ENE-JUN | Quinta acumulada S/30,000, retención S/900, RUC de empresa A |
| PLAN-MAR | Quinta marzo S/5,000, retención S/150, misma empresa A |
| PLAN-JUL-B | Quinta julio S/6,500, retención S/260, empresa B |
| DED-GOLDEN | Restaurante 100; médico 1,000 con reembolso 200; servicio 500; alquiler 1,000; EsSalud 90 |
| MES-GEN | S/4,010 y S/4,010.01 de cuarta ordinaria |
| MES-ESP | S/3,108.01 de cuarta especial + S/100 de quinta |
| SUSP | Autorización 2026-01-10, vigencia 2026-01-11, reinicio 2026-02-10 |

Fechas frontera obligatorias: `2026-01-01`, `2026-02-28`, `2026-07-01`, `2026-07-02`, `2026-12-31` y una fecha futura respecto del día de ejecución.

### Comentarios — Datos y escenarios faltantes

| Alias nuevo o existente | Datos que quieres probar | Por qué importa | Seguimiento |
|---|---|---|---|
| | | | Pendiente |

## 7. Smoke P0 — ejecutar en cada build

| ID | Recorrido | Resultado esperado | Estado |
|---|---|---|---|
| SMK-01 | Login Google escogiendo una cuenta distinta a la anterior | Se abre selector y la sesión corresponde a la cuenta elegida | NR |
| SMK-02 | Reiniciar la app con sesión y perfil completos | Abre Inicio sin flash de login/onboarding | NR |
| SMK-03 | Crear ingreso de planilla con bruto `650` y retención vacía | Guarda `650.00` y `0.00`; no aparece `Invalid money value` | NR |
| SMK-04 | Elegir 1 y 2 de julio, guardar y reabrir | Se conservan exactamente ambas fechas | NR |
| SMK-05 | Llenar formulario y arrastrar el sheet hacia abajo | No se cierra ni pierde datos | NR |
| SMK-06 | Guardar con latencia de 3 s | Feedback inmediato, UI utilizable y una sola creación | NR |
| SMK-07 | Eliminar un ingreso con éxito | La fila desaparece y la operación termina sin un falso “no encontrado” | NR |
| SMK-07B | Con otro fixture, forzar fallo al eliminar | La fila reaparece y nunca queda “Guardando…” | NR |
| SMK-08 | Subir un RHE y procesarlo | Una llamada OCR por intento; candidato visible antes de crear ingreso | NR |
| SMK-09 | Abrir Inicio, Ingresos, Comprobantes y Situación sin red | Datos previos visibles o error con Reintentar; nunca un falso estado vacío | NR |
| SMK-10 | Cambiar de U-A a U-B | Ningún dato cacheado de A es visible en B | NR |
| SMK-11 | Abrir “Ver cálculo” con RHE-100K | Desglose completo, cifra estable y movimiento sutil | NR |
| SMK-12 | Revisar un mes de cuarta y guardar declaración/pago | Una mutación lógica; hechos separados y estado actualizado | NR |

### Comentarios — Smoke

| ID o `NUEVO` | Tu comentario/hallazgo | Qué esperabas | Evidencia | Seguimiento |
|---|---|---|---|---|
| | | | | Pendiente |

## 8. Autenticación, sesión y navegación

| ID | Pri. | Caso / pasos | Resultado esperado | Estado |
|---|---:|---|---|---|
| AUTH-001 | P0 | Con dos cuentas Google, cerrar sesión, iniciar y elegir la segunda | Selector visible; no reutiliza silenciosamente la cuenta anterior | NR |
| AUTH-002 | P1 | Cancelar el selector Google | Login permanece neutral; botón se rehabilita; no crea sesión parcial | NR |
| AUTH-003 | P0 | Expirar sesión y hacer que perfil responda 401 al arrancar | Recupera sesión o vuelve a login; no entra en ciclo de error/reintento | NR |
| AUTH-004 | P0 | Entrar con A, cargar datos, salir y entrar con B | Caché y datos sensibles de A eliminados | NR |
| AUTH-005 | P1 | Probar Play Services ausente/desactualizado | Mensaje cotidiano, CTA recuperable y sin stack técnico | NR |
| AUTH-006 | P0 | Reiniciar app tras login válido | Sesión persiste y `GET /v1/me` representa al usuario correcto | NR |
| AUTH-007 | P0 | Cerrar sesión y llamar una ruta privada | 401; app vuelve a login sin reintentos infinitos | NR |
| AUTH-008 | P0 | Cuenta nueva y cada modo de ingreso | Onboarding guarda `employment`, `independent` o `mixed` y no reaparece | NR |
| NAV-001 | P0 | Abrir rutas protegidas sin sesión y sin perfil | Guard correcto, sin mostrar contenido antes de redirigir | NR |
| NAV-002 | P0 | Perfil de quinta intenta abrir revisión mensual de cuarta | Ruta no aplicable o redirección explicada; no crea hechos de cuarta | NR |
| NAV-003 | P1 | Inicio → ingreso/documento/periodo → volver | Regresa al contexto esperado sin rutas duplicadas ni formulario huérfano | NR |

### Comentarios — Autenticación y navegación

| ID o `NUEVO` | Tu comentario/hallazgo | Qué esperabas | Evidencia | Seguimiento |
|---|---|---|---|---|
| | | | | Pendiente |

## 9. Contratos API y recuperación

### 9.1 Inventario esperado

| Área | Método y ruta |
|---|---|
| Sesión | `GET /v1/me` |
| Perfil | `GET/PUT /v1/tax-profile/current` |
| Inicio | `GET /v1/home/current`; fallback `GET /v1/home` solo ante 404 |
| Documentos | `POST /v1/documents/uploads`, `POST /v1/documents/:id/complete`, `POST /v1/documents/:id/process`, `GET /v1/documents`, `GET /v1/documents/:id`, `POST /v1/documents/:id/file-url` |
| Ingresos | `GET/POST /v1/tax-income-records`, `GET/PATCH/DELETE /v1/tax-income-records/:id`, `POST /v1/tax-income-records/document-decision`, `POST /v1/tax-income-records/:id/coverage-resolution` |
| Deducciones | `GET/POST /v1/tax-deductions`, `GET/PATCH/DELETE /v1/tax-deductions/:id`, `POST /v1/tax-deductions/document-decision`, `PUT /v1/tax-deductions/identity` |
| Periodos | `GET/PUT /v1/tax-periods/:period`, `POST /v1/tax-periods/:period/review` |
| Hechos mensuales | `POST /v1/tax-suspensions`, `/v1/tax-filings`, `/v1/tax-payments` |
| Estado | `GET /v1/tax-status/current`, `GET /v1/tax-evaluations/:id` |
| Atención | `GET /v1/attention-items` |

### 9.2 Casos transversales

| ID | Pri. | Caso / pasos | Resultado esperado | Estado |
|---|---:|---|---|---|
| API-001 | P0 | Llamar cada `/v1/*` sin cookie | 401 y cero datos | NR |
| API-002 | P0 | Simular 400, 401, 404, 409, 422, 500, 503, timeout y cuerpo no JSON | App no crashea; explica impacto y recuperación sin filtrar detalles técnicos | NR |
| API-003 | P0 | Fallar una lectura con colección previamente cargada | Conserva último dato con aviso; no lo transforma en lista vacía | NR |
| API-004 | P0 | Fallar carga inicial de Comprobantes | Muestra error y Reintentar; nunca “Aún no hay comprobantes” | NR |
| API-005 | P0 | Fallar Situación, Ingresos y detalle de documento | Cada pantalla ofrece recuperación visible | NR |
| API-006 | P0 | Guardar sin red y reconectar | Mutación no se repite sola; reintento manual conserva datos e idempotency key | NR |
| API-007 | P0 | Doble toque rápido en Guardar | Una operación lógica y una fila canónica | NR |
| API-008 | P0 | Respuesta 4xx | No hay retry automático | NR |
| API-009 | P1 | Respuesta 5xx en GET | Reintenta según política y finaliza en estado recuperable | NR |
| API-010 | P0 | `/v1/home/current` devuelve 404 | Un único fallback a `/v1/home` | NR |
| API-011 | P0 | `/v1/home/current` devuelve 401, 409 o 500 | No llama al Home legado para ocultar el error | NR |
| API-012 | P0 | Perfil cambia después de una evaluación | Home/estado obtiene evaluación coherente con el modo nuevo | NR |
| API-013 | P0 | Desactivar seguimiento de deducciones con registros existentes y luego reactivarlo | No borra evidencia; mientras está desactivado impide nuevas altas y excluye esos registros de la estimación; al reactivar los vuelve a considerar mediante una evaluación nueva | NR |
| API-014 | P1 | Lanzar ingreso, gasto y revisión al mismo tiempo | Estados globales no se tapan ni se atribuyen a la operación equivocada | NR |
| API-015 | P0 | Matriz perfil `independent`/`employment`/`mixed` × ingreso de cuarta/quinta × periodo mensual | Cada modo admite únicamente los recursos aplicables; `mixed` admite ambos; quinta pura no crea periodos de cuarta | NR |
| API-016 | P0 | Revisar importes en requests/responses de Ingresos, Deducciones, Periodos, Home y TaxStatus | Todos son strings decimales como `"650.00"`; nunca `number`, `""` o `null` donde el contrato exige dinero | NR |
| API-017 | P0 | Enviar desde el cliente campos derivados como `automaticDeduction20`, `calculatedTaxBeforeCredits`, `calculationDisposition` o `differenceAfterRegisteredCredits` | El contrato los rechaza o ignora de forma explícita; jamás alteran el cálculo del servidor | NR |

### 9.3 Riesgos de contrato a ejecutar primero

Estos casos provienen de la inspección del código y pueden fallar en la build actual. Un fallo debe registrarse; no debe cambiarse el resultado esperado para hacerlo pasar.

| ID | Pri. | Riesgo observado | Resultado esperado | Estado |
|---|---:|---|---|---|
| RISK-API-01 | P0 | `GET /v1/tax-deductions?taxYear=2025` | Rechaza el año no soportado; no devuelve silenciosamente 2026 | NR |
| RISK-API-02 | P0 | Cursor de documentos con formato válido pero registro inexistente | 400 estable; nunca Error crudo/500 | NR |
| RISK-API-03 | P0 | Reusar idempotency key de upload con hash/nombre/tamaño distintos | 409 de conflicto; no devuelve el documento anterior como si coincidiera | NR |
| RISK-API-04 | P0 | OCR de RHE en perfil `mixed` | Candidato y atención de cuarta coherentes | NR |
| RISK-API-05 | P0 | Endpoint mensual con perfil `employment` | Rechazo/no aplicable; no crea periodo de cuarta | NR |
| RISK-API-06 | P0 | Cambiar `incomeMode` o `trackDeductibles` | Dispara reevaluación o invalida claramente el snapshot anterior | NR |
| RISK-API-07 | P1 | Ejecutar E2E HTTP actual | Cubre APIs reales; no depende del viejo `GET /` “Hello World” | NR |
| RISK-API-08 | P1 | Subir bytes manipulados con extensión/tipo permitido | Rechazo seguro si el contenido no es imagen válida | NR |
| RISK-API-09 | P0 | Declarar un SHA-256 y subir bytes cuyo hash real es distinto | `complete` rechaza y no procesa; si el MVP aún no recalcula hash, registrar riesgo de integridad explícito | NR |

### Comentarios — API y llamadas de red

| ID o `NUEVO` | Endpoint/pantalla | Tu comentario/hallazgo | Request/response sanitizado o evidencia | Seguimiento |
|---|---|---|---|---|
| | | | | Pendiente |

## 10. Formularios, dinero, fechas, teclado y sheets

| ID | Pri. | Caso / pasos | Resultado esperado | Estado |
|---|---:|---|---|---|
| FORM-001 | P0 | Planilla: bruto `650`, retención vacía | Guarda `650.00` y `0.00`; no hay excepción técnica | NR |
| FORM-002 | P0 | Probar `650`, `650.5`, `650.50`, `0`, vacío, `650.123`, letras y negativo | Normaliza válidos; marca el campo inválido sin perder los demás | NR |
| FORM-003 | P0 | Retención mayor al bruto | Error junto a Retención; no envía API | NR |
| FORM-004 | P1 | Teclado español con `650,50` | Acepta/normaliza o explica el formato; nunca crashea | NR |
| DATE-001 | P0 | Elegir 1 y 2 de julio en los ocho campos de fecha, guardar y reabrir | Payload y UI conservan `2026-07-01`/`2026-07-02` | NR |
| DATE-002 | P0 | Abrir formulario manual en otra zona horaria manteniendo Lima como referencia | “Hoy” corresponde al día civil de Lima; no cambia por UTC | NR |
| DATE-003 | P0 | Abrir honorario/gasto manual | Fecha predeterminada es hoy en Lima | NR |
| DATE-004 | P0 | Abrir planilla o candidato OCR con fecha vacía | Calendario abre en el mes actual; no inventa pago/cobro | NR |
| DATE-005 | P0 | Emisión/vencimiento presentes pero pago real desconocido | Campo de pago permanece vacío | NR |
| DATE-006 | P1 | En cobro, pago deducible y cobertura probar 2026-02-28, fecha inexistente, fuera de 2026 e inicio mayor que fin | Valida el límite propio del campo y no envía la solicitud inválida | NR |
| DATE-007 | P0 | Autorización y reinicio el mismo día | Rechaza; reinicio mínimo al día siguiente | NR |
| DATE-008 | P1 | Navegar calendario, cancelar y reabrir | No cambia valor ni borra datos | NR |
| DATE-009 | P0 | Revisar cobro, inicio/fin planilla, pago deducible, autorización, reinicio, declaración y pago | Todos reutilizan el calendario; ninguno exige escribir la fecha | NR |
| DATE-010 | P0 | Declaración o pago de diciembre de 2026 registrado en 2027, pero ya ocurrido | Se admite; solo se rechaza si está en el futuro respecto de Lima | NR |
| SHEET-001 | P0 | Completar campos y arrastrar hacia abajo | Sheet no se descarta ni pierde datos | NR |
| SHEET-002 | P1 | Cancelar explícitamente un formulario sucio | Única salida voluntaria; advierte pérdida si así lo define producto | NR |
| KEY-001 | P0 | Enfocar último input con teclado abierto | Input y CTA visibles, scroll sincronizado y sin salto | NR |
| KEY-002 | P1 | Alternar input decimal, calendario y teclado | Foco/valores estables; no hay overlay bloqueante | NR |

### Comentarios — Formularios

| ID o `NUEVO` | Campo/pantalla | Tu comentario/hallazgo | Qué esperabas | Seguimiento |
|---|---|---|---|---|
| | | | | Pendiente |

## 11. Documentos, R2 y OCR

| ID | Pri. | Caso / pasos | Resultado esperado | Estado |
|---|---:|---|---|---|
| DOC-001 | P0 | Crear upload con una imagen JPEG/PNG válida, mayor que 0 y de hasta 15 MiB | Upload firmado y documento `pending_upload` | NR |
| DOC-002 | P0 | PDF, cero bytes, >15 MiB, hash inválido o más de una página | 400 sin crear documento útil | NR |
| DOC-003 | P0 | Completar antes de subir o con tamaño distinto | 409 `UPLOAD_INCOMPLETE`/`UPLOAD_SIZE_MISMATCH` | NR |
| DOC-004 | P0 | Dos `complete` simultáneos | Convergen a un documento `uploaded` | NR |
| DOC-005 | P0 | Dos `process` simultáneos | Una llamada OCR; segundo intento no duplica procesamiento | NR |
| DOC-006 | P0 | Reprocesar documento `ready` | No hace segunda llamada OCR innecesaria | NR |
| DOC-007 | P0 | OCR cae o devuelve JSON inválido | Documento `failed`, sin datos inventados y con reintento | NR |
| DOC-008 | P0 | Subir el mismo SHA con claves distintas | Duplicado exacto reconocido | NR |
| DOC-009 | P0 | U-B pide documento/URL de U-A | 404 no revelador | NR |
| DOC-010 | P1 | URL firmada expira a los cinco minutos | Imagen falla de forma controlada y puede solicitar nueva URL | NR |
| DOC-011 | P1 | Lista larga y detalle con imagen grande | Sin duplicados/saltos; `NitroImage` conserva proporción y libera recursos | NR |
| OCR-001 | P0 | RHE-2024 con fecha de cuota | No convierte cuota/vencimiento en pago ni ingreso 2026 | NR |
| OCR-002 | P0 | RHE 2026 cobrado | Muestra candidato; pide confirmación y fecha real antes del ingreso | NR |
| OCR-003 | P0 | RHE no cobrado/no seguro | No crea ingreso; atención accionable | NR |
| OCR-004 | P0 | Decidir `not_mine` | No crea ingreso y conserva posible relevancia como gasto | NR |
| OCR-005 | P0 | Boleta de planilla/certificado | Confirma periodo, empresa, alcance, bruto y retención antes de incluir | NR |
| OCR-006 | P0 | Documento candidato a deducción | OCR aporta evidencia; no produce `system_verified` ni inventa `paidAt` | NR |
| OCR-007 | P0 | RHE emitido 2024-03-18, vencido 2024-04-19 y cobrado realmente 2026-08-20 | Crea ingreso del ejercicio 2026 usando la fecha real de percepción | NR |
| OCR-008 | P0 | Documento con `taxAmount` genérico pero sin `incomeTaxWithheldAmount` | No copia `taxAmount` como retención; conserva cero/desconocido hasta confirmación válida | NR |

### Comentarios — Documentos y OCR

| ID o `NUEVO` | Documento/flujo | Tu comentario/hallazgo | Evidencia | Seguimiento |
|---|---|---|---|---|
| | | | | Pendiente |

## 12. Cuarta categoría

| ID | Pri. | Caso / datos | Resultado esperado | Estado |
|---|---:|---|---|---|
| TAX4-001 | P0 | RHE-100K | 20%=20,000; neta cuarta=80,000; 7 UIT=38,500; imponible=41,500; impuesto=4,160; diferencia=-840 | NR |
| TAX4-002 | P0 | Cuarta especial S/10,000 | Deducción automática 20%=0 | NR |
| TAX4-003 | P0 | Ordinaria S/700,000 | 20% limitado a 24 UIT=S/132,000; neta S/568,000 | NR |
| TAX4-004 | P0 | `paid`, `unpaid`, `unsure`, `activity_unsure` | Solo el pago confirmado y clasificado crea ingreso | NR |
| TAX4-005 | P0 | Confirmar dos veces el mismo documento | Un ingreso activo y una decisión idempotente | NR |
| TAX4-006 | P0 | Fallar evaluación después de insertar | Rollback de ingreso, snapshot y atención | NR |
| TAX4-007 | P0 | Borrar y volver a borrar | Primera operación coherente; segunda 404 controlada sin estado móvil colgado | NR |
| TAX4-008 | P1 | Ingreso manual sin RUC personal | Flujo no solicita RUC del usuario | NR |

### Comentarios — Cuarta categoría

| ID o `NUEVO` | Datos usados | Tu comentario/hallazgo | Resultado que esperabas | Seguimiento |
|---|---|---|---|---|
| | | | | Pendiente |

## 13. Quinta y cobertura laboral

| ID | Pri. | Caso / datos | Resultado esperado | Estado |
|---|---:|---|---|---|
| TAX5-001 | P0 | Doce boletas, una por mes | Suma exacta, cobertura completa, sin proyección | NR |
| TAX5-002 | P0 | SNAP-ENE-JUN + PLAN-MAR, mismo RUC | Marzo `excluded_by_coverage`; no doble suma | NR |
| TAX5-003 | P0 | Misma coincidencia solo por nombre, sin RUC | `needs_resolution`; jamás exclusión automática | NR |
| TAX5-004 | P0 | Snapshot `all_employers` + dos empresas | Cubre ambos pagadores dentro del rango | NR |
| TAX5-005 | P0 | Snapshot de A + periodo de B | Solo cubre RUC A | NR |
| TAX5-006 | P0 | Snapshots ene-jun y may-ago | Atención por solapamiento; no suma ambos | NR |
| TAX5-007 | P0 | Duplicado exacto vs mismo periodo con importe distinto | Exacto se resuelve determinísticamente; distinto requiere decisión | NR |
| TAX5-008 | P1 | Solo marzo y julio | Meses faltantes visibles; no inventa sueldo | NR |
| TAX5-009 | P0 | `coveredByRecordId` propio, cíclico, ajeno o colgante | Rechazo estable; cero enlaces inválidos | NR |

### Comentarios — Quinta y cobertura

| ID o `NUEVO` | Datos usados | Tu comentario/hallazgo | Resultado que esperabas | Seguimiento |
|---|---|---|---|---|
| | | | | Pendiente |

## 14. Consolidación mixta y cálculo anual

| ID | Pri. | Caso / datos | Resultado esperado | Estado |
|---|---:|---|---|---|
| MIX-001 | P0 | Cuarta neta 30,000 + quinta 30,000; créditos 2,200 | Una sola 7 UIT; imponible 21,500; impuesto 1,720; diferencia -480 | NR |
| MIX-002 | P0 | Ordinaria + especial + quinta | Solo ordinaria recibe 20%; una sola 7 UIT compartida | NR |
| MIX-003 | P0 | Bases imponibles de 5, 20, 35, 45 y 50 UIT | Impuestos 2,200; 13,750; 27,775; 38,775; 47,025 | NR |
| MIX-004 | P0 | Créditos menores, iguales y mayores al impuesto | Diferencia positiva/cero/negativa sin llamarla deuda o devolución | NR |
| MIX-005 | P0 | Cobertura completa, parcial y desconocida | La cifra puede existir, pero `isDefinitive=false` si hay límites | NR |
| MIX-006 | P0 | Cualquier snapshot `pe-2026.2.0` | Incluye `annual_filing_obligation_not_determined` | NR |
| MIX-007 | P0 | Recalcular después de editar | Nuevo snapshot enlazado; el anterior no muta | NR |

### Comentarios — Mixta y cálculo anual

| ID o `NUEVO` | Datos usados | Tu comentario/hallazgo | Resultado que esperabas | Seguimiento |
|---|---|---|---|---|
| | | | | Pendiente |

## 15. Deducciones adicionales de hasta 3 UIT

| ID | Pri. | Caso / datos | Resultado esperado | Estado |
|---|---:|---|---|---|
| DED-001 | P0 | DED-GOLDEN | 15 + 240 + 150 + 300 + 90 = S/795 | NR |
| DED-002 | P0 | Deducción 16,499.99; 16,500; 16,500.01 | Aplicado 16,499.99; 16,500; 16,500 y exceso visible | NR |
| DED-003 | P0 | `unknown+potential`, `user_confirmed+included`, evidencia incluida/excluida | Verificación e inclusión son dimensiones independientes | NR |
| DED-004 | P0 | Cliente envía `system_verified` | 400; solo integración oficial futura puede producirlo | NR |
| DED-005 | P0 | Médico para titular, cónyuge, concubino acreditado, hijo menor y adulto con discapacidad registrada | Beneficiario y evidencia se validan sin mezclar reglas de servicio genérico | NR |
| DED-006 | P0 | Reembolso desconocido, total, parcial o mayor al gasto | Potencial, excluido, resta correcta o entrada inválida | NR |
| DED-007 | P0 | Servicio de cuarta especial | Excluido; actividad desconocida queda potencial | NR |
| DED-008 | P1 | S/1,999.99; S/2,000; S/2,000.01 sin/con medio de pago | Umbral activa requisito sin fingir verificación oficial | NR |
| DED-009 | P0 | `paidAt` vacío con `issueDate` presente | No se incluye; emisión no sustituye pago | NR |
| DED-010 | P0 | DNI `12345678` | Solo HMAC/índice ciego y `****5678`; nunca texto completo en DTO/log/snapshot | NR |
| DED-011 | P0 | HMAC secret ausente | 503 controlado y rollback; no DNI parcial | NR |
| DED-012 | P0 | Deducciones desactivadas | 409 y CTA para habilitar; no alta silenciosa | NR |
| DED-013 | P0 | Restaurante emitido fuera de 2026 | Se conserva como documento, pero se excluye de la deducción 2026 | NR |
| DED-014 | P0 | Compra ordinaria de supermercado | Se conserva y clasifica; no entra por sí sola en las categorías de 3 UIT | NR |
| DED-015 | P0 | Alquiler: atribución desconocida, inmueble fuera de Perú, uso exclusivamente empresarial y evidencia 1683/factura | Desconocido queda potencial; requisito incumplido excluye; `rent_attribution` aparece cuando corresponde | NR |
| DED-016 | P0 | EsSalud: sin registro/evidencia, con Formulario 1676 y con importe de salario | Incluye 100% del aporte acreditado, nunca 100% del salario; falta de requisito queda potencial/excluida según evidencia | NR |
| DED-017 | P0 | Médico para pareja no acreditada, hijo adulto sin discapacidad registrada u otro tercero | No se incluye como beneficiario admitido; queda potencial o excluido según la evidencia | NR |

### Comentarios — Deducciones

| ID o `NUEVO` | Categoría/documento | Tu comentario/hallazgo | Resultado que esperabas | Seguimiento |
|---|---|---|---|---|
| | | | | Pendiente |

## 16. Obligaciones mensuales de cuarta

| ID | Pri. | Caso / datos | Resultado esperado | Estado |
|---|---:|---|---|---|
| MON-001 | P0 | General S/4,010 y S/4,010.01 | Exacto sin acción; +0.01 genera estimación S/320.80 | NR |
| MON-002 | P0 | Especial S/3,108 + quinta S/100; luego +0.01 | Exacto 3,208 sin acción; +0.01 genera S/248.64 | NR |
| MON-003 | P0 | Cuarta S/5,000; retención 100, 400 y 500 | Pago estimado 300, 0 y 0 | NR |
| MON-004 | P0 | Autorización 10/01; ingresos 10 y 11/01 | Vigencia desde 11/01; solo el ingreso del 10 no está suspendido | NR |
| MON-005 | P0 | Reinicio 10/02; ingresos 09 y 10/02 | El ingreso del 10 vuelve a no suspendido | NR |
| MON-006 | P0 | Suspensión/reinicio desconocido, cobertura parcial o documento pendiente | `insufficient_data`; estimación de pago `null` | NR |
| MON-007 | P0 | Declaración sí/pago no y viceversa | Recursos independientes; no se sobrescriben | NR |
| MON-008 | P0 | Todos los hechos solicitados registrados | `user_recorded_complete`; nunca “cumplimiento SUNAT” | NR |
| MON-009 | P1 | Hecho dic-2026 registrado en ene-2027 y ya ocurrido | Admitido; fecha futura respecto de Lima rechazada | NR |
| MON-010 | P0 | Repetir review con misma clave y luego payload distinto | Replay idéntico; 409 distinto; rollback ante fallo intermedio | NR |
| MON-011 | P0 | Guardar revisión completa desde móvil | Un `POST /review`, no cuatro mutaciones independientes | NR |
| MON-012 | P0 | Suspensión ordinaria: proyección declarada S/48,125 y S/48,125.01 | El valor exacto es compatible con el límite; +S/0.01 requiere advertir que ya lo supera/revisar reinicio; Konti no extrapola | NR |
| MON-013 | P0 | Suspensión especial: proyección declarada S/38,500 y S/38,500.01 | El valor exacto es compatible con el límite; +S/0.01 requiere advertir que ya lo supera/revisar reinicio; Konti no extrapola | NR |

### Comentarios — Revisión mensual

| ID o `NUEVO` | Periodo | Tu comentario/hallazgo | Resultado que esperabas | Seguimiento |
|---|---|---|---|---|
| | | | | Pendiente |

## 17. Inicio, lenguaje y diseño

| ID | Pri. | Caso / pasos | Resultado esperado | Estado |
|---|---:|---|---|---|
| HOME-001 | P0 | Inicio vacío, calculado, con atención y cobertura parcial | La acción que cambia la estimación aparece primero | NR |
| HOME-002 | P0 | Tocar atención de RHE, actividad, planilla, deducción y mes | Abre exactamente el contexto resoluble | NR |
| HOME-003 | P0 | Dependencia de Home falla | No ensambla un estado parcialmente falso; muestra recuperación | NR |
| STATUS-001 | P0 | Abrir “Ver cálculo” para cuarta, quinta y mixta | Filas completas y valores consistentes con API | NR |
| STATUS-002 | P0 | Cobertura incompleta o factores excluidos | “Estimación parcial” y límites visibles, no escondidos en tooltip | NR |
| COPY-001 | P0 | Preguntar a una persona no experta “¿qué debes hacer?” | Responde correctamente tras una lectura, sin explicación del QA | NR |
| COPY-002 | P0 | Buscar `servidor`, `ruleset`, `bancarización`, `activo y habido`, `renta neta imponible`, `cobertura`, `atribución`, `3 UIT` | Se reemplaza por lenguaje cotidiano o se explica en el mismo contexto | NR |
| COPY-003 | P0 | Buscar conclusiones fiscales | No aparece `up_to_date`, “todo al día”, deuda, devolución segura o “validado por SUNAT” | NR |
| COPY-004 | P1 | Revisar cada error | Dice qué ocurrió, qué no cambió y qué puede hacer el usuario | NR |
| VIS-001 | P1 | Comparar 360×640, 376×800 y 411×891 con HTML | Jerarquía, paleta, espaciado y CTA conservan intención; sin recortes | NR |
| VIS-002 | P1 | Arranque en frío y cambio de tema del sistema | Sin flash blanco impropio; contraste y barras del sistema coherentes | NR |
| VIS-003 | P1 | Loading, vacío, error y contenido de cada lista | Estados visualmente distintos y sin saltos bruscos | NR |

### Riesgos móviles a ejecutar primero

- Comprobantes puede confundir fallo/carga con lista vacía.
- Situación, Ingresos y el error inicial del detalle documental pueden carecer de CTA **Reintentar**.
- Un 401 de perfil con sesión local puede quedarse en el error genérico de arranque.
- Los avisos globales de ingreso, deducción y revisión mensual pueden superponerse.
- Hay textos que aún mencionan “servidor” y otros términos internos.
- El splash configurado claro puede producir un flash antes de la UI oscura.
- Los flujos críticos tienen pocos `testID`; la automatización ADB dependerá inicialmente del texto accesible.

### Comentarios — Inicio, lenguaje y diseño

| ID o `NUEVO` | Pantalla/texto | Tu comentario/hallazgo | Cómo lo expresarías o diseñarías | Evidencia | Seguimiento |
|---|---|---|---|---|---|
| | | | | | Pendiente |

## 18. Accesibilidad, movimiento y hápticos

| ID | Pri. | Caso / pasos | Resultado esperado | Estado |
|---|---:|---|---|---|
| A11Y-001 | P0 | TalkBack, orden de foco y acciones | Orden lógico, rol/estado anunciado y errores como alertas | NR |
| A11Y-002 | P0 | Fuente 1.3× y 2× | No se trunca información esencial; CTA sigue accesible | NR |
| A11Y-003 | P0 | Medir blancos táctiles | Acciones principales de al menos 44×44 pt equivalentes | NR |
| A11Y-004 | P1 | Calendario con TalkBack | Anuncia etiqueta, valor, fecha deshabilitada y confirmación | NR |
| MOT-001 | P1 | Abrir cálculo y cambiar pasos con reduced motion activo/inactivo | Movimiento sutil y reducido cuando corresponde; no bloquea | NR |
| MOT-002 | P0 | Recorrer animaciones | Nunca aparece `Invalid predefined timing function "cubic-bezier(...)"` | NR |
| MOT-003 | P1 | Cambiar cifra/desglose varias veces | Sin parpadeo, rebote excesivo o layout jump | NR |
| HAP-001 | P2 | Selección, éxito, advertencia, error y borrado | Feedback moderado y posterior a confirmación real; no vibra cada tap | NR |

### Comentarios — Accesibilidad y acabado

| ID o `NUEVO` | Configuración/dispositivo | Tu comentario/hallazgo | Qué esperabas | Seguimiento |
|---|---|---|---|---|
| | | | | Pendiente |

## 19. Seguridad, privacidad e integridad

| ID | Pri. | Caso / pasos | Resultado esperado | Estado |
|---|---:|---|---|---|
| SEC-001 | P0 | U-B usa IDs de documento, ingreso, deducción o evaluación de U-A | 404/403 no revelador; cero lectura/mutación | NR |
| SEC-002 | P0 | Inspeccionar logs durante auth, OCR, DNI y errores | Sin tokens, cookies, DNI completo, Clave SOL ni OCR crudo | NR |
| SEC-003 | P0 | Inspeccionar DTO y snapshot público | Solo datos mínimos reproducibles; sin secretos ni annotation OCR completa | NR |
| SEC-004 | P0 | U-B intenta solicitar por API la URL del documento de U-A | 404 no revelador; no obtiene una URL firmada | NR |
| SEC-004B | P0 | Copiar una URL firmada y usarla antes/después de expirar | Funciona para quien posea el enlace mientras esté vigente —debe tratarse como secreto— y R2 la rechaza después de expirar | NR |
| SEC-005 | P0 | Dos POST concurrentes con misma clave/documento | Una fila/evaluación canónica; replay o conflicto estable | NR |
| SEC-006 | P0 | Forzar error entre escritura y reevaluación | Rollback completo, sin estado tributario a medias | NR |

### Comentarios — Seguridad y privacidad

No pegues tokens, cookies, DNI completo ni OCR crudo en esta tabla.

| ID o `NUEVO` | Recurso/flujo | Tu comentario/hallazgo sanitizado | Evidencia segura | Seguimiento |
|---|---|---|---|---|
| | | | | Pendiente |

## 20. Base de datos y migraciones

| ID | Pri. | Preparación | Resultado esperado | Estado |
|---|---:|---|---|---|
| MIG-001 | P0 | Clon pre-0007 con `independent_services` | Migra a `fourth_ordinary`, `migrated_default`, `payment`, `included` | NR |
| MIG-002 | P0 | Tipo/fuente histórica no soportada | Migración aborta completa; no infiere quinta | NR |
| MIG-003 | P0 | Hash/conteo de `tax_evaluations` antes/después | Snapshots `pe-2026.1.0` byte a byte inmutables | NR |
| MIG-004 | P0 | Inspección PostgreSQL real | Tablas, FKs, checks e índices parciales de 0007 presentes | NR |
| MIG-005 | P0 | Duplicar ingreso/deducción activo por documento y hecho mensual | PostgreSQL rechaza duplicado | NR |
| MIG-006 | P0 | Cobertura entre perfiles, ciclo y autorreferencia | Servicio la rechaza aunque la DB por sí sola no lo impida | NR |
| MIG-007 | P1 | Volumen representativo y sesión concurrente | Tiempo/bloqueo medidos; rollback sin pérdida | NR |
| MIG-008 | P0 | Insertar directamente bruto cero/negativo, retención negativa o retención mayor al bruto | PostgreSQL rechaza cada fila inválida; si acepta alguna, registrar `FAIL` de integridad y no cerrar el P0 | NR |

Las pruebas actuales que inspeccionan el SQL no sustituyen MIG-001 a MIG-007 contra PostgreSQL real.

### Comentarios — Base de datos y migraciones

| ID o `NUEVO` | Entorno/migración | Tu comentario/hallazgo | Evidencia o consulta sanitizada | Seguimiento |
|---|---|---|---|---|
| | | | | Pendiente |

## 21. Rendimiento y confiabilidad

Los umbrales son objetivos provisionales del MVP; si se cambian, debe quedar decisión de producto escrita.

| ID | Pri. | Medición | Objetivo | Estado |
|---|---:|---|---|---|
| PERF-001 | P0 | Guardado con API artificialmente lenta 2–5 s | Feedback visible <100 ms; UI no congelada; una mutación | NR |
| PERF-002 | P1 | Alta manual en entorno local | Medir red, transacción, evaluación, invalidación y render por separado | NR |
| PERF-003 | P1 | Lista con cientos de documentos/ingresos | Scroll fluido, sin duplicados ni crecimiento de memoria evidente | NR |
| PERF-004 | P1 | Recalcular quinta con múltiples registros | Máximo cuatro consultas SQL del flujo optimizado | NR |
| PERF-005 | P1 | Abrir/cerrar repetidamente previews Nitro | Memoria vuelve cerca de la base; sin retener imágenes/objetos nativos | NR |
| PERF-006 | P1 | Reconectar tras offline | Refresca GET; no duplica mutaciones | NR |
| PERF-007 | P1 | Documento en `processing` hasta terminal | Polling cada 2 s mientras procesa y se detiene al finalizar | NR |

### Comentarios — Rendimiento

| ID o `NUEVO` | Dispositivo/red | Tu comentario y tiempo observado | Qué esperabas | Seguimiento |
|---|---|---|---|---|
| | | | | Pendiente |

## 22. Auditorías estáticas

Estas búsquedas no reemplazan la prueba en dispositivo:

```bash
rg -n "StyleSheet|nativewind|cubic-bezier" apps/mobile
rg -n "from [\"']expo-image[\"']" apps/mobile
rg -n "react-native-nitro-image" apps/mobile
```

Criterio:

- no hay NativeWind;
- los archivos modificados de Fase 4 no usan `StyleSheet`;
- la cámara queda como excepción heredada y fuera de este cambio;
- Reanimated usa `Easing.bezier(...)`, nunca una cadena CSS;
- las vistas de comprobantes usan `react-native-nitro-image`; `expo-image-picker` no cuenta como `expo-image`.

### Comentarios — Auditoría estática

| ID o `NUEVO` | Archivo/regla | Tu comentario/hallazgo | Decisión o corrección esperada | Seguimiento |
|---|---|---|---|---|
| | | | | Pendiente |

## 23. Automatización existente

Comandos de verificación disponibles, sin instalar dependencias:

```bash
pnpm --filter @repo/api test -- --runInBand
pnpm --filter @repo/api test:cov -- --runInBand
pnpm --filter @repo/mobile test
pnpm --filter @repo/api test:e2e -- --runInBand
pnpm typecheck
pnpm lint
```

El E2E debe considerarse no confiable hasta reemplazar el caso heredado de `GET /` por contratos autenticados reales.

Cobertura mínima esperada:

- 100% de reglas y transiciones P0;
- >80% de líneas de API como referencia medible con `test:cov`;
- >90% de ramas en motor tributario, cobertura, idempotencia y validaciones críticas;
- la cobertura porcentual de mobile es un objetivo futuro hasta añadir reporter/configuración; no bloquea por porcentaje, pero sí por casos P0/P1;
- pruebas unitarias + integración PostgreSQL + recorridos reales; mocks por sí solos no cierran un P0.

### Comentarios — Pruebas automatizadas

| Suite/comando | Tu comentario/hallazgo | Test faltante o resultado | Seguimiento |
|---|---|---|---|
| | | | Pendiente |

## 24. Ejecución Android con evidencia

No elegir coordenadas mirando una captura. Primero obtener el árbol UI y calcular el centro de los bounds del elemento.

```bash
adb devices
adb -s <serial> shell cmd package resolve-activity --brief com.konti.app
adb -s <serial> shell am start -n com.konti.app/.MainActivity
adb -s <serial> exec-out uiautomator dump /dev/tty
adb -s <serial> exec-out screencap -p > evidencia.png
adb -s <serial> logcat -c
adb -s <serial> shell pidof -s com.konti.app
adb -s <serial> logcat --pid <pid>
adb -s <serial> logcat -b crash
```

Si el nodo no aparece y existe una región desplazable: hacer swipe evitando los bordes, volver a extraer el árbol y buscar una vez más antes de concluir que falta.

Evidencia mínima por `FAIL`:

- ID de caso y build;
- captura/video;
- request/response sanitizado si intervino API;
- extracto de `logcat` sin datos personales;
- hora exacta y usuario de prueba;
- estado anterior y estado posterior.

### Comentarios — Ejecución en dispositivo

| Dispositivo/build | Tu comentario/hallazgo | Evidencia | Seguimiento |
|---|---|---|---|
| | | | Pendiente |

## 25. Exploraciones dirigidas

| Charter | Tiempo | Misión |
|---|---:|---|
| EXP-01 Sesión hostil | 30 min | Cambiar red/cuenta, expirar sesión y usar Back durante cada transición |
| EXP-02 Formularios hostiles | 45 min | Teclado, calendario, rotación, sheet, doble tap, cancelar y reabrir sin perder datos |
| EXP-03 API hostil | 45 min | Inyectar 4xx/5xx/timeout/no JSON en cada pantalla crítica |
| EXP-04 Datos superpuestos | 45 min | Combinar boletas, snapshots, duplicados y dos empleadores |
| EXP-05 Evidencia incierta | 45 min | RHE al crédito, pago desconocido y deducciones con requisitos parciales |
| EXP-06 Principiante | 30 min | Usuario no experto explica con sus palabras estado, cifra y siguiente acción |
| EXP-07 Privacidad | 30 min | Buscar PII/secrets en pantalla, logs, responses, DB y snapshots |
| EXP-08 Visual/performance | 45 min | Dispositivos pequeños, fuente grande, API lenta, listas largas y reduced motion |

### Comentarios — Exploración libre

Este bloque está pensado específicamente para cosas que encontraste y que todavía no aparecen en ningún caso.

| Fecha | Charter o `LIBRE` | Tu comentario/hallazgo | Hipótesis o riesgo | Evidencia | Seguimiento |
|---|---|---|---|---|---|
| | | | | | Pendiente |

## 26. Plantilla de defecto

```markdown
### [SEVERIDAD] Título centrado en el efecto para el usuario

- Build/commit:
- Dispositivo y SO:
- Usuario/perfil de prueba:
- Caso de la suite:
- Frecuencia: siempre / intermitente
- Red y zona horaria:

Precondiciones:
1.

Pasos:
1.
2.
3.

Resultado actual:

Resultado esperado:

Impacto:

Evidencia:
- captura/video:
- request/response sanitizado:
- logcat:

Notas de privacidad: confirmar que la evidencia no contiene tokens, DNI u OCR crudo.
```

## 27. Registro de ejecución

| Campo | Valor |
|---|---|
| Build/commit | |
| Fecha/hora | |
| QA | |
| Dispositivo/SO | |
| API/DB | |
| Zona horaria/locale | |
| Casos ejecutados | |
| PASS / FAIL / BLOCKED | |
| Defectos bloqueantes/críticos | |
| Riesgo aceptado por | |

## 28. Criterios de salida de Fase 4

La fase puede declararse lista para beta únicamente cuando:

- todos los P0 están ejecutados y en `PASS`;
- no hay defectos bloqueantes, críticos o altos sin resolver;
- los P1 están en `PASS` o tienen excepción escrita, responsable y fecha;
- las cuatro regresiones históricas —`650`, julio, sheet y selector Google— pasan en dispositivo;
- no existe doble conteo de ingresos ni deducciones;
- los cálculos golden y todas las fronteras tributarias pasan;
- autenticación, propiedad, privacidad, idempotencia y rollback se verificaron contra servicios reales;
- la migración se probó en DB limpia y clon pre-0007;
- Inicio, errores y atenciones usan lenguaje comprensible y recuperable;
- ninguna pantalla afirma deuda, devolución o cumplimiento oficial;
- TalkBack, texto grande, teclado, reduced motion y tamaños táctiles pasan;
- API, mobile, typecheck y lint relevantes están verdes;
- cada `FAIL` tiene evidencia y cada `BLOCKED` explica la dependencia.

### Comentarios — Decisión final de calidad

| Tu comentario, reserva o riesgo aceptado | Impacto | Responsable | Fecha/decisión |
|---|---|---|---|
| | | | Pendiente |
