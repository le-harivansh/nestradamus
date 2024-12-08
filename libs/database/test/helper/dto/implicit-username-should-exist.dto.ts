import { User } from '../user.model';
import { ShouldExist } from '../validator';

export class ImplicitUsernameShouldExistDto {
  @ShouldExist(User)
  readonly username!: string;
}
