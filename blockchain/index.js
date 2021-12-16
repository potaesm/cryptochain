const Block = require('./block');
const { cryptoHash } = require('../util');
const { REWARD_INPUT, MINING_REWARD } = require('../config');
const Transaction = require('../wallet/transaction');
const Wallet = require('../wallet');

class Blockchain {
    constructor() {
        this.chain = [Block.genesis()];
    }
    static isValidChain(chain) {
        if (Object.entries(chain[0]).sort().toString() !== Object.entries(Block.genesis()).sort().toString()) {
            return false;
        }
        for (let i = 1; i < chain.length; i++) {
            const actualLastHash = chain[i - 1].hash;
            const lastDifficulty = chain[i - 1].difficulty;
            const { timestamp, lastHash, hash, nonce, difficulty, data } = chain[i];
            if (Math.abs(lastDifficulty - difficulty) > 1) {
                return false;
            }
            const validatedHash = cryptoHash(timestamp, lastHash, nonce, difficulty, data);
            if (lastHash !== actualLastHash || hash !== validatedHash) {
                return false;
            }
        }
        return true;
    }
    addBlock({ data }) {
        const newBlock = Block.mineBlock({
            lastBlock: this.chain[this.chain.length - 1],
            data
        });
        this.chain.push(newBlock);
    }
    replaceChain(chain, isValidateTransaction, onSuccess) {
        if (chain.length <= this.chain.length) {
            console.error('The incoming chain must be longer');
            return;
        }
        if (!Blockchain.isValidChain(chain)) {
            console.error('The incoming chain must be valid');
            return;
        }
        if (!!isValidateTransaction && !this.isValidTransactionData({ chain })) {
            console.error('The incoming chain has invalid data');
            return;
        }
        if (!!onSuccess) {
            onSuccess();
        }
        this.chain = chain;
        console.log('Replacing chain with', this.chain);
    }
    isValidTransactionData({ chain }) {
        for (let i = 1; i < chain.length; i++) {
            const block = chain[i];
            const transactionSet = new Set();
            let rewardTransactionCount = 0;
            for (const transaction of block.data) {
                if (transaction.input.address === REWARD_INPUT.address) {
                    rewardTransactionCount++;
                    if (rewardTransactionCount > 1) {
                        console.error('Miner rewards exceed limit');
                        return false;
                    }
                    if (Object.values(transaction.outputMap)[0] !== MINING_REWARD) {
                        console.error('Miner reward amount is invalid');
                        return false;
                    }
                } else {
                    if (!Transaction.isValidTransaction(transaction)) {
                        console.error('Invalid transaction');
                        return false;
                    }
                    const trueBalance = Wallet.calculateBalance({
                        chain: this.chain,
                        address: transaction.input.address
                    });
                    if (transaction.input.amount !== trueBalance) {
                        console.error('Invalid input amount');
                        return false;
                    }
                    if (transactionSet.has(transaction)) {
                        console.error('An identical transaction appears more than once in the block');
                        return false;
                    } else {
                        transactionSet.add(transaction);
                    }
                }
            }
        }
        return true;
    }
}

module.exports = Blockchain;
