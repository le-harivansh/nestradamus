import { PlainLiteralObject } from '@nestjs/common';
import { Schema, SchemaFactory } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { Exclude, Expose } from 'class-transformer';

import { newDocument } from '../helper';
import { SerializeDocumentsHavingSchema } from './mongoose-document-serializer.interceptor';

@Schema()
class Person {
  @Expose()
  name!: string;

  @Exclude()
  age!: number;
}

const PersonSchema = SchemaFactory.createForClass(Person);

const personData = {
  name: 'One Two',
  age: 1020,
};

describe(SerializeDocumentsHavingSchema.name, () => {
  const TestModelMongooseDocumentSerializerInterceptor =
    SerializeDocumentsHavingSchema(PersonSchema, Person);

  let interceptor: any;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TestModelMongooseDocumentSerializerInterceptor],
    }).compile();

    interceptor = module.get(TestModelMongooseDocumentSerializerInterceptor);
  });

  describe('convertPlainObjectToClass', () => {
    it('returns a new model instance if the passed-in object IS an instance of `mongoose.Document`', () => {
      const person = newDocument<Person>(Person, PersonSchema, personData);

      expect(interceptor['convertPlainObjectToClass'](person)).toBeInstanceOf(
        Person,
      );
    });

    it('returns the passed-in object if it IS NOT an instance of `mongoose.Document`', () => {
      expect(
        interceptor['convertPlainObjectToClass'](personData),
      ).toStrictEqual(personData);
    });
  });

  describe('transformResponseToClass', () => {
    const convertPlainObjectToClassSpyReturnValue = Symbol(
      'convertPlainObjecttoClass',
    ) as unknown as PlainLiteralObject;

    let convertPlainObjectToClassSpy: jest.SpyInstance;

    beforeEach(() => {
      convertPlainObjectToClassSpy = jest
        .spyOn(interceptor, 'convertPlainObjectToClass')
        .mockReturnValue(convertPlainObjectToClassSpyReturnValue);
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('calls `convertPlainObjectToClass` on the passed-in argument if it IS NOT an array', () => {
      const response = newDocument<Person>(Person, PersonSchema, personData);
      const transformedResponse =
        interceptor['transformResponseToClass'](response);

      expect(convertPlainObjectToClassSpy).toHaveBeenCalledTimes(1);
      expect(convertPlainObjectToClassSpy).toHaveBeenCalledWith(response);
      expect(transformedResponse).toBe(convertPlainObjectToClassSpyReturnValue);
    });

    it('calls `convertPlainObjectToClass` on every item within the passed-in argument if it IS an array', () => {
      const response = [
        newDocument<Person>(Person, PersonSchema, personData),
        newDocument<Person>(Person, PersonSchema, personData),
        newDocument<Person>(Person, PersonSchema, personData),
      ];
      const transformedResponse =
        interceptor['transformResponseToClass'](response);

      expect(convertPlainObjectToClassSpy).toHaveBeenCalledTimes(3);

      for (let i = 0; i < convertPlainObjectToClassSpy.mock.calls.length; i++) {
        expect(convertPlainObjectToClassSpy.mock.calls[i][0]).toStrictEqual(
          response[i],
        );
      }

      expect(transformedResponse).toStrictEqual([
        convertPlainObjectToClassSpyReturnValue,
        convertPlainObjectToClassSpyReturnValue,
        convertPlainObjectToClassSpyReturnValue,
      ]);
    });
  });

  describe('serialize', () => {
    let transformResponseToClassSpy: jest.SpyInstance;

    beforeEach(() => {
      transformResponseToClassSpy = jest.spyOn(
        interceptor,
        'transformResponseToClass',
      );
    });

    afterEach(() => {
      jest.clearAllMocks();
    });

    it('calls `transformResponseToClass` on the passed-in argument', () => {
      const response = newDocument<Person>(Person, PersonSchema, personData);
      interceptor.serialize(response, {});

      expect(transformResponseToClassSpy).toHaveBeenCalledTimes(1);
      expect(transformResponseToClassSpy).toHaveBeenCalledWith(response);
    });
  });
});
