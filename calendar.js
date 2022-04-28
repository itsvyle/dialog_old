;
;
var CalendarColumnTimeWidth = 45; //Width 45px
var CalendarMinColumnWidth = 90;
var CalendarDaysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
var Calendar = /** @class */ (function () {
    function Calendar(opts) {
        this.viewMode = "columns";
        this.dayColumns = [];
        this.dateHeaders = [];
        this.itemHeightCompensation = 0;
        this.timeItemHeight = 0;
        this.events = [];
        this.forceSingleColumn = false;
        this.viewMode = opts.viewMode || "columns";
        this.eventDataFetchFunction = opts.eventDataFetchFunction;
        this.container = opts.container;
        this.menu = opts.menu;
        this.menu.getElementsByClassName("cal-menu-option-close")[0].addEventListener("click", function (e) {
            //@ts-ignore
            e.target.parentElement.parentElement.classList.remove("cal-menu-open");
        });
        this.height = opts.height;
        this.width = this.container.getElementsByClassName("cal-content")[0].offsetWidth;
        this.forceSingleColumn = typeof opts.forceSingleColumn === "boolean" ? opts.forceSingleColumn : false;
        this.timeMin = opts.timeMin;
        this.timeMax = opts.timeMax;
        this.timeIntervalMinutes = opts.timeIntervalMinutes;
        this.duration = this.timeMax - this.timeMin;
        this.oneMinuteHeight = this.height / (this.duration / 60000);
        window.addEventListener("resize", function (event) {
            this.width = this.container.getElementsByClassName("cal-content")[0].offsetWidth;
            this.refreshWidth();
        }.bind(this));
        var arrows = this.container.getElementsByClassName("cal-navigation-arrow-container");
        arrows[0].addEventListener("click", function (e) {
            this.buttonChangeDate("backward");
        }.bind(this));
        arrows[1].addEventListener("click", function (e) {
            this.buttonChangeDate("forward");
        }.bind(this));
        var c = this.container.getElementsByClassName("cal-date-headers-container")[0];
        for (var i = 0; i < 5; i++) {
            this.dateHeaders.push(gm.newItem("div", { className: "cal-date-header" }, c));
            gm.newItem("p", {
                className: "cal-header-dow"
            }, this.dateHeaders[i]);
        }
        this.startOfWeekDate = moment().startOf('isoWeek').tz("America/New_York");
        this.startOfWeekTimestamp = this.startOfWeekDate.valueOf();
        this.minTimestamp = this.startOfWeekTimestamp + this.timeMin;
        this.maxTimestamp = this.startOfWeekTimestamp + (4 * 86400000) + this.timeMax;
        var da = moment().get("day");
        this.currentlyVisibleColumnIndex = (da === 0 || da === 6) ? 0 : da - 1;
        this.visibleColumnsCount = this.visibleColumnsWidth = -1;
        this.refreshWidth(false);
        //let prevMonday = new Date(utc.toUTCString());
        //console.log(prevMonday);
        //prevMonday.setDate(prevMonday.getDate() - (prevMonday.getDay() + 6) % 7);
        //this.currentTimestamp = prevMonday.getTime();
        this.generateColumns();
        this.redLine = gm.newItem("div", "cal-columns-redline", this.container.getElementsByClassName("cal-column-content")[0]);
        this.generateTimes();
        this.refreshDate();
        this.refreshView();
    }
    Calendar.prototype.refreshWidth = function (r) {
        if (r === void 0) { r = true; }
        if (((this.width - 45) < CalendarMinColumnWidth * 5) || this.forceSingleColumn) {
            this.visibleColumnsCount = 1;
        }
        else {
            this.visibleColumnsCount = 5;
        }
        this.visibleColumnsWidth = (this.width - CalendarColumnTimeWidth) / this.visibleColumnsCount;
        this.menu.classList.remove("cal-menu-open");
        if (this.viewMode == "columns" && r) {
            this.generateColumns();
            this.refreshRedLine();
        }
    };
    Calendar.prototype.switchViewMode = function (newMode_) {
        if (newMode_ === void 0) { newMode_ = "invert"; }
        if (newMode_ == "invert") {
            newMode_ = (this.viewMode == "list") ? "columns" : "list";
        }
        if (newMode_ == "columns") {
            this.generateColumns();
        }
    };
    Calendar.prototype.addEvent = function (e) {
        this.events.push(e);
        return this;
    };
    Calendar.prototype.getEventById = function (id) {
        var m = this.events.length;
        for (var i = 0; i < m; i++) {
            if (this.events[i].id === id) {
                return this.events[i];
            }
        }
        return null;
    };
    Calendar.prototype.generateTimes = function () {
        this.container.classList.add("cal-mode-columns");
        var container = this.container.getElementsByClassName("cal-column-times")[0];
        var content = this.container.getElementsByClassName("cal-column-content")[0];
        var laps = Math.floor(this.duration / (this.timeIntervalMinutes * 60000)) + 1;
        var minute = this.timeMin / 60000;
        for (var i = 0; i < laps; i++) {
            var hour = Math.floor(minute / 60);
            var minu = Math.abs(minute - hour * 60);
            var top_1 = void 0;
            if (!this.itemHeightCompensation) {
                var p = gm.newItem("p", {
                    className: "cal-time",
                    innerText: moment.timeString(hour, minu)
                }, container);
                this.timeItemHeight = p.offsetHeight;
                this.itemHeightCompensation = this.timeItemHeight / laps;
                top_1 = (i * this.timeIntervalMinutes * this.oneMinuteHeight) - i * this.itemHeightCompensation;
                p.setAttribute("style", "top: ".concat(top_1, "px;"));
            }
            else {
                top_1 = (i * this.timeIntervalMinutes * this.oneMinuteHeight) - i * this.itemHeightCompensation;
                gm.newItem("p", {
                    className: "cal-time",
                    innerText: moment.timeString(hour, minu),
                    style: "top: ".concat(top_1, "px;")
                }, container);
            }
            gm.newItem("div", {
                className: "cal-time-hr",
                style: "top: " + String(top_1 + (this.timeItemHeight / 2)) + "px;"
            }, content);
            minute += this.timeIntervalMinutes;
        }
        if (this.viewMode == "list") {
            this.container.classList.remove("cal-mode-columns");
        }
    };
    Calendar.prototype.generateColumns = function () {
        if (this.dayColumns.length < 5) {
            var c = this.container.getElementsByClassName("cal-column-content")[0];
            for (var i = 0; i < 5; i++) {
                this.dayColumns.push(gm.newItem("div", "cal-column-day-events-container", gm.newItem("div", "cal-column-day", c)));
            }
        }
        (this.visibleColumnsCount === 1) ? this.container.classList.add("cal-one-column") : this.container.classList.remove("cal-one-column");
        var max = this.dayColumns.length;
        var headers_container = this.container.getElementsByClassName("cal-date-header");
        var dn = moment();
        var s = this.startOfWeekDate.clone();
        for (var i = 0; i < max; i++) {
            var d = this.dayColumns[i].parentElement;
            if (this.visibleColumnsCount === 1 && i !== this.currentlyVisibleColumnIndex) {
                d.style.display = "none";
                headers_container[i].style.display = "none";
            }
            else {
                //@ts-ignore
                d.style.display = null;
                //@ts-ignore
                headers_container[i].style.display = null;
                if (s.isSame(dn, "date")) {
                    d.classList.add("cal-column-day-current");
                }
                else {
                    d.classList.remove("cal-column-day-current");
                }
            }
            s.add(1, "day");
            // d.style.left = ((this.visibleColumnsCount === 1 && i === this.currentlyVisibleColumnIndex) ? 0 : String(i * this.visibleColumnsWidth)) + "px";
        }
    };
    Calendar.prototype.refreshDate = function () {
        var i, p = this.container.getElementsByClassName("cal-navigation-datenow")[0];
        p.innerText = this.startOfWeekDate.format("MMM Do") + " - " + this.startOfWeekDate.clone().add(4, "days").format("MMM Do");
        var d = this.startOfWeekDate.clone().add(-1, "days");
        var dn = moment();
        for (i = 0; i < 5; i++) {
            var pp = this.dateHeaders[i].firstElementChild;
            pp.innerText = d.add(1, "days").format("ddd MMM Do");
            if (d.isSame(dn, "date")) {
                pp.style.fontWeight = "700";
            }
            else {
                //@ts-ignore
                pp.style.fontWeight = null;
            }
        }
    };
    Calendar.prototype.buttonChangeDate = function (ty) {
        if (this.visibleColumnsCount === 1 && ((ty == "forward" && this.currentlyVisibleColumnIndex < 4) || (ty == "backward" && this.currentlyVisibleColumnIndex > 0))) {
            if (ty == "forward") {
                this.currentlyVisibleColumnIndex += 1;
            }
            else {
                this.currentlyVisibleColumnIndex -= 1;
            }
        }
        else {
            this.startOfWeekDate.add((ty == "forward" ? 1 : -1), "week");
            this.startOfWeekTimestamp = this.startOfWeekDate.valueOf();
            this.minTimestamp = this.startOfWeekTimestamp + this.timeMin;
            this.maxTimestamp = this.startOfWeekTimestamp + (4 * 86400000) + this.timeMax;
            this.currentlyVisibleColumnIndex = (ty == "forward" ? 0 : 4);
        }
        this.menu.classList.remove("cal-menu-open");
        this.refreshAll();
    };
    Calendar.prototype.refreshRedLine = function () {
        this.redLine.style.display = "none";
        var dn = moment().set("hours", 15).set("minutes", 25);
        var dTimestamp = ((dn.get("hours") * 3600000) + (dn.get("minutes") * 60000));
        if (this.timeMax > dTimestamp && this.timeMin < dTimestamp) {
            var dt = void 0;
            dt = dn.valueOf();
            if (dt > this.minTimestamp && dt < this.maxTimestamp) {
                if (this.visibleColumnsCount === 1 && this.currentlyVisibleColumnIndex == (dn.get("day") - 1)) {
                    //@ts-ignore
                    this.redLine.style.left = null;
                    this.redLine.style.display = "block";
                }
                else if (this.visibleColumnsCount > 1) {
                    this.redLine.style.left = String((dn.get("day") - 1) * 20) + "%";
                    this.redLine.style.display = "block";
                }
                if (this.redLine.style.display === "block") {
                    this.redLine.style.top = String((((dTimestamp - this.timeMin) / 60000) * this.oneMinuteHeight) + this.timeItemHeight / 2) + "px";
                }
            }
        }
    };
    Calendar.prototype.refreshView = function () {
        var _this = this;
        if (this.viewMode == "list") {
            this.container.classList.remove("cal-mode-columns");
            this.redLine.style.display = "none";
        }
        else if (this.viewMode == "columns") {
            this.container.classList.add("cal-mode-columns");
            this.refreshRedLine();
        }
        this.events.forEach(function (e) { return e.refreshView(_this); });
    };
    Calendar.prototype.refreshAll = function () {
        this.generateColumns();
        this.refreshDate();
        this.refreshView();
        this.refreshRedLine();
    };
    Calendar.prototype.setMenuData = function (_a) {
        var id = _a.id, title = _a.title, color = _a.color, host = _a.host, dt = _a.dt, classType = _a.classType, location = _a.location, eventType = _a.eventType, notes = _a.notes;
        var m = this.menu;
        m.getElementsByClassName("cal-menu-row-icon-color")[0].style.color = color;
        m.getElementsByClassName("cal-menu-event-title")[0].innerText = title;
        m.getElementsByClassName("cal-menu-event-date")[0].innerText = dt || "...";
        m.getElementsByClassName("cal-menu-event-host")[0].innerText = host || "...";
        m.getElementsByClassName("cal-menu-event-class")[0].innerText = classType || "...";
        var p = m.getElementsByClassName("cal-menu-event-type")[0];
        p.innerText = eventType || "...";
        p.className = "cal-menu-event-type cal-menu-event-type-" + (eventType ? eventType.toLowerCase() : "loading");
        p = m.getElementsByClassName("cal-menu-event-notes")[0];
        if (typeof notes === "undefined") {
            p.innerText = "...";
            p.classList.add("cal-menu-notes-empty");
        }
        else if (!notes) {
            p.innerText = "No meeting notes";
            p.classList.add("cal-menu-notes-empty");
        }
        else {
            p.innerText = notes;
            p.classList.remove("cal-menu-notes-empty");
        }
        m.getElementsByClassName("cal-menu-option-edit")[0].onclick = function (eventId, mouseEvent) {
            var e = this.getEventById(eventId);
            if (!e) {
                return alert("No event for id found");
            }
            alert("Do event edit for id:" + eventId + ", name=" + e.name);
        }.bind(this, id);
    };
    Calendar.prototype.openMenu = function (opts) {
        this.setMenuData(opts);
        var m = this.menu;
        var pageX = opts.pageX, pageY = opts.pageY, nextToItem = opts.nextToItem;
        if (typeof pageX !== "undefined" && typeof pageY !== "undefined") {
            m.style.left = String(pageX) + "px";
            m.style.top = String(pageY) + "px";
            m.setAttribute("data-from", "left");
        }
        else if (typeof nextToItem !== "undefined") {
            m.style.left = m.style.top = "0px";
            m.classList.add("cal-menu-open");
            var mw = m.clientWidth, mh = m.clientHeight, ww = document.body.clientWidth, wh = window.outerHeight;
            m.classList.remove("cal-menu-open");
            var nbox = nextToItem.getBoundingClientRect();
            var bbox = document.body.getBoundingClientRect();
            var nx = nbox.left - bbox.left, ny = nbox.top - bbox.top;
            var fixedTop = false;
            if (nx - mw - 7 > 0) {
                m.style.left = String(nx - mw - 7) + "px";
                m.setAttribute("data-from", "left");
            }
            else if (nx + nextToItem.clientWidth + mw + 7 < ww) {
                m.style.left = String(nx + nextToItem.clientWidth + 7) + "px";
                m.setAttribute("data-from", "right");
            }
            else {
                m.style.left = String(nx + nextToItem.clientWidth / 2 - (mw + 20) / 2) + "px";
                if (ny - mh - 7 < 0) {
                    m.style.top = String(ny + nextToItem.clientHeight + 7) + "px";
                    m.setAttribute("data-from", "bottom");
                }
                else {
                    m.style.top = String(ny - mh - 7) + "px";
                    m.setAttribute("data-from", "top");
                }
                fixedTop = true;
            }
            /*
            if (nx + nextToItem.clientWidth + mw + 7 > ww) {
                m.style.left = String(nx - mw - 7) + "px";
            } else {
                m.style.left = String(nx + nextToItem.clientWidth + 7) + "px";
            }/* else {
                alert("T");
            }*/
            if (!fixedTop) {
                if (ny + mh + 7 < wh) {
                    m.style.top = String(ny) + "px";
                }
                else {
                    m.style.top = String(ny - (mh - nextToItem.clientHeight)) + "px";
                }
            }
        }
        m.classList.add("cal-menu-open");
    };
    return Calendar;
}());
var CCalEvent = /** @class */ (function () {
    function CCalEvent(options) {
        this.textColor = "inherit";
        this.specialClass = "none";
        this.id = options.id;
        this.startDateString = options.startDateString;
        this.endDateString = options.endDateString;
        this.startDate = moment(this.startDateString).tz("America/New_York");
        this.endDate = moment(this.endDateString).tz("America/New_York");
        this.startTimestamp = this.startDate.valueOf();
        this.endTimestamp = this.endDate.valueOf();
        this.inDayStartTime = ((this.startTimestamp % 86400000) + moment.TzUtcOffset);
        this.inDayEndTime = ((this.endTimestamp % 86400000) + moment.TzUtcOffset); // these where UTC timestamps, and are now timestamps in the correct tz
        this.columnIndex = this.startDate.get("day") - 1;
        if (this.columnIndex > 4)
            this.columnIndex = -1;
        this.name = options.name;
        this.backgroundColor = options.backgroundColor;
        this.textColor = options.textColor || "inherit";
        this.durationSeconds = (this.endTimestamp - this.startTimestamp) / 1000;
    }
    CCalEvent.prototype.buildTimeString = function (cal) {
        this.timeString = moment.timeString(Math.floor((this.inDayStartTime / 1000 / 60) / 60), (this.inDayStartTime / 1000 / 60) % 60) + " - " + moment.timeString(Math.floor((this.inDayEndTime / 1000 / 60) / 60), (this.inDayEndTime / 1000 / 60) % 60);
    };
    CCalEvent.prototype.isVisible = function (cal) {
        if (this.columnIndex === -1 ||
            (this.startTimestamp < cal.minTimestamp && this.endTimestamp < cal.minTimestamp) ||
            (this.startTimestamp > cal.maxTimestamp) || this.endTimestamp < cal.minTimestamp ||
            this.inDayStartTime > cal.timeMax ||
            this.inDayEndTime < cal.timeMin) {
            return false;
        }
        return true;
    };
    CCalEvent.prototype.calculatePosition = function (cal) {
        // We should have: this.displayTop + (this.durationSeconds*cal.timeIntervalMinutes) + this.displayBottom == cal.height;
        this.specialClass = "none";
        this.displayTop = Math.max(((this.inDayStartTime - cal.timeMin) / 1000 / 60) * cal.oneMinuteHeight, 0) + (cal.timeItemHeight / 2);
        this.displayHeight = (this.durationSeconds / 60) * cal.oneMinuteHeight;
        if (this.inDayStartTime <= cal.timeMin) {
            this.displayHeight -= ((cal.timeMin - this.inDayStartTime) / 1000 / 60) * cal.oneMinuteHeight;
            this.specialClass = "cut-top";
        }
        if (this.inDayEndTime >= cal.timeMax) {
            this.displayHeight -= ((this.inDayEndTime - cal.timeMax) / 1000 / 60) * cal.oneMinuteHeight;
            this.specialClass = "cut-bottom";
        }
        if (this.inDayEndTime >= cal.timeMax && this.inDayStartTime <= cal.timeMin) {
            this.specialClass = "cut-both";
        }
        //this.displayBottom = cal.height - (this.displayTop + (this.durationSeconds/60 * cal.oneMinuteHeight));
    };
    CCalEvent.prototype.refreshView = function (cal, recalcuatePosition) {
        if (recalcuatePosition === void 0) { recalcuatePosition = false; }
        if (!this.clickEventHandler)
            this.clickEventHandler = this.openMenu.bind(this, cal);
        this.buildTimeString(cal);
        if (!this.isVisible(cal)) {
            if (this.domItem) {
                this.domItem.removeEventListener("click", this.clickEventHandler);
                this.clickEventHandler = undefined;
                this.domItem.remove();
            }
            this.domItem = undefined;
            return;
        }
        if (typeof (this.displayTop) == "undefined" || recalcuatePosition === true) {
            this.calculatePosition(cal);
        }
        if (typeof this.domItem == "undefined") {
            this.domItem = (this.columnIndex === -1) ? null : gm.newItem("div", "cal-columns-event", cal.dayColumns[this.columnIndex]);
            gm.newItem("p", "cal-column-event-name", this.domItem);
            gm.newItem("p", "cal-column-event-time", this.domItem);
            this.domItem.addEventListener("click", this.clickEventHandler);
        }
        if (this.domItem !== null) {
            //let p: HTMLParagraphElement;
            this.domItem.setAttribute("data-id", String(this.id));
            this.domItem.setAttribute("style", "top: ".concat(this.displayTop, "px;height: ").concat(this.displayHeight, "px;color: ").concat(this.textColor, ";background-color: ").concat(this.backgroundColor, ";"));
            (this.specialClass === "none") ? this.domItem.className = "cal-columns-event" : this.domItem.className = "cal-columns-event " + this.specialClass;
            this.domItem.getElementsByClassName("cal-column-event-name")[0].innerText = String(this.name);
            this.domItem.getElementsByClassName("cal-column-event-time")[0].innerText = String(this.timeString);
        }
    };
    CCalEvent.prototype.delete = function () {
        //@ts-ignore
        this.domItem.remove();
        this.domItem = null;
        return;
    };
    CCalEvent.prototype.openMenu = function (cal, event) {
        //console.log("Clicked", this, cal, event);
        cal.openMenu({
            id: this.id,
            title: this.name,
            dt: this.startDate.format("dddd, MMMM D") + " • " + moment.timeString(this.startDate.get("hours"), this.startDate.get("minutes")) + "-" + moment.timeString(this.endDate.get("hours"), this.endDate.get("minutes")),
            classType: "NULL",
            color: this.backgroundColor,
            host: "NULL",
            eventType: "NULL",
            location: "NULL",
            notes: null,
            nextToItem: this.domItem
        });
    };
    return CCalEvent;
}());
var cal;
function fetData(clb) {
}
window.addEventListener("load", function (event) {
    cal = new Calendar({
        container: document.getElementById("main-calendar"),
        menu: document.getElementById("main-calendar-menu"),
        height: 400,
        timeMin: (15 * 3600 * 1000) + (15 * 60 * 1000),
        timeMax: (16 * 3600 * 1000) + (5 * 60 * 1000),
        timeIntervalMinutes: 5,
        forceSingleColumn: false,
        eventDataFetchFunction: fetData
    });
    cal.addEvent(testEvent);
    cal.addEvent(new CCalEvent({
        id: "test2",
        startDateString: moment("2022-04-26 15:20:00").toISOString(),
        endDateString: moment("2022-04-26 15:40:00").toISOString(),
        name: "Tuesday !",
        backgroundColor: "green"
    }));
    cal.addEvent(new CCalEvent({
        id: "test3",
        startDateString: moment("2022-04-27 15:40:00").toISOString(),
        endDateString: moment("2022-04-27 15:55:00").toISOString(),
        name: "Wednesday !",
        backgroundColor: "blue"
    }));
    cal.addEvent(new CCalEvent({
        id: "test4",
        startDateString: moment("2022-04-28 15:55:00").toISOString(),
        endDateString: moment("2022-04-28 16:05:00").toISOString(),
        name: "Thursday",
        backgroundColor: "red"
    }));
    cal.addEvent(new CCalEvent({
        id: "test5",
        startDateString: moment("2022-04-29 16:00:00").toISOString(),
        endDateString: moment("2022-04-29 16:20:00").toISOString(),
        name: "Friday !",
        backgroundColor: "purple"
    }));
    cal.refreshView();
});
var testEvent = new CCalEvent({
    id: "test1",
    startDateString: moment("2022-04-25 15:05:00").toISOString(),
    endDateString: moment("2022-04-25 15:25:00").toISOString(),
    name: "Monday !",
    backgroundColor: "orange"
});
//# sourceMappingURL=calendar.js.map