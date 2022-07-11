// We import Chai to use its asserting functions here.
const { expect } = require("chai");

describe("GuessNumber contract", function () {

  const nonce = "huzhiyong";
  const nonceHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(nonce));
  const number = Math.floor(Math.random() * 1000);
  const nonceNum = nonce + number;
  const nonceNumHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(nonceNum));
  const deposit = ethers.utils.parseEther("1");
  const other_deposit = ethers.utils.parseEther("0.5");
  console.log("nonceHash is %s, nonceNumHash is %s", nonceHash, nonceNumHash);
  let GuessNumber;
  let contract;
  let owner;
  let addr1;
  let addr2;

  // `beforeEach` will run before each test, re-deploying the contract every
  // time. It receives a callback, which can be async.
  beforeEach(async function () {
    // Get the ContractFactory and Signers here.
    GuessNumber = await ethers.getContractFactory("GuessNumber");
    [owner, addr1, addr2] = await ethers.getSigners();


    contract = await GuessNumber.deploy(nonceHash, nonceNumHash, { value: deposit });
    await contract.deployed();
  });

  describe("Deployment", function () {
    it("Should set the right constructor params and balance", async function () {
      await expect(GuessNumber.deploy(nonceHash, nonceNumHash, { value: 0 }))
        .to.be.revertedWith("host deposit must be greater than 0");
      expect(await contract.host()).to.equal(owner.address);
      expect(await contract.nonceHash()).to.equal(nonceHash);
      expect(await contract.nonceNumHash()).to.equal(nonceNumHash);
      expect(await contract.deposit()).to.equal(deposit);
      expect(await waffle.provider.getBalance(contract.address)).to.equal(deposit);
    });
  });

  describe("Guess", function () {
    it("Should set the right status", async function () {
      const guessNumber = Math.floor(Math.random() * 1000);
      console.log("guessNumber is %s", guessNumber);
      await expect(contract.connect(addr1).guess(guessNumber, { value: other_deposit }))
        .to.be.revertedWith("msg.value must be equal deposit");
      let tx = await contract.connect(addr1).guess(guessNumber, { value: deposit });
      await tx.wait();
      expect(await contract.palyers(addr1.address)).to.equal(guessNumber);
      expect(await contract.isGuess(addr1.address)).to.equal(true);
      expect(await contract.guessNumbers(guessNumber)).to.equal(true);
      await expect(contract.connect(addr1).guess(guessNumber, { value: deposit }))
        .to.be.revertedWith("gamer already played");
      await expect(contract.connect(addr2).guess(guessNumber, { value: deposit }))
        .to.be.revertedWith("the number have guessed");
    });
  });

});