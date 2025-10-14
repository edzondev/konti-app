import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export const registerSchema = z.object({
  email: z.string().email({
    message: 'El email no es válido',
  }),
  password: z.string().min(8, {
    message: 'La contraseña debe tener al menos 8 caracteres',
  }),
  name: z.string().min(1, {
    message: 'El nombre es requerido',
  }),
});

export type LoginSchema = z.infer<typeof loginSchema>;
export type RegisterSchema = z.infer<typeof registerSchema>;
