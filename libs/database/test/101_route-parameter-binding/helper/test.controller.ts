import { Controller, Get, Param } from '@nestjs/common';
import { WithId } from 'mongodb';

import { ROUTES } from './constant';
import { Entity } from './decorator';
import { User } from './user.entity';

@Controller()
export class TestController {
  @Get(`${ROUTES.ID.IMPLICIT}/:id`)
  implicitIdResolution(@Param('id', Entity(User)) user: WithId<User>) {
    return user;
  }

  @Get(`${ROUTES.ID.EXPLICIT}/:id`)
  explicitIdResolution(@Param('id', Entity(User, '_id')) user: WithId<User>) {
    return user;
  }

  @Get(`${ROUTES.USERNAME.IMPLICIT}/:username`)
  implicitFieldResolution(@Param('username', Entity(User)) user: WithId<User>) {
    return user;
  }

  @Get(`${ROUTES.USERNAME.EXPLICIT}/:username`)
  explicitFieldResolution(
    @Param('username', Entity(User, 'username')) user: WithId<User>,
  ) {
    return user;
  }
}
