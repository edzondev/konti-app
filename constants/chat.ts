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
  },
  {
    id: 'limit_status',
    title: 'Límite Anual',
    description: 'Consulta el estado de tu límite.',
    icon: TrendingUp,
  },
  {
    id: 'pending_review',
    title: 'Pendientes',
    description: 'Revisa comprobantes por revisar.',
    icon: MessageCircle,
  },
  {
    id: 'tips',
    title: 'Consejos',
    description: 'Tips para optimizar tus deducciones.',
    icon: Lightbulb,
  },
];
