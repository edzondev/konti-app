const MONTH_NAMES = [
	"Enero",
	"Febrero",
	"Marzo",
	"Abril",
	"Mayo",
	"Junio",
	"Julio",
	"Agosto",
	"Septiembre",
	"Octubre",
	"Noviembre",
	"Diciembre",
] as const;

const moneyFmt = new Intl.NumberFormat("es-PE", {
	minimumFractionDigits: 2,
	maximumFractionDigits: 2,
});

export function monthLabel(month: string): string {
	const [y, m] = month.split("-");
	const idx = Number(m) - 1;
	return `${MONTH_NAMES[idx] ?? m} ${y}`;
}

export function formatMoney(amount: number): string {
	return moneyFmt.format(amount);
}
