const Transaction = require("./transaction");

class TransactionPool {
    constructor() {
        this.transactionMap = {};
    }
    clear() {
        this.transactionMap = {};
    }
    clearBlockchainTransactions({ chain }) {
        for (let i = 1; i < chain.length; i++) {
            const block = chain[i];
            for (const transaction of block.data) {
                if (this.transactionMap[transaction.id]) {
                    delete this.transactionMap[transaction.id];
                }
            }
        }
    }
    setTransaction(transaction) {
        this.transactionMap[transaction.id] = transaction;
    }
    getExistingTransaction({ inputAddress }) {
        return Object.values(this.transactionMap).find(transaction => transaction.input.address === inputAddress);
    }
    setMap(transactionMap) {
        this.transactionMap = transactionMap;
    }
    validTransactions() {
        return Object.values(this.transactionMap).filter(transaction => Transaction.isValidTransaction(transaction));
    }
}

module.exports = TransactionPool;
