export type HomeStatus = "up_to_date";

export type HomePrimaryAction = "open_capture" | null;

export interface HomePrimary {
	code: "ADD_FIRST_DOCUMENT" | "NOTHING_TO_REVIEW";
	title: string;
	description: string;
	action: HomePrimaryAction;
}

export interface HomeResponse {
	status: HomeStatus;
	taxYear: number;
	primary: HomePrimary;
	attention: { count: number; nextItem: null };
	summary: {
		processedDocuments: number;
		processingDocuments: number;
		potentiallyRelevantAmount: null;
	};
	nextRelevantEvent: null;
	updatedAt: string;
}
