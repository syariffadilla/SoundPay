// SoundPay DApp Main Application
class SoundPayApp {
    constructor() {
        this.wallet = null;
        this.suiClient = null;
        this.currentSection = 'dashboard';
        this.payments = [];
        this.proofs = [];
        
        this.init();
    }

    async init() {
        console.log('🚀 Initializing SoundPay DApp...');
        
        // Initialize Sui client
        this.initSuiClient();
        
        // Check for wallet availability
        await this.checkWalletAvailability();
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Load initial data
        await this.loadDashboardData();
        
        console.log('✅ SoundPay DApp initialized successfully!');
    }

    initSuiClient() {
        try {
            // Initialize Sui client for testnet
            this.suiClient = new window.sui.SuiClient({
                url: CONFIG.SUI_RPC_URL
            });
            console.log('✅ Sui client initialized');
        } catch (error) {
            console.error('❌ Failed to initialize Sui client:', error);
        }
    }

    async checkWalletAvailability() {
        const availableWallets = await this.checkAvailableWallets();
        if (availableWallets.length === 0) {
            this.showWalletInstallPrompt();
        } else {
            console.log('✅ Wallet detected:', availableWallets.map(w => w.name).join(', '));
        }
    }

    async checkAvailableWallets() {
        const wallets = [];
        const checks = [
            { name: 'Sui Wallet', condition: () => typeof window.suiWallet !== 'undefined', object: window.suiWallet },
            { name: 'Sui', condition: () => typeof window.sui !== 'undefined', object: window.sui },
            { name: 'Martian', condition: () => typeof window.martian !== 'undefined' && window.martian.sui, object: window.martian },
        ];
        
        // Check for Chrome extension
        if (typeof chrome !== 'undefined' && chrome.runtime) {
            try {
                await chrome.runtime.sendMessage('ppcguiplghgbkfbbdklghmhjjblefiao', { type: 'ping' });
                wallets.push({ name: 'Sui Wallet Extension', object: null });
            } catch (e) {
                // Extension not installed or not responding
            }
        }
        
        checks.forEach(check => {
            if (check.condition()) {
                wallets.push({ name: check.name, object: check.object });
            }
        });
        
        return wallets;
    }

    showWalletInstallPrompt() {
        const prompt = document.getElementById('walletPrompt');
        prompt.classList.remove('hidden');
        
        document.getElementById('closePrompt').addEventListener('click', () => {
            prompt.classList.add('hidden');
        });
    }

    setupEventListeners() {
        // Wallet connection
        document.getElementById('connectWallet').addEventListener('click', () => this.connectWallet());
        document.getElementById('disconnectWallet').addEventListener('click', () => this.disconnectWallet());
        
        // Navigation
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const section = e.target.dataset.section;
                this.showSection(section);
            });
        });
        
        // Send payment
        document.getElementById('sendPaymentBtn').addEventListener('click', () => this.sendPayment());
        
        // Filter tabs
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const filter = e.target.dataset.filter;
                this.filterPayments(filter);
                
                // Update active tab
                document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
            });
        });
        
        // Proof search
        document.getElementById('searchBtn').addEventListener('click', () => this.searchProof());
        
        // Share proof
        document.addEventListener('click', (e) => {
            if (e.target.id === 'shareProof') {
                this.shareProofOnTwitter();
            }
        });
    }

    async connectWallet() {
        try {
            console.log('🔗 Connecting wallet...');
            
            // Check for available wallets
            const availableWallets = await this.checkAvailableWallets();
            if (availableWallets.length === 0) {
                this.showWalletInstallPrompt();
                return;
            }
            
            // Use the first available wallet
            const wallet = availableWallets[0].object;
            
            // Request connection
            const result = await wallet.requestPermissions();
            if (result.granted) {
                this.wallet = await wallet.getAccounts();
                const address = this.wallet[0];
                
                // Update UI
                document.getElementById('connectWallet').classList.add('hidden');
                document.getElementById('walletInfo').classList.remove('hidden');
                document.getElementById('walletAddress').textContent = 
                    `${address.slice(0, 6)}...${address.slice(-4)}`;
                
                // Hide wallet prompt if shown
                document.getElementById('walletPrompt').classList.add('hidden');
                
                console.log('✅ Wallet connected:', address);
                
                // Load user data
                await this.loadUserData();
            }
        } catch (error) {
            console.error('❌ Failed to connect wallet:', error);
            alert('Failed to connect wallet. Please try again.');
        }
    }

    disconnectWallet() {
        this.wallet = null;
        
        // Update UI
        document.getElementById('connectWallet').classList.remove('hidden');
        document.getElementById('walletInfo').classList.add('hidden');
        
        console.log('🔌 Wallet disconnected');
    }

    showSection(sectionName) {
        // Hide all sections
        document.querySelectorAll('.section').forEach(section => {
            section.classList.remove('active');
        });
        
        // Show selected section
        document.getElementById(sectionName).classList.add('active');
        
        // Update navigation
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-section="${sectionName}"]`).classList.add('active');
        
        this.currentSection = sectionName;
        
        // Load section-specific data
        this.loadSectionData(sectionName);
    }

    async loadSectionData(sectionName) {
        switch (sectionName) {
            case 'dashboard':
                await this.loadDashboardData();
                break;
            case 'paymentHistory':
                await this.loadPaymentHistory();
                break;
            case 'proofExplorer':
                await this.loadProofExplorer();
                break;
        }
    }

    async loadDashboardData() {
        try {
            // Simulate loading dashboard data
            const stats = await this.fetchStats();
            
            document.getElementById('totalPayments').textContent = stats.totalPayments;
            document.getElementById('totalProofs').textContent = stats.totalProofs;
            document.getElementById('storageUsed').textContent = `${stats.storageUsed} MB`;
            document.getElementById('activeEscrows').textContent = stats.activeEscrows;
            
        } catch (error) {
            console.error('❌ Failed to load dashboard data:', error);
        }
    }

    async fetchStats() {
        try {
            const response = await fetch(`${CONFIG.SOUNDNESS_API_URL}/stats`);
            if (response.ok) {
                return await response.json();
            }
        } catch (error) {
            console.error('Failed to fetch stats:', error);
        }
        
        // Return mock data if API fails
        return {
            totalPayments: 42,
            totalProofs: 38,
            storageUsed: 15.7,
            activeEscrows: 8
        };
    }

    async sendPayment() {
        if (!this.wallet) {
            alert('Please connect your wallet first');
            return;
        }

        const recipient = document.getElementById('recipientAddress').value;
        const amount = document.getElementById('paymentAmount').value;
        const description = document.getElementById('paymentDescription').value;
        const useEscrow = document.getElementById('useEscrow').checked;

        if (!recipient || !amount) {
            alert('Please fill in recipient address and amount');
            return;
        }

        try {
            this.showLoading(true);
            
            // Step 1: Generate ZK Proof
            await this.generateZKProof({
                recipient,
                amount,
                description,
                sender: this.wallet[0]
            });
            
            // Step 2: Upload to Walrus
            const blobId = await this.uploadToWalrus({
                recipient,
                amount,
                description,
                timestamp: Date.now()
            });
            
            // Step 3: Submit to Soundness Layer
            const attestationId = await this.submitToSoundnessLayer(blobId);
            
            // Step 4: Execute payment on Sui
            const txResult = await this.executePayment({
                recipient,
                amount,
                blobId,
                attestationId,
                useEscrow
            });
            
            this.showPaymentSuccess(blobId, attestationId, txResult);
            
        } catch (error) {
            console.error('❌ Payment failed:', error);
            alert('Payment failed: ' + error.message);
        } finally {
            this.showLoading(false);
        }
    }

    async generateZKProof(paymentData) {
        console.log('🔐 Generating ZK Proof...');
        
        // Show proof generation UI
        document.getElementById('proofStatus').classList.remove('hidden');
        document.getElementById('proofMessage').textContent = 'Generating ZK proof...';
        
        // Simulate proof generation progress
        const progressBar = document.getElementById('progressFill');
        let progress = 0;
        
        const progressInterval = setInterval(() => {
            progress += 10;
            progressBar.style.width = `${progress}%`;
            
            if (progress >= 100) {
                clearInterval(progressInterval);
            }
        }, 200);
        
        try {
            // Call backend to generate proof
            const response = await fetch(`${CONFIG.SOUNDNESS_API_URL}/generate-proof`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(paymentData)
            });
            
            if (!response.ok) {
                throw new Error('Failed to generate proof');
            }
            
            const result = await response.json();
            console.log('✅ ZK Proof generated:', result.proofHash);
            
            return result;
            
        } catch (error) {
            console.error('❌ ZK Proof generation failed:', error);
            throw error;
        }
    }

    async uploadToWalrus(data) {
        console.log('🐋 Uploading to Walrus...');
        
        document.getElementById('proofMessage').textContent = 'Uploading to Walrus...';
        
        try {
            const response = await fetch(`${CONFIG.SOUNDNESS_API_URL}/upload-walrus`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });
            
            if (!response.ok) {
                throw new Error('Failed to upload to Walrus');
            }
            
            const result = await response.json();
            console.log('✅ Uploaded to Walrus:', result.blobId);
            
            return result.blobId;
            
        } catch (error) {
            console.error('❌ Walrus upload failed:', error);
            throw error;
        }
    }

    async submitToSoundnessLayer(blobId) {
        console.log('📜 Submitting to Soundness Layer...');
        
        document.getElementById('proofMessage').textContent = 'Submitting to Soundness Layer...';
        
        try {
            const response = await fetch(`${CONFIG.SOUNDNESS_API_URL}/submit-soundness`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    blobId,
                    walletAddress: this.wallet[0]
                })
            });
            
            if (!response.ok) {
                throw new Error('Failed to submit to Soundness Layer');
            }
            
            const result = await response.json();
            console.log('✅ Submitted to Soundness Layer:', result.attestationId);
            
            return result.attestationId;
            
        } catch (error) {
            console.error('❌ Soundness Layer submission failed:', error);
            throw error;
        }
    }

    async executePayment(paymentData) {
        console.log('💸 Executing payment on Sui...');
        
        document.getElementById('proofMessage').textContent = 'Executing payment...';
        
        try {
            // This would interact with Sui smart contracts
            // For now, simulate the transaction
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            const mockTxResult = {
                digest: '0x' + Math.random().toString(16).substr(2, 64),
                status: 'success'
            };
            
            console.log('✅ Payment executed:', mockTxResult.digest);
            
            return mockTxResult;
            
        } catch (error) {
            console.error('❌ Payment execution failed:', error);
            throw error;
        }
    }

    showPaymentSuccess(blobId, attestationId, txResult) {
        document.getElementById('proofMessage').textContent = 'Payment completed successfully!';
        document.getElementById('proofResult').classList.remove('hidden');
        document.getElementById('blobId').textContent = blobId;
        document.getElementById('attestationId').textContent = attestationId;
        
        // Clear form
        document.getElementById('recipientAddress').value = '';
        document.getElementById('paymentAmount').value = '';
        document.getElementById('paymentDescription').value = '';
        
        // Refresh dashboard
        this.loadDashboardData();
    }

    shareProofOnTwitter() {
        const blobId = document.getElementById('blobId').textContent;
        const attestationId = document.getElementById('attestationId').textContent;
        
        const tweetText = `🎉 Just completed a private payment using @SoundnessLabs! 
        
