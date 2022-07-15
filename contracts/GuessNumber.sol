// SPDX-License-Identifier: CC-BY-SA-4.0

pragma solidity ^0.8.0;
import "hardhat/console.sol";

// 安全的数学计算库
library SafeMath {
    // 减法计算
    function subAbs(uint16 a, uint16 b) internal pure returns (uint16) {
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
    enum States {
        Created,
        Concluded
    }
    States public state;
    uint256 public deposit;
    bytes32 public nonceHash;
    bytes32 public nonceNumHash;
    mapping(address => uint16) public palyers;
    mapping(address => bool) public isGuess;
    mapping(uint16 => bool) public guessNumbers;
    mapping(address => uint256) public pendingWithdrawals;
    address[] public playerAddress;
    address[] public winerPlayers;

    event guessed(address palyer, uint16 number);
    event transfered(address indexed winer, uint256 reward);
    event withdrawed(address indexed sender, uint256 amout);

    constructor(bytes32 _nonceHash, bytes32 _nonceNumHash) payable {
        require(msg.value > 0, "host deposit must be greater than 0");
        deposit = msg.value;
        nonceHash = _nonceHash;
        nonceNumHash = _nonceNumHash;
        state = States.Created;
    }

    modifier atState(States _state) {
        require(state == _state, "Function cannot be called at this state");
        _;
    }

    function guess(uint16 number)
        external
        payable
        override
        atState(States.Created)
    {
        require(msg.value == deposit, "msg.value must be equal deposit");
        require(isGuess[msg.sender] == false, "gamer already played");
        require(guessNumbers[number] == false, "the number have guessed");
        require(number >= 0 && number < 1000, "invalid number");
        palyers[msg.sender] = number;
        isGuess[msg.sender] = true;
        guessNumbers[number] = true;
        playerAddress.push(msg.sender);
        emit guessed(msg.sender, number);
    }

    function nextState() internal {
        state = States(uint256(state) + 1);
    }

    // 这个修饰器在函数执行结束之后
    // 使合约进入下一个阶段。
    modifier transitionNext() {
        _;
        nextState();
    }

    function reveal(bytes32 nonce, uint16 number)
        external
        override
        onlyHost
        atState(States.Created)
        transitionNext
    {
        require(playerAddress.length >= 2, "At least 2 players");
        require(keccak256(abi.encode(nonce)) == nonceHash, "nonce illegal");
        require(
            keccak256(abi.encode(nonce, number)) == nonceNumHash,
            "number illegal"
        );
        uint256 playerLength = playerAddress.length;
        if (number >= 0 && number < 1000) {
            uint16 diff = 1000;
            for (uint256 i = 0; i < playerLength; i++) {
                uint16 diff_temp = SafeMath.subAbs(
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
            // payable(winerPlayers[i]).transfer(reward);
            // console.log("%s -- %s", winerPlayers[i], reward);
            pendingWithdrawals[winerPlayers[i]] = reward;
            emit transfered(winerPlayers[i], reward);
        }
    }

    function withdraw() public atState(States.Concluded) {
        require(pendingWithdrawals[msg.sender] > 0, "not reward");
        uint256 amount = pendingWithdrawals[msg.sender];
        // 记住，在发送资金之前将待发金额清零
        // 来防止重入（re-entrancy）攻击
        pendingWithdrawals[msg.sender] = 0;
        payable(msg.sender).transfer(amount);
        emit withdrawed(msg.sender, amount);
    }
}
