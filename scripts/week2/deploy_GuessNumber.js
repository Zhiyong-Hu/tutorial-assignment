async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Deploying contracts with the account:", deployer.address);

  console.log("Account balance:", (await deployer.getBalance()).toString());

  const GuessNumber = await ethers.getContractFactory("GuessNumber");

  const nonce = "HELLO";
  const nonceHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(nonce));
  const number = Math.floor(Math.random() * 1000);
  const nonceNum = nonce + number;
  const nonceNumHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(nonceNum));
  const reward = ethers.utils.parseEther("5");
  console.log("reward is %s", reward);
  console.log("nonce is %s, number is %s, nonceNum is %s", nonce, number, nonceNum);
  console.log("nonceHash is %s, nonceNumHash is %s", nonceHash, nonceNumHash);

  const contract = await GuessNumber.deploy(reward, ethers.utils.toUtf8Bytes(nonceHash), ethers.utils.toUtf8Bytes(nonceNumHash), { value: reward });

  console.log("GuessNumber contract address:", contract.address);

  let result = await contract.info();
  console.log("The result is %s", result);
  console.log("Account balance:", (await deployer.getBalance()).toString());
  console.log("Contract balance:", contract.deployTransaction.value.toString());
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });