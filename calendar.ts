type CalendarEventDataFetchFunc = (eventId: string, clb: (success: boolean, event?: CalEvent) => void) => void;
type CalendarWeekDataFetchFunc = (weekStart: moment.Moment,clb: (success: boolean, events?: CalEvent[]) => void) => void;
type CalendarCreationOptions = {
    container: HTMLDivElement;
    menu: HTMLDivElement;
    height: number;
    timeMin: number;
    timeMax: number;
    timeIntervalMinutes: number;
    timesFontSize?: number;
    viewMode?: "list" | "columns";
    forceSingleColumn?: boolean;
    eventDataFetchFunction: CalendarEventDataFetchFunc;
    skipWeekDays?: number[]
};
interface CalendarMenuDataOptions {
    id: string;
    title: string;
    color: string;
    dt: string;
    host?: string;
    classType?: string;
    location?: string;
    eventType?: string;
    notes?: string | null | undefined;
};
interface CalendarMenuOpenOptions extends CalendarMenuDataOptions {
    pageX?: number;
    pageY?: number;
    nextToItem?: HTMLElement;
};


const CalendarColumnTimeWidth = 45; //Width 45px
const CalendarMinColumnWidth = 90;
const CalendarDaysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
class Calendar {
    container: HTMLDivElement;
    menu: HTMLDivElement;
    redLine: HTMLDivElement;
    height: number;
    width: number;
    timeMin: number;
    timeMax: number;
    oneMinuteHeight: number;
    duration: number;
    timeIntervalMinutes: number;
    viewMode: "list" | "columns" = "columns";

    startOfWeekTimestamp: number;
    startOfWeekDate: moment.Moment;
    minTimestamp?: number;
    maxTimestamp?: number; 
    visibleColumnsCount: number;
    visibleColumnsWidth: number;
    currentlyVisibleColumnIndex: number;
    dayColumns: HTMLDivElement[] = [];
    dateHeaders: HTMLDivElement[] = [];
    private itemHeightCompensation: number = 0;
    timeItemHeight: number = 0;

    events: CCalEvent[] = [];

    forceSingleColumn: boolean = false;

    eventDataFetchFunction: CalendarEventDataFetchFunc;
    skipWeekdays: number[];
    maxColumnsCount: number;


    constructor(opts: CalendarCreationOptions) {
        this.viewMode = opts.viewMode || "columns";
        this.eventDataFetchFunction = opts.eventDataFetchFunction;
        this.container = opts.container;
        this.height = opts.height;
        (this.container.getElementsByClassName("cal-content")[0] as HTMLDivElement).style.height = String(this.height) + "px";
        this.menu = opts.menu;
        this.menu.getElementsByClassName("cal-menu-option-close")[0].addEventListener("click", function (this: Calendar) {
            this.closeMenu();
        }.bind(this));
        this.skipWeekdays = opts.skipWeekDays || [];
        this.maxColumnsCount = 5 - this.skipWeekdays.length;
        this.width = (<HTMLDivElement>this.container.getElementsByClassName("cal-content")[0]).offsetWidth;
        this.forceSingleColumn = typeof opts.forceSingleColumn === "boolean" ? opts.forceSingleColumn : false;
        this.timeMin = opts.timeMin;
        this.timeMax = opts.timeMax;
        this.timeIntervalMinutes = opts.timeIntervalMinutes;
        this.duration = this.timeMax - this.timeMin;
        this.oneMinuteHeight = this.height / (this.duration / 60000);
        window.addEventListener("resize", function (this: Calendar,event: UIEvent) {
            this.width = (<HTMLDivElement>this.container.getElementsByClassName("cal-content")[0]).offsetWidth;
            this.refreshWidth();
        }.bind(this));

        let arrows = this.container.getElementsByClassName("cal-navigation-arrow-container") as HTMLCollectionOf<HTMLDivElement>;
        arrows[0].addEventListener("click", function (this: Calendar,e: MouseEvent) {
            this.buttonChangeDate("backward");
        }.bind(this));
        arrows[1].addEventListener("click", function (this: Calendar, e: MouseEvent) {
            this.buttonChangeDate("forward");
        }.bind(this));

        let c = this.container.getElementsByClassName("cal-date-headers-container")[0] as HTMLDivElement;
        
        for (let i = 0; i < 5; i++) {
            this.dateHeaders.push(gm.newItem("div", {className: "cal-date-header"}, c));
            gm.newItem("p", {
                className: "cal-header-dow"
            }, this.dateHeaders[i]);
        }
        this.startOfWeekDate = moment().startOf('isoWeek').tz("America/New_York");
        
        let da = moment().get("day");
        this.currentlyVisibleColumnIndex = (da === 0 || da === 6) ? 0 : da - 1;
        this.visibleColumnsCount = this.visibleColumnsWidth = -1;
        this.refreshWidth(false);
        while (this.skipWeekdays.indexOf(this.currentlyVisibleColumnIndex) !== -1) {
            if (this.currentlyVisibleColumnIndex < 4) {
                this.currentlyVisibleColumnIndex += 1;
            } else {
                this.startOfWeekDate.add(7, "days");
                this.currentlyVisibleColumnIndex = 0;
            }
        }

        this.startOfWeekTimestamp = this.startOfWeekDate.valueOf();
        this.minTimestamp = this.startOfWeekTimestamp + this.timeMin;
        this.maxTimestamp = this.startOfWeekTimestamp + (4 * 86400000) + this.timeMax;
        
        //let prevMonday = new Date(utc.toUTCString());
        //console.log(prevMonday);
        //prevMonday.setDate(prevMonday.getDate() - (prevMonday.getDay() + 6) % 7);
        //this.currentTimestamp = prevMonday.getTime();

        this.generateColumns();
        this.redLine = gm.newItem("div", "cal-columns-redline", this.container.getElementsByClassName("cal-column-content")[0]);
        this.redLine.style.width = String(100 / this.maxColumnsCount) + "%";

        this.generateTimes();
        this.refreshDate();
        this.refreshView();

    }

