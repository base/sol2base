import type { ContractCallType } from './realBridgeImplementation';

export type ParsedCommand =
  | { type: 'empty' }
  | { type: 'help' }
  | { type: 'clear' }
  | { type: 'assets' }
  | { type: 'balance' }
  | { type: 'history' }
  | { type: 'error'; message: string }
  | { type: 'faucet'; asset: string }
  | { type: 'bridge'; payload: BridgeCommandPayload }
  | { type: 'bridgecall'; payload: BridgeCallCommandPayload };

export interface BridgeCommandPayload {
  amount: string;
  asset: string;
  destination: string;
  flags: BridgeCommandFlags;
}

export interface BridgeCommandFlags {
  tobase?: boolean;
  mint?: string;
  remote?: string;
  decimals?: number;
  callType?: ContractCallType;
  callTarget?: string;
  callValue?: string;
  callData?: string;
}

export interface BridgeCallCommandPayload {
  contract: string;
  functionName: string;
  args: string[];
  value?: string;
}

const FLAG_SPECS: Record<
  string,
  { type: 'boolean' | 'string' | 'number'; key: keyof BridgeCommandFlags }
> = {
  tobase: { type: 'boolean', key: 'tobase' },
  mint: { type: 'string', key: 'mint' },
  remote: { type: 'string', key: 'remote' },
  decimals: { type: 'number', key: 'decimals' },
  'call-type': { type: 'string', key: 'callType' },
  'call-target': { type: 'string', key: 'callTarget' },
  'call-value': { type: 'string', key: 'callValue' },
  'call-data': { type: 'string', key: 'callData' },
};

export function parseTerminalCommand(input: string): ParsedCommand {
  let tokens: string[];
  try {
    tokens = tokenize(input);
  } catch (error) {
    return {
      type: 'error',
      message:
        error instanceof Error ? error.message : 'Unable to parse command input.',
    };
  }
  if (tokens.length === 0) {
    return { type: 'empty' };
  }

  const [command, ...rest] = tokens;
  switch (command.toLowerCase()) {
    case 'help':
      return { type: 'help' };
    case 'clear':
      return { type: 'clear' };
    case 'assets':
      return { type: 'assets' };
    case 'balance':
      return { type: 'balance' };
    case 'history':
      return { type: 'history' };
    case 'faucet':
      return parseFaucet(rest);
    case 'bridge':
      return parseBridge(rest);
    case 'bridgecall':
      return parseBridgeCall(rest);
    default:
      return {
        type: 'error',
        message: `Unknown command "${command}". Type 'help' to see available commands.`,
      };
  }
}

function parseFaucet(args: string[]): ParsedCommand {
  if (args.length === 0) {
    return {
      type: 'error',
      message: "Usage: faucet <asset>. Example: faucet sol",
    };
  }

  return {
    type: 'faucet',
    asset: args[0].toLowerCase(),
  };
}

function parseBridge(args: string[]): ParsedCommand {
  if (args.length < 3) {
    return {
      type: 'error',
      message: "Usage: bridge <amount> <asset> <destination> [flags]",
    };
  }

  const [amountRaw, assetRaw, destination, ...flagTokens] = args;
  const amount = amountRaw.trim();
  const asset = assetRaw.trim().toLowerCase();

  if (!amount || !asset || !destination) {
    return {
      type: 'error',
      message: "Usage: bridge <amount> <asset> <destination> [flags]",
    };
  }

  try {
    const flags = parseFlags(flagTokens);
    return {
      type: 'bridge',
      payload: {
        amount,
        asset,
        destination,
        flags,
      },
    };
  } catch (error) {
    return {
      type: 'error',
      message:
        error instanceof Error
          ? error.message
          : 'Failed to parse bridge flags.',
    };
  }
}

