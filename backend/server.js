const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// In-memory storage (in production, use a proper database)
let payments = [];
let proofs = [];
let stats = {
    totalPayments: 0,
    totalProofs: 0,
    storageUsed: 0,
    activeEscrows: 0
};

// Routes
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        message: 'SoundPay Soundness Layer API is running',
        timestamp: new Date().toISOString()
    });
});

// Get stats
app.get('/api/stats', (req, res) => {
    res.json(stats);
});

// Generate ZK Proof
app.post('/api/generate-proof', async (req, res) => {
    try {
        const { recipient, amount, description, sender } = req.body;
        
        console.log('🔐 Generating ZK proof for payment...');
        
        // Simulate proof generation (in production, use actual ZK library)
        const proofData = {
            sender,
            recipient,
            amount,
            description,
            timestamp: Date.now(),
            nonce: crypto.randomBytes(16).toString('hex')
        };
        
        // Generate proof hash
        const proofHash = crypto
            .createHash('sha256')
            .update(JSON.stringify(proofData))
            .digest('hex');
        
        // Store proof
        const proof = {
            id: proofHash,
            data: proofData,
            status: 'generated',
            createdAt: new Date()
        };
        
        proofs.push(proof);
        stats.totalProofs++;
        
        console.log('✅ ZK proof generated:', proofHash);
        
        res.json({
            success: true,
            proofHash,
            proof: proofData
        });
        
    } catch (error) {
        console.error('❌ Proof generation failed:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to generate proof' 
        });
    }
});

// Upload to Walrus
app.post('/api/upload-walrus', async (req, res) => {
    try {
        const data = req.body;
        
        console.log('🐋 Uploading to Walrus...');
        
        // Simulate Walrus upload
        const blobId = '0x' + crypto.randomBytes(32).toString('hex');
        const size = JSON.stringify(data).length;
        
        // Update storage stats
        stats.storageUsed += (size / 1024 / 1024); // Convert to MB
        
        console.log('✅ Uploaded to Walrus:', blobId);
        
        res.json({
            success: true,
            blobId,
            size,
            url: `https://aggregator.walrus-testnet.walrus.space/v1/${blobId}`
        });
        
    } catch (error) {
        console.error('❌ Walrus upload failed:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to upload to Walrus' 
        });
    }
});

// Submit to Soundness Layer
app.post('/api/submit-soundness', async (req, res) => {
    try {
        const { blobId, walletAddress } = req.body;
        
        console.log('📜 Submitting to Soundness Layer...');
        
        // Simulate Soundness Layer submission
        const attestationId = '0x' + crypto.randomBytes(32).toString('hex');
        
        console.log('✅ Submitted to Soundness Layer:', attestationId);
        
        res.json({
            success: true,
            attestationId,
            status: 'attested',
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('❌ Soundness Layer submission failed:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to submit to Soundness Layer' 
        });
    }
});

// Get user payments
app.get('/api/payments/:address', (req, res) => {
    try {
        const { address } = req.params;
        const userPayments = payments.filter(p => 
            p.sender === address || p.recipient === address
        );
        
        res.json(userPayments);
    } catch (error) {
        console.error('Error fetching payments:', error);
        res.status(500).json({ error: 'Failed to fetch payments' });
    }
});

// Get proof details
app.get('/api/proof/:id', (req, res) => {
    try {
        const { id } = req.params;
        const proof = proofs.find(p => p.id === id || p.data.blobId === id);
        
        if (!proof) {
            return res.status(404).json({ error: 'Proof not found' });
        }
        
        res.json(proof);
    } catch (error) {
        console.error('Error fetching proof:', error);
        res.status(500).json({ error: 'Failed to fetch proof' });
    }
});

// Create payment record
app.post('/api/payments', (req, res) => {
    try {
        const payment = {
            id: crypto.randomBytes(16).toString('hex'),
            ...req.body,
            createdAt: new Date(),
            status: 'pending'
        };
        
        payments.push(payment);
        stats.totalPayments++;
        stats.activeEscrows++;
        
        res.json(payment);
    } catch (error) {
        console.error('Error creating payment:', error);
        res.status(500).json({ error: 'Failed to create payment' });
    }
});

// Update payment status
app.put('/api/payments/:id', (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        
        const payment = payments.find(p => p.id === id);
        if (!payment) {
            return res.status(404).json({ error: 'Payment not found' });
        }
        
        payment.status = status;
        payment.updatedAt = new Date();
        
        if (status === 'completed') {
            stats.activeEscrows--;
        }
        
        res.json(payment);
    } catch (error) {
        console.error('Error updating payment:', error);
        res.status(500).json({ error: 'Failed to update payment' });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 SoundPay Soundness Layer Backend running on port ${PORT}`);
    console.log(`📊 Dashboard: http://localhost:${PORT}/api/health`);
    console.log(`🔗 API Base URL: http://localhost:${PORT}/api`);
});