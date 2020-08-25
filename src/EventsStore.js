import decorateEvents from './decorateEvents';

export default class EventsStore {
  constructor({
    calendars,
    timeZone,
    onEventsRequested,
    onChange,
  }) {
    this.selectedCalendars =
      calendars.filter(({ selected }) => selected).map(({ id }) => id);
    this.timeZone = timeZone;
    this.calendarsById = {};
    calendars.forEach((calendar) => {
      this.calendarsById[calendar.id] = calendar;
    });
    this.onEventsRequested = onEventsRequested;
    this.onChange = onChange;
    this.timespans = [];
  }

  cancel() {
    this.onChange = () => {};
  }

  updateSelectedCalendars(selectedCalendars) {
    this.selectedCalendars = selectedCalendars;
    this.fetchEvents();
    this.timespans.forEach((timespan) => {
      // eslint-disable-next-line no-param-reassign
      timespan.decoratedEvents = null;
    });
    this.onChange();
  }

  filterVisible(events) {
    return events.filter(({ calendarId }) =>
      this.selectedCalendars.indexOf(calendarId) !== -1);
  }

  get(atTime) {
    for (let i = 0; i < this.timespans.length; i++) {
      const timespan = this.timespans[i];
      const { start, end, events, decoratedEvents } = timespan;
      if (start.getTime() <= atTime.getTime() && end.getTime() > atTime.getTime()) {
        if (decoratedEvents) {
          return decoratedEvents;
        }
        timespan.decoratedEvents =
          decorateEvents(this.filterVisible(events), this.timeZone);
        return timespan.decoratedEvents;
      }
    }
    return [];
  }

  addTimespan({ start, end }) {
    this.timespans.push({
      start,
      end,
      events: [],
      calendarIds: [],
    });
    this.fetchEvents();
  }

  fetchEvents() {
    this.selectedCalendars.forEach((calendarId) => {
      this.timespans.forEach((timespan) => {
        if (timespan.calendarIds.indexOf(calendarId) !== -1) {
          // already fetched for this calendar
          return;
        }
        this.onEventsRequested({
          calendarId,
          start: timespan.start,
          end: timespan.end,
          callback: (events) => {
            timespan.events.push(...events);
            // eslint-disable-next-line no-param-reassign
            timespan.decoratedEvents = null; // clear cache
            this.onChange();
          },
        });
        timespan.calendarIds.push(calendarId);
      });
    });
  }
}
