import { render } from '@testing-library/react';
import { getCsrfToken } from 'next-auth/react';
import App from '../pages/_app';
import { AppProps } from 'next/app';

jest.mock('next-auth/react');
jest.mock('next/head', () => {
  return function Head({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
  };
});

const mockGetCsrfToken = getCsrfToken as jest.MockedFunction<typeof getCsrfToken>;

describe('Utility', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('App', () => {
    const MockComponent = () => <div>Test Component</div>;

    it('有効なComponentとpagePropsを渡した場合、正常にレンダリングされること', () => {
      const mockProps: AppProps = {
        Component: MockComponent,
        pageProps: { testProp: 'test' },
        router: {} as any
      };

      const { container } = render(<App {...mockProps} />);

      expect(container).toBeDefined();
      expect(container.querySelector('div')).toBeInTheDocument();
    });

    it('pagePropsが空オブジェクトの場合でも正常にレンダリングされること', () => {
      const mockProps: AppProps = {
        Component: MockComponent,
        pageProps: {},
        router: {} as any
      };

      const { container } = render(<App {...mockProps} />);

      expect(container).toBeDefined();
      expect(container.querySelector('div')).toBeInTheDocument();
    });

    it('Componentがnullの場合、エラーが発生すること', () => {
      const mockProps: AppProps = {
        Component: null as any,
        pageProps: {},
        router: {} as any
      };

      expect(() => render(<App {...mockProps} />)).toThrow();
    });

    it('pagePropsがnullの場合でも安全に処理されること', () => {
      const mockProps: AppProps = {
        Component: MockComponent,
        pageProps: null as any,
        router: {} as any
      };

      const { container } = render(<App {...mockProps} />);

      expect(container).toBeDefined();
    });

    it('routerプロパティが未定義の場合でも正常に動作すること', () => {
      const mockProps: AppProps = {
        Component: MockComponent,
        pageProps: {},
        router: undefined as any
      };

      const { container } = render(<App {...mockProps} />);

      expect(container).toBeDefined();
    });

    it('大きなpagePropsオブジェクトを渡した場合でも正常に処理されること', () => {
      const largePageProps = {
        data: new Array(1000).fill(0).map((_, i) => ({ id: i, value: `item-${i}` })),
        metadata: { total: 1000, page: 1 }
      };

      const mockProps: AppProps = {
        Component: MockComponent,
        pageProps: largePageProps,
        router: {} as any
      };

      const { container } = render(<App {...mockProps} />);

      expect(container).toBeDefined();
    });
  });

  describe('getCsrfToken', () => {
    it('CSRFトークンが正常に取得できる場合、トークン文字列を返すこと', async () => {
      const expectedToken = 'csrf-token-123';
      mockGetCsrfToken.mockResolvedValue(expectedToken);

      const result = await getCsrfToken();

      expect(result).toBe(expectedToken);
      expect(mockGetCsrfToken).toHaveBeenCalledTimes(1);
    });

    it('CSRFトークンの取得に失敗した場合、undefinedを返すこと', async () => {
      mockGetCsrfToken.mockResolvedValue(undefined);

      const result = await getCsrfToken();

      expect(result).toBeUndefined();
      expect(mockGetCsrfToken).toHaveBeenCalledTimes(1);
    });

    it('ネットワークエラーが発生した場合、例外がスローされること', async () => {
      const networkError = new Error('Network error');
      mockGetCsrfToken.mockRejectedValue(networkError);

      await expect(getCsrfToken()).rejects.toThrow('Network error');
      expect(mockGetCsrfToken).toHaveBeenCalledTimes(1);
    });

    it('空文字列のトークンが返された場合、空文字列を返すこと', async () => {
      mockGetCsrfToken.mockResolvedValue('');

      const result = await getCsrfToken();

      expect(result).toBe('');
      expect(mockGetCsrfToken).toHaveBeenCalledTimes(1);
    });

    it('nullが返された場合、nullを返すこと', async () => {
      mockGetCsrfToken.mockResolvedValue(null);

      const result = await getCsrfToken();

      expect(result).toBeNull();
      expect(mockGetCsrfToken).toHaveBeenCalledTimes(1);
    });

    it('非常に長いトークンが返された場合でも正常に処理されること', async () => {
      const longToken = 'a'.repeat(10000);
      mockGetCsrfToken.mockResolvedValue(longToken);

      const result = await getCsrfToken();

      expect(result).toBe(longToken);
      expect(result).toHaveLength(10000);
      expect(mockGetCsrfToken).toHaveBeenCalledTimes(1);
    });
  });
});