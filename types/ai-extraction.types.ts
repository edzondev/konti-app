export type DocumentType = 'boleta' | 'factura';

export type ClassificationSource = 'ai' | 'rules' | 'manual';

export type ReceiptCategory =
  | 'alimentacion'
  | 'salud'
  | 'tecnologia'
  | 'transporte'
  | 'educacion'
  | 'servicios'
  | 'compras_generales'
  | 'alojamiento'
  | 'servicios_profesionales'
  | 'seguros'
  | 'otros';

export interface AiExtractedData {
  es_contable: boolean;
  fecha: string | null;
  justificacion_contable: string | null;
  monto_total: string | number | null;
  numero_comprobante: string | null;
  razon_social: string | null;
  ruc: string | null;
  tipo_comprobante: DocumentType;
  igv?: string | number | null;
  category?: ReceiptCategory;
  confidence?: number;
  classification_source?: ClassificationSource;
  raw_text?: string;
}

export interface AiExtractionResponse {
  data: AiExtractedData;
  success: boolean;
}

export interface ClassificationResult {
  category: ReceiptCategory;
  es_contable: boolean;
  confidence: number;
  justificacion_contable: string;
  classification_source: ClassificationSource;
}

export interface ClassifyReceiptResponse {
  success: boolean;
  data?: {
    receipt_id: string | null;
    classification: ClassificationResult;
  };
  error?: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: string;
}

export interface AskKontiResponse {
  success: boolean;
  data?: {
    response: string;
    context_summary: {
      total_receipts: number;
      deductible_amount: number;
      percentage_used: number;
    };
  };
  error?: string;
}

export interface QuickPrompt {
  id: string;
  text: string;
  icon: string;
}

export interface AnnualReportSummary {
  total_receipts: number;
  deductible_receipts: number;
  total_amount: number;
  deductible_amount: number;
  percentage_of_limit: string;
}

export interface CategoryReportItem {
  category: string;
  amount: number;
  count: number;
}

export interface AnnualReportResponse {
  success: boolean;
  data?: {
    year: number;
    summary: AnnualReportSummary;
    categories: CategoryReportItem[];
    downloads: {
      text_report: string | null;
      csv_detail: string | null;
    };
    generated_at: string;
  };
  error?: string;
}

export interface DeductionLimitStatus {
  total_deductible: number;
  annual_limit: number;
  percentage_used: number;
  remaining: number;
}

export interface SuspectReceipt {
  id: string;
  business_name: string | null;
  total_amount: number | null;
  receipt_type: string | null;
  category: string | null;
  confidence: number | null;
  suspect_reason: 'low_confidence' | 'potential_duplicate' | 'unknown';
  image_url: string | null;
}

export interface DeductionByCategory {
  category: ReceiptCategory;
  year: number;
  receipt_count: number;
  total_amount: number;
  total_igv: number;
}
