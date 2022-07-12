// SPDX-License-Identifier: CC-BY-SA-4.0

// Solidity files have to start with this pragma.
// It will be used by the Solidity compiler to validate its version.
pragma solidity ^0.8.0;
import "hardhat/console.sol";

contract WeatherRecord {
    mapping(uint32 => mapping(bytes32 => uint32)) private weatherRecords;
    event info(address msg_sender, address tx_origin);

    function reportWeather(
        uint32 batchId,
        bytes32 cityName,
        uint32 temperature
    ) external {
        weatherRecords[batchId][cityName] = temperature;
        emit info(msg.sender, tx.origin);
    }

    function getWeather(uint32 batchId, bytes32 cityName)
        public
        view
        returns (uint32)
    {
        console.log("msg_sender is %s, tx_origin is %s", msg.sender, tx.origin);
        return weatherRecords[batchId][cityName];
    }
}
