import { useState, type CSSProperties } from 'react';
import {
  Calendar,
  DatePicker,
  type CalendarCellProps,
  type CalendarChangeEvent,
  type DatePickerChangeEvent,
} from '@progress/kendo-react-dateinputs';
import { Button, ButtonGroup } from '@progress/kendo-react-buttons';
import { Card } from '@progress/kendo-react-layout';
import { Dialog, DialogActionsBar } from '@progress/kendo-react-dialogs';
import { RadioGroup, TextArea, type RadioGroupChangeEvent, type TextAreaChangeEvent } from '@progress/kendo-react-inputs';
import { SvgIcon } from '@progress/kendo-react-common';
import {
  calendarIcon,
  calendarDateIcon,
  infoCircleIcon,
  chevronLeftIcon,
  chevronRightIcon,
  plusIcon,
  xIcon,
} from '@progress/kendo-svg-icons';

/**
 * Small Calendar — portal dashboard. Left holds the app cards (placeholders);
 * the right panel is a compact month calendar over an Events / Updates feed.
 *
 * Events / Updates is a filter on the selected day, not a separate calendar: a
 * day is dotted if it has either, and switching the filter keeps the selected
 * day. Expanding an entry pins its Close button to the bottom of the scroll
 * region and dims the entries below it.
 */

const YEAR = 2025;
const MONTH = 2; // March, to match the design

const RIDE_ALONG =
  'Full-day field ride-along covering the eight highest-decile prescribers in territory T021 (Marietta, GA). Goal is to validate the new segmentation tiers before the Q3 target list locks. Rep should pre-call each office to confirm signature on the updated sample acknowledgement forms, and bring the refreshed managed-care grid for the two largest commercial plans in the region.';
const LAUNCH_STANDUP =
  'Cross-functional launch readiness standup ahead of the indication expansion. Attendees: brand lead, IC ops, field analytics, and the three regional sales directors. We need a go / no-go on the incentive plan mechanics before the payout curve is communicated to the field.';
const ADVISORY =
  'Advisory dinner with four key opinion leaders from the Southeast oncology network. Keep materials compliant and on-label. Confirm AV setup at the venue by noon and that the honoraria paperwork is pre-signed before anyone arrives.';
const DISTRICT_SYNC = 'Quarterly sync with the district team. Bring the latest call-plan export.';
const FORMULARY = 'Account meeting to review formulary status and prior-auth volume.';
const SAMPLE_DROP = 'Sample drop and quick detail. Confirm fridge space for the cold-chain product.';
const COACHING = 'Coaching session with the new rep. Shadow two calls, then debrief over lunch.';

const UPDATE_IC =
  'The IC dashboard now reflects Q2 data and your Q1 payout statement is finalized under Statements. Attainment curves were recalibrated after the mid-quarter roster change, so a few territories shifted tier. Review your updated quota before the next cycle locks.';
const UPDATE_ALIGN =
  'Alignment maintenance window is scheduled for this weekend. Territory boundaries may be briefly read-only on Saturday night while changes are applied.';
const UPDATE_MBO = 'New MBO plan descriptions were published. Acknowledge by end of week to keep your dashboard current.';
const UPDATE_FORECAST = 'Forecasting model refreshed with the latest Rx capture. Projected revenue moved up 2.4% across the period.';

type TabKey = 'events' | 'updates';
type Feeds = Record<TabKey, Record<string, string[]>>;

const dateKey = (d: Date) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;

// Seed data, keyed by day-of-month in March. Days 4/6/24 carry both an event
// and an update; the 13th is updates-only and the 27th events-only, so the
// filter is exercised. Items added via the dialog merge in alongside these.
const SEED: Record<TabKey, Record<number, string[]>> = {
  events: {
    4: [RIDE_ALONG, DISTRICT_SYNC],
    6: [FORMULARY],
    24: [LAUNCH_STANDUP, SAMPLE_DROP, COACHING],
    27: [ADVISORY, DISTRICT_SYNC],
  },
  updates: {
    4: [UPDATE_IC],
    6: [UPDATE_ALIGN, UPDATE_MBO],
    13: [UPDATE_FORECAST],
    24: [UPDATE_IC],
  },
};

function seedFeeds(): Feeds {
  const byDate = (byDay: Record<number, string[]>) =>
    Object.fromEntries(
      Object.entries(byDay).map(([day, list]) => [dateKey(new Date(YEAR, MONTH, +day)), list]),
    );
  return { events: byDate(SEED.events), updates: byDate(SEED.updates) };
}

const TABS: { key: TabKey; label: string; icon: typeof calendarDateIcon }[] = [
  { key: 'events', label: 'Events', icon: calendarDateIcon },
  { key: 'updates', label: 'Updates', icon: infoCircleIcon },
];

