import { Injectable } from '@nestjs/common';
import {
  ValidationArguments,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  registerDecorator,
} from 'class-validator';

import { UserService } from '../service/user.service';

@Injectable()
@ValidatorConstraint({ async: true })
export class UsernameIsUniqueValidatorConstraint
  implements ValidatorConstraintInterface
{
  constructor(private readonly userService: UserService) {}

  async validate(username: string): Promise<boolean> {
    return !(await this.userService.findByUsername(username));
  }

  defaultMessage({ property, value }: ValidationArguments): string {
    return `The ${property} '${value}' already exists.`;
  }
}

export default function UsernameIsUnique(
  validationOptions?: ValidationOptions,
) {
  return (object: unknown, propertyName: string) =>
    registerDecorator({
      target: object.constructor,
      propertyName,
      async: true,
      options: validationOptions,
      validator: UsernameIsUniqueValidatorConstraint,
    });
}
