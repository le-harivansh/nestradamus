import { registerAs } from '@nestjs/config';
import ms from 'ms';
import { env } from 'node:process';
import { z } from 'zod';

import { MS_DURATION_PATTERN } from '@/_library/constant';

export const CONFIGURATION_NAMESPACE = 'administrator.authentication.jwt';

const administratorAuthenticationTokensConfigurationValidationSchema = z.object(
  {
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
  },
);

export type AdministratorAuthenticationTokensConfiguration = z.infer<
  typeof administratorAuthenticationTokensConfigurationValidationSchema
>;

export default registerAs(CONFIGURATION_NAMESPACE, () =>
  administratorAuthenticationTokensConfigurationValidationSchema.parse({
    accessToken: {
      duration: env.ADMINISTRATOR_JWT_ACCESS_TOKEN_DURATION,
      secret: env.ADMINISTRATOR_JWT_ACCESS_TOKEN_SECRET,
    },
    refreshToken: {
      duration: env.ADMINISTRATOR_JWT_REFRESH_TOKEN_DURATION,
      secret: env.ADMINISTRATOR_JWT_REFRESH_TOKEN_SECRET,
    },
  }),
);
