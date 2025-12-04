import { View, Text, Pressable } from 'react-native';
import { Download, FileDown, FileSpreadsheet } from 'lucide-react-native';
import { COLORS } from '@/constants/colors';

type DownloadSectionProps = {
  textReportUrl: string | null;
  csvDetailUrl: string | null;
  onDownload: (url: string | null, type: string) => void;
};

export function DownloadSection({
  textReportUrl,
  csvDetailUrl,
  onDownload,
}: DownloadSectionProps) {
  return (
    <View className="rounded-2xl bg-white py-4">
      <Text className="mb-4 text-xs font-semibold uppercase tracking-wider text-neutral-muted">
        Descargar archivos
      </Text>

      <View className="gap-3">
        <Pressable
          onPress={() => onDownload(textReportUrl, 'reporte')}
          className="flex-row items-center gap-4 rounded-xl border border-primary-default/20 bg-primary-default/5 p-4 active:bg-primary-default/10"
        >
          <View className="h-11 w-11 items-center justify-center rounded-xl bg-primary-default">
            <FileDown size={20} color={COLORS.neutral.white} strokeWidth={2} />
          </View>
          <View className="flex-1">
            <Text className="text-base font-semibold text-primary-default">
              Resumen de Deducciones
            </Text>
            <Text className="mt-0.5 text-xs text-neutral-muted">
              Archivo TXT • Ideal para tu contador
            </Text>
          </View>
          <Download size={18} color={COLORS.primary.default} strokeWidth={2} />
        </Pressable>

        <Pressable
          onPress={() => onDownload(csvDetailUrl, 'CSV')}
          className="flex-row items-center gap-4 rounded-xl border border-neutral-border bg-white p-4 active:bg-neutral-border"
        >
          <View className="h-11 w-11 items-center justify-center rounded-xl bg-neutral-border">
            <FileSpreadsheet
              size={20}
              color={COLORS.neutral.muted}
              strokeWidth={2}
            />
          </View>
          <View className="flex-1">
            <Text className="text-base font-semibold text-primary-default">
              Detalle Completo
            </Text>
            <Text className="mt-0.5 text-xs text-neutral-muted">
              Archivo CSV • Para análisis en Excel
            </Text>
          </View>
          <Download size={18} color={COLORS.neutral.muted} strokeWidth={2} />
        </Pressable>
      </View>
    </View>
  );
}
