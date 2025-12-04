import { useState } from 'react';
import { Alert, Linking } from 'react-native';
import { useAnnualReport } from './use-annual-report';

export function useReportsScreen() {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [showYearPicker, setShowYearPicker] = useState(false);
  const { generateReport, isGenerating, lastReport, error } = useAnnualReport();

  const handleGenerateReport = async () => {
    const result = await generateReport(selectedYear);

    if (!result.success) {
      Alert.alert('Error', result.error || 'No se pudo generar el reporte');
    }
  };

  const handleDownload = async (url: string | null, type: string) => {
    if (!url) {
      Alert.alert('Error', 'URL de descarga no disponible');
      return;
    }

    try {
      await Linking.openURL(url);
    } catch {
      Alert.alert('Error', `No se pudo abrir el ${type}`);
    }
  };

  const toggleYearPicker = () => setShowYearPicker((prev) => !prev);

  const selectYear = (year: number) => {
    setSelectedYear(year);
    setShowYearPicker(false);
  };

  return {
    selectedYear,
    showYearPicker,
    isGenerating,
    lastReport,
    error,
    handleGenerateReport,
    handleDownload,
    toggleYearPicker,
    selectYear,
  };
}