    refreshWidth(r: boolean = true) {
        if (((this.width - 45) < CalendarMinColumnWidth*5) || this.forceSingleColumn) {
            this.visibleColumnsCount = 1;
        } else {
            this.visibleColumnsCount = 5;
        }
        this.visibleColumnsWidth = (this.width - CalendarColumnTimeWidth) / this.visibleColumnsCount;
        if (this.menu.classList.contains("cal-menu-animating") === false) { this.closeMenu(); }
        if (this.viewMode == "columns" && r) {
            this.generateColumns();
            this.refreshRedLine();
        }
    }

    switchViewMode(newMode_: "list" | "columns" | "invert" = "invert") {
        if (newMode_ == "invert") {
            newMode_ = (this.viewMode == "list") ? "columns" : "list";
        }
        if (newMode_ == "columns") {
            this.generateColumns();
        }
    }

    addEvent(e: CCalEvent): Calendar {
        this.events.push(e);
        return this;
    }

    getEventById(id: string): CCalEvent | null {
        let m = this.events.length;
        for (let i = 0; i < m; i++) {
            if (this.events[i].id === id) { return this.events[i]; }
        }
        return null;
    }

    private generateTimes() {
        this.container.classList.add("cal-mode-columns");
        const container = this.container.getElementsByClassName("cal-column-times")[0] as HTMLDivElement;
        const content = this.container.getElementsByClassName("cal-column-content")[0] as HTMLDivElement;
        let laps = Math.floor(this.duration / (this.timeIntervalMinutes * 60000)) + 1;
        let minute = this.timeMin / 60000;
        for (let i = 0; i < laps; i++) {
            let hour = Math.floor(minute / 60);
            let minu = Math.abs(minute - hour * 60);
            let top: number;
            if (!this.itemHeightCompensation) {
                let p = gm.newItem("p", {
                    className: "cal-time",
                    innerText: moment.timeString(hour, minu)
                }, container) as HTMLParagraphElement;
                this.timeItemHeight = p.offsetHeight;
                this.itemHeightCompensation = this.timeItemHeight / laps;
                top = (i * this.timeIntervalMinutes * this.oneMinuteHeight) - i * this.itemHeightCompensation;
                p.setAttribute("style", `top: ${top}px;`);
            } else {
                top = (i * this.timeIntervalMinutes * this.oneMinuteHeight) - i * this.itemHeightCompensation;
                gm.newItem("p", {
                    className: "cal-time",
                    innerText: moment.timeString(hour, minu),
                    style: `top: ${top}px;`
                }, container);
            }

            gm.newItem("div", {
                className: "cal-time-hr",
                style: "top: " + String(top + (this.timeItemHeight /2)) + "px;"
            },content);

            minute += this.timeIntervalMinutes;
        }

        if (this.viewMode == "list") {this.container.classList.remove("cal-mode-columns");}
    }

