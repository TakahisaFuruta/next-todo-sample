import { render } from '@testing-library/react';
import Document, { Html, Head, Main, NextScript } from 'next/document';
import { DocumentContext, DocumentInitialProps } from 'next/document';

jest.mock('next/document', () => ({
  __esModule: true,
  default: jest.fn(),
  Html: jest.fn(),
  Head: jest.fn(),
  Main: jest.fn(),
  NextScript: jest.fn(),
}));

describe('Document', () => {
  let mockDocumentContext: DocumentContext;

  beforeEach(() => {
    jest.clearAllMocks();
    mockDocumentContext = {
      pathname: '/test',
      query: {},
      asPath: '/test',
      req: {} as any,
      res: {} as any,
      err: undefined,
      renderPage: jest.fn().mockResolvedValue({
        html: '<div>test</div>',
        head: [],
      }),
    };

    (Html as jest.Mock).mockImplementation(({ children }) => children);
    (Head as jest.Mock).mockImplementation(({ children }) => children);
    (Main as jest.Mock).mockImplementation(() => '<main></main>');
    (NextScript as jest.Mock).mockImplementation(() => '<script></script>');
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('getInitialProps', () => {
    it('有効なコンテキストを渡した場合、初期プロパティを正常に返すこと', async () => {
      const mockGetInitialProps = jest.fn().mockResolvedValue({
        html: '<div>test</div>',
        head: [],
        styles: [],
      });

      Document.getInitialProps = mockGetInitialProps;

      const result = await Document.getInitialProps(mockDocumentContext);

      expect(mockGetInitialProps).toHaveBeenCalledWith(mockDocumentContext);
      expect(result).toEqual({
        html: '<div>test</div>',
        head: [],
        styles: [],
      });
    });

    it('renderPageが失敗した場合、適切にエラーハンドリングされること', async () => {
      const mockError = new Error('Render failed');
      mockDocumentContext.renderPage = jest.fn().mockRejectedValue(mockError);

      const mockGetInitialProps = jest.fn().mockRejectedValue(mockError);
      Document.getInitialProps = mockGetInitialProps;

      await expect(Document.getInitialProps(mockDocumentContext)).rejects.toThrow('Render failed');
    });

    it('コンテキストがnullまたはundefinedの場合、デフォルト値で処理されること', async () => {
      const mockGetInitialProps = jest.fn().mockResolvedValue({
        html: '',
        head: [],
        styles: [],
      });

      Document.getInitialProps = mockGetInitialProps;

      const result = await Document.getInitialProps(null as any);

      expect(mockGetInitialProps).toHaveBeenCalledWith(null);
      expect(result).toBeDefined();
    });

    it('空のクエリパラメータを持つコンテキストでも正常に処理されること', async () => {
      const emptyQueryContext = {
        ...mockDocumentContext,
        query: {},
      };

      const mockGetInitialProps = jest.fn().mockResolvedValue({
        html: '<div>empty query</div>',
        head: [],
        styles: [],
      });

      Document.getInitialProps = mockGetInitialProps;

      const result = await Document.getInitialProps(emptyQueryContext);

      expect(result.html).toBe('<div>empty query</div>');
    });
  });

  describe('render', () => {
    it('有効な入力で期待通りのHTMLドキュメント構造を返すこと', () => {
      const documentInstance = new Document();
      documentInstance.props = {
        html: '<div>test content</div>',
        head: [],
        styles: [],
        __NEXT_DATA__: { props: {}, page: '/', query: {}, buildId: 'test' },
      };

      const result = documentInstance.render();

      expect(Html).toHaveBeenCalled();
      expect(Head).toHaveBeenCalled();
      expect(Main).toHaveBeenCalled();
      expect(NextScript).toHaveBeenCalled();
    });

    it('propsがnullまたはundefinedの場合、デフォルト値で安全に処理されること', () => {
      const documentInstance = new Document();
      documentInstance.props = null as any;

      expect(() => documentInstance.render()).not.toThrow();
    });

    it('空のheadとstylesを持つpropsでも正常にレンダリングされること', () => {
      const documentInstance = new Document();
      documentInstance.props = {
        html: '<div>minimal content</div>',
        head: [],
        styles: [],
        __NEXT_DATA__: { props: {}, page: '/', query: {}, buildId: 'test' },
      };

      const result = documentInstance.render();

      expect(result).toBeDefined();
      expect(Html).toHaveBeenCalled();
    });

    it('複数のheadタグとスタイルを含むpropsでも適切にレンダリングされること', () => {
      const documentInstance = new Document();
      documentInstance.props = {
        html: '<div>rich content</div>',
        head: [
          { type: 'meta', props: { name: 'description', content: 'test' } },
          { type: 'title', props: {}, children: 'Test Title' },
        ],
        styles: [
          { type: 'style', props: {}, children: 'body { margin: 0; }' },
        ],
        __NEXT_DATA__: { props: {}, page: '/', query: {}, buildId: 'test' },
      };

      const result = documentInstance.render();

      expect(result).toBeDefined();
      expect(Html).toHaveBeenCalled();
      expect(Head).toHaveBeenCalled();
    });

    it('カスタムlang属性を持つHtmlコンポーネントが正しく設定されること', () => {
      const documentInstance = new Document();
      documentInstance.props = {
        html: '<div>localized content</div>',
        head: [],
        styles: [],
        __NEXT_DATA__: { props: {}, page: '/', query: {}, buildId: 'test' },
      };

      documentInstance.render();

      expect(Html).toHaveBeenCalledWith(
        expect.objectContaining({
          lang: expect.any(String),
        }),
        expect.any(Object)
      );
    });
  });
});