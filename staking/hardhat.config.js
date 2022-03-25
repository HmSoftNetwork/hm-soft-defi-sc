require("@nomiclabs/hardhat-waffle")
require("@nomiclabs/hardhat-truffle5");
require("@nomiclabs/hardhat-etherscan");
require('hardhat-contract-sizer');

const CONFIG = require("./credentials.js");

module.exports = {
    solidity: {
        compilers: [
            {
                version: "0.8.4",
                settings: {
                    optimizer: {
                        enabled: true,
                        runs: 1000,
                    },
                },
            },
        ],
        overrides: {
            "contracts/Mining/MiningFactory.sol": {
                version: "0.6.9",
                settings: {
                    optimizer: {
                        enabled: true,
                        runs: 100,
                    },
                },
            },
            "contracts/Mining/BaseMine.sol": {
                version: "0.6.9",
                settings: {
                    optimizer: {
                        enabled: true,
                        runs: 100,
                    },
                },            
            },
            "contracts/Mining/ERC20Mine.sol": {
                version: "0.6.9",
                settings: {
                    optimizer: {
                        enabled: true,
                        runs: 100,
                    },
                },            
            },
            "contracts/Mining/ReentrancyGuard.sol": {
                version: "0.6.9",
                settings: { }
            },
            "contracts/Mining/SafeMath.sol": {
                version: "0.6.9",
                settings: { }
            },
            "contracts/Mining/RewardVault.sol": {
                version: "0.6.9",
                settings: { }
            },
            "contracts/Mining/IERC20.sol": {
                version: "0.6.9",
                settings: { }
            },
            "contracts/Mining/SafeERC20.sol": {
                version: "0.6.9",
                settings: { }
            },
            "contracts/Mining/Ownable.sol": {
                version: "0.6.9",
                settings: { }
            },
            "contracts/Mining/DecimalMath.sol": {
                version: "0.6.9",
                settings: { }
            },
            "contracts/Mining/InitializableOwnable.sol": {
                version: "0.6.9",
                settings: { }
            },                                
        }
    },
    spdxLicenseIdentifier: {
        overwrite: true,
        runOnCompile: true,
    },
    defaultNetwork: "hardhat",
    mocha: {
        timeout: 1000000000000,
    },

    networks: {
        hardhat: {
            blockGasLimit: 10000000000000,
            allowUnlimitedContractSize: true,
            timeout: 1000000000000,
            accounts: {
                accountsBalance: "100000000000000000000000",
                count: 20,
            },
        },
        bscTestnet: {
            url: `https://data-seed-prebsc-1-s1.binance.org:8545/`,
            accounts: [CONFIG.wallet.PKEY],
            gasPrice: 30000000000,
        },
        rinkeby: {
            url: "https://rinkeby.infura.io/v3/ad9cef41c9c844a7b54d10be24d416e5",
            accounts: [CONFIG.wallet.PKEY],
            // gasPrice: 30000000000,
        },
        kovan: {
            url: "https://kovan.infura.io/v3/ad9cef41c9c844a7b54d10be24d416e5",
            accounts: [CONFIG.wallet.PKEY],
            // gasPrice: 30000000000,
        },
    },

    contractSizer: {
        alphaSort: false,
        runOnCompile: true,
        disambiguatePaths: false,
    },

    etherscan: {
        apiKey: `${CONFIG.etherscan.KEY}`
    }
};
