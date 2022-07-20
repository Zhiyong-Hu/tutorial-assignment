pragma solidity ^0.8.0;
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "hardhat/console.sol";

contract ChequeBank {
    enum Status {
        unuse,
        overing,
        used
    }

    mapping(address => uint256) balances;
    mapping(bytes32 => Info) cheques;

    struct Info {
        uint8 counter;
        Status status;
        address payee;
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

    function balanceOf() external view returns (uint256) {
        return balances[msg.sender];
    }

    function deposit() external payable {
        require(msg.value >= 0);
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
            cheques[chequeData.chequeInfo.chequeId].status == Status.unuse,
            "The cheque can't redeem"
        );
        require(
            balances[chequeData.chequeInfo.payer] >=
                chequeData.chequeInfo.amount,
            "Not enough balances"
        );
        require(
            block.number >= chequeData.chequeInfo.validFrom &&
                block.number <= chequeData.chequeInfo.validThru,
            "The cheque can't redeem"
        );

        require(
            recover(chequeData, address(this)) == chequeData.chequeInfo.payer,
            "The cheque invalid"
        );

        cheques[chequeData.chequeInfo.chequeId].status == Status.used;
        balances[chequeData.chequeInfo.payer] -= chequeData.chequeInfo.amount;

        payable(chequeData.chequeInfo.payee).transfer(
            chequeData.chequeInfo.amount
        );
    }

    function revoke(bytes32 chequeId) external {
        require(
            cheques[chequeId].status == Status.unuse,
            "The cheque had redeemed"
        );
        cheques[chequeId].status == Status.used;
    }

    function notifySignOver(SignOver memory signOverData) external {
        require(
            cheques[signOverData.signOverInfo.chequeId].status != Status.used,
            "The cheque had redeemed"
        );
        require(
            recover(signOverData) == signOverData.signOverInfo.oldPayee,
            "The cheque invalid"
        );
        cheques[signOverData.signOverInfo.chequeId].payee = signOverData
            .signOverInfo
            .newPayee;
        cheques[signOverData.signOverInfo.chequeId].status = Status.overing;
    }

    function redeemSignOver(
        Cheque memory chequeData,
        SignOver[] memory signOverData
    ) external {
        require(
            recover(chequeData, address(this)) == chequeData.chequeInfo.payer,
            "The cheque invalid"
        );
        for (uint256 i = 0; i < signOverData.length; i++) {
            require(
                recover(signOverData[i]) ==
                    signOverData[i].signOverInfo.oldPayee,
                "The cheque invalid"
            );
        }
    }

    function isChequeValid(
        address payee,
        Cheque memory chequeData,
        SignOver[] memory signOverData
    ) public view returns (bool) {
        require(chequeData.chequeInfo.payee == payee);
        require(
            cheques[chequeData.chequeInfo.chequeId].status != Status.used,
            "The cheque had redeemed"
        );
        require(
            balances[chequeData.chequeInfo.payer] >=
                chequeData.chequeInfo.amount,
            "Not enough balances"
        );
        if (recover(chequeData, address(this)) != chequeData.chequeInfo.payer) {
            return false;
        }
        for (uint256 i = 0; i < signOverData.length; i++) {
            if (
                recover(signOverData[i]) !=
                signOverData[i].signOverInfo.oldPayee
            ) {
                return false;
            }
        }
        return true;
    }

    function recover(Cheque memory chequeData, address addr)
        internal
        pure
        returns (address)
    {
        bytes32 hash = keccak256(
            abi.encodePacked(
                chequeData.chequeInfo.chequeId,
                chequeData.chequeInfo.payer,
                chequeData.chequeInfo.payee,
                chequeData.chequeInfo.amount,
                addr,
                chequeData.chequeInfo.validFrom,
                chequeData.chequeInfo.validThru
            )
        );
        bytes32 message = ECDSA.toEthSignedMessageHash(hash);
        return ECDSA.recover(message, chequeData.sig);
    }

    function recover(SignOver memory signOverData)
        internal
        pure
        returns (address)
    {
        bytes32 hash = keccak256(
            abi.encodePacked(
                bytes4(0xFFFFDEAD),
                signOverData.signOverInfo.counter,
                signOverData.signOverInfo.chequeId,
                signOverData.signOverInfo.oldPayee,
                signOverData.signOverInfo.newPayee
            )
        );
        bytes32 message = ECDSA.toEthSignedMessageHash(hash);
        return ECDSA.recover(message, signOverData.sig);
    }
}
