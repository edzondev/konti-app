export type FaqItem = {
	q: string;
	a: string;
};

export const FAQ_ITEMS: FaqItem[] = [
	{
		q: "¿Para quién es Konti?",
		a: "Para personas naturales en Perú: si trabajas en planilla, por tu cuenta o haces ambas cosas, Konti te ayuda a entender tus gastos a partir de tus comprobantes. No es un sistema contable para empresas.",
	},
	{
		q: "¿Konti calcula mis impuestos?",
		a: "No. Organiza tus comprobantes e identifica gastos que podrían aplicar a deducciones. La deducción real depende de tu situación tributaria y de los requisitos vigentes. Confírmalo con SUNAT o tu contador.",
	},
	{
		q: "¿Tengo que clasificar cada boleta?",
		a: "No. Konti reconoce el comercio y asigna una categoría. Por ejemplo, Plaza Vea se clasifica como supermercado y Osaka como restaurante.",
	},
	{
		q: "¿Y si mi comprobante no tiene QR?",
		a: "Konti también puede leer el texto de la foto. Apunta la cámara a una boleta, factura o recibo legible: no necesitas que tenga un QR.",
	},
	{
		q: "¿Cuánto cuesta?",
		a: "La versión base será gratuita. Podrás empezar a organizar tus comprobantes sin pagar.",
	},
	{
		q: "¿Cuándo podré descargarla?",
		a: "Konti está en la fase final de publicación para Android. El lanzamiento está estimado para octubre de 2026, después de completar la prueba cerrada. Activaremos la descarga cuando esté disponible en Google Play.",
	},
];
