import { getStaticProps } from '../../pages/index';
import { getCachedQuarkFiles } from '../../utils/quark-api';

jest.mock('../../utils/quark-api', () => ({
  getCachedQuarkFiles: jest.fn(),
}));

global.fetch = jest.fn();

describe('getStaticProps', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = {
      ...originalEnv,
      QUARK_COOKIE: 'test-cookie',
    };
    fetch.mockClear();
    getCachedQuarkFiles.mockClear();
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  const mockRootDirData = {
    status: 200,
    data: {
      list: [
        { dir: true, file_name: '游戏分享', fid: 'game-folder-fid' },
        { dir: false, file_name: 'other_file.txt', fid: 'other-file-fid' },
      ],
    },
  };

  const mockSharesData = [{ source_fid: 'shared-fid-1' }];

  it('should build correct absolute URL in development environment', async () => {
    process.env.NODE_ENV = 'development';
    
    getCachedQuarkFiles.mockResolvedValue(mockRootDirData);
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockSharesData,
    });

    await getStaticProps({});

    expect(fetch).toHaveBeenCalledWith('http://localhost:3000/api/shares');
  });

  it('should build correct absolute URL in production environment', async () => {
    process.env.NODE_ENV = 'production';
    process.env.VERCEL_URL = 'my-vercel-url.com';

    getCachedQuarkFiles.mockResolvedValue(mockRootDirData);
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockSharesData,
    });

    await getStaticProps({});

    expect(fetch).toHaveBeenCalledWith('https://my-vercel-url.com/api/shares');
  });
});