pragma solidity ^0.8.0;
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "hardhat/console.sol";

contract ChequeBank {
    address owner;
    mapping(bytes32 => bool) redeemeds;

    constructor() {
        owner = msg.sender;
    }

    modifier _onlyOwner() {
        require(msg.sender == owner);
        _;
    }

    struct ChequeInfo {
        uint256 amount;
        bytes32 chequeId;
        uint32 validFrom;
        uint32 validThru;
        address payee;
        address payer;
    }
    struct SignOverInfo {
        uint8 counter;
        bytes32 chequeId;
        address oldPayee;
        address newPayee;
    }

    struct Cheque {
        ChequeInfo chequeInfo;
        bytes sig;
    }
    struct SignOver {
        SignOverInfo signOverInfo;
        bytes sig;
    }

    function deposit() external payable {}

    function withdraw(uint256 amount) external _onlyOwner {}

    function withdrawTo(uint256 amount, address payable recipient)
        external
        _onlyOwner
    {
        recipient.transfer(amount);
    }

    function redeem(Cheque memory chequeData) external {
        require(chequeData.chequeInfo.payer == owner);
        require(!redeemeds[chequeData.chequeInfo.chequeId]);
        require(chequeData.chequeInfo.amount <= address(this).balance);
        redeemeds[chequeData.chequeInfo.chequeId] = true;

        bytes32 hash = keccak256(
            abi.encodePacked(
                chequeData.chequeInfo.chequeId,
                chequeData.chequeInfo.payer,
                chequeData.chequeInfo.payee,
                chequeData.chequeInfo.amount,
                this,
                chequeData.chequeInfo.validFrom,
                chequeData.chequeInfo.validThru
            )
        );
        bytes32 message = ECDSA.toEthSignedMessageHash(hash);

        require(ECDSA.recover(message, chequeData.sig) == owner);

        payable(chequeData.chequeInfo.payee).transfer(
            chequeData.chequeInfo.amount
        );
    }

    function revoke(bytes32 chequeId) external _onlyOwner {
        redeemeds[chequeId] = true;
    }

    function notifySignOver(SignOver memory signOverData) external {}

    function redeemSignOver(
        Cheque memory chequeData,
        SignOver[] memory signOverData
    ) external {}

    function isChequeValid(
        address payee,
        Cheque memory chequeData,
        SignOver[] memory signOverData
    ) public view returns (bool) {
        require(chequeData.chequeInfo.payer == owner);
        require(chequeData.chequeInfo.payee == payee);
        require(!redeemeds[chequeData.chequeInfo.chequeId]);
        require(chequeData.chequeInfo.amount <= address(this).balance);
        bytes32 hash = keccak256(
            abi.encodePacked(
                chequeData.chequeInfo.chequeId,
                chequeData.chequeInfo.payer,
                chequeData.chequeInfo.payee,
                chequeData.chequeInfo.amount,
                this,
                chequeData.chequeInfo.validFrom,
                chequeData.chequeInfo.validThru
            )
        );
        bytes32 message = ECDSA.toEthSignedMessageHash(hash);
        return ECDSA.recover(message, chequeData.sig) == owner;
    }
}
