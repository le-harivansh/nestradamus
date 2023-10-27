import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

import { Guard } from '../helpers';

@Injectable()
export class RequiresRefreshToken extends AuthGuard(Guard.REFRESH_TOKEN) {}
