import { useEffect, useMemo, useState } from 'react';
import {
  Scheduler,
  DayView,
  WeekView,
  MonthView,
  SchedulerItem,
  type SchedulerItemProps,
} from '@progress/kendo-react-scheduler';
import { Dialog, DialogActionsBar } from '@progress/kendo-react-dialogs';
import { Button } from '@progress/kendo-react-buttons';
import { TextBox, Checkbox, type TextBoxChangeEvent } from '@progress/kendo-react-inputs';
import { DropDownList, type DropDownListChangeEvent } from '@progress/kendo-react-dropdowns';
import { DatePicker, type DatePickerChangeEvent } from '@progress/kendo-react-dateinputs';
import { searchIcon, plusIcon, xIcon } from '@progress/kendo-svg-icons';
import { SvgIcon } from '@progress/kendo-react-common';

/**
 * Page — Calendar
 *
 * A shared commercialization calendar for pharma sales teams, built on the
 * Kendo Scheduler. Month is the default view; only Day / Week / Month are
 * exposed (Timeline, Work week and Agenda are intentionally omitted by not
 * registering those view components).
 *
 * Create flow ("Add to Calendar"):
 *  - Step 1 — pick an event type (Time Off Territory / Interaction /
 *    Conference Interaction).
 *  - Step 2 — fill that type's form. Only Time Off Territory is designed so
 *    far; the other two are placeholders pending mocks.
 *  - Closing a started form (X or Cancel) asks for confirmation before
 *    discarding. Saved events persist to localStorage and render on the grid.
 *
 * Clicking an event opens a left-docked slide-out with the full details. The
 * Scheduler is left read-only (no `editable`) so its built-in editor never
 * opens and our click handler owns the interaction.
 */

type CalEvent = {
  id: number;
  title: string;
  description: string;
  start: Date;
  end: Date;
  isAllDay: boolean;
  // Set on events created through the "Add to Calendar" flow so a click can
  // reopen the matching editor instead of the read-only slide-out.
  kind?: 'Time Off Territory';
  reason?: string;
  halfDay?: boolean;
};

// Calendar is centered on June 2026 so the seeded events land in the
// default month. Today (per workspace) is 2026-06-01.
const CAL_YEAR = 2026;
const CAL_MONTH = 5; // June (0-indexed)
const DEFAULT_DATE = new Date(CAL_YEAR, CAL_MONTH, 15);
const STORAGE_KEY = 'beghou.calendar.events';

const TITLES = [
  'Lunch & learn — Dr. Alvarez',
  'Territory T021 ride-along',
  'District call plan review',
  'Speaker program — Atlanta',
  'Formulary access sync',
  'KOL advisory dinner',
  'Sample drop — Marietta Clinic',
  'Q3 IC plan walkthrough',
  'Payer pull-through review',
  'New rep field coaching',
  'Launch readiness standup',
  'Regional business review',
  'Specialty pharmacy check-in',
  'Conference booth shift — ASCO',
  'Managed care account meeting',
  'Field force effectiveness sync',
  'Target list refresh — Q3',
  'Quota attainment huddle',
];

// A handful of long, made-up descriptions so the slide-out has to scroll.
// The rest get short ones. Cycled by index alongside TITLES.
const LONG_DESCRIPTIONS = [
  `Full-day field ride-along covering the eight highest-decile prescribers in territory T021 (Marietta, GA). Goal is to validate the new segmentation tiers before the Q3 target list locks. Rep should pre-call each office to confirm signature on the updated sample acknowledgement forms, and bring the refreshed managed-care grid for the two largest commercial plans in the region.

Afternoon block is reserved for a debrief with the district manager on reach-and-frequency gaps surfaced in last week's call-plan review. Bring laptop — we'll walk the CRM call notes live and flag any accounts that have slipped below the minimum touch threshold. If time allows, swing by the Lithia Springs clinic to drop the new patient-starter kits.`,
  `Cross-functional launch readiness standup ahead of the indication expansion. Attendees: brand lead, IC ops, field analytics, and the three regional sales directors. We need a go/no-go on the incentive plan mechanics — the payout curve modeling came back hotter than forecast and finance wants a second look at the accelerator threshold before it's communicated to the field.

Agenda: (1) launch tracker walkthrough, (2) open IC design questions, (3) field comms timeline, (4) risks and dependencies. Please review the pre-read deck before the call. Hard stop at the top of the hour — the payer pull-through review runs immediately after in the same room.`,
  `Advisory dinner with four key opinion leaders from the Southeast oncology network. This is relationship-building, not a promotional program, so keep materials compliant and on-label. Confirm AV setup at the venue by noon and that the honoraria paperwork is pre-signed.

Discussion themes: real-world evidence gaps, sequencing in the second-line setting, and barriers to specialty pharmacy fulfillment. Capture verbatim feedback for the medical affairs team — they're feeding it into the next advisory board charter.`,
];

