// SPDX-License-Identifier: MIT OR Apache-2.0
pragma solidity ^0.8.26;

import { ERC20 } from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import { Test, Vm } from "forge-std/Test.sol";

import { Mailbox } from "recoil-link/Mailbox.sol";
import { TestIsm } from "recoil-link/test/TestIsm.sol";
import { TestPostDispatchHook } from "recoil-link/test/TestPostDispatchHook.sol";

import { MandateOutput } from "oif/input/types/MandateOutputType.sol";
import { HyperlaneOracle } from "oif/integrations/oracles/hyperlane/HyperlaneOracle.sol";
import { MailboxClient } from "oif/integrations/oracles/hyperlane/external/hyperlane/MailboxClient.sol";
import { LibAddress } from "oif/libs/LibAddress.sol";
import { MandateOutputEncodingLib } from "oif/libs/MandateOutputEncodingLib.sol";
import { MessageEncodingLib } from "oif/libs/MessageEncodingLib.sol";
import { OutputSettlerSimple } from "oif/output/simple/OutputSettlerSimple.sol";

import { RecoilLinkOracle } from "../src/RecoilLinkOracle.sol";

contract TestToken is ERC20 {
    constructor() ERC20("Test", "TST") { }

    function mint(
        address to,
        uint256 amount
    ) external {
        _mint(to, amount);
    }
}

