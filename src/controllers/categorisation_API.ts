import { Request, Response } from "express";
import { Network, Alchemy } from "alchemy-sdk";
import BigNumber from "bignumber.js";

interface CategorizedToken {
  token_name: string;
  token_symbol: string;
  balance: string;
  token_id?: string;
}

interface CategoryResponse {
  wallet_address: string;
  categories: {
    DeFi: CategorizedToken[];
    Stablecoins: CategorizedToken[];
    Memecoins: CategorizedToken[];
    L1s: CategorizedToken[];
    L2s: CategorizedToken[];
    Infrastructure: CategorizedToken[];
    Gaming: CategorizedToken[];
    DAOs: CategorizedToken[];
    Metaverse: CategorizedToken[];
    GovernanceTokens: CategorizedToken[];
    PrivacyCoins: CategorizedToken[];
    Others: CategorizedToken[];
  };
}

// Token category mappings
const TOKEN_CATEGORIES = {
  DeFi: [
    "UNI",
    "AAVE",
    "COMP",
    "MKR",
    "SNX",
    "YFI",
    "SUSHI",
    "1INCH",
    "BAL",
    "CRV",
    "LRC",
    "DYDX",
    "UMA",
    "BNT",
    "KNC",
    "ALCX",
    "SYN",
    "ALPACA",
    "VELO",
  ],
  Stablecoins: [
    "USDT",
    "USDC",
    "DAI",
    "BUSD",
    "UST",
    "TUSD",
    "GUSD",
    "sUSD",
    "LUSD",
    "FRAX",
  ],
  Memecoins: [
    "DOGE",
    "SHIB",
    "PEPE",
    "WOJAK",
    "BONK",
    "FLOKI",
    "ELON",
    "MINIPEPE",
    "KORAT",
    "POCHITA",
    "REBEL",
  ],
  L1s: [
    "ETH",
    "BNB",
    "SOL",
    "AVAX",
    "ADA",
    "DOT",
    "ATOM",
    "FTM",
    "NEAR",
    "XTZ",
    "ALGO",
    "EGLD",
    "ONE",
    "ICP",
  ],
  L2s: ["MATIC", "ARB", "OP", "ZKS", "IMX", "BOBA", "BETA"],
  Infrastructure: ["LINK", "FIL", "GRT", "BAT", "QNT", "OCEAN", "ICX", "CHZ"],
  Gaming: ["AXS", "SAND", "MANA", "ILV", "ENJ", "RFOX", "ALICE", "GALA"],
  DAOs: ["MKR", "CRV", "UNI", "ENS", "BAL", "DNT"],
  Metaverse: ["MANA", "SAND", "AXS", "ALICE", "HIGH", "GALA"],
  GovernanceTokens: ["UNI", "AAVE", "CRV", "BAL", "COMP", "MKR", "ENS"],
  PrivacyCoins: ["XMR", "ZEC", "SCRT", "DUSK", "PIVX", "GRIN"],
};


type CategoryKey = keyof CategoryResponse["categories"];

async function fetchTokenMetadataWithRetry(alchemy: Alchemy, contractAddress: string, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const metadata = await alchemy.core.getTokenMetadata(contractAddress);
      return metadata;
    } catch (error) {
      if (i === retries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1))); // Exponential backoff
    }
  }
}

export const getWalletCategorization = async (req: Request, res: Response) => {
  try {
    const { address, chain = "ethereum" } = req.params;

    const settings = {
      apiKey: process.env.ALCHEMY_API_KEY,
      network: Network.ETH_MAINNET,
    };
    const alchemy = new Alchemy(settings);

    const tokenBalances = await alchemy.core.getTokenBalances(address);

    const response: CategoryResponse = {
      wallet_address: address,
      categories: {
        DeFi: [],
        Stablecoins: [],
        Memecoins: [],
        L1s: [],
        L2s: [],
        Infrastructure: [],
        Gaming: [],
        DAOs: [],
        Metaverse: [],
        GovernanceTokens: [],
        PrivacyCoins: [],
        Others: [],
      },
    };

    for (const balance of tokenBalances.tokenBalances) {
      try {
        const metadata = await fetchTokenMetadataWithRetry(alchemy, balance.contractAddress);
        if (!metadata) continue; // Skip if metadata is undefined
        
        const tokenInfo: CategorizedToken = {
          token_name: metadata.name || "Unknown",
          token_symbol: metadata.symbol || "Unknown",
          balance: convertBalance(
            balance.tokenBalance ?? undefined,
            metadata.decimals ?? undefined
          ),
        };

        function convertBalance(
          hexBalance: string | undefined,
          decimals: number | undefined
        ): string {
          if (!hexBalance) return "0";
          try {
            const rawBalance = new BigNumber(hexBalance, 16); // Convert hex to decimal
            const adjustedBalance = rawBalance.dividedBy(
              new BigNumber(10).pow(decimals || 0)
            ); // Adjust for decimals
            return adjustedBalance.toString(10); // Return as a human-readable string
          } catch (error) {
            console.error("Error converting balance:", error);
            return "0";
          }
        }

        const symbol = metadata.symbol?.toUpperCase();
        let categorized = false;

        for (const [category, tokens] of Object.entries(TOKEN_CATEGORIES)) {
          if (tokens.includes(symbol || "")) {
            response.categories[category as CategoryKey].push(tokenInfo);
            categorized = true;
            break;
          }
        }

        if (!categorized) {
          response.categories.Others.push(tokenInfo);
        }
      } catch (error) {
        console.error(`Failed to fetch metadata for token ${balance.contractAddress}:`, error);
        continue; // Skip this token and continue with others
      }
    }

    Object.keys(response.categories).forEach((category) => {
      if (response.categories[category as CategoryKey].length === 0) {
        delete response.categories[category as CategoryKey];
      }
    });

    console.log(response);

    res.status(200).json({
      success: true,
      data: response,
    });
  } catch (error) {
    console.error("Categorization error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to categorize wallet holdings",
    });
  }
};
