import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

import { Guard } from '../constant';

@Injectable()
export class RequiresRefreshToken extends AuthGuard(Guard.REFRESH_TOKEN) {}
