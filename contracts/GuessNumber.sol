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
    mapping(address => uint32) public gamers;
    mapping(address => bool) public guessed;

    constructor(
        uint256 _reward,
        bytes32 _nonceHash,
        bytes32 _nonceNumHash
    ) payable {
        require(_reward > 0, "_reward must be greater than zero");
        require(msg.value > 0, "msg.value must be greater than zero");
        require(msg.value == _reward, "msg.value must be equal _reward");
        host = msg.sender;
        reward = _reward;
        nonceHash = _nonceHash;
        nonceNumHash = _nonceNumHash;
    }

    function guess(uint32 _number) external payable {
        require(msg.sender != host, "host can't play the game");
        require(msg.value == 1 ether, "msg.value must be equal 1 ether");
        require(guessed[msg.sender] == false, "gamer already played");
        gamers[msg.sender] = _number;
        guessed[msg.sender] = true;
    }
}
