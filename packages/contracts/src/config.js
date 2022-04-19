// environmental configurations for the dapp for different environments
const config = {
    apiUrl: "https://backend-prod.epns.io/apis", //the right backend URL to be used
    toolingApiUrl: "https://tooling.epns.io/apis", //tooling backend
    allowedNetworks: [
        1, //for eth
        // 137 //for polygon
    ],
    coreContractChain: 1, //the chain id of the network which the core contract relies on
    coreRPC: "https://mainnet.infura.io/v3/4ff53a5254144d988a8318210b56f47a",
    googleAnalyticsId: "UA-165415629-1"
};

export default config;