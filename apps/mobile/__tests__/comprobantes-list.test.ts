import { describe, expect, it } from "vitest";
import type { Document } from "@/features/comprobantes/comprobantes-document";
import {
	dayLabel,
	formatClock,
	groupDocuments,
	toListView,
} from "@/features/comprobantes/comprobantes-list";

const now = new Date("2026-09-22T15:00:00.000Z");

function doc(partial: Partial<Document> & Pick<Document, "id">): Document {
	return {
		status: "ready",
		source: "camera",
		documentType: "boleta",
		category: "otros",
		issuerName: null,
		issuerTaxId: null,
		issueDate: null,
		documentNumber: null,
		currencyCode: null,
		totalAmount: null,
		igvAmount: null,
		createdAt: "2026-09-22T12:00:00.000Z",
		...partial,
	};
}

describe("groupDocuments", () => {
	it("groups issueDate on today as Hoy", () => {
		const groups = groupDocuments([doc({ id: "1", issueDate: "2026-09-22" })], "2026-09", now);
		expect(groups).toHaveLength(1);
		expect(groups[0]!.title).toBe("Hoy");
	});

	it("groups issueDate in current week as Esta semana", () => {
		const groups = groupDocuments([doc({ id: "1", issueDate: "2026-09-21" })], "2026-09", now);
		expect(groups).toHaveLength(1);
		expect(groups[0]!.title).toBe("Esta semana");
	});

	it("groups issueDate in previous week as Semana pasada", () => {
		const groups = groupDocuments([doc({ id: "1", issueDate: "2026-09-15" })], "2026-09", now);
		expect(groups).toHaveLength(1);
		expect(groups[0]!.title).toBe("Semana pasada");
	});

	it("groups older week with clipped range title and dayLabel", () => {
		const groups = groupDocuments([doc({ id: "1", issueDate: "2026-09-11" })], "2026-09", now);
		expect(groups).toHaveLength(1);
		expect(groups[0]!.title).toBe("7–13 sep");
		expect(dayLabel("2026-09-11", "2026-09-22")).toBe("Vie 11");
	});

	it("uses range title for past month without relative labels", () => {
		const groups = groupDocuments([doc({ id: "1", issueDate: "2026-08-10" })], "2026-08", now);
		expect(groups).toHaveLength(1);
		expect(groups[0]!.title).toContain("ago");
		expect(groups.some((g) => g.title === "Hoy")).toBe(false);
		expect(groups.some((g) => g.title === "Esta semana")).toBe(false);
		expect(groups.some((g) => g.title === "Semana pasada")).toBe(false);
	});

	it("falls back to createdAt Lima day when issueDate is null", () => {
		const createdAt = "2026-09-23T00:22:00.000Z";
		const groups = groupDocuments([doc({ id: "1", issueDate: null, createdAt })], "2026-09", now);
		expect(groups).toHaveLength(1);
		expect(groups[0]!.title).toBe("Hoy");
		expect(formatClock(createdAt)).toBe("7:22 p.m.");
	});

	it("orders sections newest-first", () => {
		const groups = groupDocuments(
			[
				doc({ id: "1", issueDate: "2026-09-11" }),
				doc({ id: "2", issueDate: "2026-09-15" }),
				doc({ id: "3", issueDate: "2026-09-21" }),
				doc({ id: "4", issueDate: "2026-09-22" }),
			],
			"2026-09",
			now,
		);
		expect(groups.map((g) => g.title)).toEqual(["Hoy", "Esta semana", "Semana pasada", "7–13 sep"]);
	});
});

describe("toListView", () => {
	it("builds ready view with totals and plural count", () => {
		const view = toListView({
			status: "success",
			month: "2026-09",
			now,
			documents: [
				doc({ id: "1", status: "ready", totalAmount: "10.00" }),
				doc({ id: "2", status: "ready", totalAmount: "5.50" }),
				doc({ id: "3", status: "pending" }),
				doc({ id: "4", status: "failed" }),
			],
		});

		expect(view.kind).toBe("ready");
		if (view.kind !== "ready") return;
		expect(view.totalLabel).toBe("S/ 15.50");
		expect(view.countLabel).toBe("4 comprobantes");
	});

	it("uses singular count label", () => {
		const view = toListView({
			status: "success",
			month: "2026-09",
			now,
			documents: [doc({ id: "1", status: "ready", totalAmount: "10.00" })],
		});

		expect(view.kind).toBe("ready");
		if (view.kind !== "ready") return;
		expect(view.countLabel).toBe("1 comprobante");
	});

	it("returns empty view for no documents", () => {
		const view = toListView({
			status: "success",
			month: "2026-09",
			now,
			documents: [],
		});

		expect(view).toEqual({
			kind: "empty",
			monthLabel: "Septiembre 2026",
			totalLabel: "S/ 0.00",
			countLabel: "0 comprobantes",
			canGoNext: false,
		});
	});

	it("maps ready row fields", () => {
		const view = toListView({
			status: "success",
			month: "2026-09",
			now,
			documents: [
				doc({
					id: "1",
					status: "ready",
					issuerName: "Plaza Vea Salaverry",
					category: "supermercado",
					issueDate: "2026-09-22",
					totalAmount: "87.40",
				}),
			],
		});

		expect(view.kind).toBe("ready");
		if (view.kind !== "ready") return;
		const row = view.sections[0]?.rows[0];
		expect(row).toEqual({
			kind: "ready",
			id: "1",
			title: "Plaza Vea Salaverry",
			subtitle: "Supermercado · Hoy",
			amountLabel: "87.40",
		});
	});

	it("maps pending row fields", () => {
		const view = toListView({
			status: "success",
			month: "2026-09",
			now,
			documents: [
				doc({
					id: "1",
					status: "pending",
					createdAt: "2026-09-23T00:22:00.000Z",
				}),
			],
		});

		expect(view.kind).toBe("ready");
		if (view.kind !== "ready") return;
		const row = view.sections[0]?.rows[0];
		expect(row).toEqual({
			kind: "pending",
			id: "1",
			title: "Procesando...",
			subtitle: "Leyendo la foto · Hoy, 7:22 p.m.",
		});
	});

	it("maps failed row fields", () => {
		const view = toListView({
			status: "success",
			month: "2026-09",
			now,
			documents: [doc({ id: "1", status: "failed" })],
		});

		expect(view.kind).toBe("ready");
		if (view.kind !== "ready") return;
		const row = view.sections[0]?.rows[0];
		expect(row?.kind).toBe("failed");
		if (row?.kind !== "failed") return;
		expect(row.title).toBe("No pudimos leerlo");
		expect(row.subtitle.startsWith("Sin categoría ·")).toBe(true);
	});

	it("returns error message for error status", () => {
		const view = toListView({
			status: "error",
			month: "2026-09",
			now,
		});

		expect(view).toMatchObject({
			kind: "error",
			message: "No pudimos cargar tus comprobantes.",
		});
	});

	it("sets canGoNext based on month", () => {
		const current = toListView({ status: "success", month: "2026-09", now, documents: [] });
		const past = toListView({ status: "success", month: "2026-08", now, documents: [] });

		expect(current.kind === "empty" && current.canGoNext).toBe(false);
		expect(past.kind === "empty" && past.canGoNext).toBe(true);
	});
});
