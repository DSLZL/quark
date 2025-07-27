import { getCachedQuarkShares } from '../../utils/quark-api';

describe('utils/quark-api', () => {
  const TEST_COOKIE = 'test-cookie-for-quark-api';

  beforeAll(() => {
    process.env.QUARK_COOKIE = TEST_COOKIE;
  });

  afterAll(() => {
    delete process.env.QUARK_COOKIE;
  });

  beforeEach(() => {
    jest.resetAllMocks();
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ status: 200, data: { list: [] } }),
      })
    );
  });

  describe('getCachedQuarkShares', () => {
    it('should call fetch with the exact URL and headers', async () => {
      await getCachedQuarkShares('2', '25');

      const expectedUrl = 'https://drive-pc.quark.cn/1/clouddrive/share/mypage/detail?_page=2&_size=25&_order_field=created_at&_order_type=desc&_fetch_total=1';
      
      expect(fetch).toHaveBeenCalledTimes(1);
      expect(fetch).toHaveBeenCalledWith(
        expectedUrl,
        {
          headers: {
            'Cookie': TEST_COOKIE,
          },
        }
      );
    });

    it('should return data from cache if available', async () => {
        const page = '1';
        const size = '10';
        const cacheKey = `shares-page:${page}-size:${size}`;
        const cachedData = { status: 200, data: { list: [{id: 'cached'}]}};
        
        // Prime the cache
        const cache = require('../../utils/cache').default;
        cache.set(cacheKey, cachedData);

        const result = await getCachedQuarkShares(page, size);
        
        expect(result).toEqual(cachedData);
        expect(fetch).not.toHaveBeenCalled();

        // Cleanup cache
        cache.delete(cacheKey);
    });

    it('should handle fetch errors gracefully', async () => {
        const cache = require('../../utils/cache').default;
        const cacheKey = `shares-page:1-size:10`;
        cache.delete(cacheKey); // Ensure cache is clean for this test

        fetch.mockImplementationOnce(() => Promise.reject(new Error('Network error')));

        const result = await getCachedQuarkShares('1', '10');

        expect(result).toEqual({
            status: 500,
            message: 'Network error',
            data: { list: [] }
        });
    });
  });
});