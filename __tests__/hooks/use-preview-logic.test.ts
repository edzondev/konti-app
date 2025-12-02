import { renderHook, act } from '@testing-library/react-native';
import { usePreviewLogic } from '@/hooks/receipts/use-preview-logic';
import { Alert } from 'react-native';

// Mock dependencies
const mockRouterPush = jest.fn();
const mockExtractData = jest.fn();
const mockSetHasUsedAiTrial = jest.fn();

let mockHasProOrBetter = false;
let mockHasUsedAiTrial = false;

jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: mockRouterPush,
  }),
}));

jest.mock('@/hooks/profile/use-user-plan', () => ({
  useUserPlan: () => ({
    hasPlus: mockHasProOrBetter,
  }),
}));

jest.mock('@/store/use-ai-trial-store', () => ({
  useAiTrialStore: () => ({
    hasUsedAiTrial: mockHasUsedAiTrial,
    setHasUsedAiTrial: mockSetHasUsedAiTrial,
  }),
}));

jest.mock('@/hooks/receipts/use-ai-extraction', () => ({
  useAiExtraction: () => ({
    mutateAsync: mockExtractData,
    isPending: false,
  }),
}));

jest.spyOn(Alert, 'alert');

describe('usePreviewLogic', () => {
  const testImageUrl = 'https://example.com/test-image.jpg';

  beforeEach(() => {
    jest.clearAllMocks();
    mockHasProOrBetter = false;
    mockHasUsedAiTrial = false;
  });

  describe('initialization', () => {
    it('should initialize with correct default values', () => {
      const { result } = renderHook(() =>
        usePreviewLogic({ imageUrl: testImageUrl }),
      );

      expect(result.current.extractedData).toBeUndefined();
      expect(result.current.isModalVisible).toBe(false);
      expect(result.current.documentType).toBe('boleta');
      expect(result.current.isExtractingData).toBe(false);
    });

    it('should show correct button text for trial mode', () => {
      mockHasUsedAiTrial = false;
      mockHasProOrBetter = false;

      const { result } = renderHook(() =>
        usePreviewLogic({ imageUrl: testImageUrl }),
      );

      expect(result.current.aiButtonText).toBe('Procesar imagen');
    });

    it('should show subscription button text when trial used and no pro', () => {
      mockHasUsedAiTrial = true;
      mockHasProOrBetter = false;

      const { result } = renderHook(() =>
        usePreviewLogic({ imageUrl: testImageUrl }),
      );

      expect(result.current.aiButtonText).toBe(
        'Suscribete para procesar imagen',
      );
    });

    it('should show process button text for pro users', () => {
      mockHasProOrBetter = true;
      mockHasUsedAiTrial = true;

      const { result } = renderHook(() =>
        usePreviewLogic({ imageUrl: testImageUrl }),
      );

      expect(result.current.aiButtonText).toBe('Procesar imagen');
    });
  });

  describe('handleButtonPress - subscription redirect', () => {
    it('should redirect to subscription when trial used and no pro subscription', async () => {
      mockHasUsedAiTrial = true;
      mockHasProOrBetter = false;

      const { result } = renderHook(() =>
        usePreviewLogic({ imageUrl: testImageUrl }),
      );

      await act(async () => {
        await result.current.handleButtonPress();
      });

      expect(mockRouterPush).toHaveBeenCalledWith('/subscription');
      expect(mockExtractData).not.toHaveBeenCalled();
    });
  });

  describe('handleButtonPress - AI extraction', () => {
    it('should not extract if imageUrl is undefined', async () => {
      const { result } = renderHook(() =>
        usePreviewLogic({ imageUrl: undefined }),
      );

      await act(async () => {
        await result.current.handleButtonPress();
      });

      expect(mockExtractData).not.toHaveBeenCalled();
    });

    it('should extract data successfully for trial users', async () => {
      mockHasUsedAiTrial = false;
      mockHasProOrBetter = false;

      const mockResponse = {
        success: true,
        data: {
          monto_total: '100.50',
          tipo_comprobante: 'factura',
          numero_comprobante: 'F001-00001',
          ruc: '20123456789',
          razon_social: 'Test Company',
          justificacion_contable: 'Test description',
          es_contable: true,
          fecha: '2024-01-15',
        },
      };

      mockExtractData.mockResolvedValueOnce(mockResponse);

      const { result } = renderHook(() =>
        usePreviewLogic({ imageUrl: testImageUrl }),
      );

      await act(async () => {
        await result.current.handleButtonPress();
      });

      expect(mockExtractData).toHaveBeenCalledWith(testImageUrl);
      expect(result.current.extractedData).toEqual(mockResponse.data);
      expect(result.current.documentType).toBe('factura');
    });

    it('should mark trial as used after successful extraction in trial mode', async () => {
      mockHasUsedAiTrial = false;
      mockHasProOrBetter = false;

      const mockResponse = {
        success: true,
        data: {
          monto_total: '50.00',
          tipo_comprobante: 'boleta',
          numero_comprobante: 'B001-00001',
          ruc: '',
          razon_social: 'Test',
          justificacion_contable: '',
          es_contable: false,
          fecha: '2024-01-15',
        },
      };

      mockExtractData.mockResolvedValueOnce(mockResponse);

      const { result } = renderHook(() =>
        usePreviewLogic({ imageUrl: testImageUrl }),
      );

      await act(async () => {
        await result.current.handleButtonPress();
      });

      expect(mockSetHasUsedAiTrial).toHaveBeenCalledWith(true);
    });

    it('should not mark trial as used for pro users', async () => {
      mockHasUsedAiTrial = false;
      mockHasProOrBetter = true;

      const mockResponse = {
        success: true,
        data: {
          monto_total: '50.00',
          tipo_comprobante: 'boleta',
          numero_comprobante: 'B001-00001',
          ruc: '',
          razon_social: 'Test',
          justificacion_contable: '',
          es_contable: false,
          fecha: '2024-01-15',
        },
      };

      mockExtractData.mockResolvedValueOnce(mockResponse);

      const { result } = renderHook(() =>
        usePreviewLogic({ imageUrl: testImageUrl }),
      );

      await act(async () => {
        await result.current.handleButtonPress();
      });

      expect(mockSetHasUsedAiTrial).not.toHaveBeenCalled();
    });

    it('should show success alert with trial message for trial users', async () => {
      mockHasUsedAiTrial = false;
      mockHasProOrBetter = false;

      const mockResponse = {
        success: true,
        data: {
          monto_total: '100.00',
          tipo_comprobante: 'boleta',
          numero_comprobante: 'B001-00001',
          ruc: '',
          razon_social: 'Test',
          justificacion_contable: '',
          es_contable: false,
          fecha: '2024-01-15',
        },
      };

      mockExtractData.mockResolvedValueOnce(mockResponse);

      const { result } = renderHook(() =>
        usePreviewLogic({ imageUrl: testImageUrl }),
      );

      await act(async () => {
        await result.current.handleButtonPress();
      });

      expect(Alert.alert).toHaveBeenCalledWith(
        'Éxito',
        expect.stringContaining('¡Esta fue tu prueba gratuita!'),
      );
    });

    it('should show simple success alert for pro users', async () => {
      mockHasUsedAiTrial = false;
      mockHasProOrBetter = true;

      const mockResponse = {
        success: true,
        data: {
          monto_total: '100.00',
          tipo_comprobante: 'boleta',
          numero_comprobante: 'B001-00001',
          ruc: '',
          razon_social: 'Test',
          justificacion_contable: '',
          es_contable: false,
          fecha: '2024-01-15',
        },
      };

      mockExtractData.mockResolvedValueOnce(mockResponse);

      const { result } = renderHook(() =>
        usePreviewLogic({ imageUrl: testImageUrl }),
      );

      await act(async () => {
        await result.current.handleButtonPress();
      });

      expect(Alert.alert).toHaveBeenCalledWith(
        'Éxito',
        'Información extraída correctamente. El formulario se ha autocompletado.',
      );
    });
  });

  describe('handleButtonPress - error handling', () => {
    it('should show alert when extraction response is not successful', async () => {
      mockHasUsedAiTrial = false;
      mockHasProOrBetter = true;

      mockExtractData.mockResolvedValueOnce({
        success: false,
        data: null,
      });

      const { result } = renderHook(() =>
        usePreviewLogic({ imageUrl: testImageUrl }),
      );

      await act(async () => {
        await result.current.handleButtonPress();
      });

      expect(Alert.alert).toHaveBeenCalledWith(
        'Error',
        'No se pudieron extraer los datos de la imagen',
      );
    });

    it('should show alert when extraction throws an error', async () => {
      mockHasUsedAiTrial = false;
      mockHasProOrBetter = true;

      const consoleErrorSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      mockExtractData.mockRejectedValueOnce(new Error('Network error'));

      const { result } = renderHook(() =>
        usePreviewLogic({ imageUrl: testImageUrl }),
      );

      await act(async () => {
        await result.current.handleButtonPress();
      });

      expect(Alert.alert).toHaveBeenCalledWith(
        'Error',
        'No se pudo extraer la información de la imagen',
      );
      expect(consoleErrorSpy).toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });
  });

  describe('toggleModal', () => {
    it('should toggle modal visibility', () => {
      const { result } = renderHook(() =>
        usePreviewLogic({ imageUrl: testImageUrl }),
      );

      expect(result.current.isModalVisible).toBe(false);

      act(() => {
        result.current.toggleModal();
      });

      expect(result.current.isModalVisible).toBe(true);

      act(() => {
        result.current.toggleModal();
      });

      expect(result.current.isModalVisible).toBe(false);
    });
  });

  describe('canUseAi', () => {
    it('should return true for pro users', () => {
      mockHasProOrBetter = true;
      mockHasUsedAiTrial = true;

      const { result } = renderHook(() =>
        usePreviewLogic({ imageUrl: testImageUrl }),
      );

      expect(result.current.canUseAi).toBe(true);
    });

    it('should return true for users who have not used trial', () => {
      mockHasProOrBetter = false;
      mockHasUsedAiTrial = false;

      const { result } = renderHook(() =>
        usePreviewLogic({ imageUrl: testImageUrl }),
      );

      expect(result.current.canUseAi).toBe(true);
    });

    it('should return false when trial used and no pro subscription', () => {
      mockHasProOrBetter = false;
      mockHasUsedAiTrial = true;

      const { result } = renderHook(() =>
        usePreviewLogic({ imageUrl: testImageUrl }),
      );

      expect(result.current.canUseAi).toBe(false);
    });
  });
});
