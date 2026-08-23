import { Text, View } from "react-native";

export function TaxDeductionCandidateCard({
	sourceDocumentId,
}: {
	sourceDocumentId: string | null;
}) {
	if (!sourceDocumentId) {
		return (
			<View className="rounded-[20px] border border-konti-ivory/10 p-4">
				<Text className="text-[13px] leading-5 text-konti-ivory/45">
					La evidencia es opcional. Sin ella puedes confirmar lo que revisaste o dejar el gasto como
					potencial.
				</Text>
			</View>
		);
	}

	return (
		<View className="rounded-[20px] border border-konti-primary/30 bg-konti-primary/10 p-4">
			<Text className="text-[13px] font-medium text-konti-ivory">Evidencia disponible</Text>
			<Text className="mt-1 text-[12px] leading-5 text-konti-ivory/45">
				Este registro puede conservar el documento ya adjunto. Eso no equivale a una validación
				oficial.
			</Text>
		</View>
	);
}
