import { format } from 'winston';

export default function () {
  return format.printf(
    ({
      level,
      message,
      metadata: {
        application,
        context,
        ms,
        timestamp,
        stringifiedParsedOptionalParams: additionalData = '',
      },
    }) =>
      `${level} [${application}] ${timestamp} - [${context}] ${message} ${additionalData} (${ms})`,
  );
}
