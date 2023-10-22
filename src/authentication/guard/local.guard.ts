import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

import { Guard } from '../helpers';

@Injectable()
export class RequiresCredentials extends AuthGuard(Guard.LOCAL) {}
