import { Injectable, Logger } from '@nestjs/common';

import { Decimal } from 'src/modules/cpq/utils/cpq-decimal.utils';

// Deferred revenue waterfall engine — computes the opening/closing
// deferred revenue balances that finance teams expect:
// Opening Deferred → New Bookings → Recognition → Adjustments → Closing Deferred
@Injectable()
export class RevenueWaterfallEngine {
  private readonly logger = new Logger(RevenueWaterfallEngine.name);

  computeWaterfall(
    schedules: RevRecScheduleRecord[],
    period: WaterfallPeriod,
  ): WaterfallResult {
    const months = this.generateMonthRange(period.startMonth, period.endMonth);
    const rows: WaterfallRow[] = [];

    let runningDeferred = new Decimal(0);

    // Calculate initial deferred: total contract value minus recognition before start
    for (const schedule of schedules) {
      const total = new Decimal(schedule.totalAmount || '0');
      const recognizedBefore = this.sumRecognizedBefore(schedule, period.startMonth);
      runningDeferred = runningDeferred.plus(total.minus(recognizedBefore));
    }

    for (const month of months) {
      const openingDeferred = runningDeferred;

      // New bookings: schedules with start date in this month
      let newBookings = new Decimal(0);
      for (const schedule of schedules) {
        if (this.getStartMonth(schedule) === month) {
          newBookings = newBookings.plus(new Decimal(schedule.totalAmount || '0'));
        }
      }

      // Recognition: amount recognized this month across all schedules
      let recognition = new Decimal(0);
      for (const schedule of schedules) {
        const monthlySchedule = schedule.monthlySchedule || {};
        const monthValue = monthlySchedule[month];
        if (monthValue !== undefined) {
          recognition = recognition.plus(new Decimal(monthValue));
        }
      }

      const closingDeferred = openingDeferred
        .plus(newBookings)
        .minus(recognition);

      rows.push({
        month,
        openingDeferred: openingDeferred.toDecimalPlaces(2).toString(),
        newBookings: newBookings.toDecimalPlaces(2).toString(),
        recognition: recognition.toDecimalPlaces(2).toString(),
        adjustments: '0',
        closingDeferred: closingDeferred.toDecimalPlaces(2).toString(),
      });

      runningDeferred = closingDeferred;
    }

    const totalRecognition = rows.reduce(
      (sum, r) => sum.plus(new Decimal(r.recognition)),
      new Decimal(0),
    );
    const totalBookings = rows.reduce(
      (sum, r) => sum.plus(new Decimal(r.newBookings)),
      new Decimal(0),
    );

    return {
      rows,
      summary: {
        totalRecognized: totalRecognition.toDecimalPlaces(2).toString(),
        totalBooked: totalBookings.toDecimalPlaces(2).toString(),
        openingDeferred: rows[0]?.openingDeferred || '0',
        closingDeferred: rows[rows.length - 1]?.closingDeferred || '0',
        periodCount: rows.length,
      },
    };
  }

  private sumRecognizedBefore(schedule: RevRecScheduleRecord, startMonth: string): Decimal {
    let sum = new Decimal(0);
    const monthlySchedule = schedule.monthlySchedule || {};
    for (const [month, value] of Object.entries(monthlySchedule)) {
      if (month < startMonth) {
        sum = sum.plus(new Decimal(value));
      }
    }
    return sum;
  }

  private getStartMonth(schedule: RevRecScheduleRecord): string {
    if (schedule.startDate) {
      return schedule.startDate.substring(0, 7); // YYYY-MM
    }
    const months = Object.keys(schedule.monthlySchedule || {}).sort();
    return months[0] || '';
  }

  private generateMonthRange(start: string, end: string): string[] {
    const months: string[] = [];
    const [startYear, startMonth] = start.split('-').map(Number);
    const [endYear, endMonth] = end.split('-').map(Number);

    let year = startYear;
    let month = startMonth;

    while (year < endYear || (year === endYear && month <= endMonth)) {
      months.push(`${year}-${String(month).padStart(2, '0')}`);
      month++;
      if (month > 12) {
        month = 1;
        year++;
      }
    }

    return months;
  }
}

// Types
export type RevRecScheduleRecord = {
  dealHubspotId: string;
  lineItemHubspotId?: string;
  totalAmount: string;
  startDate?: string;
  endDate?: string;
  monthlySchedule: Record<string, number>;
};

export type WaterfallPeriod = {
  startMonth: string; // YYYY-MM
  endMonth: string;   // YYYY-MM
};

export type WaterfallRow = {
  month: string;
  openingDeferred: string;
  newBookings: string;
  recognition: string;
  adjustments: string;
  closingDeferred: string;
};

export type WaterfallResult = {
  rows: WaterfallRow[];
  summary: {
    totalRecognized: string;
    totalBooked: string;
    openingDeferred: string;
    closingDeferred: string;
    periodCount: number;
  };
};
