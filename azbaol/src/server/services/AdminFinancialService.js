// server/services/AdminFinancialService.js

import axios from 'axios';
import getFinancialModels from '../models/Finance/FinancialTransactions.js';
import mongoose from 'mongoose';

class AdminFinancialService {
    /**
     * Verify any transaction with Paystack (admin endpoint)
     * Handles both client payments and driver payouts
     */
    static async verifyTransaction(transactionId, reference) {
        try {
            const { FinancialTransaction, DriverEarnings, ClientWallet } = await getFinancialModels();

            // Get transaction
            const transaction = await FinancialTransaction.findById(transactionId);
            if (!transaction) {
                return {
                    success: false,
                    message: 'Transaction not found'
                };
            }

            // Already in final state
            if (['completed', 'failed', 'reversed'].includes(transaction.status)) {
                return {
                    success: true,
                    message: 'Transaction already in final state',
                    status: transaction.status,
                    alreadyProcessed: true
                };
            }

            // Verify with Paystack based on transaction type
            let paystackData;
            let verificationEndpoint;

            if (transaction.transactionType === 'driver_payout') {
                // For transfers (driver payouts)
                verificationEndpoint = `https://api.paystack.co/transfer/verify/${reference}`;
            } else {
                // For payments (client payments, wallet deposits)
                verificationEndpoint = `https://api.paystack.co/transaction/verify/${reference}`;
            }

            try {
                const response = await axios.get(verificationEndpoint, {
                    headers: {
                        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
                        'Content-Type': 'application/json'
                    }
                });

                if (!response.data.status || !response.data.data) {
                    throw new Error('Invalid Paystack response');
                }

                paystackData = response.data.data;
            } catch (paystackError) {
                if (paystackError.response?.status === 404) {
                    return {
                        success: false,
                        message: 'Transaction not yet visible in Paystack system',
                        suggestion: 'Wait a few more minutes and try again'
                    };
                }

                throw new Error(
                    `Paystack verification failed: ${
                        paystackError.response?.data?.message || paystackError.message
                    }`
                );
            }

            // Process based on transaction type and Paystack status
            const paystackStatus = paystackData.status;
            let result;

            if (transaction.transactionType === 'driver_payout') {
                result = await AdminFinancialService.processPayoutVerification(
                    transaction,
                    paystackStatus,
                    paystackData
                );
            } else {
                result = await AdminFinancialService.processPaymentVerification(
                    transaction,
                    paystackStatus,
                    paystackData
                );
            }

            return result;

        } catch (error) {
            console.error('Admin verification error:', error);
            return {
                success: false,
                message: error.message
            };
        }
    }

