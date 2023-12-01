import {
  ClassSerializerInterceptor,
  PlainLiteralObject,
  Type,
} from '@nestjs/common';
import { ClassTransformOptions, plainToClass } from 'class-transformer';
import { Document, Schema } from 'mongoose';

export function SerializeDocumentsHavingSchema<
  S extends Schema,
  T extends Type,
>(schema: S, serializerClass: T): typeof ClassSerializerInterceptor {
  return class Interceptor extends ClassSerializerInterceptor {
    override serialize(
      response: PlainLiteralObject | PlainLiteralObject[],
      options: ClassTransformOptions,
    ) {
      return super.serialize(this.transformResponseToClass(response), options);
    }

    private transformResponseToClass(
      response: PlainLiteralObject | PlainLiteralObject[],
    ): (PlainLiteralObject | T) | (PlainLiteralObject | T)[] {
      if (Array.isArray(response)) {
        return response.map(this.convertPlainObjectToClass);
      }

      return this.convertPlainObjectToClass(response);
    }

    private convertPlainObjectToClass(
      object: PlainLiteralObject,
    ): PlainLiteralObject | T {
      return object instanceof Document && object.schema === schema
        ? plainToClass(serializerClass, object.toObject(), {
            excludeExtraneousValues: true,
          })
        : object;
    }
  };
}
