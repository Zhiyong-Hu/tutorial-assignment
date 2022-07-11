// We import Chai to use its asserting functions here.
const { expect } = require("chai");

describe("GuessNumber contract", function () {

  const nonce = "huzhiyong";
  const nonceHash = ethers.utils.keccak256(ethers.utils.formatBytes32String(nonce));
  const number = Math.floor(Math.random() * 1000);
  const nonceNumHash = ethers.utils.keccak256(ethers.utils.defaultAbiCoder.encode(["bytes32", "uint"], [ethers.utils.formatBytes32String(nonce), number]));
  const deposit = ethers.utils.parseEther("1");
  const other_deposit = ethers.utils.parseEther("0.5");
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

  describe("Reveal", function () {
    it("Should set the right status", async function () {
      console.log("number is %s", number);
      await expect(contract.connect(addr1).reveal(ethers.utils.formatBytes32String(nonce), number))
        .to.be.revertedWith("Only the host can operation");
      const guessNumber1 = number - 1;
      const guessNumber2 = number - 3;
      let tx1 = await contract.connect(addr1).guess(guessNumber1, { value: deposit });
      await tx1.wait();
      let addr1_balance = await addr1.getBalance()
      console.log("addr1_balance is %s", addr1_balance);
      let tx2 = await contract.connect(addr2).guess(guessNumber2, { value: deposit });
      await tx2.wait();
      let addr2_balance = await addr2.getBalance()
      console.log("addr2_balance is %s", addr2_balance);
      console.log("contract_balance is %s", await waffle.provider.getBalance(contract.address));
      let tx = await contract.reveal(ethers.utils.formatBytes32String(nonce), number);
      await tx.wait();
      console.log("addr1_balance is %s", await addr1.getBalance());
      console.log("addr2_balance is %s", await addr2.getBalance());
      console.log("contract_balance is %s", await waffle.provider.getBalance(contract.address));
      expect(await waffle.provider.getBalance(contract.address)).to.equal(0);
      expect(await addr1.getBalance()).to.equal(ethers.BigNumber.from(addr1_balance).add("3000000000000000000"));
      expect(await addr2.getBalance()).to.equal(addr2_balance);
    });
  });
});