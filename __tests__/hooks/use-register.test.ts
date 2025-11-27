import { renderHook, act } from '@testing-library/react-native';
import { useRegister } from '@/hooks/auth/use-register';

// Mock dependencies
const mockSignUp = jest.fn();
const mockRouterBack = jest.fn();

jest.mock('@/components/providers/auth-provider', () => ({
  useAuth: () => ({
    signUp: mockSignUp,
  }),
}));

jest.mock('expo-router', () => ({
  useRouter: () => ({
    back: mockRouterBack,
  }),
}));

describe('useRegister', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('initialization', () => {
    it('should initialize form with empty default values', () => {
      const { result } = renderHook(() => useRegister());

      expect(result.current.form.getValues()).toEqual({
        email: '',
        password: '',
        name: '',
      });
    });

    it('should have isLoading as false initially', () => {
      const { result } = renderHook(() => useRegister());

      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('form validation', () => {
    it('should validate email format', async () => {
      const { result } = renderHook(() => useRegister());

      let isValid = true;
      await act(async () => {
        result.current.form.setValue('email', 'invalid-email');
        result.current.form.setValue('password', 'Password1!');
        result.current.form.setValue('name', 'Test User');
        isValid = await result.current.form.trigger('email');
      });

      expect(isValid).toBe(false);
    });

    it('should validate password requirements', async () => {
      const { result } = renderHook(() => useRegister());

      let isValid: boolean;

      await act(async () => {
        result.current.form.setValue('password', 'password1!');
        isValid = await result.current.form.trigger('password');
      });
      expect(isValid!).toBe(false);

      await act(async () => {
        result.current.form.setValue('password', 'PASSWORD1!');
        isValid = await result.current.form.trigger('password');
      });
      expect(isValid!).toBe(false);

      await act(async () => {
        result.current.form.setValue('password', 'Password!');
        isValid = await result.current.form.trigger('password');
      });
      expect(isValid!).toBe(false);

      await act(async () => {
        result.current.form.setValue('password', 'Password1');
        isValid = await result.current.form.trigger('password');
      });
      expect(isValid!).toBe(false);

      await act(async () => {
        result.current.form.setValue('password', 'Password1!');
        isValid = await result.current.form.trigger('password');
      });
      expect(isValid!).toBe(true);
    });

    it('should validate name contains only letters and spaces', async () => {
      const { result } = renderHook(() => useRegister());

      let isValid = true;
      await act(async () => {
        result.current.form.setValue('name', 'Test123');
        isValid = await result.current.form.trigger('name');
      });

      expect(isValid).toBe(false);
    });

    it('should reject empty name', async () => {
      const { result } = renderHook(() => useRegister());

      let isValid = true;
      await act(async () => {
        result.current.form.setValue('name', '');
        isValid = await result.current.form.trigger('name');
      });

      expect(isValid).toBe(false);
    });

    it('should pass validation with valid data', async () => {
      const { result } = renderHook(() => useRegister());

      let isValid = false;
      await act(async () => {
        result.current.form.setValue('email', 'test@example.com');
        result.current.form.setValue('password', 'Password1!');
        result.current.form.setValue('name', 'María García');
        isValid = await result.current.form.trigger();
      });

      expect(isValid).toBe(true);
    });
  });

  describe('onSubmit', () => {
    it('should call signUp with form data on successful submit', async () => {
      mockSignUp.mockResolvedValueOnce(undefined);

      const { result } = renderHook(() => useRegister());

      const registerData = {
        email: 'test@example.com',
        password: 'Password1!',
        name: 'Test User',
      };

      await act(async () => {
        await result.current.onSubmit(registerData);
      });

      expect(mockSignUp).toHaveBeenCalledWith(registerData);
    });

    it('should reset form after successful registration', async () => {
      mockSignUp.mockResolvedValueOnce(undefined);

      const { result } = renderHook(() => useRegister());

      const registerData = {
        email: 'test@example.com',
        password: 'Password1!',
        name: 'Test User',
      };

      await act(async () => {
        result.current.form.setValue('email', registerData.email);
        result.current.form.setValue('password', registerData.password);
        result.current.form.setValue('name', registerData.name);
        await result.current.onSubmit(registerData);
      });

      expect(result.current.form.getValues()).toEqual({
        email: '',
        password: '',
        name: '',
      });
    });

    it('should handle signUp error gracefully', async () => {
      const consoleErrorSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {});
      const error = new Error('Registration failed');
      mockSignUp.mockRejectedValueOnce(error);

      const { result } = renderHook(() => useRegister());

      const registerData = {
        email: 'test@example.com',
        password: 'Password1!',
        name: 'Test User',
      };

      await act(async () => {
        await result.current.onSubmit(registerData);
      });

      expect(consoleErrorSpy).toHaveBeenCalledWith(error);
      consoleErrorSpy.mockRestore();
    });
  });

  describe('handleCancel', () => {
    it('should reset form when cancelled', () => {
      const { result } = renderHook(() => useRegister());

      act(() => {
        result.current.form.setValue('email', 'test@example.com');
        result.current.form.setValue('password', 'Password1!');
        result.current.form.setValue('name', 'Test User');
      });

      act(() => {
        result.current.handleCancel();
      });

      expect(result.current.form.getValues()).toEqual({
        email: '',
        password: '',
        name: '',
      });
    });

    it('should navigate back when cancelled', () => {
      const { result } = renderHook(() => useRegister());

      act(() => {
        result.current.handleCancel();
      });

      expect(mockRouterBack).toHaveBeenCalled();
    });
  });
});
