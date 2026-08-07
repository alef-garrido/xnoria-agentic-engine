import pino from "pino";

// Configuración de logger basada en entorno
const isProduction = process.env.NODE_ENV === "production";

/**
 * Logger estructurado para el dashboard (SERVER ONLY)
 * Formatea automáticamente como JSON en producción
 * Formatea bonito en desarrollo
 */
export const logger = pino({
  level: process.env.LOG_LEVEL || (isProduction ? "info" : "debug"),
  transport: isProduction
    ? undefined
    : {
        target: "pino-pretty",
        options: {
          colorize: true,
          translateTime: "SYS:standard",
          ignore: "pid,hostname",
        },
      },
  serializers: {
    req: pino.stdSerializers.req,
    res: pino.stdSerializers.res,
    err: pino.stdSerializers.err,
  },
});

// Alias para niveles comunes
export const log = logger;
export default logger;
