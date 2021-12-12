const Blockchain = require('./index');
const Block = require('./block');
const cryptoHash = require('../util/crypto-hash');

describe('Blockchain', () => {
    let blockchain, newChain, originalChain, errorMock, logMock;
    beforeEach(() => {
        blockchain = new Blockchain();
        newChain = new Blockchain();
        originalChain = blockchain.chain;
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
            errorMock = jest.fn();
            logMock = jest.fn();
            global.console.error = errorMock;
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
    });
});
