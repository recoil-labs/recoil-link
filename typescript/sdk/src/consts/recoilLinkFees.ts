// Recoil Link fee policy: the single source of truth for what the protocol
// charges. See docs/recoil-link/fee-design.md for rationale.

// Premium applied to the destination/origin token exchange rate when setting
// IGP gas oracles. Upstream Hyperlane uses 50.
export const RECOIL_LINK_IGP_MARGIN_PCT = 30;

// Minimum IGP quote per message, in USD. Upstream Hyperlane uses 0.2.
export const RECOIL_LINK_MIN_USD_PER_MESSAGE = 0.1;

// Minimum IGP quote for messages to SVM chains, in USD, to cover rent.
export const RECOIL_LINK_MIN_USD_PER_SVM_MESSAGE = 0.5;

// Flat protocol fee per message (ProtocolFee required hook), in native token.
// Zero at launch; revenue comes from the IGP margin.
export const RECOIL_LINK_PROTOCOL_FEE = '0';

// Upper bound for the protocol fee, in USD, converted to each chain's native
// token at deploy time. MAX_PROTOCOL_FEE is immutable on EVM, so it must leave
// room to switch the fee on later.
export const RECOIL_LINK_MAX_PROTOCOL_FEE_USD = 1;

// Fee on token routes operated by Recoil Labs (e.g. RecoilPay), applied with a
// LinearFee contract: rate = maxFee / (2 * halfAmount), capped at maxFee.
// 5 bps up to a 25 token cap gives halfAmount = 25 / (2 * 0.0005) = 25,000.
export const RECOIL_LINK_ROUTE_FEE_BPS = 5;
export const RECOIL_LINK_ROUTE_FEE_MAX_TOKENS = 25;
