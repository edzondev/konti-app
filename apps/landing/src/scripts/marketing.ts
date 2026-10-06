function initMenu() {
	const header = document.querySelector<HTMLElement>(".site-header");
	if (!header || header.dataset.bound === "true") return;
	header.dataset.bound = "true";

	const toggle = header.querySelector<HTMLButtonElement>(".menu-toggle");
	const nav = header.querySelector("nav");
	if (!toggle || !nav) return;

	const setOpen = (open: boolean) => {
		nav.classList.toggle("open", open);
		toggle.setAttribute("aria-expanded", String(open));
		toggle.setAttribute("aria-label", open ? "Cerrar menú" : "Abrir menú");
	};

	toggle.addEventListener("click", () => {
		setOpen(toggle.getAttribute("aria-expanded") !== "true");
	});

	for (const link of nav.querySelectorAll("a")) {
		link.addEventListener("click", () => setOpen(false));
	}
}

function initFaq() {
	const list = document.querySelector<HTMLElement>(".faq-list");
	if (!list || list.dataset.bound === "true") return;
	list.dataset.bound = "true";

	const items = [...list.querySelectorAll<HTMLElement>(".faq-item")];
	for (const [index, item] of items.entries()) {
		const button = item.querySelector("button");
		if (!button) continue;
		button.addEventListener("click", () => {
			const willOpen = button.getAttribute("aria-expanded") !== "true";
			for (const [otherIndex, other] of items.entries()) {
				const otherButton = other.querySelector("button");
				const otherPanel = other.querySelector("section");
				const otherIcon = otherButton?.querySelector("svg");
				if (!otherButton || !otherPanel || !otherIcon) continue;
				const open = willOpen && otherIndex === index;
				otherButton.setAttribute("aria-expanded", String(open));
				otherPanel.toggleAttribute("hidden", !open);
				otherIcon.classList.toggle("rotated", open);
			}
		});
	}
}

function initReveal() {
	const targets = document.querySelectorAll(".personal-note, .final-inner");
	if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

	const pending = [...targets].filter((target) => !target.classList.contains("subtle-reveal"));
	if (pending.length === 0) return;

	const observer = new IntersectionObserver(
		(entries) => {
			for (const entry of entries) {
				if (!entry.isIntersecting) continue;
				entry.target.classList.add("is-visible");
				observer.unobserve(entry.target);
			}
		},
		{ threshold: 0.12 },
	);

	for (const target of pending) {
		target.classList.add("subtle-reveal");
		observer.observe(target);
	}
}

function initMarketing() {
	initMenu();
	initFaq();
	initReveal();
}

initMarketing();
document.addEventListener("astro:page-load", initMarketing);
