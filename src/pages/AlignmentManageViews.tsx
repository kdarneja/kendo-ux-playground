import { useEffect, useRef, useState } from 'react';
import { Dialog, DialogActionsBar } from '@progress/kendo-react-dialogs';
import { Button, Chip } from '@progress/kendo-react-buttons';
import { TextBox, type TextBoxChangeEvent } from '@progress/kendo-react-inputs';
import { NotificationGroup, Notification } from '@progress/kendo-react-notification';
import { pencilIcon, trashIcon, checkIcon, folderOpenIcon } from '@progress/kendo-svg-icons';

/**
 * Manage Views — consolidated dialog for the map-based territory-alignment tool.
 * A "view" is a saved snapshot of the user's work-in-progress map state.
 * One dialog does Save (always new), Load, Rename (inline), Delete (inline confirm).
 * See manage-view-prd.md.
 */

type View = {
  id: string;
  name: string;
  saved: string; // display date, e.g. "May 28, 2026"
  createdAt: number;
};

type Toast = { id: number; text: string };

const STORAGE_KEY = 'beghou.alignment.manage-views';

const SEED_VIEWS: View[] = [
  { id: 'v1', name: 'Q2 East realignment', saved: 'Apr 3, 2026', createdAt: 1743638400000 },
  { id: 'v2', name: 'DC', saved: 'Mar 28, 2026', createdAt: 1743120000000 },
  { id: 'v3', name: 'Baseline FY25', saved: 'Jan 6, 2026', createdAt: 1736121600000 },
  { id: 'v4', name: 'Cardio team draft', saved: 'Mar 19, 2026', createdAt: 1742342400000 },
  { id: 'v5', name: 'Midwest pre-launch', saved: 'Feb 11, 2026', createdAt: 1739232000000 },
  { id: 'v6', name: 'Specialty overlay', saved: 'Feb 2, 2026', createdAt: 1738454400000 },
  { id: 'v7', name: 'National rollup', saved: 'Jan 22, 2026', createdAt: 1737504000000 },
];

function todayDisplay(): string {
  return new Date().toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function loadViews(): View[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as View[];
  } catch {
    // ignore corrupt storage; fall back to seed
  }
  return SEED_VIEWS;
}