const SHORT_DESCRIPTIONS = [
  'Quarterly sync with the district team. Bring the latest call-plan export.',
  'Account meeting to review formulary status and prior-auth volume.',
  'Sample drop and quick detail. Confirm fridge space for cold-chain product.',
  'Coaching session with the new rep — shadow two calls, then debrief.',
  'Booth coverage during the afternoon exhibit block. Badge scan target: 40.',
  'Pull-through review for the two largest commercial plans in the region.',
  'Walk the refreshed Q3 target list and reconcile against CRM.',
  'Speaker program logistics check. Verify venue and attendee RSVPs.',
];

// Day-of-month → number of events. Mix of 1 / 2 / 3 so some cells overflow
// and the Scheduler shows its built-in "..." more indicator.
const DAY_COUNTS: Record<number, number> = {
  2: 1, 3: 1, 4: 3, 5: 2, 8: 2, 9: 3, 10: 1, 11: 2,
  12: 1, 15: 1, 16: 2, 17: 1, 18: 3, 19: 2, 22: 1,
  23: 3, 24: 1, 25: 2, 26: 1, 29: 2, 30: 1,
};

const START_HOURS = [9, 11, 14, 16];

function buildSeedEvents(): CalEvent[] {
  const events: CalEvent[] = [];
  let id = 1;
  let t = 0; // rolling index into the title pool
  let longIdx = 0;

  for (const dayStr of Object.keys(DAY_COUNTS)) {
    const day = Number(dayStr);
    const count = DAY_COUNTS[day];
    for (let i = 0; i < count; i++) {
      const hour = START_HOURS[i % START_HOURS.length];
      const start = new Date(CAL_YEAR, CAL_MONTH, day, hour, 0, 0);
      const end = new Date(CAL_YEAR, CAL_MONTH, day, hour + 1, 0, 0);
      // First event of a 3-event day gets a long description.
      const description =
        count === 3 && i === 0
          ? LONG_DESCRIPTIONS[longIdx++ % LONG_DESCRIPTIONS.length]
          : SHORT_DESCRIPTIONS[id % SHORT_DESCRIPTIONS.length];
      events.push({
        id: id++,
        title: TITLES[t++ % TITLES.length],
        description,
        start,
        end,
        isAllDay: false,
      });
    }
  }
  return events;
}

// Code-generated demo events. User-created events live separately in
// localStorage and are merged on top of these.
const SEED_EVENTS = buildSeedEvents();

function loadUserEvents(): CalEvent[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Array<Omit<CalEvent, 'start' | 'end'> & { start: string; end: string }>;
    return parsed.map((e) => ({ ...e, start: new Date(e.start), end: new Date(e.end) }));
  } catch {
    return [];
  }
}

const VIEW_OPTIONS = ['My calls', 'My team', 'All calls'];
const MEDIUM_OPTIONS = ['All', 'In person', 'Phone', 'Virtual'];
const MATERIAL_OPTIONS = ['All', 'Samples', 'Detail aid', 'Reprints'];
const TEAM_OPTIONS = ['All', 'Oncology', 'Cardiology', 'Primary care'];

const TYPE_PLACEHOLDER = 'Choose a Value...';
const REASON_PLACEHOLDER = 'Choose a value...';
const EVENT_TYPES = ['Time Off Territory', 'Interaction', 'Conference Interaction'];
const TIMEOFF_REASONS = [
  'Vacation / PTO',
  'Sick',
  'Training',
  'Company holiday',
  'Personal',
  'Bereavement',
  'Jury duty',
];

