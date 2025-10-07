import { loginSchema, type LoginSchema } from "@/utils/schemas/auth.schema";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/components/providers/auth-provider";
import { useRouter } from "expo-router";

export const useLogin = () => {
  const { signIn } = useAuth();
  const router = useRouter();
  const form = useForm<LoginSchema>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginSchema) => {
    try {
      await signIn(data);
      form.reset();
      // User will be automatically redirected to tabs by the layout
    } catch (error) {
      console.error(error);
    }
  };

  const handleCancel = () => {
    form.reset();
    router.back();
  };

  return {
    form,
    onSubmit,
    handleCancel,
    isLoading: form.formState.isSubmitting,
  };
};
