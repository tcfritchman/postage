/* usps.js
 *
 * Generate and send a request to USPS rateV4 domestic rate calculator
 * API.
 * Documentation here:
 * https://www.usps.com/business/web-tools-apis/rate-calculator-api.htm
 *
 */

var request = require('superagent'),
    parseString = require('xml2js').parseString,
    config = require('../config')

module.exports = function queryUSPS (shipment, fn) {
    request.get('http://production.shippingapis.com/ShippingAPI.dll')
        .data({ q: generateRequest(shipment) })
        .end(function (res) {
            // Check for valid response & convert to json in convertResponse()
            if (results = convertResponse(res)) {
                return fn(null, results);
            }
            fn(new Error('Bad USPS response');
        ));
    });
}

/*
 * Private module functions
 */

function convertResponse(response) {
    var rateResults = [];
    parseString(response, {async: false}, function (err, result) {

        // TODO: check for validity here
        rv4 = result.RateV4Response;

        // TODO: check for validity here too
        for (var i=0; i<rv4.Package.length; i++) {
            postages = rv4.Package[i].Postage;

            // Not all packages have postage available
            if (!postages) continue;
            for (var j=0; j<postages.length; j++) {

                /* xml2js automatically creates arrays, even
                from non-repeating tags which is useful
                when there is only one postage for example. */

                currResult = {
                    carrier: "USPS",
                    serviceName: postages[j].MailService[0],
                    regularRate: postages[j].Rate[0],
                    onlineRate: postages[j].CommercialRate[0],
                    deliveryDate: postages[j].CommitmentDate[0]
                }
                rateResults.push(currResult);
            }
        }
    });
    return rateResults;
}

function generateRequest(shipment) {
    var rv4 = new RateV4Request();
    // TODO: set UserId
    rv4.Packages = createPackages(shipment);
    return rv4.xml();
}

function RateV4Request() {
    this.UserId = config.usps.username;
    this.Revision = "2";
    this.RateClientType = "008";
    this.Packages = [];
    this.xml = function() {
        request =   '<RateV4Request USERID="' + this.UserId + '">' +
                    "<Revision>" + this.Revision + "</Revision>" +
                    "<RateClientType>" + this.RateClientType +
                    "</RateClientType>";
        var i;
        for(i=0; i<this.Packages.length; i++) {
            request = request + this.Packages[i].xml();
        }
        request = request + "</RateV4Request>";
        return request;
    };
}

function Package() {
    this.id = null;
    this.service = null;
    this.orig = null;
    this.dest = null;
    this.pounds = null;
    this.ounces = null;
    this.container = null;
    this.size = null;
    this.width = null;
    this.length = null;
    this.height = null;
    this.girth = null;
    this.machinable = null;
    this.value = null;
    this.shipDate = null;
    this.xml = function() {
        xml = '<Package ID="' + this.id + '">' +
            "<Service>" + this.service + "</Service>" +
            "<ZipOrigination>" + this.orig + "</ZipOrigination>" +
            "<ZipDestination>" + this.dest + "</ZipDestination>" +
            "<Pounds>" + this.pounds + "</Pounds>" +
            "<Ounces>" + this.ounces + "</Ounces>" +
            "<Container>" + this.container + "</Container>" +
            "<Size>" + this.size + "</Size>" +
            "<Width>" + this.width + "</Width>" +
            "<Length>" + this.length + "</Length>" +
            "<Height>" + this.height + "</Height>" +
            "<Girth>" + this.girth + "</Girth>" +
            "<Machinable>" + this.machinable + "</Machinable>" +
            "<Value>" + this.value + "</Value>" +
            "<ShipDate>" + this.shipDate + "</ShipDate>" +
            "<RatePriceType>B</RatePriceType>" +
            "<RatePaymentType>3</RatePaymentType>" +
            "</Package>";
        return xml;
    };
}

function createPackages(shipment) {
    var packages = []

    // Is this package classified as "Large" or "Regular"?
    var large = false;
    if (shipment.width > 12 || shipment.height > 12 || shipment.length > 12) {
        large = true;
    }

    // TODO: ADD 'MACHINABLE' LOGIC
    // Is the package "machinable"?
    var machinable = true;
    switch(shipment.type) {
        case "postcard":
            break;
        case "letter":
            break;
        case "flat":
            break;
        case "parcel":
            break;
    }

    // Create a package for "online" service only
    var onlinePackage = {
        id: "Online",
        service: "ONLINE",
        orig: shipment.orig,
        dest: shipment.dest,
        pounds: shipment.pounds,
        ounces: shipment.ounces,
        container: (shipment.nonrectangular) ? "NONRECTANGULAR" : "RECTANGULAR",
        size: (large) ? "LARGE" : "REGULAR",
        width: shipment.width,
        length: shipment.length,
        height: shipment.height,
        girth: shipment.girth,
        machinable: machinable,
        value: shipment.value,
        shipDate: shipment.shipDate
    };
    packages.push(onlinePackage);
    return packages;
}