const TYPE_OPTIONS = TABS.map((t) => ({ label: t.label.replace(/s$/, ''), value: t.key }));

// Kendo's modern Calendar is a continuous scroller that renders the focused
// month plus the next one. We clip the view to exactly the focused month's
// week rows (header row + N weeks), so only one month shows.
function weeksInMonth(d: Date): number {
  const first = new Date(d.getFullYear(), d.getMonth(), 1);
  const daysInMonth = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  return Math.ceil((first.getDay() + daysInMonth) / 7);
}

function formatHeading(d: Date): string {
  return d.toLocaleDateString('en-US', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

const PLACEHOLDER_CARDS = Array.from({ length: 6 }, (_, i) => i);

export default function SmallCalendar() {
  const [feeds, setFeeds] = useState<Feeds>(seedFeeds);
  const [activeTab, setActiveTab] = useState<TabKey>('events');
  // Index of the expanded entry within the selected day's list (null = none).
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const [focusedDate, setFocusedDate] = useState(new Date(YEAR, MONTH, 1));
  const [selectedDate, setSelectedDate] = useState(new Date(YEAR, MONTH, 4));

  // Add-event dialog
  const [addOpen, setAddOpen] = useState(false);
  const [addType, setAddType] = useState<TabKey>('events');
  const [addDate, setAddDate] = useState<Date | null>(new Date(YEAR, MONTH, 4));
  const [addDetails, setAddDetails] = useState('');

  const tab = TABS.find((t) => t.key === activeTab) ?? TABS[0];
  const items = feeds[activeTab][dateKey(selectedDate)] ?? [];
  const monthTitle = focusedDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  // A day is dotted if it has anything in either feed (independent of filter).
  const hasAnyItems = (d: Date) => {
    const k = dateKey(d);
    return Boolean(feeds.events[k]) || Boolean(feeds.updates[k]);
  };

  function shiftMonth(delta: number) {
    setFocusedDate((d) => new Date(d.getFullYear(), d.getMonth() + delta, 1));
  }

  function switchTab(key: TabKey) {
    setActiveTab(key);
    setExpandedIndex(null);
  }

  function selectDay(value: Date) {
    setSelectedDate(value);
    setExpandedIndex(null);
  }

  function openAdd() {
    setAddType(activeTab);
    setAddDate(selectedDate);
    setAddDetails('');
    setAddOpen(true);
  }

  const canAdd = addDate instanceof Date && addDetails.trim() !== '';

  function handleAdd() {
    if (!addDate || !addDetails.trim()) return;
    const k = dateKey(addDate);
    setFeeds((prev) => ({
      ...prev,
      [addType]: { ...prev[addType], [k]: [...(prev[addType][k] ?? []), addDetails.trim()] },
    }));
    // Surface the new item: switch to its feed and select its date.
    setActiveTab(addType);
    setSelectedDate(addDate);
    setFocusedDate(new Date(addDate.getFullYear(), addDate.getMonth(), 1));
    setExpandedIndex(null);
    setAddOpen(false);
  }

  // A custom cell owns its own <td> classes (Kendo doesn't pass them through).
  // We mirror the state classes, blank adjacent-month days, and add the dot.
  const DayCell = ({ value, isOtherMonth, isToday, isSelected, isWeekend, isFocused, onClick, formattedValue }: CalendarCellProps) => {
    const cls = [
      'k-calendar-td',
      isToday && 'k-today',
      isSelected && 'k-selected',
      isWeekend && 'k-weekend',
      isFocused && 'k-focus',
    ]
      .filter(Boolean)
      .join(' ');
    if (isOtherMonth) return <td className={`${cls} k-other-month`} role="gridcell" />;
    return (
      <td className={cls} role="gridcell">
        <span className="k-link sc-day" onClick={(e) => onClick?.(value, e)}>
          {formattedValue}
          {hasAnyItems(value) && <span className="sc-day__dot" aria-hidden="true" />}
        </span>
      </td>
    );
  };

  return (
    <div className="beghou-page beghou-page--fill sc-page">
      <div className="sc-layout">
        {/* App cards (placeholders) */}
        <section className="sc-main" aria-label="Apps">
          <div className="sc-cards">
            {PLACEHOLDER_CARDS.map((i) => (
              <Card key={i} className="sc-card-placeholder" aria-hidden="true" />
            ))}
          </div>
        </section>

        {/* Calendar + feed */}
        <aside className="sc-side" aria-label="Calendar and feed">
          <div className="sc-widget">
            <div className="sc-cal-header">
              <SvgIcon icon={calendarIcon} className="sc-cal-header__icon" />
              <span className="sc-cal-header__title">{monthTitle}</span>
              <Button
                fillMode="flat"
                size="small"
                svgIcon={chevronLeftIcon}
                onClick={() => shiftMonth(-1)}
                aria-label="Previous month"
                className="sc-cal-header__nav"
              />
              <Button
                fillMode="flat"
                size="small"
                svgIcon={chevronRightIcon}
                onClick={() => shiftMonth(1)}
                aria-label="Next month"
                className="sc-cal-header__nav"
              />
              <Button
                rounded="full"
                themeColor="primary"
                size="small"
                svgIcon={plusIcon}
                aria-label="Add event or update"
                className="sc-cal-header__add"
                onClick={openAdd}
              />
            </div>

            <div
              className="sc-cal-wrap"
              style={{ '--sc-cal-weeks': weeksInMonth(focusedDate) } as CSSProperties}
            >
              <Calendar
                // Remount per month so the focused month renders at the top of
                // the (clipped) continuous-scroll view instead of scrolling to
                // it — scroll is suppressed by our overflow:hidden clip.
                key={`${focusedDate.getFullYear()}-${focusedDate.getMonth()}`}
                className="sc-calendar"
                value={selectedDate}
                focusedDate={focusedDate}
                navigation={false}
                weekNumber={false}
                cell={DayCell}
                onChange={(e: CalendarChangeEvent) => selectDay(e.value)}
              />
            </div>

            <ButtonGroup className="sc-tabs">
              {TABS.map((t) => {
                const count = feeds[t.key][dateKey(selectedDate)]?.length ?? 0;
                return (
                  <Button
                    key={t.key}
                    togglable
                    selected={activeTab === t.key}
                    svgIcon={t.icon}
                    onClick={() => switchTab(t.key)}
                    className="sc-tab"
                  >
                    {t.label} ({count})
                  </Button>
                );
              })}
            </ButtonGroup>

            <div className="sc-feed">
              <h3 className="sc-feed__date">{formatHeading(selectedDate)}</h3>

              {items.length === 0 ? (
                <p className="sc-feed__empty">No {tab.label.toLowerCase()} for this date.</p>
              ) : (
                items.map((body, i) => {
                  const isExpanded = expandedIndex === i;
                  const muted = expandedIndex !== null && i > expandedIndex;
                  return (
                    <article
                      key={i}
                      className={`sc-entry${muted ? ' sc-entry--muted' : ''}`}
                    >
                      <p className={`sc-entry__body${isExpanded ? '' : ' sc-entry__body--clamp'}`}>
                        {body}
                      </p>
                      {isExpanded ? (
                        <div className="sc-entry__close-bar">
                          <Button
                            fillMode="flat"
                            svgIcon={xIcon}
                            onClick={() => setExpandedIndex(null)}
                            aria-label="Close description"
                            className="sc-entry__close"
                          />
                        </div>
                      ) : (
                        <button
                          type="button"
                          className="sc-entry__more"
                          onClick={() => setExpandedIndex(i)}
                        >
                          Read more
                        </button>
                      )}
                    </article>
                  );
                })
              )}
            </div>
          </div>
        </aside>
      </div>

      {addOpen && (
        <Dialog title="New calendar entry" onClose={() => setAddOpen(false)} width={460} className="sc-add-dialog">
          <div className="sc-form">
            <div className="sc-form__field">
              <span className="sc-form__label">Type</span>
              <RadioGroup
                className="sc-form__radios"
                layout="horizontal"
                data={TYPE_OPTIONS}
                value={addType}
                onChange={(e: RadioGroupChangeEvent) => setAddType(e.value as TabKey)}
              />
            </div>

            <label className="sc-form__field">
              <span className="sc-form__label">Date</span>
              <DatePicker
                value={addDate}
                fillMode="outline"
                size="medium"
                onChange={(e: DatePickerChangeEvent) => setAddDate(e.value)}
              />
            </label>

            <label className="sc-form__field">
              <span className="sc-form__label">Details</span>
              <TextArea
                value={addDetails}
                rows={5}
                fillMode="outline"
                placeholder={`Describe this ${addType === 'events' ? 'event' : 'update'}…`}
                onChange={(e: TextAreaChangeEvent) => setAddDetails(String(e.value ?? ''))}
              />
            </label>
          </div>

          <DialogActionsBar layout="end">
            <Button fillMode="outline" themeColor="primary" onClick={() => setAddOpen(false)}>
              Cancel
            </Button>
            <Button themeColor="primary" disabled={!canAdd} onClick={handleAdd}>
              Add
            </Button>
          </DialogActionsBar>
        </Dialog>
      )}
    </div>
  );
}
