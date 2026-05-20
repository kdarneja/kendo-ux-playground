import { useEffect, useRef, useState } from 'react';
import { Window, type WindowActionsEvent } from '@progress/kendo-react-dialogs';
import { Button } from '@progress/kendo-react-buttons';
import { Map as KendoMap, MapLayers, MapTileLayer } from '@progress/kendo-react-map';
import { Grid, GridColumn } from '@progress/kendo-react-grid';

type Stage = 'DEFAULT' | 'MINIMIZED' | 'FULLSCREEN';

type WinState = {
  stage: Stage;
  open: boolean;
  left: number;
  top: number;
  width: number;
  height: number;
};

type MoveEvent = { left: number; top: number };

const TITLEBAR_HEIGHT = 44;
const CHIP_WIDTH = 220;
const DOCK_MARGIN = 16;
const CHIP_GAP = 8;
const MIN_HEIGHT = 200;

const initialState = (open: boolean): WinState => ({
  stage: 'MINIMIZED',
  open,
  left: DOCK_MARGIN,
  top: 0,
  width: CHIP_WIDTH,
  height: TITLEBAR_HEIGHT,
});

// Kendo Window has a bug where `top: 0` / `left: 0` are silently ignored
// (`this.props.top || this.state.top` treats 0 as falsy). Use 1 instead.
const ZERO_DODGE = 1;

// 1. Corner chip docked at bottom-left of the map container.
function dockPosition(slot: number, rect: DOMRect) {
  return {
    left: DOCK_MARGIN + slot * (CHIP_WIDTH + CHIP_GAP),
    top: Math.max(0, Math.round(rect.height) - TITLEBAR_HEIGHT - DOCK_MARGIN),
    width: CHIP_WIDTH,
    height: TITLEBAR_HEIGHT,
  };
}

// 2. Half height, full width, docked to the bottom of the page (viewport bottom).
function halfPosition(rect: DOMRect, viewportH: number) {
  const available = Math.max(MIN_HEIGHT * 2, viewportH - rect.top);
  const half = Math.round(available / 2);
  return {
    left: ZERO_DODGE,
    top: Math.round(available - half),
    width: Math.round(rect.width),
    height: half,
  };
}

// 3. Full coverage — top of map area through to the viewport bottom.
function fullPosition(rect: DOMRect, viewportH: number) {
  return {
    left: ZERO_DODGE,
    top: ZERO_DODGE,
    width: Math.round(rect.width),
    height: Math.max(MIN_HEIGHT, Math.round(viewportH - rect.top)),
  };
}

function positionForStage(
  stage: Stage,
  slot: number,
  rect: DOMRect,
  viewportH: number,
) {
  if (stage === 'MINIMIZED') return dockPosition(slot, rect);
  if (stage === 'FULLSCREEN') return fullPosition(rect, viewportH);
  return halfPosition(rect, viewportH);
}

const ZIP_DATA = [
  { zip: '30122', terrId: 'T021', terrName: 'Marietta, GA', index: 17, estr_writer: 7, mkt_writer: 7, estr_c12m: '12,167', mkt_C12m: '27,905', stCity: 'Lithia Springs, GA', zipOut: '30122' },
  { zip: '30157', terrId: 'T021', terrName: 'Marietta, GA', index: 15, estr_writer: 7, mkt_writer: 8, estr_c12m: '12,971', mkt_C12m: '25,878', stCity: 'Dallas, GA', zipOut: '30157' },
  { zip: '30117', terrId: 'T021', terrName: 'Marietta, GA', index: 11, estr_writer: 13, mkt_writer: 13, estr_c12m: '7,637', mkt_C12m: '18,184', stCity: 'Carrollton, GA', zipOut: '30117' },
  { zip: '30135', terrId: 'T021', terrName: 'Marietta, GA', index: 14, estr_writer: 9, mkt_writer: 11, estr_c12m: '9,432', mkt_C12m: '22,118', stCity: 'Douglasville, GA', zipOut: '30135' },
  { zip: '30144', terrId: 'T002', terrName: 'Atlanta S, GA', index: 22, estr_writer: 18, mkt_writer: 20, estr_c12m: '16,840', mkt_C12m: '38,210', stCity: 'Kennesaw, GA', zipOut: '30144' },
  { zip: '30152', terrId: 'T002', terrName: 'Atlanta S, GA', index: 19, estr_writer: 14, mkt_writer: 15, estr_c12m: '13,205', mkt_C12m: '31,492', stCity: 'Kennesaw, GA', zipOut: '30152' },
  { zip: '30060', terrId: 'T002', terrName: 'Atlanta S, GA', index: 26, estr_writer: 21, mkt_writer: 23, estr_c12m: '18,772', mkt_C12m: '43,055', stCity: 'Marietta, GA', zipOut: '30060' },
  { zip: '30068', terrId: 'T002', terrName: 'Atlanta S, GA', index: 31, estr_writer: 26, mkt_writer: 28, estr_c12m: '22,308', mkt_C12m: '51,640', stCity: 'Marietta, GA', zipOut: '30068' },
];

