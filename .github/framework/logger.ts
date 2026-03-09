export type LogLevel = "info" | "error";

const formatMessage = (level: LogLevel, message: string): string => {
  return `[${new Date().toISOString()}] [${level.toUpperCase()}] ${message}`;
};

const writeLine = (level: LogLevel, message: string): void => {
  const line = `${formatMessage(level, message)}\n`;
  if (level === "error") {
    process.stderr.write(line);
    return;
  }

  process.stdout.write(line);
};

export const logInfo = (message: string): void => {
  writeLine("info", message);
};

export const logError = (message: string): void => {
  writeLine("error", message);
};
