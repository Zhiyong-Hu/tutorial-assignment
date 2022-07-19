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
      let message = ethers.utils.solidityPack(["bytes32", "address", "address", "uint256", "address", "uint32", "uint32"], [ethers.utils.formatBytes32String(chequeId), payer, payee, amount, contractAddress, validFrom, validThru]);
      let hash = ethers.utils.solidityKeccak256(["bytes"], [message]);
      let sig = await owner.signMessage(ethers.utils.arrayify(hash));
      let chequeInfo = {
        amount: amount,
        chequeId: ethers.utils.formatBytes32String(chequeId),
        validFrom: validFrom,
        validThru: validThru,
        payee: payee,
        payer: payer
      };
      let chequeData = {
        chequeInfo: chequeInfo,
        sig: sig
      };
      let signOverData = [];

      await expect(contract.isChequeValid(payee, chequeData, signOverData)).to.be.revertedWith("Not enough balances");
      await contract.deposit({ value: amount })
      expect(await contract.isChequeValid(payee, chequeData, signOverData)).to.equal(true);
      await contract.revoke(ethers.utils.formatBytes32String(chequeId))
      await expect(contract.isChequeValid(payee, chequeData, signOverData)).to.be.revertedWith("The cheque had redeemed");
    });
  });

  describe("redeem", function () {
    it("", async function () {

    });
  });
})