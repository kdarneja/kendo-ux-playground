import { useEffect, useMemo, useRef, useState } from 'react';
import { Window, type WindowActionsEvent } from '@progress/kendo-react-dialogs';
import { Checkbox, type CheckboxChangeEvent } from '@progress/kendo-react-inputs';
import { Map as KendoMap, MapLayers, MapTileLayer } from '@progress/kendo-react-map';
import { Grid, GridColumn } from '@progress/kendo-react-grid';

type Stage = 'DEFAULT' | 'MINIMIZED' | 'FULLSCREEN';
type WinKey = 'zip' | 'hcp' | 'acc';

type WinState = {
  stage: Stage;
  left: number;
  top: number;
  width: number;
  height: number;
};

type MoveEvent = { left: number; top: number };

const TITLEBAR_HEIGHT = 44;
const MIN_HEIGHT = 200;
const GUTTER = 5;

// Kendo Window has a bug where `top: 0` / `left: 0` are silently ignored
// (`this.props.top || this.state.top` treats 0 as falsy). Use 1 instead.
const ZERO_DODGE = 1;

function slotPosition(slotIdx: number, totalSlots: number, stage: Stage, rect: DOMRect) {
  const W = Math.round(rect.width);
  const H = Math.max(MIN_HEIGHT, Math.round(rect.height));
  const cellWidth = Math.max(2, Math.floor(W / totalSlots));
  const left = Math.max(ZERO_DODGE, slotIdx * cellWidth + GUTTER);
  const width = Math.max(2, cellWidth - 2 * GUTTER);

  // FULLSCREEN: Kendo overrides controlled width/height from appendTo, so it
  // covers the full parent regardless of what we return. We still emit a sane
  // default for any frame between renders.
  if (stage === 'FULLSCREEN') {
    return { left: ZERO_DODGE, top: ZERO_DODGE, width: W, height: H };
  }
  if (stage === 'MINIMIZED') {
    return {
      left,
      top: Math.max(ZERO_DODGE, H - TITLEBAR_HEIGHT),
      width,
      height: TITLEBAR_HEIGHT,
    };
  }
  // DEFAULT: bottom half of slot (grows up from the minimized chip).
  const halfH = Math.max(MIN_HEIGHT, Math.floor(H / 2));
  return { left, top: Math.max(ZERO_DODGE, H - halfH), width, height: halfH };
}

const NoButton = () => null;

const initialWin = (): WinState => ({
  stage: 'MINIMIZED',
  left: ZERO_DODGE,
  top: ZERO_DODGE,
  width: 200,
  height: TITLEBAR_HEIGHT,
});

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

const ACC_DATA = [
  { origTerr: 'T049', origName: 'Atlanta N, GA', newTerr: 'T021', newName: 'Marietta, GA',  id: 94837,  lname: 'ABUNYEWA', fname: 'AMMA',     spec: 'IM',    decMkt: 7,  mkt_roll12: 11033.413,  ESTR_roll12: 4612.333,  MENA_roll12: 2455.5 },
  { origTerr: 'T002', origName: 'Atlanta S, GA', newTerr: 'T049', newName: 'Atlanta S, GA', id: 102480, lname: 'HADLEY',   fname: 'PHILLIP',  spec: 'OBGYN', decMkt: 4,  mkt_roll12: 4986.598,   ESTR_roll12: 2092.503,  MENA_roll12: 1759.7 },
  { origTerr: 'T002', origName: 'Atlanta S, GA', newTerr: 'T049', newName: 'Atlanta S, GA', id: 115549, lname: 'CALLAWAY', fname: 'JUAQUITA', spec: 'OBGYN', decMkt: 4,  mkt_roll12: 4639.307,   ESTR_roll12: 2766.083,  MENA_roll12: 1115.3 },
  { origTerr: 'T002', origName: 'Atlanta S, GA', newTerr: 'T049', newName: 'Atlanta S, GA', id: 120151, lname: 'GAMBLE',   fname: 'KENDRA',   spec: 'OBGYN', decMkt: 10, mkt_roll12: 141963.436, ESTR_roll12: 32578.163, MENA_roll12: 42433.3 },
  { origTerr: 'T002', origName: 'Atlanta S, GA', newTerr: 'T049', newName: 'Atlanta S, GA', id: 120151, lname: 'ANYAKWO',  fname: 'GERTRUDE', spec: 'OBGYN', decMkt: 5,  mkt_roll12: 5838.772,   ESTR_roll12: 1752.775,  MENA_roll12: 1569.0 },
  { origTerr: 'T002', origName: 'Atlanta S, GA', newTerr: 'T049', newName: 'Atlanta S, GA', id: 124467, lname: 'GIBBS',    fname: 'LAURA',    spec: 'OBGYN', decMkt: 5,  mkt_roll12: 7751.609,   ESTR_roll12: 4273.612,  MENA_roll12: 2134.6 },
  { origTerr: 'T049', origName: 'Atlanta N, GA', newTerr: 'T021', newName: 'Marietta, GA',  id: 128902, lname: 'BANERJEE', fname: 'NITIN',    spec: 'IM',    decMkt: 6,  mkt_roll12: 8421.330,   ESTR_roll12: 3198.402,  MENA_roll12: 1872.4 },
];

