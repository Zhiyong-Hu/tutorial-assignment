// We import Chai to use its asserting functions here.
const { expect } = require("chai");
const { Wallet } = require("ethers");

describe("ChequeBank contract", function () {

  //bytes32
  let chequeId = "1";
  //address
  let payer;
  //address
  let payee;
  //uint256
  let amount = ethers.utils.parseEther("1");
  //address
  let contractAddress;
  //uint32
  let validFrom = 0;
  //uint32
  let validThru = 0;
  let contract;
  let owner;
  let addr1;
  let addr2;

  beforeEach(async function () {
    ChequeBank = await ethers.getContractFactory("ChequeBank");
    [owner, addr1, addr2] = await ethers.getSigners();
    contract = await ChequeBank.deploy();
    contractAddress = contract.address;
    payer = owner.address;
    payee = addr1.address;
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
        chequeId: ethers.utils.formatBytes32String(chequeId),
        validFrom: validFrom,
        validThru: validThru,
        payee: payee,
        payer: payer
      };
      let message = ethers.utils.solidityPack(["bytes32", "address", "address", "uint256", "address", "uint32", "uint32"], [ethers.utils.formatBytes32String(chequeId), payer, payee, amount, contractAddress, validFrom, validThru]);
      let hash = ethers.utils.solidityKeccak256(["bytes"], [message]);
      let sig = await owner.signMessage(ethers.utils.arrayify(hash));
      let cheque = {
        chequeInfo: chequeInfo,
        sig: sig
      };
      let counter = 1;
      let signOverInfo = [
        {
          counter: counter,
          chequeId: ethers.utils.formatBytes32String(chequeId),
          oldPayee: payee,
          newPayee: addr2.address
        }
      ];
      let over_message = ethers.utils.solidityPack(["bytes", "uint8", "bytes32", "address", "address"], [0xFFFFDEAD, counter, ethers.utils.formatBytes32String(chequeId), payee, addr2.address]);
      let over_hash = ethers.utils.solidityKeccak256(["bytes"], [over_message]);
      let over_sig = await owner.signMessage(ethers.utils.arrayify(over_hash));
      let signOver = {
        signOverInfo: signOverInfo,
        sig: over_sig
      };

      await expect(contract.isChequeValid(payee, cheque, signOver)).to.be.revertedWith("Not enough balances");
      await contract.deposit({ value: amount })
      expect(await contract.isChequeValid(payee, cheque, signOver)).to.equal(true);
      await contract.revoke(ethers.utils.formatBytes32String(chequeId))
      await expect(contract.isChequeValid(payee, cheque, signOver)).to.be.revertedWith("The cheque had redeemed");
    });
  });

  describe("redeem", function () {
    it("", async function () {

    });
  });
})