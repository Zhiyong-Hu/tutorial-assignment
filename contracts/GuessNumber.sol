// SPDX-License-Identifier: CC-BY-SA-4.0

pragma solidity >=0.7.0;
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

    modifier onlyHost() {
        require(msg.sender == host, "Only the host can operation");
        _;
    }
}

interface GuessNumberInterface {
    function guess(uint16 number) external payable;

    function reveal(bytes32 nonce, uint16 number) external;
}

contract GuessNumber is Host, GuessNumberInterface {
    enum State {
        Created,
        Concluded
    }
    State public state;
    uint256 public deposit;
    bytes32 public nonceHash;
    bytes32 public nonceNumHash;
    mapping(address => uint16) public palyers;
    mapping(address => bool) public isGuess;
    mapping(uint16 => bool) public guessNumbers;
    address[] public playerAddress;
    address[] public winerPlayers;

    event guessed(address palyer, uint16 number);
    event transfered(address winer, uint256 reward);

    constructor(bytes32 _nonceHash, bytes32 _nonceNumHash) payable {
        require(msg.value > 0, "host deposit must be greater than 0");
        deposit = msg.value;
        nonceHash = _nonceHash;
        nonceNumHash = _nonceNumHash;
        state = State.Created;
    }

    function guess(uint16 number) external payable override {
        require(msg.value == deposit, "msg.value must be equal deposit");
        require(isGuess[msg.sender] == false, "gamer already played");
        require(guessNumbers[number] == false, "the number have guessed");
        require(number >= 0 && number < 1000, "invalid number");
        require(state == State.Created, "already concluded");
        palyers[msg.sender] = number;
        isGuess[msg.sender] = true;
        guessNumbers[number] = true;
        playerAddress.push(msg.sender);
        emit guessed(msg.sender, number);
    }

    function reveal(bytes32 nonce, uint16 number) external override onlyHost {
        require(state == State.Created, "already concluded");
        require(playerAddress.length >= 2, "At least 2 players");
        require(keccak256(abi.encode(nonce)) == nonceHash, "nonce illegal");
        require(
            keccak256(abi.encode(nonce, number)) == nonceNumHash,
            "number illegal"
        );
        uint256 playerLength = playerAddress.length;
        if (number >= 0 && number < 1000) {
            uint16 diff = number;
            for (uint256 i = 0; i < playerLength; i++) {
                uint16 diff_temp = SafeMath.sub(
                    palyers[playerAddress[i]],
                    number
                );
                if (diff_temp < diff) {
                    diff = diff_temp;
                    delete winerPlayers;
                    winerPlayers.push(playerAddress[i]);
                } else if (diff_temp == diff) {
                    winerPlayers.push(playerAddress[i]);
                }
            }
        } else {
            winerPlayers = playerAddress;
        }
        uint256 total = (playerLength + 1) * deposit;
        uint256 winerLength = winerPlayers.length;
        uint256 reward = total / winerLength;
        for (uint256 i = 0; i < winerLength; i++) {
            payable(winerPlayers[i]).transfer(reward);
            emit transfered(winerPlayers[i], reward);
        }
        state = State.Concluded;
    }
}