const HCP_DATA = [
  { id: 124578, fname: 'SURENDER', lname: 'KUMAR', decMkt: 5, mkt_roll12: 5990, ESTR_roll12: 2132, MENA_roll12: 1539, PROF_roll12: 2319, Address1: '3327 HWY', City: 'DOUGLASVILLE', State: 'GA', zip: '30135', NPI: '1912077603' },
  { id: 103931, fname: 'AMY', lname: 'DODSON', decMkt: 5, mkt_roll12: 5747, ESTR_roll12: 1809, MENA_roll12: 732, PROF_roll12: 3206, Address1: '150 HENRY BURSON AVE', City: 'CARROLLTON', State: 'GA', zip: '30117', NPI: '1255472486' },
  { id: 125461, fname: 'SHANNON', lname: 'COUVREUR', decMkt: 4, mkt_roll12: 4102, ESTR_roll12: 2550, MENA_roll12: 175, PROF_roll12: 1377, Address1: '156 CLINIC AVE', City: 'CARROLLTON', State: 'GA', zip: '30117', NPI: '1932308707' },
  { id: 118273, fname: 'JESSICA', lname: 'WEBSTER', decMkt: 4, mkt_roll12: 3902, ESTR_roll12: 1980, MENA_roll12: 410, PROF_roll12: 1512, Address1: '4421 RIDGEWAY DR', City: 'DALLAS', State: 'GA', zip: '30157', NPI: '1689143725' },
  { id: 127015, fname: 'MARCUS', lname: 'WHITLOCK', decMkt: 3, mkt_roll12: 3201, ESTR_roll12: 1402, MENA_roll12: 305, PROF_roll12: 1494, Address1: '811 OAK CHASE', City: 'LITHIA SPRINGS', State: 'GA', zip: '30122', NPI: '1452831988' },
  { id: 109834, fname: 'PRIYA', lname: 'NARAYAN', decMkt: 4, mkt_roll12: 4456, ESTR_roll12: 2241, MENA_roll12: 558, PROF_roll12: 1657, Address1: '220 SUMMER CREEK', City: 'KENNESAW', State: 'GA', zip: '30144', NPI: '1773298401' },
  { id: 112486, fname: 'DEREK', lname: 'ANSARI', decMkt: 3, mkt_roll12: 3010, ESTR_roll12: 1517, MENA_roll12: 244, PROF_roll12: 1249, Address1: '79 PEACH ORCHARD', City: 'MARIETTA', State: 'GA', zip: '30068', NPI: '1604572019' },
];