🔐 ZK Proof verified
🐋 Data stored on @WalrusProtocol  
⚡ Powered by @SuiNetwork

Blob ID: ${blobId.slice(0, 10)}...
Attestation: ${attestationId.slice(0, 10)}...

#SoundPay #ZKProofs #Web3 #Privacy`;
        
        const tweetUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}`;
        window.open(tweetUrl, '_blank');
    }

    async loadPaymentHistory() {
        if (!this.wallet) return;
        
        try {
            const response = await fetch(`${CONFIG.SOUNDNESS_API_URL}/payments/${this.wallet[0]}`);
            if (response.ok) {
                this.payments = await response.json();
            } else {
                // Mock data for demo
                this.payments = this.generateMockPayments();
            }
            
            this.renderPaymentHistory();
            
        } catch (error) {
            console.error('Failed to load payment history:', error);
            this.payments = this.generateMockPayments();
            this.renderPaymentHistory();
        }
    }

    generateMockPayments() {
        return [
            {
                id: '1',
                amount: '0.5',
                recipient: '0x1234...5678',
                status: 'completed',
                timestamp: Date.now() - 86400000,
                blobId: '0xabcd...efgh',
                description: 'Payment for services'
            },
            {
                id: '2',
                amount: '1.2',
                recipient: '0x9876...5432',
                status: 'pending',
                timestamp: Date.now() - 3600000,
                blobId: '0xijkl...mnop',
                description: 'Freelance work payment'
            },
            {
                id: '3',
                amount: '0.8',
                recipient: '0x5555...7777',
                status: 'disputed',
                timestamp: Date.now() - 172800000,
                blobId: '0xqrst...uvwx',
                description: 'Product purchase'
            }
        ];
    }

    renderPaymentHistory() {
        const paymentList = document.getElementById('paymentList');
        paymentList.innerHTML = '';
        
        this.payments.forEach(payment => {
            const paymentItem = document.createElement('div');
            paymentItem.className = 'payment-item';
            paymentItem.innerHTML = `
                <div class="payment-header">
                    <div class="payment-amount">${payment.amount} SUI</div>
                    <div class="payment-status status-${payment.status}">${payment.status}</div>
                </div>
                <div class="payment-details">
                    <p><strong>To:</strong> ${payment.recipient}</p>
                    <p><strong>Description:</strong> ${payment.description}</p>
                    <p><strong>Date:</strong> ${new Date(payment.timestamp).toLocaleDateString()}</p>
                    <p><strong>Blob ID:</strong> ${payment.blobId}</p>
                </div>
            `;
            paymentList.appendChild(paymentItem);
        });
    }

    filterPayments(filter) {
        const items = document.querySelectorAll('.payment-item');
        items.forEach(item => {
            const status = item.querySelector('.payment-status').textContent.toLowerCase();
            if (filter === 'all' || status === filter) {
                item.style.display = 'block';
            } else {
                item.style.display = 'none';
            }
        });
    }

    async searchProof() {
        const searchTerm = document.getElementById('searchProof').value;
        if (!searchTerm) return;
        
        try {
            const response = await fetch(`${CONFIG.SOUNDNESS_API_URL}/proof/${searchTerm}`);
            if (response.ok) {
                const proofData = await response.json();
                this.displayProofDetails(proofData);
            } else {
                alert('Proof not found');
            }
        } catch (error) {
            console.error('Search failed:', error);
            alert('Search failed');
        }
    }

    displayProofDetails(proofData) {
        const proofDetails = document.getElementById('proofDetails');
        proofDetails.innerHTML = `
            <h3>Proof Details</h3>
            <div class="proof-info">
                <p><strong>Blob ID:</strong> ${proofData.blobId}</p>
                <p><strong>Attestation ID:</strong> ${proofData.attestationId}</p>
                <p><strong>Status:</strong> ${proofData.status}</p>
                <p><strong>Created:</strong> ${new Date(proofData.timestamp).toLocaleString()}</p>
                <p><strong>Size:</strong> ${proofData.size} bytes</p>
            </div>
        `;
        proofDetails.classList.remove('hidden');
    }

    async loadProofExplorer() {
        // Load recent proofs for explorer
        console.log('Loading proof explorer...');
    }

    async loadUserData() {
        if (!this.wallet) return;
        
        // Load user-specific data
        await this.loadPaymentHistory();
        await this.loadDashboardData();
    }

    showLoading(show) {
        const overlay = document.getElementById('loadingOverlay');
        if (show) {
            overlay.classList.remove('hidden');
        } else {
            overlay.classList.add('hidden');
        }
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.soundPayApp = new SoundPayApp();
});