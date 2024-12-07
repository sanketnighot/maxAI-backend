import { Alchemy, Network, AssetTransfersCategory, AssetTransfersResponse, TokenBalancesResponse } from 'alchemy-sdk';
import axios from 'axios';
import { TokenPrice } from './types';

export const getAlchemyNetwork = (chain: string): Network => {
    switch (chain.toLowerCase()) {
        case 'base':
            return Network.BASE_MAINNET;
        case 'ethereum':
            return Network.ETH_MAINNET;
        case 'optimism':
            return Network.OPT_MAINNET;
        case 'arbitrum':
            return Network.ARB_MAINNET;
        case 'polygon':
            return Network.MATIC_MAINNET;
        case 'avalanche':
            return Network.AVAX_MAINNET;
        default:
            throw new Error('Unsupported chain');
    }
};

export const getAlchemyClient = (chain: string): Alchemy => {
    const config = {
        apiKey: process.env.ALCHEMY_API_KEY,
        network: getAlchemyNetwork(chain)
    };
    return new Alchemy(config);
};

export const fetchTransactionHistory = async (alchemy: Alchemy, address: string): Promise<AssetTransfersResponse> => {
    return await alchemy.core.getAssetTransfers({
        fromBlock: "0x0",
        fromAddress: address,
        category: [
            AssetTransfersCategory.EXTERNAL,
            AssetTransfersCategory.INTERNAL,
            AssetTransfersCategory.ERC20,
        ],
    });
};

export const fetchTokenBalances = async (alchemy: Alchemy, address: string): Promise<TokenBalancesResponse> => {
    return await alchemy.core.getTokenBalances(address);
};

export const fetchTopTokensByMarketCap = async (duration: number): Promise<TokenPrice[]> => {
    try {
        const response = await axios.get(
            'https://api.coingecko.com/api/v3/coins/markets', {
                params: {
                    vs_currency: 'usd',
                    order: 'market_cap_desc',
                    per_page: 100,
                    page: 1,
                    sparkline: false,
                    price_change_percentage: '24h'
                }
            }
        );

        const MIN_MARKET_CAP = 10000000; // $10M minimum market cap
        
        const filteredTokens = response.data
            .filter((token: TokenPrice) => token.market_cap >= MIN_MARKET_CAP)
            .sort((a: TokenPrice, b: TokenPrice) => 
                Math.abs(b.price_change_percentage_24h) - Math.abs(a.price_change_percentage_24h)
            )
            .slice(0, 10);

        return filteredTokens;
    } catch (error) {
        return [];
    }
}; 