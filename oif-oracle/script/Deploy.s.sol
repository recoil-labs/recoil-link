// SPDX-License-Identifier: MIT OR Apache-2.0
pragma solidity ^0.8.26;

import { Script, console } from "forge-std/Script.sol";

import { RecoilLinkOracle } from "../src/RecoilLinkOracle.sol";

/// Deploy a RecoilLinkOracle against this chain's Recoil Link Mailbox.
///
///   forge script script/Deploy.s.sol --rpc-url <rpc> --private-key <key> --broadcast
///
/// The Mailbox comes from `mailboxFor` (Recoil Link deployments, see
/// recoil-labs/recoil-link-registry), or from RECOIL_LINK_MAILBOX for a chain
/// not listed yet. No ISM or hook override: the Mailbox defaults apply, so
/// proofs are verified by the Recoil Link validator set.
contract Deploy is Script {
    function mailboxFor(
        uint256 chainId
    ) public pure returns (address) {
        if (chainId == 11155111) return 0xA066332EF9C28158BDCf45D1a6138219e86CB6c6; // Sepolia
        if (chainId == 84532) return 0x078fba178e69c61cce09Fd7f1AE2f413B6c65c20; // Base Sepolia
        return address(0);
    }

    function run() external returns (RecoilLinkOracle oracle) {
        address mailbox = vm.envOr("RECOIL_LINK_MAILBOX", mailboxFor(block.chainid));
        require(mailbox != address(0), "no Recoil Link Mailbox known for this chain; set RECOIL_LINK_MAILBOX");
        require(mailbox.code.length > 0, "the Mailbox has no code on this chain");

        vm.startBroadcast();
        oracle = new RecoilLinkOracle(mailbox, address(0), address(0));
        vm.stopBroadcast();

        require(address(oracle.MAILBOX()) == mailbox, "mailbox not set");
        console.log("chain id:         ", block.chainid);
        console.log("mailbox:          ", mailbox);
        console.log("RecoilLinkOracle: ", address(oracle));
    }
}
