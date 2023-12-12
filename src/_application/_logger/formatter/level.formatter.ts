import { format } from 'winston';

export default format((info) => {
  info.level = info.level.toUpperCase();

  return info;
});
