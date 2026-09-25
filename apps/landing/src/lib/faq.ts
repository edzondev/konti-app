export type FaqItem = {
	q: string;
	a: string;
};

export const FAQ_ITEMS: FaqItem[] = [
	{
		q: "¿Konti calcula mis impuestos?",
		a: "No. Konti ordena tus boletas y te muestra qué gastos suelen aplicar a deducciones. El cálculo depende de tu situación, y eso lo confirma tu contador o SUNAT.",
	},
	{
		q: "¿Reemplaza a un contador?",
		a: "No. Te ayuda a llegar mejor preparado. Y para lo básico, saber cuánto gastaste y en qué, probablemente no necesites uno.",
	},
	{
		q: "¿Qué pasa si no tengo boletas con QR?",
		a: "Igual funciona. Konti lee el texto de la foto. Si algo no queda claro, te pide que lo revises antes de guardarlo.",
	},
	{
		q: "¿Funciona sin internet?",
		a: "Puedes ver tus comprobantes y el resumen del mes sin conexión si ya los cargaste antes. Capturar boletas nuevas requiere internet.",
	},
	{
		q: "¿Cuánto cuesta?",
		a: "La versión base es gratis, para siempre. Sin publicidad y sin planes ocultos.",
	},
	{
		q: "¿Cómo elimino mi cuenta?",
		a: "Desde Perfil, en “Eliminar cuenta”. Se borran tu cuenta y todos tus datos. No tienes que escribirnos ni dar explicaciones.",
	},
];
