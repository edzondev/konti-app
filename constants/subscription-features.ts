export type Feature = {
  title: string;
  description: string;
  isAvailableInFuture?: boolean;
};

export const FEATURES: Feature[] = [
  {
    title: 'Extracción de Datos con IA',
    description:
      'Obtén RUC, monto total, fecha y más automáticamente desde tus comprobantes.',
  },
  {
    title: 'Identificación de Gastos Deducibles',
    description:
      'Detecta si una boleta califica como gasto deducible según SUNAT.',
  },
  {
    title: 'Soporte Prioritario',
    description:
      'Recibe ayuda más rápida y con prioridad sobre otros usuarios.',
  },
  {
    title: 'Acceso Anticipado a Nuevas Funciones',
    description: 'Prueba novedades antes de que lleguen al público general.',
  },
  {
    title: 'Historial Anual Organizado',
    description:
      'Revisa tus boletas ordenadas por mes y tipo para tener control absoluto.',
  },
  {
    title: 'Subidas Ilimitadas',
    description: 'Carga todas las boletas que necesites sin restricciones.',
  },
  {
    title: 'Reporte Anual SUNAT',
    description:
      'Recibe un reporte consolidado del año listo para la declaración.',
  },
  {
    title: 'Asistente Tributario - Konti',
    description:
      'Responde dudas sobre deducciones y te guía durante el año fiscal.',
  },
  {
    title: 'Proyección de Ahorro Tributario',
    description:
      'Estimación mensual y anual del ahorro que generas con tus boletas.',
    isAvailableInFuture: true,
  },
  {
    title: 'Recordatorios de Registro',
    description: 'Recibe notificaciones para mantener tus comprobantes al día.',
    isAvailableInFuture: true,
  },
  {
    title: 'Recomendaciones Personalizadas',
    description:
      'La IA analiza tus datos y te sugiere cómo maximizar tus deducciones.',
    isAvailableInFuture: true,
  },
  {
    title: 'Alertas de Boletas Faltantes',
    description:
      'Detecta meses o categorías donde podrías estar dejando dinero en la mesa.',
    isAvailableInFuture: true,
  },
  {
    title: 'Detección de Duplicados',
    description:
      'Evita errores con comprobantes repetidos o cargados anteriormente.',
    isAvailableInFuture: true,
  },
];
