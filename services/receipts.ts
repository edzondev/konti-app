import { ReceiptSchema } from '@/utils/schemas/receipt.schema';
import { supabase } from '@/utils/supabase/supabase';
import { AiExtractionResponse } from '@/types/ai-extraction.types';
import { FiltersType, ReceiptKpis } from '@/types/receipt.type';

export async function getReceipts(
  userId: string,
  filters: Partial<FiltersType>,
) {
  let query = supabase.from('receipts').select('*').eq('user_id', userId);

  if (filters.isExpense !== undefined) {
    query = query.eq('is_expense', filters.isExpense);
  }

  if (filters.receiptType) {
    query = query.eq('receipt_type', filters.receiptType);
  }

  if (filters.search) {
    query = query.or(
      `business_name.ilike.%${filters.search}%,ruc.ilike.%${filters.search}%,receipt_number.ilike.%${filters.search}%`,
    );
  }

  if (filters.sortBy) {
    const ascending = filters.sortBy === 'date_asc';
    query = query.order('created_at', { ascending });
  } else {
    query = query.order('created_at', { ascending: false });
  }

  const { data, error } = await query;
  if (error) {
    throw error;
  }
  return data;
}

export async function getReceiptDetails(receiptId: string) {
  const { data, error } = await supabase
    .from('receipts')
    .select('*')
    .eq('id', receiptId)
    .single();
  if (error) {
    throw error;
  }
  return data;
}

export async function uploadImageToStorage(
  imageUri: string,
  userId: string,
): Promise<string> {
  try {
    const fileName = imageUri.split('/').pop();
    const filePath = `${userId}/${Date.now()}-${fileName}`;

    const formData = new FormData();
    formData.append('file', {
      uri: imageUri,
      type: 'image/jpeg',
      name: fileName || 'image.jpg',
    } as any);

    const { data, error } = await supabase.storage
      .from('receipts')
      .upload(filePath, formData, {
        contentType: 'image/jpeg',
      });

    if (error) {
      throw new Error('Error al subir la imagen');
    }

    const { data: publicUrlData } = supabase.storage
      .from('receipts')
      .getPublicUrl(filePath);

    return publicUrlData.publicUrl;
  } catch (error) {
    throw error;
  }
}

export async function createReceipt(
  data: ReceiptSchema,
  imageUrl: string,
  userId: string,
) {
  try {
    const body = {
      total_amount:
        typeof data.amount === 'string' ? parseFloat(data.amount) : data.amount,
      receipt_type: data.receiptType,
      is_expense: data.isExpense,
      ruc: data.ruc,
      business_name: data.businessName,
      receipt_number: data.receiptNumber,
      description: data.description,
      image_url: imageUrl,
      user_id: userId,
    };

    const { data: response, error: invokeError } =
      await supabase.functions.invoke('validate-and-upload', {
        body,
      });

    if (invokeError) {
      throw new Error('Error de conexión con el servidor');
    }

    if (!response.success) {
      switch (response.code) {
        case 'UPLOAD_LIMIT_REACHED':
          throw new Error(
            `${response.error}. Has usado ${response.details?.current} de ${response.details?.limit} subidas en tu plan ${response.details?.plan}.`,
          );
        case 'MISSING_FIELDS':
          throw new Error('Faltan campos obligatorios');
        case 'USER_NOT_FOUND':
          throw new Error('Usuario no encontrado');
        default:
          throw new Error(response.error || 'Error al procesar la boleta');
      }
    }

    return response.data;
  } catch (error) {
    throw error;
  }
}

export async function getReceiptDataByAi(
  imageUrl: string,
): Promise<AiExtractionResponse> {
  try {
    const { data, error } = await supabase.functions.invoke('ai-extract-info', {
      body: { imageUrl: imageUrl },
    });

    if (error) {
      throw error;
    }

    return data as AiExtractionResponse;
  } catch (error) {
    throw error;
  }
}

export async function getReceiptKpis(userId: string): Promise<ReceiptKpis> {
  const { data, error } = await supabase
    .from('receipt_kpis')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error) {
    throw error;
  }

  return {
    total_receipts: data.total_receipts ?? 0,
    expense_receipts: data.expense_receipts ?? 0,
    total_amount_sum: data.total_amount_sum ?? 0,
  };
}

export async function deleteReceipt(id: string) {
  const { data, error } = await supabase.from('receipts').delete().eq('id', id);

  if (error) {
    throw error;
  }

  return data;
}