function formatEventWhen(ev: CalEvent): string {
  const longDate = (d: Date) =>
    d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  const shortDate = (d: Date) =>
    d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const time = (d: Date) => d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

  if (ev.isAllDay) {
    const sameDay = ev.start.toDateString() === ev.end.toDateString();
    return sameDay ? `${longDate(ev.start)} · All day` : `${shortDate(ev.start)} – ${shortDate(ev.end)} · All day`;
  }
  return `${longDate(ev.start)} · ${time(ev.start)} – ${time(ev.end)}`;
}

export default function Calendar() {
  const [userEvents, setUserEvents] = useState<CalEvent[]>(loadUserEvents);

  // Persist user-created events (prototype stand-in for the real API).
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(userEvents));
    } catch {
      // storage may be unavailable; non-fatal in the prototype
    }
  }, [userEvents]);

  // Filter bar state
  const [search, setSearch] = useState('');
  const [view, setView] = useState(VIEW_OPTIONS[0]);
  const [medium, setMedium] = useState(MEDIUM_OPTIONS[0]);
  const [material, setMaterial] = useState(MATERIAL_OPTIONS[0]);
  const [team, setTeam] = useState(TEAM_OPTIONS[0]);

  // Slide-out detail panel
  const [selected, setSelected] = useState<CalEvent | null>(null);

  // Create flow
  const [createOpen, setCreateOpen] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [eventType, setEventType] = useState(''); // '' = type not yet chosen
  const [editingId, setEditingId] = useState<number | null>(null); // null = adding

  // Time Off Territory form
  const [toReason, setToReason] = useState('');
  const [toStart, setToStart] = useState<Date | null>(new Date(CAL_YEAR, CAL_MONTH, 1));
  const [toEnd, setToEnd] = useState<Date | null>(new Date(CAL_YEAR, CAL_MONTH, 1));
  const [toNote, setToNote] = useState('');
  const [toHalfDay, setToHalfDay] = useState(false);

  const allEvents = useMemo(() => [...SEED_EVENTS, ...userEvents], [userEvents]);
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return allEvents;
    return allEvents.filter((e) => e.title.toLowerCase().includes(q));
  }, [allEvents, search]);

  function resetFilters() {
    setSearch('');
    setView(VIEW_OPTIONS[0]);
    setMedium(MEDIUM_OPTIONS[0]);
    setMaterial(MATERIAL_OPTIONS[0]);
    setTeam(TEAM_OPTIONS[0]);
  }

  function resetCreateForm() {
    setEventType('');
    setEditingId(null);
    setToReason('');
    setToStart(new Date(CAL_YEAR, CAL_MONTH, 1));
    setToEnd(new Date(CAL_YEAR, CAL_MONTH, 1));
    setToNote('');
    setToHalfDay(false);
  }

  function openCreate() {
    resetCreateForm();
    setConfirmCancel(false);
    setCreateOpen(true);
  }

  // Reopen a saved Time Off Territory event in the same dialog, pre-filled,
  // titled "Edit Territory Time Off".
  function openEditTimeOff(ev: CalEvent) {
    setEditingId(ev.id);
    setEventType('Time Off Territory');
    setToReason(ev.reason ?? '');
    setToStart(new Date(ev.start));
    setToEnd(new Date(ev.end));
    setToNote(ev.description);
    setToHalfDay(Boolean(ev.halfDay));
    setConfirmCancel(false);
    setCreateOpen(true);
  }

  function handleEventClick(ev: CalEvent) {
    if (ev.kind === 'Time Off Territory') openEditTimeOff(ev);
    else setSelected(ev);
  }

  // A form is "dirty" once a type has been chosen — that's the point past
  // which closing should ask before discarding.
  const isDirty = eventType !== '';

  function attemptClose() {
    if (isDirty) setConfirmCancel(true);
    else closeCreate();
  }

  function closeCreate() {
    setCreateOpen(false);
    setConfirmCancel(false);
    resetCreateForm();
  }

  const canSaveTimeOff = toReason !== '' && toStart instanceof Date && toEnd instanceof Date;

  function handleSave() {
    if (eventType === 'Time Off Territory') {
      if (!canSaveTimeOff || !toStart || !toEnd) return;
      const start = new Date(toStart);
      start.setHours(0, 0, 0, 0);
      const end = new Date(toEnd);
      end.setHours(23, 59, 0, 0);
      const halfTag = toHalfDay ? ' (Half day)' : '';
      const fields = {
        title: `Time off — ${toReason}${halfTag}`,
        description: toNote.trim(),
        start,
        end,
        isAllDay: true,
        kind: 'Time Off Territory' as const,
        reason: toReason,
        halfDay: toHalfDay,
      };
      if (editingId !== null) {
        setUserEvents((prev) => prev.map((e) => (e.id === editingId ? { ...e, ...fields } : e)));
      } else {
        setUserEvents((prev) => [...prev, { id: Date.now(), ...fields }]);
      }
      closeCreate();
    }
    // Interaction / Conference Interaction: forms pending mocks.
  }

  let dialogTitle = 'Add to Calendar';
  if (eventType === 'Time Off Territory') {
    dialogTitle = editingId !== null ? 'Edit Territory Time Off' : 'Add Territory Time Off';
  } else if (eventType !== '') {
    dialogTitle = `Add ${eventType}`;
  }

  return (
    <div className="beghou-page beghou-page--fill cal-page">
      {/* White bordered card framing the whole calendar module for readability */}
      <div className="cal-card">
      {/* Filter bar (mirrors Figma; only Search is wired) */}
      <div className="cal-filters">
        <label className="cal-field">
          <span className="cal-field__label">Search</span>
          <TextBox
            value={search}
            fillMode="outline"
            size="medium"
            onChange={(e: TextBoxChangeEvent) => setSearch(String(e.value ?? ''))}
            prefix={() => (
              <span className="cal-search-icon">
                <SvgIcon icon={searchIcon} />
              </span>
            )}
            aria-label="Search events"
          />
        </label>

        <label className="cal-field">
          <span className="cal-field__label">View</span>
          <DropDownList
            data={VIEW_OPTIONS}
            value={view}
            fillMode="outline"
            size="medium"
            onChange={(e: DropDownListChangeEvent) => setView(e.value)}
          />
        </label>

        <label className="cal-field">
          <span className="cal-field__label">Medium</span>
          <DropDownList
            data={MEDIUM_OPTIONS}
            value={medium}
            fillMode="outline"
            size="medium"
            onChange={(e: DropDownListChangeEvent) => setMedium(e.value)}
          />
        </label>

        <label className="cal-field">
          <span className="cal-field__label">Material used</span>
          <DropDownList
            data={MATERIAL_OPTIONS}
            value={material}
            fillMode="outline"
            size="medium"
            onChange={(e: DropDownListChangeEvent) => setMaterial(e.value)}
          />
        </label>

        <label className="cal-field">
          <span className="cal-field__label">User Team</span>
          <DropDownList
            data={TEAM_OPTIONS}
            value={team}
            fillMode="outline"
            size="medium"
            onChange={(e: DropDownListChangeEvent) => setTeam(e.value)}
          />
        </label>

        <Button className="cal-reset" fillMode="outline" size="medium" onClick={resetFilters}>
          Reset
        </Button>

        <Button
          className="cal-create"
          themeColor="primary"
          size="medium"
          svgIcon={plusIcon}
          onClick={openCreate}
        >
          Create New Event
        </Button>
      </div>

      {/* Scheduler — Month default, only Day/Week/Month registered */}
      <div className="cal-scheduler-wrap">
        <Scheduler
          data={filtered}
          defaultView="month"
          defaultDate={DEFAULT_DATE}
          height="100%"
          item={(itemProps: SchedulerItemProps) => (
            <SchedulerItem
              {...itemProps}
              onClick={() => handleEventClick(itemProps.dataItem as CalEvent)}
            />
          )}
        >
          <DayView />
          <WeekView />
          <MonthView />
        </Scheduler>
      </div>
      </div>

      {/* Slide-out detail panel (docked left, slides left→right) */}
      <div
        className={`cal-detail${selected ? ' cal-detail--open' : ''}`}
        role="dialog"
        aria-label="Event details"
      >
        <div className="cal-detail__header">
          <h2 className="cal-detail__title">{selected?.title ?? ''}</h2>
          <Button
            fillMode="flat"
            svgIcon={xIcon}
            className="cal-detail__close"
            onClick={() => setSelected(null)}
            aria-label="Close event details"
            title="Close"
          />
        </div>
        <div className="cal-detail__body">
          {selected && (
            <>
              <div className="cal-detail__date">{formatEventWhen(selected)}</div>
              <div className="cal-detail__section-label">Description</div>
              <div className="cal-detail__desc">
                {selected.description
                  ? selected.description.split('\n\n').map((para, i) => <p key={i}>{para}</p>)
                  : <p className="cal-detail__empty">No description.</p>}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Add to Calendar dialog (type chooser → per-type form) */}
      {createOpen && (
        <Dialog title={dialogTitle} onClose={attemptClose} width={520} className="cal-add-dialog">
          {eventType === '' && (
            <div className="cal-add-chooser">
              <DropDownList
                data={EVENT_TYPES}
                defaultItem={TYPE_PLACEHOLDER}
                value={null}
                fillMode="outline"
                size="medium"
                style={{ width: '100%' }}
                onChange={(e: DropDownListChangeEvent) => {
                  const v = e.value as string;
                  setEventType(v === TYPE_PLACEHOLDER ? '' : v);
                }}
                aria-label="Event type"
              />
            </div>
          )}

          {eventType === 'Time Off Territory' && (
            <div className="cal-form">
              <label className="cal-form__field">
                <span className="cal-form__label">Reason *</span>
                <DropDownList
                  data={TIMEOFF_REASONS}
                  defaultItem={REASON_PLACEHOLDER}
                  value={toReason === '' ? null : toReason}
                  fillMode="outline"
                  size="medium"
                  onChange={(e: DropDownListChangeEvent) => {
                    const v = e.value as string;
                    setToReason(v === REASON_PLACEHOLDER ? '' : v);
                  }}
                />
              </label>

              <label className="cal-form__field">
                <span className="cal-form__label">Start Date *</span>
                <DatePicker
                  value={toStart}
                  fillMode="outline"
                  size="medium"
                  onChange={(e: DatePickerChangeEvent) => setToStart(e.value)}
                />
              </label>

              <label className="cal-form__field">
                <span className="cal-form__label">End Date *</span>
                <DatePicker
                  value={toEnd}
                  fillMode="outline"
                  size="medium"
                  min={toStart ?? undefined}
                  onChange={(e: DatePickerChangeEvent) => setToEnd(e.value)}
                />
              </label>

              <label className="cal-form__field">
                <span className="cal-form__label">Note</span>
                <TextBox
                  value={toNote}
                  fillMode="outline"
                  size="medium"
                  onChange={(e: TextBoxChangeEvent) => setToNote(String(e.value ?? ''))}
                />
              </label>

              <div className="cal-form__field">
                <span className="cal-form__label">Half Day</span>
                <Checkbox
                  size="medium"
                  value={toHalfDay}
                  onChange={(e) => setToHalfDay(Boolean(e.value))}
                  aria-label="Half day"
                />
              </div>
            </div>
          )}

          {(eventType === 'Interaction' || eventType === 'Conference Interaction') && (
            <div className="cal-placeholder">
              The <strong>{eventType}</strong> form is coming soon. Mock pending from the design team.
            </div>
          )}

          {eventType !== '' && (
            <DialogActionsBar layout="end">
              <span className="cal-required">* Required Field</span>
              <Button
                themeColor="primary"
                size="medium"
                disabled={eventType === 'Time Off Territory' ? !canSaveTimeOff : true}
                onClick={handleSave}
              >
                Save
              </Button>
              <Button fillMode="outline" themeColor="primary" size="medium" onClick={attemptClose}>
                Cancel
              </Button>
            </DialogActionsBar>
          )}
        </Dialog>
      )}

      {/* Cancel confirmation */}
      {confirmCancel && (
        <Dialog title="Discard changes?" onClose={() => setConfirmCancel(false)} width={420} className="cal-add-dialog">
          <p className="cal-confirm-text">Are you sure you want to cancel and lose your changes?</p>
          <DialogActionsBar layout="end">
            <Button themeColor="primary" size="medium" onClick={() => setConfirmCancel(false)}>
              No
            </Button>
            <Button fillMode="outline" themeColor="primary" size="medium" onClick={closeCreate}>
              Yes
            </Button>
          </DialogActionsBar>
        </Dialog>
      )}
    </div>
  );
}