function parseBridgeCall(args: string[]): ParsedCommand {
  if (args.length < 2) {
    return {
      type: 'error',
      message: "Usage: bridgecall <contract> <functionName> [--args ...] [--value <eth>]",
    };
  }

  const [contract, functionName, ...rest] = args;
  if (!/^0x[a-fA-F0-9]{40}$/.test(contract)) {
    return { type: 'error', message: 'Contract address must be a 0x-prefixed 20-byte hex string.' };
  }

  const payload: BridgeCallCommandPayload = {
    contract: contract.toLowerCase(),
    functionName,
    args: [],
  };

  let i = 0;
  while (i < rest.length) {
    const token = rest[i];
    if (!token.startsWith('--')) {
      return { type: 'error', message: `Unexpected token "${token}". Flags must start with "--".` };
    }

    const key = token.slice(2).toLowerCase();
    if (key === 'args') {
      i += 1;
      const collected: string[] = [];
      while (i < rest.length && !rest[i].startsWith('--')) {
        collected.push(rest[i]);
        i += 1;
      }
      payload.args = collected;
      continue;
    }

    if (key === 'value') {
      const value = rest[i + 1];
      if (!value) {
        return { type: 'error', message: 'Flag "--value" requires a numeric amount in ETH.' };
      }
      payload.value = value;
      i += 2;
      continue;
    }

    return { type: 'error', message: `Unknown bridgecall flag "--${key}".` };
  }

  return { type: 'bridgecall', payload };
}

function parseFlags(tokens: string[]): BridgeCommandFlags {
  const flags: BridgeCommandFlags = {};

  for (let i = 0; i < tokens.length; i += 1) {
    const token = tokens[i];
    if (!token.startsWith('--')) {
      throw new Error(`Unexpected token "${token}". Flags must start with "--".`);
    }

    const key = token.slice(2).toLowerCase();
    const spec = FLAG_SPECS[key];

    if (!spec) {
      throw new Error(`Unknown flag "--${key}".`);
    }

    if (spec.type === 'boolean') {
      flags[spec.key] = true as BridgeCommandFlags[typeof spec.key];
      continue;
    }

    const value = tokens[i + 1];
    if (!value) {
      throw new Error(`Flag "--${key}" requires a value.`);
    }

    i += 1;
    if (spec.type === 'number') {
      const parsed = Number(value);
      if (!Number.isFinite(parsed) || parsed < 0) {
        throw new Error(`Flag "--${key}" must be a positive number.`);
      }
      flags[spec.key] = parsed as BridgeCommandFlags[typeof spec.key];
    } else {
      if (spec.key === 'callType') {
        flags.callType = value.toLowerCase() as ContractCallType;
      } else {
        flags[spec.key] = value as BridgeCommandFlags[typeof spec.key];
      }
    }
  }

  if (flags.callType && !isValidCallType(flags.callType)) {
    throw new Error(
      `Invalid call type "${flags.callType}". Use call | delegatecall | create | create2.`
    );
  }

  return flags;
}

function tokenize(input: string): string[] {
  const tokens: string[] = [];
  let current = '';
  let quote: '"' | "'" | null = null;

  for (let i = 0; i < input.length; i += 1) {
    const char = input[i];
    if (quote) {
      if (char === quote) {
        tokens.push(current);
        current = '';
        quote = null;
      } else {
        current += char;
      }
      continue;
    }

    if (char === '"' || char === "'") {
      if (current.length > 0) {
        tokens.push(current);
        current = '';
      }
      quote = char;
      continue;
    }

    if (/\s/.test(char)) {
      if (current.length > 0) {
        tokens.push(current);
        current = '';
      }
      continue;
    }

    current += char;
  }

  if (quote) {
    throw new Error('Unterminated quote in command.');
  }

  if (current.length > 0) {
    tokens.push(current);
  }

  return tokens;
}

function isValidCallType(value: string): value is ContractCallType {
  const normalized = value.toLowerCase();
  return normalized === 'call'
    || normalized === 'delegatecall'
    || normalized === 'create'
    || normalized === 'create2';
}

