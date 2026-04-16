import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import Home from '../pages/index';

// Mock Next.js router
const mockPush = jest.fn();
jest.mock('next/router', () => ({
  useRouter: () => ({
    push: mockPush,
    pathname: '/',
    query: {},
    asPath: '/',
  }),
}));

// Mock fetch
global.fetch = jest.fn();

describe('Home', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (fetch as jest.MockedFunction<typeof fetch>).mockClear();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Home', () => {
    it('有効な入力で期待通りの結果を返すこと', () => {
      const { container } = render(<Home />);
      expect(container).toBeInTheDocument();
      expect(container.firstChild).toBeTruthy();
    });

    it('必要なUI要素が正しくレンダリングされること', () => {
      render(<Home />);
      const form = screen.getByRole('form', { name: /フォーム/i });
      expect(form).toBeInTheDocument();
    });

    it('初期状態でフォームが空の状態で表示されること', () => {
      render(<Home />);
      const inputs = screen.getAllByRole('textbox');
      inputs.forEach(input => {
        expect(input).toHaveValue('');
      });
    });

    it('propsが未定義の場合でも正常にレンダリングされること', () => {
      const { container } = render(<Home />);
      expect(container).toBeInTheDocument();
      expect(() => render(<Home />)).not.toThrow();
    });

    it('コンポーネントがアンマウントされても例外が発生しないこと', () => {
      const { unmount } = render(<Home />);
      expect(() => unmount()).not.toThrow();
    });
  });

  describe('handleSubmit', () => {
    it('有効な入力で期待通りの結果を返すこと', async () => {
      (fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      } as Response);

      render(<Home />);
      const form = screen.getByRole('form', { name: /フォーム/i });
      const submitButton = screen.getByRole('button', { name: /送信/i });

      fireEvent.submit(form);

      await waitFor(() => {
        expect(fetch).toHaveBeenCalledTimes(1);
      });
    });

    it('フォームデータが正しく送信されること', async () => {
      (fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      } as Response);

      render(<Home />);
      const nameInput = screen.getByLabelText(/名前/i);
      const emailInput = screen.getByLabelText(/メール/i);
      const form = screen.getByRole('form', { name: /フォーム/i });

      fireEvent.change(nameInput, { target: { value: 'テスト太郎' } });
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.submit(form);

      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith('/api/submit', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: 'テスト太郎',
            email: 'test@example.com',
          }),
        });
      });
    });

    it('APIエラー時に適切なエラーハンドリングが実行されること', async () => {
      (fetch as jest.MockedFunction<typeof fetch>).mockRejectedValueOnce(
        new Error('Network error')
      );

      render(<Home />);
      const form = screen.getByRole('form', { name: /フォーム/i });

      fireEvent.submit(form);

      await waitFor(() => {
        const errorMessage = screen.getByText(/エラーが発生しました/i);
        expect(errorMessage).toBeInTheDocument();
      });
    });

    it('空のフォームデータで送信した場合、バリデーションエラーが表示されること', async () => {
      render(<Home />);
      const form = screen.getByRole('form', { name: /フォーム/i });

      fireEvent.submit(form);

      await waitFor(() => {
        const validationError = screen.getByText(/必須項目を入力してください/i);
        expect(validationError).toBeInTheDocument();
      });
    });

    it('送信中はボタンが無効化されること', async () => {
      (fetch as jest.MockedFunction<typeof fetch>).mockImplementationOnce(
        () => new Promise(resolve => setTimeout(() => resolve({
          ok: true,
          json: async () => ({ success: true }),
        } as Response), 100))
      );

      render(<Home />);
      const submitButton = screen.getByRole('button', { name: /送信/i });
      const form = screen.getByRole('form', { name: /フォーム/i });

      fireEvent.submit(form);

      expect(submitButton).toBeDisabled();
      expect(submitButton).toHaveTextContent(/送信中/i);

      await waitFor(() => {
        expect(submitButton).not.toBeDisabled();
      });
    });

    it('HTTPステータスエラー時に適切なエラーメッセージが表示されること', async () => {
      (fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        json: async () => ({ error: 'Invalid data' }),
      } as Response);

      render(<Home />);
      const form = screen.getByRole('form', { name: /フォーム/i });

      fireEvent.submit(form);

      await waitFor(() => {
        const errorMessage = screen.getByText(/送信に失敗しました/i);
        expect(errorMessage).toBeInTheDocument();
      });
    });

    it('成功時にフォームがリセットされること', async () => {
      (fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      } as Response);

      render(<Home />);
      const nameInput = screen.getByLabelText(/名前/i);
      const emailInput = screen.getByLabelText(/メール/i);
      const form = screen.getByRole('form', { name: /フォーム/i });

      fireEvent.change(nameInput, { target: { value: 'テスト太郎' } });
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.submit(form);

      await waitFor(() => {
        expect(nameInput).toHaveValue('');
        expect(emailInput).toHaveValue('');
      });
    });
  });
});