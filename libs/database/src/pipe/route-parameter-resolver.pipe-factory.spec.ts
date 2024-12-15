import {
  ArgumentMetadata,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { Db, ObjectId } from 'mongodb';

import { routeParameterResolverPipeFactory } from './route-parameter-resolver.pipe-factory';

class User {
  readonly username!: string;
}

describe(routeParameterResolverPipeFactory.name, () => {
  const USER_COLLECTION_NAME = 'user-collection';

  const findOneDocument = jest.fn();
  const getCollection = jest
    .fn()
    .mockImplementation(() => ({ findOne: findOneDocument }));

  const database = { collection: getCollection } as unknown as Db;
  const entityCollectionMap = new Map([[User, USER_COLLECTION_NAME]]);

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('can initialize the route-parameter resolver-pipe', () => {
    const routeParameterResolverPipe = new (routeParameterResolverPipeFactory(
      entityCollectionMap,
    )(User, 'username'))(database);

    expect(routeParameterResolverPipe).toBeDefined();
  });

  describe('transform', () => {
    it(`throws an '${InternalServerErrorException.name}' if the specified entity is not in the provided entity-collection map`, async () => {
      const routeParameterResolverPipe = new (routeParameterResolverPipeFactory(
        entityCollectionMap,
      )({} as unknown as typeof User, 'username'))(database);

      await expect(() =>
        routeParameterResolverPipe.transform('', {} as ArgumentMetadata),
      ).rejects.toThrow(InternalServerErrorException);
    });

    it(`throws an '${InternalServerErrorException.name}' if both the field-name and the route-parameter key are unspecified`, async () => {
      const routeParameterResolverPipe = new (routeParameterResolverPipeFactory(
        entityCollectionMap,
      )(User))(database);

      await expect(() =>
        routeParameterResolverPipe.transform(
          '',
          {} as unknown as ArgumentMetadata,
        ),
      ).rejects.toThrow(InternalServerErrorException);
    });

    it("calls the database methods with the specified collection-name, the entity's field-name, and the resolved value from the request", async () => {
      const value = 'user@email.dev';

      findOneDocument.mockResolvedValueOnce({ username: value });

      const field = 'username';
      const routeParameterResolverPipe = new (routeParameterResolverPipeFactory(
        entityCollectionMap,
      )(User, field))(database);

      await routeParameterResolverPipe.transform(
        value,
        {} as unknown as ArgumentMetadata,
      );

      expect(getCollection).toHaveBeenCalledTimes(1);
      expect(getCollection).toHaveBeenCalledWith(USER_COLLECTION_NAME);

      expect(findOneDocument).toHaveBeenCalledTimes(1);
      expect(findOneDocument).toHaveBeenCalledWith({ [field]: value });
    });

    it('calls the database methods with the specified collection-name, the route-parameter key, and the resolved value from the request', async () => {
      const value = 'user@email.dev';

      findOneDocument.mockResolvedValueOnce({ username: value });

      const routeParameterKey = 'username';
      const routeParameterResolverPipe = new (routeParameterResolverPipeFactory(
        entityCollectionMap,
      )(User))(database);

      await routeParameterResolverPipe.transform(value, {
        data: routeParameterKey,
      } as unknown as ArgumentMetadata);

      expect(getCollection).toHaveBeenCalledTimes(1);
      expect(getCollection).toHaveBeenCalledWith(USER_COLLECTION_NAME);

      expect(findOneDocument).toHaveBeenCalledTimes(1);
      expect(findOneDocument).toHaveBeenCalledWith({
        [routeParameterKey]: value,
      });
    });

    it("queries '_id' if 'id' is passed as the (route-parameter key) decorator argument", async () => {
      findOneDocument.mockResolvedValueOnce({ username: 'user@email.dev' });

      const routeParameterKey = 'id';
      const routeParameterResolverPipe = new (routeParameterResolverPipeFactory(
        entityCollectionMap,
      )(User))(database);

      await routeParameterResolverPipe.transform(new ObjectId().toString(), {
        data: routeParameterKey,
      } as unknown as ArgumentMetadata);

      expect(findOneDocument).toHaveBeenCalledTimes(1);
      expect(
        Object.keys(findOneDocument.mock.calls[0][0]).includes('_id'),
      ).toBe(true);
    });

    it(`throws a '${NotFoundException.name}' if the entity resolves to 'null'`, async () => {
      findOneDocument.mockResolvedValueOnce(null);

      const routeParameterResolverPipe = new (routeParameterResolverPipeFactory(
        entityCollectionMap,
      )(User, 'username'))(database);

      await expect(() =>
        routeParameterResolverPipe.transform(
          '',
          {} as unknown as ArgumentMetadata,
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('returns the result of the database query', async () => {
      const user: User = { username: 'user@email.dev' };

      findOneDocument.mockResolvedValueOnce(user);

      const routeParameterResolverPipe = new (routeParameterResolverPipeFactory(
        entityCollectionMap,
      )(User, 'username'))(database);

      await expect(
        routeParameterResolverPipe.transform(
          user.username,
          {} as unknown as ArgumentMetadata,
        ),
      ).resolves.toStrictEqual(user);
    });
  });
});
