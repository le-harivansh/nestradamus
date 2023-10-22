import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

import { Guard } from '../helpers';

@Injectable()
export class RequiresAccessToken extends AuthGuard(Guard.ACCESS_TOKEN) {}
