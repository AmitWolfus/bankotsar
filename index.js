var Horseman = require('node-horseman');

module.exports = function (opts) {
	
	const padMonth = function(month) {
		var str = month.toString();
		return str.length == 2 ? str : '0' + str;
	};

	
	const now = new Date();
	now.setMonth(now.getMonth() + 1);
	
	const payday = opts.date || ('01.' + padMonth(now.getMonth() + 1) + '.' + now.getFullYear());
	
	var totalCharges = [];

	var horseman = new Horseman({
		ignoreSSLErrors: true
	});
	
	return horseman
		.open('https://online.bankotsar.co.il/LoginServices/login2.do?bankId=OTSARPRTAL')
		.type('input#username', opts.userId)
		.type('input#password', opts.password)
		.click('#login_btn')
		.wait(5000)
		.waitForSelector('#account_num_select')
		.evaluate(function (accId) {
			var form = document.refreshPortletForm;
			form.portal_current_account.value = accId + ' ';
			form.PortletForm_ACTION_NAME.value = 'changeAccount';
			$('#refreshPortletForm').submit();
		}, opts.accountId)
		.waitForNextPage()
		.wait(5000)
		.click('a[href="/wps/myportal/FibiMenu/Online/OnCreditCardsMenu/OnCrCardsDetPayms/AuthCrCardsCharges"]')
		.waitForNextPage()
		.evaluate(function () {
			var cardIds = [];
			var refs = document.getElementsByTagName('a');
			$('a').each(function (i, elem) {
				if (elem.href && elem.href.indexOf('submitLinkForm(\'211\'') !== -1) {
					var id = elem.href.substr('javascript:submitLinkForm(\'211\',\''.length);
					id = id.substr(0, id.indexOf('\''));
					if (cardIds.indexOf(id) === -1) {
						cardIds.push(id);	
					}
				}
			});
			return cardIds;
		})
		.then(function (cards) {
			var curr = 0;
			var next = function (cb) {
				var card = cards[curr++];
				if (!card) {
					return cb();
				}
				return horseman
					.evaluate(function(card, payday) {
						submitLinkForm('211', card, payday,'CH-KAROV');
					}, card, payday)
					.waitForNextPage()
					.evaluate(function () {
						var extractRow = function (tr) {
							var children = tr.children;
							return {
								date: children[0].textContent,
								bussines: children[1].textContent,
								totalSum: children[2].textContent,
								currentPayment: children[3].textContent,
								additionalInfo: children[4].textContent
							};
						};
						var charges = [];
						$('#hiuvumTbl211_1').find('tr.evenrow, tr.oddrow')
							.each(function (i, elem) {
								charges.push(extractRow(elem));
							});
						return charges;
					})
					.then(function (charges) {
						totalCharges = totalCharges.concat(charges.map(function (charge) {
							return {
								date: charge.date,
								bussines: charge.bussines,
								totalSum: charge.totalSum && parseFloat(charge.totalSum),
								currentPayment: charge.currentPayment && parseFloat(charge.currentPayment),
								additionalInfo: charge.additionalInfo
							};
						}));
					})
					.back()
					.waitForNextPage()
					.do(function (done) {
						return next(function () {
							done();
							cb();
						});
					})
			};
			return next(function () {
				return horseman.close();
			});
		})
	.then(function() {
		return totalCharges;
	});
};