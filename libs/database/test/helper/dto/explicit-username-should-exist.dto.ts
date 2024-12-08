import { User } from '../user.model';
import { ShouldExist } from '../validator';

export class ExplicitUsernameShouldExistDto {
  @ShouldExist(User, 'username')
  readonly username!: string;
}
