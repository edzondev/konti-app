type CaptureClient = {
	capture: (event: string, properties?: Record<string, number>) => void;
};

type CaptureLeave = {
	openedAt: number;
	leftAt: number;
	uploaded: boolean;
	busy: boolean;
};

export function trackView(
	client: CaptureClient | null | undefined,
	event: "home_viewed" | "capture_opened",
): void {
	client?.capture(event);
}

export function trackFeature(
	client: CaptureClient | null | undefined,
	event:
		| "deductions_sheet_opened"
		| "deductions_year_viewed"
		| "document_edited"
		| "export_requested"
		| "sign_out",
): void {
	client?.capture(event);
}

export function trackCaptureLeave(
	client: CaptureClient | null | undefined,
	visit: CaptureLeave,
): void {
	if (!client || visit.uploaded || visit.busy) return;
	client.capture("capture_abandoned", {
		time_in_screen_ms: Math.max(0, visit.leftAt - visit.openedAt),
	});
}
