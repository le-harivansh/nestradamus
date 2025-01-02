import { Controller, Delete, Get, Patch, Post } from '@nestjs/common';

import { RequiresPermission } from '../permissions.decorator';

export const BASE_ROUTE = 'authorization';

@Controller(BASE_ROUTE)
export class AuthorizationController {
  @Get()
  @RequiresPermission('test:read:own')
  show() {
    // intentionally left blank...
  }

  @Get('others')
  @RequiresPermission('test:read:others')
  list() {
    // intentionally left blank...
  }

  @Post()
  @RequiresPermission('test:create')
  create() {
    // intentionally left blank...
  }

  @Patch('/creator/:creatorId')
  @RequiresPermission(['test:update', { taskCreatorId: 'creatorId' }])
  update() {
    // intentionally left blank...
  }

  /**
   * This test route does not (AND should not) have the authentication middleware applied to it.
   */
  @Delete()
  @RequiresPermission('test:delete:own')
  delete() {
    // intentionally left blank...
  }
}
