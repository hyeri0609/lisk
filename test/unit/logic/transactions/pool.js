'use strict';

var expect = require('chai').expect;

var modulesLoader = require('../../../common/initModule').modulesLoader;
var TxPool = require('../../../../logic/transactions/pool.js');
var Transaction = require('../../../../logic/transaction.js');
var utils = require('../../../../logic/transactions/utils.js');

var transactions = [
	/* type: 0 - Transmit funds */
	{
		'type': 0,
		'amount': 100000000,
		'fee': 10000000,
		'timestamp': 37943880,
		'recipientId': '16313739661670634666L',
		'senderId': '2737453412992791987L',
		'senderPublicKey': 'c76a0e680e83f47cf07c0f46b410f3b97e424171057a0f8f0f420c613da2f7b5',
		'signature': '57bc34c092189e6520b1fcb5b8a1e911d5aed56910ae75d8bbf6145b780dce539949ba86a0ae8d6a33b3a2a68ce8c16eb39b448b4e53f5ca8b04a0da3b438907',
		'id': '7249285091378090017'
	},
	/* type: 1 - Register a second signature */
	{
		'type': 1,
		'amount': 0,
		'senderPublicKey': 'c76a0e680e83f47cf07c0f46b410f3b97e424171057a0f8f0f420c613da2f7b5',
		'timestamp': 37943881,
		'recipientId': null,
		'signature': '57bc34c092189e6520b1fcb5b8a1e911d5aed56910ae75d8bbf6145b780dce539949ba86a0ae8d6a33b3a2a68ce8c16eb39b448b4e53f5ca8b04a0da3b438907',
		'id': '7249285091378090018',
		'fee': 500000000,
		'senderId': '2737453412992791987L',
		'asset': {
				'signature': {
					'publicKey': 'The public key associated with the second passphrase'
				}
		}
	},
	/* type: 2 - Register a delegate */
	{
		'type': 2,
		'amount': 0,
		'senderPublicKey': 'c76a0e680e83f47cf07c0f46b410f3b97e424171057a0f8f0f420c613da2f7b5',
		'timestamp': 37943882,
		'recipientId': null,
		'signature': '57bc34c092189e6520b1fcb5b8a1e911d5aed56910ae75d8bbf6145b780dce539949ba86a0ae8d6a33b3a2a68ce8c16eb39b448b4e53f5ca8b04a0da3b438907',
		'id': '7249285091378090019',
		'fee': 500000000,
		'senderId': '2737453412992791987L',
		'asset': {
				'delegate': {
					'username': 'The chosen username',
					'publicKey': 'The public key associated with the second passphrase'
				}
		}
	},
	/* type: 3 - Submit votes */
	{
		'type': 3,
		'amount': 30000,
		'fee': 3,
		'id': '7249285091378090020'
	},
	/* type: 4 - Multisignature registration */
	{
		'type': 4,
		'amount': 40000,
		'fee': 4,
		'id': '7249285091378090021'
	},
	/* type: 0 - Transmit funds Account does not have enough LSK*/
	{
		'type': 0,
		'amount': 10000000000000000,
		'fee': 10000000,
		'timestamp': 37943840,
		'recipientId': '16313739661670634666L',
		'senderId': '2737453412992791987L',
		'senderPublicKey': 'c76a0e680e83f47cf07c0f46b410f3b97e424171057a0f8f0f420c613da2f7b5',
		'signature': '57bc34c092189e6520b1fcb5b8a1e911d5aed56910ae75d8bbf6145b780dce539949ba86a0ae8d6a33b3a2a68ce8c16eb39b448b4e53f5ca8b04a0da3b438907',
		'id': '7249285091378090022'
	},
];
var extraTransaction = 	{
	'type': 0,
	'amount': 100000000,
	'fee': 10000000,
	'timestamp': 37943880,
	'recipientId': '16313739661670634666L',
	'senderId': '2737453412992791987L',
	'senderPublicKey': 'c76a0e680e83f47cf07c0f46b410f3b97e424171057a0f8f0f420c613da2f7b5',
	'signature': '57bc34c092189e6520b1fcb5b8a1e911d5aed56910ae75d8bbf6145b780dce539949ba86a0ae8d6a33b3a2a68ce8c16eb39b448b4e53f5ca8b04a0da3b438907',
	'id': '7249285091378090023'
};
describe('txPool', function () {
	
	var accounts;
	var txPool;
	var poolTotals;
	var txReady;
	var poolStorageTxsLimit;

	before(function (done) {
		modulesLoader.initLogic(Transaction, modulesLoader.scope, function (err, __trsLogic) {
			if (err) {
				return done(err);
			}
			modulesLoader.scope.config.transactions.poolStorageTxsLimit = 6;
			modulesLoader.scope.config.transactions.poolProcessInterval = 6000;
			poolStorageTxsLimit = modulesLoader.scope.config.transactions.poolStorageTxsLimit;
			txPool = new TxPool(
					modulesLoader.scope.config.broadcasts.broadcastInterval,
					modulesLoader.scope.config.broadcasts.releaseLimit,
					modulesLoader.scope.config.transactions.poolStorageTxsLimit,
					modulesLoader.scope.config.transactions.poolProcessInterval,
					__trsLogic,
					modulesLoader.scope.bus,
					modulesLoader.scope.logger
				);

			modulesLoader.initModules([
				{accounts: require('../../../../modules/accounts')},
			], [
				{'transaction': require('../../../../logic/transaction')},
				{'account': require('../../../../logic/account')}
			], {}, function (err, __modules) {
				if (err) {
					return done(err);
				}
				txPool.bind(
					__modules.accounts,
					null,
					__modules.loader
				);

				done();
			});
		});
	});

	describe('unverified', function () {

		describe('method add', function () {

			it('should be ok when get pool totals', function (done) {
				var totals = txPool.getUsage();

				expect(totals).to.be.an('object');
				expect(totals.unverified.indexes).to.be.a('number');
				expect(totals.pending.indexes).to.be.a('number');
				expect(totals.ready.indexes).to.be.a('number');
				expect(totals.unverified.txs).to.be.a('number');
				expect(totals.pending.txs).to.be.a('number');
				expect(totals.ready.txs).to.be.a('number');
				poolTotals = totals;
				done();
			});

			it('should be ok when add transaction type 0 to unverified', function (done) {
				txPool.add(transactions[0], function (err, cbtx) {
					if (err) {
						done(err);
					}
					expect(cbtx).to.be.undefined;
					done();
				});
			});

			it('should be ok when check unverified value increased in 1', function (done) {
				var totals = txPool.getUsage();

				expect(totals).to.be.an('object');
				expect(totals.unverified.indexes).to.equal(poolTotals.unverified.indexes + 1);
				expect(totals.unverified.txs).to.equal(poolTotals.unverified.txs + 1);
				poolTotals = totals;
				done();
			});

			it('should fail when add same transaction type 0 to unverified', function (done) {
				txPool.add(transactions[0], function (err, cbtx) {
					expect(err).to.equal('Transaction is already in pool: 7249285091378090017');
					done();
				});
			});

			it('should be ok when add transactions to fill pool storage', function (done) {
				var trx = transactions.slice(1,transactions.length)
				txPool.add(trx, function (err, cbtx) {
					if (err) {
						done(err);
					}
					expect(cbtx).to.be.undefined;
					done();
				});
			});

			it('should be ok when pool totals are equal to pool storage limit', function (done) {
				var totals = txPool.getUsage();
				var currentStorage = totals.unverified.indexes + totals.pending.indexes + totals.ready.indexes;
				expect(totals).to.be.an('object');
				expect(currentStorage).to.equal(poolStorageTxsLimit);
				poolTotals = totals;
				done();
			});

			it('should fail when add transaction and pool storage is full', function (done) {
				txPool.add(extraTransaction, function (err, cbtx) {
					expect(err).to.equal('Transaction pool is full');
					done();
				});
			});
		});

		describe('method delete', function () {

			it('should be ok when delete a transaction from unverified', function (done) {
				var deleteTx = txPool.delete(transactions[0]);

				expect(deleteTx).to.be.an('array').that.is.not.empty;
				expect(deleteTx.length).to.equal(1);
				expect(deleteTx[0]).to.equal('unverified');
				done();
			});

			it('should be ok when check unverified value decreased in 1', function (done) {
				var totals = txPool.getUsage();

				expect(totals).to.be.an('object');
				expect(totals.unverified.indexes).to.equal(poolTotals.unverified.indexes - 1);
				expect(totals.unverified.txs).to.equal(poolTotals.unverified.txs);
				poolTotals = totals;
				done();
			});
		});
	});
	
	describe('ready', function () {
		describe('method addReady/getReady', function () {

			it('should be ok when add transactions to ready', function (done) {
				txPool.addReady(transactions, function (err, cbtx) {
					if (err) {
						done(err);
					}
					expect(cbtx).to.be.undefined;
					poolTotals.ready.indexes += transactions.length;
					poolTotals.ready.txs += transactions.length;
					done();
				});
			});

			it('should be ok when get transactions from ready', function (done) {
				var readyTxs = txPool.getReady();
				expect(readyTxs[0].fee).to.be.at.least(readyTxs[1].fee);
				expect(readyTxs[1].fee).to.be.at.least(readyTxs[2].fee);
				expect(readyTxs[2].fee).to.be.at.least(readyTxs[3].fee);
				done();
			});

			it('should be ok when delete transaction from ready', function (done) {
				var deleteTx = txPool.delete(transactions[0]);

				expect(deleteTx).to.be.an('array').that.is.not.empty;
				expect(deleteTx.length).to.equal(1);
				expect(deleteTx[0]).to.equal('ready');
				done();
			});

			it('should be ok when check ready value decreased in 1', function (done) {
				var totals = txPool.getUsage();

				expect(totals).to.be.an('object');
				expect(totals.ready.indexes).to.equal(poolTotals.ready.indexes - 1);
				expect(totals.ready.txs).to.equal(poolTotals.ready.txs);
				poolTotals = totals;
				done();

			});
		});
	});

	describe('broadcast transactions', function() {
		var broadcastTx;

		it('should be ok when serialize transaction (pack)', function (done) {
			broadcastTx = utils.pack(transactions[0]);
			expect(broadcastTx).that.is.an('Uint8Array');
			done();
		});

		it('should be ok when unpacked size is greater than packed size', function (done) {
			var packedLenght = Buffer.from(broadcastTx).length;
			var unpackedLenght = Buffer.from(JSON.stringify(transactions[0])).length;

			expect(unpackedLenght).to.be.at.least(packedLenght);
			done();
		});

		it('should be ok when deserialize transaction (unpack)', function (done) {
			broadcastTx = utils.unpack(broadcastTx);
			expect(broadcastTx).to.deep.equal(transactions[0]);
			done();
		});
	});

	describe('process worker', function() {

	});

	describe('getters', function() {

		describe('get transaction by id', function() {

			xit('should be ok when transaction is in unverified list', function (done) {
				var transaction = txPool.get(transactions[5].id);
				expect(transaction.tx).to.deep.equal(transactions[5]);
				expect(transaction.status).to.equal('unverified');
				done();
			});

			xit('should be ok when transaction is in pending list', function (done) {
				var transaction = txPool.get(transactions[5].id);
				expect(transaction.tx).to.deep.equal(transactions[5]);
				expect(transaction.status).to.equal('pending');
				done();
			});

			it('should be ok when transaction is in ready list', function (done) {
				var transaction = txPool.get(transactions[5].id);
				expect(transaction.tx).to.deep.equal(transactions[5]);
				expect(transaction.status).to.equal('ready');
				done();
			});

			it('should fail when transaction is not in the pool', function (done) {
				var transaction = txPool.get(transactions[0].id);
				expect(transaction.tx).to.be.undefined;
				expect(transaction.status).to.equal('Not in pool');
				done();
			});
		});

		describe('get all by pool list', function() {

			it('should be ok when pool list is unverified', function (done) {
				var txs = txPool.getByPoolList('unverified');
				expect(txs.length).to.equal(0)
				done();
			});

			it('should be ok when pool list is pending', function (done) {
				var txs = txPool.getByPoolList('pending');
				expect(txs.length).to.equal(0)
				done();
			});
			
			it('should be ok when pool list is ready', function (done) {
				var txs = txPool.getByPoolList('ready');
				expect(txs.length).to.equal(5)
				done();
			});

			it('should fail when pool list is invalid', function (done) {
				var txs = txPool.getByPoolList('unknown');
				expect(txs).to.equal('Invalid pool list');
				done();
			});
		});

		describe('get all by id (address)', function() {

			it('should be ok when sender account is valid', function (done) {
				var txs = txPool.getByAccountId('2737453412992791987L', 'sender');

				expect(txs.unverified.length).to.equal(0);
				expect(txs.pending.length).to.equal(0);
				expect(txs.ready.length).to.equal(0);
				done();
			});

			it('should fail when sender account last char is not L', function (done) {
				var txs = txPool.getByAccountId('2737453412992791987M', 'sender');

				expect(txs).to.equal('Invalid address, last char must be "L"');
				done();
			});

			it('should fail when sender account main body is not a number', function (done) {
				var txs = txPool.getByAccountId('A737453412992791987L', 'sender');

				expect(txs).to.equal('Invalid address, must be numbers');
				done();
			});
	
			it('should be ok when recipient account is valid', function (done) {
				var txs = txPool.getByAccountId('16313739661670634666L', 'recipient');

				expect(txs.unverified.length).to.equal(0);
				expect(txs.pending.length).to.equal(0);
				expect(txs.ready.length).to.equal(0);
				done();
			});

			it('should fail when recipient account last char is not L', function (done) {
				var txs = txPool.getByAccountId('16313739661670634666M', 'recipient');

				expect(txs).to.equal('Invalid address, last char must be "L"');
				done();
			});

			it('should fail when recipient account main body is not a number', function (done) {
				var txs = txPool.getByAccountId('A6313739661670634666L', 'recipient');

				expect(txs).to.equal('Invalid address, must be numbers');
				done();
			});
		});

		describe('get all by publicKey', function() {
			it('should be ok when sender publicKey is valid', function (done) {
				var txs = txPool.getByAccountPublicKey('c76a0e680e83f47cf07c0f46b410f3b97e424171057a0f8f0f420c613da2f7b5', 'sender');

				expect(txs.unverified.length).to.equal(0);
				expect(txs.pending.length).to.equal(0);
				expect(txs.ready.length).to.equal(0);
				done();
			});

			it('should fail when sender publicKey is not a string', function (done) {
				var txs = txPool.getByAccountPublicKey(123456789, 'sender');

				expect(txs).to.equal('Invalid public key, must be a string');
				done();
			});

			it('should fail when sender publicKey is less than 64 characters long', function (done) {
				var txs = txPool.getByAccountPublicKey('c76a0e680e83f47cf07c0f46b410f3b97e424171057a0f8f0f420c613da2f7', 'sender');

				expect(txs).to.equal('Invalid public key, must be 64 characters long');
				done();
			});
	
			it('should fail when sender publicKey is greater than 64 characters long', function (done) {
				var txs = txPool.getByAccountPublicKey('c76a0e680e83f47cf07c0f46b410f3b97e424171057a0f8f0f420c613da2f7b5c1', 'sender');

				expect(txs).to.equal('Invalid public key, must be 64 characters long');
				done();
			});

			it('should fail when sender publicKey is not hex string', function (done) {
				var txs = txPool.getByAccountPublicKey('c76a0e680e83f47cf07c0f46b410f3b97e424171057a0f8f0f420c613da2c3po', 'sender');

				expect(txs).to.equal('Invalid public key, must be a hex string');
				done();
			});
			it('should be ok when requester publicKey is valid', function (done) {
				var txs = txPool.getByAccountPublicKey('c76a0e680e83f47cf07c0f46b410f3b97e424171057a0f8f0f420c613da2f7b5', 'requester');

				expect(txs.unverified.length).to.equal(0);
				expect(txs.pending.length).to.equal(0);
				expect(txs.ready.length).to.equal(0);
				done();
			});

			it('should fail when requester publicKey is not a string', function (done) {
				var txs = txPool.getByAccountPublicKey(123456789, 'requester');

				expect(txs).to.equal('Invalid public key, must be a string');
				done();
			});

			it('should fail when requester publicKey is less than 64 characters long', function (done) {
				var txs = txPool.getByAccountPublicKey('c76a0e680e83f47cf07c0f46b410f3b97e424171057a0f8f0f420c613da2f7', 'requester');

				expect(txs).to.equal('Invalid public key, must be 64 characters long');
				done();
			});
	
			it('should fail when requester publicKey is greater than 64 characters long', function (done) {
				var txs = txPool.getByAccountPublicKey('c76a0e680e83f47cf07c0f46b410f3b97e424171057a0f8f0f420c613da2f7b5c1', 'requester');

				expect(txs).to.equal('Invalid public key, must be 64 characters long');
				done();
			});

			it('should fail when requester publicKey is not hex string', function (done) {
				var txs = txPool.getByAccountPublicKey('c76a0e680e83f47cf07c0f46b410f3b97e424171057a0f8f0f420c613da2r2d2', 'requester');

				expect(txs).to.equal('Invalid public key, must be a hex string');
				done();
			});
		});
	});
});