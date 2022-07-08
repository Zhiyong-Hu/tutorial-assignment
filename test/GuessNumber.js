// We import Chai to use its asserting functions here.
const { expect } = require("chai");

describe("GuessNumber contract", function () {

  const nonce = "HELLO";
  const nonceHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(nonce));
  const number = Math.floor(Math.random() * 1000);
  const nonceNum = nonce + number;
  const nonceNumHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(nonceNum));
  const reward = ethers.utils.parseEther("5");
  console.log("nonceHash is %s, nonceNumHash is %s", nonceHash, nonceNumHash);
  let GuessNumber;
  let contract;
  let owner;
  let addr1;
  let addr2;
  let addrs;

  // `beforeEach` will run before each test, re-deploying the contract every
  // time. It receives a callback, which can be async.
  beforeEach(async function () {
    // Get the ContractFactory and Signers here.
    GuessNumber = await ethers.getContractFactory("GuessNumber");
    [owner, addr1, addr2, ...addrs] = await ethers.getSigners();

    contract = await GuessNumber.deploy(reward, nonceHash, nonceNumHash, { value: reward });
  });

  describe("Deployment", function () {
    it("Should set the right constructor params and balance", async function () {
      console.log("nonceHash is %s, nonceNumHash is %s", await contract.nonceHash(), await contract.nonceNumHash());
      expect(await contract.host()).to.equal(owner.address);
      expect(await contract.nonceHash()).to.equal(nonceHash);
      expect(await contract.nonceNumHash()).to.equal(nonceNumHash);
      expect(await contract.reward()).to.equal(reward);
      expect(await contract.deployTransaction.value).to.equal(reward);
    });
  });

});