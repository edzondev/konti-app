import { COLORS } from '@/constants/colors';
import { Crown, Receipt, TrendingUp, Wallet, Zap } from 'lucide-react-native';

export const KPI_CARD_CONFIG = [
  {
    key: 'receipts',
    icon: Receipt,
    color: COLORS.primary,
    bgColor: 'bg-primary/10',
    iconBgColor: 'bg-primary/10',
    label: 'Boletas',
    getValue: (kpis: any) => kpis?.total_receipts ?? 0,
  },
  {
    key: 'total',
    icon: Wallet,
    color: '#10b981',
    bgColor: 'bg-emerald-500/10',
    iconBgColor: 'bg-emerald-500/10',
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
    bgColor: 'bg-violet-500/10',
    iconBgColor: 'bg-violet-500/10',
    label: 'Contables',
    getValue: (kpis: any) => kpis?.expense_receipts ?? 0,
  },
] as const;

export const PLAN_CONFIG = {
  free: { icon: Zap, label: 'Free' },
  pro: { icon: Zap, label: 'Pro' },
  premium: { icon: Crown, label: 'Premium' },
} as const;
