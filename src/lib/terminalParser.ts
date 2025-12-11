export type ParsedCommand =
  | { type: 'empty' }
  | { type: 'help' }
  | { type: 'clear' }
  | { type: 'assets' }
  | { type: 'balance' }
  | { type: 'history' }
  | { type: 'remoteToken'; mint: string }
  | { type: 'error'; message: string }
  | { type: 'faucet'; asset: string }
  | { type: 'bridge'; payload: BridgeCommandPayload };

export interface BridgeCommandPayload {
  amount: string;
  asset: string;
  destination: string;
  flags: BridgeCommandFlags;
}

export interface BridgeCommandFlags {
  mint?: string;
  remote?: string;
  decimals?: number;
  callContract?: string;
  callSelector?: string;
  callArgs?: string[];
  callValue?: string;
}

const FLAG_SPECS = {
  mint: { type: 'string', key: 'mint' },
  remote: { type: 'string', key: 'remote' },
  decimals: { type: 'number', key: 'decimals' },
  'call-contract': { type: 'string', key: 'callContract' },
  'call-selector': { type: 'string', key: 'callSelector' },
  'call-args': { type: 'args', key: 'callArgs' },
  'call-value': { type: 'string', key: 'callValue' },
} as const;

const BASE58_MINT_REGEX = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;

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
    case 'remotetoken':
      return parseRemoteToken(rest);
    case 'faucet':
      return parseFaucet(rest);
    case 'bridge':
      return parseBridge(rest);
    default:
      return {
        type: 'error',
        message: `Unknown command "${command}". Type 'help' to see available commands.`,
      };
  }
}

function parseRemoteToken(args: string[]): ParsedCommand {
  if (args.length === 0) {
    return {
      type: 'error',
      message: "Usage: remoteToken <spl-mint>. Example: remoteToken 4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU",
    };
  }

  return {
    type: 'remoteToken',
    mint: args[0],
  };
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
  const assetInput = assetRaw.trim();
  const asset = BASE58_MINT_REGEX.test(assetInput) ? assetInput : assetInput.toLowerCase();

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

function parseFlags(tokens: string[]): BridgeCommandFlags {
  const flags: BridgeCommandFlags = {};

  let i = 0;
  while (i < tokens.length) {
    const token = tokens[i];
    if (!token.startsWith('--')) {
      throw new Error(`Unexpected token "${token}". Flags must start with "--".`);
    }

    const key = token.slice(2).toLowerCase() as keyof typeof FLAG_SPECS;
    const spec = FLAG_SPECS[key];

    if (!spec) {
      throw new Error(`Unknown flag "--${key}".`);
    }

    if (spec.type === 'args') {
      i += 1;
      const values: string[] = [];
      while (i < tokens.length && !tokens[i].startsWith('--')) {
        values.push(tokens[i]);
        i += 1;
      }
      flags[spec.key] = values;
      continue;
    }

    const value = tokens[i + 1];
    if (!value) {
      throw new Error(`Flag "--${key}" requires a value.`);
    }

    i += 2;
    if (spec.type === 'number') {
      const parsed = Number(value);
      if (!Number.isFinite(parsed) || parsed < 0) {
        throw new Error(`Flag "--${key}" must be a positive number.`);
      }
      flags[spec.key] = parsed;
    } else {
      flags[spec.key] = value;
    }
  }

  if ((flags.callSelector || flags.callArgs?.length || flags.callValue) && !flags.callContract) {
    throw new Error('Specify --call-contract when adding call details.');
  }

  if ((flags.callContract || flags.callArgs?.length || flags.callValue) && !flags.callSelector) {
    throw new Error('Specify --call-selector when adding call details.');
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

