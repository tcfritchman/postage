var express = require('express'),
    usps = require('lib/usps'),
    config = require('./config')

/* Create App */

var app = express.createServer();

/* Config */

app.set('view engine', 'ejs');
app.set('views', __dirname + '/views');

/* Routes */

app.get('/', function (req, res) {
    res.render('index');
});

app.get('/rates', function(req, res, next) {
    var results = [];
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

    usps.queryUSPS(shipment, function(err, USPSResults) {
        if (err) return next(err);
        results.concat(USPSResults);
    });

    res.json(results);
});

/* Listen */

app.listen(config.port);
