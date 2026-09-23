export const QR_STABLE_MS = 300;

export type QrHold = {
	value: string | null;
	since: number | null;
};

export type QrLatch = {
	hold: QrHold;
	value: string | null;
};

export function observeQr(
	hold: QrHold,
	nextValue: string | null,
	now: number,
): { hold: QrHold; stableValue: string | null } {
	if (nextValue !== null && nextValue === hold.value && hold.since !== null) {
		return { hold, stableValue: now - hold.since >= QR_STABLE_MS ? nextValue : null };
	}
	return {
		hold: nextValue === null ? { value: null, since: null } : { value: nextValue, since: now },
		stableValue: null,
	};
}

export function observeQrLatch(
	latch: QrLatch,
	nextValue: string | null,
	now: number,
	captureBlocked: boolean,
): { latch: QrLatch; stableValue: string | null; captureValue: string | null } {
	const next = observeQr(latch.hold, nextValue, now);
	if (nextValue === null) {
		return {
			latch: { hold: next.hold, value: null },
			stableValue: null,
			captureValue: null,
		};
	}

	const captureValue = !captureBlocked && latch.value === null ? next.stableValue : null;
	return {
		latch: {
			hold: next.hold,
			value: captureValue ?? latch.value,
		},
		stableValue: next.stableValue,
		captureValue,
	};
}
