export type DeductionDocument = {
	id: string;
	issuerName: string | null;
	totalAmount: string | null;
};

export type DeductiblesInput = {
	count: number;
	totalAmount: number;
	categoryNames: string[];
	items: {
		categoryName: string;
		documents: DeductionDocument[];
	}[];
};

export type DeductionSheetList = {
	variant: "empty" | "full" | "many";
	groups: { categoryName: string; documents: DeductionDocument[] }[];
	moreCount: number;
	totalAmount: number;
	count: number;
};

function amount(doc: DeductionDocument): number {
	return Number(doc.totalAmount);
}

export function toDeductionSheetList(deductibles: DeductiblesInput): DeductionSheetList {
	const { count, totalAmount, items } = deductibles;

	if (count === 0) {
		return { variant: "empty", groups: [], moreCount: 0, totalAmount, count };
	}

	const flat = items.flatMap((item) =>
		item.documents.map((document) => ({
			categoryName: item.categoryName,
			document,
		})),
	);

	const categoryTotals = new Map<string, number>();
	for (const { categoryName, document } of flat) {
		categoryTotals.set(categoryName, (categoryTotals.get(categoryName) ?? 0) + amount(document));
	}

	const variant = count <= 5 ? "full" : "many";
	const moreCount = count <= 5 ? 0 : count - 5;
	const visible =
		count <= 5
			? flat
			: [...flat].sort((a, b) => amount(b.document) - amount(a.document)).slice(0, 5);

	const byCategory = new Map<string, DeductionDocument[]>();
	for (const { categoryName, document } of visible) {
		const list = byCategory.get(categoryName);
		if (list) list.push(document);
		else byCategory.set(categoryName, [document]);
	}

	const groups = [...byCategory.entries()]
		.sort((a, b) => (categoryTotals.get(b[0]) ?? 0) - (categoryTotals.get(a[0]) ?? 0))
		.map(([categoryName, documents]) => ({
			categoryName,
			documents: [...documents].sort((a, b) => amount(b) - amount(a)),
		}));

	return { variant, groups, moreCount, totalAmount, count };
}
