import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import * as dotenv from "dotenv";
dotenv.config();

const DEPLOYER_PRIVATE_KEY = process.env.DEPLOYER_PRIVATE_KEY && process.env.DEPLOYER_PRIVATE_KEY.startsWith("0x") && process.env.DEPLOYER_PRIVATE_KEY.length === 66
  ? process.env.DEPLOYER_PRIVATE_KEY
  : "0x0000000000000000000000000000000000000000000000000000000000000001";

const config: HardhatUserConfig = {
  solidity: "0.8.20",
  networks: {
    polygonAmoy: {
      url: process.env.POLYGON_AMOY_RPC_URL || "",
      accounts: [DEPLOYER_PRIVATE_KEY],
    },
  },
};
export default config;
