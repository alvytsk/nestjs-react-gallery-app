import * as Joi from 'joi';

const schema = Joi.object({
  MONGODB_URI: Joi.string(),
  MONGODB_USER: Joi.string(),
  MONGODB_PWD: Joi.string(),
});

export const envSchema = schema;