export default function StackedWindows() {
  const mapWrapperRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<KendoMap | null>(null);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const [viewportH, setViewportH] = useState<number>(
    typeof window !== 'undefined' ? window.innerHeight : 900,
  );
  const [zip, setZip] = useState<WinState>(initialState(true));
  const [hcp, setHcp] = useState<WinState>(initialState(false));

  useEffect(() => {
    const el = mapWrapperRef.current;
    if (!el) return;
    const update = () => {
      setRect(el.getBoundingClientRect());
      setViewportH(window.innerHeight);
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    window.addEventListener('resize', update);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', update);
    };
  }, []);

  // Kendo Map sometimes misses the initial measurement in flex layouts.
  // Force it to re-measure whenever the tracked container rect changes.
  useEffect(() => {
    if (rect) mapInstanceRef.current?.resize();
  }, [rect]);

  // Re-snap minimized chips to their dock when the map size or slot order changes.
  useEffect(() => {
    if (!rect) return;
    setZip((s) => (s.stage === 'MINIMIZED' ? { ...s, ...dockPosition(0, rect) } : s));
    setHcp((s) =>
      s.stage === 'MINIMIZED'
        ? { ...s, ...dockPosition(zip.open ? 1 : 0, rect) }
        : s,
    );
  }, [rect, zip.open]);

  // Re-snap non-minimized windows on viewport resize.
  useEffect(() => {
    if (!rect) return;
    setZip((s) =>
      s.stage !== 'MINIMIZED'
        ? { ...s, ...positionForStage(s.stage, 0, rect, viewportH) }
        : s,
    );
    setHcp((s) =>
      s.stage !== 'MINIMIZED'
        ? { ...s, ...positionForStage(s.stage, zip.open ? 1 : 0, rect, viewportH) }
        : s,
    );
  }, [rect, viewportH, zip.open]);

  const onStage = (
    setter: React.Dispatch<React.SetStateAction<WinState>>,
    slot: () => number,
  ) => (e: WindowActionsEvent) => {
    if (!e.state) return;
    const next = e.state as Stage;
    setter((s) => {
      if (!rect) return { ...s, stage: next };
      return { ...s, stage: next, ...positionForStage(next, slot(), rect, viewportH) };
    });
  };

  const onMove = (setter: React.Dispatch<React.SetStateAction<WinState>>) =>
    (e: MoveEvent) => {
      setter((s) => ({ ...s, left: e.left, top: e.top }));
    };

  const toggleHcp = () => {
    if (!rect) return;
    setHcp((s) => {
      if (s.open) return { ...s, open: false };
      const slot = zip.open ? 1 : 0;
      return { ...s, open: true, stage: 'MINIMIZED', ...dockPosition(slot, rect) };
    });
  };

  const hcpSlot = () => (zip.open ? 1 : 0);

  return (
    <div className="beghou-page beghou-page--fill">
      <div className="beghou-toolbar">
        <Button
          themeColor="primary"
          fillMode={hcp.open ? 'solid' : 'outline'}
          onClick={toggleHcp}
        >
          {hcp.open ? 'Hide HCP' : 'Show HCP'}
        </Button>
      </div>

      <div className="map-container" ref={mapWrapperRef}>
        {rect && (
          <KendoMap
            ref={(m) => {
              mapInstanceRef.current = m;
            }}
            center={[30.2685, -97.7535]}
            zoom={14}
            // Kendo Map's internal .k-map defaults to 600px height when given
            // style:'100%' — the percentage doesn't propagate. Pass explicit
            // pixel dimensions from the tracked container rect so it fills.
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

        {rect && zip.open && (
          <Window
            title="Zip ID"
            appendTo={mapWrapperRef.current ?? undefined}
            stage={zip.stage}
            left={zip.left}
            top={zip.top}
            width={zip.width}
            height={zip.height}
            modal={false}
            draggable
            resizable={false}
            onStageChange={onStage(setZip, () => 0)}
            onMove={onMove(setZip)}
            onClose={() => setZip((s) => ({ ...s, open: false }))}
          >
            <Grid data={ZIP_DATA} style={{ height: '100%' }}>
              <GridColumn field="zip" title="Zip" width="100px" />
              <GridColumn field="terrId" title="Terr ID" width="100px" />
              <GridColumn field="terrName" title="Terr Name" width="160px" />
              <GridColumn field="index" title="Index" width="90px" />
              <GridColumn field="estr_writer" title="estr_writer" width="120px" />
              <GridColumn field="mkt_writer" title="mkt_writer" width="120px" />
              <GridColumn field="estr_c12m" title="estr_c12m" width="120px" />
              <GridColumn field="mkt_C12m" title="mkt_C12m" width="120px" />
              <GridColumn field="stCity" title="stCity" width="160px" />
              <GridColumn field="zipOut" title="Zip" width="100px" />
            </Grid>
          </Window>
        )}

        {rect && hcp.open && (
          <Window
            title="HCP"
            appendTo={mapWrapperRef.current ?? undefined}
            stage={hcp.stage}
            left={hcp.left}
            top={hcp.top}
            width={hcp.width}
            height={hcp.height}
            modal={false}
            draggable
            resizable={false}
            onStageChange={onStage(setHcp, hcpSlot)}
            onMove={onMove(setHcp)}
            onClose={() => setHcp((s) => ({ ...s, open: false }))}
          >
            <Grid data={HCP_DATA} style={{ height: '100%' }}>
              <GridColumn field="id" title="id" width="100px" />
              <GridColumn field="fname" title="Fname" width="110px" />
              <GridColumn field="lname" title="Lname" width="120px" />
              <GridColumn field="decMkt" title="decMkt" width="90px" />
              <GridColumn field="mkt_roll12" title="mkt_roll12" width="120px" />
              <GridColumn field="ESTR_roll12" title="ESTR_roll12" width="120px" />
              <GridColumn field="MENA_roll12" title="MENA_roll12" width="130px" />
              <GridColumn field="PROF_roll12" title="PROF_roll12" width="120px" />
              <GridColumn field="Address1" title="Address1" width="220px" />
              <GridColumn field="City" title="City" width="140px" />
              <GridColumn field="State" title="State" width="80px" />
              <GridColumn field="zip" title="zip" width="90px" />
              <GridColumn field="NPI" title="NPI" width="130px" />
            </Grid>
          </Window>
        )}
      </div>
    </div>
  );
}
