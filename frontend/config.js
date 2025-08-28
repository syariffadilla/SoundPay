// Soundness Layer Configuration
const CONFIG = {
    // Sui Network Configuration
    SUI_NETWORK: 'testnet', // or 'devnet'
    SUI_RPC_URL: 'https://fullnode.testnet.sui.io:443',
    
    // Soundness Layer Configuration
    SOUNDNESS_API_URL: 'http://localhost:3001/api',
    SOUNDNESS_CLI_PATH: '../soundness-cli', // Path to soundness-cli
    
    // Walrus Configuration
    WALRUS_PUBLISHER_URL: 'https://publisher.walrus-testnet.walrus.space',
    WALRUS_AGGREGATOR_URL: 'https://aggregator.walrus-testnet.walrus.space',
    
    // Contract Addresses (will be updated after deployment)
    CONTRACTS: {
        SOUNDPAY_ESCROW: '0x...', // Will be set after deployment
        SOUNDPAY_TOKEN: '0x...'   // Will be set after deployment
    },
    
    // ZK Proof Configuration
    ZK_PROOF: {
        CIRCUIT_PATH: './circuits/payment.circom',
        PROVING_KEY_PATH: './keys/payment.zkey',
        VERIFICATION_KEY_PATH: './keys/verification_key.json'
    },
    
    // UI Configuration
    UI: {
        ITEMS_PER_PAGE: 10,
        REFRESH_INTERVAL: 30000, // 30 seconds
        ANIMATION_DURATION: 300
    }
};

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CONFIG;
}
