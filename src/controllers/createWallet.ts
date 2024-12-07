import { CdpAgentkit } from "@coinbase/cdp-agentkit-core";
import * as fs from "fs";
import * as dotenv from "dotenv";

dotenv.config();

const WALLET_DATA_FILE = "wallet_data.txt";

export async function createOrLoadWallet() {
  try {
    // Check if wallet data exists
    if (fs.existsSync(WALLET_DATA_FILE)) {
      const walletData = fs.readFileSync(WALLET_DATA_FILE, "utf8");
      console.log("Existing wallet loaded");
      return walletData;
    }

    // Create new wallet if none exists
    const config = {
      networkId: process.env.NETWORK_ID || "base-sepolia",
    };

    const agentkit = await CdpAgentkit.configureWithWallet(config);
    const exportedWallet = await agentkit.exportWallet();

    // Save the wallet data
    fs.writeFileSync(WALLET_DATA_FILE, exportedWallet);
    console.log("New wallet created and saved");

    return exportedWallet;
  } catch (error) {
    console.error("Error in wallet creation/loading:", error);
    throw error;
  }
}
