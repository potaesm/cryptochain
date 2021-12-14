class TransactionPool {
    constructor() {
        this.transactionMap = {};
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
}

module.exports = TransactionPool;