    generateColumns() {
        if (this.dayColumns.length < 5) {
            const c = this.container.getElementsByClassName("cal-column-content")[0];
            for (let i = 0; i < 5; i++) {
                this.dayColumns.push(gm.newItem("div","cal-column-day-events-container",gm.newItem("div", "cal-column-day",c)));
            }
        }
        (this.visibleColumnsCount === 1) ? this.container.classList.add("cal-one-column") : this.container.classList.remove("cal-one-column");
        let max = this.dayColumns.length;
        const headers_container = this.container.getElementsByClassName("cal-date-header") as HTMLCollectionOf<HTMLDivElement>;
        let dn = moment();
        let s = this.startOfWeekDate.clone();
        for (let i = 0; i < max; i++) {
            let d = <HTMLElement>this.dayColumns[i].parentElement;
            if (this.visibleColumnsCount === 1 && i !== this.currentlyVisibleColumnIndex || this.skipWeekdays.indexOf(i) !== -1) {
                d.style.display = "none";
                headers_container[i].style.display = "none";
            } else {
                //@ts-ignore
                d.style.display = null;
                //@ts-ignore
                headers_container[i].style.display = null;
                if (s.isSame(dn, "date")) {
                    d.classList.add("cal-column-day-current");
                } else {
                    d.classList.remove("cal-column-day-current");
                }
            }
            s.add(1, "day");
            // d.style.left = ((this.visibleColumnsCount === 1 && i === this.currentlyVisibleColumnIndex) ? 0 : String(i * this.visibleColumnsWidth)) + "px";
        }
    }

    refreshDate() {
        let i: number, p = this.container.getElementsByClassName("cal-navigation-datenow")[0] as HTMLParagraphElement;
        p.innerText = this.startOfWeekDate.format("MMM Do") + " - " + this.startOfWeekDate.clone().add(4, "days").format("MMM Do");
        let d = this.startOfWeekDate.clone().add(-1, "days");
        let dn = moment();
        for (i = 0; i < 5; i++) {
            let pp = this.dateHeaders[i].firstElementChild as HTMLParagraphElement;
            pp.innerText = d.add(1, "days").format("ddd MMM Do");
            if (d.isSame(dn, "date")) {
                pp.style.fontWeight = "700";
            } else {
                //@ts-ignore
                pp.style.fontWeight = null;
            }
        }
    }

    buttonChangeDate(ty: "forward" | "backward") {
        let inc: number;
        if (this.visibleColumnsCount === 1 && ((ty == "forward" && this.currentlyVisibleColumnIndex < 4) || (ty == "backward" && this.currentlyVisibleColumnIndex > 0))) {
            inc = (ty === "forward") ? 1 : -1;
            this.currentlyVisibleColumnIndex += inc;
        } else {
            this.startOfWeekDate.add((ty == "forward" ? 1 : -1), "week");
            this.startOfWeekTimestamp = this.startOfWeekDate.valueOf();
            this.minTimestamp = this.startOfWeekTimestamp + this.timeMin;
            this.maxTimestamp = this.startOfWeekTimestamp + (4 * 86400000) + this.timeMax;

            this.currentlyVisibleColumnIndex = (ty == "forward" ? 0 : 4);
        }
        while (this.skipWeekdays.indexOf(this.currentlyVisibleColumnIndex) !== -1) {
            if (((ty == "forward" && this.currentlyVisibleColumnIndex < 4) || (ty == "backward" && this.currentlyVisibleColumnIndex > 0))) {
                this.currentlyVisibleColumnIndex += inc;
            } else {
                this.startOfWeekDate.add(ty === "forward" ? 7 : -7,"days");
                this.currentlyVisibleColumnIndex = (ty == "forward" ? 0 : 4);
            }
        }
        this.closeMenu();
        this.refreshAll();
    }

   