export default function AlignmentManageViews() {
  const [open, setOpen] = useState(true);
  const [views, setViews] = useState<View[]>(loadViews);
  const [draftName, setDraftName] = useState('');
  const [loadedId, setLoadedId] = useState<string | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameDraft, setRenameDraft] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toastSeq = useRef(0);

  // Persist views to localStorage (prototype stand-in for the real API).
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(views));
    } catch {
      // storage may be unavailable; non-fatal in the prototype
    }
  }, [views]);

  function pushToast(text: string) {
    const id = ++toastSeq.current;
    setToasts((t) => [...t, { id, text }]);
    setTimeout(() => {
      setToasts((t) => t.filter((x) => x.id !== id));
    }, 2000);
  }

  const trimmedDraft = draftName.trim();
  const canSave = trimmedDraft.length > 0;

  function handleSave() {
    if (!canSave) return;
    const view: View = {
      id: `v${Date.now()}`,
      name: trimmedDraft,
      saved: todayDisplay(),
      createdAt: Date.now(),
    };
    setViews((prev) => [view, ...prev]);
    setLoadedId(view.id);
    setDraftName('');
    pushToast(`Saved "${view.name}"`);
  }

  function handleLoad(view: View) {
    setLoadedId(view.id);
    pushToast(`Loaded "${view.name}"`);
    // Loading applies the view to the map, so the dialog gets out of the way.
    setOpen(false);
  }

  function startRename(view: View) {
    setConfirmDeleteId(null);
    setRenamingId(view.id);
    setRenameDraft(view.name);
  }

  function commitRename(view: View) {
    const next = renameDraft.trim();
    // Empty rename is ignored — keep the old name.
    if (next.length > 0 && next !== view.name) {
      setViews((prev) => prev.map((v) => (v.id === view.id ? { ...v, name: next } : v)));
    }
    setRenamingId(null);
    setRenameDraft('');
  }

  function cancelRename() {
    setRenamingId(null);
    setRenameDraft('');
  }

  function confirmDelete(view: View) {
    setViews((prev) => prev.filter((v) => v.id !== view.id));
    if (loadedId === view.id) setLoadedId(null);
    setConfirmDeleteId(null);
    pushToast(`Deleted "${view.name}"`);
  }

  return (
    <div className="beghou-page">
      <Button themeColor="primary" onClick={() => setOpen(true)}>
        Manage views
      </Button>

      {open && (
        <Dialog
          title="Manage views"
          onClose={() => setOpen(false)}
          width={620}
          className="mv-dialog"
        >
          {/* Save current view */}
          <div className="mv-savebar">
            <div className="mv-section-title">Save current view</div>
            <div className="mv-save-row">
              <TextBox
                className="mv-name-input"
                fillMode="outline"
                size="medium"
                placeholder="Name this view…"
                value={draftName}
                onChange={(e: TextBoxChangeEvent) => setDraftName(String(e.value ?? ''))}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSave();
                }}
                aria-label="Name this view"
              />
              <Button themeColor="primary" disabled={!canSave} onClick={handleSave}>
                Save
              </Button>
            </div>
          </div>

          {/* Saved views list */}
          <div className="mv-list-header">Saved views ({views.length})</div>

          {views.length === 0 ? (
            <div className="mv-empty">
              <div className="mv-empty-title">No saved views yet</div>
              <div className="mv-empty-sub">
                Save the current map state above to create your first view.
              </div>
            </div>
          ) : (
            <ul className="mv-list">
              {views.map((view) => {
                const isLoaded = loadedId === view.id;
                const isRenaming = renamingId === view.id;
                const isConfirming = confirmDeleteId === view.id;
                return (
                  <li key={view.id} className={`mv-row${isLoaded ? ' mv-row--loaded' : ''}`}>
                    <div className="mv-row-main">
                      {isRenaming ? (
                        <TextBox
                          className="mv-rename-input"
                          value={renameDraft}
                          autoFocus
                          onChange={(e: TextBoxChangeEvent) =>
                            setRenameDraft(String(e.value ?? ''))
                          }
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') commitRename(view);
                            if (e.key === 'Escape') cancelRename();
                          }}
                          onBlur={() => commitRename(view)}
                          aria-label={`Rename ${view.name}`}
                        />
                      ) : (
                        <button
                          type="button"
                          className="mv-name"
                          onClick={() => startRename(view)}
                          title="Click to rename"
                        >
                          {view.name}
                        </button>
                      )}
                      <div className="mv-saved">Saved {view.saved}</div>
                    </div>

                    {isLoaded && !isConfirming && (
                      <Chip
                        className="mv-loaded-chip"
                        themeColor="success"
                        fillMode="solid"
                        text="Loaded"
                        svgIcon={checkIcon}
                        removable={false}
                      />
                    )}

                    {isConfirming ? (
                      <div className="mv-confirm">
                        <span className="mv-confirm-label">Delete?</span>
                        <Button themeColor="error" onClick={() => confirmDelete(view)}>
                          Yes
                        </Button>
                        <Button fillMode="outline" onClick={() => setConfirmDeleteId(null)}>
                          No
                        </Button>
                      </div>
                    ) : (
                      <div className="mv-actions">
                        <Button
                          svgIcon={folderOpenIcon}
                          onClick={() => handleLoad(view)}
                          aria-label={`Load ${view.name}`}
                          title="Load view"
                        />
                        <Button
                          className="mv-hover-action"
                          fillMode="flat"
                          svgIcon={pencilIcon}
                          onClick={() => startRename(view)}
                          aria-label={`Rename ${view.name}`}
                          title="Rename"
                        />
                        <Button
                          className="mv-hover-action"
                          fillMode="flat"
                          svgIcon={trashIcon}
                          onClick={() => {
                            setRenamingId(null);
                            setConfirmDeleteId(view.id);
                          }}
                          aria-label={`Delete ${view.name}`}
                          title="Delete"
                        />
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}

          <DialogActionsBar layout="end">
            <Button fillMode="outline" themeColor="primary" onClick={() => setOpen(false)}>
              Close
            </Button>
          </DialogActionsBar>
        </Dialog>
      )}

      <NotificationGroup className="mv-toast-group">
        {toasts.map((t) => (
          <Notification
            key={t.id}
            type={{ style: 'success', icon: true }}
            closable={false}
          >
            <span>{t.text}</span>
          </Notification>
        ))}
      </NotificationGroup>
    </div>
  );
}
