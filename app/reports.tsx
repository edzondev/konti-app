import {
  View,
  Text,
  Pressable,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { CheckCircle2, AlertTriangle } from 'lucide-react-native';
import { COLORS } from '@/constants/colors';
import { useReportsScreen } from '@/hooks/reports/use-reports-screen';
import { YearSelector } from '@/components/shared/reports/year-selector';
import { ReportSummaryStats } from '@/components/shared/reports/report-summary-stats';
import { DeductibleAmountCard } from '@/components/shared/reports/deductible-amount-card';
import { DownloadSection } from '@/components/shared/reports/download-section';
import { CategoriesBreakdown } from '@/components/shared/reports/categories-breakdown';
import { cn } from '@/lib/utils';
import MainLayout from '@/components/layouts/main-layout';

export default function ReportsScreen() {
  const {
    selectedYear,
    showYearPicker,
    isGenerating,
    lastReport,
    error,
    handleGenerateReport,
    handleDownload,
    toggleYearPicker,
    selectYear,
  } = useReportsScreen();

  return (
    <MainLayout edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          flexGrow: 1,
          paddingHorizontal: 16,
          paddingBottom: 24,
        }}
        keyboardShouldPersistTaps="handled"
      >
        <View className="my-8">
          <Text
            className="text-3xl font-bold text-neutral-foreground"
            numberOfLines={1}
          >
            Reportes Anuales
          </Text>
        </View>

        <View className="rounded-2xl bg-white">
          <YearSelector
            selectedYear={selectedYear}
            showYearPicker={showYearPicker}
            onTogglePicker={toggleYearPicker}
            onSelectYear={selectYear}
          />

          <Pressable
            onPress={handleGenerateReport}
            disabled={isGenerating}
            className={cn(
              'flex-row items-center justify-center gap-2.5 rounded-xl py-3.5',
              isGenerating && 'bg-primary-default/60',
              !isGenerating &&
                'bg-primary-default active:bg-primary-default/90',
            )}
          >
            {isGenerating ? (
              <>
                <ActivityIndicator size="small" color={COLORS.neutral.white} />
                <Text className="text-base font-semibold text-neutral-white">
                  Generando reporte...
                </Text>
              </>
            ) : (
              <Text className="text-base font-semibold text-neutral-white">
                Generar Reporte {selectedYear}
              </Text>
            )}
          </Pressable>
        </View>
        <View className="my-8 h-px w-full bg-neutral-border" />
        <View className="flex-1 flex-col gap-5">
          {error && (
            <View className="mb-4 flex-row items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
              <AlertTriangle
                size={20}
                color={COLORS.destructive.default}
                strokeWidth={2}
              />
              <Text className="flex-1 text-sm leading-5 text-destructive-default">
                {error}
              </Text>
            </View>
          )}

          {lastReport && (
            <>
              <View className="flex-row items-center gap-3 rounded-2xl border border-success-default/20 bg-success-default/5 p-4">
                <CheckCircle2
                  size={20}
                  color={COLORS.success.default}
                  strokeWidth={2}
                />
                <View className="flex-1">
                  <Text className="text-sm font-semibold text-success-dark">
                    Reporte generado exitosamente
                  </Text>
                  <Text className="text-xs text-success-dark">
                    {new Date(lastReport.generated_at).toLocaleString('es-PE', {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    })}
                  </Text>
                </View>
              </View>

              <ReportSummaryStats
                totalReceipts={lastReport.summary.total_receipts}
                deductibleReceipts={lastReport.summary.deductible_receipts}
              />

              <DeductibleAmountCard
                deductibleAmount={lastReport.summary.deductible_amount}
                percentageOfLimit={lastReport.summary.percentage_of_limit}
              />

              <DownloadSection
                textReportUrl={lastReport.downloads.text_report}
                csvDetailUrl={lastReport.downloads.csv_detail}
                onDownload={handleDownload}
              />

              <CategoriesBreakdown categories={lastReport.categories} />
            </>
          )}

          <View className="rounded-2xl border border-warning-default/20 bg-warning-default/5 p-4">
            <View className="flex-row items-start gap-3">
              <View className="mt-0.5 h-8 w-8 items-center justify-center rounded-full bg-warning-default/15">
                <AlertTriangle
                  size={16}
                  color={COLORS.destructive.default}
                  strokeWidth={2}
                />
              </View>
              <View className="flex-1">
                <Text className="mb-1 text-sm font-semibold text-warning-dark">
                  Aviso importante
                </Text>
                <Text className="text-sm leading-5 text-warning-dark">
                  Este reporte es generado automáticamente con fines
                  informativos. Consulta con un contador público colegiado para
                  validar la información antes de presentarla a SUNAT.
                </Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </MainLayout>
  );
}
