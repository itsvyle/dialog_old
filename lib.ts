interface GMFromIdsArgument {
    [index: string]: string | null
}
interface GMNewItemOptions {
    className?: string;
    style?: string;
    innerText?: string;
    innerHTML?: string;
    [index: string]: string | number | boolean | null;
}

interface GMRequestHeaders {
    "content-type"?: string;
    [index: string]: string | undefined;
}
interface GMRequestOptions {
    method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
    headers?: GMRequestHeaders;
    q?: Record<string, any>;
    accept_codes?: number[];
    json?: boolean;
    body?: any;
    bodyq?: Record<string, any>;
    timeout?: number;
}
interface GMRequestReturn<Type> {
    status: (0 | 1);
    error?: string;
    http_status: number;
    http_status_text: string;
    headers: GMRequestHeaders | null;
    res: Type | null | string;
}
type GMFlagChangeArgument = (string | string[])
type GMSortBy = {
    name: string;
    primer?: (a: any) => any;
    reverse?: boolean;
}
type GMAlert = {
    title: string;
    body: string;
    type_: ("normal" | "error" | "success");
    continueWith: () => void;
};
class GMFlags {
    flag_values: Record<string, number>;
    flags: number;
    cname: string | null = null;
    version: string | null = null

    constructor(vals: Record<string, number>, flags_: number = 10) {
        this.flag_values = {};
        for (let n in vals) {
            this.flag_values[n] = (1 << vals[n]);
        }
        if (flags_ && typeof flags_ == "number") { this.flags = flags_; } else { this.flags = 0; }
    }

    add(flag: GMFlagChangeArgument): boolean {
        if (Array.isArray(flag)) {
            return flag.every((f) => this.add(f));
        } else {
            if (!(flag in this.flag_values)) return false;
            this.flags |= this.flag_values[flag];
            return true
        }
    }

    has(flag: GMFlagChangeArgument): boolean {
        if (Array.isArray(flag)) {
            return flag.every(f => this.has(f));
        }
        if (!(flag in this.flag_values)) return false;
        let n = this.flag_values[flag];
        return ((this.flags & n) === n);
    }

    remove(flag: GMFlagChangeArgument): boolean {
        if (Array.isArray(flag)) {
            return flag.every(f => this.remove(f));
        }
        if (!(flag in this.flag_values)) return false;
        this.flags &= ~this.flag_values[flag];
        return true;
    }

    array(): string[] {
        let r: string[] = [];
        for (let f in this.flag_values) {
            let n = this.flag_values[f];
            if ((this.flags & n) === n) r.push(f);
        }
        return r;
    }

    object(): Record<string, boolean> {
        let r: Record<string, boolean> = {};
        for (let f in this.flag_values) {
            let n = this.flag_values[f];
            r[f] = (this.flags & n) === n;
        }
        return r;
    }
    setFlags(f: number): void {
        this.flags = f;
    }
    set(flag, val): boolean {
        return (val === true) ? this.add(flag) : this.remove(flag);
    }
    fromObject(o: Record<string, boolean>): boolean {
        return Object.keys(o).every(k => this.set(k, o[k]));
    }
}

class GMClasses {
    node: HTMLElement;
    classes: string[] = [];
    constructor(node_: HTMLElement) {
        this.node = node_;
    }
    fetch(): GMClasses {
        this.classes = this.node.className.split(" ");
        return this;
    }
    /**
     * @deprecated */
    get(): GMClasses { return this.fetch(); }

    refresh(): GMClasses {
        this.node.className = this.classes.join(" ");
        return this;
    }
    /**
     * @deprecated 
     */
    set(): GMClasses { return this.refresh(); }

    add(class_: string | string[]): GMClasses {
        if (Array.isArray(class_)) {
            for (let i = 0; i < class_.length; i++) {
                let c = class_[i];
                if (this.classes.indexOf(c) === -1) this.classes.push(c);
            }
        } else {
            if (this.classes.indexOf(class_) === -1) this.classes.push(class_);
        }
        return this.refresh();
    }
    /**
     * @deprecated
     */
    addNew(class_: string | string[]): GMClasses {
        return this.add(class_);
    }

