var express = require('express'),
    usps = require('./lib/usps'),
    verifyShipment = require('./lib/shipment').verify,
    config = require('./config')

/* Create App */

var app = express();

/* Config */

app.set('view engine', 'ejs');
app.set('views', __dirname + '/views');

/* Routes */

app.get('/', function (req, res) {
    res.render('pages/index');
});

app.get('/rates', function(req, res, next) {
    var shipment = {
        orig:req.query.orig,
        dest:req.query.dest,
        type:req.query.type,
        pounds:req.query.pounds,
        ounces:req.query.ounces,
        nonrectangular:req.query.nonrectangular,
        length:req.query.length,
        width:req.query.width,
        height:req.query.height,
        girth:req.query.girth,
        value:req.query.value,
        shipDate:req.query.shipDate
    }

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
