const Blockchain = require('./index');
const Block = require('./block');
const Wallet = require('../wallet');
const { cryptoHash } = require('../util');
const Transaction = require('../wallet/transaction');

describe('Blockchain', () => {
    let blockchain, newChain, originalChain, errorMock, logMock;
    beforeEach(() => {
        blockchain = new Blockchain();
        newChain = new Blockchain();
        originalChain = blockchain.chain;
        errorMock = jest.fn();
        global.console.error = errorMock;
    });
    it('contains a `chain` that is the `Array` instance', () => {
        expect(blockchain.chain instanceof Array).toBe(true);
    });
    it('starts with the genesis block', () => {
        expect(blockchain.chain[0]).toEqual(Block.genesis());
    });
    it('adds a new block to the chain', () => {
        const newData = 'foo-bar';
        blockchain.addBlock({ data: newData });
        expect(blockchain.chain[blockchain.chain.length - 1].data).toEqual(newData);
    });
    describe('isValidChain()', () => {
        describe('when the chain does not start with the genesis block', () => {
            it('returns false', () => {
                blockchain.chain[0] = 'fake-genesis';
                expect(Blockchain.isValidChain(blockchain.chain)).toBe(false);
            });
        });
        describe('when the chain starts with the genesis block and has multiple blocks', () => {
            beforeEach(() => {
                blockchain.addBlock({ data: 'Suthinan' });
                blockchain.addBlock({ data: 'Musitmani' });
                blockchain.addBlock({ data: 'Potae' });
            });
            describe('and a `lashHash` reference has changed', () => {
                it('returns false', () => {
                    blockchain.chain[2].lastHash = 'broken-lastHash';
                    expect(Blockchain.isValidChain(blockchain.chain)).toBe(false);
                });
            });
            describe('the chain contains a block with an invalid field', () => {
                it('returns false', () => {
                    blockchain.chain[2].data = 'broken-data';
                    expect(Blockchain.isValidChain(blockchain.chain)).toBe(false);
                });
            });
            describe('the chain contains a block with jumped difficulty', () => {
                it('returns false', () => {
                    const timestamp = Date.now();
                    const lastBlock = blockchain.chain[blockchain.chain.length - 1];
                    const lastHash = lastBlock.hash;
                    const nonce = 0;
                    const difficulty = lastBlock.difficulty - 3;
                    const data = [];
                    const hash = cryptoHash(timestamp, lastHash, nonce, difficulty, data);
                    const badBlock = new Block({ timestamp, lastHash, hash, nonce, difficulty, data });
                    blockchain.chain.push(badBlock);
                    expect(Blockchain.isValidChain(blockchain.chain)).toBe(false);
                });
            });
            describe('the chain does not contain any invalid blocks', () => {
                it('returns true', () => {
                    expect(Blockchain.isValidChain(blockchain.chain)).toBe(true);
                });
            });
        });
    });
    describe('replaceChain()', () => {
        beforeEach(() => {
            logMock = jest.fn();
            global.console.log = logMock;
        });
        describe('when the new chain is not longer', () => {
            beforeEach(() => {
                newChain.chain[0] = { new: 'invalid-data' }
                blockchain.replaceChain(newChain.chain);
            });
            it('does not replace the chain', () => {
                expect(blockchain.chain).toEqual(originalChain);
            });
            it('logs an error', () => {
                expect(errorMock).toHaveBeenCalled();
            });
        });
        describe('when the new chain is longer', () => {
            beforeEach(() => {
                newChain.addBlock({ data: 'Suthinan' });
                newChain.addBlock({ data: 'Musitmani' });
                newChain.addBlock({ data: 'Potae' });
            });
            describe('and the chain is invalid', () => {
                beforeEach(() => {
                    newChain.chain[2].hash = 'fake-hash';
                    blockchain.replaceChain(newChain.chain);
                });
                it('does not replace the chain', () => {
                    expect(blockchain.chain).toEqual(originalChain);
                });
                it('logs an error', () => {
                    expect(errorMock).toHaveBeenCalled();
                });
            });
            describe('and the chain is valid', () => {
                beforeEach(() => {
                    blockchain.replaceChain(newChain.chain);
                });
                it('replaces the chain', () => {
                    expect(blockchain.chain).toEqual(newChain.chain);
                });
                it('logs about the chain replacement', () => {
                    expect(logMock).toHaveBeenCalled();
                });
            });
        });
        describe('and the `isValidateTransaction` flag is true', () => {
            it('calls `isValidTransactionData()`', () => {
                const isValidTransactionDataMock = jest.fn();
                blockchain.isValidTransactionData = isValidTransactionDataMock;
                newChain.addBlock({ data: 'foo' });
                blockchain.replaceChain(newChain.chain, true);
                expect(isValidTransactionDataMock).toHaveBeenCalled();
            });
        });
    });
    describe('isValidTransactionData()', () => {
        let transaction, rewardTransaction, wallet;
        beforeEach(() => {
            wallet = new Wallet();
            transaction = wallet.createTransaction({ recipient: 'foo-address', amount: 65 });
            rewardTransaction = Transaction.rewardTransaction({ minerWallet: wallet });
        });
        describe('and the transaction data is valid', () => {
            it('returns true', () => {
                newChain.addBlock({ data: [transaction, rewardTransaction] });
                expect(blockchain.isValidTransactionData({ chain: newChain.chain })).toBe(true);
                expect(errorMock).not.toHaveBeenCalled();
            });
        });
        describe('and the transaction data has multiple rewards', () => {
            it('returns false and logs an error', () => {
                newChain.addBlock({ data: [transaction, rewardTransaction, rewardTransaction] });
                expect(blockchain.isValidTransactionData({ chain: newChain.chain })).toBe(false);
                expect(errorMock).toHaveBeenCalled();
            });
        });
        describe('and the transaction data has at least one malformed outputMap', () => {
            describe('and the transaction is not a reward transaction', () => {
                it('returns false and logs an error', () => {
                    transaction.outputMap[wallet.publicKey] = 999999;
                    newChain.addBlock({ data: [transaction, rewardTransaction] });
                    expect(blockchain.isValidTransactionData({ chain: newChain.chain })).toBe(false);
                    expect(errorMock).toHaveBeenCalled();
                });
            });
            describe('and the transaction is a reward transaction', () => {
                it('returns false and logs an error', () => {
                    rewardTransaction.outputMap[wallet.publicKey] = 999999;
                    newChain.addBlock({ data: [transaction, rewardTransaction] });
                    expect(blockchain.isValidTransactionData({ chain: newChain.chain })).toBe(false);
                    expect(errorMock).toHaveBeenCalled();
                });
            });
        });
        describe('and the transaction data has at least one malformed input', () => {
            it('returns false and logs an error', () => {
                wallet.balance = 9000;
                const evilOutputMap = {
                    [wallet.publicKey]: 8900,
                    'foo-recipient': 100
                };
                const evilTransaction = {
                    input: {
                        timestamp: Date.now(),
                        amount: wallet.balance,
                        address: wallet.publicKey,
                        signature: wallet.sign(evilOutputMap)
                    },
                    outputMap: evilOutputMap
                };
                newChain.addBlock({ data: [evilTransaction, rewardTransaction] });
                expect(blockchain.isValidTransactionData({ chain: newChain.chain })).toBe(false);
                expect(errorMock).toHaveBeenCalled();
            });
        });
        describe('and a block contains multiple identical transactions', () => {
            it('returns false and logs an error', () => {
                newChain.addBlock({ data: [transaction, transaction, transaction, rewardTransaction] });
                expect(blockchain.isValidTransactionData({ chain: newChain.chain })).toBe(false);
                expect(errorMock).toHaveBeenCalled();
            });
        });
    });
});
