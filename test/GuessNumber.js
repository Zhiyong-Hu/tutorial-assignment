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

  describe("constructor", function () {
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

  describe("guess", function () {
    it("Should set the right state", async function () {
      const guessNumber = Math.floor(Math.random() * 1000);
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

  describe("reveal", function () {
    it("Should be right for concluded", async function () {
      await expect(contract.connect(addr1).reveal(ethers.utils.formatBytes32String(nonce), number))
        .to.be.revertedWith("Only the host can operation");
      const guessNumber1 = number - 1;
      const guessNumber2 = number - 3;
      let tx1 = await contract.connect(addr1).guess(guessNumber1, { value: deposit });
      await tx1.wait();
      let tx2 = await contract.connect(addr2).guess(guessNumber2, { value: deposit });
      await tx2.wait();
      let tx = await contract.reveal(ethers.utils.formatBytes32String(nonce), number);
      await tx.wait();
      expect(await waffle.provider.getBalance(contract.address)).to.equal(ethers.utils.parseEther("3"));
      expect(await contract.pendingWithdrawals(addr1.address)).to.equal(ethers.utils.parseEther("3"));
      expect(await contract.pendingWithdrawals(addr2.address)).to.equal(0);
    });
  });

  describe("withdraw", function () {
    it("Should update right balances after withdraw", async function () {
      const guessNumber1 = number - 1;
      const guessNumber2 = number - 3;
      let tx1 = await contract.connect(addr1).guess(guessNumber1, { value: deposit });
      await tx1.wait();
      let tx2 = await contract.connect(addr2).guess(guessNumber2, { value: deposit });
      await tx2.wait();
      let tx = await contract.reveal(ethers.utils.formatBytes32String(nonce), number);
      await tx.wait();
      await expect(await contract.connect(addr1).withdraw())
        .to.changeEtherBalances([addr1, contract], [ethers.utils.parseEther("3"), ethers.utils.parseEther("-3")]);
    });
  });

});

describe("Test Case", function () {
  const nonce = "HELLO";
  const nonceHash = ethers.utils.keccak256(ethers.utils.formatBytes32String(nonce));
  const deposit = ethers.utils.parseEther("1");
  let GuessNumber;
  let owner, addr1, addr2;

  beforeEach(async function () {
    // Get the ContractFactory and Signers here.
    GuessNumber = await ethers.getContractFactory("GuessNumber");
    [owner, addr1, addr2] = await ethers.getSigners();
  });

  it("case 1", async function () {
    const number = 999;
    const nonceNumHash = ethers.utils.keccak256(ethers.utils.defaultAbiCoder.encode(["bytes32", "uint"], [ethers.utils.formatBytes32String(nonce), number]));
    let contract = await GuessNumber.deploy(nonceHash, nonceNumHash, { value: deposit });

    let tx1 = await contract.connect(addr1).guess(800, { value: deposit });
    await tx1.wait();

    let tx2 = await contract.connect(addr2).guess(900, { value: deposit });
    await tx2.wait();

    await expect(await contract.reveal(ethers.utils.formatBytes32String(nonce), number))
      .to.emit(contract, 'transfered')
      .withArgs(addr2.address, ethers.utils.parseEther("3"));
    expect(await contract.pendingWithdrawals(addr1.address)).to.equal(0);
    expect(await contract.pendingWithdrawals(addr2.address)).to.equal(ethers.utils.parseEther("3"));
  });

  it("case 2", async function () {
    const number = 999;
    const nonceNumHash = ethers.utils.keccak256(ethers.utils.defaultAbiCoder.encode(["bytes32", "uint"], [ethers.utils.formatBytes32String(nonce), number]));
    let contract = await GuessNumber.deploy(nonceHash, nonceNumHash, { value: deposit });

    await expect(contract.connect(addr1).guess(800, { value: ethers.utils.parseEther("2") }))
      .to.be.revertedWith("msg.value must be equal deposit");
  });

  it("case 3", async function () {
    const number = 500;
    const nonceNumHash = ethers.utils.keccak256(ethers.utils.defaultAbiCoder.encode(["bytes32", "uint"], [ethers.utils.formatBytes32String(nonce), number]));
    let contract = await GuessNumber.deploy(nonceHash, nonceNumHash, { value: deposit });

    let tx1 = await contract.connect(addr1).guess(450, { value: deposit });
    await tx1.wait();

    let tx2 = await contract.connect(addr2).guess(550, { value: deposit });
    await tx2.wait();

    let tx = await contract.reveal(ethers.utils.formatBytes32String(nonce), number);

    await expect(tx)
      .to.emit(contract, 'transfered')
      .withArgs(addr1.address, ethers.utils.parseEther("1.5"));
    await expect(tx)
      .to.emit(contract, 'transfered')
      .withArgs(addr2.address, ethers.utils.parseEther("1.5"));
    expect(await contract.pendingWithdrawals(addr1.address)).to.equal(ethers.utils.parseEther("1.5"));
    expect(await contract.pendingWithdrawals(addr2.address)).to.equal(ethers.utils.parseEther("1.5"));
  });

  it("case 4", async function () {
    const number = 1415;
    const nonceNumHash = ethers.utils.keccak256(ethers.utils.defaultAbiCoder.encode(["bytes32", "uint"], [ethers.utils.formatBytes32String(nonce), number]));
    let contract = await GuessNumber.deploy(nonceHash, nonceNumHash, { value: deposit });

    let tx1 = await contract.connect(addr1).guess(1, { value: deposit });
    await tx1.wait();

    let tx2 = await contract.connect(addr2).guess(2, { value: deposit });
    await tx2.wait();

    let tx = await contract.reveal(ethers.utils.formatBytes32String(nonce), number);

    await expect(tx)
      .to.emit(contract, 'transfered')
      .withArgs(addr1.address, ethers.utils.parseEther("1.5"));
    await expect(tx)
      .to.emit(contract, 'transfered')
      .withArgs(addr2.address, ethers.utils.parseEther("1.5"));
    expect(await contract.pendingWithdrawals(addr1.address)).to.equal(ethers.utils.parseEther("1.5"));
    expect(await contract.pendingWithdrawals(addr2.address)).to.equal(ethers.utils.parseEther("1.5"));
  });
});