type CalendarCreationOptions = {
    container: HTMLDivElement;
    height: number;
    timeMin: number;
    timeMax: number;
    timeIntervalMinutes: number;
    timesFontSize?: number;
};
class Calendar {
    container: HTMLDivElement;
    height: number;
    width: number;
    timeMin: number;
    timeMax: number;
    oneMinute: number;
    duration: number;
    timeIntervalMinutes: number;
    viewMode: "list" | "columns" = "columns";

    constructor(opts: CalendarCreationOptions) {
        this.container = opts.container;
        this.height = opts.height;
        this.width = this.container.offsetWidth;
        this.timeMin = opts.timeMin;
        this.timeMax = opts.timeMax;
        this.timeIntervalMinutes = opts.timeIntervalMinutes;
        this.duration = this.timeMax - this.timeMin;
        this.oneMinute = this.height / (this.duration / 60000);
        const par = this;
        window.addEventListener("resize", function (event) { par.width = par.container.offsetWidth; });

        this.generateTimes();
        this.refreshView();
    }

    private generateTimes() {
        this.container.classList.add("cal-mode-columns");
        const container = this.container.getElementsByClassName("cal-column-times")[0] as HTMLDivElement;
        const content = this.container.getElementsByClassName("cal-column-content")[0] as HTMLDivElement;
        let laps = Math.floor(this.duration / (this.timeIntervalMinutes * 60000)) + 1;
        let minute = this.timeMin / 60000;
        let itemHeightCompensation: number,itemHeight: number;
        for (let i = 0; i < laps; i++) {
            let hour = Math.floor(minute / 60);
            let minu = Math.abs(minute - hour * 60);
            let top: number;
            if (!itemHeightCompensation) {
                let p = gm.newItem("p", {
                    className: "cal-time",
                    innerText: `${(hour < 10) ? ("0" + String(hour)) : hour}:${(minu < 10) ? ("0" + String(minu)) : minu}`
                }, container) as HTMLParagraphElement;
                itemHeight = p.offsetHeight;
                itemHeightCompensation = itemHeight / laps;
                top = (i * this.timeIntervalMinutes * this.oneMinute) - i * itemHeightCompensation;
                p.setAttribute("style", `top: ${top}px;`);
            } else {
                top = (i * this.timeIntervalMinutes * this.oneMinute) - i * itemHeightCompensation;
                gm.newItem("p", {
                    className: "cal-time",
                    innerText: `${(hour < 10) ? ("0" + String(hour)) : hour}:${(minu < 10) ? ("0" + String(minu)) : minu}`,
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
        } else {
            this.container.classList.add("cal-mode-columns");
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