// SPDX-License-Identifier: CC-BY-SA-4.0

pragma solidity >=0.7.0;
import "hardhat/console.sol";

abstract contract Host {
    address public host;

    constructor() {
        host = msg.sender;
    }

    modifier onlyHost() {
        require(msg.sender == host);
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
        palyers[msg.sender] = number;
        isGuess[msg.sender] = true;
        guessNumbers[number] = true;
        playerAddress.push(msg.sender);
    }

    function reveal(bytes32 nonce, uint16 number) external override onlyHost {
        require(
            keccak256(abi.encodePacked(nonce)) == nonceHash,
            "nonce illegal"
        );
        require(
            keccak256(abi.encodePacked(nonce, number)) == nonceNumHash,
            "number illegal"
        );
    }
}
