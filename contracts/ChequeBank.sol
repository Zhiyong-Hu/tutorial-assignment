pragma solidity ^0.8.0;
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "hardhat/console.sol";

contract ChequeBank {
    mapping(address => uint256) balances;
    mapping(address => mapping(bytes32 => bool)) redeemeds;

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

    function balanceOf() external view returns (uint256) {
        return balances[msg.sender];
    }

    function deposit() external payable {
        balances[msg.sender] += msg.value;
    }

    function withdraw(uint256 amount) external {
        require(balances[msg.sender] >= amount, "Not enough balances");
        balances[msg.sender] -= amount;
        payable(msg.sender).transfer(amount);
    }

    function withdrawTo(uint256 amount, address payable recipient) external {
        require(balances[msg.sender] >= amount, "Not enough balances");
        balances[msg.sender] -= amount;
        recipient.transfer(amount);
    }

    function redeem(Cheque memory chequeData) external {
        require(
            !redeemeds[chequeData.chequeInfo.payer][
                chequeData.chequeInfo.chequeId
            ],
            "The cheque had redeemed"
        );
        require(
            balances[chequeData.chequeInfo.payer] >=
                chequeData.chequeInfo.amount,
            "Not enough balances"
        );

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

        require(
            ECDSA.recover(message, chequeData.sig) ==
                chequeData.chequeInfo.payer,
            "The cheque invalid"
        );

        redeemeds[chequeData.chequeInfo.payer][
            chequeData.chequeInfo.chequeId
        ] = true;
        balances[chequeData.chequeInfo.payer] -= chequeData.chequeInfo.amount;

        payable(chequeData.chequeInfo.payee).transfer(
            chequeData.chequeInfo.amount
        );
    }

    function revoke(bytes32 chequeId) external {
        redeemeds[msg.sender][chequeId] = true;
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
        require(chequeData.chequeInfo.payee == payee);
        require(
            !redeemeds[chequeData.chequeInfo.payer][
                chequeData.chequeInfo.chequeId
            ],
            "The cheque had redeemed"
        );
        require(
            balances[chequeData.chequeInfo.payer] >=
                chequeData.chequeInfo.amount,
            "Not enough balances"
        );
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
        return
            ECDSA.recover(message, chequeData.sig) ==
            chequeData.chequeInfo.payer;
    }
}
