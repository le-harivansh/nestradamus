import { CommandRunner, SubCommand } from 'nest-commander';

import { PasswordResetSchema } from '../../../../src/_password-reset/entity/password-reset.schema';
import { UserSchema } from '../../../../src/_user/entity/user.schema';

@SubCommand({ name: 'init', description: 'Initialize the client database.' })
export class InitializationCommand extends CommandRunner {
  constructor(
    private readonly passwordResetSchema: PasswordResetSchema,
    private readonly userSchema: UserSchema,
  ) {
    super();
  }

  override async run(): Promise<void> {
    await Promise.all([
      this.passwordResetSchema.initialize(),
      this.userSchema.initialize(),
    ]);
  }
}
