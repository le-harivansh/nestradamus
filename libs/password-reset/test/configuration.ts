import { BadRequestException, NotFoundException } from '@nestjs/common';

import { PasswordResetModuleOptions } from '@library/password-reset/password-reset.module-options';

export class Configuration {
  readonly user: User = {
    id: '99',
    email: 'user@email.dev',
    password: 'password',
  };

  readonly passwordResets: PasswordReset[] = [];

  readonly moduleOptions: Readonly<PasswordResetModuleOptions> = {
    route: {
      forgotPassword: 'forgot-password',
      resetPassword: 'reset-password/:id',
    },

    callback: {
      resolveUser: (email: string) => {
        if (email !== this.user.email) {
          throw new NotFoundException();
        }

        return Promise.resolve(this.user);
      },

      notifyUser: () => Promise.resolve(),

      retrievePasswordReset: (id: string) => {
        const passwordResetIndex = this.passwordResets.findIndex(
          (passwordReset) => passwordReset.id === id,
        );

        if (passwordResetIndex === -1) {
          throw new NotFoundException();
        }

        return Promise.resolve(this.passwordResets[passwordResetIndex]!);
      },

      createPasswordReset: ({ id: userId }: User) => {
        const newPasswordReset: PasswordReset = {
          id: `${this.newPasswordResetIndex++}`,
          userId,
        };

        this.passwordResets.push(newPasswordReset);

        return Promise.resolve(newPasswordReset);
      },

      deletePasswordReset: (id: string) => {
        const passwordResetIndex = this.passwordResets.findIndex(
          (passwordReset) => passwordReset.id === id,
        );

        if (passwordResetIndex === -1) {
          throw new NotFoundException();
        }

        this.passwordResets.splice(passwordResetIndex, 1);

        return Promise.resolve();
      },

      resetUserPassword: (
        passwordReset: PasswordReset,
        newPassword: string,
      ) => {
        if (passwordReset.userId !== this.user.id) {
          throw new BadRequestException();
        }

        this.user.password = newPassword;

        return Promise.resolve();
      },
    },
  };

  private newPasswordResetIndex = 0;
}

interface User {
  readonly id: string;
  readonly email: string;
  password: string;
}

interface PasswordReset {
  readonly id: string;
  readonly userId: User['id'];
}
