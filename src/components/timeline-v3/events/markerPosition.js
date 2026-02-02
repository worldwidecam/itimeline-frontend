import { differenceInMilliseconds } from 'date-fns';

const calculateMarkerValue = (eventDate, viewMode, referenceDate = new Date()) => {
  if (!eventDate || viewMode === 'position') return 0;

  const event = new Date(eventDate);
  const reference = new Date(referenceDate);

  switch (viewMode) {
    case 'day': {
      const dayDiffMs = differenceInMilliseconds(
        new Date(event.getFullYear(), event.getMonth(), event.getDate()),
        new Date(reference.getFullYear(), reference.getMonth(), reference.getDate())
      );
      const dayDiff = dayDiffMs / (1000 * 60 * 60 * 24);
      const currentHour = reference.getHours();
      const eventHour = event.getHours();
      const eventMinute = event.getMinutes();
      return (dayDiff * 24) + eventHour - currentHour + (eventMinute / 60);
    }
    case 'week': {
      const dayDiffMs = differenceInMilliseconds(
        new Date(event.getFullYear(), event.getMonth(), event.getDate()),
        new Date(reference.getFullYear(), reference.getMonth(), reference.getDate())
      );
      const dayDiff = dayDiffMs / (1000 * 60 * 60 * 24);
      if (dayDiff === 0) {
        const totalMinutesInDay = 24 * 60;
        const eventMinutesIntoDay = event.getHours() * 60 + event.getMinutes();
        return eventMinutesIntoDay / totalMinutesInDay;
      }
      const totalMinutesInDay = 24 * 60;
      const eventMinutesIntoDay = (event.getHours() * 60) + event.getMinutes();
      const eventFractionOfDay = eventMinutesIntoDay / totalMinutesInDay;
      return Math.floor(dayDiff) + eventFractionOfDay;
    }
    case 'month': {
      const monthEventYear = event.getFullYear();
      const monthCurrentYear = reference.getFullYear();
      const monthEventMonth = event.getMonth();
      const currentMonth = reference.getMonth();
      const monthEventDay = event.getDate();
      const monthDaysInMonth = new Date(monthEventYear, monthEventMonth + 1, 0).getDate();
      const monthYearDiff = monthEventYear - monthCurrentYear;
      const monthDiff = monthEventMonth - currentMonth + (monthYearDiff * 12);
      const monthDayFraction = (monthEventDay - 1) / monthDaysInMonth;
      return monthDiff + monthDayFraction;
    }
    case 'year': {
      const yearEventYear = event.getFullYear();
      const yearCurrentYear = reference.getFullYear();
      const yearDiff = yearEventYear - yearCurrentYear;
      const yearEventMonth = event.getMonth();
      const yearMonthFraction = yearEventMonth / 12;
      const yearEventDay = event.getDate();
      const yearDaysInMonth = new Date(yearEventYear, yearEventMonth + 1, 0).getDate();
      const yearDayFraction = (yearEventDay - 1) / yearDaysInMonth / 12;
      return yearDiff + yearMonthFraction + yearDayFraction;
    }
    default:
      return 0;
  }
};

export default calculateMarkerValue;
