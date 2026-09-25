import { useState } from "react";
import { FAQ_ITEMS } from "../lib/faq";

export default function FaqAccordion() {
	const [open, setOpen] = useState<number | null>(0);

	return (
		<div className="border-b border-[rgba(23,21,15,0.1)]">
			{FAQ_ITEMS.map((item, i) => {
				const isOpen = open === i;
				const panelId = `faq-panel-${i}`;
				const buttonId = `faq-button-${i}`;

				return (
					<div key={item.q} className="border-t border-[rgba(23,21,15,0.1)]">
						<button
							type="button"
							id={buttonId}
							aria-expanded={isOpen}
							aria-controls={panelId}
							onClick={() => setOpen(isOpen ? null : i)}
							className="flex w-full appearance-none cursor-pointer items-center justify-between gap-6 border-0 bg-transparent py-6.5 text-left font-sans text-[19px] font-normal tracking-[-0.02em] text-konti-ink"
						>
							<span>{item.q}</span>
							<svg
								width="20"
								height="20"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								strokeWidth="1.5"
								strokeLinecap="round"
								aria-hidden="true"
								className={`shrink-0 transition-transform duration-200 ease ${isOpen ? "rotate-45" : "rotate-0"}`}
							>
								<path d="M12 5v14M5 12h14" />
							</svg>
						</button>
						{isOpen ? (
							<p
								id={panelId}
								role="region"
								aria-labelledby={buttonId}
								className="-mt-1.5 mb-0 pr-12 pb-7 text-[16px] leading-[1.6] text-konti-muted text-pretty"
							>
								{item.a}
							</p>
						) : null}
					</div>
				);
			})}
		</div>
	);
}
