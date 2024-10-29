import { BadRequestException, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { IsStrongPassword, validateOrReject } from 'class-validator';
import { ObjectId, WithId } from 'mongodb';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

import { MailService } from '@library/mail';
import { PasswordResetModule as PasswordResetLibraryModule } from '@library/password-reset';

import { ConfigurationService } from '../_configuration/service/configuration.service';
import { PASSWORD_CONSTRAINTS } from '../_user/constant';
import { User } from '../_user/schema/user.schema';
import { UserService } from '../_user/service/user.service';
import { UserModule } from '../_user/user.module';
import { FORGOT_PASSWORD_ROUTE, RESET_PASSWORD_ROUTE } from './constant';
import passwordResetConfiguration from './password-reset.config';
import { PasswordResetRepository } from './repository/password-reset.repository';
import {
  PasswordReset,
  PasswordResetSchema,
} from './schema/password-reset.schema';
import { PasswordResetService } from './service/password-reset.service';

@Module({
  imports: [
    ConfigModule.forFeature(passwordResetConfiguration),

    PasswordResetLibraryModule.forRootAsync({
      imports: [UserModule, PasswordResetModule],
      inject: [
        UserService,
        PasswordResetService,
        MailService,
        ConfigurationService,
      ],
      useFactory: (
        userService: UserService,
        passwordResetService: PasswordResetService,
        mailService: MailService,
        configurationService: ConfigurationService,
      ) => ({
        route: {
          forgotPassword: FORGOT_PASSWORD_ROUTE,
          resetPassword: RESET_PASSWORD_ROUTE,
        },

        callback: {
          resolveUser: (email: string) => userService.findUserByEmail(email),

          notifyUser: async (
            user: WithId<User>,
            passwordReset: WithId<PasswordReset>,
          ) => {
            const applicationName =
              configurationService.getOrThrow('application.name');
            const mailTemplate = (
              await readFile(
                join(__dirname, 'template/forgot-password.mjml.mustache'),
              )
            ).toString();

            // todo: this should be throttled to prevent abuse.
            await mailService
              .mail()
              .to(user.email)
              .subject(`Forgot your ${applicationName} password?`)
              .mjml(
                mailTemplate, // todo: style template & review message
                {
                  applicationName,
                  user,
                  passwordResetLink: `${configurationService.getOrThrow('application.frontendUrl')}/password-reset/${passwordReset._id}`,
                  currentYear: new Date().getFullYear(),
                },
              )
              .send();
          },

          retrievePasswordReset: (id: string) => {
            if (!ObjectId.isValid(id)) {
              throw new BadRequestException(
                `The provided password-reset record id: '${id}' - cannot be converted to an ObjectId.`,
              );
            }

            return passwordResetService.findPasswordResetRecordById(
              new ObjectId(id),
            );
          },

          createPasswordReset: ({ _id: userId }: WithId<User>) =>
            passwordResetService.createOrUpdatePasswordResetRecordForUser(
              userId,
            ),

          deletePasswordReset: (id: string) => {
            if (!ObjectId.isValid(id)) {
              throw new BadRequestException(
                `The provided password-reset record id: '${id}' - cannot be converted to an ObjectId.`,
              );
            }

            return passwordResetService.deletePasswordResetRecord(
              new ObjectId(id),
            );
          },

          resetUserPassword: async (
            {
              user: { _id: userId },
            }: Awaited<
              ReturnType<PasswordResetService['findPasswordResetRecordById']>
            >,
            newPassword: string,
          ) => {
            class Password {
              @IsStrongPassword({
                minLength: PASSWORD_CONSTRAINTS.MIN_LENGTH,
                minLowercase: PASSWORD_CONSTRAINTS.MIN_LOWERCASE,
                minUppercase: PASSWORD_CONSTRAINTS.MIN_UPPERCASE,
                minNumbers: PASSWORD_CONSTRAINTS.MIN_NUMBERS,
                minSymbols: PASSWORD_CONSTRAINTS.MIN_SYMBOLS,
              })
              readonly value: string;

              constructor(value: string) {
                this.value = value;
              }
            }

            try {
              await validateOrReject(new Password(newPassword));
            } catch (errors) {
              throw new BadRequestException(errors);
            }

            await userService.updateUser(userId, { password: newPassword });
          },
        },
      }),
    }),
  ],
  providers: [
    PasswordResetSchema,
    PasswordResetRepository,
    PasswordResetService,
  ],
  exports: [PasswordResetService],
})
export class PasswordResetModule {}
