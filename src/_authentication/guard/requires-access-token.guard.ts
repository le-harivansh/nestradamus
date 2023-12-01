import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

import { Guard } from '../constant';

@Injectable()
export class RequiresAccessToken extends AuthGuard(Guard.ACCESS_TOKEN) {}
