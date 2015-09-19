/* usps.js
 *
 * Generate and send a request to USPS rateV4 domestic rate calculator
 * API.
 * Documentation here:
 * https://www.usps.com/business/web-tools-apis/rate-calculator-api.htm
 *
 */

var request = require('request'),
    parseString = require('xml2js').parseString,
    config = require('../config')

module.exports = {
    queryUSPS: function(shipment, fn) {
        var url = 'http://production.shippingapis.com/ShippingAPI.dll';
        var qs = generateRequest(shipment);

        //TODO: Add timeout to request
        request({
            method: 'GET',
            url: url,
            qs: qs
        },
        function (error, res, body) {
            // Check for valid response & convert to json in convertResponse()
            convertResponse(body, function(err, results) {
                return fn(err, results);
            });

        });
    }
};


/*
 * Private module functions
 */

function convertResponse(response, fn) {
    //console.log("RESPONSE\n" + response);
    var rateResults = [];
    parseString(response, {async: false}, function (err, result) {
        if (!result.RateV4Response)
            return fn(new Error('Bad USPS response: ' + response));

        rv4 = result.RateV4Response;

        if (!rv4.Package.length)
            return fn(new Error('Bad USPS response: ' + response));

        for (var i=0; i<rv4.Package.length; i++) {
            if (rv4.Package[i].Error)
                return fn(new Error('Bad USPS response: ' + response));

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
    return fn(null, rateResults);
}

function generateRequest(shipment) {
    var rv4 = new RateV4Request();
    // TODO: set UserId
    rv4.Packages = createPackages(shipment);
    return {api: 'RateV4', xml: rv4.xml()};
}

function RateV4Request() {
    this.UserId = config.usps.username;
    this.Revision = "2";
    this.RateClientType = "008";
    this.Packages = [];
    this.xml = function() {
        req =       '<RateV4Request USERID="' + this.UserId + '">' +
                    "<Revision>" + this.Revision + "</Revision>" +
                    "<RateClientType>" + this.RateClientType +
                    "</RateClientType>";
        var i;
        for(i=0; i<this.Packages.length; i++) {
            req = req + this.Packages[i].xml();
        }
        req = req + "</RateV4Request>";
        //console.log("REQUEST\n" + req);
        return req;
    };
}

function Package(id, service, orig, dest, pounds, ounces, container, size,
                width, length, height, girth, value, machinable, shipDate) {
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
    this.value = value;
    this.machinable = machinable;
    this.shipDate = shipDate;
    this.xml = function() {
        xml = "<Package"
        xml += (typeof this.id != 'undefined') ?
            ' ID="' + this.id + '">' : '>';
        xml += (typeof this.service != 'undefined') ?
            "<Service>" + this.service + "</Service>" : "";
        xml += (typeof this.orig != 'undefined') ?
            "<ZipOrigination>" + this.orig + "</ZipOrigination>" : "";
        xml += (typeof this.dest != 'undefined') ?
            "<ZipDestination>" + this.dest + "</ZipDestination>" : "";
        xml += (typeof this.pounds != 'undefined') ?
            "<Pounds>" + this.pounds + "</Pounds>" : "";
        xml += (typeof this.ounces != 'undefined') ?
            "<Ounces>" + this.ounces + "</Ounces>" : "";
        xml += (typeof this.container != 'undefined') ?
            "<Container>" + this.container + "</Container>" : "";
        xml += (typeof this.size != 'undefined') ?
            "<Size>" + this.size + "</Size>" : "";
        xml += (typeof this.width != 'undefined') ?
            "<Width>" + this.width + "</Width>" : "";
        xml += (typeof this.length != 'undefined') ?
            "<Length>" + this.length + "</Length>" : "";
        xml += (typeof this.height != 'undefined') ?
            "<Height>" + this.height + "</Height>" : "";
        xml += (typeof this.girth != 'undefined') ?
            "<Girth>" + this.girth + "</Girth>" : "";
        xml += (typeof this.value != 'undefined') ?
            "<Value>" + this.value + "</Value>" : "";
        xml += (typeof this.machinable != 'undefined') ?
            "<Machinable>" + this.machinable + "</Machinable>" : "";
        xml += (typeof this.shipDate != 'undefined') ?
            "<ShipDate>" + this.shipDate + "</ShipDate>" : "";
        xml += "<RatePriceType>B</RatePriceType>" +
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
        (large) ? "RECTANGULAR" : "", //TODO: add nonrectangular option.
        (large) ? "LARGE" : "REGULAR",
        shipment.width,
        shipment.length,
        shipment.height,
        shipment.girth,
        shipment.value,
        machinable,
        shipment.shipDate
    );

    packages.push(onlinePackage);
    return packages;
}
