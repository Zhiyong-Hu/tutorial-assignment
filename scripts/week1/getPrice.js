const {ethers} = require("ethers");

let ABI = ["function latestAnswer() external view returns (int256)"];

let CONTRACT_ADDRESS = "0xb3DF0a9582361db08EC100bd5d8CB70fa8579f4B";

let provider = new ethers.providers.JsonRpcProvider("https://evm-cronos.crypto.org");

let contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, provider);

contract.latestAnswer().then((value) => {
    console.log("The price is %s", value / 10e8);
});