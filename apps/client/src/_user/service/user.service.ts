import { Injectable, NotFoundException } from '@nestjs/common';
import { argon2id, hash } from 'argon2';
import { ObjectId, WithId } from 'mongodb';

import { UserRepository } from '../repository/user.repository';
import { User } from '../schema/user.schema';

@Injectable()
export class UserService {
  constructor(private readonly userRepository: UserRepository) {}

  async createUser(userData: User): Promise<Omit<WithId<User>, 'password'>> {
    const { password, ...otherUserData } = userData;

    // hash password
    const hashedPassword = await hash(password, { type: argon2id });

    const newUserId = (
      await this.userRepository.create({
        ...otherUserData,
        password: hashedPassword,
      })
    ).insertedId;

    return {
      _id: newUserId,
      ...otherUserData,
    };
  }

  async findUserById(id: string): Promise<WithId<User>> {
    const fetchedUser = await this.userRepository.findById(new ObjectId(id));

    if (fetchedUser === null) {
      throw new NotFoundException(`Could not find the user with id: ${id}.`);
    }

    return fetchedUser;
  }

  async findUserByEmail(email: string): Promise<WithId<User>> {
    const fetchedUser = await this.userRepository.findByEmail(email);

    if (fetchedUser === null) {
      throw new NotFoundException(
        `Could not find the user with e-mail: ${email}.`,
      );
    }

    return fetchedUser;
  }
}
