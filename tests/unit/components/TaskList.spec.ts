import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import TaskList from '../TaskList';

// Mock external dependencies
jest.mock('react', () => ({
  ...jest.requireActual('react'),
  useState: jest.fn(),
  useEffect: jest.fn(),
  useCallback: jest.fn(),
}));

jest.mock('next/router', () => ({
  useRouter: jest.fn(),
}));

jest.mock('../services/taskService', () => ({
  fetchTasks: jest.fn(),
  createTask: jest.fn(),
  updateTask: jest.fn(),
  deleteTask: jest.fn(),
}));

const mockUseState = React.useState as jest.MockedFunction<typeof React.useState>;
const mockUseEffect = React.useEffect as jest.MockedFunction<typeof React.useEffect>;
const mockUseCallback = React.useCallback as jest.MockedFunction<typeof React.useCallback>;

describe('TaskList', () => {
  let mockSetTasks: jest.Mock;
  let mockSetLoading: jest.Mock;
  let mockSetError: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    mockSetTasks = jest.fn();
    mockSetLoading = jest.fn();
    mockSetError = jest.fn();

    mockUseState
      .mockReturnValueOnce([[], mockSetTasks])
      .mockReturnValueOnce([false, mockSetLoading])
      .mockReturnValueOnce([null, mockSetError]);

    mockUseEffect.mockImplementation((fn) => fn());
    mockUseCallback.mockImplementation((fn) => fn);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('Utility.TaskList', () => {
    it('有効な入力で期待通りの結果を返すこと', () => {
      const mockTasks = [
        { id: 1, title: 'タスク1', completed: false },
        { id: 2, title: 'タスク2', completed: true }
      ];

      mockUseState
        .mockReturnValueOnce([mockTasks, mockSetTasks])
        .mockReturnValueOnce([false, mockSetLoading])
        .mockReturnValueOnce([null, mockSetError]);

      const { container } = render(<TaskList />);

      expect(container).toBeInTheDocument();
      expect(screen.getByText('タスク1')).toBeInTheDocument();
      expect(screen.getByText('タスク2')).toBeInTheDocument();
    });

    it('空のタスクリストの場合、適切なメッセージを表示すること', () => {
      mockUseState
        .mockReturnValueOnce([[], mockSetTasks])
        .mockReturnValueOnce([false, mockSetLoading])
        .mockReturnValueOnce([null, mockSetError]);

      render(<TaskList />);

      expect(screen.getByText('タスクがありません')).toBeInTheDocument();
    });

    it('ローディング状態の場合、ローディングインジケーターを表示すること', () => {
      mockUseState
        .mockReturnValueOnce([[], mockSetTasks])
        .mockReturnValueOnce([true, mockSetLoading])
        .mockReturnValueOnce([null, mockSetError]);

      render(<TaskList />);

      expect(screen.getByText('読み込み中...')).toBeInTheDocument();
    });

    it('エラー状態の場合、エラーメッセージを表示すること', () => {
      const errorMessage = 'データの取得に失敗しました';
      mockUseState
        .mockReturnValueOnce([[], mockSetTasks])
        .mockReturnValueOnce([false, mockSetLoading])
        .mockReturnValueOnce([errorMessage, mockSetError]);

      render(<TaskList />);

      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });

    it('nullまたはundefinedのタスクが含まれている場合、安全に処理すること', () => {
      const mockTasksWithNull = [
        { id: 1, title: 'タスク1', completed: false },
        null,
        undefined,
        { id: 2, title: 'タスク2', completed: true }
      ];

      mockUseState
        .mockReturnValueOnce([mockTasksWithNull, mockSetTasks])
        .mockReturnValueOnce([false, mockSetLoading])
        .mockReturnValueOnce([null, mockSetError]);

      const { container } = render(<TaskList />);

      expect(container).toBeInTheDocument();
      expect(screen.getByText('タスク1')).toBeInTheDocument();
      expect(screen.getByText('タスク2')).toBeInTheDocument();
    });

    it('大量のタスクが存在する場合、パフォーマンスを維持して表示すること', () => {
      const largeMockTasks = Array.from({ length: 1000 }, (_, index) => ({
        id: index + 1,
        title: `タスク${index + 1}`,
        completed: index % 2 === 0
      }));

      mockUseState
        .mockReturnValueOnce([largeMockTasks, mockSetTasks])
        .mockReturnValueOnce([false, mockSetLoading])
        .mockReturnValueOnce([null, mockSetError]);

      const startTime = performance.now();
      render(<TaskList />);
      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(100);
      expect(screen.getByText('タスク1')).toBeInTheDocument();
    });

    it('タスクのクリックイベントが正しく処理されること', async () => {
      const mockTasks = [
        { id: 1, title: 'クリック可能なタスク', completed: false }
      ];

      mockUseState
        .mockReturnValueOnce([mockTasks, mockSetTasks])
        .mockReturnValueOnce([false, mockSetLoading])
        .mockReturnValueOnce([null, mockSetError]);

      render(<TaskList />);

      const taskElement = screen.getByText('クリック可能なタスク');
      fireEvent.click(taskElement);

      await waitFor(() => {
        expect(taskElement).toHaveClass('clicked');
      });
    });

    it('コンポーネントのアンマウント時にクリーンアップが実行されること', () => {
      const { unmount } = render(<TaskList />);

      expect(() => unmount()).not.toThrow();
    });
  });
});