const { waffle } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Deploying contracts with the account:", deployer.address);

  console.log("Account balance:", (await deployer.getBalance()).toString());

  const SimpleContract = await ethers.getContractFactory("SimpleContract");
  const contract = await SimpleContract.deploy();

  console.log("SimpleContract address:", contract.address);

  console.log("Account balance:", (await deployer.getBalance()).toString());

  console.log("Account balance:", (await waffle.provider.getBalance(contract.address)).toString());

  await contract.loop({ gasLimit: 600000 });

  console.log("Account balance:", (await deployer.getBalance()).toString());
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });