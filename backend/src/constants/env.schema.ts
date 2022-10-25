import * as Joi from 'joi';

const schema = Joi.object({
  MONGODB_URI: Joi.string(),
  // MONGODB_USER: Joi.string(),
  // MONGODB_PWD: Joi.string(),
  MINIO_ACCESS_KEY: Joi.string(),
  MINIO_SECRET_KEY: Joi.string(),
  MINIO_URI: Joi.string(),
  MINIO_BUCKET_NAME: Joi.string(),
});

export const envSchema = schema;
