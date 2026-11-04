import { parseAbi, parseAbiItem } from 'viem';

// Recoil Link Mailbox (Hyperlane Mailbox v3): solidity/contracts/interfaces/IMailbox.sol
export const dispatchEvent = parseAbiItem(
  'event Dispatch(address indexed sender, uint32 indexed destination, bytes32 indexed recipient, bytes message)',
);
export const dispatchIdEvent = parseAbiItem(
  'event DispatchId(bytes32 indexed messageId)',
);
export const processEvent = parseAbiItem(
  'event Process(uint32 indexed origin, bytes32 indexed sender, address indexed recipient)',
);
export const processIdEvent = parseAbiItem(
  'event ProcessId(bytes32 indexed messageId)',
);
export const mailboxAbi = parseAbi([
  'function processedAt(bytes32 messageId) view returns (uint48)',
]);

// solidity/contracts/interfaces/IInterchainGasPaymaster.sol
export const gasPaymentEvent = parseAbiItem(
  'event GasPayment(bytes32 indexed messageId, uint32 indexed destinationDomain, uint256 gasAmount, uint256 payment)',
);
