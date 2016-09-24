# bankotsar
Node package for bank otsar ahayal

The package provides a simple function used for retreiving transactions for a user.

## Exmaple

### Get upcoming charges

```js
const bankotsar = require('bankotsar');

bankotsar({
  userId: 'A123B123',
  password: 'password',
  accountId: '111-111111',
}).then(function (charges) {
  // Do whatever you want with the charges array
});
```

### Get charges for a specific month

```js
const bankotsar = require('bankotsar');

bankotsar({
  userId: 'A123B123',
  password: 'password',
  accountId: '111-111111',
  date: '01.10.2016'
}).then(function (charges) {
  // Do whatever you want with the charges array
});
```

charges are returned as an array of objects with the following data:
* date - purchase date,
* bussines - name of the bussines,
* totalSum - total sum of the payment, if the payment was split into multiple payments this will be equal to the sum of all the payments,
* currentPayment - the sum of the current payment, if the payment was not split into payments this will be equal to totalSum
* additionalInfo - a string containing additional information about the charge, ususally exists when the payment was split
