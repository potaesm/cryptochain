const Wallet = require('./index');

describe('Wallet', () => {
    let wallet = new Wallet();
    beforeEach(() => {
        wallet = new Wallet();
    });
    it('has a `balance` property', () => {
        expect(wallet).toHaveProperty('balance');
    });
    it('has a `publicKey` property', () => {
        console.log(wallet.publicKey);
        expect(wallet).toHaveProperty('publicKey');
    });
});