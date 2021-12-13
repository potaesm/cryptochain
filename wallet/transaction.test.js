const Wallet = require('.');
const { verifySignature } = require('../util');
const Transaction = require('./transaction');

describe('Transaction', () => {
    let senderWallet = new Wallet();
    let recipient = '';
    let amount = 0;
    let transaction;
    beforeEach(() => {
        senderWallet = new Wallet();
        recipient = 'recipient-public-key';
        amount = 50;
        transaction = new Transaction({ senderWallet, recipient, amount });
    });
    it('has an `id`', () => {
        expect(transaction).toHaveProperty('id');
    });
    describe('outputMap', () => {
        it('has an `outputMap`', () => {
            expect(transaction).toHaveProperty('outputMap');
        });
        it('outputs the `amount` to the `recipient`', () => {
            expect(transaction.outputMap[recipient]).toEqual(amount);
        });
        it('outputs the remaining balance to the `senderWallet`', () => {
            expect(transaction.outputMap[senderWallet.publicKey]).toEqual(senderWallet.balance - amount);
        });
    });
    describe('input', () => {
        it('has an `input`', () => {
            expect(transaction).toHaveProperty('input');
        });
        it('has an `timestamp` in the `input`', () => {
            expect(transaction.input).toHaveProperty('timestamp');
        });
        it('sets the `amount` to the `senderWallet` balance', () => {
            expect(transaction.input.amount).toEqual(senderWallet.balance);
        });
        it('sets the `address` to the `senderWallet` publicKey', () => {
            expect(transaction.input.address).toEqual(senderWallet.publicKey);
        });
        it('signs the input', () => {
            expect(verifySignature({
                publicKey: senderWallet.publicKey,
                data: transaction.outputMap,
                signature: transaction.input.signature
            })).toBe(true);
        });
    });
    describe('isValidTransaction()', () => {
        let errorMock;
        beforeEach(() => {
            errorMock = jest.fn();
            global.console.error = errorMock;
        });
        describe('when the transaction is valid', () => {
            it('returns true', () => {
                expect(Transaction.isValidTransaction(transaction)).toBe(true);
            });
        });
        describe('when the transaction is invalid', () => {
            describe('and a transaction outputMap value is invalid', () => {
                it('returns false and logs an error', () => {
                    transaction.outputMap[senderWallet.publicKey] = 999999;
                    expect(Transaction.isValidTransaction(transaction)).toBe(false);
                    expect(errorMock).toHaveBeenCalled();
                });
            });
            describe('the transaction input signature is invalid', () => {
                it('returns false and logs an error', () => {
                    transaction.input.signature = new Wallet().sign('data');
                    expect(Transaction.isValidTransaction(transaction)).toBe(false);
                    expect(errorMock).toHaveBeenCalled();
                });
            });
        });
    });
});
