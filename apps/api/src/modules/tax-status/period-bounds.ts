export function lastDayOfPeriod(period: string): string {
	const year = Number(period.slice(0, 4));
	const month = Number(period.slice(5, 7));
	const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
	return `${period}-${String(lastDay).padStart(2, "0")}`;
}
