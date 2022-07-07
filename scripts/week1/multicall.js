const { aggregate, createWatcher } = require("@makerdao/multicall");
const { ethers } = require("ethers");

let CONTRACT_ADDRESS = "0x49354813d8BFCa86f778DfF4120ad80E4D96D74E"
const citys = ["shanghai", "hongkong", "london"];
let batchId = 36698188;

// Alternatively the rpcUrl and multicallAddress can be specified manually
const config = {
    rpcUrl: 'https://evm-t3.cronos.org',
    // multicallAddress: '0x2E20b73235cE8E941A35654c9d1D55DD057F83B9',
    multicallAddress: '0x47c655D6bE8c362A4Fd0accF6d76c58CBc3006A6',
    interval: 1000
};

(async () => {
    let result = await aggregate(
        [
            {
                target: CONTRACT_ADDRESS,
                call: ['getWeather(uint32,bytes32)(uint32)', batchId, ethers.utils.formatBytes32String(citys[0])],
                returns: [[citys[0]]]
            },
            {
                target: CONTRACT_ADDRESS,
                call: ['getWeather(uint32,bytes32)(uint32)', batchId, ethers.utils.formatBytes32String(citys[1])],
                returns: [[citys[1]]]
            },
            {
                target: CONTRACT_ADDRESS,
                call: ['getWeather(uint32,bytes32)(uint32)', batchId, ethers.utils.formatBytes32String(citys[2])],
                returns: [[citys[2]]]
            }
        ],
        config
    );
    console.log("aggregate : ", result);
    for (var i = 0; i < citys.length; i++) {
        console.log("The %s temperature is %s", citys[i], result.results.transformed[citys[i]]);
    }
})();


(async () => {
    const watcher = createWatcher(
        [
            {
                target: CONTRACT_ADDRESS,
                call: ['getWeather(uint32,bytes32)(uint32)', batchId, ethers.utils.formatBytes32String(citys[0])],
                returns: [[citys[0]]]
            },
            {
                target: CONTRACT_ADDRESS,
                call: ['getWeather(uint32,bytes32)(uint32)', batchId, ethers.utils.formatBytes32String(citys[1])],
                returns: [[citys[1]]]
            },
            {
                target: CONTRACT_ADDRESS,
                call: ['getWeather(uint32,bytes32)(uint32)', batchId, ethers.utils.formatBytes32String(citys[2])],
                returns: [[citys[2]]]
            }
        ],
        config
    );
    watcher.subscribe(update => {
        console.log("watcher : ", JSON.stringify(update, null, ' '));
    });

    watcher.start();
})();

