import { useMemo, useState } from 'react';
import { Dialog, DialogActionsBar } from '@progress/kendo-react-dialogs';
import { Button } from '@progress/kendo-react-buttons';
import { TextBox, type TextBoxChangeEvent } from '@progress/kendo-react-inputs';
import { DropDownList, type DropDownListChangeEvent } from '@progress/kendo-react-dropdowns';
import { SvgIcon } from '@progress/kendo-react-common';
import { chevronUpIcon, chevronDownIcon, xIcon } from '@progress/kendo-svg-icons';

/**
 * Edit Product Roles — spec prototype for the dialog redesign.
 * See "PRD - Edit Product Roles Redesign.md".
 *
 * One dialog, no secondary modal. Each assigned role manages its single
 * optional property inline via expand/collapse.
 *
 * Data model (per PRD): a role assignment = role name + AT MOST ONE property
 * ({ key, value }, both required). NOTE: the static mock shows "2 properties"
 * on the collapsed User / NonProductionUser rows; that contradicts the PRD's
 * one-property model (which the PRD says was confirmed with dev), so the
 * collapsed summary here follows the PRD — "Key · Value" or "No property set".
 */

// Full catalog of assignable roles (out of scope to change — see PRD).
const ALL_ROLES = ['Configurator', 'Administrator', 'User', 'NonProductionUser'];

const ADD_PROMPT = '+ Add role…';

type Property = { key: string; value: string };

type RoleAssignment = {
  role: string;
  property: Property | null;
  expanded: boolean;
  // In-progress values for the inline "set property" form (only meaningful
  // while a property-less row is expanded). Discarded on Cancel.
  draftKey: string;
  draftValue: string;
};

const newAssignment = (role: string, over: Partial<RoleAssignment> = {}): RoleAssignment => ({
  role,
  property: null,
  expanded: false,
  draftKey: '',
  draftValue: '',
  ...over,
});

// Start with no roles assigned so the prototype shows the complete workflow:
// add a role from the dropdown → expand → set its property.
const SEED: RoleAssignment[] = [];

function summaryOf(a: RoleAssignment): string {
  return a.property ? `${a.property.key} · ${a.property.value}` : 'No property set';
}

