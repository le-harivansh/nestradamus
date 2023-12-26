import { plainToClass } from 'class-transformer';
import { Document } from 'mongoose';
import { format } from 'winston';

import { AdministratorSchema } from '@/_administration/_administrator/schema/administrator.schema';
import { AdministratorTransformer } from '@/_administration/_administrator/serializer/administrator.transformer';
import { OtpSchema } from '@/_library/_otp/schema/otp.schema';
import { OtpTransformer } from '@/_library/_otp/serializer/otp.transformer';
import { UserSchema } from '@/_user/_user/schema/user.schema';
import { UserTransformer } from '@/_user/_user/serializer/user.transformer';

export default format((info) => {
  info['metadata'].parsedOptionalParams = parseOptionalParameters(
    info['metadata'].optionalParams,
  );

  if (info['metadata'].parsedOptionalParams.length) {
    info['metadata'].stringifiedParsedOptionalParams = JSON.stringify(
      info['metadata'].parsedOptionalParams,
    );
  }

  return info;
});

function parseOptionalParameters(optionalParameters: unknown[]): unknown[] {
  const sensitivePropertiesToOmitIfParameterIsAnObject = ['otp'];

  return optionalParameters.map((parameter) =>
    transformParameter(parameter, {
      sensitivePropertiesToOmitIfParameterIsAnObject,
    }),
  );
}

export function transformParameter(
  parameter: unknown,
  options: {
    sensitivePropertiesToOmitIfParameterIsAnObject: string[];
  },
): unknown {
  if (parameter instanceof Document) {
    switch (parameter.schema) {
      case UserSchema:
        return plainToClass(UserTransformer, parameter.toObject(), {
          excludeExtraneousValues: true,
        });

      case AdministratorSchema:
        return plainToClass(AdministratorTransformer, parameter.toObject(), {
          excludeExtraneousValues: true,
        });

      case OtpSchema:
        return plainToClass(OtpTransformer, parameter.toObject(), {
          excludeExtraneousValues: true,
        });

      /**
       * Add cases for other document schemas that are logged - here.
       */

      default:
        return parameter.toObject();
    }
  } else if (Array.isArray(parameter)) {
    return parameter.map((parameter) => transformParameter(parameter, options));
  } else if (typeof parameter === 'object' && parameter !== null) {
    return omitPropertiesFromAndParse(
      parameter,
      options.sensitivePropertiesToOmitIfParameterIsAnObject,
      (parameter) => transformParameter(parameter, options),
    );
  }

  return parameter;
}

export function omitPropertiesFromAndParse(
  object: object,
  propertiesToOmit: string[],
  valueParser: (value: unknown) => unknown,
) {
  return Object.entries(object)
    .map(([property, value]) => {
      if (propertiesToOmit.includes(property)) {
        return {};
      }

      return { [property]: valueParser(value) };
    })
    .reduce((previous, current) => ({ ...previous, ...current }), {});
}
