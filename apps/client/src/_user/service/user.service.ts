import { Injectable } from '@nestjs/common';
import { argon2id, hash } from 'argon2';
import { WithId } from 'mongodb';

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
}
