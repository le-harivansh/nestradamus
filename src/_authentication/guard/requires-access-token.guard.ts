import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

import { Guard } from '../helper';

@Injectable()
export class RequiresAccessToken extends AuthGuard(Guard.ACCESS_TOKEN) {}
