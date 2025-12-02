import {
  View,
  Text,
  Pressable,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import {
  FileText,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
} from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '@/constants/colors';
import { useReportsScreen } from '@/hooks/reports/use-reports-screen';
import { YearSelector } from '@/components/shared/reports/year-selector';
import { ReportSummaryStats } from '@/components/shared/reports/report-summary-stats';
import { DeductibleAmountCard } from '@/components/shared/reports/deductible-amount-card';
import { DownloadSection } from '@/components/shared/reports/download-section';
import { CategoriesBreakdown } from '@/components/shared/reports/categories-breakdown';

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
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 24 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="mb-6">
          <View className="mb-2 flex-row items-center gap-2">
            <View className="bg-primary-default h-10 w-10 items-center justify-center rounded-xl">
              <FileText size={20} color="#fff" strokeWidth={2} />
            </View>
            <View className="flex-1">
              <Text className="text-[22px] font-bold tracking-tight text-neutral-foreground">
                Reporte Anual
              </Text>
              <Text className="text-neutral-muted text-sm">
                Deducciones fiscales
              </Text>
            </View>
          </View>
        </View>

        <View className="mb-4 rounded-2xl border border-neutral-border bg-white p-5">
          <YearSelector
            selectedYear={selectedYear}
            showYearPicker={showYearPicker}
            onTogglePicker={toggleYearPicker}
            onSelectYear={selectYear}
          />

          <Pressable
            onPress={handleGenerateReport}
            disabled={isGenerating}
            className={`mt-5 flex-row items-center justify-center gap-2.5 rounded-xl py-4 ${
              isGenerating
                ? 'bg-primary-default/60'
                : 'bg-primary-default active:bg-primary-default/90'
            }`}
          >
            {isGenerating ? (
              <>
                <ActivityIndicator size="small" color="#fff" />
                <Text className="text-base font-semibold text-neutral-white">
                  Generando reporte...
                </Text>
              </>
            ) : (
              <>
                <Sparkles size={18} color="#fff" strokeWidth={2} />
                <Text className="text-base font-semibold text-neutral-white">
                  Generar Reporte {selectedYear}
                </Text>
              </>
            )}
          </Pressable>
        </View>

        {error && (
          <View className="mb-4 flex-row items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
            <AlertTriangle
              size={20}
              color={COLORS.destructive.default}
              strokeWidth={2}
            />
            <Text className="text-destructive-default flex-1 text-sm leading-5">
              {error}
            </Text>
          </View>
        )}

        {lastReport && (
          <>
            <View className="mb-4 flex-row items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
              <CheckCircle2 size={20} color="#059669" strokeWidth={2} />
              <View className="flex-1">
                <Text className="text-sm font-semibold text-emerald-800">
                  Reporte generado exitosamente
                </Text>
                <Text className="text-xs text-emerald-600">
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

        <View className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <View className="flex-row items-start gap-3">
            <View className="mt-0.5 h-8 w-8 items-center justify-center rounded-lg bg-amber-100">
              <AlertTriangle
                size={16}
                color={COLORS.destructive.default}
                strokeWidth={2}
              />
            </View>
            <View className="flex-1">
              <Text className="mb-1 text-sm font-semibold text-amber-800">
                Aviso importante
              </Text>
              <Text className="text-xs leading-5 text-amber-700">
                Este reporte es generado automáticamente con fines informativos.
                La clasificación de gastos es orientativa. Consulta con un
                contador público colegiado para validar la información antes de
                presentarla a SUNAT.
              </Text>
            </View>
          </View>
        </View>

        <View className="h-6" />
      </ScrollView>
    </SafeAreaView>
  );
}
