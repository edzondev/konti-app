import {
  Aperture,
  Infinity,
  FileText,
  Zap,
  Crown,
  ShieldCheck,
} from 'lucide-react-native';

export type Feature = {
  icon: React.ElementType;
  title: string;
  description: string;
  pro: boolean;
  premium: boolean;
  isAvailableInFuture?: boolean;
};

export const BASE_FEATURES: Feature[] = [
  {
    icon: Zap,
    title: 'Extracción de Datos con IA',
    description:
      'Procesamiento automático para obtener RUC, monto total y fecha en segundos.',
    pro: true,
    premium: true,
  },
  {
    icon: ShieldCheck,
    title: 'Clasificación Contable Automática',
    description:
      'La IA identifica si tu boleta es contable (de gasto) para una mejor organización.',
    pro: true,
    premium: true,
  },
  {
    icon: FileText,
    title: 'Reportes y Exportación',
    description: 'Genera reportes y exporta tus datos en Excel mensualmente.',
    pro: true,
    premium: true,
    isAvailableInFuture: true,
  },
];

export const PRO_UPGRADE_FEATURES: Feature[] = [
  {
    icon: Aperture,
    title: 'Límite de Carga Ampliado',
    description: 'Sube hasta 20 boletas por mes.',
    pro: true,
    premium: true,
  },
  {
    icon: ShieldCheck,
    title: 'Asistencia Estándar',
    description: 'Soporte técnico disponible en horario laboral.',
    pro: true,
    premium: true,
  },
];

export const PREMIUM_EXCLUSIVE_FEATURES: Feature[] = [
  {
    icon: Infinity,
    title: 'Subidas Ilimitadas',
    description: 'Olvídate de los límites: carga boletas sin restricciones.',
    pro: false,
    premium: true,
  },
  {
    icon: Crown,
    title: 'Reporte Fiscal SUNAT',
    description:
      'Genera un reporte anual consolidado, listo para tus declaraciones.',
    pro: false,
    premium: true,
    isAvailableInFuture: true,
  },
  {
    icon: Zap,
    title: 'Soporte VIP Prioritario',
    description: 'Respuesta inmediata a tus consultas con prioridad absoluta.',
    pro: false,
    premium: true,
  },
  {
    icon: Aperture,
    title: 'Acceso Exclusivo',
    description:
      'Sé el primero en probar nuevas funciones antes de su lanzamiento oficial.',
    pro: false,
    premium: true,
  },
];

export const ALL_FEATURES = [
  ...BASE_FEATURES,
  ...PRO_UPGRADE_FEATURES,
  ...PREMIUM_EXCLUSIVE_FEATURES,
];
