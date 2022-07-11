/**
 *Submitted for verification at cronoscan.com on 2022-01-13
 */

// Sources flattened with hardhat v2.6.1 https://hardhat.org

// File @openzeppelin/contracts/utils/Context.sol@v4.3.1

// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

/**
 * @dev Provides information about the current execution context, including the
 * sender of the transaction and its data. While these are generally available
 * via msg.sender and msg.data, they should not be accessed in such a direct
 * manner, since when dealing with meta-transactions the account sending and
 * paying for execution may not be the actual sender (as far as an application
 * is concerned).
 *
 * This contract is only required for intermediate, library-like contracts.
 */
abstract contract Context {
    function _msgSender() internal view virtual returns (address) {
        return msg.sender;
    }

    function _msgData() internal view virtual returns (bytes calldata) {
        return msg.data;
    }
}

// File @openzeppelin/contracts/access/Ownable.sol@v4.3.1

pragma solidity ^0.8.0;

/**
 * @dev Contract module which provides a basic access control mechanism, where
 * there is an account (an owner) that can be granted exclusive access to
 * specific functions.
 *
 * By default, the owner account will be the one that deploys the contract. This
 * can later be changed with {transferOwnership}.
 *
 * This module is used through inheritance. It will make available the modifier
 * `onlyOwner`, which can be applied to your functions to restrict their use to
 * the owner.
 */
abstract contract Ownable is Context {
    address private _owner;

    event OwnershipTransferred(
        address indexed previousOwner,
        address indexed newOwner
    );

    /**
     * @dev Initializes the contract setting the deployer as the initial owner.
     */
    constructor() {
        _setOwner(_msgSender());
    }

    /**
     * @dev Returns the address of the current owner.
     */
    function owner() public view virtual returns (address) {
        return _owner;
    }

    /**
     * @dev Throws if called by any account other than the owner.
     */
    modifier onlyOwner() {
        require(owner() == _msgSender(), "Ownable: caller is not the owner");
        _;
    }

    /**
     * @dev Leaves the contract without owner. It will not be possible to call
     * `onlyOwner` functions anymore. Can only be called by the current owner.
     *
     * NOTE: Renouncing ownership will leave the contract without an owner,
     * thereby removing any functionality that is only available to the owner.
     */
    function renounceOwnership() public virtual onlyOwner {
        _setOwner(address(0));
    }

    /**
     * @dev Transfers ownership of the contract to a new account (`newOwner`).
     * Can only be called by the current owner.
     */
    function transferOwnership(address newOwner) public virtual onlyOwner {
        require(
            newOwner != address(0),
            "Ownable: new owner is the zero address"
        );
        _setOwner(newOwner);
    }

    function _setOwner(address newOwner) private {
        address oldOwner = _owner;
        _owner = newOwner;
        emit OwnershipTransferred(oldOwner, newOwner);
    }
}

// File contracts/interface/chainlink/AggregatorInterface.sol

pragma solidity ^0.8.0;

interface AggregatorInterface {
    function latestAnswer() external view returns (int256);

    function latestTimestamp() external view returns (uint256);

    function latestRound() external view returns (uint256);

    function getAnswer(uint256 roundId) external view returns (int256);

    function getTimestamp(uint256 roundId) external view returns (uint256);

    event AnswerUpdated(
        int256 indexed current,
        uint256 indexed roundId,
        uint256 updatedAt
    );

    event NewRound(
        uint256 indexed roundId,
        address indexed startedBy,
        uint256 startedAt
    );
}

// File contracts/interface/chainlink/AggregatorV3Interface.sol

pragma solidity ^0.8.0;

interface AggregatorV3Interface {
    function decimals() external view returns (uint8);

    function description() external view returns (string memory);

    function version() external view returns (uint256);

    // getRoundData and latestRoundData should both raise "No data present"
    // if they do not have data to report, instead of returning unset values
    // which could be misinterpreted as actual reported values.
    function getRoundData(uint80 _roundId)
        external
        view
        returns (
            uint80 roundId,
            int256 answer,
            uint256 startedAt,
            uint256 updatedAt,
            uint80 answeredInRound
        );

    function latestRoundData()
        external
        view
        returns (
            uint80 roundId,
            int256 answer,
            uint256 startedAt,
            uint256 updatedAt,
            uint80 answeredInRound
        );
}

