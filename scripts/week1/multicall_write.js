async function main() {
    // get a signer
    const [signer] = await hre.ethers.getSigners();
    const abi = [
        "function aggregate(tuple(address target, bytes callData)[] calls) returns (uint256, bytes[] returnData)"
    ];

    // The Contract Address
    let proxyAddress = "0x47c655D6bE8c362A4Fd0accF6d76c58CBc3006A6";

    // Connect Contract
    let contract = new ethers.Contract(proxyAddress, abi, signer);

    console.log('Connect Contract %s is OK', proxyAddress);

    let targetContractAddress = "0x49354813d8BFCa86f778DfF4120ad80E4D96D74E";
    let targetABI = [
        "function reportWeather(uint32 batchId, bytes32 cityName, uint32 temperature) external",
        "function getWeather(uint32 batchId, bytes32 cityName) public view returns (uint32)"
    ];
    let targetIface = new ethers.utils.Interface(targetABI);
    // build args
    const citys = ["shanghai", "hongkong", "london"];
    let batchId = 36698188;
    let temperature = 34;
    const calls = [
        {
            target: targetContractAddress,
            callData: targetIface.encodeFunctionData("reportWeather", [batchId, ethers.utils.formatBytes32String(citys[0]), temperature])
        },
        {
            target: targetContractAddress,
            callData: targetIface.encodeFunctionData("reportWeather", [batchId, ethers.utils.formatBytes32String(citys[1]), temperature])
        },
        {
            target: targetContractAddress,
            callData: targetIface.encodeFunctionData("reportWeather", [batchId, ethers.utils.formatBytes32String(citys[2]), temperature])
        }
    ];

    // call contract
    const tx = await contract.aggregate(calls, { gasLimit: 600000 });
    console.log("The Txn Hash is %s", tx.hash);
    await tx.wait();
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });