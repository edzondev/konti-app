import {
  registerSchema,
  type RegisterSchema,
} from '@/utils/schemas/auth.schema';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '@/components/providers/auth-provider';
import { useRouter } from 'expo-router';

export const useRegister = () => {
  const { signUp } = useAuth();
  const router = useRouter();
  const form = useForm<RegisterSchema>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: '',
      password: '',
      name: '',
    },
  });

  const onSubmit = async (data: RegisterSchema) => {
    try {
      await signUp(data);
      form.reset();
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
