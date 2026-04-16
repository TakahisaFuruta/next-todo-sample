import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { UseInfo } from '../components/UseInfo';

// Mock external dependencies
jest.mock('react-router-dom', () => ({
  useNavigate: jest.fn(),
  useLocation: jest.fn(),
}));

jest.mock('../services/userService', () => ({
  getUserInfo: jest.fn(),
  updateUserInfo: jest.fn(),
}));

jest.mock('../utils/validation', () => ({
  validateUserInput: jest.fn(),
}));

describe('UseInfo', () => {
  let mockNavigate: jest.Mock;
  let mockGetUserInfo: jest.Mock;
  let mockUpdateUserInfo: jest.Mock;
  let mockValidateUserInput: jest.Mock;

  beforeEach(() => {
    mockNavigate = jest.fn();
    mockGetUserInfo = jest.fn();
    mockUpdateUserInfo = jest.fn();
    mockValidateUserInput = jest.fn();

    (require('react-router-dom').useNavigate as jest.Mock).mockReturnValue(mockNavigate);
    (require('../services/userService').getUserInfo as jest.Mock).mockImplementation(mockGetUserInfo);
    (require('../services/userService').updateUserInfo as jest.Mock).mockImplementation(mockUpdateUserInfo);
    (require('../utils/validation').validateUserInput as jest.Mock).mockImplementation(mockValidateUserInput);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('UserInfo', () => {
    it('有効な入力で期待通りの結果を返すこと', async () => {
      // Arrange
      const mockUserData = {
        id: 1,
        name: 'テストユーザー',
        email: 'test@example.com',
        role: 'user'
      };
      mockGetUserInfo.mockResolvedValue(mockUserData);
      mockValidateUserInput.mockReturnValue({ isValid: true, errors: [] });

      // Act
      render(<UseInfo />);

      // Assert
      await waitFor(() => {
        expect(mockGetUserInfo).toHaveBeenCalled();
      });
      expect(screen.getByText('テストユーザー')).toBeInTheDocument();
      expect(screen.getByText('test@example.com')).toBeInTheDocument();
    });

    it('ユーザー情報の取得に失敗した場合、エラーメッセージを表示すること', async () => {
      // Arrange
      const errorMessage = 'ユーザー情報の取得に失敗しました';
      mockGetUserInfo.mockRejectedValue(new Error(errorMessage));

      // Act
      render(<UseInfo />);

      // Assert
      await waitFor(() => {
        expect(screen.getByText(/エラーが発生しました/)).toBeInTheDocument();
      });
      expect(mockGetUserInfo).toHaveBeenCalled();
    });

    it('ユーザー情報がnullの場合、デフォルト表示を行うこと', async () => {
      // Arrange
      mockGetUserInfo.mockResolvedValue(null);

      // Act
      render(<UseInfo />);

      // Assert
      await waitFor(() => {
        expect(screen.getByText('ユーザー情報が見つかりません')).toBeInTheDocument();
      });
    });

    it('空のユーザー情報オブジェクトの場合、適切にハンドリングすること', async () => {
      // Arrange
      mockGetUserInfo.mockResolvedValue({});

      // Act
      render(<UseInfo />);

      // Assert
      await waitFor(() => {
        expect(screen.getByText('名前未設定')).toBeInTheDocument();
        expect(screen.getByText('メール未設定')).toBeInTheDocument();
      });
    });

    it('ローディング状態を正しく表示すること', () => {
      // Arrange
      mockGetUserInfo.mockImplementation(() => new Promise(() => {})); // Never resolves

      // Act
      render(<UseInfo />);

      // Assert
      expect(screen.getByText('読み込み中...')).toBeInTheDocument();
    });

    it('ユーザー情報の更新が成功した場合、成功メッセージを表示すること', async () => {
      // Arrange
      const mockUserData = {
        id: 1,
        name: 'テストユーザー',
        email: 'test@example.com',
        role: 'user'
      };
      mockGetUserInfo.mockResolvedValue(mockUserData);
      mockUpdateUserInfo.mockResolvedValue({ success: true });
      mockValidateUserInput.mockReturnValue({ isValid: true, errors: [] });

      // Act
      render(<UseInfo />);
      await waitFor(() => {
        expect(screen.getByText('テストユーザー')).toBeInTheDocument();
      });

      const editButton = screen.getByRole('button', { name: '編集' });
      fireEvent.click(editButton);

      const nameInput = screen.getByDisplayValue('テストユーザー');
      fireEvent.change(nameInput, { target: { value: '更新されたユーザー' } });

      const saveButton = screen.getByRole('button', { name: '保存' });
      fireEvent.click(saveButton);

      // Assert
      await waitFor(() => {
        expect(mockUpdateUserInfo).toHaveBeenCalledWith({
          id: 1,
          name: '更新されたユーザー',
          email: 'test@example.com',
          role: 'user'
        });
        expect(screen.getByText('更新が完了しました')).toBeInTheDocument();
      });
    });

    it('バリデーションエラーがある場合、エラーメッセージを表示すること', async () => {
      // Arrange
      const mockUserData = {
        id: 1,
        name: 'テストユーザー',
        email: 'test@example.com',
        role: 'user'
      };
      mockGetUserInfo.mockResolvedValue(mockUserData);
      mockValidateUserInput.mockReturnValue({
        isValid: false,
        errors: ['名前は必須です', 'メールアドレスの形式が正しくありません']
      });

      // Act
      render(<UseInfo />);
      await waitFor(() => {
        expect(screen.getByText('テストユーザー')).toBeInTheDocument();
      });

      const editButton = screen.getByRole('button', { name: '編集' });
      fireEvent.click(editButton);

      const nameInput = screen.getByDisplayValue('テストユーザー');
      fireEvent.change(nameInput, { target: { value: '' } });

      const saveButton = screen.getByRole('button', { name: '保存' });
      fireEvent.click(saveButton);

      // Assert
      await waitFor(() => {
        expect(screen.getByText('名前は必須です')).toBeInTheDocument();
        expect(screen.getByText('メールアドレスの形式が正しくありません')).toBeInTheDocument();
      });
      expect(mockUpdateUserInfo).not.toHaveBeenCalled();
    });

    it('権限が不足している場合、編集ボタンを非表示にすること', async () => {
      // Arrange
      const mockUserData = {
        id: 1,
        name: 'テストユーザー',
        email: 'test@example.com',
        role: 'readonly'
      };
      mockGetUserInfo.mockResolvedValue(mockUserData);

      // Act
      render(<UseInfo />);

      // Assert
      await waitFor(() => {
        expect(screen.getByText('テストユーザー')).toBeInTheDocument();
      });
      expect(screen.queryByRole('button', { name: '編集' })).not.toBeInTheDocument();
    });
  });
});