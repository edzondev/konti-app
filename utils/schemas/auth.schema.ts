import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export const registerSchema = z.object({
  email: z.string().email({
    message: 'El email no es válido',
  }),
  password: z
    .string()
    .min(8, {
      message: 'La contraseña debe tener al menos 8 caracteres',
    })
    .regex(/[A-Z]/, {
      message: 'La contraseña debe contener al menos una mayúscula',
    })
    .regex(/[a-z]/, {
      message: 'La contraseña debe contener al menos una minúscula',
    })
    .regex(/[0-9]/, {
      message: 'La contraseña debe contener al menos un número',
    })
    .regex(/[^A-Za-z0-9]/, {
      message: 'La contraseña debe contener al menos un carácter especial',
    }),
  name: z
    .string()
    .min(1, {
      message: 'El nombre es requerido',
    })
    .regex(/^[\p{L}\p{M}\s]+$/u, {
      message: 'El nombre solo puede contener letras y espacios',
    }),
});

export type LoginSchema = z.infer<typeof loginSchema>;
export type RegisterSchema = z.infer<typeof registerSchema>;