    refreshRedLine() {
        this.redLine.style.display = "none";
        let dn: moment.Moment = moment().set("hours", 15).set("minutes", 25).add(-1,"days");
        let dTimestamp = ((dn.get("hours") * 3600000) + (dn.get("minutes") * 60000));
        if (this.timeMax > dTimestamp && this.timeMin < dTimestamp) {
            let dt: number;
            dt = dn.valueOf();
            let da = (dn.get("day") - 1);
            if (this.skipWeekdays.indexOf(da) === -1) {
                if (dt > this.minTimestamp! && dt < this.maxTimestamp!) {
                    if (this.visibleColumnsCount === 1 && this.currentlyVisibleColumnIndex == da) {
                        //@ts-ignore
                        this.redLine.style.left = null;
                        this.redLine.style.width = "100%";
                        this.redLine.style.display = "block";
                    } else if (this.visibleColumnsCount > 1) {
                        for (let t = 0; t < this.skipWeekdays.length; t++) { if (this.skipWeekdays[t] <= da) { da -= 1; } }
                        this.redLine.style.left = String(da * (100 / this.maxColumnsCount)) + "%";
                        this.redLine.style.width = String(100 / this.maxColumnsCount) + "%";
                        this.redLine.style.display = "block";
                    }
                    if (this.redLine.style.display === "block") {
                        this.redLine.style.top = String((((dTimestamp - this.timeMin) / 60000) * this.oneMinuteHeight) + this.timeItemHeight / 2) + "px";
                    }
                }
            }
        }
    }

    refreshView() {
        if (this.viewMode == "list") {
            this.container.classList.remove("cal-mode-columns");
            this.redLine.style.display = "none";
        } else if (this.viewMode == "columns") {
            this.container.classList.add("cal-mode-columns");
            this.refreshRedLine();
        }
        this.events.forEach(e => e.refreshView(this));
    }

    refreshAll() {
        this.generateColumns();
        this.refreshDate();
        this.refreshView();
        this.refreshRedLine()
    }
    setMenuData({id,title, color, host, dt, classType, location, eventType, notes }: CalendarMenuDataOptions) {
        let m = this.menu;
        m.setAttribute("data-id", id);
        (m.getElementsByClassName("cal-menu-row-icon-color")[0] as HTMLDivElement).style.color = color;
        (m.getElementsByClassName("cal-menu-event-title")[0] as HTMLParagraphElement).innerText = title;
        (m.getElementsByClassName("cal-menu-event-date")[0] as HTMLParagraphElement).innerText = dt || "...";
        (m.getElementsByClassName("cal-menu-event-host")[0] as HTMLParagraphElement).innerText = host || "...";
        (m.getElementsByClassName("cal-menu-event-class")[0] as HTMLParagraphElement).innerText = classType || "...";
        (m.getElementsByClassName("cal-menu-event-location")[0] as HTMLParagraphElement).innerText = location || "...";
        let p = (m.getElementsByClassName("cal-menu-event-type")[0] as HTMLParagraphElement);
        p.innerText = eventType || "...";
        p.className = "cal-menu-event-type cal-menu-event-type-" + (eventType ? eventType.toLowerCase() : "loading");
        p = (m.getElementsByClassName("cal-menu-event-notes")[0] as HTMLParagraphElement);
        if (typeof notes === "undefined") {
            p.innerText = "...";
            p.classList.add("cal-menu-notes-empty");
        } else if (!notes) {
            p.innerText = "No meeting notes";
            p.classList.add("cal-menu-notes-empty");
        } else {
            p.innerText = notes;
            p.classList.remove("cal-menu-notes-empty");
        }

        if (host) {
            m.classList.remove("cal-menu-loading");
        } else {
            m.classList.add("cal-menu-loading");
        }

        (m.getElementsByClassName("cal-menu-option-edit")[0] as HTMLDivElement).onclick = function (this: Calendar, eventId: string, mouseEvent: MouseEvent) {
            let e = this.getEventById(eventId);
            if (!e) {
                return alert("No event for id found");
            }
            alert("Do event edit for id:" + eventId + ", name=" + e.name);
        }.bind(this, id);
    }
    openMenu(opts: CalendarMenuOpenOptions) {
        this.setMenuData(opts);
        let m = this.menu;
        m.classList.remove("cal-menu-closed");
        let { pageX, pageY, nextToItem } = opts;
        if (typeof pageX !== "undefined" && typeof pageY !== "undefined") {
            m.style.left = String(pageX) + "px";
            m.style.top = String(pageY) + "px";
            m.setAttribute("data-from", "left");
        } else if (typeof nextToItem !== "undefined") {
            m.style.left = m.style.top = "0px";
            m.classList.add("cal-menu-open");
            let mw = m.clientWidth, mh = m.clientHeight, ww = document.body.clientWidth, wh = window.outerHeight;
            m.classList.remove("cal-menu-open");
            let nbox = nextToItem.getBoundingClientRect();
            let bbox = document.body.getBoundingClientRect();
            let nx = nbox.left - bbox.left, ny = nbox.top - bbox.top;
            let fixedTop = false;
            if (nx - mw - 7 > 0) {
                m.style.left = String(nx - mw - 7) + "px";
                m.setAttribute("data-from", "left");
            } else if (nx + nextToItem.clientWidth + mw + 7 < ww) {
                m.style.left = String(nx + nextToItem.clientWidth + 7) + "px";
                m.setAttribute("data-from", "right");
            } else {
                m.style.left = String(nx + nextToItem.clientWidth / 2 - (mw + 20) / 2) + "px";
                if (ny - mh - 7 < 0) {
                    m.style.top = String(ny + nextToItem.clientHeight + 7) + "px";
                    m.setAttribute("data-from", "bottom");
                } else {
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
                } else {
                    m.style.top = String(ny - (mh - nextToItem.clientHeight)) + "px";
                }
            }
        }
        m.classList.add("cal-menu-open", "cal-menu-animating");
        setTimeout(() => m.classList.remove("cal-menu-animating"), 1200);
    }

