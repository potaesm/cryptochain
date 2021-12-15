const { STARTING_BALANCE } = require('../config');
const { ec, cryptoHash } = require('../util');
const Transaction = require('./transaction');

class Wallet {
    constructor() {
        this.keyPair = ec.genKeyPair();
        this.balance = STARTING_BALANCE;
        this.publicKey = this.keyPair.getPublic().encode('hex');
    }
    static calculateBalance({ chain, address }) {
        let outputsTotal = 0;
        for (let i = 1; i < chain.length; i++) {
            const block = chain[i];
            for (const transaction of block.data) {
                const addressOutput = transaction.outputMap[address];
                if (!!addressOutput) {
                    outputsTotal += addressOutput;
                }
            }
        }
        return STARTING_BALANCE + outputsTotal;
    }
    sign(data) {
        return this.keyPair.sign(cryptoHash(data));
    }
    createTransaction({ recipient, amount }) {
        if (amount > this.balance) {
            throw new Error('Amount exceeds balance');
        }
        return new Transaction({ senderWallet: this, recipient, amount });
    }
}

module.exports = Wallet;
