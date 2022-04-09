var CalendarColumnTimeWidth = 45; //Width 45px
var Calendar = /** @class */ (function () {
    function Calendar(opts) {
        this.viewMode = "columns";
        this.events = [];
        this.timeFormat = opts.timeFormat || "24h";
        this.viewMode = opts.viewMode || "columns";
        this.container = opts.container;
        this.height = opts.height;
        this.width = this.container.getElementsByClassName("cal-content")[0].offsetWidth;
        this.timeMin = opts.timeMin;
        this.timeMax = opts.timeMax;
        this.timeIntervalMinutes = opts.timeIntervalMinutes;
        this.duration = this.timeMax - this.timeMin;
        this.oneMinuteHeight = this.height / (this.duration / 60000);
        var par = this;
        window.addEventListener("resize", function (event) { par.width = par.container.getElementsByClassName("cal-content")[0].offsetWidth; });
        this.startOfWeekTimestamp = moment().startOf('isoWeek').tz("America/New_York").valueOf();
        if (this.viewMode == "columns") {
            this.minTimestamp = this.startOfWeekTimestamp + this.timeMin;
            this.maxTimestamp = this.startOfWeekTimestamp + (4 * 86400000) + this.timeMax;
        }
        //let prevMonday = new Date(utc.toUTCString());
        //console.log(prevMonday);
        //prevMonday.setDate(prevMonday.getDate() - (prevMonday.getDay() + 6) % 7);
        //this.currentTimestamp = prevMonday.getTime();
        this.generateTimes();
        this.refreshView();
    }
    Calendar.prototype.addEvent = function (e) {
        this.events.push(e);
        return false;
    };
    Calendar.prototype.timeString = function (hours, minutes) {
        return (this.timeFormat == "24h")
            ? "".concat((hours < 10) ? ("0" + String(hours)) : hours, ":").concat((minutes < 10) ? ("0" + String(minutes)) : minutes)
            : "".concat(hours % 12, ":").concat((minutes < 10) ? ("0" + String(minutes)) : minutes, " ").concat((hours < 12) ? "AM" : "PM");
    };
    Calendar.prototype.generateTimes = function () {
        this.container.classList.add("cal-mode-columns");
        var container = this.container.getElementsByClassName("cal-column-times")[0];
        var content = this.container.getElementsByClassName("cal-column-content")[0];
        var laps = Math.floor(this.duration / (this.timeIntervalMinutes * 60000)) + 1;
        var minute = this.timeMin / 60000;
        var itemHeightCompensation = 0, itemHeight = -1;
        for (var i = 0; i < laps; i++) {
            var hour = Math.floor(minute / 60);
            var minu = Math.abs(minute - hour * 60);
            var top_1 = void 0;
            if (!itemHeightCompensation) {
                var p = gm.newItem("p", {
                    className: "cal-time",
                    innerText: this.timeString(hour, minu)
                }, container);
                itemHeight = p.offsetHeight;
                itemHeightCompensation = itemHeight / laps;
                top_1 = (i * this.timeIntervalMinutes * this.oneMinuteHeight) - i * itemHeightCompensation;
                p.setAttribute("style", "top: ".concat(top_1, "px;"));
            }
            else {
                top_1 = (i * this.timeIntervalMinutes * this.oneMinuteHeight) - i * itemHeightCompensation;
                gm.newItem("p", {
                    className: "cal-time",
                    innerText: this.timeString(hour, minu),
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
        else if (this.viewMode == "columns") {
            this.container.classList.add("cal-mode-columns");
        }
    };
    return Calendar;
}());
var CCalEvent = /** @class */ (function () {
    function CCalEvent(options) {
        this.specialClass = "none";
        this.id = options.id;
        this.startDateString = options.startDateString;
        this.endDateString = options.endDateString;
        this.startDate = moment(this.startDateString).tz("America/New_York");
        this.endDate = moment(this.endDateString).tz("America/New_York");
        this.startTimestamp = this.startDate.valueOf();
        this.endTimestamp = this.endDate.valueOf();
        this.inDayStartTime = ((this.startTimestamp % 86400000) + moment.TzUtcOffset);
        this.inDayEndTime = ((this.endTimestamp % 86400000) + moment.TzUtcOffset);
        this.name = options.name;
        this.backgroundColor = options.backgroundColor;
        this.textColor = options.textColor || "inherit";
        this.durationSeconds = (this.endTimestamp - this.startTimestamp) / 1000;
    }
    CCalEvent.prototype.isVisible = function (cal) {
        if ((this.startTimestamp < cal.minTimestamp && this.endTimestamp < cal.minTimestamp) ||
            (this.startTimestamp > cal.maxTimestamp) || this.endTimestamp < cal.minTimestamp ||
            this.inDayStartTime > cal.timeMax ||
            this.inDayEndTime < cal.timeMin) {
            return false;
        }
        return true;
    };
    CCalEvent.prototype.calculatePosition = function (cal) {
        // We should have: this.displayTop + (this.durationSeconds*cal.timeIntervalMinutes) + this.displayBottom == cal.height;
        if (this.inDayStartTime <= cal.timeMin) { // the event starts before the minTime
            this.specialClass = "cut-top";
            this.displayTop = 0; // this.height = (this.inDayEndTime - cal.timeMin)
            this.displayBottom = cal.height - (this.durationSeconds * cal.oneMinuteHeight);
        }
    };
    CCalEvent.prototype.refreshView = function (cal, recalcuatePosition) {
        if (recalcuatePosition === void 0) { recalcuatePosition = false; }
        if (typeof this.displayTop == "undefined" || recalcuatePosition === true) {
            this.calculatePosition(cal);
        }
        if (typeof this.domItem == "undefined") {
            this.domItem = gm.newItem("div", null, cal.container.getElementsByClassName("cal-content")[0]);
        }
    };
    return CCalEvent;
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
    cal.addEvent(testEvent);
});
var testEvent_ = {
    id: "test",
    startDateString: moment("2022-04-07 15:00:00").toISOString(),
    endDateString: moment("2022-04-07 15:45:00").toISOString(),
    name: "Test Event !",
    backgroundColor: "orange"
};
var testEvent = new CCalEvent(testEvent_);
//# sourceMappingURL=calendar.js.map