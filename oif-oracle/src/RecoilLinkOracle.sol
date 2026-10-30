// SPDX-License-Identifier: MIT OR Apache-2.0
pragma solidity ^0.8.26;

import { HyperlaneOracle } from "oif/integrations/oracles/hyperlane/HyperlaneOracle.sol";

/// @title RecoilLinkOracle
/// @notice Open Intents Framework oracle that proves fills over Recoil Link.
/// @dev Deliberately adds no logic to OIF's `HyperlaneOracle`: Recoil Link keeps
/// the Mailbox interface and message format, so the audited upstream oracle works
/// unchanged and OIF solvers use it through the same ABI.
///
/// Deploy one per chain against that chain's Recoil Link Mailbox:
/// - On the output chain it sends proofs: `submit` dispatches the fill
///   descriptions to the input chain's oracle.
/// - On the input chain it receives them: `handle` records each fill, keyed by
///   the sending oracle and the settler, for the escrow to check with
///   `isProven` / `efficientRequireProven`.
///
/// With `ism = address(0)` messages are verified by the Mailbox's default ISM,
/// i.e. the Recoil Link validator set. Domain ids must equal chain ids (true for
/// every EVM chain in the Recoil Link registry); otherwise use the mapped variant.
contract RecoilLinkOracle is HyperlaneOracle {
    /// @param mailbox Recoil Link Mailbox on this chain.
    /// @param customHook Post-dispatch hook override; zero uses the Mailbox default.
    /// @param ism Security module override; zero uses the Mailbox default.
    constructor(
        address mailbox,
        address customHook,
        address ism
    ) HyperlaneOracle(mailbox, customHook, ism) { }
}
