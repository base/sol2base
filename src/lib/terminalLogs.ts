export type TerminalVariant = "system" | "command" | "success" | "error";

export interface LogEntry {
  id: string;
  variant: TerminalVariant;
  content: string;
  timestamp: string;
}

export const createLog = (variant: TerminalVariant, content: string): LogEntry => ({
  id: `${variant}-${Date.now()}-${Math.random()}`,
  variant,
  content,
  timestamp: new Date().toLocaleTimeString(),
});

