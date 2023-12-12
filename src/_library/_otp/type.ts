/**
 * This module exports the different OTP contexts, and their associated TTL,
 * used across the application.
 */

export const OtpType = {
  userRegistration: { name: 'user.registration', ttlSeconds: 5 * 60 } as const,
  userForgotPassword: {
    name: 'user.forgot-password',
    ttlSeconds: 5 * 60,
  } as const,
} as const;

export type OtpTypeName = {
  [K in keyof typeof OtpType]: (typeof OtpType)[K]['name'];
}[keyof typeof OtpType];
