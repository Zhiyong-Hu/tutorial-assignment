// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "hardhat/console.sol";

library Address {
    function sendValue(address payable recipient, uint256 amount) internal {
        require(
            address(this).balance >= amount,
            "Address: insufficient balance"
        );

        (bool success, ) = recipient.call{value: amount}("");
        require(
            success,
            "Address: unable to send value, recipient may have reverted"
        );
    }
}

contract ChequeBank {
    enum Status {
        unredeem,
        signOver,
        redeemed,
        revokeed
    }

    mapping(address => uint256) balances;
    mapping(bytes32 => LastInfo) cheques;

    struct LastInfo {
        Status status;
        uint8 counter;
        address payer;
        address newPayee;
        address oldPayee;
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

    function getBlockNumber() external view returns (uint256) {
        return block.number;
    }

    function deposit() external payable {
        require(msg.value >= 0);
        balances[msg.sender] += msg.value;
    }

    function withdraw(uint256 amount) external {
        require(balances[msg.sender] >= amount, "Not enough balances");
        balances[msg.sender] -= amount;
        Address.sendValue(payable(msg.sender), amount);
    }

    function withdrawTo(uint256 amount, address payable recipient) external {
        require(balances[msg.sender] >= amount, "Not enough balances");
        balances[msg.sender] -= amount;
        Address.sendValue(recipient, amount);
    }

    function redeem(Cheque memory chequeData) external {
        require(
            cheques[chequeData.chequeInfo.chequeId].status == Status.unredeem,
            "The cheque can't redeem"
        );
        require(
            balances[chequeData.chequeInfo.payer] >=
                chequeData.chequeInfo.amount,
            "Not enough balances"
        );
        if (chequeData.chequeInfo.validFrom > 0) {
            console.log(
                "block number: %s, validFrom: %s",
                block.number,
                chequeData.chequeInfo.validFrom
            );
            require(
                block.number >= chequeData.chequeInfo.validFrom,
                "The cheque invalid"
            );
        }
        if (chequeData.chequeInfo.validThru > 0) {
            console.log(
                "block number: %s, validThru: %s",
                block.number,
                chequeData.chequeInfo.validThru
            );
            require(
                block.number <= chequeData.chequeInfo.validThru,
                "The cheque expired"
            );
        }
        require(
            recover(chequeData, address(this)) == chequeData.chequeInfo.payer,
            "The cheque invalid"
        );

        cheques[chequeData.chequeInfo.chequeId].status = Status.redeemed;
        balances[chequeData.chequeInfo.payer] -= chequeData.chequeInfo.amount;

        Address.sendValue(
            payable(chequeData.chequeInfo.payee),
            chequeData.chequeInfo.amount
        );
    }

    function revoke(Cheque memory chequeData) external {
        require(
            cheques[chequeData.chequeInfo.chequeId].status == Status.unredeem ||
                cheques[chequeData.chequeInfo.chequeId].status ==
                Status.signOver,
            "The cheque have redeemed or revokeed"
        );
        require(
            recover(chequeData, address(this)) == chequeData.chequeInfo.payer,
            "The cheque invalid"
        );
        if (cheques[chequeData.chequeInfo.chequeId].status == Status.unredeem) {
            require(
                msg.sender == chequeData.chequeInfo.payer,
                "The cheque can't revoke"
            );
            cheques[chequeData.chequeInfo.chequeId].status = Status.revokeed;
        } else {
            require(
                msg.sender == cheques[chequeData.chequeInfo.chequeId].oldPayee,
                "The cheque can't revoke"
            );
            cheques[chequeData.chequeInfo.chequeId].status = Status.revokeed;
        }
    }

    function notifySignOver(
        Cheque memory chequeData,
        SignOver memory signOverData
    ) external {
        require(
            signOverData.signOverInfo.counter >= 1 &&
                signOverData.signOverInfo.counter <= 6,
            "The signOver invalid"
        );
        if (signOverData.signOverInfo.counter == 1) {
            require(
                chequeData.chequeInfo.chequeId ==
                    signOverData.signOverInfo.chequeId,
                "The signOver invalid"
            );
            require(
                chequeData.chequeInfo.payee ==
                    signOverData.signOverInfo.oldPayee,
                "The signOver invalid"
            );
            require(
                recover(chequeData, address(this)) ==
                    chequeData.chequeInfo.payer,
                "The cheque invalid"
            );
            require(
                recover(signOverData) == signOverData.signOverInfo.oldPayee,
                "The signOver invalid"
            );
            cheques[signOverData.signOverInfo.chequeId].payer = chequeData
                .chequeInfo
                .payer;
            cheques[signOverData.signOverInfo.chequeId].oldPayee = signOverData
                .signOverInfo
                .oldPayee;
            cheques[signOverData.signOverInfo.chequeId].newPayee = signOverData
                .signOverInfo
                .newPayee;
            cheques[signOverData.signOverInfo.chequeId].status = Status
                .signOver;
            cheques[signOverData.signOverInfo.chequeId].counter = signOverData
                .signOverInfo
                .counter;
        } else {
            require(
                signOverData.signOverInfo.counter ==
                    (cheques[signOverData.signOverInfo.chequeId].counter + 1),
                "The signOver invalid"
            );
            require(
                cheques[signOverData.signOverInfo.chequeId].newPayee ==
                    signOverData.signOverInfo.oldPayee,
                "The signOver invalid"
            );
            require(
                recover(signOverData) == signOverData.signOverInfo.oldPayee,
                "The signOver invalid"
            );
            cheques[signOverData.signOverInfo.chequeId].oldPayee = signOverData
                .signOverInfo
                .oldPayee;
            cheques[signOverData.signOverInfo.chequeId].newPayee = signOverData
                .signOverInfo
                .newPayee;
            cheques[signOverData.signOverInfo.chequeId].counter = signOverData
                .signOverInfo
                .counter;
        }
    }

    function redeemSignOver(
        Cheque memory chequeData,
        SignOver[] memory signOverData
    ) external {
        require(
            cheques[chequeData.chequeInfo.chequeId].status == Status.signOver,
            "The cheque can't redeem"
        );
        require(
            balances[chequeData.chequeInfo.payer] >=
                chequeData.chequeInfo.amount,
            "Not enough balances"
        );
        if (chequeData.chequeInfo.validFrom > 0) {
            require(
                block.number >= chequeData.chequeInfo.validFrom,
                "The cheque can't redeem"
            );
        }
        if (chequeData.chequeInfo.validThru > 0) {
            require(
                block.number <= chequeData.chequeInfo.validThru,
                "The cheque can't redeem"
            );
        }
        require(
            recover(chequeData, address(this)) == chequeData.chequeInfo.payer,
            "The cheque invalid"
        );
        address oldPayee = chequeData.chequeInfo.payee;
        for (uint256 i = 0; i < signOverData.length; i++) {
            require(signOverData[i].signOverInfo.counter == (i + 1));
            require(
                oldPayee == signOverData[i].signOverInfo.oldPayee,
                "The cheque invalid"
            );
            require(
                recover(signOverData[i]) ==
                    signOverData[i].signOverInfo.oldPayee,
                "The cheque invalid"
            );
            oldPayee = signOverData[i].signOverInfo.newPayee;
            if (i == (signOverData.length - 1)) {
                require(
                    signOverData[i].signOverInfo.counter ==
                        cheques[chequeData.chequeInfo.chequeId].counter
                );
                require(
                    signOverData[i].signOverInfo.newPayee ==
                        cheques[chequeData.chequeInfo.chequeId].newPayee
                );
            }
        }
        Address.sendValue(
            payable(cheques[chequeData.chequeInfo.chequeId].newPayee),
            chequeData.chequeInfo.amount
        );
    }

    function isChequeValid(
        address payee,
        Cheque memory chequeData,
        SignOver[] memory signOverData
    ) public view returns (bool) {
        if (cheques[chequeData.chequeInfo.chequeId].status == Status.redeemed) {
            return false;
        }
        if (cheques[chequeData.chequeInfo.chequeId].status == Status.revokeed) {
            return false;
        }
        if (recover(chequeData, address(this)) != chequeData.chequeInfo.payer) {
            return false;
        }
        address oldPayee = chequeData.chequeInfo.payee;
        for (uint256 i = 0; i < signOverData.length; i++) {
            require(signOverData[i].signOverInfo.counter == (i + 1));
            require(
                oldPayee == signOverData[i].signOverInfo.oldPayee,
                "The cheque invalid"
            );
            if (
                recover(signOverData[i]) !=
                signOverData[i].signOverInfo.oldPayee
            ) {
                return false;
            }
            oldPayee = signOverData[i].signOverInfo.newPayee;
            if (i == (signOverData.length - 1)) {
                require(payee == signOverData[i].signOverInfo.newPayee);
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
