import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { HydratedDocument } from 'mongoose';

import { RequiresAdministratorAccessToken } from '@/_administration/_authentication/guard/requires-administrator-access-token.guard';
import { HOST } from '@/_administration/constant';
import { WinstonLoggerService } from '@/_application/_logger/service/winston-logger.service';
import { SerializeDocumentsHavingSchema } from '@/_library/interceptor/mongoose-document-serializer.interceptor';

import { AuthenticatedAdministrator } from '../decorator/administrator.decorator';
import { UpdateAdministratorDto } from '../dto/update-administrator.dto';
import {
  Administrator,
  AdministratorSchema,
} from '../schema/administrator.schema';
import { AdministratorTransformer } from '../serializer/administrator.transformer';
import { AdministratorService } from '../service/administrator.service';

@Controller({ host: HOST, path: 'me' })
@UseGuards(RequiresAdministratorAccessToken)
export class AdministratorController {
  constructor(
    private readonly administratorService: AdministratorService,
    private readonly loggerService: WinstonLoggerService,
  ) {
    this.loggerService.setContext(AdministratorController.name);
  }

  @Get()
  @UseInterceptors(
    SerializeDocumentsHavingSchema(
      AdministratorSchema,
      AdministratorTransformer,
    ),
  )
  get(
    @AuthenticatedAdministrator()
    administrator: HydratedDocument<Administrator>,
  ): HydratedDocument<Administrator> {
    this.loggerService.log(
      'Request to get authenticated administrator',
      administrator,
    );

    return administrator;
  }

  @Patch()
  @UseInterceptors(
    SerializeDocumentsHavingSchema(
      AdministratorSchema,
      AdministratorTransformer,
    ),
  )
  async update(
    @AuthenticatedAdministrator()
    administrator: HydratedDocument<Administrator>,
    @Body() updateAdministratorDto: UpdateAdministratorDto,
  ): Promise<HydratedDocument<Administrator>> {
    this.loggerService.log('Request to update administrator', {
      administrator,
      data: updateAdministratorDto,
    });

    const administratorUpdateData: Record<string, unknown> = {
      ...updateAdministratorDto,
    };

    /**
     * Here, we check if an 'email' property exists on the DTO, and if so,
     * it is renamed to 'username', and passed to the service.
     */
    if ('email' in administratorUpdateData) {
      administratorUpdateData['username'] = administratorUpdateData['email'];

      delete administratorUpdateData['email'];
    }

    return this.administratorService.update(
      administrator,
      administratorUpdateData,
    );
  }

  @Delete()
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(
    @AuthenticatedAdministrator()
    administrator: HydratedDocument<Administrator>,
  ): Promise<void> {
    this.loggerService.log('Request to delete administrator', administrator);

    await this.administratorService.delete(administrator._id);
  }
}
