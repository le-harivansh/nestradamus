import { format } from 'winston';

export default format((info) => {
  const optionalParams: unknown[] = info['metadata'].optionalParams ?? [];

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
      : info['metadata'].context ?? 'UNDEFINED';

  return info;
});
