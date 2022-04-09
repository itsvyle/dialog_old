type CalendarCreationOptions = {
    container: HTMLDivElement;
    height: number;
    timeMin: number;
    timeMax: number;
    timeIntervalMinutes: number;
    timesFontSize?: number;
    timeFormat?: "12h" | "24h";
    viewMode?: "list" | "columns";
};
const CalendarColumnTimeWidth = 45; //Width 45px
class Calendar {
    container: HTMLDivElement;
    height: number;
    width: number;
    timeMin: number;
    timeMax: number;
    oneMinuteHeight: number;
    duration: number;
    timeIntervalMinutes: number;
    viewMode: "list" | "columns" = "columns";
    timeFormat: "12h" | "24h";

    startOfWeekTimestamp: number;
    minTimestamp?: number;
    maxTimestamp?: number; 

    events: CCalEvent[] = [];

    constructor(opts: CalendarCreationOptions) {
        this.timeFormat = opts.timeFormat || "24h";
        this.viewMode = opts.viewMode || "columns";
        this.container = opts.container;
        this.height = opts.height;
        this.width = (<HTMLDivElement>this.container.getElementsByClassName("cal-content")[0]).offsetWidth;
        this.timeMin = opts.timeMin;
        this.timeMax = opts.timeMax;
        this.timeIntervalMinutes = opts.timeIntervalMinutes;
        this.duration = this.timeMax - this.timeMin;
        this.oneMinuteHeight = this.height / (this.duration / 60000);
        const par = this;
        window.addEventListener("resize", function (event) { par.width = (<HTMLDivElement>par.container.getElementsByClassName("cal-content")[0]).offsetWidth; });
        
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

    addEvent(e: CCalEvent): boolean {
        this.events.push(e);
        
        return false;
    }

    private timeString(hours: number, minutes: number) {
        return (this.timeFormat == "24h")
            ? `${(hours < 10) ? ("0" + String(hours)) : hours}:${(minutes < 10) ? ("0" + String(minutes)) : minutes}`
            : `${hours%12}:${(minutes < 10) ? ("0" + String(minutes)) : minutes} ${(hours<12) ? "AM" : "PM"}`;
    }

    private generateTimes() {
        this.container.classList.add("cal-mode-columns");
        const container = this.container.getElementsByClassName("cal-column-times")[0] as HTMLDivElement;
        const content = this.container.getElementsByClassName("cal-column-content")[0] as HTMLDivElement;
        let laps = Math.floor(this.duration / (this.timeIntervalMinutes * 60000)) + 1;
        let minute = this.timeMin / 60000;
        var itemHeightCompensation: number = 0,itemHeight: number = -1;
        for (let i = 0; i < laps; i++) {
            let hour = Math.floor(minute / 60);
            let minu = Math.abs(minute - hour * 60);
            let top: number;
            if (!itemHeightCompensation) {
                let p = gm.newItem("p", {
                    className: "cal-time",
                    innerText: this.timeString(hour, minu)
                }, container) as HTMLParagraphElement;
                itemHeight = p.offsetHeight;
                itemHeightCompensation = itemHeight / laps;
                top = (i * this.timeIntervalMinutes * this.oneMinuteHeight) - i * itemHeightCompensation;
                p.setAttribute("style", `top: ${top}px;`);
            } else {
                top = (i * this.timeIntervalMinutes * this.oneMinuteHeight) - i * itemHeightCompensation;
                gm.newItem("p", {
                    className: "cal-time",
                    innerText: this.timeString(hour, minu),
                    style: `top: ${top}px;`
                }, container);
            }

            gm.newItem("hr", {
                className: "cal-time-hr",
                style: "top: " + String(top + (itemHeight/2)) + "px;"
            },content);

            minute += this.timeIntervalMinutes;
        }

        if (this.viewMode == "list") {this.container.classList.remove("cal-mode-columns");}
    }

    refreshView() {
        if (this.viewMode == "list") {
            this.container.classList.remove("cal-mode-columns");
        } else if (this.viewMode == "columns") {
            this.container.classList.add("cal-mode-columns");

        }
    }
}

interface CalEvent {
    id: string|null;
    name: string;
    startDateString: string;
    endDateString: string;
    backgroundColor: string | "auto";
    textColor?: string;
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
    name: string;
    backgroundColor: string | "auto";
    textColor: string | undefined;

    durationSeconds: number;
    displayTop?: number;
    displayBottom?: number;
    private specialClass: "cut-bottom" | "cut-top" | "none" = "none";
    private domItem?: HTMLDivElement;

    constructor(options: CalEvent) {
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

    isVisible(cal: Calendar): boolean {
        if (
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
        if (this.inDayStartTime <= cal.timeMin) { // the event starts before the minTime
            this.specialClass = "cut-top";
            this.displayTop = 0; // this.height = (this.inDayEndTime - cal.timeMin)
            this.displayBottom = cal.height - (this.durationSeconds*cal.oneMinuteHeight);
        }
    }

    refreshView(cal: Calendar, recalcuatePosition: boolean = false): void {
        if (typeof this.displayTop == "undefined" || recalcuatePosition === true) {
            this.calculatePosition(cal);
        }
        if (typeof this.domItem == "undefined") {
            this.domItem = gm.newItem("div", null, cal.container.getElementsByClassName("cal-content")[0]) as HTMLDivElement;
        }
    }

}

var cal: Calendar;
window.addEventListener("load", function (event) {
    cal = new Calendar({
        container: document.getElementById("main-calendar") as HTMLDivElement,
        height: 400,
        timeMin: (15*3600 * 1000) + (15*60*1000),
        timeMax: (16 * 3600 * 1000) + (5 * 60 * 1000),
        timeIntervalMinutes: 5
    });
});
const testEvent_: CalEvent = {
    id: "test",
    startDateString: moment("2022-04-07 15:00:00").toISOString(),
    endDateString: moment("2022-04-07 15:45:00").toISOString(),
    name: "Test Event !",
    backgroundColor: "orange"
};
var testEvent = new CCalEvent(testEvent_);