var express = require('express'),
    usps = require('./lib/usps'),
    verifyShipment = require('./lib/shipment').verify,
    createShipment = require('./lib/shipment').createShipmentFromReq;
    config = require('./config')

/* Create App */

var app = express();

/* Config */

app.set('view engine', 'ejs');
app.set('views', __dirname + '/views');
app.use(express.static(__dirname + '/public'))

/* Routes */

app.get('/', function (req, res) {
    res.render('pages/index');
});

app.get('/rates', function(req, res, next) {
    //console.log(req);
    var shipment = createShipment(req);
    verifyShipment(shipment);

    usps.queryUSPS(shipment, function(err, USPSResults) {
        if (err) {
            console.log(err);
            return next(err);
        }
        //console.log(JSON.stringify(USPSResults));
        res.render('partials/rateResults', {results: USPSResults});
    });
});

app.get('/rates-api', function(req, res, next) {
    var shipment = createShipment(req);
    verifyShipment(shipment);

    usps.queryUSPS(shipment, function(err, USPSResults) {
        if (err) {
            console.log(err);
            return next(err);
        }
        res.json(USPSResults);
    });
});

/* Listen */

app.listen(config.port);
console.log("Server listening on port " + config.port);
