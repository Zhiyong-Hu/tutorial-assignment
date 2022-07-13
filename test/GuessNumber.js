// We import Chai to use its asserting functions here.
const { expect } = require("chai");

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