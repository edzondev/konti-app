import { ReceiptSchema } from "@/utils/schemas/receipt.schema";
import { supabase } from "@/utils/supabase/supabase";

export async function getReceipts() {
  const { data, error } = await supabase.from("receipts").select("*");
  if (error) {
    throw error;
  }
  return data;
}

export async function getReceiptDetails(receiptId: string) {
  const { data, error } = await supabase
    .from("receipts")
    .select("*")
    .eq("id", receiptId)
    .single();
  if (error) {
    throw error;
  }
  return data;
}

export async function createByEdgeFunction(
  data: ReceiptSchema,
  imageUri: string,
) {
  try {
    const userId = "";
    const fileName = imageUri.split("/").pop();

    // Generamos la url
    const { data: urlData, error: urlError } = await supabase.functions.invoke(
      "generate-upload-url",
      {
        body: { file_name: fileName, user_id: userId },
      },
    );

    if (urlError) {
      throw new Error("Error al generar la url de subida");
    }

    // Subimos la imagen
    const { signedUrl, filePath } = urlData;
    const imageResponse = await fetch(imageUri);
    const blob = await imageResponse.blob();
    const uploadResponse = await fetch(signedUrl, {
      method: "PUT",
      body: blob,
    });

    if (uploadResponse.status !== 200) {
      throw new Error("Error al subir la imagen");
    }
    if (!uploadResponse.ok) throw new Error("Error subiendo imagen");

    // enerar URL pública
    const imageUrl = `${process.env.EXPO_PUBLIC_SUPABASE_URL}/storage/v1/object/public/receipts/${filePath}`;

    const body = {
      total_amount:
        typeof data.amount === "string" ? parseFloat(data.amount) : data.amount,
      is_expense: data.isExpense,
      ruc: data.ruc,
      business_name: data.businessName,
      receipt_number: data.receiptNumber,
      description: data.description,
      image_url: imageUrl,
      user_id: userId,
    };

    const { data: response, error: invokeError } =
      await supabase.functions.invoke("validate-and-upload", {
        body,
      });

    if (invokeError) {
      throw new Error("Error de conexión con el servidor");
    }

    if (!response.success) {
      switch (response.code) {
        case "UPLOAD_LIMIT_REACHED":
          throw new Error(
            `${response.error}. Has usado ${response.details?.current} de ${response.details?.limit} subidas en tu plan ${response.details?.plan}.`,
          );
        case "MISSING_FIELDS":
          throw new Error("Faltan campos obligatorios");
        case "USER_NOT_FOUND":
          throw new Error("Usuario no encontrado");
        default:
          throw new Error(response.error || "Error al procesar la boleta");
      }
    }

    return response.data;
  } catch (error) {
    throw error;
  }
}
