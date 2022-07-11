const { ethers, waffle } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Deploying contracts with the account:", deployer.address);

  console.log("Account balance:", (await deployer.getBalance()).toString());

  const GuessNumber = await ethers.getContractFactory("GuessNumber");

  const nonce = "huzhiyong";
  const nonceHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(nonce));
  const number = Math.floor(Math.random() * 1000);
  const nonceNum = nonce + number;
  const nonceNumHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(nonceNum));
  const reward = ethers.utils.parseEther("5");
  console.log("reward is %s", reward);
  console.log("nonce is %s, number is %s, nonceNum is %s", nonce, number, nonceNum);
  console.log("nonceHash is %s, nonceNumHash is %s", nonceHash, nonceNumHash);

  const contract = await GuessNumber.deploy(nonceHash, nonceNumHash, { value: reward });

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