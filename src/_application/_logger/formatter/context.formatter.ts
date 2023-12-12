import { InternalServerErrorException } from '@nestjs/common';
import { format } from 'winston';

export default format((info) => {
  const optionalParams: unknown[] = info['metadata'].optionalParams;

  info['metadata'].context =
    optionalParams.length === 1 &&
    typeof optionalParams[0] === 'string' &&
    [
      'NestFactory',
      'InstanceLoader',
      'RoutesResolver',
      'RouterExplorer',
      'NestApplication',
    ].includes(optionalParams[0])
      ? (optionalParams.shift() as string)
      : info['metadata'].context;

  if (info['metadata'].context === undefined) {
    throw new InternalServerErrorException(
      'A context should be defined for the logger.',
    );
  }

  return info;
});
