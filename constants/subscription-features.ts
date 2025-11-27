import {
  Zap,
  FileSearch,
  CopyCheck,
  History,
  Percent,
  CloudUpload,
  Bell,
  Table,
  FileSpreadsheet,
  Bot,
  Lightbulb,
  BellRing,
  Headphones,
  Rocket,
} from 'lucide-react-native';

export type Feature = {
  icon: React.ElementType;
  title: string;
  description: string;
  isAvailableInFuture?: boolean;
};

export const FEATURES: Feature[] = [
  {
    icon: Zap,
    title: 'Extracción de Datos con IA',
    description:
      'Obtén RUC, monto total, fecha y más automáticamente desde tus comprobantes.',
  },
  {
    icon: FileSearch,
    title: 'Identificación de Gastos Deducibles',
    description:
      'Detecta si una boleta califica como gasto deducible según SUNAT.',
  },
  {
    icon: Headphones,
    title: 'Soporte Prioritario',
    description:
      'Recibe ayuda más rápida y con prioridad sobre otros usuarios.',
  },
  {
    icon: Rocket,
    title: 'Acceso Anticipado a Nuevas Funciones',
    description: 'Prueba novedades antes de que lleguen al público general.',
  },
  {
    icon: History,
    title: 'Historial Anual Organizado',
    description:
      'Revisa tus boletas ordenadas por mes y tipo para tener control absoluto.',
  },
  {
    icon: Percent,
    title: 'Proyección de Ahorro Tributario',
    description:
      'Estimación mensual y anual del ahorro que generas con tus boletas.',
  },
  {
    icon: CloudUpload,
    title: 'Subidas Ilimitadas',
    description: 'Carga todas las boletas que necesites sin restricciones.',
  },
  {
    icon: Bell,
    title: 'Recordatorios de Registro',
    description: 'Recibe notificaciones para mantener tus comprobantes al día.',
  },
  {
    icon: Table,
    title: 'Reportes Mensuales en Excel',
    description: 'Exporta tus gastos mensualmente en Excel.',
  },
  {
    icon: FileSpreadsheet,
    title: 'Reporte Anual SUNAT',
    description:
      'Recibe un reporte consolidado del año listo para la declaración.',
  },
  {
    icon: Bot,
    title: 'Asistente Tributario con IA',
    description:
      'Responde dudas sobre deducciones y te guía durante el año fiscal.',
  },
  {
    icon: Lightbulb,
    title: 'Recomendaciones Personalizadas',
    description:
      'La IA analiza tus datos y te sugiere cómo maximizar tus deducciones.',
    isAvailableInFuture: true,
  },
  {
    icon: BellRing,
    title: 'Alertas de Boletas Faltantes',
    description:
      'Detecta meses o categorías donde podrías estar dejando dinero en la mesa.',
    isAvailableInFuture: true,
  },
  {
    icon: CopyCheck,
    title: 'Detección de Duplicados',
    description:
      'Evita errores con comprobantes repetidos o cargados anteriormente.',
    isAvailableInFuture: true,
  },
];
