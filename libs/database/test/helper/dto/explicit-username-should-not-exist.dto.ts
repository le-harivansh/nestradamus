import { User } from '../user.model';
import { ShouldNotExist } from '../validator';

export class ExplicitUsernameShouldNotExistDto {
  @ShouldNotExist(User, 'username')
  readonly username!: string;
}
