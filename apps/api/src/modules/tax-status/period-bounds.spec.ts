import { lastDayOfPeriod } from "./period-bounds";

describe("lastDayOfPeriod", () => {
	it("returns the last day of a 30-day month", () => {
		expect(lastDayOfPeriod("2026-09")).toBe("2026-09-30");
		expect(lastDayOfPeriod("2026-04")).toBe("2026-04-30");
		expect(lastDayOfPeriod("2026-06")).toBe("2026-06-30");
		expect(lastDayOfPeriod("2026-11")).toBe("2026-11-30");
	});

	it("returns February 28 in non-leap years", () => {
		expect(lastDayOfPeriod("2026-02")).toBe("2026-02-28");
	});

	it("returns February 29 in leap years", () => {
		expect(lastDayOfPeriod("2024-02")).toBe("2024-02-29");
	});

	it("returns the last day of 31-day months", () => {
		expect(lastDayOfPeriod("2026-01")).toBe("2026-01-31");
		expect(lastDayOfPeriod("2026-12")).toBe("2026-12-31");
	});
});