    closeMenu() {
        let m = this.menu.classList;
        m.remove("cal-menu-open", "cal-menu-animating");
        //m.add("cal-menu-closed", "cal-menu-animating");
        //setTimeout(function () {
        //    m.remove("cal-menu-open", "cal-menu-animating");
        //}, 1200);
    }
}

interface CalEvent {
    id: string|null;
    name: string;
    startDateString: string;
    endDateString: string;
    backgroundColor: string | "auto";
    textColor?: string;
    host?: string;
    eventType?: string;
    classType?: string;
    location?: string;
    notes?: string;
}


class CCalEvent implements CalEvent {
    id: string | null;
    startTimestamp: number;
    endTimestamp: number;
    startDateString: string;
    endDateString: string;
    startDate: moment.Moment;
    endDate: moment.Moment;
    inDayStartTime: number;
    inDayEndTime: number;
    timeString?: string;
    name: string;
    backgroundColor: string | "auto";
    textColor: string | "inherit" = "inherit";

    durationSeconds: number;
    displayTop?: number;
    displayHeight?: number;
    columnIndex: number;
    private specialClass: "cut-bottom" | "cut-top" | "cut-both" | "none" = "none";
    private domItem?: HTMLDivElement | null;
    clickEventHandler?: any;

    constructor(options: CalEvent) {
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
        if (this.columnIndex > 4) this.columnIndex = -1;

        this.name = options.name;
        this.backgroundColor = options.backgroundColor;
        this.textColor = options.textColor || "inherit";
        this.durationSeconds = (this.endTimestamp - this.startTimestamp) / 1000;
        
    }

    buildTimeString() {
        this.timeString = this.startDate.format("dddd, MMMM D") + " • " + moment.timeString(this.startDate.get("hours"), this.startDate.get("minutes")) + "-" + moment.timeString(this.endDate.get("hours"), this.endDate.get("minutes"));
    }

    isVisible(cal: Calendar): boolean {
        if (
            this.columnIndex === -1 ||
            (this.startTimestamp < cal.minTimestamp! && this.endTimestamp < cal.minTimestamp!) ||
            (this.startTimestamp > cal.maxTimestamp!) || this.endTimestamp < cal.minTimestamp! ||
            this.inDayStartTime > cal.timeMax ||
            this.inDayEndTime < cal.timeMin
        ) {
            return false;
        }
        return true;
    }

    calculatePosition(cal: Calendar): void {
        // We should have: this.displayTop + (this.durationSeconds*cal.timeIntervalMinutes) + this.displayBottom == cal.height;
        this.specialClass = "none";
        this.displayTop = Math.max(((this.inDayStartTime - cal.timeMin) / 1000 / 60) * cal.oneMinuteHeight,0) + (cal.timeItemHeight/2);
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
    }

