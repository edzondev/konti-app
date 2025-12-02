import {
  Sparkles,
  TrendingUp,
  MessageCircle,
  Lightbulb,
} from 'lucide-react-native';

export const QUICK_PROMPT_FEATURES = [
  {
    id: 'summary',
    title: 'Resumen',
    description: 'Obtén un resumen de tus deducciones.',
    icon: Sparkles,
    iconColor: '#F97316',
    iconBgColor: 'rgba(249, 115, 22, 0.15)',
  },
  {
    id: 'limit_status',
    title: 'Límite Anual',
    description: 'Consulta el estado de tu límite.',
    icon: TrendingUp,
    iconColor: '#EC4899',
    iconBgColor: 'rgba(236, 72, 153, 0.15)',
  },
  {
    id: 'pending_review',
    title: 'Pendientes',
    description: 'Revisa comprobantes por revisar.',
    icon: MessageCircle,
    iconColor: '#22C55E',
    iconBgColor: 'rgba(34, 197, 94, 0.15)',
  },
  {
    id: 'tips',
    title: 'Consejos',
    description: 'Tips para optimizar tus deducciones.',
    icon: Lightbulb,
    iconColor: '#FACC15',
    iconBgColor: 'rgba(250, 204, 21, 0.15)',
  },
];

