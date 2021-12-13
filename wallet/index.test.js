const Wallet = require('./index');
const { verifySignature } = require('../util');
const Transaction = require('./transaction');

describe('Wallet', () => {
    let wallet = new Wallet();
    beforeEach(() => {
        wallet = new Wallet();
    });
    it('has a `balance` property', () => {
        expect(wallet).toHaveProperty('balance');
    });
    it('has a `publicKey` property', () => {
        expect(wallet).toHaveProperty('publicKey');
    });

    describe('signing data', () => {
        const data = 'foo-bar';
        it('verifies a signature', () => {
            expect(verifySignature({
                publicKey: wallet.publicKey,
                data,
                signature: wallet.sign(data)
            })).toBe(true);
        });
        it('does not verify an invalid signature', () => {
            expect(verifySignature({
                publicKey: wallet.publicKey,
                data,
                signature: new Wallet().sign(data)
            })).toBe(false);
        });
    });
    describe('createTransaction()', () => {
        describe('and the amount exceeds the balance', () => {
            it('throws an error', () => {
                expect(() => wallet.createTransaction({ amount: 999999, recipient: 'foo-recipient' }))
                    .toThrow('Amount exceeds balance');
            });
        });
        describe('and the amount is valid', () => {
            let recipient = 'foo-recipient';
            let amount = 0;
            let transaction = wallet.createTransaction({ amount, recipient });
            beforeEach(() => {
                amount = 50;
                transaction = wallet.createTransaction({ amount, recipient });
            });
            it('creates an instance of `Transaction`', () => {
                expect(transaction instanceof Transaction).toBe(true);
            });
            it('matches the transaction input with the wallet', () => {
                expect(transaction.input.address).toEqual(wallet.publicKey);
            });
            it('outputs the amount to the recipient', () => {
                expect(transaction.outputMap[recipient]).toEqual(amount);
            });
        });
    });
});