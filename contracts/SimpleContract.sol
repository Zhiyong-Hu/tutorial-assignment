// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;
import "hardhat/console.sol";

contract SimpleContract {
    function loop() public view {
        uint256 sum;
        while (true) {
            sum += 1;
            console.log(sum);
        }
    }
}
