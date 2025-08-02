import appConfig from './app.config';

describe('AppConfig', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('should return default configuration when no environment variables are set', () => {
    // Clear relevant env vars
    delete process.env.PORT;
    delete process.env.NODE_ENV;
    delete process.env.JWT_SECRET;
    delete process.env.JWT_REFRESH_SECRET;
    delete process.env.JWT_ACCESS_TOKEN_EXPIRATION;
    delete process.env.JWT_REFRESH_TOKEN_EXPIRATION;
    delete process.env.BCRYPT_SALT_ROUNDS;
    delete process.env.REDIS_HOST;
    delete process.env.REDIS_PORT;
    delete process.env.REDIS_PASSWORD;
    delete process.env.REDIS_TTL_MS;

    const config = appConfig();

    expect(config).toEqual({
      app: {
        port: 8080,
        environment: 'development',
      },
      jwt: {
        secret: undefined,
        refreshSecret: undefined,
        accessTokenExpiration: undefined,
        refreshTokenExpiration: undefined,
      },
      bcrypt: {
        saltRounds: 10,
      },
      redis: {
        host: 'localhost',
        port: 6379,
        password: undefined,
        ttl: 60000,
      },
    });
  });

  it('should use environment variables when provided', () => {
    process.env.PORT = '8080';
    process.env.NODE_ENV = 'production';
    process.env.JWT_SECRET = 'test-jwt-secret';
    process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';
    process.env.JWT_ACCESS_TOKEN_EXPIRATION = '30m';
    process.env.JWT_REFRESH_TOKEN_EXPIRATION = '14d';
    process.env.BCRYPT_SALT_ROUNDS = '12';
    process.env.REDIS_HOST = 'redis.example.com';
    process.env.REDIS_PORT = '6380';
    process.env.REDIS_PASSWORD = 'redis-password';
    process.env.REDIS_TTL_MS = '120000';

    const config = appConfig();

    expect(config).toEqual({
      app: {
        port: 8080,
        environment: 'production',
      },
      jwt: {
        secret: 'test-jwt-secret',
        refreshSecret: 'test-refresh-secret',
        accessTokenExpiration: '30m',
        refreshTokenExpiration: '14d',
      },
      bcrypt: {
        saltRounds: 12,
      },
      redis: {
        host: 'redis.example.com',
        port: 6380,
        password: 'redis-password',
        ttl: 120000,
      },
    });
  });

  it('should handle invalid PORT gracefully', () => {
    process.env.PORT = 'invalid-port';

    const config = appConfig();

    expect(config.app.port).toBeNaN();
  });

  it('should handle invalid BCRYPT_SALT_ROUNDS gracefully', () => {
    process.env.BCRYPT_SALT_ROUNDS = 'invalid-number';

    const config = appConfig();

    expect(config.bcrypt.saltRounds).toBeNaN();
  });

  it('should handle invalid REDIS_PORT gracefully', () => {
    process.env.REDIS_PORT = 'invalid-port';

    const config = appConfig();

    expect(config.redis.port).toBeNaN();
  });

  it('should handle invalid REDIS_TTL_MS gracefully', () => {
    process.env.REDIS_TTL_MS = 'invalid-ttl';

    const config = appConfig();

    expect(config.redis.ttl).toBeNaN();
  });

  it('should handle test environment', () => {
    process.env.NODE_ENV = 'test';
    process.env.PORT = '3001';

    const config = appConfig();

    expect(config.app.environment).toBe('test');
    expect(config.app.port).toBe(3001);
  });

  it('should handle empty string values', () => {
    process.env.JWT_SECRET = '';
    process.env.REDIS_PASSWORD = '';

    const config = appConfig();

    expect(config.jwt.secret).toBe('');
    expect(config.redis.password).toBe('');
  });
});
