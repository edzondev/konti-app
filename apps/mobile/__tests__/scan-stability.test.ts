import { describe, expect, it } from "vitest";
import {
	observeQr,
	observeQrLatch,
	QR_STABLE_MS,
	type QrHold,
	type QrLatch,
} from "@/features/scan/scan-stability";

const empty: QrHold = { value: null, since: null };

describe("observeQr", () => {
	it("first sighting is not stable and records since", () => {
		const result = observeQr(empty, "ABC", 1_000);
		expect(result.stableValue).toBeNull();
		expect(result.hold).toEqual({ value: "ABC", since: 1_000 });
	});

	it("same value at +299ms is not stable", () => {
		const hold: QrHold = { value: "ABC", since: 1_000 };
		const result = observeQr(hold, "ABC", 1_000 + QR_STABLE_MS - 1);
		expect(QR_STABLE_MS).toBe(300);
		expect(result.stableValue).toBeNull();
		expect(result.hold).toEqual(hold);
	});

	it("same value at +300ms is stable", () => {
		const hold: QrHold = { value: "ABC", since: 1_000 };
		const atThreshold = observeQr(hold, "ABC", 1_000 + QR_STABLE_MS);
		expect(atThreshold.stableValue).toBe("ABC");
		expect(atThreshold.hold).toEqual(hold);
		const later = observeQr(hold, "ABC", 1_000 + QR_STABLE_MS + 200);
		expect(later.stableValue).toBe("ABC");
		expect(later.hold).toEqual(hold);
	});

	it("a different value resets the window and is not stable", () => {
		const hold: QrHold = { value: "ABC", since: 1_000 };
		const result = observeQr(hold, "XYZ", 2_000);
		expect(result.stableValue).toBeNull();
		expect(result.hold).toEqual({ value: "XYZ", since: 2_000 });
	});

	it("null clears the hold and is not stable", () => {
		const hold: QrHold = { value: "ABC", since: 1_000 };
		const result = observeQr(hold, null, 2_000);
		expect(result.stableValue).toBeNull();
		expect(result.hold).toEqual({ value: null, since: null });
	});

	it("same value with a null since is a fresh sighting", () => {
		const hold: QrHold = { value: "ABC", since: null };
		const result = observeQr(hold, "ABC", 1_000);
		expect(result.stableValue).toBeNull();
		expect(result.hold).toEqual({ value: "ABC", since: 1_000 });
	});
});

describe("observeQrLatch", () => {
	it("does not capture the same stable QR again until an empty frame clears the latch", () => {
		const initial: QrLatch = { hold: empty, value: null };
		const seen = observeQrLatch(initial, "ABC", 1_000, false);
		const captured = observeQrLatch(seen.latch, "ABC", 1_000 + QR_STABLE_MS, false);
		expect(captured.captureValue).toBe("ABC");

		const duringSaved = observeQrLatch(captured.latch, "ABC", 1_500, true);
		expect(duringSaved.captureValue).toBeNull();
		const changed = observeQrLatch(duringSaved.latch, "XYZ", 1_600, true);
		const stableChanged = observeQrLatch(changed.latch, "XYZ", 1_600 + QR_STABLE_MS, true);
		const afterSaved = observeQrLatch(stableChanged.latch, "XYZ", 4_000, false);
		expect(afterSaved.captureValue).toBeNull();

		const cleared = observeQrLatch(afterSaved.latch, null, 4_100, true);
		expect(cleared.latch).toEqual({ hold: empty, value: null });
		const seenAgain = observeQrLatch(cleared.latch, "ABC", 4_200, false);
		const capturedAgain = observeQrLatch(seenAgain.latch, "ABC", 4_200 + QR_STABLE_MS, false);
		expect(capturedAgain.captureValue).toBe("ABC");
	});
});
