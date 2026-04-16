import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useQueryTasks, getTasks } from '../hooks/useQueryTasks';
import { ReactNode } from 'react';

// Mock external dependencies
jest.mock('../api/taskApi', () => ({
  fetchTasks: jest.fn(),
}));

jest.mock('../utils/errorHandler', () => ({
  handleApiError: jest.fn(),
}));

const mockFetchTasks = require('../api/taskApi').fetchTasks;
const mockHandleApiError = require('../utils/errorHandler').handleApiError;

describe('useQueryTasks', () => {
  let queryClient: QueryClient;

  const createWrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });
    jest.clearAllMocks();
  });

  afterEach(() => {
    queryClient.clear();
  });

  describe('useQueryTasks', () => {
    it('有効なパラメータを渡した場合、正しいクエリ結果を返すこと', async () => {
      const mockTasks = [
        { id: 1, title: 'Task 1', completed: false },
        { id: 2, title: 'Task 2', completed: true },
      ];
      mockFetchTasks.mockResolvedValue(mockTasks);

      const { result } = renderHook(() => useQueryTasks({ enabled: true }), {
        wrapper: createWrapper,
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockTasks);
      expect(result.current.error).toBeNull();
      expect(mockFetchTasks).toHaveBeenCalledTimes(1);
    });

    it('enabledがfalseの場合、クエリが実行されないこと', () => {
      const { result } = renderHook(() => useQueryTasks({ enabled: false }), {
        wrapper: createWrapper,
      });

      expect(result.current.isFetching).toBe(false);
      expect(result.current.data).toBeUndefined();
      expect(mockFetchTasks).not.toHaveBeenCalled();
    });

    it('APIエラーが発生した場合、エラー状態を返すこと', async () => {
      const mockError = new Error('API Error');
      mockFetchTasks.mockRejectedValue(mockError);

      const { result } = renderHook(() => useQueryTasks({ enabled: true }), {
        wrapper: createWrapper,
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toEqual(mockError);
      expect(result.current.data).toBeUndefined();
    });

    it('パラメータが未定義の場合、デフォルト設定でクエリを実行すること', async () => {
      const mockTasks = [];
      mockFetchTasks.mockResolvedValue(mockTasks);

      const { result } = renderHook(() => useQueryTasks(), {
        wrapper: createWrapper,
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockTasks);
      expect(mockFetchTasks).toHaveBeenCalledTimes(1);
    });

    it('ローディング状態が正しく管理されること', () => {
      mockFetchTasks.mockImplementation(() => new Promise(() => {}));

      const { result } = renderHook(() => useQueryTasks({ enabled: true }), {
        wrapper: createWrapper,
      });

      expect(result.current.isLoading).toBe(true);
      expect(result.current.isFetching).toBe(true);
      expect(result.current.data).toBeUndefined();
    });
  });

  describe('getTasks', () => {
    it('有効なパラメータを渡した場合、正しいタスクリストを返すこと', async () => {
      const mockTasks = [
        { id: 1, title: 'Task 1', completed: false },
        { id: 2, title: 'Task 2', completed: true },
      ];
      mockFetchTasks.mockResolvedValue(mockTasks);

      const result = await getTasks();

      expect(result).toEqual(mockTasks);
      expect(mockFetchTasks).toHaveBeenCalledTimes(1);
    });

    it('APIエラーが発生した場合、エラーハンドラーを呼び出して例外をスローすること', async () => {
      const mockError = new Error('Network Error');
      mockFetchTasks.mockRejectedValue(mockError);
      mockHandleApiError.mockImplementation((error) => {
        throw new Error(`Handled: ${error.message}`);
      });

      await expect(getTasks()).rejects.toThrow('Handled: Network Error');
      expect(mockHandleApiError).toHaveBeenCalledWith(mockError);
    });

    it('空のレスポンスを受信した場合、空配列を返すこと', async () => {
      mockFetchTasks.mockResolvedValue([]);

      const result = await getTasks();

      expect(result).toEqual([]);
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(0);
    });

    it('nullレスポンスを受信した場合、適切に処理すること', async () => {
      mockFetchTasks.mockResolvedValue(null);

      const result = await getTasks();

      expect(result).toBeNull();
      expect(mockFetchTasks).toHaveBeenCalledTimes(1);
    });

    it('フィルタパラメータを渡した場合、パラメータ付きでAPIを呼び出すこと', async () => {
      const mockTasks = [{ id: 1, title: 'Filtered Task', completed: false }];
      const filterParams = { status: 'pending', assignee: 'user1' };
      mockFetchTasks.mockResolvedValue(mockTasks);

      const result = await getTasks(filterParams);

      expect(result).toEqual(mockTasks);
      expect(mockFetchTasks).toHaveBeenCalledWith(filterParams);
    });
  });
});