    refreshView(cal: Calendar, recalcuatePosition: boolean = false): void {
        if (!this.clickEventHandler) this.clickEventHandler = this.openMenu.bind(this, cal);
        this.buildTimeString();
        if (!this.isVisible(cal)) {
            if (this.domItem) {
                this.domItem.removeEventListener("click",this.clickEventHandler);
                this.clickEventHandler = undefined;
                this.domItem.remove();
            }
            this.domItem = undefined;
            return;
        }
        if (typeof(this.displayTop) == "undefined" || recalcuatePosition === true) {
            this.calculatePosition(cal);
        }
        if (typeof this.domItem == "undefined") {
            this.domItem = (this.columnIndex === -1) ? null : gm.newItem("div", "cal-columns-event", cal.dayColumns[this.columnIndex]) as HTMLDivElement;
            gm.newItem("p","cal-column-event-name",this.domItem);
            gm.newItem("p", "cal-column-event-time", this.domItem);
            this.domItem!.addEventListener("click", this.clickEventHandler);
        }
        if (this.domItem !== null) {
            //let p: HTMLParagraphElement;
            this.domItem!.setAttribute("data-id", String(this.id));
            this.domItem!.setAttribute("style", `top: ${this.displayTop}px;height: ${this.displayHeight}px;color: ${this.textColor};background-color: ${this.backgroundColor};`);
            (this.specialClass === "none") ? this.domItem.className = "cal-columns-event" : this.domItem.className = "cal-columns-event " + this.specialClass;
            (this.domItem!.getElementsByClassName("cal-column-event-name")[0] as HTMLParagraphElement).innerText = String(this.name);
            (this.domItem!.getElementsByClassName("cal-column-event-time")[0] as HTMLParagraphElement).innerText = String(this.timeString);
        }
    }

    delete() {
        //@ts-ignore
        this.domItem.remove();
        this.domItem = null;
        return;
    }

    openMenu(cal: Calendar,event: MouseEvent) {
        //console.log("Clicked", this, cal, event);
        cal.openMenu({
            id: this.id!,
            title: this.name!,
            dt: this.timeString!,
            color: this.backgroundColor!,
            //classType: "NULL",
            //host: "NULL",
            //eventType: "NULL",
            //location: "NULL",
            //notes: null,
            nextToItem: this.domItem!
        });
        cal.eventDataFetchFunction(this.id!, function (this: Calendar, ogEvent: CCalEvent, success: boolean, eData?: CalEvent) {
            if (this.menu.getAttribute("data-id") !== ogEvent.id) { return; }
            if (!success) {
                this.setMenuData({
                    id: ogEvent.id!,
                    title: ogEvent.name,
                    color: ogEvent.backgroundColor,
                    dt: ogEvent.timeString!,
                    classType: "ERROR",
                    eventType: "ERROR",
                    host: "ERROR",
                    location: "ERROR",
                    notes: "ERROR"
                });
                return;
            }
            if (!eData) { return; }
            // Maybe refresh current info for event
            this.setMenuData({
                id: ogEvent.id!,
                title: ogEvent.name,
                color: ogEvent.backgroundColor,
                dt: ogEvent.timeString!,
                classType: eData.classType,
                eventType: eData.eventType,
                host: eData.host,
                location: eData.location,
                notes: eData.notes
            });
        }.bind(cal,this));
    }
}

var cal: Calendar;
function fetData(eventId: string, clb: (success: boolean, event?: CalEvent) => void): void {
    setTimeout(function () {
        clb(true, {
            id: "test2",
            startDateString: moment("2022-04-26 15:20:00").toISOString(),
            endDateString: moment("2022-04-26 15:40:00").toISOString(),
            name: "Tuesday !",
            backgroundColor: "green",
            host: "TS",
            eventType: "Revision",
            classType: "Physics",
            location: "S417",
            notes: "Catchin' up",
        });
    },2500);
    
}
window.addEventListener("load", function (event) {
    cal = new Calendar({
        container: document.getElementById("main-calendar") as HTMLDivElement,
        menu: document.getElementById("main-calendar-menu") as HTMLDivElement,
        height: 400,
        timeMin: (15*3600 * 1000) + (15*60*1000),
        timeMax: (16 * 3600 * 1000) + (5 * 60 * 1000),
        timeIntervalMinutes: 5,
        forceSingleColumn: false,
        eventDataFetchFunction: fetData,
        skipWeekDays: [1,4]
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
