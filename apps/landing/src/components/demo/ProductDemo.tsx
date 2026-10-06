import {
	ArrowDownLeft,
	ArrowLeft,
	ArrowRight,
	BatteryFull,
	Camera,
	Check,
	ChevronDown,
	FileText,
	Home,
	Signal,
	Sparkles,
	Wifi,
} from "lucide-react";
import { useState } from "react";

export function Wordmark({ className = "" }: { className?: string }) {
	return (
		<span className={`wordmark ${className}`}>
			kont<span>i</span>
		</span>
	);
}

export function PaperReceipt({ compact = false }: { compact?: boolean }) {
	return (
		<div
			className={`paper-receipt ${compact ? "compact" : ""}`}
			role="img"
			aria-label="Boleta de ejemplo de Plaza Vea por 87 soles con 40 céntimos"
		>
			<div className="receipt-store">plaza vea</div>
			<p>
				SUPERMERCADOS PERUANOS S.A.
				<br />
				RUC 20100070970
				<br />
				BOLETA DE VENTA ELECTRÓNICA
			</p>
			<div className="receipt-divider" />
			<div className="receipt-line">
				<span>LECHE GLORIA X6</span>
				<span>24.90</span>
			</div>
			<div className="receipt-line">
				<span>ARROZ COSTEÑO 5KG</span>
				<span>21.50</span>
			</div>
			<div className="receipt-line">
				<span>POLLO ENTERO KG</span>
				<span>28.60</span>
			</div>
			<div className="receipt-line">
				<span>PALTA FUERTE KG</span>
				<span>12.40</span>
			</div>
			<div className="receipt-divider" />
			<div className="receipt-line receipt-total">
				<span>TOTAL S/</span>
				<span>87.40</span>
			</div>
			<div className="barcode" />
			<p className="receipt-thanks">GRACIAS POR TU COMPRA</p>
		</div>
	);
}

const categories = [
	["Supermercado", "162.80"],
	["Restaurantes", "124.00"],
	["Transporte", "86.30"],
	["Servicios médicos", "64.00"],
	["Otros", "43.40"],
];
const receipts = [
	["Plaza Vea Salaverry", "Supermercado", "87.40"],
	["Osaka Miraflores", "Restaurantes", "184.00"],
	["Inkafarma Larco", "Farmacia", "32.90"],
	["Grifo Primax", "Transporte", "60.00"],
];
const views = ["Inicio", "Comprobantes", "Deducciones"] as const;
type View = (typeof views)[number];

