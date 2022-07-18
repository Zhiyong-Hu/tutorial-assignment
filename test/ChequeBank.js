// We import Chai to use its asserting functions here.
const { expect } = require("chai");
const { Wallet } = require("ethers");

describe("GuessNumber contract", function () {

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
  let ChequeBank;
  let contract;
  let owner;

  beforeEach(async function () {
    ChequeBank = await ethers.getContractFactory("ChequeBank");
    [owner, addr1] = await ethers.getSigners();
    contract = await ChequeBank.deploy();
    contractAddress = contract.address;
    payer = owner.address;
    payee = addr1.address;
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
      expect(await contract.isChequeValid(payee, chequeData, signOverData)).to.equal(true);
    });
  });

  describe("guess", function () {
    it("Should set the right state", async function () {

    });
  });
})