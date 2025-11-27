import { receiptSchema } from '@/utils/schemas/receipt.schema';

describe('receiptSchema', () => {
  const validReceipt = {
    amount: '100.50',
    receiptType: 'boleta' as const,
    isExpense: true,
    ruc: '12345678901',
    businessName: 'Test Company',
    receiptNumber: 'F001-00001234',
    description: 'Test description',
  };

  describe('amount validation', () => {
    it('should accept valid positive amount', () => {
      const result = receiptSchema.safeParse(validReceipt);
      expect(result.success).toBe(true);
    });

    it('should accept zero amount', () => {
      const result = receiptSchema.safeParse({ ...validReceipt, amount: '0' });
      expect(result.success).toBe(true);
    });

    it('should accept amount with decimals', () => {
      const result = receiptSchema.safeParse({
        ...validReceipt,
        amount: '1234.56',
      });
      expect(result.success).toBe(true);
    });

    it('should reject negative amount', () => {
      const result = receiptSchema.safeParse({
        ...validReceipt,
        amount: '-10',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe(
          'El monto debe ser un número válido',
        );
      }
    });

    it('should reject non-numeric amount', () => {
      const result = receiptSchema.safeParse({
        ...validReceipt,
        amount: 'abc',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe(
          'El monto debe ser un número válido',
        );
      }
    });

    it('should reject empty amount', () => {
      const result = receiptSchema.safeParse({ ...validReceipt, amount: '' });
      expect(result.success).toBe(false);
    });
  });

  describe('receiptType validation', () => {
    it('should accept boleta type', () => {
      const result = receiptSchema.safeParse({
        ...validReceipt,
        receiptType: 'boleta',
      });
      expect(result.success).toBe(true);
    });

    it('should accept factura type', () => {
      const result = receiptSchema.safeParse({
        ...validReceipt,
        receiptType: 'factura',
      });
      expect(result.success).toBe(true);
    });

    it('should reject invalid receipt type', () => {
      const result = receiptSchema.safeParse({
        ...validReceipt,
        receiptType: 'invalid',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('isExpense validation', () => {
    it('should accept true value', () => {
      const result = receiptSchema.safeParse({
        ...validReceipt,
        isExpense: true,
      });
      expect(result.success).toBe(true);
    });

    it('should accept false value', () => {
      const result = receiptSchema.safeParse({
        ...validReceipt,
        isExpense: false,
      });
      expect(result.success).toBe(true);
    });

    it('should reject non-boolean value', () => {
      const result = receiptSchema.safeParse({
        ...validReceipt,
        isExpense: 'yes',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('RUC validation', () => {
    it('should accept valid 11-digit RUC', () => {
      const result = receiptSchema.safeParse({
        ...validReceipt,
        ruc: '12345678901',
      });
      expect(result.success).toBe(true);
    });

    it('should accept empty RUC (optional field)', () => {
      const result = receiptSchema.safeParse({ ...validReceipt, ruc: '' });
      expect(result.success).toBe(true);
    });

    it('should accept undefined RUC (optional field)', () => {
      const { ruc, ...receiptWithoutRuc } = validReceipt;
      const result = receiptSchema.safeParse(receiptWithoutRuc);
      expect(result.success).toBe(true);
    });

    it('should reject RUC with less than 11 digits', () => {
      const result = receiptSchema.safeParse({
        ...validReceipt,
        ruc: '1234567890',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe(
          'El RUC debe tener exactamente 11 dígitos',
        );
      }
    });

    it('should reject RUC with more than 11 digits', () => {
      const result = receiptSchema.safeParse({
        ...validReceipt,
        ruc: '123456789012',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe(
          'El RUC debe tener exactamente 11 dígitos',
        );
      }
    });
  });

  describe('businessName validation', () => {
    it('should accept valid business name', () => {
      const result = receiptSchema.safeParse({
        ...validReceipt,
        businessName: 'My Company SAC',
      });
      expect(result.success).toBe(true);
    });

    it('should accept empty business name', () => {
      const result = receiptSchema.safeParse({
        ...validReceipt,
        businessName: '',
      });
      expect(result.success).toBe(true);
    });
  });

  describe('receiptNumber validation', () => {
    it('should accept valid receipt number', () => {
      const result = receiptSchema.safeParse({
        ...validReceipt,
        receiptNumber: 'F001-00001234',
      });
      expect(result.success).toBe(true);
    });

    it('should accept empty receipt number', () => {
      const result = receiptSchema.safeParse({
        ...validReceipt,
        receiptNumber: '',
      });
      expect(result.success).toBe(true);
    });
  });

  describe('description validation', () => {
    it('should accept valid description', () => {
      const result = receiptSchema.safeParse({
        ...validReceipt,
        description: 'Purchase of office supplies',
      });
      expect(result.success).toBe(true);
    });

    it('should accept empty description', () => {
      const result = receiptSchema.safeParse({
        ...validReceipt,
        description: '',
      });
      expect(result.success).toBe(true);
    });
  });

  describe('complete form validation', () => {
    it('should validate a complete valid receipt', () => {
      const result = receiptSchema.safeParse(validReceipt);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(validReceipt);
      }
    });

    it('should reject when required fields are missing', () => {
      const incompleteReceipt = {
        amount: '100',
        receiptType: 'boleta',
      };
      const result = receiptSchema.safeParse(incompleteReceipt);
      expect(result.success).toBe(false);
    });
  });
});
