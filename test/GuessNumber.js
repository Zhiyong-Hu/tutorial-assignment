// We import Chai to use its asserting functions here.
const { expect } = require("chai");

describe("GuessNumber contract", function () {

  const nonce = "huzhiyong";
  const nonceHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(nonce));
  const number = Math.floor(Math.random() * 1000);
  const nonceNum = nonce + number;
  const nonceNumHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(nonceNum));
  const reward = ethers.utils.parseEther("5");
  const fee = ethers.utils.parseEther("1");
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


    contract = await GuessNumber.deploy(reward, nonceHash, nonceNumHash, { value: reward });
    await contract.deployed();
  });

  describe("Deployment", function () {
    it("Should set the right constructor params and balance", async function () {
      await expect(GuessNumber.deploy(0, nonceHash, nonceNumHash, { value: reward }))
        .to.be.revertedWith("_reward must be greater than zero");
      await expect(GuessNumber.deploy(reward, nonceHash, nonceNumHash, { value: 0 }))
        .to.be.revertedWith("msg.value must be greater than zero");
      await expect(GuessNumber.deploy(reward, nonceHash, nonceNumHash, { value: ethers.utils.parseEther("1") }))
        .to.be.revertedWith("msg.value must be equal _reward");
      expect(await contract.host()).to.equal(owner.address);
      expect(await contract.nonceHash()).to.equal(nonceHash);
      expect(await contract.nonceNumHash()).to.equal(nonceNumHash);
      expect(await contract.reward()).to.equal(reward);
      expect(await waffle.provider.getBalance(contract.address)).to.equal(reward);
    });
  });

  describe("Guess", function () {
    it("Should set the right status", async function () {
      const guessNumber = Math.floor(Math.random() * 1000);
      console.log("guessNumber is %s", guessNumber);
      await expect(contract.guess(guessNumber, { value: fee }))
        .to.be.revertedWith("host can't play the game");
      await expect(contract.connect(addr1).guess(guessNumber, { value: ethers.utils.parseEther("0.5") }))
        .to.be.revertedWith("msg.value must be equal 1 ether");
      let tx = await contract.connect(addr1).guess(guessNumber, { value: fee });
      await tx.wait();
      expect(await contract.gamers(addr1.address)).to.equal(guessNumber);
      expect(await contract.guessed(addr1.address)).to.equal(true);
      await expect(contract.connect(addr1).guess(guessNumber, { value: fee }))
        .to.be.revertedWith("gamer already played");
    });
  });

});