/// End to end: an OIF fill on the output chain is proven to the input chain
/// through Recoil Link's real Mailbox (not a mock). Both "chains" run in one EVM,
/// told apart by their Mailbox domains.
contract RecoilLinkOracleTest is Test {
    using LibAddress for address;

    // Input chain: holds the escrow; its oracle receives proofs.
    uint32 internal constant INPUT_DOMAIN = 11155111;
    // Output chain: the solver fills here; its oracle sends proofs.
    uint32 internal constant OUTPUT_DOMAIN = 84532;
    uint256 internal constant GAS_LIMIT = 200_000;
    uint256 internal constant HOOK_FEE = 0.001 ether;

    Mailbox internal inputMailbox;
    Mailbox internal outputMailbox;
    TestIsm internal inputIsm;
    TestPostDispatchHook internal hook;
    RecoilLinkOracle internal inputOracle;
    RecoilLinkOracle internal outputOracle;
    OutputSettlerSimple internal settler;
    TestToken internal token;

    address internal solver = makeAddr("solver");
    address internal user = makeAddr("user");
    bytes32 internal solverId = keccak256("solver");
    bytes32 internal orderId = keccak256("order");
    uint256 internal amount = 100e18;

    function setUp() public {
        inputIsm = new TestIsm();
        hook = new TestPostDispatchHook();
        hook.setFee(HOOK_FEE);

        inputMailbox = new Mailbox(INPUT_DOMAIN);
        inputMailbox.initialize(address(this), address(inputIsm), address(hook), address(hook));
        outputMailbox = new Mailbox(OUTPUT_DOMAIN);
        outputMailbox.initialize(address(this), address(new TestIsm()), address(hook), address(hook));

        inputOracle = new RecoilLinkOracle(address(inputMailbox), address(0), address(0));
        outputOracle = new RecoilLinkOracle(address(outputMailbox), address(0), address(0));

        settler = new OutputSettlerSimple();
        token = new TestToken();
        vm.deal(address(this), 1 ether);
    }

    // ============ Happy path ============

    function test_fillIsProvenThroughRecoilLinkMailbox() public {
        bytes memory payload = _fill();
        bytes[] memory payloads = _one(payload);

        uint256 fee = outputOracle.quoteGasPayment(
            INPUT_DOMAIN, address(inputOracle), GAS_LIMIT, "", address(settler), payloads
        );
        // Required hook + default hook each charge HOOK_FEE.
        assertEq(fee, 2 * HOOK_FEE);

        vm.recordLogs();
        outputOracle.submit{ value: fee }(INPUT_DOMAIN, address(inputOracle), GAS_LIMIT, "", address(settler), payloads);
        bytes memory message = _dispatchedMessage(address(outputMailbox));

        assertFalse(_isProven(address(outputOracle), payload), "proven before delivery");
        inputMailbox.process("", message);

        assertTrue(_isProven(address(outputOracle), payload), "fill not proven");
        assertTrue(inputMailbox.delivered(keccak256(message)));
    }

    // ============ Failure modes ============

    /// A message the Recoil Link ISM rejects is never delivered or recorded.
    function test_rejectedByIsmIsNotProven() public {
        bytes memory payload = _fill();
        bytes[] memory payloads = _one(payload);

        vm.recordLogs();
        outputOracle.submit{ value: 2 * HOOK_FEE }(
            INPUT_DOMAIN, address(inputOracle), GAS_LIMIT, "", address(settler), payloads
        );
        bytes memory message = _dispatchedMessage(address(outputMailbox));

        inputIsm.setVerify(false);
        vm.expectRevert("Mailbox: ISM verification failed");
        inputMailbox.process("", message);

        assertFalse(_isProven(address(outputOracle), payload));
    }

    /// Anyone can send a message through the Mailbox, but proofs are keyed by the
    /// sending oracle: a forged proof from another sender does not count as a
    /// proof from the output chain's oracle.
    function test_forgedProofFromAnotherSenderDoesNotProveFill() public {
        bytes memory payload = _fill();
        bytes memory body = this.encodeMessage(address(settler).toIdentifier(), _one(payload));

        address attacker = makeAddr("attacker");
        vm.deal(attacker, 1 ether);
        vm.recordLogs();
        vm.prank(attacker);
        outputMailbox.dispatch{ value: 2 * HOOK_FEE }(INPUT_DOMAIN, address(inputOracle).toIdentifier(), body);
        inputMailbox.process("", _dispatchedMessage(address(outputMailbox)));

        assertTrue(_isProven(attacker, payload), "recorded under the attacker's identity");
        assertFalse(_isProven(address(outputOracle), payload), "forged proof accepted as the oracle's");
    }

    /// The output oracle only sends proofs for outputs the settler actually filled.
    function test_unfilledOutputCannotBeSubmitted() public {
        bytes memory payload = MandateOutputEncodingLib.encodeFillDescriptionMemory(
            solverId,
            orderId,
            uint32(block.timestamp),
            address(token).toIdentifier(),
            amount,
            user.toIdentifier(),
            bytes(""),
            bytes("")
        );

        vm.expectRevert(HyperlaneOracle.NotAllPayloadsValid.selector);
        outputOracle.submit{ value: 2 * HOOK_FEE }(
            INPUT_DOMAIN, address(inputOracle), GAS_LIMIT, "", address(settler), _one(payload)
        );
    }

    /// Only the Mailbox may deliver proofs to the oracle.
    function test_onlyMailboxCanDeliver() public {
        bytes memory payload = _fill();
        bytes memory body = this.encodeMessage(address(settler).toIdentifier(), _one(payload));

        vm.expectRevert(MailboxClient.SenderNotMailbox.selector);
        inputOracle.handle(OUTPUT_DOMAIN, address(outputOracle).toIdentifier(), body);

        assertFalse(_isProven(address(outputOracle), payload));
    }

    // ============ Helpers ============

    /// `MessageEncodingLib.encodeMessage` takes calldata, so call it externally.
    function encodeMessage(
        bytes32 application,
        bytes[] calldata payloads
    ) external pure returns (bytes memory) {
        return MessageEncodingLib.encodeMessage(application, payloads);
    }

    /// Solver fills `amount` tokens to `user` on the output chain; returns the
    /// fill description the oracle proves.
    function _fill() internal returns (bytes memory payload) {
        token.mint(solver, amount);
        vm.prank(solver);
        token.approve(address(settler), amount);

        MandateOutput memory output = MandateOutput({
            oracle: address(outputOracle).toIdentifier(),
            settler: address(settler).toIdentifier(),
            chainId: block.chainid,
            token: address(token).toIdentifier(),
            amount: amount,
            recipient: user.toIdentifier(),
            callbackData: bytes(""),
            context: bytes("")
        });
        vm.prank(solver);
        settler.fill(orderId, output, type(uint48).max, abi.encodePacked(solverId));
        assertEq(token.balanceOf(user), amount, "user not paid");

        payload = MandateOutputEncodingLib.encodeFillDescriptionMemory(
            solverId,
            orderId,
            uint32(block.timestamp),
            address(token).toIdentifier(),
            amount,
            user.toIdentifier(),
            bytes(""),
            bytes("")
        );
    }

    function _isProven(
        address remoteOracle,
        bytes memory payload
    ) internal view returns (bool) {
        return inputOracle.isProven(
            OUTPUT_DOMAIN, remoteOracle.toIdentifier(), address(settler).toIdentifier(), keccak256(payload)
        );
    }

    function _one(
        bytes memory payload
    ) internal pure returns (bytes[] memory payloads) {
        payloads = new bytes[](1);
        payloads[0] = payload;
    }

    /// The raw message from the last `Dispatch` event emitted by `mailbox`.
    function _dispatchedMessage(
        address mailbox
    ) internal returns (bytes memory message) {
        bytes32 dispatchTopic = keccak256("Dispatch(address,uint32,bytes32,bytes)");
        Vm.Log[] memory logs = vm.getRecordedLogs();
        for (uint256 i = logs.length; i > 0; i--) {
            Vm.Log memory log = logs[i - 1];
            if (log.emitter == mailbox && log.topics[0] == dispatchTopic) return abi.decode(log.data, (bytes));
        }
        revert("no Dispatch event");
    }
}
