import { loginSchema, registerSchema } from '@/utils/schemas/auth.schema';

describe('loginSchema', () => {
  describe('email validation', () => {
    it('should accept valid email', () => {
      const result = loginSchema.safeParse({
        email: 'test@example.com',
        password: '12345678',
      });
      expect(result.success).toBe(true);
    });

    it('should reject invalid email format', () => {
      const result = loginSchema.safeParse({
        email: 'invalid-email',
        password: '12345678',
      });
      expect(result.success).toBe(false);
    });

    it('should reject empty email', () => {
      const result = loginSchema.safeParse({
        email: '',
        password: '12345678',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('password validation', () => {
    it('should accept password with 8 or more characters', () => {
      const result = loginSchema.safeParse({
        email: 'test@example.com',
        password: '12345678',
      });
      expect(result.success).toBe(true);
    });

    it('should reject password with less than 8 characters', () => {
      const result = loginSchema.safeParse({
        email: 'test@example.com',
        password: '1234567',
      });
      expect(result.success).toBe(false);
    });
  });
});

describe('registerSchema', () => {
  const validRegister = {
    email: 'test@example.com',
    password: 'Password1!',
    name: 'Juan Pérez',
  };

  describe('email validation', () => {
    it('should accept valid email', () => {
      const result = registerSchema.safeParse(validRegister);
      expect(result.success).toBe(true);
    });

    it('should reject invalid email with custom message', () => {
      const result = registerSchema.safeParse({
        ...validRegister,
        email: 'invalid-email',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('El email no es válido');
      }
    });
  });

  describe('password validation', () => {
    it('should accept password meeting all requirements', () => {
      const result = registerSchema.safeParse({
        ...validRegister,
        password: 'Password1!',
      });
      expect(result.success).toBe(true);
    });

    it('should reject password with less than 8 characters', () => {
      const result = registerSchema.safeParse({
        ...validRegister,
        password: 'Pass1!',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('La contraseña debe tener al menos 8 caracteres');
      }
    });

    it('should reject password without uppercase letter', () => {
      const result = registerSchema.safeParse({
        ...validRegister,
        password: 'password1!',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('La contraseña debe contener al menos una mayúscula');
      }
    });

    it('should reject password without lowercase letter', () => {
      const result = registerSchema.safeParse({
        ...validRegister,
        password: 'PASSWORD1!',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('La contraseña debe contener al menos una minúscula');
      }
    });

    it('should reject password without number', () => {
      const result = registerSchema.safeParse({
        ...validRegister,
        password: 'Password!',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('La contraseña debe contener al menos un número');
      }
    });

    it('should reject password without special character', () => {
      const result = registerSchema.safeParse({
        ...validRegister,
        password: 'Password1',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('La contraseña debe contener al menos un carácter especial');
      }
    });

    it('should accept password with various special characters', () => {
      const specialChars = ['!', '@', '#', '$', '%', '^', '&', '*'];
      specialChars.forEach((char) => {
        const result = registerSchema.safeParse({
          ...validRegister,
          password: `Password1${char}`,
        });
        expect(result.success).toBe(true);
      });
    });
  });

  describe('name validation', () => {
    it('should accept valid name with letters only', () => {
      const result = registerSchema.safeParse({
        ...validRegister,
        name: 'Juan',
      });
      expect(result.success).toBe(true);
    });

    it('should accept name with spaces', () => {
      const result = registerSchema.safeParse({
        ...validRegister,
        name: 'Juan Carlos Pérez',
      });
      expect(result.success).toBe(true);
    });

    it('should accept name with accented characters', () => {
      const result = registerSchema.safeParse({
        ...validRegister,
        name: 'José María Ñoño',
      });
      expect(result.success).toBe(true);
    });

    it('should reject empty name', () => {
      const result = registerSchema.safeParse({
        ...validRegister,
        name: '',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('El nombre es requerido');
      }
    });

    it('should reject name with numbers', () => {
      const result = registerSchema.safeParse({
        ...validRegister,
        name: 'Juan123',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('El nombre solo puede contener letras y espacios');
      }
    });

    it('should reject name with special characters', () => {
      const result = registerSchema.safeParse({
        ...validRegister,
        name: 'Juan@Pérez',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('El nombre solo puede contener letras y espacios');
      }
    });
  });

  describe('complete form validation', () => {
    it('should validate a complete valid registration', () => {
      const result = registerSchema.safeParse(validRegister);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(validRegister);
      }
    });

    it('should reject when required fields are missing', () => {
      const result = registerSchema.safeParse({
        email: 'test@example.com',
      });
      expect(result.success).toBe(false);
    });
  });
});