    toggle(class_: string | string[]): GMClasses {
        if (Array.isArray(class_)) {
            for (let i = 0; i < class_.length; i++) {
                this.toggle(class_[i]);
            }
        } else {
            (this.classes.indexOf(class_) === -1) ? this.add(class_) : this.remove(class_);
        }
        return this.refresh();
    }
    remove(class_: string | string[]): GMClasses {
        if (Array.isArray(class_)) {
            for (let i = 0; i < class_.length; i++) {
                this.remove(class_[i]);
            }
        } else {
            var index = this.classes.indexOf(class_);
            if (index < 0) { return this; }
            while (index > -1) {
                this.classes.splice(index, 1);
                index = this.classes.indexOf(class_);
            }
        }
        return this.refresh();
    }
    clear(): GMClasses {
        this.classes = [];
        return this.refresh();
    }


    toString() {
        return this.classes.join(" ");
    }
}

const gm = new class {
    Flags: typeof GMFlags;
    private gmCopyTextarea: HTMLTextAreaElement | null;
    private alerts_queue: GMAlert[] = [];

    constructor() {
        this.Flags = GMFlags;
    }

    onload(clb: (e?: Event) => any): void {
        window.addEventListener("load", clb);
    }

    fromIds(o: Record<string, string> | null): Record<string, (HTMLElement | null)> {
        let r: Record<string, HTMLElement | null> = {};
        for (var n in o) {
            var id: string | null = o[n];
            if (!id || typeof (id) != "string") { id = n; }
            r[n] = document.getElementById(id);
        }
        return r;
    }
    base<ReturnType>(id: string = "base"): (ReturnType | null) {
        if (!id) return null;
        let b = <HTMLElement>document.getElementById(id);
        if (!b) return null;
        return <ReturnType>gm.JSONParse(b.innerHTML);
    }

    JSONParse(t: string): (Object | null) {
        try { return JSON.parse(t); } catch (err) { return null; }
    }

    newItem(itemType: string, opts: GMNewItemOptions | string | null = {}, appendTo?: (HTMLElement | null)): HTMLElement {
        if (typeof opts == "string") { opts = { className: opts }; } else if (opts === null) { opts = {}; }
        let o: HTMLElement = <HTMLElement>document.createElement(itemType);
        for (let k in opts) {
            if ((k in o) && k !== "style") {
                // @ts-ignore
                o[k] = opts[k];
            } else {
                // @ts-ignore
                o.setAttribute(k, opts[k]);
            }
        }
        if (appendTo) {
            appendTo.appendChild(o);
        }
        return o;
    }

    shuffle(array: any[]): any[] {
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
    }

    formatNumber(n: number): string {
        return String(n).replace(/(.)(?=(\d{3})+$)/g, '$1,');
    }

    request<ResType>(url: string, opts: GMRequestOptions, clb_: (r: GMRequestReturn<ResType>) => any): void {
        if (!opts) { opts = {}; }
        var r: GMRequestReturn<ResType>;
        r = {
            status: 0,
            http_status: -1,
            http_status_text: "unknown",
            headers: null,
            res: null
        };
        var returned = false;
        var clb = (l: GMRequestReturn<ResType>) => { if (!returned) { clb_(l); returned = true; } };

        var xhttp: XMLHttpRequest;
        // @ts-ignore
        if (window.XMLHttpRequest) {
            // code for modern browsers
            xhttp = new XMLHttpRequest();
        } else {
            // code for old IE browsers
            // @ts-ignore
            xhttp = <XMLHttpRequest>(new ActiveXObject("Microsoft.XMLHTTP"));
        }
        if (!opts.headers) { opts.headers = {}; }

        if (opts.q) { url += "?" + gm.buildQuery(opts.q); }
        if (!opts.accept_codes) opts.accept_codes = [200];
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
                    var header = (<string>parts.shift()).toLowerCase();
                    var value = parts.join(': ');
                    // @ts-ignore
                    r.headers[header] = value;
                });
                if (opts.accept_codes && opts.accept_codes.indexOf(this.status) === -1) {
                    r.status = 0;
                    r.error = "Error making request(" + String(this.status) + ": " + this.responseText + ")";
                    if (opts.json) {
                        let t: (Object | null) = gm.JSONParse(this.responseText);
                        if (t === null) {
                            r.res = this.responseText;
                        } else {
                            r.res = <ResType>t;
                        }
                        t = null;
                    } else {
                        r.res = this.responseText;
                    }
                    return clb(r);
                }
                // here, request was successfull
                if (opts.json) {
                    let t: (Object | null) = gm.JSONParse(this.responseText);
                    if (t === null) {
                        r.status = 0;
                        r.error = "Error parsing response to JSON";
                        r.res = this.responseText;
                    } else {
                        r.res = <ResType>t;
                    }
                } else {
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
            if (!opts.headers['content-type']) { opts.headers['content-type'] = "application/x-www-form-urlencoded"; }
        }
        if (opts.body && typeof opts.body === "object") {
            try {
                opts.body = JSON.stringify(opts.body);
                if (!opts.headers['content-type']) { opts.headers['content-type'] = "application/json"; }
            } catch (err) {
                console.error(err);
                opts.body = null;
            }
        }
        if (opts.timeout) {
            xhttp.timeout = opts.timeout;
        }
        if (!opts.method) { opts.method = "GET"; }
        xhttp.open(opts.method, url, true);


        if (!opts.headers['content-type']) {
            opts.headers['content-type'] = "application/x-www-form-urlencoded";
        }
        for (var h in opts.headers) {
            xhttp.setRequestHeader(h, <string>opts.headers[h]);
        }
        if (opts.body) {
            xhttp.send(opts.body);
        } else {
            xhttp.send();
        }

    }

    requestPromise<ResType>(url: string, opts: GMRequestOptions): (Promise<GMRequestReturn<ResType>> | null) {
        //return new Promise<GMRequestReturn<ResType>>(function (resolve, reject) {
        //    gm.request(url, opts, function (r: GMRequestReturn<ResType>) {
        //        if (r.status === 1) { resolve(r); } else { reject(r); }
        //    });
        //});
        return null;
    }

    buildQuery(args: Record<string, any>): string {
        var ret = ""; var v: any;
        for (var n in args) {
            v = args[n];
            if (v === null || v === undefined) { continue; }
            if (typeof (v) == "object" || Array.isArray(v)) { v = JSON.stringify(v); }
            if (typeof (v) == "number") { v = String(v); }
            if (typeof (v) == "boolean") { if (v === true) { v = "1"; } else { v = "0"; } }
            v = encodeURIComponent(v);
            if (ret != "") { ret += "&"; }
            ret += encodeURIComponent(n) + "=" + v;
        }
        return ret;
    }

    getDataURL(img: HTMLImageElement, type: string = "image/png"): string | null {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        canvas.width = img.width;
        canvas.height = img.height;
        // Draw the image
        ctx.drawImage(img, 0, 0);
        try {
            return canvas.toDataURL(type);
        } catch (err) {
            return null;
        }
    }

    copyText(text: string, clb: () => void = () => { }): void {
        if (!this.gmCopyTextarea) {
            this.gmCopyTextarea = gm.newItem("textarea", { style: "width: 0;height: 0;opacity: 1;position: fixed;left: -10px;" }, document.body) as HTMLTextAreaElement;
        }
        this.gmCopyTextarea.value = text;
        var selected: Range | boolean = document.getSelection().rangeCount > 0;
        if (selected) {
            selected = document.getSelection().getRangeAt(0);
        } else {
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
    }

    changeURL(url: string, title: string = ""): void {
        window.history.replaceState({}, title, url);
    }

    UTCTime(d1?: Date): number {
        if (!d1) d1 = new Date();
        return (new Date(d1.getUTCFullYear(), d1.getUTCMonth(), d1.getUTCDate(), d1.getUTCHours(), d1.getUTCMinutes(), d1.getUTCSeconds(), d1.getUTCMilliseconds())).getTime();
    }

    setCookie(cname: string, cvalue: string, exdays: number | null = null) {
        var expires = "";
        if (exdays != null) {
            var d = new Date();
            d.setTime(d.getTime() + (exdays * 24 * 60 * 60 * 1000));
            var expires = ";expires=" + d.toUTCString();
        }
        document.cookie = cname + "=" + cvalue + expires + ";path=/";
    }

    getCookie(cname: string): string | null {
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
    }
    deleteCookie(cname: string) {
        gm.setCookie(cname, "null", -100);
    }

    escapeHTML(str: string) {
        return str
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    deepEqual(object1: object, object2: object): boolean {
        var isObject = function (object) { return (object != null && typeof object === 'object'); };
        if (!isObject(object1) || !isObject(object2)) { return false; }
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
            if (areObjects && !gm.deepEqual(val1, val2) || !areObjects && val1 !== val2
            ) { return false; }
        }
        return true;
    }

    firstUpper(str: string): string {
        if (str.length < 1) { return str.toUpperCase(); }
        return str[0].toUpperCase() + str.slice(1).toLowerCase();
    }
    sortBy(...args: GMSortBy[]): (a, b) => number {
        var fields = [].slice.call(args),
            n_fields = fields.length;

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

                if (a < b) { result = reverse * -1 };
                if (a > b) { result = reverse * 1 };
                if (result !== 0) { break; }
            }
            return result;
        };
    }

    formatTime(milliseconds: number): string {
        if (typeof (milliseconds) != "number") { return milliseconds; }
        if (milliseconds >= (3600 * 24 * 1000)) {//more than a day
            return String(Math.floor(milliseconds / (1000 * 60 * 60 * 24))) + "d " + String(Math.floor((milliseconds % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))) + "h " + String(Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60))) + "m " + Math.floor((milliseconds % (1000 * 60)) / 1000) + "s";
        } else if (milliseconds >= 3600 * 1000) {
            return String(Math.floor((milliseconds % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))) + "h " + String(Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60))) + "m " + String(Math.floor((milliseconds % (1000 * 60)) / 1000)) + "s";
        } else if (milliseconds >= 60 * 1000) {
            return String(Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60))) + "m " + String(Math.floor((milliseconds % (1000 * 60)) / 1000)) + "s";
        } else if (milliseconds >= 1000) {
            return String(Math.round(milliseconds / 1000)) + "s";
        } else {
            return String(milliseconds) + "ms";
        }
    }

    classes(node: HTMLElement) {
        return new GMClasses(node);
    }

    CSVToArray(strData, strDelimiter) {
        // source: https://stackoverflow.com/questions/1293147/example-javascript-code-to-parse-csv-data
        strDelimiter = (strDelimiter || ",");
        var objPattern = new RegExp(
            (
                // Delimiters.
                "(\\" + strDelimiter + "|\\r?\\n|\\r|^)" +

                // Quoted fields.
                "(?:\"([^\"]*(?:\"\"[^\"]*)*)\"|" +

                // Standard fields.
                "([^\"\\" + strDelimiter + "\\r\\n]*))"
            ),
            "gi"
        );

        var arrData = [[]];
        var arrMatches = null;

        while (arrMatches = objPattern.exec(strData)) {
            var strMatchedDelimiter = arrMatches[1];
            if (
                strMatchedDelimiter.length &&
                strMatchedDelimiter !== strDelimiter
            ) {
                arrData.push([]);
            }

            var strMatchedValue;
            if (arrMatches[2]) {
                strMatchedValue = arrMatches[2].replace(
                    new RegExp("\"\"", "g"),
                    "\""
                );

            } else {
                strMatchedValue = arrMatches[3];

            }
            arrData[arrData.length - 1].push(strMatchedValue);
        }
        return (arrData);
    }

    alert(title_: string, body_: string, type_: ("normal" | "error" | "success") = "normal", continueWith: () => void = () => { }): void {
        if (document.getElementsByClassName("gm-alert-container").length === 0) {
            gm.newItem("div", "gm-alert-background", document.body);
            let a = gm.newItem("div", "gm-alert", gm.newItem("div", "gm-alert-container", document.body)) as HTMLDivElement;
            gm.newItem("div", "gm-alert-title", a);
            gm.newItem("div", "gm-alert-body", a);
            gm.newItem("button", { className: "gm-alert-button", innerText: "Ok" }, a);
        }
        if (document.body.className.indexOf("gm-alert-visible") === -1) {

        }
        let al = document.getElementsByClassName("gm-alert")[0] as HTMLDivElement;
    }
}();

var profileDropDown = null;
window.addEventListener("load", function () { profileDropDown = document.getElementById("nav-profile-dropdown"); })
function openProfileDropdown(clicked, event) {
    if (profileDropDown.classList.contains("open")) { return; }
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


    const hand = function (e) {
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