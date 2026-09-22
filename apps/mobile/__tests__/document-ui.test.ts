import { describe, expect, it } from "vitest";
import type { DocumentListItem } from "../features/documents/document";
import {
	dayLabel,
	groupDocumentsByPeriod,
	monthTitle,
	monthTotals,
	rowSubtitle,
	shiftMonth,
} from "../features/documents/document-ui";

const NOW = new Date("2026-09-17T18:00:00-05:00");

function doc(
	partial: Partial<DocumentListItem> & Pick<DocumentListItem, "id" | "status">,
): DocumentListItem {
	return {
		issuerName: "ACME",
		totalAmount: "10.00",
		currencyCode: "PEN",
		issueDate: "2026-09-17",
		category: "supermercado",
		documentType: "boleta",
		createdAt: "2026-09-17T12:00:00.000Z",
		...partial,
	};
}

describe("document-ui", () => {
	it("shifts YYYY-MM by n months", () => {
		expect(shiftMonth("2026-09", -1)).toBe("2026-08");
		expect(shiftMonth("2026-01", -1)).toBe("2025-12");
		expect(shiftMonth("2026-12", 1)).toBe("2027-01");
	});

	it("titles months in Spanish", () => {
		expect(monthTitle("2026-09")).toBe("Septiembre 2026");
		expect(monthTitle("2026-08")).toBe("Agosto 2026");
	});

	it("groups by today, this week, and earlier", () => {
		const sections = groupDocumentsByPeriod(
			[
				doc({
					id: "11111111-1111-4111-8111-111111111111",
					status: "ready",
					issueDate: "2026-09-17",
				}),
				doc({
					id: "22222222-2222-4222-8222-222222222222",
					status: "ready",
					issueDate: "2026-09-16",
				}),
				doc({
					id: "33333333-3333-4333-8333-333333333333",
					status: "ready",
					issueDate: "2026-09-10",
				}),
				doc({
					id: "44444444-4444-4444-8444-444444444444",
					status: "pending",
					issueDate: null,
					createdAt: "2026-09-17T19:00:00.000Z",
				}),
			],
			NOW,
		);

		expect(sections.map((s) => s.key)).toEqual(["hoy", "esta_semana", "anteriores"]);
		expect(sections[0]?.data).toHaveLength(2);
		expect(sections[1]?.data[0]?.issueDate).toBe("2026-09-16");
		expect(sections[2]?.data[0]?.issueDate).toBe("2026-09-10");
	});

	it("sums only ready amounts", () => {
		expect(
			monthTotals([
				doc({ id: "11111111-1111-4111-8111-111111111111", status: "ready", totalAmount: "87.40" }),
				doc({
					id: "22222222-2222-4222-8222-222222222222",
					status: "pending",
					totalAmount: "99.00",
				}),
				doc({ id: "33333333-3333-4333-8333-333333333333", status: "failed", totalAmount: null }),
			]),
		).toEqual({ amount: 87.4, count: 3 });
	});

	it("labels today vs weekday", () => {
		expect(dayLabel("2026-09-17", "2026-09-17")).toBe("Hoy");
		expect(dayLabel("2026-09-11", "2026-09-17")).toBe("Vie 11");
	});

	it("builds pending and failed subtitles", () => {
		expect(
			rowSubtitle(
				doc({
					id: "11111111-1111-4111-8111-111111111111",
					status: "pending",
					issueDate: null,
					createdAt: "2026-09-17T19:22:00-05:00",
				}),
				"2026-09-17",
			),
		).toMatch(/Leyendo la foto · Hoy/);

		expect(
			rowSubtitle(
				doc({
					id: "22222222-2222-4222-8222-222222222222",
					status: "failed",
					issueDate: null,
					createdAt: "2026-09-17T13:08:00-05:00",
				}),
				"2026-09-17",
			),
		).toMatch(/Sin categoría · Hoy/);
	});
});