export default function ProductDemo() {
	const [view, setView] = useState<View>("Inicio");
	const [capture, setCapture] = useState(false);
	const [saved, setSaved] = useState(false);
	return (
		<div className="product-demo">
			<div className="phone">
				<div className="phone-status">
					<span>9:41</span>
					<span>
						<Signal size={12} />
						<Wifi size={13} />
						<BatteryFull size={17} />
					</span>
				</div>
				<div className="phone-top">
					<Wordmark />
					<span className="avatar">T</span>
				</div>
				<div className="phone-content" key={capture ? "capture" : view}>
					{capture ? (
						<div className="capture-screen">
							<button
								type="button"
								className="back-button"
								onClick={() => {
									setCapture(false);
									setSaved(false);
								}}
							>
								<ArrowLeft size={16} /> Volver
							</button>
							<h3>{saved ? "Ya quedó organizada." : "Una foto. Y listo."}</h3>
							<div className="capture-frame">
								<PaperReceipt compact />
							</div>
							{saved ? (
								<div className="saved-result">
									<Check size={20} />
									<div>
										<strong>Plaza Vea · S/ 87.40</strong>
										<small>Supermercado · Ejemplo de clasificación</small>
									</div>
								</div>
							) : (
								<button
									type="button"
									className="demo-capture-button"
									onClick={() => setSaved(true)}
								>
									<Camera size={17} /> Probar con esta boleta
								</button>
							)}
							<p className="demo-note">
								Simulación con una boleta de ejemplo.
								<br />
								No se procesa ni guarda información.
							</p>
						</div>
					) : (
						<>
							{view === "Inicio" && (
								<>
									<div className="month-label">
										<span className="small-dot" /> SEPTIEMBRE 2026 <ChevronDown size={12} />
									</div>
									<p className="spent-label">Este mes gastaste</p>
									<div className="phone-amount">
										<span>S/</span>480.50
									</div>
									<div className="accountant-phrase">
										<Sparkles size={15} />
										<p>
											Vas parecido a agosto.
											<br />
											<strong>Nada fuera de lo normal.</strong>
										</p>
									</div>
									<div className="phone-section-label">
										EN QUÉ SE FUE <span>12 comprobantes</span>
									</div>
									<div className="category-list">
										{categories.map(([name, value], i) => (
											<div key={name}>
												<span>
													<i className={`category-dot dot-${i}`} />
													{name}
												</span>
												<span>{value}</span>
											</div>
										))}
									</div>
									<button
										type="button"
										className="phone-deduction"
										onClick={() => setView("Deducciones")}
									>
										<span className="deduction-icon">
											<ArrowDownLeft size={17} />
										</span>
										<span>
											<strong>3 gastos podrían deducirse</strong>
											<small>Una cosa menos para marzo.</small>
										</span>
										<ArrowRight size={16} />
									</button>
								</>
							)}
							{view === "Comprobantes" && (
								<>
									<div className="month-label">TUS COMPROBANTES</div>
									<h3>Todo en su lugar.</h3>
									<p className="phone-subtitle">Septiembre · Ejemplos de clasificación</p>
									<div className="receipt-list">
										{receipts.map(([name, category, amount]) => (
											<div className="mini-receipt" key={name}>
												<span className="mini-receipt-icon">
													<FileText size={19} />
												</span>
												<div>
													<strong>{name}</strong>
													<small>{category}</small>
												</div>
												<b>{amount}</b>
											</div>
										))}
									</div>
									<div className="phone-info">
										<Check size={16} /> Sin etiquetas. Sin hacerlo a mano.
									</div>
								</>
							)}
							{view === "Deducciones" && (
								<>
									<div className="month-label">
										<span className="small-dot" /> DEDUCCIONES
									</div>
									<h3>
										Algo para tener
										<br />
										en cuenta.
									</h3>
									<p className="deductions-summary">3 gastos podrían reducir tu impuesto anual.</p>
									<div className="deductions-amount">
										<small>MONTO DE GASTOS IDENTIFICADOS</small>
										<strong>
											<span>S/</span> 308.00
										</strong>
									</div>
									<div className="deduction-group">
										<p>RESTAURANTES</p>
										<div>
											<span>Osaka Miraflores</span>
											<b>184.00</b>
										</div>
										<div>
											<span>Tanta San Isidro</span>
											<b>64.00</b>
										</div>
									</div>
									<div className="deduction-group">
										<p>SERVICIOS MÉDICOS</p>
										<div>
											<span>Clínica Internacional</span>
											<b>60.00</b>
										</div>
									</div>
									<p className="tax-note">
										Son gastos potencialmente deducibles, no un cálculo de impuestos. Confirma los
										requisitos con SUNAT o tu contador.
									</p>
								</>
							)}
						</>
					)}
				</div>
				{!capture && (
					<button
						type="button"
						className="phone-camera"
						onClick={() => setCapture(true)}
						aria-label="Probar demostración de captura"
					>
						<Camera size={20} />
					</button>
				)}
				<nav className="phone-bottom" aria-label="Navegación de la pantalla de ejemplo">
					<button
						type="button"
						onClick={() => {
							setView("Inicio");
							setCapture(false);
						}}
					>
						<Home size={16} /> Inicio
					</button>
					<button
						type="button"
						onClick={() => {
							setView("Comprobantes");
							setCapture(false);
						}}
					>
						<FileText size={16} /> Comprobantes
					</button>
					<button
						type="button"
						onClick={() => {
							setView("Deducciones");
							setCapture(false);
						}}
					>
						<ArrowDownLeft size={16} /> Deducciones
					</button>
				</nav>
				<div className="home-indicator" />
			</div>
			<div className="demo-tabs" role="tablist" aria-label="Vistas de la demo">
				{views.map((item) => (
					<button
						type="button"
						key={item}
						role="tab"
						aria-selected={view === item && !capture}
						onClick={() => {
							setView(item);
							setCapture(false);
							setSaved(false);
						}}
					>
						{item}
					</button>
				))}
			</div>
			<p className="demo-disclaimer">DEMO INTERACTIVA · DATOS DE EJEMPLO</p>
		</div>
	);
}
