import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

import { Guard } from '../constant';

@Injectable()
export class RequiresCredentials extends AuthGuard(Guard.LOCAL) {}
