import { Controller, Delete, Get, Patch } from '@nestjs/common';

import { RequiresPermission } from '../permissions.decorator';

export const BASE_ROUTE = 'conditional-authorization';

@Controller(BASE_ROUTE)
export class ConditionalAuthorizationController {
  @Get()
  @RequiresPermission({
    and: ['test:list', { or: ['test:read:own', 'test:read:others'] }],
  })
  list() {
    // intentionally left blank...
  }

  @Patch('/creator/:creatorId')
  @RequiresPermission({
    and: [['test:update', { taskCreatorId: 'creatorId' }], 'test:list'],
  })
  update() {
    // intentionally left blank...
  }

  @Delete()
  @RequiresPermission({ and: ['test:delete:own', 'test:list'] })
  delete() {
    // intentionally left blank...
  }
}
