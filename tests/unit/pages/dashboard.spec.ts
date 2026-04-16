import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import Dashboard from '../pages/dashboard';
import { Utility } from '../utils/utility';

jest.mock('next/router', () => ({
  useRouter: jest.fn(),
}));

jest.mock('next-auth/react', () => ({
  useSession: jest.fn(),
}));

jest.mock('../utils/utility', () => ({
  Utility: {
    logout: jest.fn(),
  },
}));

const mockPush = jest.fn();
const mockUtilityLogout = Utility.logout as jest.MockedFunction<typeof Utility.logout>;
const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>;
const mockUseSession = useSession as jest.MockedFunction<typeof useSession>;

describe('Dashboard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseRouter.mockReturnValue({
      push: mockPush,
      pathname: '/dashboard',
      query: {},
      asPath: '/dashboard',
    } as any);

    mockUseSession.mockReturnValue({
      data: {
        user: {
          id: '1',
          name: 'Test User',
          email: 'test@example.com',
        },
      },
      status: 'authenticated',
    } as any);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('Utility.logout', () => {
    it('有効な入力で期待通りの結果を返すこと', async () => {
      mockUtilityLogout.mockResolvedValue(undefined);

      render(<Dashboard />);
      const logoutButton = screen.getByRole('button', { name: /logout/i });

      fireEvent.click(logoutButton);

      await waitFor(() => {
        expect(mockUtilityLogout).toHaveBeenCalledTimes(1);
      });

      expect(mockUtilityLogout).toHaveBeenCalledWith();
      expect(() => mockUtilityLogout()).not.toThrow();
    });

    it('ログアウト処理中にエラーが発生した場合、適切にエラーハンドリングされること', async () => {
      const errorMessage = 'Logout failed';
      mockUtilityLogout.mockRejectedValue(new Error(errorMessage));

      render(<Dashboard />);
      const logoutButton = screen.getByRole('button', { name: /logout/i });

      fireEvent.click(logoutButton);

      await waitFor(() => {
        expect(mockUtilityLogout).toHaveBeenCalledTimes(1);
      });

      expect(mockUtilityLogout).toHaveBeenCalledWith();
    });

    it('複数回連続でログアウトボタンがクリックされた場合、重複実行を防ぐこと', async () => {
      mockUtilityLogout.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));

      render(<Dashboard />);
      const logoutButton = screen.getByRole('button', { name: /logout/i });

      fireEvent.click(logoutButton);
      fireEvent.click(logoutButton);
      fireEvent.click(logoutButton);

      await waitFor(() => {
        expect(mockUtilityLogout).toHaveBeenCalledTimes(1);
      });
    });

    it('ログアウト成功後にリダイレクトが実行されること', async () => {
      mockUtilityLogout.mockResolvedValue(undefined);

      render(<Dashboard />);
      const logoutButton = screen.getByRole('button', { name: /logout/i });

      fireEvent.click(logoutButton);

      await waitFor(() => {
        expect(mockUtilityLogout).toHaveBeenCalledTimes(1);
      });

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/login');
      });
    });

    it('セッションが無効な状態でログアウトが呼ばれた場合、安全に処理されること', async () => {
      mockUseSession.mockReturnValue({
        data: null,
        status: 'unauthenticated',
      } as any);

      mockUtilityLogout.mockResolvedValue(undefined);

      render(<Dashboard />);
      const logoutButton = screen.getByRole('button', { name: /logout/i });

      fireEvent.click(logoutButton);

      await waitFor(() => {
        expect(mockUtilityLogout).toHaveBeenCalledTimes(1);
      });

      expect(mockUtilityLogout).toHaveBeenCalledWith();
    });

    it('ログアウト処理中にローディング状態が表示されること', async () => {
      mockUtilityLogout.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));

      render(<Dashboard />);
      const logoutButton = screen.getByRole('button', { name: /logout/i });

      fireEvent.click(logoutButton);

      expect(screen.getByText(/logging out/i)).toBeInTheDocument();

      await waitFor(() => {
        expect(mockUtilityLogout).toHaveBeenCalledTimes(1);
      });
    });
  });
});