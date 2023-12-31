import { registerAs } from '@nestjs/config';
import { z } from 'zod';

import { MS_DURATION_PATTERN } from '../helper';

export const CONFIGURATION_NAMESPACE = 'authentication.jwt';

const authenticationTokensConfigurationValidationSchema = z.object({
  accessToken: z.object({
    duration: z.string().regex(MS_DURATION_PATTERN).default('15 minutes'),
    secret: z.string().min(32).trim(),
  }),
  refreshToken: z.object({
    duration: z.string().regex(MS_DURATION_PATTERN).default('1 week'),
    secret: z.string().min(32).trim(),
  }),
});

export type AuthenticationTokensConfiguration = z.infer<
  typeof authenticationTokensConfigurationValidationSchema
>;

export default registerAs(CONFIGURATION_NAMESPACE, () =>
  authenticationTokensConfigurationValidationSchema.parse({
    accessToken: {
      duration: process.env.JWT_ACCESS_TOKEN_DURATION,
      secret: process.env.JWT_ACCESS_TOKEN_SECRET,
    },
    refreshToken: {
      duration: process.env.JWT_REFRESH_TOKEN_DURATION,
      secret: process.env.JWT_REFRESH_TOKEN_SECRET,
    },
  } as AuthenticationTokensConfiguration),
);
