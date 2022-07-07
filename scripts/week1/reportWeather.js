const axios = require('axios').default;
const {ethers} = require("ethers");

let ABI = ["function reportWeather(uint32, bytes32, uint32)", "function getWeather(uint32, bytes32) public view returns (uint32)"];
let CONTRACT_ADDRESS = "0x49354813d8BFCa86f778DfF4120ad80E4D96D74E"
let provider = new ethers.providers.JsonRpcProvider("https://evm-t3.cronos.org");
let private_key = "78e562f34fabb4fa55c48f7f184bcd2c585d4eaacb53adb1e77c7df0d1e407e6"
let wallet = new ethers.Wallet(private_key)
let walletSigner = wallet.connect(provider);
let contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, walletSigner);
const citys = ["shanghai", "hongkong", "london"];

async function main() {
    let batchId = Math.round(Math.random() * 100000000);
    console.log("The batchId is : ", batchId);
    console.log("write date start");
    for (var i = 0; i < citys.length; i++) {
        let response = await axios.get('https://goweather.herokuapp.com/weather/' + citys[i]);
        let temperature = parseInt((response.data.temperature || '').match(/\d+/g)[0]);
        if (temperature != null) {
            console.log("The %s temperature is %s", citys[i], temperature);
            let tx = await contract.reportWeather(batchId, ethers.utils.formatBytes32String(citys[i]), temperature);
            console.log("The Txn Hash is %s", tx.hash);
            await tx.wait();
        }
    }
    console.log("write date end");
    console.log("read date start");
    for (var i = 0; i < citys.length; i++) {
        let result = await contract.getWeather(batchId, ethers.utils.formatBytes32String(citys[i]));
        console.log("The %s temperature is %s", citys[i], result);
    }
    console.log("read date end");
}

main();