import { hexToNumber, isHex, keccak256, size, slice, type Hex } from 'viem';

/** A Recoil Link message, decoded from its packed bytes (format version 3). */
export interface Message {
  id: Hex;
  version: number;
  nonce: number;
  origin: number;
  sender: Hex;
  destination: number;
  recipient: Hex;
  body: Hex;
}

// version (1) · nonce (4) · origin (4) · sender (32) · destination (4) · recipient (32) · body
const HEADER_BYTES = 77;

export function decodeMessage(packed: Hex): Message {
  if (size(packed) < HEADER_BYTES)
    throw new Error(
      `message is ${size(packed)} bytes, shorter than its header`,
    );
  return {
    id: keccak256(packed),
    version: hexToNumber(slice(packed, 0, 1)),
    nonce: hexToNumber(slice(packed, 1, 5)),
    origin: hexToNumber(slice(packed, 5, 9)),
    sender: slice(packed, 9, 41),
    destination: hexToNumber(slice(packed, 41, 45)),
    recipient: slice(packed, 45, 77),
    body: size(packed) > HEADER_BYTES ? slice(packed, 77) : '0x',
  };
}

/** A bytes32 address as a 20-byte address, when its top 12 bytes are zero. */
export function bytes32ToAddress(value: Hex): Hex {
  return /^0x0{24}[0-9a-fA-F]{40}$/.test(value)
    ? `0x${value.slice(26)}`
    : value;
}

/** A 32-byte hex value: a message id or a transaction hash. */
export function isHash(value: string): value is Hex {
  return isHex(value, { strict: true }) && value.length === 66;
}

/** The body as text when it is printable UTF-8, otherwise undefined. */
export function bodyText(body: Hex): string | undefined {
  if (body === '0x') return undefined;
  const bytes = new Uint8Array((body.length - 2) / 2);
  for (let i = 0; i < bytes.length; i++)
    bytes[i] = parseInt(body.slice(2 + 2 * i, 4 + 2 * i), 16);
  try {
    const text = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
    return /^[\P{Cc}\n\r\t]*$/u.test(text) ? text : undefined;
  } catch {
    return undefined;
  }
}
