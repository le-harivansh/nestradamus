import { registerAs } from '@nestjs/config';
import { env } from 'node:process';
import { z } from 'zod';

export const CONFIGURATION_NAMESPACE = 'password-reset';

const passwordResetConfigurationValidationSchema = z.object({
  validForSeconds: z.coerce.number().safe().int().positive(),
});

export type PasswordResetConfiguration = z.infer<
  typeof passwordResetConfigurationValidationSchema
>;

export default registerAs(CONFIGURATION_NAMESPACE, () =>
  passwordResetConfigurationValidationSchema.parse({
    validForSeconds: env['PASSWORD_RESET_VALID_FOR_SECONDS'],
  }),
);