export default function EditProductRoles() {
  const [open, setOpen] = useState(false);
  const [user] = useState('pranitha.kamsani@beghouconsulting.com');
  const [roles, setRoles] = useState<RoleAssignment[]>(SEED);

  const availableRoles = useMemo(
    () => ALL_ROLES.filter((r) => !roles.some((a) => a.role === r)),
    [roles],
  );

  function patch(role: string, next: Partial<RoleAssignment>) {
    setRoles((prev) => prev.map((a) => (a.role === role ? { ...a, ...next } : a)));
  }

  function addRole(role: string) {
    // New rows arrive collapsed with no property set.
    setRoles((prev) => [...prev, newAssignment(role)]);
  }

  function removeRole(role: string) {
    // PRD open question: confirm-before-remove when a property is set. Left as
    // immediate removal for now (flagged as an open question to eng).
    setRoles((prev) => prev.filter((a) => a.role !== role));
  }

  function toggle(role: string) {
    setRoles((prev) => prev.map((a) => (a.role === role ? { ...a, expanded: !a.expanded } : a)));
  }

  function saveProperty(a: RoleAssignment) {
    const key = a.draftKey.trim();
    const value = a.draftValue.trim();
    if (!key || !value) return;
    patch(a.role, { property: { key, value }, draftKey: '', draftValue: '' });
  }

  function cancelForm(role: string) {
    // Cancel discards the in-progress key/value and closes the form.
    patch(role, { draftKey: '', draftValue: '', expanded: false });
  }

  function clearProperty(role: string) {
    // Delete (×) clears the property back to the unset state; row stays open
    // so the empty inline form shows immediately.
    patch(role, { property: null, draftKey: '', draftValue: '' });
  }

  return (
    <div className="beghou-page">
      <Button themeColor="primary" onClick={() => setOpen(true)}>
        Edit product roles
      </Button>

      {open && (
        <Dialog
          title="Edit Product Roles"
          onClose={() => setOpen(false)}
          width={640}
          className="mv-dialog epr-dialog"
        >
          <div className="epr-body">
            {/* Users — unchanged / out of scope. */}
            <section className="epr-block">
              <div className="epr-label">Users</div>
              <TextBox className="epr-users-input" fillMode="outline" value={user} readOnly />
            </section>

            {/* Product Roles */}
            <section className="epr-block">
              <div className="epr-roles-head">
                <div className="epr-label">Product Roles</div>
                <DropDownList
                  className="epr-add-role"
                  data={availableRoles}
                  defaultItem={ADD_PROMPT}
                  value={ADD_PROMPT}
                  disabled={availableRoles.length === 0}
                  onChange={(e: DropDownListChangeEvent) => {
                    const r = e.value as string;
                    if (r && r !== ADD_PROMPT) addRole(r);
                  }}
                />
              </div>
              <p className="epr-help">
                A user can hold any combination of the roles below — add or remove roles here, then
                expand a row to set its properties.
              </p>

              <div className="epr-roles-list">
                {roles.length === 0 && (
                  <div className="epr-empty">No roles assigned yet. Use “Add role” to assign one.</div>
                )}
                {roles.map((a) => {
                  const hasProp = a.property !== null;
                  const canSave = a.draftKey.trim().length > 0 && a.draftValue.trim().length > 0;
                  return (
                    <div key={a.role} className={`epr-role${a.expanded ? ' epr-role--open' : ''}`}>
                      <div
                        className="epr-role-head"
                        role="button"
                        tabIndex={0}
                        onClick={() => toggle(a.role)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            toggle(a.role);
                          }
                        }}
                      >
                        <span className="epr-role-name">{a.role}</span>
                        <span className="epr-role-head-right">
                          <span className={`epr-role-summary${hasProp ? ' epr-role-summary--set' : ''}`}>
                            {summaryOf(a)}
                          </span>
                          <SvgIcon
                            className="epr-chevron"
                            icon={a.expanded ? chevronUpIcon : chevronDownIcon}
                          />
                          <Button
                            fillMode="flat"
                            className="epr-icon-btn"
                            svgIcon={xIcon}
                            title={`Remove ${a.role}`}
                            aria-label={`Remove ${a.role}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              removeRole(a.role);
                            }}
                          />
                        </span>
                      </div>

                      {a.expanded && !hasProp && (
                        <div className="epr-role-body">
                          <div className="epr-form-card">
                            <div className="epr-fields">
                              <div className="epr-field">
                                <label className="epr-field-label">
                                  KEY <span className="epr-req">*</span>
                                </label>
                                <TextBox
                                  className="epr-input"
                                  fillMode="outline"
                                  placeholder="e.g. Arc_Territory"
                                  value={a.draftKey}
                                  onChange={(e: TextBoxChangeEvent) =>
                                    patch(a.role, { draftKey: String(e.value ?? '') })
                                  }
                                />
                              </div>
                              <div className="epr-field">
                                <label className="epr-field-label">
                                  VALUE <span className="epr-req">*</span>
                                </label>
                                <TextBox
                                  className="epr-input"
                                  fillMode="outline"
                                  placeholder="e.g. 2, 82"
                                  value={a.draftValue}
                                  onChange={(e: TextBoxChangeEvent) =>
                                    patch(a.role, { draftValue: String(e.value ?? '') })
                                  }
                                />
                              </div>
                            </div>
                            <div className="epr-form-actions">
                              <Button fillMode="flat" onClick={() => cancelForm(a.role)}>
                                Cancel
                              </Button>
                              <Button
                                themeColor="primary"
                                disabled={!canSave}
                                onClick={() => saveProperty(a)}
                              >
                                Save property
                              </Button>
                            </div>
                          </div>
                          <p className="epr-form-note">
                            One property per role. Cancel discards this without saving. Save stays
                            disabled until both Key and Value are filled.
                          </p>
                        </div>
                      )}

                      {a.expanded && hasProp && a.property && (
                        <div className="epr-role-body">
                          <div className="epr-fields">
                            <div className="epr-field">
                              <label className="epr-field-label">KEY</label>
                              <TextBox
                                className="epr-input"
                                fillMode="outline"
                                value={a.property.key}
                                onChange={(e: TextBoxChangeEvent) =>
                                  patch(a.role, {
                                    property: { key: String(e.value ?? ''), value: a.property!.value },
                                  })
                                }
                              />
                            </div>
                            <div className="epr-field">
                              <label className="epr-field-label">VALUE</label>
                              <div className="epr-value-row">
                                <TextBox
                                  className="epr-input"
                                  fillMode="outline"
                                  value={a.property.value}
                                  onChange={(e: TextBoxChangeEvent) =>
                                    patch(a.role, {
                                      property: { key: a.property!.key, value: String(e.value ?? '') },
                                    })
                                  }
                                />
                                <Button
                                  fillMode="flat"
                                  className="epr-icon-btn"
                                  svgIcon={xIcon}
                                  title="Clear property"
                                  aria-label="Clear property"
                                  onClick={() => clearProperty(a.role)}
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          </div>

          <DialogActionsBar layout="end">
            <Button fillMode="outline" themeColor="primary" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button themeColor="primary" onClick={() => setOpen(false)}>
              Update
            </Button>
          </DialogActionsBar>
        </Dialog>
      )}
    </div>
  );
}
