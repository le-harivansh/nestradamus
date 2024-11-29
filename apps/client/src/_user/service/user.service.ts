import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { argon2id, hash } from 'argon2';
import { ObjectId, WithId } from 'mongodb';

import { UserRepository } from '../repository/user.repository';
import { User } from '../schema/user.schema';

@Injectable()
export class UserService {
  constructor(private readonly userRepository: UserRepository) {}

  async findById(id: ObjectId) {
    const fetchedUser = await this.userRepository.findById(id);

    if (fetchedUser === null) {
      throw new NotFoundException(`Could not find the user with id: '${id}'.`);
    }

    return fetchedUser;
  }

  async findByEmail(email: string) {
    const fetchedUser = await this.userRepository.findByEmail(email);

    if (fetchedUser === null) {
      throw new NotFoundException(
        `Could not find the user with e-mail: '${email}'.`,
      );
    }

    return fetchedUser;
  }

  async create({
    password,
    ...otherUserData
  }: User): Promise<Omit<WithId<User>, 'password'>> {
    const hashedPassword = await UserService.hashPassword(password);

    const { acknowledged, insertedId: newUserId } =
      await this.userRepository.create({
        ...otherUserData,
        password: hashedPassword,
      });

    if (!acknowledged) {
      throw new InternalServerErrorException(
        `Could not create user: ${JSON.stringify({ ...otherUserData, password, hashedPassword })}`,
      );
    }

    return {
      _id: newUserId,
      ...otherUserData,
    };
  }

  async update(
    id: ObjectId,
    { password, ...otherUserData }: Partial<User>,
  ): Promise<Omit<WithId<User>, 'password'>> {
    const hashedPassword = password
      ? await UserService.hashPassword(password)
      : null;

    const updatedUser = await this.userRepository.update(id, {
      ...otherUserData,
      ...(hashedPassword === null ? {} : { password: hashedPassword }),
    });

    if (updatedUser === null) {
      throw new InternalServerErrorException(
        `Could not update user with id: '${id}' & data: ${JSON.stringify({ ...otherUserData, password, hashedPassword })}`,
      );
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _, ...updatedUserData } = updatedUser;

    return updatedUserData;
  }

  private static hashPassword(password: string) {
    return hash(password, { type: argon2id });
  }
}
