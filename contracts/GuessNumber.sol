// SPDX-License-Identifier: CC-BY-SA-4.0

pragma solidity >=0.8.0;
import "hardhat/console.sol";

// 安全的数学计算库
library SafeMath {
    // 减法计算
    function sub(uint16 a, uint16 b) internal pure returns (uint16) {
        // 因为是无符号整数的计算，所以需要满足被减数>=减数
        if (a >= b) {
            return a - b;
        } else {
            return b - a;
        }
    }
}

abstract contract Host {
    address public host;

    constructor() {
        host = msg.sender;
    }

    modifier onlyHost() virtual {
        require(msg.sender == host, "Only the host can operation");
        _;
    }
}

interface GuessNumberInterface {
    function guess(uint16 number) external payable;

    function reveal(bytes32 nonce, uint16 number) external;
}

contract GuessNumber is GuessNumberInterface, Host {
    uint256 public deposit;
    bytes32 public nonceHash;
    bytes32 public nonceNumHash;
    mapping(address => uint16) public palyers;
    mapping(address => bool) public isGuess;
    mapping(uint16 => bool) public guessNumbers;
    address[] public playerAddress;

    constructor(bytes32 _nonceHash, bytes32 _nonceNumHash) payable {
        require(msg.value > 0, "host deposit must be greater than 0");
        deposit = msg.value;
        nonceHash = _nonceHash;
        nonceNumHash = _nonceNumHash;
    }

    function guess(uint16 number) external payable override {
        require(msg.value == deposit, "msg.value must be equal deposit");
        require(isGuess[msg.sender] == false, "gamer already played");
        require(guessNumbers[number] == false, "the number have guessed");
        require(playerAddress.length < 2, "over the limit");
        palyers[msg.sender] = number;
        isGuess[msg.sender] = true;
        guessNumbers[number] = true;
        playerAddress.push(msg.sender);
    }

    function reveal(bytes32 nonce, uint16 number) external override onlyHost {
        require(keccak256(abi.encode(nonce)) == nonceHash, "nonce illegal");
        require(
            keccak256(abi.encode(nonce, number)) == nonceNumHash,
            "number illegal"
        );
        require(playerAddress.length == 2, "less than 2 people");
        uint16 diff = number;
        uint256 playerLength = playerAddress.length;
        for (uint256 i = 0; i < playerLength; i++) {
            uint16 diff_temp = SafeMath.sub(palyers[playerAddress[i]], number);
            if (diff_temp < diff) {
                diff = diff_temp;
                delete winerPlayers;
                winerPlayers.push(playerAddress[i]);
            } else if (diff_temp == diff) {
                winerPlayers.push(playerAddress[i]);
            }
        }
        uint256 total = (playerLength + 1) * deposit;
        console.log("total is %s", total);
        uint256 winerLength = winerPlayers.length;
        console.log("winerLength is %s", winerLength);
        for (uint256 i = 0; i < winerLength; i++) {
            payable(winerPlayers[i]).transfer(total / winerLength);
        }
    }
}