    /**
     * Process driver payout verification
     */
    static async processPayoutVerification(transaction, paystackStatus, paystackData) {
        const { FinancialTransaction, DriverEarnings } = await getFinancialModels();

        console.log(`Processing payout verification: ${transaction._id}, status: ${paystackStatus}`);

        switch (paystackStatus) {
            case 'success':
                // Update transaction
                transaction.status = 'completed';
                transaction.payout.transferStatus = 'success';
                transaction.processedAt = new Date();
                transaction.gateway.metadata = {
                    ...transaction.gateway.metadata,
                    admin_verified_at: new Date(),
                    paystack_data: paystackData
                };
                await transaction.save();

                // Update driver earnings
                const driverEarnings = await DriverEarnings.findOne({
                    driverId: transaction.driverId
                });

                if (driverEarnings) {
                    const reference = transaction.gateway.reference;
                    const pendingIndex = driverEarnings.pendingTransfers.findIndex(
                        pt => pt.paystackReference === reference && pt.status === 'pending'
                    );

                    if (pendingIndex !== -1) {
                        const pendingTransfer = driverEarnings.pendingTransfers[pendingIndex];

                        // Update pending transfer
                        pendingTransfer.status = 'completed';
                        pendingTransfer.processedAt = new Date();
                        pendingTransfer.lastVerifiedAt = new Date();
                        pendingTransfer.paystackResponse = paystackData;

                        // Update financial totals
                        driverEarnings.earnings.available -= pendingTransfer.requestedAmount;
                        driverEarnings.earnings.withdrawn += pendingTransfer.requestedAmount;
                        driverEarnings.lifetime.totalWithdrawn += pendingTransfer.requestedAmount;

                        // Update recent payout
                        const recentPayoutIndex = driverEarnings.recentPayouts.findIndex(
                            p => p.transactionId.toString() === transaction._id.toString()
                        );

                        if (recentPayoutIndex !== -1) {
                            driverEarnings.recentPayouts[recentPayoutIndex].status = 'completed';
                            driverEarnings.recentPayouts[recentPayoutIndex].processedAt = new Date();
                        }

                        await driverEarnings.save();
                    }
                }

                return {
                    success: true,
                    message: 'Payout verified and marked as completed',
                    status: 'completed',
                    paystackStatus
                };

            case 'failed':
            case 'reversed':
                // Update transaction
                transaction.status = 'failed';
                transaction.payout.transferStatus = paystackStatus;
                transaction.processedAt = new Date();
                transaction.gateway.metadata = {
                    ...transaction.gateway.metadata,
                    admin_verified_at: new Date(),
                    paystack_data: paystackData,
                    failure_reason: paystackData.failures || 'Transfer failed'
                };
                await transaction.save();

                // Restore driver balance
                const driverEarnings2 = await DriverEarnings.findOne({
                    driverId: transaction.driverId
                });

                if (driverEarnings2) {
                    const reference = transaction.gateway.reference;
                    const pendingIndex = driverEarnings2.pendingTransfers.findIndex(
                        pt => pt.paystackReference === reference && pt.status === 'pending'
                    );

                    if (pendingIndex !== -1) {
                        const pendingTransfer = driverEarnings2.pendingTransfers[pendingIndex];

                        // Mark as failed
                        pendingTransfer.status = 'failed';
                        pendingTransfer.processedAt = new Date();
                        pendingTransfer.lastVerifiedAt = new Date();
                        pendingTransfer.paystackResponse = paystackData;

                        // RESTORE BALANCE
                        driverEarnings2.availableBalance += pendingTransfer.requestedAmount;

                        // Update recent payout
                        const recentPayoutIndex = driverEarnings2.recentPayouts.findIndex(
                            p => p.transactionId.toString() === transaction._id.toString()
                        );

                        if (recentPayoutIndex !== -1) {
                            driverEarnings2.recentPayouts[recentPayoutIndex].status = 'failed';
                            driverEarnings2.recentPayouts[recentPayoutIndex].processedAt = new Date();
                        }

                        await driverEarnings2.save();
                    }
                }

                return {
                    success: true,
                    message: 'Payout marked as failed, driver balance restored',
                    status: 'failed',
                    paystackStatus
                };

            case 'pending':
            case 'processing':
            case 'otp':
            case 'queued':
                // Still processing - update last verified time
                const driverEarnings3 = await DriverEarnings.findOne({
                    driverId: transaction.driverId
                });

                if (driverEarnings3) {
                    const reference = transaction.gateway.reference;
                    const pendingTransfer = driverEarnings3.pendingTransfers.find(
                        pt => pt.paystackReference === reference
                    );

                    if (pendingTransfer) {
                        pendingTransfer.lastVerifiedAt = new Date();
                        pendingTransfer.paystackResponse = paystackData;
                        await driverEarnings3.save();
                    }
                }

                return {
                    success: true,
                    message: 'Transfer still processing',
                    status: 'processing',
                    paystackStatus,
                    stillPending: true,
                    suggestion: 'Check again in a few minutes'
                };

            default:
                return {
                    success: false,
                    message: `Unknown Paystack status: ${paystackStatus}`,
                    paystackStatus
                };
        }
    }

    /**
     * Process client payment verification
     */
    static async processPaymentVerification(transaction, paystackStatus, paystackData) {
        const { FinancialTransaction, ClientWallet } = await getFinancialModels();

        console.log(`Processing payment verification: ${transaction._id}, status: ${paystackStatus}`);

        switch (paystackStatus) {
            case 'success':
                // Update transaction
                transaction.status = 'completed';
                transaction.processedAt = new Date();
                transaction.gateway.metadata = {
                    ...transaction.gateway.metadata,
                    admin_verified_at: new Date(),
                    paystack_data: paystackData
                };
                await transaction.save();

                // If wallet deposit, credit wallet
                if (transaction.transactionType === 'wallet_deposit') {
                    const wallet = await ClientWallet.getOrCreateWallet(transaction.clientId);
                    const netAmount = transaction.amount.net;

                    // Check if already credited
                    const alreadyCredited = wallet.recentTransactions.some(
                        t => t.transactionId.toString() === transaction._id.toString()
                    );

                    if (!alreadyCredited) {
                        await wallet.deposit(netAmount, transaction._id);
                    }
                }

                return {
                    success: true,
                    message: 'Payment verified and marked as completed',
                    status: 'completed',
                    paystackStatus
                };

            case 'failed':
                transaction.status = 'failed';
                transaction.processedAt = new Date();
                transaction.gateway.metadata = {
                    ...transaction.gateway.metadata,
                    admin_verified_at: new Date(),
                    paystack_data: paystackData,
                    failure_reason: paystackData.gateway_response || 'Payment failed'
                };
                await transaction.save();

                return {
                    success: true,
                    message: 'Payment marked as failed',
                    status: 'failed',
                    paystackStatus
                };

            case 'pending':
            case 'processing':
                return {
                    success: true,
                    message: 'Payment still processing',
                    status: 'processing',
                    paystackStatus,
                    stillPending: true,
                    suggestion: 'Check again in a few minutes'
                };

            default:
                return {
                    success: false,
                    message: `Unknown Paystack status: ${paystackStatus}`,
                    paystackStatus
                };
        }
    }

