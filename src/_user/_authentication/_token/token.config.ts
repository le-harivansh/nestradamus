import { registerAs } from '@nestjs/config';
import ms from 'ms';
import { z } from 'zod';

import { MS_DURATION_PATTERN } from '@/_library/constant';

export const CONFIGURATION_NAMESPACE = 'user.authentication.jwt';

const authenticationTokensConfigurationValidationSchema = z.object({
  accessToken: z.object({
    duration: z
      .string()
      .regex(MS_DURATION_PATTERN)
      .default('15 minutes')
      .transform(ms),
    secret: z.string().min(32).trim(),
  }),
  refreshToken: z.object({
    duration: z
      .string()
      .regex(MS_DURATION_PATTERN)
      .default('1 week')
      .transform(ms),
    secret: z.string().min(32).trim(),
  }),
});

export type AuthenticationTokensConfiguration = z.infer<
  typeof authenticationTokensConfigurationValidationSchema
>;

export default registerAs(CONFIGURATION_NAMESPACE, () =>
  authenticationTokensConfigurationValidationSchema.parse({
    accessToken: {
      duration: process.env.USER_JWT_ACCESS_TOKEN_DURATION,
      secret: process.env.USER_JWT_ACCESS_TOKEN_SECRET,
    },
    refreshToken: {
      duration: process.env.USER_JWT_REFRESH_TOKEN_DURATION,
      secret: process.env.USER_JWT_REFRESH_TOKEN_SECRET,
    },
  }),
);
