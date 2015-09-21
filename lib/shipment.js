module.exports = {
    Shipment: function() {
        this.orig = null;
        this.dest = null;
        this.type = null;
        this.pounds = null;
        this.ounces = null;
        this.nonrectangular = null;
        this.length = null;
        this.width = null;
        this.height = null;
        this.girth = null;
        this.value = null;
        this.shipDate = null
    },
    createShipmentFromReq: function(req) {
        var s = {
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
        return s;
    },
    verify: function(s) {
        // orig, dest: US Zip Code format. Required.
        if (!s.orig || !s.dest) return false;
        if (!/^\d{5}$/.test(s.orig)) return false;
        if (!/^\d{5}$/.test(s.dest)) return false;

        // type: postcard, letter, flat or parcel. Required.
        if (  !(
            s.type == "postcard" ||
            s.type == "letter" ||
            s.type == "flat" ||
            s.type == "parcel"
            )
        ) return false;

        // pounds, ounces: positive int, at least one is required.
        // ounces exceeding 16 will be converted
        // into pounds & ounces.
        // Note: USPS does not allow weight to exceed 70 pounds total
        if ((!s.pounds) && (!s.ounces)) return false;

        if ((Math.floor(s.pounds) != s.pounds) ||
            (s.pounds < 0)
        ) return false;

        if (
            (Math.floor(s.ounces) != s.ounces) ||
            (s.ounces < 0)
        ) return false;

        var addLbs = Math.floor(s.ounces/16);
        s.pounds += addLbs;
        s.ounces -= addLbs * 16;

        //TODO: add nonrectangular support...

        // length, width, height: positive numeric value. Required.
        if(!/^((\d+(\.\d*)?)|(\.\d+))$/.test(s.length)) return false;
        if(!/^((\d+(\.\d*)?)|(\.\d+))$/.test(s.width)) return false;
        if(!/^((\d+(\.\d*)?)|(\.\d+))$/.test(s.height)) return false;

        // girth: positive numeric value. Required only when nonrectangular.
        if (s.nonrectangular) {
            if(!/^((\d+(\.\d*)?)|(\.\d+))$/.test(s.girth)) return false;
        } else {
            s.girth = "";
        }

        // value: positive integer. Optional
        // note: USPS does not allow more than 10 digits.
        if (s.value){
            if(!/^\d{1,7}\.\d{2}$/.test(s.value)) return false;
        }

        // shipDate: yyyy-mm-dd format. Optional.
        // note: USPS requires that if shipDate is used, the date may be only
        // 0-3 days in advance.
        if (s.shipDate) {
            if(!/^\d{2}-[a-zA-z]{3}-\d{4}$/.test(s.shipDate)) return false;
        }

        return s;
    }
}

function verifyZip(zip) {
    // 5 digit U.S. zipcode
    if (!zip) return false;
    if (!/^\d{5}$/.test(zip)) return false;
}

function verifyType(type) {
    // postcard, letter, flat, or parcel
    if (  !(
        s.type == "postcard" ||
        s.type == "letter" ||
        s.type == "flat" ||
        s.type == "parcel"
        )
    ) return false;
}

function verifyWeight(w) {
    if ((!w.pounds) && (!w.ounces)) return false;

    if ((Math.floor(w.pounds) != w.pounds) ||
        (w.pounds < 0)
    ) return false;

    if (
        (Math.floor(w.ounces) != w.ounces) ||
        (w.ounces < 0)
    ) return false;

    var addLbs = Math.floor(w.ounces/16);
    w.pounds += addLbs;
    w.ounces -= addLbs * 16;
    return {pounds: w.pounds, ounces: w.ounces};
}

function verifyDimension(dim) {
    // A positive numeric value
    if(!/^((\d+(\.\d*)?)|(\.\d+))$/.test(dim)) return false;
}

function verifyCost(dollars) {
    // Dollar value with exactly 2 digits after the decimal
    if(!/^\d{1,7}\.\d{2}$/.test(s.dollars)) return false;
}

function verifyDate(date) {
    // yyyy-mm-dd format
    if(!/^\d{2}-[a-zA-z]{3}-\d{4}$/.test(s.date)) return false;
}
