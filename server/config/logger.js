import winston from 'winston';

const isProd = process.env.NODE_ENV === 'production';

const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'test' ? 'error' : isProd ? 'http' : 'debug',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    isProd
      ? winston.format.json()
      : winston.format.combine(
          winston.format.colorize(),
          winston.format.printf(({ timestamp, level, message }) => `${timestamp} ${level}: ${message}`)
        )
  ),
  transports: [new winston.transports.Console()],
});

if (isProd) {
  logger.add(new winston.transports.File({ filename: 'logs/error.log', level: 'error' }));
}

export default logger;
