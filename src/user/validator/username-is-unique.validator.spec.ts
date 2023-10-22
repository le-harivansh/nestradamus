import { Test, TestingModule } from '@nestjs/testing';

import { UserService } from '../service/user.service';
import { UsernameIsUniqueValidatorConstraint } from './username-is-unique.validator';

describe(UsernameIsUniqueValidatorConstraint.name, () => {
  let validator: UsernameIsUniqueValidatorConstraint;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: UserService,
          useValue: {
            async findByUsername(username: string) {
              return {
                'existing-username': { username },
              }[username];
            },
          },
        },
        UsernameIsUniqueValidatorConstraint,
      ],
    }).compile();

    validator = module.get(UsernameIsUniqueValidatorConstraint);
  });

  describe('validate', () => {
    it('returns false if a user exists', () => {
      expect(validator.validate('existing-username')).resolves.toBe(false);
    });

    it('returns true if a user does not exist', () => {
      expect(validator.validate('nonexisting-username')).resolves.toBe(true);
    });
  });
});
