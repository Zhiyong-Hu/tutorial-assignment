/**
 *Submitted for verification at testnet.cronoscan.com on 2022-07-06
 */

pragma solidity >=0.5.0;
pragma experimental ABIEncoderV2;
import "hardhat/console.sol";

contract Multicall2 {
    struct Call {
        address target;
        bytes callData;
    }

    function aggregate(Call[] memory calls)
        public
        returns (bytes[] memory returnData)
    {
        console.log("msg_sender is %s, tx_origin is %s", msg.sender, tx.origin);
        returnData = new bytes[](calls.length);
        for (uint256 i = 0; i < calls.length; i++) {
            (bool success, bytes memory ret) = calls[i].target.call(
                calls[i].callData
            );
            require(success, "Multicall aggregate: call failed");
            returnData[i] = ret;
        }
    }
}
