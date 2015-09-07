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

module.exports = {
    queryUSPS: function(shipment, fn) {
        request.get('http://production.shippingapis.com/ShippingAPI.dll')
            .data({ q: generateRequest(shipment) })
            .end(function (res) {
                // Check for valid response & convert to json in convertResponse()
                if (results = convertResponse(res)) {
                    return fn(null, results);
                }
                fn(new Error('Bad USPS response'));
            });
    }
};

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

function Package(id, service, orig, dest, pounds, ounces, container, size,
                width, length, height, girth, machinable, value, shipDate) {
    this.id = id;
    this.service = service;
    this.orig = orig;
    this.dest = dest;
    this.pounds = pounds;
    this.ounces = ounces;
    this.container = container;
    this.size = size;
    this.width = width;
    this.length = length;
    this.height = height;
    this.girth = girth;
    this.machinable = machinable;
    this.value = value;
    this.shipDate = shipDate;
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
    var onlinePackage = new Package(
        "Online",
        "ONLINE",
        shipment.orig,
        shipment.dest,
        shipment.pounds,
        shipment.ounces,
        (shipment.nonrectangular) ? "NONRECTANGULAR" : "RECTANGULAR",
        (large) ? "LARGE" : "REGULAR",
        shipment.width,
        shipment.length,
        shipment.height,
        shipment.girth,
        machinable,
        shipment.value,
        shipment.shipDate
    );

    packages.push(onlinePackage);
    return packages;
}
