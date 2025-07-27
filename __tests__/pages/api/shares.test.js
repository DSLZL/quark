import { createMocks } from 'node-mocks-http';
import handler from '../../../pages/api/shares';
import * as QuarkAPI from '../../../utils/quark-api';

// Mock the entire quark-api module
jest.mock('../../../utils/quark-api');

describe('/api/shares', () => {
  const TEST_COOKIE = 'test-cookie-12345';

  beforeAll(() => {
    // Set the environment variable for all tests in this file
    process.env.QUARK_COOKIE = TEST_COOKIE;
  });

  afterAll(() => {
    // Clean up the environment variable after all tests
    delete process.env.QUARK_COOKIE;
  });

  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
  });

  it('should call getCachedQuarkShares with correct parameters and headers', async () => {
    // Arrange
    const { req, res } = createMocks({
      method: 'GET',
      query: {
        _page: '1',
        _size: '10',
      },
    });

    // Mock the implementation of getCachedQuarkShares to avoid actual API calls
    QuarkAPI.getCachedQuarkShares.mockResolvedValue({
      status: 200,
      data: { list: [] },
      metadata: { _total: 0 },
    });

    // Act
    await handler(req, res);

    // Assert
    // Verify that the mocked getCachedQuarkShares was called correctly
    expect(QuarkAPI.getCachedQuarkShares).toHaveBeenCalledTimes(1);
    expect(QuarkAPI.getCachedQuarkShares).toHaveBeenCalledWith('1', '10');
  });

  it('should return 500 if QUARK_COOKIE is not set', async () => {
    // Arrange
    delete process.env.QUARK_COOKIE; // Temporarily remove for this test

    const { req, res } = createMocks({
      method: 'GET',
    });

    // Act
    await handler(req, res);

    // Assert
    expect(res._getStatusCode()).toBe(500);
    const responseData = JSON.parse(res._getData());
    expect(responseData.error).toBe('QUARK_COOKIE is not set');

    // Restore for other tests
    process.env.QUARK_COOKIE = TEST_COOKIE;
  });
});