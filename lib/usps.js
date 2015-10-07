/* usps.js
 *
 * Generate and send a request to USPS rateV4 domestic rate calculator
 * API.
 * Documentation here:
 * https://www.usps.com/business/web-tools-apis/rate-calculator-api.htm
 *
 */

var request = require('request'),
    config = require('../config')

module.exports = {
    queryUSPS: function(shipment, fn) {
        var url = 'http://production.shippingapis.com/ShippingAPI.dll';
        var qs = generateRequest(shipment);
        request({
            method: 'GET',
            url: url,
            timeout: 15000,
            qs: qs
        },
        function handleResponse(err, res, body) {
            if (err) { // request error
                return fn(err);
            }
            return fn(null, body);
        });
    },
    parseResponse: function(result) {
        /* xml2js automatically creates arrays, even
        from non-repeating tags which is useful
        when there is only one postage for example. */

        var rateResults = { results:[], errors:[] };
        var currResult;

        if (!result.RateV4Response) {
            if (result.Error && result.Error.Description[0]) {
                var msg = result.Error.Description[0];
            } else {
                var msg = "Bad USPS response, no <RateV4Response>.";
            }
            rateResults.errors.push(
                {
                    severity: "warning",
                    title: "Error: ",
                    message: msg
                }
            );
            return rateResults;
        }

        rv4 = result.RateV4Response;

        if (!rv4.Package.length) {
            rateResults.errors.push(
                {
                    severity: "warning",
                    title: "Error: ",
                    message: "Bad USPS response, no <Package>."
                }
            );
            return rateResults;
        }

        for (var i=0; i<rv4.Package.length; i++) {
            // Look for an error in the <Package>.
            if (rv4.Package[i].Error) {
                if (rv4.Package[i].Error[0].Description[0]) {
                    rateResults.errors.push(
                        {
                            severity: "warning",
                            title: "Package Error: ",
                            message: rv4.Package[i].Error[0].Description[0]
                        }
                    );
                }
                continue;
            }

            // Not all packages have postage available
            if (!rv4.Package[i].Postage) {
                continue;
            }
            postages = rv4.Package[i].Postage;

            for (var j=0; j<postages.length; j++) {

                currResult = {
                    carrier: "USPS",
                    serviceName: null,
                    regularRate: null,
                    onlineRate: null,
                    deliveryDate: null
                }

                if (typeof postages[j].MailService !== 'undefined') {
                    currResult.serviceName = postages[j].MailService[0];
                } else {
                    continue;
                }

                if (typeof postages[j].Rate !== 'undefined') {
                    currResult.regularRate = postages[j].Rate[0];
                } else {
                    continue;
                }

                currResult.onlineRate =
                    (typeof postages[j].CommercialRate === 'undefined') ?
                        "" : postages[j].CommercialRate[0];

                currResult.deliveryDate =
                    (typeof postages[j].CommitmentDate === 'undefined') ?
                        "" : postages[j].CommitmentDate[0];

                rateResults.results.push(currResult);
            }
        }
        return rateResults;
    }
};


/*
 * Private module functions
 */


function generateRequest(shipment) {
    var rv4 = new RateV4Request();
    rv4.Packages = createPackages(shipment);
    return {api: 'RateV4', xml: rv4.xml()};
}

function RateV4Request() {
    this.UserId = config.usps.username;
    this.Revision = "2";
    this.Packages = [];
    this.xml = function() {
        req =       '<RateV4Request USERID="' + this.UserId + '">' +
                    "<Revision>" + this.Revision + "</Revision>";
        var i;
        for(i=0; i<this.Packages.length; i++) {
            req = req + this.Packages[i].xml();
        }
        req = req + "</RateV4Request>";
        console.log("REQUEST\n" + req);
        return req;
    };
}

