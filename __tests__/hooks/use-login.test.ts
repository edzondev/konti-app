import { renderHook, act } from '@testing-library/react-native';
import { useLogin } from '@/hooks/auth/use-login';

// Mock dependencies
const mockSignIn = jest.fn();
const mockRouterBack = jest.fn();

jest.mock('@/components/providers/auth-provider', () => ({
  useAuth: () => ({
    signIn: mockSignIn,
  }),
}));

jest.mock('expo-router', () => ({
  useRouter: () => ({
    back: mockRouterBack,
  }),
}));

describe('useLogin', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('initialization', () => {
    it('should initialize form with empty default values', () => {
      const { result } = renderHook(() => useLogin());

      expect(result.current.form.getValues()).toEqual({
        email: '',
        password: '',
      });
    });

    it('should have isLoading as false initially', () => {
      const { result } = renderHook(() => useLogin());

      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('form validation', () => {
    it('should validate email format', async () => {
      const { result } = renderHook(() => useLogin());

      let isValid = true;
      await act(async () => {
        result.current.form.setValue('email', 'invalid-email');
        result.current.form.setValue('password', 'password123');
        isValid = await result.current.form.trigger();
      });

      expect(isValid).toBe(false);
    });

    it('should validate password minimum length', async () => {
      const { result } = renderHook(() => useLogin());

      let isValid = true;
      await act(async () => {
        result.current.form.setValue('email', 'test@example.com');
        result.current.form.setValue('password', 'short');
        isValid = await result.current.form.trigger();
      });

      expect(isValid).toBe(false);
    });

    it('should pass validation with valid data', async () => {
      const { result } = renderHook(() => useLogin());

      let isValid = false;
      await act(async () => {
        result.current.form.setValue('email', 'test@example.com');
        result.current.form.setValue('password', 'validpassword123');
        isValid = await result.current.form.trigger();
      });

      expect(isValid).toBe(true);
    });
  });

  describe('onSubmit', () => {
    it('should call signIn with form data on successful submit', async () => {
      mockSignIn.mockResolvedValueOnce(undefined);

      const { result } = renderHook(() => useLogin());

      const loginData = {
        email: 'test@example.com',
        password: 'password123',
      };

      await act(async () => {
        result.current.form.setValue('email', loginData.email);
        result.current.form.setValue('password', loginData.password);
        await result.current.onSubmit(loginData);
      });

      expect(mockSignIn).toHaveBeenCalledWith(loginData);
    });

    it('should reset form after successful login', async () => {
      mockSignIn.mockResolvedValueOnce(undefined);

      const { result } = renderHook(() => useLogin());

      const loginData = {
        email: 'test@example.com',
        password: 'password123',
      };

      await act(async () => {
        result.current.form.setValue('email', loginData.email);
        result.current.form.setValue('password', loginData.password);
        await result.current.onSubmit(loginData);
      });

      expect(result.current.form.getValues()).toEqual({
        email: '',
        password: '',
      });
    });

    it('should handle signIn error gracefully', async () => {
      const consoleErrorSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {});
      const error = new Error('Login failed');
      mockSignIn.mockRejectedValueOnce(error);

      const { result } = renderHook(() => useLogin());

      const loginData = {
        email: 'test@example.com',
        password: 'password123',
      };

      await act(async () => {
        await result.current.onSubmit(loginData);
      });

      expect(consoleErrorSpy).toHaveBeenCalledWith(error);
      consoleErrorSpy.mockRestore();
    });
  });

  describe('handleCancel', () => {
    it('should reset form when cancelled', () => {
      const { result } = renderHook(() => useLogin());

      act(() => {
        result.current.form.setValue('email', 'test@example.com');
        result.current.form.setValue('password', 'password123');
      });

      act(() => {
        result.current.handleCancel();
      });

      expect(result.current.form.getValues()).toEqual({
        email: '',
        password: '',
      });
    });

    it('should navigate back when cancelled', () => {
      const { result } = renderHook(() => useLogin());

      act(() => {
        result.current.handleCancel();
      });

      expect(mockRouterBack).toHaveBeenCalled();
    });
  });
});
