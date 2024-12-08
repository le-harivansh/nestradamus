import { Inject, Injectable } from '@nestjs/common';
import {
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { Db } from 'mongodb';
import { z } from 'zod';

import { DATABASE } from '../../constant';
import { Constraints } from './constraints.interface';

@ValidatorConstraint({ async: true })
@Injectable()
export class ExistenceValidatorConstraint
  implements ValidatorConstraintInterface
{
  constructor(@Inject(DATABASE) private readonly database: Db) {}

  async validate(
    value: unknown,
    { constraints }: ValidationArguments,
  ): Promise<boolean> {
    const { collectionName, fieldName, inverseResult } =
      ExistenceValidatorConstraint.validateConstraints(constraints);

    const matchingDocumentsCount = await this.database
      .collection(collectionName)
      .countDocuments({ [fieldName]: value });

    return Boolean(
      inverseResult ? !matchingDocumentsCount : matchingDocumentsCount,
    );
  }

  defaultMessage({ value, constraints }: ValidationArguments): string {
    const { collectionName, fieldName, inverseResult } =
      ExistenceValidatorConstraint.validateConstraints(constraints);

    return `'${value}' ${fieldName} ${inverseResult ? 'exists' : 'does not exist'} in collection ${collectionName}.`;
  }

  private static validateConstraints(constraints: unknown[]): Constraints {
    const validationSchema = z.tuple([
      z.string().min(1),
      z.string().min(1),
      z.boolean(),
    ]);

    const [collectionName, fieldName, inverseResult] =
      validationSchema.parse(constraints);

    return {
      collectionName,
      fieldName,
      inverseResult,
    };
  }
}
