import { Test, TestingModule } from '@nestjs/testing';
import { ValidationArguments } from 'class-validator';
import { ObjectId } from 'mongodb';
import { ZodError } from 'zod';

import { DATABASE } from '../../constant';
import { ExistenceValidatorConstraint } from './existence.validator-constraint';

describe(ExistenceValidatorConstraint.name, () => {
  const countDocuments = jest.fn();
  const getCollection = jest.fn().mockReturnValue({ countDocuments });

  const database = { collection: getCollection };

  let existenceValidatorConstraint: ExistenceValidatorConstraint;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: DATABASE,
          useValue: database,
        },

        ExistenceValidatorConstraint,
      ],
    }).compile();

    existenceValidatorConstraint = module.get(ExistenceValidatorConstraint);
  });

  it('should be defined', () => {
    expect(existenceValidatorConstraint).toBeDefined();
  });

  describe(ExistenceValidatorConstraint.prototype.validate.name, () => {
    let validateConstraintsSpy: jest.SpyInstance;

    beforeAll(() => {
      validateConstraintsSpy = jest.spyOn(
        ExistenceValidatorConstraint as never,
        'validateConstraints',
      );
    });

    afterEach(() => {
      jest.clearAllMocks();
    });

    afterAll(() => {
      jest.restoreAllMocks();
    });

    it(`calls '${ExistenceValidatorConstraint.name}::${ExistenceValidatorConstraint['validateConstraints'].name} with the passed-in constraints`, async () => {
      const constraints = ['collectionName', 'fieldName', false] as const;

      await existenceValidatorConstraint.validate('', {
        constraints,
      } as unknown as ValidationArguments);

      expect(validateConstraintsSpy).toHaveBeenCalledTimes(1);
      expect(validateConstraintsSpy).toHaveBeenCalledWith(constraints);
    });

    it('queries the database with the specified collection-name, field-name, and field-value', async () => {
      const constraints = ['collectionName', 'fieldName', false] as const;
      const value = 'value';

      await existenceValidatorConstraint.validate(value, {
        constraints,
      } as unknown as ValidationArguments);

      expect(getCollection).toHaveBeenCalledTimes(1);
      expect(getCollection).toHaveBeenCalledWith(constraints[0]);

      expect(countDocuments).toHaveBeenCalledTimes(1);
      expect(countDocuments).toHaveBeenCalledWith({ [constraints[1]]: value });
    });

    it.each([
      { fieldName: '_id', fieldValue: new ObjectId().toString() },
      { fieldName: 'id', fieldValue: new ObjectId().toString() },
    ])(
      `transforms the field-value to an '${ObjectId.name}' if the field-name is '$fieldName'.`,
      async ({ fieldName, fieldValue }) => {
        const constraints = ['collectionName', fieldName, false] as const;

        await existenceValidatorConstraint.validate(fieldValue, {
          constraints,
        } as unknown as ValidationArguments);

        expect(countDocuments).toHaveBeenCalledWith({
          _id: expect.any(ObjectId),
        });
        expect(countDocuments.mock.calls[0][0]['_id']).toBeInstanceOf(ObjectId);
      },
    );

    it.each([
      { matchingDoumentsCount: 0, inverseResult: false, expectedResult: false }, // should exist
      { matchingDoumentsCount: 1, inverseResult: false, expectedResult: true }, // should exist

      { matchingDoumentsCount: 0, inverseResult: true, expectedResult: true }, // should NOT exist
      { matchingDoumentsCount: 1, inverseResult: true, expectedResult: false }, // should NOT exist
    ])(
      "returns '$expectedResult' when the matchingDocumentsCount == $matchingDocumentsCount and inverseResult == $inverseResult",
      async ({ matchingDoumentsCount, inverseResult, expectedResult }) => {
        countDocuments.mockResolvedValueOnce(matchingDoumentsCount);
        const constraints = [
          'collectionName',
          'fieldName',
          inverseResult,
        ] as const;

        await expect(
          existenceValidatorConstraint.validate('', {
            constraints,
          } as unknown as ValidationArguments),
        ).resolves.toBe(expectedResult);
      },
    );
  });

  describe(ExistenceValidatorConstraint['validateConstraints'].name, () => {
    it("returns a valid object implementing the Constraints' interface", () => {
      const constraints = ['collectionName', 'fieldName', false];

      const result =
        ExistenceValidatorConstraint['validateConstraints'](constraints);

      expect(result).toStrictEqual({
        collectionName: constraints[0],
        fieldName: constraints[1],
        inverseResult: constraints[2],
      });
    });

    it.each([
      { constraints: ['', 'fieldName', false] },
      { constraints: ['collectionName', '', false] },
      { constraints: ['collectionName', 'fieldName', undefined] },
    ])(
      `throws a '${ZodError.name}' if the provided constraints are invalid { constraints: $constraints }`,
      ({ constraints }) => {
        expect(() =>
          ExistenceValidatorConstraint['validateConstraints'](constraints),
        ).toThrow(ZodError);
      },
    );
  });
});
