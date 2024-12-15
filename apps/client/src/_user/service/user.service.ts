import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { argon2id, hash } from 'argon2';
import { ObjectId } from 'mongodb';

import { UserRepository } from '../repository/user.repository';
import { User } from '../schema/user.schema';

@Injectable()
export class UserService {
  constructor(private readonly userRepository: UserRepository) {}

  count() {
    return this.userRepository.count();
  }

  list(skip: number, limit: number) {
    return this.userRepository.list(skip, limit);
  }

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

  async create({ password, ...otherUserData }: User) {
    const hashedPassword = await UserService.hashPassword(password);

    return this.userRepository.create({
      ...otherUserData,
      password: hashedPassword,
    });
  }

  async update(id: ObjectId, { password, ...otherUserData }: Partial<User>) {
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

    return updatedUser;
  }

  async delete(id: ObjectId) {
    await this.userRepository.delete(id);
  }

  private static hashPassword(password: string) {
    return hash(password, { type: argon2id });
  }
}
