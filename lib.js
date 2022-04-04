var GMFlags = /** @class */ (function () {
    function GMFlags(vals, flags_) {
        if (flags_ === void 0) { flags_ = 10; }
        this.cname = null;
        this.version = null;
        this.flag_values = {};
        for (var n in vals) {
            this.flag_values[n] = (1 << vals[n]);
        }
        if (flags_ && typeof flags_ == "number") {
            this.flags = flags_;
        }
        else {
            this.flags = 0;
        }
    }
    GMFlags.prototype.add = function (flag) {
        var _this = this;
        if (Array.isArray(flag)) {
            return flag.every(function (f) { return _this.add(f); });
        }
        else {
            if (!(flag in this.flag_values))
                return false;
            this.flags |= this.flag_values[flag];
            return true;
        }
    };
    GMFlags.prototype.has = function (flag) {
        var _this = this;
        if (Array.isArray(flag)) {
            return flag.every(function (f) { return _this.has(f); });
        }
        if (!(flag in this.flag_values))
            return false;
        var n = this.flag_values[flag];
        return ((this.flags & n) === n);
    };
    GMFlags.prototype.remove = function (flag) {
        var _this = this;
        if (Array.isArray(flag)) {
            return flag.every(function (f) { return _this.remove(f); });
        }
        if (!(flag in this.flag_values))
            return false;
        this.flags &= ~this.flag_values[flag];
        return true;
    };
    GMFlags.prototype.array = function () {
        var r = [];
        for (var f in this.flag_values) {
            var n = this.flag_values[f];
            if ((this.flags & n) === n)
                r.push(f);
        }
        return r;
    };
    GMFlags.prototype.object = function () {
        var r = {};
        for (var f in this.flag_values) {
            var n = this.flag_values[f];
            r[f] = (this.flags & n) === n;
        }
        return r;
    };
    GMFlags.prototype.setFlags = function (f) {
        this.flags = f;
    };
    GMFlags.prototype.set = function (flag, val) {
        return (val === true) ? this.add(flag) : this.remove(flag);
    };
    GMFlags.prototype.fromObject = function (o) {
        var _this = this;
        return Object.keys(o).every(function (k) { return _this.set(k, o[k]); });
    };
    return GMFlags;
}());
var GMClasses = /** @class */ (function () {
    function GMClasses(node_) {
        this.classes = [];
        this.node = node_;
    }
    GMClasses.prototype.fetch = function () {
        this.classes = this.node.className.split(" ");
        return this;
    };
    /**
     * @deprecated */
    GMClasses.prototype.get = function () { return this.fetch(); };
    GMClasses.prototype.refresh = function () {
        this.node.className = this.classes.join(" ");
        return this;
    };
    /**
     * @deprecated
     */
    GMClasses.prototype.set = function () { return this.refresh(); };
    GMClasses.prototype.add = function (class_) {
        if (Array.isArray(class_)) {
            for (var i = 0; i < class_.length; i++) {
                var c = class_[i];
                if (this.classes.indexOf(c) === -1)
                    this.classes.push(c);
            }
        }
        else {
            if (this.classes.indexOf(class_) === -1)
                this.classes.push(class_);
        }
        return this.refresh();
    };
    /**
     * @deprecated
     */
    GMClasses.prototype.addNew = function (class_) {
        return this.add(class_);
    };
    GMClasses.prototype.toggle = function (class_) {
        if (Array.isArray(class_)) {
            for (var i = 0; i < class_.length; i++) {
                this.toggle(class_[i]);
            }
        }
        else {
            (this.classes.indexOf(class_) === -1) ? this.add(class_) : this.remove(class_);
        }
        return this.refresh();
    };
    GMClasses.prototype.remove = function (class_) {
        if (Array.isArray(class_)) {
            for (var i = 0; i < class_.length; i++) {
                this.remove(class_[i]);
            }
        }
        else {
            var index = this.classes.indexOf(class_);
            if (index < 0) {
                return this;
            }
            while (index > -1) {
                this.classes.splice(index, 1);
                index = this.classes.indexOf(class_);
            }
        }
        return this.refresh();
    };
    GMClasses.prototype.clear = function () {
        this.classes = [];
        return this.refresh();
    };
    GMClasses.prototype.toString = function () {
        return this.classes.join(" ");
    };
    return GMClasses;
}());
var gm = new /** @class */ (function () {
    function class_1() {
        this.alerts_queue = [];
        this.Flags = GMFlags;
    }
    class_1.prototype.onload = function (clb) {
        window.addEventListener("load", clb);
    };
    class_1.prototype.fromIds = function (o) {
        var r = {};
        for (var n in o) {
            var id = o[n];
            if (!id || typeof (id) != "string") {
                id = n;
            }
            r[n] = document.getElementById(id);
        }
        return r;
    };
    class_1.prototype.base = function (id) {
        if (id === void 0) { id = "base"; }
        if (!id)
            return null;
        var b = document.getElementById(id);
        if (!b)
            return null;
        return gm.JSONParse(b.innerHTML);
    };
    class_1.prototype.JSONParse = function (t) {
        try {
            return JSON.parse(t);
        }
        catch (err) {
            return null;
        }
    };
    class_1.prototype.newItem = function (itemType, opts, appendTo) {
        if (opts === void 0) { opts = {}; }
        if (typeof opts == "string") {
            opts = { className: opts };
        }
        else if (opts === null) {
            opts = {};
        }
        var o = document.createElement(itemType);
        for (var k in opts) {
            if ((k in o) && k !== "style") {
                // @ts-ignore
                o[k] = opts[k];
            }
            else {
                // @ts-ignore
                o.setAttribute(k, opts[k]);
            }
        }
        if (appendTo) {
            appendTo.appendChild(o);
        }
        return o;
    };
    class_1.prototype.shuffle = function (array) {
        var currentIndex = array.length, temporaryValue, randomIndex;
        // While there remain elements to shuffle...
        while (0 !== currentIndex) {
            // Pick a remaining element...
            randomIndex = Math.floor(Math.random() * currentIndex);
            currentIndex -= 1;
            // And swap it with the current element.
            temporaryValue = array[currentIndex];
            array[currentIndex] = array[randomIndex];
            array[randomIndex] = temporaryValue;
        }
        return array;
    };
    class_1.prototype.formatNumber = function (n) {
        return String(n).replace(/(.)(?=(\d{3})+$)/g, '$1,');
    };
    class_1.prototype.request = function (url, opts, clb_) {
        if (!opts) {
            opts = {};
        }
        var r;
        r = {
            status: 0,
            http_status: -1,
            http_status_text: "unknown",
            headers: null,
            res: null
        };
        var returned = false;
        var clb = function (l) { if (!returned) {
            clb_(l);
            returned = true;
        } };
        var xhttp;
        // @ts-ignore
        if (window.XMLHttpRequest) {
            // code for modern browsers
            xhttp = new XMLHttpRequest();
        }
        else {
            // code for old IE browsers
            // @ts-ignore
            xhttp = (new ActiveXObject("Microsoft.XMLHTTP"));
        }
        if (!opts.headers) {
            opts.headers = {};
        }
        if (opts.q) {
            url += "?" + gm.buildQuery(opts.q);
        }
        if (!opts.accept_codes)
            opts.accept_codes = [200];
        xhttp.onerror = function () {
            r.status = 0;
            r.error = "Error making request";
            clb(r);
            return xhttp.abort();
        };
        xhttp.onreadystatechange = function () {
            if (this.readyState === 4) {
                r.http_status = this.status;
                r.http_status_text = this.statusText;
                r.headers = {};
                var hs = this.getAllResponseHeaders().trim().split(/[\r\n]+/);
                hs.forEach(function (line) {
                    var parts = line.split(': ');
                    var header = parts.shift().toLowerCase();
                    var value = parts.join(': ');
                    // @ts-ignore
                    r.headers[header] = value;
                });
                if (opts.accept_codes && opts.accept_codes.indexOf(this.status) === -1) {
                    r.status = 0;
                    r.error = "Error making request(" + String(this.status) + ": " + this.responseText + ")";
                    if (opts.json) {
                        var t = gm.JSONParse(this.responseText);
                        if (t === null) {
                            r.res = this.responseText;
                        }
                        else {
                            r.res = t;
                        }
                        t = null;
                    }
                    else {
                        r.res = this.responseText;
                    }
                    return clb(r);
                }
                // here, request was successfull
                if (opts.json) {
                    var t = gm.JSONParse(this.responseText);
                    if (t === null) {
                        r.status = 0;
                        r.error = "Error parsing response to JSON";
                        r.res = this.responseText;
                    }
                    else {
                        r.res = t;
                    }
                }
                else {
                    r.res = this.responseText;
                }
                r.status = 1;
                return clb(r);
            }
        };
        xhttp.ontimeout = function () {
            r.status = 0;
            r.error = "Request timeout";
            clb(r);
            return xhttp.abort();
        };
        if (opts.bodyq) {
            opts.body = gm.buildQuery(opts.bodyq);
            if (!opts.headers['content-type']) {
                opts.headers['content-type'] = "application/x-www-form-urlencoded";
            }
        }
        if (opts.body && typeof opts.body === "object") {
            try {
                opts.body = JSON.stringify(opts.body);
                if (!opts.headers['content-type']) {
                    opts.headers['content-type'] = "application/json";
                }
            }
            catch (err) {
                console.error(err);
                opts.body = null;
            }
        }
        if (opts.timeout) {
            xhttp.timeout = opts.timeout;
        }
        if (!opts.method) {
            opts.method = "GET";
        }
        xhttp.open(opts.method, url, true);
        if (!opts.headers['content-type']) {
            opts.headers['content-type'] = "application/x-www-form-urlencoded";
        }
        for (var h in opts.headers) {
            xhttp.setRequestHeader(h, opts.headers[h]);
        }
        if (opts.body) {
            xhttp.send(opts.body);
        }
        else {
            xhttp.send();
        }
    };
    class_1.prototype.requestPromise = function (url, opts) {
        //return new Promise<GMRequestReturn<ResType>>(function (resolve, reject) {
        //    gm.request(url, opts, function (r: GMRequestReturn<ResType>) {
        //        if (r.status === 1) { resolve(r); } else { reject(r); }
        //    });
        //});
        return null;
    };
    class_1.prototype.buildQuery = function (args) {
        var ret = "";
        var v;
        for (var n in args) {
            v = args[n];
            if (v === null || v === undefined) {
                continue;
            }
            if (typeof (v) == "object" || Array.isArray(v)) {
                v = JSON.stringify(v);
            }
            if (typeof (v) == "number") {
                v = String(v);
            }
            if (typeof (v) == "boolean") {
                if (v === true) {
                    v = "1";
                }
                else {
                    v = "0";
                }
            }
            v = encodeURIComponent(v);
            if (ret != "") {
                ret += "&";
            }
            ret += encodeURIComponent(n) + "=" + v;
        }
        return ret;
    };
    class_1.prototype.getDataURL = function (img, type) {
        if (type === void 0) { type = "image/png"; }
        var canvas = document.createElement("canvas");
        var ctx = canvas.getContext("2d");
        canvas.width = img.width;
        canvas.height = img.height;
        // Draw the image
        ctx.drawImage(img, 0, 0);
        try {
            return canvas.toDataURL(type);
        }
        catch (err) {
            return null;
        }
    };
    class_1.prototype.copyText = function (text, clb) {
        if (clb === void 0) { clb = function () { }; }
        if (!this.gmCopyTextarea) {
            this.gmCopyTextarea = gm.newItem("textarea", { style: "width: 0;height: 0;opacity: 1;position: fixed;left: -10px;" }, document.body);
        }
        this.gmCopyTextarea.value = text;
        var selected = document.getSelection().rangeCount > 0;
        if (selected) {
            selected = document.getSelection().getRangeAt(0);
        }
        else {
            selected = false;
        }
        this.gmCopyTextarea.select();
        this.gmCopyTextarea.setSelectionRange(0, 99999);
        document.execCommand("copy");
        if (selected) {
            document.getSelection().removeAllRanges();
            document.getSelection().addRange(selected);
        }
        clb();
    };
    class_1.prototype.changeURL = function (url, title) {
        if (title === void 0) { title = ""; }
        window.history.replaceState({}, title, url);
    };
    class_1.prototype.UTCTime = function (d1) {
        if (!d1)
            d1 = new Date();
        return (new Date(d1.getUTCFullYear(), d1.getUTCMonth(), d1.getUTCDate(), d1.getUTCHours(), d1.getUTCMinutes(), d1.getUTCSeconds(), d1.getUTCMilliseconds())).getTime();
    };
    class_1.prototype.setCookie = function (cname, cvalue, exdays) {
        if (exdays === void 0) { exdays = null; }
        var expires = "";
        if (exdays != null) {
            var d = new Date();
            d.setTime(d.getTime() + (exdays * 24 * 60 * 60 * 1000));
            var expires = ";expires=" + d.toUTCString();
        }
        document.cookie = cname + "=" + cvalue + expires + ";path=/";
    };
    class_1.prototype.getCookie = function (cname) {
        var name = cname + "=";
        var decodedCookie = decodeURIComponent(document.cookie);
        var ca = decodedCookie.split(';');
        for (var i = 0; i < ca.length; i++) {
            var c = ca[i];
            while (c.charAt(0) == ' ') {
                c = c.substring(1);
            }
            if (c.indexOf(name) == 0) {
                return c.substring(name.length, c.length);
            }
        }
        return null;
    };
    class_1.prototype.deleteCookie = function (cname) {
        gm.setCookie(cname, "null", -100);
    };
    class_1.prototype.escapeHTML = function (str) {
        return str
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    };
    class_1.prototype.deepEqual = function (object1, object2) {
        var isObject = function (object) { return (object != null && typeof object === 'object'); };
        if (!isObject(object1) || !isObject(object2)) {
            return false;
        }
        var keys1 = Object.keys(object1);
        var keys2 = Object.keys(object2);
        if (keys1.length !== keys2.length) {
            return false;
        }
        for (var i = 0; i < keys1.length; i++) {
            var key = keys1[i];
            var val1 = object1[key];
            var val2 = object2[key];
            var areObjects = isObject(val1) && isObject(val2);
            if (areObjects && !gm.deepEqual(val1, val2) || !areObjects && val1 !== val2) {
                return false;
            }
        }
        return true;
    };
    class_1.prototype.firstUpper = function (str) {
        if (str.length < 1) {
            return str.toUpperCase();
        }
        return str[0].toUpperCase() + str.slice(1).toLowerCase();
    };
    class_1.prototype.sortBy = function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        var fields = [].slice.call(args), n_fields = fields.length;
        return function (A, B) {
            var a, b, field, key, primer, reverse, result, i;
            for (i = 0; i < n_fields; i++) {
                result = 0;
                field = fields[i];
                key = typeof (field) === 'string' ? field : field.name;
                a = A[key];
                b = B[key];
                if (typeof (field.primer) !== 'undefined') {
                    a = field.primer(a);
                    b = field.primer(b);
                }
                reverse = (field.reverse) ? -1 : 1;
                if (a < b) {
                    result = reverse * -1;
                }
                ;
                if (a > b) {
                    result = reverse * 1;
                }
                ;
                if (result !== 0) {
                    break;
                }
            }
            return result;
        };
    };
    class_1.prototype.formatTime = function (milliseconds) {
        if (typeof (milliseconds) != "number") {
            return milliseconds;
        }
        if (milliseconds >= (3600 * 24 * 1000)) { //more than a day
            return String(Math.floor(milliseconds / (1000 * 60 * 60 * 24))) + "d " + String(Math.floor((milliseconds % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))) + "h " + String(Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60))) + "m " + Math.floor((milliseconds % (1000 * 60)) / 1000) + "s";
        }
        else if (milliseconds >= 3600 * 1000) {
            return String(Math.floor((milliseconds % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))) + "h " + String(Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60))) + "m " + String(Math.floor((milliseconds % (1000 * 60)) / 1000)) + "s";
        }
        else if (milliseconds >= 60 * 1000) {
            return String(Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60))) + "m " + String(Math.floor((milliseconds % (1000 * 60)) / 1000)) + "s";
        }
        else if (milliseconds >= 1000) {
            return String(Math.round(milliseconds / 1000)) + "s";
        }
        else {
            return String(milliseconds) + "ms";
        }
    };
    class_1.prototype.classes = function (node) {
        return new GMClasses(node);
    };
    class_1.prototype.CSVToArray = function (strData, strDelimiter) {
        // source: https://stackoverflow.com/questions/1293147/example-javascript-code-to-parse-csv-data
        strDelimiter = (strDelimiter || ",");
        var objPattern = new RegExp((
        // Delimiters.
        "(\\" + strDelimiter + "|\\r?\\n|\\r|^)" +
            // Quoted fields.
            "(?:\"([^\"]*(?:\"\"[^\"]*)*)\"|" +
            // Standard fields.
            "([^\"\\" + strDelimiter + "\\r\\n]*))"), "gi");
        var arrData = [[]];
        var arrMatches = null;
        while (arrMatches = objPattern.exec(strData)) {
            var strMatchedDelimiter = arrMatches[1];
            if (strMatchedDelimiter.length &&
                strMatchedDelimiter !== strDelimiter) {
                arrData.push([]);
            }
            var strMatchedValue;
            if (arrMatches[2]) {
                strMatchedValue = arrMatches[2].replace(new RegExp("\"\"", "g"), "\"");
            }
            else {
                strMatchedValue = arrMatches[3];
            }
            arrData[arrData.length - 1].push(strMatchedValue);
        }
        return (arrData);
    };
    class_1.prototype.alert = function (title_, body_, type_, continueWith) {
        if (type_ === void 0) { type_ = "normal"; }
        if (continueWith === void 0) { continueWith = function () { }; }
        if (document.getElementsByClassName("gm-alert-container").length === 0) {
            gm.newItem("div", "gm-alert-background", document.body);
            var a = gm.newItem("div", "gm-alert", gm.newItem("div", "gm-alert-container", document.body));
            gm.newItem("div", "gm-alert-title", a);
            gm.newItem("div", "gm-alert-body", a);
            gm.newItem("button", { className: "gm-alert-button", innerText: "Ok" }, a);
        }
        if (document.body.className.indexOf("gm-alert-visible") === -1) {
        }
        var al = document.getElementsByClassName("gm-alert")[0];
    };
    return class_1;
}())();
var profileDropDown = null;
window.addEventListener("load", function () { profileDropDown = document.getElementById("nav-profile-dropdown"); });
function openProfileDropdown(clicked, event) {
    if (profileDropDown.classList.contains("open")) {
        return;
    }
    profileDropDown.classList.add("open");
    var x, y;
    // x = event.pageX;
    // y = event.pageY;
    x = clicked.offsetLeft;
    y = clicked.offsetTop + clicked.offsetHeight;
    var w = profileDropDown.offsetWidth, h = profileDropDown.offsetHeight;
    // y += h;
    if (x + w > window.innerWidth) {
        x -= w;
        x += clicked.offsetWidth;
    }
    // if (y + h > window.innerHeight) {
    //   y -= h;
    // }
    // console.log([event.pageX,event.pageY],[w,h],[x,y]);
    profileDropDown.style.left = x;
    profileDropDown.style.top = y;
    var hand = function (e) {
        e.preventDefault();
        //if (!e.target) { return par.close(); }
        if (!profileDropDown.contains(e.target)) {
            profileDropDown.classList.remove("open");
            setTimeout(function () {
                window.removeEventListener("click", hand);
            }, 1);
        }
    };
    setTimeout(function () {
        window.addEventListener("click", hand);
    }, 1);
}
//# sourceMappingURL=lib.js.map