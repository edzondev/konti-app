import { supabase } from '@/utils/supabase/supabase';
import type {
  ClassifyReceiptResponse,
  AskKontiResponse,
  AnnualReportResponse,
  ChatMessage,
  DeductionLimitStatus,
  SuspectReceipt,
  DeductionByCategory,
} from '@/types/ai-extraction.types';

export async function classifyReceipt(
  receiptId: string,
  forceAi = false,
): Promise<ClassifyReceiptResponse> {
  try {
    const { data, error } = await supabase.functions.invoke('classify-receipt', {
      body: {
        receipt_id: receiptId,
        force_ai: forceAi,
      },
    });

    if (error) {
      throw new Error(error.message);
    }

    return data as ClassifyReceiptResponse;
  } catch (error) {
    console.error('Error classifying receipt:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error al clasificar',
    };
  }
}

export async function classifyReceiptPreview(receiptData: {
  business_name?: string;
  ruc?: string;
  total_amount?: number;
  receipt_type?: string;
  raw_text?: string;
}): Promise<ClassifyReceiptResponse> {
  try {
    const { data, error } = await supabase.functions.invoke('classify-receipt', {
      body: {
        receipt_data: receiptData,
      },
    });

    if (error) {
      throw new Error(error.message);
    }

    return data as ClassifyReceiptResponse;
  } catch (error) {
    console.error('Error in classification preview:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error al clasificar',
    };
  }
}

export async function askKonti(
  userId: string,
  question: string,
  conversationHistory: ChatMessage[] = [],
): Promise<AskKontiResponse> {
  try {
    const { data, error } = await supabase.functions.invoke('ask-konti', {
      body: {
        user_id: userId,
        question,
        conversation_history: conversationHistory,
      },
    });

    if (error) {
      throw new Error(error.message);
    }

    return data as AskKontiResponse;
  } catch (error) {
    console.error('Error in Ask Konti:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error al procesar pregunta',
    };
  }
}

export async function askKontiQuickPrompt(
  userId: string,
  promptId: string,
): Promise<AskKontiResponse> {
  return askKonti(userId, `__quick_prompt:${promptId}`);
}

export async function generateAnnualReport(
  userId: string,
  year?: number,
): Promise<AnnualReportResponse> {
  try {
    const { data, error } = await supabase.functions.invoke(
      'generate-annual-report',
      {
        body: {
          user_id: userId,
          year: year || new Date().getFullYear(),
        },
      },
    );

    if (error) {
      throw new Error(error.message);
    }

    return data as AnnualReportResponse;
  } catch (error) {
    console.error('Error generating report:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error al generar reporte',
    };
  }
}

export async function getDeductionLimitStatus(
  userId: string,
  year?: number,
): Promise<DeductionLimitStatus | null> {
  try {
    const { data, error } = await supabase.rpc('get_user_deduction_limit_status', {
      p_user_id: userId,
      p_year: year || new Date().getFullYear(),
    });

    if (error) {
      throw error;
    }

    if (data && data.length > 0) {
      return {
        total_deductible: data[0].total_deductible || 0,
        annual_limit: data[0].annual_limit || 15450,
        percentage_used: data[0].percentage_used || 0,
        remaining: data[0].remaining || 15450,
      };
    }

    return {
      total_deductible: 0,
      annual_limit: 15450,
      percentage_used: 0,
      remaining: 15450,
    };
  } catch (error) {
    console.error('Error getting deduction limit:', error);
    return null;
  }
}

export async function getSuspectReceipts(userId: string): Promise<SuspectReceipt[]> {
  try {
    const { data, error } = await supabase
      .from('user_suspect_receipts')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) {
      throw error;
    }

    return (data || []).map((r) => ({
      id: r.id,
      business_name: r.business_name,
      total_amount: r.total_amount,
      receipt_type: r.receipt_type,
      category: r.category,
      confidence: r.confidence,
      suspect_reason: r.suspect_reason,
      image_url: r.image_url,
    }));
  } catch (error) {
    console.error('Error getting suspect receipts:', error);
    return [];
  }
}

export async function getDeductionsByCategory(
  userId: string,
  year?: number,
): Promise<DeductionByCategory[]> {
  try {
    const { data, error } = await supabase
      .from('user_deductions_by_category')
      .select('*')
      .eq('user_id', userId)
      .eq('year', year || new Date().getFullYear());

    if (error) {
      throw error;
    }

    return (data || []).map((c) => ({
      category: c.category || 'otros',
      year: c.year,
      receipt_count: c.receipt_count || 0,
      total_amount: c.total_amount || 0,
      total_igv: c.total_igv || 0,
    }));
  } catch (error) {
    console.error('Error getting deductions by category:', error);
    return [];
  }
}

export async function getAnnualSummary(userId: string, year?: number) {
  try {
    const { data, error } = await supabase
      .from('user_annual_summary')
      .select('*')
      .eq('user_id', userId)
      .eq('year', year || new Date().getFullYear())
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    return data || null;
  } catch (error) {
    console.error('Error getting annual summary:', error);
    return null;
  }
}