// File contracts/interface/chainlink/AggregatorV2V3Interface.sol

pragma solidity ^0.8.0;

interface AggregatorV2V3Interface is
    AggregatorInterface,
    AggregatorV3Interface
{}

// File contracts/CronosOracleBase.sol

pragma solidity ^0.8.0;

abstract contract CronosOracleBase is Ownable {}

// File contracts/CronosOracleStorage.sol

pragma solidity ^0.8.0;

contract CronosOracleStorage {
    uint8 public _decimals;
    string public _description;
    uint256 public constant _version = 2;

    uint256 internal lastCompletedRoundId;
    uint256 internal lastUpdatedTimestamp;

    mapping(uint256 => int256) internal prices; // roundId to price
    mapping(uint256 => uint256) internal updatedTimestamps; // roundId to timestamp
}

// File contracts/CronosOracleReader.sol

pragma solidity ^0.8.0;

contract CronosOracleReader is CronosOracleStorage, AggregatorV2V3Interface {
    string private constant V3_NO_DATA_ERROR = "No data present";

    function latestAnswer() external view override returns (int256) {
        return prices[lastCompletedRoundId];
    }

    function latestTimestamp() external view override returns (uint256) {
        return updatedTimestamps[lastCompletedRoundId];
    }

    function latestRound() external view override returns (uint256) {
        return lastCompletedRoundId;
    }

    function getAnswer(uint256 _roundId)
        external
        view
        override
        returns (int256)
    {
        return prices[_roundId];
    }

    function getTimestamp(uint256 _roundId)
        external
        view
        override
        returns (uint256)
    {
        return updatedTimestamps[_roundId];
    }

    function decimals() external view override returns (uint8) {
        return _decimals;
    }

    function description() external view override returns (string memory) {
        return _description;
    }

    function version() external view override returns (uint256) {
        return _version;
    }

    // getRoundData and latestRoundData should both raise "No data present"
    // if they do not have data to report, instead of returning unset values
    // which could be misinterpreted as actual reported values.

    function getRoundData(uint80 _roundId)
        external
        view
        override
        returns (
            uint80 roundId,
            int256 answer,
            uint256 startedAt,
            uint256 updatedAt,
            uint80 answeredInRound
        )
    {
        return _getRoundData(_roundId);
    }

    function latestRoundData()
        external
        view
        override
        returns (
            uint80 roundId,
            int256 answer,
            uint256 startedAt,
            uint256 updatedAt,
            uint80 answeredInRound
        )
    {
        return _getRoundData(uint80(lastCompletedRoundId));
    }

    /*
     * Internal
     */

    function _getRoundData(uint80 _roundId)
        internal
        view
        returns (
            uint80 roundId,
            int256 answer,
            uint256 startedAt,
            uint256 updatedAt,
            uint80 answeredInRound
        )
    {
        answer = prices[_roundId];
        uint64 timestamp = uint64(updatedTimestamps[_roundId]);

        require(timestamp > 0, V3_NO_DATA_ERROR);

        return (_roundId, answer, timestamp, timestamp, _roundId);
    }
}

// File contracts/CronosOracleUpdater.sol

pragma solidity ^0.8.0;

contract CronosOracleUpdater is CronosOracleStorage, CronosOracleBase {
    event PriceUpdated(
        uint256 indexed roundId,
        uint256 indexed timestamp,
        int256 indexed price
    );

    function updatePrice(
        uint256 _roundId,
        uint256 _timestamp,
        int256 _newPrice
    ) external onlyOwner {
        lastCompletedRoundId = _roundId;
        lastUpdatedTimestamp = _timestamp;
        prices[_roundId] = _newPrice;
        updatedTimestamps[_roundId] = _timestamp;

        emit PriceUpdated(_roundId, _timestamp, _newPrice);
    }
}

// File contracts/CronosOracle.sol

pragma solidity ^0.8.0;

contract CronosOracle is
    AggregatorV2V3Interface,
    CronosOracleBase,
    CronosOracleUpdater,
    CronosOracleReader
{
    constructor(uint8 __decimals, string memory __description) {
        _decimals = __decimals;
        _description = __description;
    }
}
