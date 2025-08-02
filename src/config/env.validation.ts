import * as Joi from 'joi';

export const envValidationSchema = Joi.object({
  // Database
  DATABASE_HOST: Joi.string().required(),
  DATABASE_PORT: Joi.number().default(5432),
  DATABASE_USER: Joi.string().required(),
  DATABASE_PASSWORD: Joi.string().required(),
  DATABASE_NAME: Joi.string().required(),

  // JWT Authentication
  JWT_SECRET: Joi.string().required(),
  JWT_REFRESH_SECRET: Joi.string().required(),
  JWT_ACCESS_TOKEN_EXPIRATION: Joi.string().default('15m'),
  JWT_REFRESH_TOKEN_EXPIRATION: Joi.string().default('7d'),

  // Password Hashing
  BCRYPT_SALT_ROUNDS: Joi.number().default(10),

  // Redis
  REDIS_HOST: Joi.string().default('localhost'),
  REDIS_PORT: Joi.number().default(6379),
  REDIS_PASSWORD: Joi.string().allow('').optional(),
  REDIS_TTL_MS: Joi.number().default(60000),

  // Application
  PORT: Joi.number().default(3000),
  NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),

  // TMDB API
  TMDB_API_URL: Joi.string().required(),
  TMDB_API_KEY: Joi.string().required(),
  TMDB_MAX_PAGES: Joi.number().default(10),
});
