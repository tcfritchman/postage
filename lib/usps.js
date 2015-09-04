var request = require('superagent')

module.exports = function queryUSPS (query, fn) {
    request.get('http://production.shippingapis.com/ShippingAPI.dll')
        .data({ q: query })
        .end(function (res) {
            // Check for valid response
            if () {
                return fn(null, results);
            }
            fn(new Error('Bad USPS response');
        ));
    });
}
