import { InternalServerErrorException } from '@nestjs/common';
import { ValidationArguments } from 'class-validator';
import { Connection } from 'mongoose';

import { ConnectionName } from '@/_application/_database/helper';

import { IsUniqueValidatorConstraint } from './is-unique.validator';

describe(IsUniqueValidatorConstraint.name, () => {
  const valueToFind = "value-to-compare-existing-documents' field with";
  const [modelName, fieldUnderValidation, connectionName] = [
    'model-name',
    'field-under-validation',
    ConnectionName.DEFAULT,
  ];

  const defaultConnection = {
    _count: 0,

    model: jest.fn(function () {
      return this;
    }),
    find: jest.fn(function (constraints: Record<string, unknown>) {
      if (
        fieldUnderValidation in constraints &&
        constraints[fieldUnderValidation] === valueToFind
      ) {
        this._count = 1;
      }

      return this;
    }),
    count: jest.fn(function () {
      return this;
    }),
    exec: jest.fn(async function () {
      return this._count;
    }),
  };

  const validator = new IsUniqueValidatorConstraint(
    defaultConnection as unknown as Connection,
  );

  afterEach(() => {
    defaultConnection._count = 0;
    jest.clearAllMocks();
  });

  it('has only 1 connection in the `connections` map', () => {
    expect(validator['connections'].size).toBe(1);
  });

  describe('validate', () => {
    it('throws an `InternalServerErrorException` if the specified connection could not be retrieved', async () => {
      expect(
        validator.validate(valueToFind, {
          constraints: [
            modelName,
            fieldUnderValidation,
            'WRONG_CONNECTION_NAME',
          ],
        } as unknown as ValidationArguments),
      ).rejects.toThrow(InternalServerErrorException);
    });

    it('calls the appropriate methods with the correct arguments on the `Connection` object', async () => {
      await validator.validate(valueToFind, {
        constraints: [modelName, fieldUnderValidation, connectionName],
      } as unknown as ValidationArguments);

      expect(defaultConnection.model).toHaveBeenCalledTimes(1);
      expect(defaultConnection.model).toHaveBeenCalledWith(modelName);

      expect(defaultConnection.find).toHaveBeenCalledTimes(1);
      expect(
        (defaultConnection.find.mock.calls[0] as unknown[])[0],
      ).toStrictEqual({
        [fieldUnderValidation]: valueToFind,
      });

      expect(defaultConnection.count).toHaveBeenCalledTimes(1);

      expect(defaultConnection.exec).toHaveBeenCalledTimes(1);
    });

    it('returns `false` if the document-count returned is not `0`', async () => {
      const isUnique = await validator.validate(valueToFind, {
        constraints: [modelName, fieldUnderValidation, connectionName],
      } as unknown as ValidationArguments);

      expect(isUnique).toBe(false);
    });

    it('returns `true` if the document-count returned is `0`', async () => {
      const isUnique = await validator.validate('another-value', {
        constraints: [modelName, fieldUnderValidation, connectionName],
      } as unknown as ValidationArguments);

      expect(isUnique).toBe(true);
    });
  });
});
