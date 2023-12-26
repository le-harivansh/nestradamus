import { Type } from '@nestjs/common';
import { Schema, model } from 'mongoose';

/**
 * A simple helper function to create a new document.
 *
 * Note: The generic type `T` **SHOULD** be specified.
 */
export function newDocument<T>(
  rawClass: Type<T>,
  schema: Schema<T>,
  documentData: T,
) {
  const mongooseModel = model(rawClass.name, schema);

  return new mongooseModel(documentData);
}
