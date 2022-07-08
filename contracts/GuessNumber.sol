// SPDX-License-Identifier: CC-BY-SA-4.0

// Solidity files have to start with this pragma.
// It will be used by the Solidity compiler to validate its version.
pragma solidity >=0.7.0;
import "hardhat/console.sol";

// This is the main building block for smart contracts.
contract GuessNumber {
    address public host;
    bytes32 public nonceHash;
    bytes32 public nonceNumHash;
    uint256 public reward;
    mapping(address => uint32) gamers;
    mapping(address => bool) guessed;

    constructor(
        uint256 _reward,
        bytes32 _nonceHash,
        bytes32 _nonceNumHash
    ) payable {
        require(_reward > 0, "guessed");
        host = msg.sender;
        reward = _reward;
        nonceHash = _nonceHash;
        nonceNumHash = _nonceNumHash;
    }

    function guess(uint32 _number) external payable {
        require(guessed[msg.sender] == false, "guessed");
        gamers[msg.sender] = _number;
        guessed[msg.sender] = true;
    }
}
