var express = require('express'),
    parseString = require('xml2js').parseString,
    usps = require('./lib/usps'),
    verifyShipment = require('./lib/shipment').verify,
    createShipment = require('./lib/shipment').createShipmentFromReq,
    config = require('./config'),
    util = require('util');

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

app.get('/rates-api', function(req, res, next) {
    var shipment = createShipment(req);

    //TODO: Attach and test this verify code!
    //verifyShipment(shipment);

    usps.queryUSPS(shipment, function(err, apiQueryResults) {
        console.log("RESPONSE\n" + apiQueryResults);
        var responseData = { results:[], errors:[] };
        if (err) {
            responseData.errors.push(
                {
                    severity: "warning",
                    title: "Error:",
                    message: err.message
                }
            );
            //return next(err);
        } else {
            parseString(apiQueryResults, function(err, convertedResponse) {
                var USPSResults = usps.parseResponse(convertedResponse);
                responseData = {
                    results: responseData.results.concat(USPSResults.results),
                    errors: responseData.errors.concat(USPSResults.errors)
                }
                console.log(util.inspect(responseData,false,null));
            });
        }
        res.json(responseData);
    });
});

/* Listen */

app.listen(config.port);
console.log("Server listening on port " + config.port);
