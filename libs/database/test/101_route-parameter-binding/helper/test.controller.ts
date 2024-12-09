import { Controller, Get, Param } from '@nestjs/common';
import { WithId } from 'mongodb';

import { ROUTES } from './constant';
import { Model } from './decorator';
import { User } from './user.model';

@Controller()
export class TestController {
  @Get(`${ROUTES.ID.IMPLICIT}/:id`)
  implicitIdResolution(@Param('id', Model(User)) user: WithId<User>) {
    return user;
  }

  @Get(`${ROUTES.ID.EXPLICIT}/:id`)
  explicitIdResolution(@Param('id', Model(User, '_id')) user: WithId<User>) {
    return user;
  }

  @Get(`${ROUTES.USERNAME.IMPLICIT}/:username`)
  implicitFieldResolution(@Param('username', Model(User)) user: WithId<User>) {
    return user;
  }

  @Get(`${ROUTES.USERNAME.EXPLICIT}/:username`)
  explicitFieldResolution(
    @Param('username', Model(User, 'username')) user: WithId<User>,
  ) {
    return user;
  }
}
