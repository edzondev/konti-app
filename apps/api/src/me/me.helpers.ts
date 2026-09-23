export function maskIp(ip: string | null | undefined): string {
	if (!ip) return "—";

	if (ip.includes(":")) {
		const first = ip.split(":")[0] || "—";
		return first === "—" ? "—" : `${first}:*`;
	}

	const parts = ip.split(".");
	if (parts.length !== 4 || parts.some((p) => p === "" || Number.isNaN(Number(p)))) {
		return "—";
	}

	return `${parts[0]}.${parts[1]}.xxx.xxx`;
}

export function parseUserAgent(ua: string | null | undefined): { label: string } {
	if (!ua?.trim()) {
		return { label: "Dispositivo desconocido" };
	}

	const browser = /Edg\//i.test(ua)
		? "Edge"
		: /Chrome\//i.test(ua)
			? "Chrome"
			: /Firefox\//i.test(ua)
				? "Firefox"
				: /Safari\//i.test(ua)
					? "Safari"
					: "Navegador";

	const os = /Android/i.test(ua)
		? "Android"
		: /iPhone|iPad|iOS/i.test(ua)
			? "iOS"
			: /Windows/i.test(ua)
				? "Windows"
				: /Mac OS|Macintosh/i.test(ua)
					? "macOS"
					: /Linux/i.test(ua)
						? "Linux"
						: "desconocido";

	return { label: `${browser} · ${os}` };
}
