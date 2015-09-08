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
