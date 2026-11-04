import { encodePacked, keccak256, pad, stringToHex } from 'viem';
import { describe, expect, it } from 'vitest';
import { amount } from '../src/lib/format';
import {
  bodyText,
  bytes32ToAddress,
  decodeMessage,
  isHash,
} from '../src/lib/message';

const sender = pad('0x08AD08048a3b1d920490476dD126Ec25E8a67d46');
const recipient = pad('0xaa3e0A9DCF6c0d6b1E3Dcb9ed61601cAC0CEa525');
const body = stringToHex('hello from basesepolia');
const packed = encodePacked(
  ['uint8', 'uint32', 'uint32', 'bytes32', 'uint32', 'bytes32', 'bytes'],
  [3, 42, 84532, sender, 11155420, recipient, body],
);

describe('decodeMessage', () => {
  it('reads every header field and the body', () => {
    const m = decodeMessage(packed);
    expect(m).toEqual({
      id: keccak256(packed),
      version: 3,
      nonce: 42,
      origin: 84532,
      sender,
      destination: 11155420,
      recipient,
      body,
    });
  });

  it('accepts an empty body', () => {
    const header = encodePacked(
      ['uint8', 'uint32', 'uint32', 'bytes32', 'uint32', 'bytes32'],
      [3, 0, 97, sender, 11155111, recipient],
    );
    expect(decodeMessage(header).body).toBe('0x');
  });

  it('rejects bytes shorter than the header', () => {
    expect(() => decodeMessage('0x0300')).toThrow(/shorter than its header/);
  });
});

describe('helpers', () => {
  it('turns a padded bytes32 into an address and leaves other values alone', () => {
    expect(bytes32ToAddress(sender).toLowerCase()).toBe(
      '0x08ad08048a3b1d920490476dd126ec25e8a67d46',
    );
    const full = keccak256('0x01');
    expect(bytes32ToAddress(full)).toBe(full);
  });

  it('recognises 32-byte hashes only', () => {
    expect(isHash(keccak256('0x01'))).toBe(true);
    expect(isHash('0x1234')).toBe(false);
    expect(isHash('not hex')).toBe(false);
  });

  it('shows printable bodies as text and binary ones as undefined', () => {
    expect(bodyText(body)).toBe('hello from basesepolia');
    expect(bodyText('0x00ff10')).toBeUndefined();
    expect(bodyText('0x')).toBeUndefined();
  });
});

describe('amount', () => {
  it('writes small fees out in full with three significant digits', () => {
    expect(amount(2625558000000n, 'ETH')).toBe('0.00000263 ETH');
    expect(amount(1500000000000000000n, 'BNB')).toBe('1.50 BNB');
    expect(amount(0n, 'ETH')).toBe('0 ETH');
  });
});
