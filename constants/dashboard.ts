import { COLORS } from '@/constants/colors';
import { Crown, Receipt, TrendingUp, Wallet, Zap } from 'lucide-react-native';

export const KPI_CARD_CONFIG = [
  {
    key: 'receipts',
    icon: Receipt,
    color: COLORS.primary.default,
    bgColor: 'bg-primary-default/10',
    iconBgColor: 'bg-primary-default/10',
    label: 'Archivos',
    getValue: (kpis: any) => kpis?.total_receipts ?? 0,
  },
  {
    key: 'total',
    icon: Wallet,
    color: '#10b981',
    bgColor: 'bg-success-default/10',
    iconBgColor: 'bg-success-default/10',
    label: 'Total',
    getValue: (kpis: any) => {
      const amount = kpis?.total_amount_sum ?? 0;
      return `S/${amount.toFixed(2)}`;
    },
  },
  {
    key: 'expenses',
    icon: TrendingUp,
    color: '#8b5cf6',
    bgColor: 'bg-secondary-default/10',
    iconBgColor: 'bg-secondary-default/10',
    label: 'Contables',
    getValue: (kpis: any) => kpis?.expense_receipts ?? 0,
  },
] as const;

export const PLAN_CONFIG = {
  free: { icon: Zap, label: 'Free', color: '#6b7280' },
  plus: { icon: Crown, label: 'Konti Plus', color: '#8b5cf6' },
  // Legacy plans (for backwards compatibility)
  pro: { icon: Zap, label: 'Pro', color: '#6b7280' },
  premium: { icon: Crown, label: 'Premium', color: '#8b5cf6' },
} as const;
