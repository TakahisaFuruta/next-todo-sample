import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useQueryUser, getUser } from '../hooks/useQueryUser';
import { ReactNode } from 'react';

// Mock external dependencies
jest.mock('../api/userApi', () => ({
  fetchUserById: jest.fn(),
  fetchCurrentUser: jest.fn(),
}));

jest.mock('../utils/auth', () => ({
  getCurrentUserId: jest.fn(),
  isAuthenticated: jest.fn(),
}));

const mockFetchUserById = require('../api/userApi').fetchUserById;
const mockFetchCurrentUser = require('../api/userApi').fetchCurrentUser;
const mockGetCurrentUserId = require('../utils/auth').getCurrentUserId;
const mockIsAuthenticated = require('../utils/auth').isAuthenticated;

describe('useQueryUser', () => {
  let queryClient: QueryClient;
  let wrapper: ({ children }: { children: ReactNode }) => JSX.Element;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });
    wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
    jest.clearAllMocks();
  });

  afterEach(() => {
    queryClient.clear();
  });

  describe('useQueryUser', () => {
    it('認証済みユーザーの場合、ユーザー情報を正常に取得して返すこと', async () => {
      const mockUser = { id: '123', name: 'Test User', email: 'test@example.com' };
      mockIsAuthenticated.mockReturnValue(true);
      mockGetCurrentUserId.mockReturnValue('123');
      mockFetchCurrentUser.mockResolvedValue(mockUser);

      const { result } = renderHook(() => useQueryUser(), { wrapper });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockUser);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('未認証ユーザーの場合、クエリを実行せずに無効状態を返すこと', () => {
      mockIsAuthenticated.mockReturnValue(false);
      mockGetCurrentUserId.mockReturnValue(null);

      const { result } = renderHook(() => useQueryUser(), { wrapper });

      expect(result.current.data).toBeUndefined();
      expect(result.current.isLoading).toBe(false);
      expect(result.current.isSuccess).toBe(false);
      expect(mockFetchCurrentUser).not.toHaveBeenCalled();
    });

    it('APIエラーが発生した場合、エラー状態を適切に処理すること', async () => {
      const mockError = new Error('API Error');
      mockIsAuthenticated.mockReturnValue(true);
      mockGetCurrentUserId.mockReturnValue('123');
      mockFetchCurrentUser.mockRejectedValue(mockError);

      const { result } = renderHook(() => useQueryUser(), { wrapper });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toEqual(mockError);
      expect(result.current.data).toBeUndefined();
      expect(result.current.isLoading).toBe(false);
    });

    it('ユーザーIDが空文字列の場合、クエリを実行しないこと', () => {
      mockIsAuthenticated.mockReturnValue(true);
      mockGetCurrentUserId.mockReturnValue('');

      const { result } = renderHook(() => useQueryUser(), { wrapper });

      expect(result.current.data).toBeUndefined();
      expect(result.current.isLoading).toBe(false);
      expect(mockFetchCurrentUser).not.toHaveBeenCalled();
    });

    it('ネットワークエラーの場合、適切なエラーハンドリングを行うこと', async () => {
      const networkError = new Error('Network Error');
      mockIsAuthenticated.mockReturnValue(true);
      mockGetCurrentUserId.mockReturnValue('123');
      mockFetchCurrentUser.mockRejectedValue(networkError);

      const { result } = renderHook(() => useQueryUser(), { wrapper });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toEqual(networkError);
      expect(result.current.isSuccess).toBe(false);
    });
  });

  describe('getUser', () => {
    it('有効なユーザーIDを渡した場合、対応するユーザー情報を返すこと', async () => {
      const userId = '456';
      const mockUser = { id: userId, name: 'Another User', email: 'another@example.com' };
      mockFetchUserById.mockResolvedValue(mockUser);

      const result = await getUser(userId);

      expect(result).toEqual(mockUser);
      expect(mockFetchUserById).toHaveBeenCalledWith(userId);
      expect(mockFetchUserById).toHaveBeenCalledTimes(1);
    });

    it('存在しないユーザーIDを渡した場合、適切なエラーをスローすること', async () => {
      const userId = 'nonexistent';
      const notFoundError = new Error('User not found');
      mockFetchUserById.mockRejectedValue(notFoundError);

      await expect(getUser(userId)).rejects.toThrow('User not found');
      expect(mockFetchUserById).toHaveBeenCalledWith(userId);
    });

    it('nullまたはundefinedのユーザーIDを渡した場合、適切にエラーハンドリングすること', async () => {
      const invalidInputError = new Error('Invalid user ID');
      mockFetchUserById.mockRejectedValue(invalidInputError);

      await expect(getUser(null as any)).rejects.toThrow();
      await expect(getUser(undefined as any)).rejects.toThrow();
    });

    it('空文字列のユーザーIDを渡した場合、適切にエラーハンドリングすること', async () => {
      const emptyIdError = new Error('Empty user ID');
      mockFetchUserById.mockRejectedValue(emptyIdError);

      await expect(getUser('')).rejects.toThrow();
      expect(mockFetchUserById).toHaveBeenCalledWith('');
    });

    it('APIレスポンスが不正な形式の場合、適切にエラーハンドリングすること', async () => {
      const userId = '789';
      const malformedResponse = { invalidData: true };
      mockFetchUserById.mockResolvedValue(malformedResponse);

      const result = await getUser(userId);

      expect(result).toEqual(malformedResponse);
      expect(mockFetchUserById).toHaveBeenCalledWith(userId);
    });
  });
});