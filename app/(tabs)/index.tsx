import { ScrollView } from 'react-native';
import { useAuth } from '@/components/providers/auth-provider';
import { SuccessModal } from '@/components/ui/success-modal';
import DashboardHeader from '@/components/shared/dashboard/header';
import StatsCards from '@/components/shared/dashboard/stats-cards';
import PlanCard from '@/components/shared/dashboard/plan-card';
import QuickActions from '@/components/shared/dashboard/quick-actions';
import { useDashboardHeader } from '@/hooks/dashboard/use-dashboard-header';
import MainLayout from '@/components/layouts/main-layout';

export default function Index() {
  const { isNewUser, clearNewUserFlag } = useAuth();
  const {
    kpis,
    kpisLoading,
    hasPlus,
    isUnlimited,
    usedCount,
    planLimit,
    remainingCount,
  } = useDashboardHeader();

  return (
    <MainLayout edges={['top', 'bottom']}>
      <ScrollView
        className="flex-1"
        contentContainerClassName="px-4 pb-6"
        showsVerticalScrollIndicator={false}
      >
        <DashboardHeader />
        <StatsCards
          totalAmount={kpis?.total_amount_sum ?? null}
          totalReceipts={kpis?.total_receipts ?? null}
          expenseReceipts={kpis?.expense_receipts ?? null}
          isLoading={kpisLoading}
        />
        <PlanCard
          hasPlus={hasPlus}
          isUnlimited={isUnlimited}
          usedCount={usedCount}
          planLimit={planLimit}
          remainingCount={remainingCount}
        />
        <QuickActions />
      </ScrollView>

      {isNewUser && (
        <SuccessModal
          visible={isNewUser}
          onClose={clearNewUserFlag}
          title="¡Bienvenido!"
          message="Ahora estas listo para usar KONTI!"
          buttonText="Empezar"
        />
      )}
    </MainLayout>
  );
}
