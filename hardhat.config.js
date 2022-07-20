require("@nomiclabs/hardhat-waffle");
/**
 * @type import('hardhat/config').HardhatUserConfig
 */
task("accounts", "Prints the list of accounts", async (taskArgs, hre) => {
  const accounts = await hre.ethers.getSigners();

  for (const account of accounts) {
    console.log(account.address);
  }
});
const PRIVATE_KEY = "78e562f34fabb4fa55c48f7f184bcd2c585d4eaacb53adb1e77c7df0d1e407e6";
module.exports = {
  solidity: "0.8.0",
  networks: {
    hardhat: {
      chainId: 31337
    },
    "cronos-testnet3": {
      url: "https://evm-t3.cronos.org",
      accounts: [`${PRIVATE_KEY}`]
    },
    "cronos-mainnet": {
      url: "https://evm-cronos.crypto.org",
      accounts: [`${PRIVATE_KEY}`]
    }
  }
};
