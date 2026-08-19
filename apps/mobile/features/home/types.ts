export type HomeStatus = "up_to_date";

export interface HomePrimary {
	code: "NOTHING_TO_REVIEW";
	title: string;
	description: string;
	action: null;
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