export default function StackedWindows() {
  const mapWrapperRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<KendoMap | null>(null);
  const [rect, setRect] = useState<DOMRect | null>(null);

  const [showHcp, setShowHcp] = useState(false);
  const [showAcc, setShowAcc] = useState(false);

  const [zip, setZip] = useState<WinState>(initialWin);
  const [hcp, setHcp] = useState<WinState>(initialWin);
  const [acc, setAcc] = useState<WinState>(initialWin);

  const visibleSlots = useMemo<WinKey[]>(() => {
    const s: WinKey[] = ['zip'];
    if (showHcp) s.push('hcp');
    if (showAcc) s.push('acc');
    return s;
  }, [showHcp, showAcc]);

  const totalSlots = visibleSlots.length;
  const slotOf = (key: WinKey) => visibleSlots.indexOf(key);

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

  // Kendo Map sometimes misses the initial measurement in flex layouts.
  // Force it to re-measure whenever the tracked container rect changes.
  useEffect(() => {
    if (rect) mapInstanceRef.current?.resize();
  }, [rect]);

  // Re-snap visible windows whenever the rect or slot layout changes.
  useEffect(() => {
    if (!rect) return;
    const zipIdx = slotOf('zip');
    setZip((s) => ({ ...s, ...slotPosition(zipIdx, totalSlots, s.stage, rect) }));
    if (showHcp) {
      const hcpIdx = slotOf('hcp');
      setHcp((s) => ({ ...s, ...slotPosition(hcpIdx, totalSlots, s.stage, rect) }));
    }
    if (showAcc) {
      const accIdx = slotOf('acc');
      setAcc((s) => ({ ...s, ...slotPosition(accIdx, totalSlots, s.stage, rect) }));
    }
    // visibleSlots captures both checkbox states; rect captures size.
  }, [rect, visibleSlots, totalSlots, showHcp, showAcc]);

  const onStage = (
    setter: React.Dispatch<React.SetStateAction<WinState>>,
    key: WinKey,
  ) => (e: WindowActionsEvent) => {
    if (!e.state) return;
    const next = e.state as Stage;
    setter((s) => {
      if (!rect) return { ...s, stage: next };
      return { ...s, stage: next, ...slotPosition(slotOf(key), totalSlots, next, rect) };
    });
  };

  const onMove = (setter: React.Dispatch<React.SetStateAction<WinState>>) =>
    (e: MoveEvent) => {
      setter((s) => ({ ...s, left: e.left, top: e.top }));
    };

  const onResize = (setter: React.Dispatch<React.SetStateAction<WinState>>) =>
    (e: { left: number; top: number; width: number; height: number }) => {
      setter((s) => ({ ...s, left: e.left, top: e.top, width: e.width, height: e.height }));
    };

  return (
    <div className="beghou-page beghou-page--fill">
      <div className="beghou-toolbar">
        <Checkbox
          label="HCP"
          value={showHcp}
          onChange={(e: CheckboxChangeEvent) => setShowHcp(Boolean(e.value))}
        />
        <Checkbox
          label="Accounts"
          value={showAcc}
          onChange={(e: CheckboxChangeEvent) => setShowAcc(Boolean(e.value))}
        />
      </div>

      <div className="map-container" ref={mapWrapperRef}>
        {rect && (
          <KendoMap
            ref={(m) => {
              mapInstanceRef.current = m;
            }}
            center={[30.2685, -97.7535]}
            zoom={14}
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

        {rect && (
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
            resizable
            closeButton={NoButton}
            onStageChange={onStage(setZip, 'zip')}
            onMove={onMove(setZip)}
            onResize={onResize(setZip)}
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

        {rect && showHcp && (
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
            resizable
            closeButton={NoButton}
            onStageChange={onStage(setHcp, 'hcp')}
            onMove={onMove(setHcp)}
            onResize={onResize(setHcp)}
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

        {rect && showAcc && (
          <Window
            title="Accounts"
            appendTo={mapWrapperRef.current ?? undefined}
            stage={acc.stage}
            left={acc.left}
            top={acc.top}
            width={acc.width}
            height={acc.height}
            modal={false}
            draggable
            resizable
            closeButton={NoButton}
            onStageChange={onStage(setAcc, 'acc')}
            onMove={onMove(setAcc)}
            onResize={onResize(setAcc)}
          >
            <Grid data={ACC_DATA} style={{ height: '100%' }}>
              <GridColumn field="origTerr" title="Original Terr" width="130px" />
              <GridColumn field="origName" title="Original Name" width="150px" />
              <GridColumn field="newTerr" title="New Terr" width="110px" />
              <GridColumn field="newName" title="New Name" width="150px" />
              <GridColumn field="id" title="ID" width="90px" />
              <GridColumn field="lname" title="L Name" width="120px" />
              <GridColumn field="fname" title="F Name" width="120px" />
              <GridColumn field="spec" title="Spec" width="100px" />
              <GridColumn field="decMkt" title="decMkt" width="90px" />
              <GridColumn field="mkt_roll12" title="mkt_roll12" width="120px" />
              <GridColumn field="ESTR_roll12" title="ESTR_roll12" width="120px" />
              <GridColumn field="MENA_roll12" title="MENA_roll12" width="130px" />
            </Grid>
          </Window>
        )}
      </div>
    </div>
  );
}
