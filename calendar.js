var Calendar = /** @class */ (function () {
    function Calendar(opts) {
        this.viewMode = "columns";
        this.container = opts.container;
        this.height = opts.height;
        this.width = this.container.offsetWidth;
        this.timeMin = opts.timeMin;
        this.timeMax = opts.timeMax;
        this.timeIntervalMinutes = opts.timeIntervalMinutes;
        this.duration = this.timeMax - this.timeMin;
        this.oneMinute = this.height / (this.duration / 60000);
        var par = this;
        window.addEventListener("resize", function (event) { par.width = par.container.offsetWidth; });
        this.generateTimes();
        this.refreshView();
    }
    Calendar.prototype.generateTimes = function () {
        this.container.classList.add("cal-mode-columns");
        var container = this.container.getElementsByClassName("cal-column-times")[0];
        var content = this.container.getElementsByClassName("cal-column-content")[0];
        var laps = Math.floor(this.duration / (this.timeIntervalMinutes * 60000)) + 1;
        var minute = this.timeMin / 60000;
        var itemHeightCompensation, itemHeight;
        for (var i = 0; i < laps; i++) {
            var hour = Math.floor(minute / 60);
            var minu = Math.abs(minute - hour * 60);
            var top_1 = void 0;
            if (!itemHeightCompensation) {
                var p = gm.newItem("p", {
                    className: "cal-time",
                    innerText: "".concat((hour < 10) ? ("0" + String(hour)) : hour, ":").concat((minu < 10) ? ("0" + String(minu)) : minu)
                }, container);
                itemHeight = p.offsetHeight;
                itemHeightCompensation = itemHeight / laps;
                top_1 = (i * this.timeIntervalMinutes * this.oneMinute) - i * itemHeightCompensation;
                p.setAttribute("style", "top: ".concat(top_1, "px;"));
            }
            else {
                top_1 = (i * this.timeIntervalMinutes * this.oneMinute) - i * itemHeightCompensation;
                gm.newItem("p", {
                    className: "cal-time",
                    innerText: "".concat((hour < 10) ? ("0" + String(hour)) : hour, ":").concat((minu < 10) ? ("0" + String(minu)) : minu),
                    style: "top: ".concat(top_1, "px;")
                }, container);
            }
            gm.newItem("hr", {
                className: "cal-time-hr",
                style: "top: " + String(top_1 + (itemHeight / 2)) + "px;"
            }, content);
            minute += this.timeIntervalMinutes;
        }
        if (this.viewMode == "list") {
            this.container.classList.remove("cal-mode-columns");
        }
    };
    Calendar.prototype.refreshView = function () {
        if (this.viewMode == "list") {
            this.container.classList.remove("cal-mode-columns");
        }
        else {
            this.container.classList.add("cal-mode-columns");
        }
    };
    return Calendar;
}());
var cal;
window.addEventListener("load", function (event) {
    cal = new Calendar({
        container: document.getElementById("main-calendar"),
        height: 400,
        timeMin: (15 * 3600 * 1000) + (15 * 60 * 1000),
        timeMax: (16 * 3600 * 1000) + (5 * 60 * 1000),
        timeIntervalMinutes: 5
    });
});
//# sourceMappingURL=calendar.js.map