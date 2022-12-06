import Joi from 'joi';

const schema = Joi.object({
  MONGODB_URI: Joi.string(),
  AWS_ACCESS_KEY_ID: Joi.string(),
  AWS_SECRET_ACCESS_KEY: Joi.string(),
  AWS_REGION: Joi.string(),
  AWS_URI: Joi.string(),
  REDIS_HOST: Joi.string(),
  REDIS_PORT: Joi.string(),
  REDIS_PASSWORD: Joi.string(),
});

export const envSchema = schema;
