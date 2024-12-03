import { IsEmail } from 'class-validator';

export class UpdateUserEmailDto {
  // @todo: implement validator that checks for the existence of the passed-in email address in the database.
  @IsEmail()
  readonly email!: string;
}
