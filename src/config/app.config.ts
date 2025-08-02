export default () => ({
  app: {
    port: parseInt(process.env.PORT || '3000', 10),
    environment: process.env.NODE_ENV || 'development',
  },
  jwt: {
    secret: process.env.JWT_SECRET,
    refreshSecret: process.env.JWT_REFRESH_SECRET,
    accessTokenExpiration: process.env.JWT_ACCESS_TOKEN_EXPIRATION,
    refreshTokenExpiration: process.env.JWT_REFRESH_TOKEN_EXPIRATION,
  },
  bcrypt: {
    saltRounds: parseInt(process.env.BCRYPT_SALT_ROUNDS || '10', 10),
  },
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD,
    ttl: parseInt(process.env.REDIS_TTL_MS || '60000', 10),
  },
});
