// require("@nomicfoundation/hardhat-toolbox");

/** @type import('hardhat/config').HardhatUserConfig */
require("@nomicfoundation/hardhat-verify");
require("dotenv").config();

module.exports = {
  solidity: {
    compilers: [
      {
        version: "0.8.18",
      },
      {
        version: "0.8.20",
        settings: {
          optimizer: {
            enabled: true,
            runs: 1000,
          },
          viaIR: true, // Add this line
        },
      },
    ],
  },
  networks: {
    hardhat: {
      chainId: 555,
      gas: 3000000,
      gasPrice: 8000000000,
      blockGasLimit: 3000000,
    },
    eth: {
      url: process.env.ETHMAIN,
      accounts: [process.env.BSC_MAINNET_KEY],
    },
    goerli_test: {
      url: process.env.GOERLITEST,
      accounts: [process.env.PRIVATE_KEY_TEST],
    },
    sepolia_test: {
      url: process.env.SEPOLIATEST,
      accounts: [process.env.PRIVATE_KEY_TEST],
    },
    bsc_test: {
      url: process.env.BSCTEST,
      accounts: [process.env.PRIVATE_KEY_TEST],
    },
    bsc_main: {
      url: process.env.BSCMAIN,
      accounts: [process.env.BSC_MAINNET_KEY],
    },
    polygon_main: {
      url: process.env.POLYGONMAIN,
      accounts: [process.env.BSC_MAINNET_KEY],
    },
    arbitruim_main: {
      url: process.env.ARBIMAIN,
      accounts: [process.env.BSC_MAINNET_KEY],
    },
    avalanche_main: {
      url: process.env.AVAMAIN,
      accounts: [process.env.BSC_MAINNET_KEY],
    },
  },
  // etherscan: {
  //   apiKey: process.env.VERIFYAPI,
  // },
  etherscan: {
    apiKey: {
      mainnet: process.env.VERIFYAPI,
      sepolia: process.env.ETHERSCANAPI,
      goerli: process.env.ETHERSCANAPI,
    },
  },
  sourcify: {
    // Disabled by default
    // Doesn't need an API key
    enabled: true,
  },
};