    /**
     * Get system-wide financial health report
     */
    static async getFinancialHealthReport() {
        try {
            const { FinancialTransaction, DriverEarnings, ClientWallet } = await getFinancialModels();

            const now = Date.now();
            const last24h = new Date(now - 24 * 60 * 60 * 1000);

            // Pending transactions
            const pendingPayouts = await FinancialTransaction.countDocuments({
                transactionType: 'driver_payout',
                status: { $in: ['pending', 'processing'] }
            });

            const pendingPayments = await FinancialTransaction.countDocuments({
                transactionType: { $in: ['client_payment', 'wallet_deposit'] },
                status: { $in: ['pending', 'processing'] }
            });

            // Old pending (> 30 min)
            const cutoffTime = new Date(now - 30 * 60 * 1000);
            const oldPendingPayouts = await FinancialTransaction.countDocuments({
                transactionType: 'driver_payout',
                status: { $in: ['pending', 'processing'] },
                createdAt: { $lt: cutoffTime }
            });

            // Recent activity
            const recentTransactions = await FinancialTransaction.countDocuments({
                createdAt: { $gte: last24h }
            });

            const completedTransactions = await FinancialTransaction.countDocuments({
                status: 'completed',
                createdAt: { $gte: last24h }
            });

            const failedTransactions = await FinancialTransaction.countDocuments({
                status: { $in: ['failed', 'reversed'] },
                createdAt: { $gte: last24h }
            });

            const successRate = recentTransactions > 0
                ? ((completedTransactions / recentTransactions) * 100).toFixed(2)
                : '0';

            // System balances
            const totalDriverBalances = await DriverEarnings.aggregate([
                { $group: { _id: null, total: { $sum: '$availableBalance' } } }
            ]);

            const totalClientBalances = await ClientWallet.aggregate([
                { $group: { _id: null, total: { $sum: '$balance' } } }
            ]);

            const healthy = oldPendingPayouts === 0 && pendingPayouts < 10;

            return {
                success: true,
                health: {
                    status: healthy ? 'HEALTHY' : 'NEEDS_ATTENTION',
                    pending: {
                        payouts: pendingPayouts,
                        payments: pendingPayments,
                        oldPayouts: oldPendingPayouts
                    },
                    last24h: {
                        total: recentTransactions,
                        completed: completedTransactions,
                        failed: failedTransactions,
                        successRate: `${successRate}%`
                    },
                    balances: {
                        totalDriverBalances: totalDriverBalances[0]?.total || 0,
                        totalClientBalances: totalClientBalances[0]?.total || 0
                    },
                    recommendations: []
                },
                timestamp: new Date()
            };

        } catch (error) {
            console.error('Error getting financial health report:', error);
            return {
                success: false,
                message: error.message
            };
        }
    }

    /**
     * Reconcile all stuck transactions (cron job)
     */
    static async reconcileStuckTransactions(olderThanMinutes = 30) {
        try {
            const { FinancialTransaction } = await getFinancialModels();

            const cutoffTime = new Date(Date.now() - olderThanMinutes * 60 * 1000);

            const stuckTransactions = await FinancialTransaction.find({
                status: { $in: ['pending', 'processing'] },
                createdAt: { $lt: cutoffTime }
            });

            console.log(`Found ${stuckTransactions.length} stuck transactions`);

            const results = {
                total: stuckTransactions.length,
                completed: 0,
                failed: 0,
                stillPending: 0,
                errors: 0,
                details: []
            };

            for (const transaction of stuckTransactions) {
                try {
                    const result = await AdminFinancialService.verifyTransaction(
                        transaction._id,
                        transaction.gateway.reference
                    );

                    if (result.success) {
                        if (result.status === 'completed') {
                            results.completed++;
                        } else if (result.status === 'failed') {
                            results.failed++;
                        } else if (result.stillPending) {
                            results.stillPending++;
                        }
                    } else {
                        results.errors++;
                    }

                    results.details.push({
                        transactionId: transaction._id,
                        reference: transaction.gateway.reference,
                        type: transaction.transactionType,
                        result
                    });

                    // Rate limit protection
                    await new Promise(resolve => setTimeout(resolve, 500));

                } catch (error) {
                    console.error(`Error reconciling ${transaction._id}:`, error);
                    results.errors++;
                }
            }

            return {
                success: true,
                results
            };

        } catch (error) {
            console.error('Error reconciling stuck transactions:', error);
            return {
                success: false,
                message: error.message
            };
        }
    }
}

export default AdminFinancialService;