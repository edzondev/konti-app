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
    <View className="mb-4 rounded-2xl border border-neutral-border bg-white p-5">
      <Text className="text-neutral-muted mb-4 text-xs font-semibold uppercase tracking-wider">
        Descargar archivos
      </Text>

      <View className="gap-3">
        <Pressable
          onPress={() => onDownload(textReportUrl, 'reporte')}
          className="border-primary-default/20 bg-primary-default/5 active:bg-primary-default/10 flex-row items-center gap-4 rounded-xl border p-4"
        >
          <View className="bg-primary-default h-11 w-11 items-center justify-center rounded-xl">
            <FileDown size={20} color={COLORS.neutral.white} strokeWidth={2} />
          </View>
          <View className="flex-1">
            <Text className="text-primary-default text-base font-semibold">
              Resumen de Deducciones
            </Text>
            <Text className="text-neutral-muted mt-0.5 text-xs">
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
            <Text className="text-primary-default text-base font-semibold">
              Detalle Completo
            </Text>
            <Text className="text-neutral-muted mt-0.5 text-xs">
              Archivo CSV • Para análisis en Excel
            </Text>
          </View>
          <Download size={18} color={COLORS.neutral.muted} strokeWidth={2} />
        </Pressable>
      </View>
    </View>
  );
}
