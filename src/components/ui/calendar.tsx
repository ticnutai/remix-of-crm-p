import * as React from "react";
import { ChevronLeft, ChevronRight, ChevronsUpDown } from "lucide-react";
import { DayPicker, useNavigation, useDayPicker, type CaptionProps } from "react-day-picker";

import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

const HE_MONTHS = [
  "ינואר", "פברואר", "מרץ", "אפריל", "מאי", "יוני",
  "יולי", "אוגוסט", "ספטמבר", "אוקטובר", "נובמבר", "דצמבר",
];

/**
 * Compact single-row caption: [‹] [Month ▾] · [Year ▾] [›]
 * Always fits in one line — month and year use native <select> overlays so they
 * can never wrap or overflow the calendar panel.
 */
function CompactCaption(props: CaptionProps) {
  const { goToMonth, nextMonth, previousMonth } = useNavigation();
  const { fromYear, toYear, fromDate, toDate } = useDayPicker();

  const month = props.displayMonth.getMonth();
  const year = props.displayMonth.getFullYear();

  const minYear = fromYear ?? fromDate?.getFullYear() ?? year - 60;
  const maxYear = toYear ?? toDate?.getFullYear() ?? year + 10;
  const years = React.useMemo(() => {
    const out: number[] = [];
    for (let y = maxYear; y >= minYear; y--) out.push(y);
    return out;
  }, [minYear, maxYear]);

  const handleMonthChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    goToMonth(new Date(year, Number(e.target.value), 1));
  };
  const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    goToMonth(new Date(Number(e.target.value), month, 1));
  };

  const pillBase =
    "relative inline-flex items-center gap-1 h-8 rounded-md border border-primary/40 bg-background px-2 text-sm font-medium text-foreground shadow-sm hover:bg-accent/40 transition-colors min-w-0";

  return (
    <div className="flex items-center justify-between gap-2 px-1 pt-1 w-full min-w-0" dir="rtl">
      <button
        type="button"
        aria-label="חודש קודם"
        onClick={() => previousMonth && goToMonth(previousMonth)}
        disabled={!previousMonth}
        className={cn(
          buttonVariants({ variant: "outline" }),
          "h-8 w-8 shrink-0 p-0 opacity-70 hover:opacity-100 disabled:opacity-30",
        )}
      >
        <ChevronRight className="h-4 w-4" />
      </button>

      <div className="flex flex-1 items-center justify-center gap-1 min-w-0 overflow-hidden whitespace-nowrap">
        {/* Month pill */}
        <label className={cn(pillBase, "max-w-[44%] truncate")}>
          <span className="truncate">{HE_MONTHS[month]}</span>
          <ChevronsUpDown className="h-3 w-3 opacity-60 shrink-0" />
          <select
            aria-label="בחר חודש"
            value={month}
            onChange={handleMonthChange}
            className="absolute inset-0 cursor-pointer opacity-0"
          >
            {HE_MONTHS.map((name, idx) => (
              <option key={name} value={idx}>
                {name}
              </option>
            ))}
          </select>
        </label>

        <span className="text-muted-foreground text-xs select-none">/</span>

        {/* Year pill */}
        <label className={cn(pillBase, "max-w-[40%] truncate")}>
          <span className="truncate tabular-nums">{year}</span>
          <ChevronsUpDown className="h-3 w-3 opacity-60 shrink-0" />
          <select
            aria-label="בחר שנה"
            value={year}
            onChange={handleYearChange}
            className="absolute inset-0 cursor-pointer opacity-0"
          >
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </label>
      </div>

      <button
        type="button"
        aria-label="חודש הבא"
        onClick={() => nextMonth && goToMonth(nextMonth)}
        disabled={!nextMonth}
        className={cn(
          buttonVariants({ variant: "outline" }),
          "h-8 w-8 shrink-0 p-0 opacity-70 hover:opacity-100 disabled:opacity-30",
        )}
      >
        <ChevronLeft className="h-4 w-4" />
      </button>
    </div>
  );
}

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  fromYear,
  toYear,
  ...props
}: CalendarProps) {
  const currentYear = new Date().getFullYear();
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      dir="rtl"
      fromYear={fromYear ?? currentYear - 60}
      toYear={toYear ?? currentYear + 10}
      className={cn("p-3 pointer-events-auto", className)}
      classNames={{
        months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
        month: "space-y-4",
        caption: "relative items-center",
        caption_label: "sr-only",
        nav: "hidden",
        table: "w-full border-collapse space-y-1",
        head_row: "flex w-full",
        head_cell:
          "text-muted-foreground rounded-md font-normal text-[0.8rem] flex-1 text-center",
        row: "flex w-full mt-2",
        cell: "text-center text-sm p-0 relative flex-1 [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
        day: cn(
          buttonVariants({ variant: "ghost" }),
          "h-9 w-9 p-0 font-normal aria-selected:opacity-100 mx-auto",
        ),
        day_range_end: "day-range-end",
        day_selected:
          "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
        day_today: "bg-accent text-accent-foreground",
        day_outside:
          "day-outside text-muted-foreground opacity-50 aria-selected:bg-accent/50 aria-selected:text-muted-foreground aria-selected:opacity-30",
        day_disabled: "text-muted-foreground opacity-50",
        day_range_middle:
          "aria-selected:bg-accent aria-selected:text-accent-foreground",
        day_hidden: "invisible",
        ...classNames,
      }}
      components={{
        Caption: CompactCaption,
      }}
      {...props}
    />
  );
}
Calendar.displayName = "Calendar";

export { Calendar };

