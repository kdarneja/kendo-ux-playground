import { useEffect, useRef, useState } from 'react';
import { Map as KendoMap, MapLayers, MapTileLayer } from '@progress/kendo-react-map';
import {
  Toolbar,
  ToolbarSeparator,
  Button,
  DropDownButton,
} from '@progress/kendo-react-buttons';
import { DropDownList } from '@progress/kendo-react-dropdowns';
import { Checkbox } from '@progress/kendo-react-inputs';
import { Popup } from '@progress/kendo-react-popup';
import { SvgIcon } from '@progress/kendo-react-common';
import {
  shapesIcon,
  handIcon,
  zoomInIcon,
  zoomOutIcon,
  selectBoxIcon,
  circleIcon,
  commentIcon,
  handleDragDotsIcon,
  mapMarkerTargetIcon,
  arrowsMoveIcon,
  mapMarkerIcon,
  tableIcon,
  gearIcon,
  undoIcon,
  pencilIcon,
  eraserIcon,
  caretAltDownIcon,
} from '@progress/kendo-svg-icons';
import type { SVGIcon } from '@progress/kendo-svg-icons';

const ZIP_OPTIONS = ['Zip', 'HSA', 'Territory', 'County'];
const TERRITORY_OPTIONS = [
  'T021 - Marietta, GA',
  'T002 - Atlanta S, GA',
  'T049 - Atlanta N, GA',
  'T100 - Greenville, SC',
];

type Tool = { key: string; label: string; icon: SVGIcon };

// Icon mapping is best-effort against the Kendo SVG icon set. Where Kendo
// doesn't ship an exact match (lasso, polygon) we use the closest visual
// approximation. Swap to inline SVG via the SvgIcon `icon` prop if a
// pixel-perfect glyph is needed later.
const TOOLS: Tool[] = [
  { key: 'pan', label: 'Pan', icon: handIcon },
  { key: 'zoomIn', label: 'Zoom in', icon: zoomInIcon },
  { key: 'zoomOut', label: 'Zoom out', icon: zoomOutIcon },
  { key: 'rect', label: 'Rectangle select', icon: selectBoxIcon },
  { key: 'circle', label: 'Circle select', icon: circleIcon },
  { key: 'lasso', label: 'Lasso select', icon: commentIcon },
  { key: 'polygon', label: 'Polygon select', icon: shapesIcon },
  { key: 'multi', label: 'Multi-point', icon: handleDragDotsIcon },
  { key: 'target', label: 'Target', icon: mapMarkerTargetIcon },
  { key: 'move', label: 'Move', icon: arrowsMoveIcon },
  { key: 'marker', label: 'Drop pin', icon: mapMarkerIcon },
];

const MORE_ITEMS = [
  { text: 'Export view' },
  { text: 'Print' },
  { text: 'Share link' },
  { text: 'Reset view' },
];

export default function MapToolbars() {
  const mapWrapperRef = useRef<HTMLDivElement | null>(null);
  const toolAnchorRef = useRef<HTMLSpanElement | null>(null);
  const popupRef = useRef<HTMLDivElement | null>(null);

  const [rect, setRect] = useState<DOMRect | null>(null);
  const [popupOpen, setPopupOpen] = useState(false);
  const [activeTool, setActiveTool] = useState<string>('pan');

  useEffect(() => {
    const el = mapWrapperRef.current;
    if (!el) return;
    const update = () => setRect(el.getBoundingClientRect());
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    window.addEventListener('resize', update);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', update);
    };
  }, []);

  // Close the tool popup when the user clicks outside of it (or the anchor).
  useEffect(() => {
    if (!popupOpen) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      if (toolAnchorRef.current?.contains(target)) return;
      if (popupRef.current?.contains(target)) return;
      setPopupOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [popupOpen]);

  const activeToolDef = TOOLS.find((t) => t.key === activeTool) ?? TOOLS[0];

  return (
    <div className="beghou-page beghou-page--fill">
      <div className="map-container" ref={mapWrapperRef}>
        {rect && (
          <KendoMap
            center={[33.3, -83.5]}
            zoom={7}
            style={{ width: Math.round(rect.width), height: Math.round(rect.height) }}
          >
            <MapLayers>
              <MapTileLayer
                urlTemplate={(args) =>
                  `https://${args.subdomain}.tile.openstreetmap.org/${args.zoom}/${args.x}/${args.y}.png`
                }
                subdomains={['a', 'b', 'c']}
                attribution="&copy; OpenStreetMap contributors"
              />
            </MapLayers>
          </KendoMap>
        )}

        <div className="map-toolbar-overlay">
          <Toolbar>
            <Button svgIcon={shapesIcon} fillMode="flat" title="Layers" />

            <span ref={toolAnchorRef} className="map-toolbar__anchor">
              <Button
                fillMode="flat"
                onClick={() => setPopupOpen((o) => !o)}
                title={`Tool: ${activeToolDef.label}`}
              >
                <span className="map-toolbar__active-tool">
                  <SvgIcon icon={activeToolDef.icon} />
                  <SvgIcon icon={caretAltDownIcon} size="small" />
                </span>
              </Button>
            </span>

            <DropDownList
              data={ZIP_OPTIONS}
              defaultValue="Zip"
              size="medium"
              style={{ width: 130 }}
            />

            <Button svgIcon={tableIcon} fillMode="flat" title="Grid view" />

            <Checkbox label="Group by HSA" defaultChecked />

            <Button svgIcon={gearIcon} fillMode="flat" title="Settings" />

            <DropDownList
              data={TERRITORY_OPTIONS}
              defaultValue={TERRITORY_OPTIONS[0]}
              size="medium"
              style={{ width: 230 }}
            />

            <ToolbarSeparator />

            <Button svgIcon={arrowsMoveIcon} fillMode="flat" title="Swap" />
            <Button svgIcon={undoIcon} fillMode="flat" title="Undo" />
            <Button svgIcon={pencilIcon} fillMode="flat" title="Edit" />
            <Button svgIcon={eraserIcon} fillMode="flat" title="Erase" />

            <Checkbox label="Quick Align" />

            <DropDownButton text="More" fillMode="flat" items={MORE_ITEMS} />
          </Toolbar>
        </div>

        <Popup
          anchor={toolAnchorRef.current ?? undefined}
          show={popupOpen}
          popupClass="map-tool-popup"
          anchorAlign={{ horizontal: 'left', vertical: 'bottom' }}
          popupAlign={{ horizontal: 'left', vertical: 'top' }}
        >
          <div className="map-tool-stack" ref={popupRef}>
            {TOOLS.map((t) => (
              <Button
                key={t.key}
                svgIcon={t.icon}
                fillMode={activeTool === t.key ? 'solid' : 'flat'}
                themeColor={activeTool === t.key ? 'primary' : 'base'}
                title={t.label}
                onClick={() => {
                  setActiveTool(t.key);
                  setPopupOpen(false);
                }}
              />
            ))}
          </div>
        </Popup>
      </div>
    </div>
  );
}
