export type HomeSummaryStatus = "loading" | "ready";

export type HomeCategory = {
	name: string;
	amount: number;
};

export type HomeDeductibleDocument = {
	id: string;
	issuerName: string | null;
	totalAmount: string | null;
};

export type HomeDeductibleItem = {
	categoryName: string;
	documents: HomeDeductibleDocument[];
};

export type HomeDeductibles = {
	count: number;
	totalAmount: number;
	categoryNames: string[];
	items: HomeDeductibleItem[];
};

export type HomeSummary = {
	month: string;
	totalAmount: number;
	documentCount: number;
	insight: string;
	categories: HomeCategory[];
	deductibles: HomeDeductibles;
	status: HomeSummaryStatus;
};

const SEPTEMBER_2026_CATEGORIES: HomeCategory[] = [
	{ name: "Supermercado", amount: 162.8 },
	{ name: "Restaurantes", amount: 124 },
	{ name: "Transporte", amount: 86.3 },
	{ name: "Servicios médicos", amount: 64 },
	{ name: "Otros", amount: 43.4 },
];

const filledBase: Omit<HomeSummary, "deductibles"> = {
	month: "2026-09",
	totalAmount: 480.5,
	documentCount: 12,
	insight: "Vas parecido a agosto. Nada fuera de lo normal.",
	categories: SEPTEMBER_2026_CATEGORIES,
	status: "ready",
};

export const homeMockFilled: HomeSummary = {
	...filledBase,
	deductibles: {
		count: 3,
		totalAmount: 188,
		categoryNames: ["Restaurantes", "Servicios médicos"],
		items: [],
	},
};

export const homeMockNoDeductibles: HomeSummary = {
	...filledBase,
	deductibles: {
		count: 0,
		totalAmount: 0,
		categoryNames: [],
		items: [],
	},
};

export const homeMockEmpty: HomeSummary = {
	month: "2026-09",
	totalAmount: 0,
	documentCount: 0,
	insight: "Tu primer mes con Konti. Estamos organizando todo.",
	categories: [],
	deductibles: {
		count: 0,
		totalAmount: 0,
		categoryNames: [],
		items: [],
	},
	status: "ready",
};

export const homeMockLoading: HomeSummary = {
	month: "2026-09",
	totalAmount: 0,
	documentCount: 0,
	insight: "",
	categories: [],
	deductibles: {
		count: 0,
		totalAmount: 0,
		categoryNames: [],
		items: [],
	},
	status: "loading",
};

// Change this import target for QA of other states.
export const activeHomeMock = homeMockFilled;
