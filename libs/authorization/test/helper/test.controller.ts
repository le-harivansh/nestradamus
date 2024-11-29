import { Controller, Delete, Get, Patch, Post } from '@nestjs/common';

import { RequiresPermission } from './permissions.decorator';

export const TEST_BASE_ROUTE = 'test';

@Controller(TEST_BASE_ROUTE)
export class TestController {
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
   * This route should not have the authentication middleware applied to it.
   */
  @Delete()
  @RequiresPermission('test:delete:own')
  delete() {
    // intentionally left blank...
  }
}
