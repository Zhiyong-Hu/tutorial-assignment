// We import Chai to use its asserting functions here.
const { expect } = require("chai");
const { Wallet } = require("ethers");

describe("ChequeBank contract", function () {

  //bytes32
  let chequeId = ethers.utils.formatBytes32String("1");
  //uint256
  let amount = ethers.utils.parseEther("1");
  //address
  let contractAddress;
  let contract;
  let owner;
  let addr1;
  let addr2;

  beforeEach(async function () {
    ChequeBank = await ethers.getContractFactory("ChequeBank");
    [owner, addr1, addr2] = await ethers.getSigners();
    contract = await ChequeBank.deploy();
    contractAddress = contract.address;
  });

  describe("basic function", function () {
    it("deposit", async function () {
      await expect(await contract.deposit({ value: amount }))
        .to.changeEtherBalances([owner, contract], [ethers.utils.parseEther("-1"), amount]);
      expect(await contract.balanceOf()).to.equal(amount);
    });
    it("withdraw", async function () {
      await expect(contract.withdraw(amount)).to.be.revertedWith("Not enough balances");
      await contract.deposit({ value: amount });
      await expect(await contract.withdraw(amount))
        .to.changeEtherBalances([owner, contract], [amount, ethers.utils.parseEther("-1")]);
      expect(await contract.balanceOf()).to.equal(0);
    });
    it("withdrawTo", async function () {
      await expect(contract.withdrawTo(amount, addr1.address)).to.be.revertedWith("Not enough balances");
      await contract.deposit({ value: amount });
      await expect(await contract.withdrawTo(amount, addr1.address))
        .to.changeEtherBalances([addr1, contract], [amount, ethers.utils.parseEther("-1")]);
      expect(await contract.balanceOf()).to.equal(0);
    });
  });

  describe("isChequeValid", function () {
    it("", async function () {
      let chequeInfo = {
        amount: amount,
        chequeId: chequeId,
        validFrom: 0,
        validThru: 0,
        payee: addr1.address,
        payer: owner.address
      };
      let message = ethers.utils.solidityPack(["bytes32", "address", "address", "uint256", "address", "uint32", "uint32"], [chequeInfo.chequeId, chequeInfo.payer, chequeInfo.payee, chequeInfo.amount, contractAddress, chequeInfo.validFrom, chequeInfo.validThru]);
      let hash = ethers.utils.solidityKeccak256(["bytes"], [message]);
      let sig = await owner.signMessage(ethers.utils.arrayify(hash));
      let cheque = {
        chequeInfo: chequeInfo,
        sig: sig
      };

      let signOverInfo = {
        counter: 1,
        chequeId: chequeId,
        oldPayee: addr1.address,
        newPayee: addr2.address
      };
      let over_message = ethers.utils.solidityPack(["bytes4", "uint8", "bytes32", "address", "address"], [0xFFFFDEAD, signOverInfo.counter, signOverInfo.chequeId, signOverInfo.oldPayee, signOverInfo.newPayee]);
      let over_hash = ethers.utils.solidityKeccak256(["bytes"], [over_message]);
      let over_sig = await addr1.signMessage(ethers.utils.arrayify(over_hash));
      let signOver = [
        {
          signOverInfo: signOverInfo,
          sig: over_sig
        }
      ];
      let payee = signOverInfo.newPayee;
      expect(await contract.isChequeValid(payee, cheque, signOver)).to.equal(true);
    });
  });

  describe("redeem", function () {
    it("case 1", async function () {
      let blockNumber = await contract.getBlockNumber();
      let chequeInfo = {
        amount: amount,
        chequeId: chequeId,
        validFrom: (blockNumber.toNumber() + 4),
        validThru: blockNumber.toNumber() + 3,
        payee: addr1.address,
        payer: owner.address
      };
      let message = ethers.utils.solidityPack(["bytes32", "address", "address", "uint256", "address", "uint32", "uint32"], [chequeInfo.chequeId, chequeInfo.payer, chequeInfo.payee, chequeInfo.amount, contractAddress, chequeInfo.validFrom, chequeInfo.validThru]);
      let hash = ethers.utils.solidityKeccak256(["bytes"], [message]);
      let sig = await owner.signMessage(ethers.utils.arrayify(hash));
      let cheque = {
        chequeInfo: chequeInfo,
        sig: sig
      };

      await expect(contract.redeem(cheque)).to.be.revertedWith("Not enough balances");
      await contract.deposit({ value: amount });
      await expect(contract.redeem(cheque)).to.be.revertedWith("The cheque invalid");
      await expect(contract.redeem(cheque)).to.be.revertedWith("The cheque expired");
    });
    it("case 2", async function () {
      let chequeInfo = {
        amount: amount,
        chequeId: chequeId,
        validFrom: 0,
        validThru: 0,
        payee: addr1.address,
        payer: owner.address
      };
      let message = ethers.utils.solidityPack(["bytes32", "address", "address", "uint256", "address", "uint32", "uint32"], [chequeInfo.chequeId, chequeInfo.payer, chequeInfo.payee, chequeInfo.amount, contractAddress, chequeInfo.validFrom, chequeInfo.validThru]);
      let hash = ethers.utils.solidityKeccak256(["bytes"], [message]);
      let sig = await owner.signMessage(ethers.utils.arrayify(hash));
      let cheque = {
        chequeInfo: chequeInfo,
        sig: sig
      };

      await contract.deposit({ value: amount });
      await expect(await contract.redeem(cheque))
        .to.changeEtherBalances([addr1, contract], [amount, ethers.utils.parseEther("-1")]);
      expect(await contract.balanceOf()).to.equal(0);
      await expect(contract.redeem(cheque)).to.be.revertedWith("The cheque can't redeem");
    });
  });

  describe("revoke", function () {
    it("case 1", async function () {
      let chequeInfo = {
        amount: amount,
        chequeId: chequeId,
        validFrom: 0,
        validThru: 0,
        payee: addr1.address,
        payer: owner.address
      };
      let message = ethers.utils.solidityPack(["bytes32", "address", "address", "uint256", "address", "uint32", "uint32"], [chequeInfo.chequeId, chequeInfo.payer, chequeInfo.payee, chequeInfo.amount, contractAddress, chequeInfo.validFrom, chequeInfo.validThru]);
      let hash = ethers.utils.solidityKeccak256(["bytes"], [message]);
      let sig = await owner.signMessage(ethers.utils.arrayify(hash));
      let cheque = {
        chequeInfo: chequeInfo,
        sig: sig
      };
      await expect(contract.connect(addr1).revoke(cheque)).to.be.revertedWith("The cheque can't revoke");
      await contract.revoke(cheque);
      await expect(contract.connect(addr1).revoke(cheque)).to.be.revertedWith("The cheque have redeemed or revokeed");
    });
  });

  describe("notifySignOver", function () {
    it("case 1", async function () {
      let chequeInfo = {
        amount: amount,
        chequeId: chequeId,
        validFrom: 0,
        validThru: 0,
        payee: addr1.address,
        payer: owner.address
      };
      let message = ethers.utils.solidityPack(["bytes32", "address", "address", "uint256", "address", "uint32", "uint32"], [chequeInfo.chequeId, chequeInfo.payer, chequeInfo.payee, chequeInfo.amount, contractAddress, chequeInfo.validFrom, chequeInfo.validThru]);
      let hash = ethers.utils.solidityKeccak256(["bytes"], [message]);
      let sig = await owner.signMessage(ethers.utils.arrayify(hash));
      let cheque = {
        chequeInfo: chequeInfo,
        sig: sig
      };
      await expect(contract.connect(addr1).revoke(cheque)).to.be.revertedWith("The cheque can't revoke");
      await contract.revoke(cheque);
      await expect(contract.connect(addr1).revoke(cheque)).to.be.revertedWith("The cheque have redeemed or revokeed");
    });
  });
})