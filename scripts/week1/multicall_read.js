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
    const calls = [
        {
            target: targetContractAddress,
            callData: targetIface.encodeFunctionData("getWeather", [batchId, ethers.utils.formatBytes32String(citys[0])]),
        },
        {
            target: targetContractAddress,
            callData: targetIface.encodeFunctionData("getWeather", [batchId, ethers.utils.formatBytes32String(citys[1])])
        },
        {
            target: targetContractAddress,
            callData: targetIface.encodeFunctionData("getWeather", [batchId, ethers.utils.formatBytes32String(citys[2])])
        }
    ];

    // call contract
    const result = await contract.callStatic.aggregate(calls);
    console.log("multicallWeather result %s", JSON.stringify(result));
    for (let i = 0; i < citys.length; i++) {
        let data = targetIface.decodeFunctionResult("getWeather", result[1][i]);
        console.log("%s temperature is: %s °C", citys[i], data[0]);
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });