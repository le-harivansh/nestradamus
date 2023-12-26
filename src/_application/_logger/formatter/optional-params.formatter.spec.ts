import { Schema, SchemaFactory } from '@nestjs/mongoose';

import { Otp, OtpSchema } from '@/_library/_otp/schema/otp.schema';
import { newDocument } from '@/_library/test.helper';
import { User, UserSchema } from '@/_user/_user/schema/user.schema';

import {
  omitPropertiesFromAndParse,
  transformParameter,
} from './optional-params.formatter';

describe(omitPropertiesFromAndParse.name, () => {
  it('omits any properties from the specified value', () => {
    const object = {
      one: 1,
      two: 'two',
      three: true,
    };
    const propertiesToOmit = ['two'];

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { two, ...expectedResult } = object;

    expect(
      omitPropertiesFromAndParse(object, propertiesToOmit, (a) => a),
    ).toStrictEqual(expectedResult);
  });

  it('passes all the returned values through the specified `valueParser`', () => {
    expect(
      omitPropertiesFromAndParse(
        { eight: 8, nine: 9, ten: 10 },
        ['nine'],
        (a) => 2 * (a as number),
      ),
    ).toStrictEqual({
      eight: 16,
      ten: 20,
    });
  });
});

describe(transformParameter.name, () => {
  const defaultOptions = {
    sensitivePropertiesToOmitIfParameterIsAnObject: [],
  };

  it.each([{ value: 1 }, { value: 'two' }, { value: false }])(
    'returns the value as-is if it is a literal (value: $value)',
    ({ value }) => {
      expect(transformParameter(value, defaultOptions)).toBe(value);
    },
  );

  it('excludes the `password` property if a `UserDocument` is passed-in as a parameter', () => {
    const user = newDocument<User>(User, UserSchema, {
      username: 'user@email.com',
      password: 'P@ssw0rd',
    });

    expect(transformParameter(user, defaultOptions)).toEqual({
      id: user._id.toString(),
      username: user.get('username'),
    });
  });

  it('excludes the `password` property if an `OtpDocument` is passed-in as a parameter', () => {
    const otp = newDocument<Otp>(Otp, OtpSchema, {
      type: 'otp.type',
      destination: 'user@email.com',
      password: '123456',
      expiresAt: new Date(),
    });

    expect(transformParameter(otp, defaultOptions)).toEqual({
      id: otp._id.toString(),
      type: 'otp.type',
      destination: 'user@email.com',
      expiresAt: expect.any(Date),
    });
  });

  it('calls the `toObject` method if an unrecognized mongoose document is passed-in as a parameter', () => {
    @Schema()
    class Person {
      name!: string;

      age!: number;
    }

    const PersonSchema = SchemaFactory.createForClass(Person);

    const personDocument = newDocument<Person>(Person, PersonSchema, {
      name: 'A Person',
      age: 99,
    });

    expect(transformParameter(personDocument, defaultOptions)).toStrictEqual(
      personDocument.toObject(),
    );
  });

  it('recursively calls itself if the passed-in parameter is an array', () => {
    const parameter = [
      newDocument<User>(User, UserSchema, {
        username: 'user-1@email.com',
        password: 'P@ssw0rd',
      }),
      newDocument<User>(User, UserSchema, {
        username: 'user-2@email.com',
        password: 'P@ssw0rd',
      }),
      newDocument<User>(User, UserSchema, {
        username: 'user-3@email.com',
        password: 'P@ssw0rd',
      }),
    ];

    expect(transformParameter(parameter, defaultOptions)).toEqual(
      parameter.map((parameter) => ({
        id: parameter._id.toString(),
        username: parameter.get('username'),
      })),
    );
  });

  it('recursively omits any specified sensitive properties if the passed-in parameter is an object', () => {
    const options = {
      sensitivePropertiesToOmitIfParameterIsAnObject: ['secretCode'],
    };

    const parameter = {
      id: '492034985',
      email: 'user@email.com',
      secretCode: 'should not be shown',
      metadata: {
        type: 'some-type',
        secretCode: 'another secret-code that should not be shown',
      },
    };

    expect(transformParameter(parameter, options)).toStrictEqual({
      id: '492034985',
      email: 'user@email.com',
      metadata: {
        type: 'some-type',
      },
    });
  });
});
