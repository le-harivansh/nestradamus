import { User } from '../user.model';
import { ShouldNotExist } from '../validator';

export class ImplicitUsernameShouldNotExistDto {
  @ShouldNotExist(User)
  readonly username!: string;
}