function Package(id, service, firstClassType, orig, dest, pounds, ounces, container, size,
                width, length, height, girth, value, machinable, shipDate) {
    this.id = id;
    this.service = service;
    this.firstClassType = firstClassType;
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

    // Checks to see if package parameter has a value
    var isValid = function(v) {
        if (typeof v === 'undefined')
            return false;
        if (typeof v === 'string' && v.length < 1)
            return false
        // otherwise
        return true;
    };

    this.xml = function() {
        xml = "<Package"
        xml += (isValid(this.id)) ?
            ' ID="' + this.id + '">' : '>';
        xml += (isValid(this.service)) ?
            "<Service>" + this.service + "</Service>" : "";
        xml += (isValid(this.firstClassType)) ?
            "<FirstClassMailType>" + this.firstClassType + "</FirstClassMailType>" : "";
        xml += (isValid(this.orig)) ?
            "<ZipOrigination>" + this.orig + "</ZipOrigination>" : "";
        xml += (isValid(this.dest)) ?
            "<ZipDestination>" + this.dest + "</ZipDestination>" : "";
        xml += (isValid(this.pounds)) ?
            "<Pounds>" + this.pounds + "</Pounds>" : "";
        xml += (isValid(this.ounces)) ?
            "<Ounces>" + this.ounces + "</Ounces>" : "";
        xml += (isValid(this.container)) ?
            "<Container>" + this.container + "</Container>" : "";
        xml += (isValid(this.size)) ?
            "<Size>" + this.size + "</Size>" : "";
        xml += (isValid(this.width)) ?
            "<Width>" + this.width + "</Width>" : "";
        xml += (isValid(this.length)) ?
            "<Length>" + this.length + "</Length>" : "";
        xml += (isValid(this.height)) ?
            "<Height>" + this.height + "</Height>" : "";
        xml += (isValid(this.girth)) ?
            "<Girth>" + this.girth + "</Girth>" : "";
        xml += (isValid(this.value)) ?
            "<Value>" + this.value + "</Value>" : "";
        xml += (isValid(this.machinable)) ?
            "<Machinable>" + this.machinable + "</Machinable>" : "";
        xml += (isValid(this.shipDate)) ?
            "<ShipDate>" + this.shipDate + "</ShipDate>" : "";
        xml += "</Package>";
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
    shipment.large = large;

    //TEMP
    shipment.nonrectangular = false;

    // TODO: ADD 'MACHINABLE' LOGIC
    // Is the package "machinable"?
    var machinable = "True";
    shipment.machinable = machinable;

    switch(shipment.type) {
        case "postcard":
            packages.push(createFirstClassPostcardPackage(shipment));
            break;
        case "letter":
            packages.push(createFirstClassLetterPackage(shipment));
            addPriorityLetterPackages(packages, shipment);
            break;
        case "flat":
            packages.push(createFirstClassFlatPackage(shipment));
            addPriorityFlatPackages(packages, shipment);
            break;
        case "parcel":
            packages.push(createFirstClassParcelPackage(shipment));
            addPriorityParcelPackages(packages, shipment);
            break;
    }
    return packages;
}

//TODO: Try using a better design pattern here. Maybe factory?
function createOnlinePackage(shipment) {
    var p = new Package(
        "Online",
        "ONLINE",
        "",
        shipment.orig,
        shipment.dest,
        shipment.pounds,
        shipment.ounces,
        (shipment.large) ? "RECTANGULAR" : " ",  // Use space so that container
                                                 //tag gets created

        //TODO: add nonrectangular option.

        (shipment.large) ? "LARGE" : "REGULAR",
        shipment.width,
        shipment.length,
        shipment.height,
        (shipment.nonrectangular) ? shipment.girth : "",
        shipment.value,
        shipment.machinable,
        shipment.shipDate
    );
    return p;
}

function createFirstClassPostcardPackage(shipment) {
    var p = new Package(
        "Postcard",
        "FIRST CLASS",
        "POSTCARD",
        shipment.orig,
        shipment.dest,
        shipment.pounds, // Max weight 3.5 oz.
        shipment.ounces,
        " ", // Whitespace added to include <container> tag.
        (shipment.large) ? "LARGE" : "REGULAR",
        "",
        "",
        "",
        "",
        "",
        shipment.machinable,
        ""
    );
    return p;
}

function createFirstClassLetterPackage(shipment) {
    var p = new Package(
        "Letter",
        "FIRST CLASS",
        "LETTER",
        shipment.orig,
        shipment.dest,
        shipment.pounds, // Max weight 3.5 oz.
        shipment.ounces,
        " ", // Whitespace added to include <container> tag.
        (shipment.large) ? "LARGE" : "REGULAR", // Size should not matter?
        "",
        "",
        "",
        "",
        "",
        shipment.machinable,
        ""
    );
    return p;
}

function createFirstClassFlatPackage(shipment) {
    var p = new Package(
        "Flat",
        "FIRST CLASS",
        "FLAT",
        shipment.orig,
        shipment.dest,
        shipment.pounds, // Max weight 13 oz.
        shipment.ounces,
        " ", // Whitespace added to include <container> tag.
        (shipment.large) ? "LARGE" : "REGULAR",
        "",
        "",
        "",
        "",
        "",
        shipment.machinable,
        ""
    );
    return p;
}

function createFirstClassParcelPackage(shipment) {
    var p = new Package(
        "Flat",
        "FIRST CLASS",
        "PARCEL",
        shipment.orig,
        shipment.dest,
        shipment.pounds, // Max weight 13 oz.
        shipment.ounces,
        (shipment.large) ? "RECTANGULAR" : " ",  // Use space so that container
                                                 //tag gets created

        //TODO: add nonrectangular option.

        (shipment.large) ? "LARGE" : "REGULAR",
        shipment.width,
        shipment.length,
        shipment.height,
        (shipment.nonrectangular) ? shipment.girth : "",
        "",
        shipment.machinable,
        ""
    );
    return p;
}

function addPriorityParcelPackages(packages, shipment) {
    var parcelContainers = [
        "LG FLAT RATE BOX",
        "MD FLAT RATE BOX",
        "SM FLAT RATE BOX",
        "FLAT RATE BOX",
        "VARIABLE"
    ]
    for (var i=0; i<parcelContainers.length; i++) {
        packages.push(new Package(
            "Priority",
            "PRIORITY",
            "",
            shipment.orig,
            shipment.dest,
            shipment.pounds,
            shipment.ounces,
            (shipment.large) ? "RECTANGULAR" : parcelContainers[i],

            //TODO: add nonrectangular option.

            (shipment.large) ? "LARGE" : "REGULAR",
            shipment.width,
            shipment.length,
            shipment.height,
            (shipment.nonrectangular) ? shipment.girth : "",
            "",
            shipment.machinable,
            ""
        ));
    }
}

function addPriorityFlatPackages(packages, shipment) {
    var flatContainers = [
        "FLAT RATE ENVELOPE",
        "LEGAL FLAT RATE ENVELOPE",
        "PADDED FLAT RATE ENVELOPE",
    ]
    for (var i=0; i<flatContainers.length; i++) {
        packages.push(new Package(
            "Priority",
            "PRIORITY",
            "",
            shipment.orig,
            shipment.dest,
            shipment.pounds,
            shipment.ounces,
            (shipment.large) ? "RECTANGULAR" : flatContainers[i],

            //TODO: add nonrectangular option.

            (shipment.large) ? "LARGE" : "REGULAR",
            shipment.width,
            shipment.length,
            shipment.height,
            (shipment.nonrectangular) ? shipment.girth : "",
            "",
            shipment.machinable,
            ""
        ));
    }
}

function addPriorityLetterPackages(packages, shipment) {
    var letterContainers = [
        "SM FLAT RATE ENVELOPE",
        "WINDOW FLAT RATE ENVELOPE"
    ]
    for (var i=0; i<letterContainers.length; i++) {
        packages.push(new Package(
            "Priority",
            "PRIORITY",
            "",
            shipment.orig,
            shipment.dest,
            shipment.pounds,
            shipment.ounces,
            (shipment.large) ? "RECTANGULAR" : letterContainers[i],

            //TODO: add nonrectangular option.

            (shipment.large) ? "LARGE" : "REGULAR",
            shipment.width,
            shipment.length,
            shipment.height,
            (shipment.nonrectangular) ? shipment.girth : "",
            "",
            shipment.machinable,
            ""
        ));
    }
}
