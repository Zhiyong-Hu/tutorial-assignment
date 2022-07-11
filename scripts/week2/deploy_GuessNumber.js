const { ethers, waffle } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Deploying contracts with the account:", deployer.address);

  console.log("Account balance:", (await deployer.getBalance()).toString());

  const GuessNumber = await ethers.getContractFactory("GuessNumber");

  const nonce = "huzhiyong";
  const nonceHash = ethers.utils.keccak256(ethers.utils.formatBytes32String(nonce));
  const number = Math.floor(Math.random() * 1000);
  const nonceNumHash = ethers.utils.keccak256(ethers.utils.defaultAbiCoder.encode(["bytes32", "uint"], [ethers.utils.formatBytes32String(nonce), number]));
  const deposit = ethers.utils.parseEther("1");
  console.log("deposit is %s", deposit);
  console.log("nonce is %s, number is %s", nonce, number);
  console.log("nonceHash is %s, nonceNumHash is %s", nonceHash, nonceNumHash);

  const contract = await GuessNumber.deploy(nonceHash, nonceNumHash, { value: deposit });

  console.log("GuessNumber contract address:", contract.address);
  console.log("Account balance:", (await deployer.getBalance()).toString());
  const provider = waffle.provider;
  const balance = await provider.getBalance(contract.address);
  console.log("Contract balance:", balance.toString());
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });