// SPDX-License-Identifier: CC-BY-SA-4.0

// Solidity files have to start with this pragma.
// It will be used by the Solidity compiler to validate its version.
pragma solidity >=0.7.0;
import "hardhat/console.sol";

// This is the main building block for smart contracts.
contract GuessNumber {
    address private host;
    bytes private nonceHash;
    bytes private nonceNumHash;
    uint256 private reward;

    constructor(
        uint256 _reward,
        bytes memory _nonceHash,
        bytes memory _nonceNumHash
    ) payable {
        host = msg.sender;
        reward = _reward;
        nonceHash = _nonceHash;
        nonceNumHash = _nonceNumHash;
    }

    function info()
        external
        view
        returns (
            address,
            bytes memory,
            bytes memory,
            uint256
        )
    {
        return (host, nonceHash, nonceNumHash, reward);
    }
}
