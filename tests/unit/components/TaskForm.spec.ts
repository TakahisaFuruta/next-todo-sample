import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import TaskForm from '../TaskForm';

// Mock external dependencies
jest.mock('react', () => ({
  ...jest.requireActual('react'),
  useState: jest.fn(),
  useEffect: jest.fn(),
}));

const mockSetState = jest.fn();
const mockUseState = React.useState as jest.MockedFunction<typeof React.useState>;

describe('TaskForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseState.mockImplementation((initial) => [initial, mockSetState]);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('TaskForm', () => {
    it('有効なpropsを渡した場合、正常にレンダリングされること', () => {
      const mockProps = {
        onSubmit: jest.fn(),
        initialValues: { title: '', description: '' }
      };

      render(<TaskForm {...mockProps} />);

      expect(screen.getByRole('form')).toBeInTheDocument();
      expect(mockProps.onSubmit).not.toHaveBeenCalled();
    });

    it('初期値が設定されている場合、フォームフィールドに反映されること', () => {
      const mockProps = {
        onSubmit: jest.fn(),
        initialValues: { title: 'テストタスク', description: 'テスト説明' }
      };

      render(<TaskForm {...mockProps} />);

      const titleInput = screen.getByDisplayValue('テストタスク');
      const descriptionInput = screen.getByDisplayValue('テスト説明');

      expect(titleInput).toBeInTheDocument();
      expect(descriptionInput).toBeInTheDocument();
    });

    it('propsが未定義の場合、デフォルト値で安全に処理されること', () => {
      expect(() => {
        render(<TaskForm />);
      }).not.toThrow();
    });

    it('空のinitialValuesが渡された場合、空のフォームが表示されること', () => {
      const mockProps = {
        onSubmit: jest.fn(),
        initialValues: {}
      };

      render(<TaskForm {...mockProps} />);

      expect(screen.getByRole('form')).toBeInTheDocument();
    });

    it('nullのinitialValuesが渡された場合、エラーなく処理されること', () => {
      const mockProps = {
        onSubmit: jest.fn(),
        initialValues: null
      };

      expect(() => {
        render(<TaskForm {...mockProps} />);
      }).not.toThrow();
    });
  });

  describe('handleSubmit', () => {
    it('有効なフォームデータでsubmitした場合、onSubmitコールバックが呼ばれること', async () => {
      const mockOnSubmit = jest.fn();
      const mockProps = {
        onSubmit: mockOnSubmit,
        initialValues: { title: '', description: '' }
      };

      render(<TaskForm {...mockProps} />);

      const form = screen.getByRole('form');
      const titleInput = screen.getByLabelText(/title/i);
      const descriptionInput = screen.getByLabelText(/description/i);

      fireEvent.change(titleInput, { target: { value: 'テストタスク' } });
      fireEvent.change(descriptionInput, { target: { value: 'テスト説明' } });
      fireEvent.submit(form);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith({
          title: 'テストタスク',
          description: 'テスト説明'
        });
      });
    });

    it('onSubmitコールバックでエラーが発生した場合、適切にエラーハンドリングされること', async () => {
      const mockOnSubmit = jest.fn().mockRejectedValue(new Error('送信エラー'));
      const mockProps = {
        onSubmit: mockOnSubmit,
        initialValues: { title: '', description: '' }
      };

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      render(<TaskForm {...mockProps} />);

      const form = screen.getByRole('form');
      fireEvent.submit(form);

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('送信エラー'));
      });

      consoleSpy.mockRestore();
    });

    it('空のフォームでsubmitした場合、バリデーションエラーが表示されること', async () => {
      const mockOnSubmit = jest.fn();
      const mockProps = {
        onSubmit: mockOnSubmit,
        initialValues: { title: '', description: '' }
      };

      render(<TaskForm {...mockProps} />);

      const form = screen.getByRole('form');
      fireEvent.submit(form);

      await waitFor(() => {
        expect(screen.getByText(/タイトルは必須です/i)).toBeInTheDocument();
      });

      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it('最大文字数を超える入力でsubmitした場合、バリデーションエラーが表示されること', async () => {
      const mockOnSubmit = jest.fn();
      const mockProps = {
        onSubmit: mockOnSubmit,
        initialValues: { title: '', description: '' }
      };

      render(<TaskForm {...mockProps} />);

      const titleInput = screen.getByLabelText(/title/i);
      const longTitle = 'a'.repeat(101); // 最大文字数を超える

      fireEvent.change(titleInput, { target: { value: longTitle } });
      fireEvent.submit(screen.getByRole('form'));

      await waitFor(() => {
        expect(screen.getByText(/タイトルは100文字以内で入力してください/i)).toBeInTheDocument();
      });

      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it('nullのeventオブジェクトが渡された場合、安全に処理されること', () => {
      const mockOnSubmit = jest.fn();
      const mockProps = {
        onSubmit: mockOnSubmit,
        initialValues: { title: '', description: '' }
      };

      render(<TaskForm {...mockProps} />);

      expect(() => {
        const form = screen.getByRole('form');
        fireEvent.submit(form, { target: null });
      }).not.toThrow();
    });

    it('preventDefault が正常に呼ばれること', async () => {
      const mockOnSubmit = jest.fn();
      const mockPreventDefault = jest.fn();
      const mockProps = {
        onSubmit: mockOnSubmit,
        initialValues: { title: 'テスト', description: 'テスト' }
      };

      render(<TaskForm {...mockProps} />);

      const form = screen.getByRole('form');

      fireEvent.submit(form, {
        preventDefault: mockPreventDefault
      });

      expect(mockPreventDefault).toHaveBeenCalled();
    });

    it('フォーム送信中は送信ボタンが無効化されること', async () => {
      const mockOnSubmit = jest.fn().mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));
      const mockProps = {
        onSubmit: mockOnSubmit,
        initialValues: { title: 'テスト', description: 'テスト' }
      };

      render(<TaskForm {...mockProps} />);

      const submitButton = screen.getByRole('button', { name: /送信/i });
      const form = screen.getByRole('form');

      fireEvent.submit(form);

      expect(submitButton).toBeDisabled();

      await waitFor(() => {
        expect(submitButton).not.toBeDisabled();
      });
    });
  });
});