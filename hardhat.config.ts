import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import 'dotenv/config';
import "hardhat-gas-reporter";
import "./scripts/hacks/addSweepToDB"
const config: HardhatUserConfig = {
    solidity: {
        version: "0.8.19",
        settings: {
            optimizer: {
                enabled: true,
                runs: 200,
            },
        },
    },
  networks: {
    mainnet: {
        url: `https://eth.nownodes.io/${process.env.NOWNODES_KEY}`,
        accounts: [`0x${process.env.PRIVATE_KEY}`],
    },
    mainnet2: {
        url: `https://mainnet.infura.io/v3/${process.env.INFURA_PROJECT_ID}`,
        accounts: [`0x${process.env.PRIVATE_KEY}`],
    },
      trx: {
          url: `https://trx.nownodes.io/${process.env.NOWNODES_KEY}`,
          accounts: [`0x${process.env.PRIVATE_KEY}`],
      },
      mumbai: {
          url: `https://polygon-mumbai.infura.io/v3/${process.env.INFURA_PROJECT_ID}`,
          accounts: [`0x${process.env.PRIVATE_KEY}`],
      },
      polygon: {
          url: `https://polygon-mainnet.infura.io/v3/${process.env.INFURA_PROJECT_ID}`,
          accounts: [`0x${process.env.PRIVATE_KEY}`],
      },
    sepolia: {
        url: `https://sepolia.infura.io/v3/${process.env.INFURA_PROJECT_ID}`,
        accounts: [`0x${process.env.PRIVATE_KEY}`],
    }
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API || "",
  },
  gasReporter: {
    enabled: true,
  },
};

export default config;
