export type DocumentType = 'boleta' | 'factura';

export interface AiExtractedData {
  es_contable: boolean;
  fecha: string;
  justificacion_contable: string;
  monto_total: string;
  numero_comprobante: string;
  razon_social: string;
  ruc: string;
  tipo_comprobante: DocumentType;
}

export interface AiExtractionResponse {
  data: AiExtractedData;
  success: boolean;
}
