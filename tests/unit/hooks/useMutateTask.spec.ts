import { renderHook, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useMutateTask } from '../useMutateTask';
import * as taskApi from '../api/taskApi';
import { toast } from 'react-toastify';
import { ReactNode } from 'react';

jest.mock('../api/taskApi');
jest.mock('react-toastify');

const mockTaskApi = taskApi as jest.Mocked<typeof taskApi>;
const mockToast = toast as jest.Mocked<typeof toast>;

describe('useMutateTask', () => {
  let queryClient: QueryClient;
  let wrapper: ({ children }: { children: ReactNode }) => JSX.Element;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
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

  describe('useMutateTask', () => {
    it('正常系 - 有効な入力で期待通りの結果を返すこと', () => {
      const { result } = renderHook(() => useMutateTask(), { wrapper });

      expect(result.current).toBeDefined();
      expect(typeof result.current.createTaskMutation).toBe('object');
      expect(typeof result.current.updateTaskMutation).toBe('object');
      expect(typeof result.current.deleteTaskMutation).toBe('object');
    });

    it('createTaskMutation実行時に成功した場合、適切な処理が実行されること', async () => {
      const mockTask = { id: 1, title: 'Test Task', completed: false };
      mockTaskApi.createTask = jest.fn().mockResolvedValue(mockTask);
      mockToast.success = jest.fn();

      const { result } = renderHook(() => useMutateTask(), { wrapper });

      await act(async () => {
        result.current.createTaskMutation.mutate({ title: 'Test Task' });
      });

      expect(mockTaskApi.createTask).toHaveBeenCalledWith({ title: 'Test Task' });
      expect(mockToast.success).toHaveBeenCalledWith('タスクが作成されました');
    });

    it('createTaskMutation実行時にエラーが発生した場合、エラートーストが表示されること', async () => {
      const mockError = new Error('API Error');
      mockTaskApi.createTask = jest.fn().mockRejectedValue(mockError);
      mockToast.error = jest.fn();

      const { result } = renderHook(() => useMutateTask(), { wrapper });

      await act(async () => {
        result.current.createTaskMutation.mutate({ title: 'Test Task' });
      });

      expect(mockToast.error).toHaveBeenCalledWith('タスクの作成に失敗しました');
    });

    it('updateTaskMutation実行時に成功した場合、適切な処理が実行されること', async () => {
      const mockTask = { id: 1, title: 'Updated Task', completed: true };
      mockTaskApi.updateTask = jest.fn().mockResolvedValue(mockTask);
      mockToast.success = jest.fn();

      const { result } = renderHook(() => useMutateTask(), { wrapper });

      await act(async () => {
        result.current.updateTaskMutation.mutate({ id: 1, title: 'Updated Task', completed: true });
      });

      expect(mockTaskApi.updateTask).toHaveBeenCalledWith({ id: 1, title: 'Updated Task', completed: true });
      expect(mockToast.success).toHaveBeenCalledWith('タスクが更新されました');
    });

    it('updateTaskMutation実行時にエラーが発生した場合、エラートーストが表示されること', async () => {
      const mockError = new Error('Update Error');
      mockTaskApi.updateTask = jest.fn().mockRejectedValue(mockError);
      mockToast.error = jest.fn();

      const { result } = renderHook(() => useMutateTask(), { wrapper });

      await act(async () => {
        result.current.updateTaskMutation.mutate({ id: 1, title: 'Updated Task' });
      });

      expect(mockToast.error).toHaveBeenCalledWith('タスクの更新に失敗しました');
    });

    it('deleteTaskMutation実行時に成功した場合、適切な処理が実行されること', async () => {
      mockTaskApi.deleteTask = jest.fn().mockResolvedValue(undefined);
      mockToast.success = jest.fn();

      const { result } = renderHook(() => useMutateTask(), { wrapper });

      await act(async () => {
        result.current.deleteTaskMutation.mutate(1);
      });

      expect(mockTaskApi.deleteTask).toHaveBeenCalledWith(1);
      expect(mockToast.success).toHaveBeenCalledWith('タスクが削除されました');
    });

    it('deleteTaskMutation実行時にエラーが発生した場合、エラートーストが表示されること', async () => {
      const mockError = new Error('Delete Error');
      mockTaskApi.deleteTask = jest.fn().mockRejectedValue(mockError);
      mockToast.error = jest.fn();

      const { result } = renderHook(() => useMutateTask(), { wrapper });

      await act(async () => {
        result.current.deleteTaskMutation.mutate(1);
      });

      expect(mockToast.error).toHaveBeenCalledWith('タスクの削除に失敗しました');
    });

    it('QueryClientが未定義の場合でも適切に動作すること', () => {
      const { result } = renderHook(() => useMutateTask());

      expect(result.current).toBeDefined();
      expect(result.current.createTaskMutation).toBeDefined();
      expect(result.current.updateTaskMutation).toBeDefined();
      expect(result.current.deleteTaskMutation).toBeDefined();
    });

    it('mutation実行中のローディング状態が正しく管理されること', async () => {
      mockTaskApi.createTask = jest.fn().mockImplementation(() =>
        new Promise(resolve => setTimeout(() => resolve({ id: 1, title: 'Test' }), 100))
      );

      const { result } = renderHook(() => useMutateTask(), { wrapper });

      act(() => {
        result.current.createTaskMutation.mutate({ title: 'Test Task' });
      });

      expect(result.current.createTaskMutation.isPending).toBe(true);

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 150));
      });

      expect(result.current.createTaskMutation.isPending).toBe(false);
    });
  });
});