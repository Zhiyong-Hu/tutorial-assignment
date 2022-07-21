async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Deploying contracts with the account:", deployer.address);

  console.log("Account balance:", (await deployer.getBalance()).toString());
  const WATER = await ethers.getContractFactory("WATER");
  const water = await WATER.deploy(1000);
  const MELON = await ethers.getContractFactory("MELON");
  const melon = await MELON.deploy(1000);

  const FruitStand = await ethers.getContractFactory("FruitStand");
  const fruitStand = await FruitStand.deploy(water.address, melon.address);
  console.log("Token address:", fruitStand.address);

}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });