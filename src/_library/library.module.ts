import { Module } from '@nestjs/common';

import { IsUniqueValidatorConstraint } from './validator/is-unique.validator';

@Module({
  providers: [IsUniqueValidatorConstraint],
})
export class LibraryModule {}
