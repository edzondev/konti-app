import { useMutation } from "@tanstack/react-query";
import { uploadImageToStorage } from "@/services/receipts";
import { useAuth } from "@/components/providers/auth-provider";

export function useUploadImage() {
  const { session } = useAuth();

  return useMutation({
    mutationFn: (imageUri: string) => {
      if (!session?.user.id) {
        throw new Error("Usuario no autenticado");
      }
      return uploadImageToStorage(imageUri, session.user.id);
    },
  });
}
