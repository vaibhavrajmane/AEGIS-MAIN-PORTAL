# AEGIS Maritime Surveillance — Complete Ship Locations, Varying Coordinates & Filter Reference

This document contains the complete dataset for all **20 tracked vessels (`V-001` through `V-020`)**, including:
1. **Static & Live Varying Coordinates** (Reported AIS Lat/Lng, Live Telemetry Drift Formula, Global Ocean Leaflet Map Coordinates, Radar X/Y Positions).
2. **Multi-Stage Voyage Locations** (Departure Port, Intermediate Anomaly/Checkpoint Stops, Protected Zone Polygons, Current Tactical Position, Destination Port, and Doubly Linked List Trajectory Nodes).
3. **Complete Filter Matrix** showing exactly which ships appear or change under every filter in the application.

---

## Part 1: How Vessel Locations Vary Dynamically in Real Time

Every vessel in the AEGIS system has **five coordinate representations** across different views and live telemetry cycles:

1. **Base AIS Coordinates (`currentCoordinates`)**:
   - The primary DMS (Degrees, Minutes, Seconds) position reported in `src/data/mockData.ts`.
2. **Live Telemetry Coordinate Oscillation (`LiveTelemetryContext.tsx`)**:
   - Updated every **2.5 seconds (`tick`)** via sinusoidal sea-drift modulation:
   - $\text{phase} = \text{tick} \times 0.4 + \text{vesselNumber} \times 0.8$
   - **Latitude Seconds Offset**: $\Delta\text{Lat}_{\text{sec}} = \text{round}(\sin(\text{phase}) \times 3)$ (clamped $00''\text{–}59''$)
   - **Longitude Seconds Offset**: $\Delta\text{Lng}_{\text{sec}} = \text{round}(\cos(\text{phase}) \times 3)$ (clamped $00''\text{–}59''$)
   - **Live Speed (SOG) Variation**: $\text{SOG}_{\text{live}} = \max(0.1, \text{SOG}_{\text{base}} + \sin(\text{phase}) \times 0.18\text{ kts})$
   - **Live Heading (COG) Variation**: $\text{COG}_{\text{live}} = (\text{COG}_{\text{base}} + \text{round}(\cos(\text{phase}) \times 2^\circ) + 360) \bmod 360$
   - **Live Draft Variation**: $\text{Draft}_{\text{live}} = \text{Draft}_{\text{base}} + \sin(\text{phase}) \times 0.03\text{ m}$
   - **Live Risk Score Variation**: $\text{Score}_{\text{live}} = \text{Score}_{\text{base}} \pm 1$ based on `(tick + vesselNumber) % 6 === 0` or `% 8 === 0`.
3. **Global Radar Leaflet Map Coordinates (`getVesselLatLng` in `GlobalRadarView.tsx`)**:
   - Plots each vessel on the interactive world map using `GLOBAL_OCEAN_COORDS[vesselNumber - 1]` plus deterministic offsets:
     - $\text{latOffset} = (((N \times 13) \bmod 10) / 10) \times 4 - 2$
     - $\text{lngOffset} = (((N \times 17) \bmod 10) / 10) \times 4 - 2$
4. **Voyage Route & Traveling Red Circle Path (`VESSEL_ROUTES` in `vesselRoutes.ts`)**:
   - Used in **Ship Profile (`VesselDossierView`)** and **Route Check (`RouteDeviationView`)**.
   - Traces the vessel's SVG cubic Bézier trajectory (`actualPathD`) from `startPoint` (Departure Port) $\rightarrow$ intermediate `anomalyStops` $\rightarrow$ `currentPoint` (Live Ship Location), while comparing against `plannedPathD` toward `destPoint` (Destination Port).
5. **Doubly Linked List (DLL) Historical Trajectory (`trajectoryDLL`)**:
   - Temporal breadcrumb snapshots (`T1` $\rightarrow$ `T2` $\rightarrow$ `T3`) used for kinematic velocity and dark-gap analysis on `V-001` through `V-007`.

---

## Part 2: Complete Ship-by-Ship Location & Route Dataset (`V-001` – `V-020`)

### 1. Critical Priority Vessels (`CRITICAL` — Risk Score > 80)

#### **V-001 — "OCEAN GHOST" (`FV HAI LONG 88`)**
- **MMSI / IMO / Callsign**: `412789120` / `9144820` / `BZ8K`
- **Flag**: Panama (`PA` — Flag of Convenience) | **Type**: Squid Jigging Vessel (73m)
- **Base Risk Score**: `96` (Varies `95–97`) | **Status**: `CRITICAL`
- **Current AIS Coordinates**: `04°18'22"S 082°44'09"W` (Varies $\pm 3''$: `04°18'19"S–25"S`, `082°44'06"W–12"W`)
- **Speed / Course / Draft**: `1.4 kts` (`142° South-East`) | Draft: `5.2m deep` (`+1.4m heavier`)
- **Global Radar Map (Leaflet Lat, Lng)**: `[39.2, -149.2]` (Base `[40.0, -150.0]` + offset `[-0.8, +0.8]`) | **Radar %**: `X: 52%, Y: 51%`
- **Voyage Route (`Sep 12`)**:
  - **Departure (`startPoint`)**: Valparaíso, Chile `(SVG: 120, 330)`
  - **Destination (`destPoint`)**: Busan, South Korea `(SVG: 920, 80)`
  - **Current Route Position (`currentPoint`)**: `(SVG: 790, 190)`
  - **Protected Zone Breached**: `GALÁPAGOS SANCTUARY POLYGON #4` `(Points: 420,130 580,110 610,240 450,260)`
- **Varying Intermediate Stops (`anomalyStops` & `anomalyTableStops`)**:
  1. **STOP #1 (72h Trawling / 42h 18m Sanctuary Buffer)**: `04°18'22" S, 082°44'09" W` `(SVG: 350, 295)` — Dragging fine-mesh squid jigs (`0.4 kts`, Severe Incursion)
  2. **STOP #2 (Sanctuary 114h / High Seas Transshipment)**: `02°11'05" S, 085°18'33" W` `(SVG: 490, 210)` — Unauthorized nocturnal squid jigging / tied alongside `HAI QING 12` (`0.1 kts`)
  3. **STOP #3 (Cargo Hand-off / Boundary Corridor)**: `01°55'40" S, 091°12'04" W` `(SVG: 680, 205)` — Loitering longlines (`0.8 kts`, 19h 10m)
- **DLL Trajectory Nodes (`trajectoryDLL`)**:
  - `T1 (14:00)`: `lat: -3.8, lng: -83.2` (`11.2 kts`, `145°`)
  - `T2 (16:00)`: `lat: -4.0, lng: -83.0` (`8.4 kts`, `142°`)
  - `T3 (18:00)`: `lat: -4.18, lng: -82.73` (`1.4 kts`, `142°`, **Dark Gap** — Transponder cut off at sanctuary edge)

---

#### **V-002 — "SHADOW REEFER" (`HAI QING 12`)**
- **MMSI / IMO / Callsign**: `413890211` / `9348123` / `BH4N`
- **Flag**: China (`CN` — Guinea Basin Fleet) | **Type**: Cargo Reefer Transshipment Ship (89.5m)
- **Base Risk Score**: `92` (Varies `91–93`) | **Status**: `CRITICAL`
- **Current AIS Coordinates**: `02°11'05"S 085°18'33"W` (Varies $\pm 3''$: `02°11'02"S–08"S`, `085°18'30"W–36"W`)
- **Speed / Course / Draft**: `0.2 kts` (`210° South-West`) | Draft: `6.8m deep` (`+2.1m heavier`)
- **Global Radar Map (Leaflet Lat, Lng)**: `[-19.6, -130.4]` (Base `[-20.0, -130.0]` + offset `[+0.4, -0.4]`) | **Radar %**: `X: 71%, Y: 40%`
- **Voyage Route (`Oct 02`)**:
  - **Departure (`startPoint`)**: Fuzhou, China `(SVG: 100, 110)`
  - **Destination (`destPoint`)**: Manta, Ecuador `(SVG: 900, 260)`
  - **Current Route Position (`currentPoint`)**: `(SVG: 850, 250)`
  - **Protected Zone**: `HIGH SEAS TRANSSHIPMENT BUFFER` `(Points: 440,200 620,190 640,320 460,330)`
- **Varying Intermediate Stops**:
  1. **STOP #1 (Dark Gap 4.8h)**: `02°11'05" S, 085°18'33" W` `(SVG: 530, 280)` — AIS shut down while transferring refrigerated squid holds (`0.2 kts`, Critical Encounter)
  2. **STOP #2 (Dual Rafting 6.2h)**: `03°02'19" S, 086°40'11" W` `(SVG: 700, 225)` — Rafted alongside 2 unlicensed catcher boats; draft dropped `+2.1m` (`0.3 kts`, Severe Incursion)
- **DLL Trajectory Nodes (`trajectoryDLL`)**:
  - `T1 (08:00)`: `lat: -1.9, lng: -85.5` (`12.0 kts`, `210°`)
  - `T2 (11:00)`: `lat: -2.05, lng: -85.3` (`3.5 kts`, `210°`)
  - `T3 (11:15)`: `lat: -2.18, lng: -85.3` (`0.2 kts`, `210°`, **Dark Gap** — Telemetry blackout for 4h 45m)

---

#### **V-003 — "DARK DRIFTER" (`FV SOUTHERN STAR`)**
- **MMSI / IMO / Callsign**: `354921008` / `8872019` / `HP29`
- **Flag**: Liberia (`LR` — Flag of Convenience) | **Type**: Pelagic Longline Fishing Boat (58m)
- **Base Risk Score**: `89` (Varies `88–90`) | **Status**: `CRITICAL`
- **Current AIS Coordinates**: `01°55'40"S 091°12'04"W` (Varies $\pm 3''$: `01°55'37"S–43"S`, `091°12'01"W–07"W`)
- **Speed / Course / Draft**: `0.8 kts` (`045° North-East`) | Draft: `4.1m deep`
- **Global Radar Map (Leaflet Lat, Lng)**: `[1.6, -161.6]` (Base `[0.0, -160.0]` + offset `[+1.6, -1.6]`) | **Radar %**: `X: 45%, Y: 68%`
- **Voyage Route (`Sep 20`)**:
  - **Departure (`startPoint`)**: Montevideo, Uruguay `(SVG: 880, 330)`
  - **Destination (`destPoint`)**: Papeete, French Polynesia `(SVG: 120, 180)`
  - **Current Route Position (`currentPoint`)**: `(SVG: 160, 170)`
  - **Protected Zone**: `NAZCA RIDGE SEAMOUNT BIOSPHERE` `(Points: 430,150 560,140 580,270 450,280)`
- **Varying Intermediate Stops**:
  1. **STOP #1 (19h Longline Drift)**: `01°55'40" S, 091°12'04" W` `(SVG: 470, 210)` — Speed dropped to `0.8 kts`; deployed 80 miles of pelagic longlines (Suspicious Dwell)
  2. **STOP #2 (Saw-tooth Netting 14.5h)**: `02°28'15" S, 090°44'30" W` `(SVG: 330, 220)` — Tight looping maneuvers over shark migration corridor (Severe Incursion)
- **DLL Trajectory Nodes (`trajectoryDLL`)**:
  - `T1 (12:00)`: `lat: -1.7, lng: -91.5` (`11.5 kts`, `45°`)
  - `T2 (14:30)`: `lat: -1.85, lng: -91.3` (`4.2 kts`, `60°`)
  - `T3 (16:00)`: `lat: -1.92, lng: -91.2` (`0.8 kts`, `45°` — Loitering longlines deployed)

---

#### **V-004 — "PHANTOM RUNNER" (`FV POSEIDON VI`)**
- **MMSI / IMO / Callsign**: `224098410` / `9012845` / `EBD9`
- **Flag**: Vanuatu (`VU` — Flag of Convenience) | **Type**: Deep Sea Industrial Trawler (67.4m)
- **Base Risk Score**: `95` (Varies `94–96`) | **Status**: `CRITICAL`
- **Current AIS Coordinates**: `03°42'18"S 089°22'50"W` (Fabricated/Spoofed AIS — 142 NM discrepancy from SAR radar echo)
- **Speed / Course / Draft**: `5.2 kts` (`320° North-West`) | Draft: `5.9m deep` (`+1.8m heavier`)
- **Global Radar Map (Leaflet Lat, Lng)**: `[43.8, -38.8]` (Base `[45.0, -40.0]` + offset `[-1.2, +1.2]`) | **Radar %**: `X: 28%, Y: 80%`
- **Voyage Route (`Oct 08`)**:
  - **Departure (`startPoint`)**: Callao, Peru `(SVG: 860, 270)`
  - **Destination (`destPoint`)**: Kaohsiung, Taiwan `(SVG: 150, 100)`
  - **Current Route Position (`currentPoint`)**: `(SVG: 190, 135)`
  - **Protected Zone**: `PERU-CHILE TRENCH BENTHIC CORRIDOR` `(Points: 520,240 680,230 700,360 540,370)`
- **Varying Intermediate Stops**:
  1. **STOP #1 (AIS Spoofed 142 NM — 38h)**: `03°42'18" S, 089°22'50" W` `(SVG: 590, 315)` — AIS claims international waters, SAR proves deep trench bottom-trawling (Severe Incursion)
  2. **STOP #2 (Heavy Net Drag — 54h)**: `04°15'35" S, 088°50'12" W` `(SVG: 430, 225)` — Benthic dredge gear dragging across deep seamounts (Severe Incursion)
- **DLL Trajectory Nodes (`trajectoryDLL`)**:
  - `T1 (10:00)`: `lat: -3.1, lng: -89.8` (`5.0 kts`, `320°`)
  - `T2 (12:00)`: `lat: -3.4, lng: -89.5` (`5.1 kts`, `320°`)
  - `T3 (14:00)`: `lat: -3.7, lng: -89.37` (`5.2 kts`, `320°` — Spoofed AIS transponder vs radar echo)

---

### 2. Elevated Risk Vessels (`ALERTIVE` — Medium Risk Score 50–80)

#### **V-005 — "BOUNDARY BREAKER" (`PACIFIC RAIDER`)**
- **MMSI / IMO / Callsign**: `518901234` / `9215678` / `C6XYZ`
- **Flag**: Cook Islands (`CK` — Flag of Convenience) | **Type**: High-Speed Trawler (62m)
- **Base Risk Score**: `74` (Varies `73–75`) | **Status**: `ALERTIVE`
- **Current AIS Coordinates**: `01°12'10"S 092°45'00"W`
- **Speed / Course / Draft**: `13.8 kts` (`120° South-East`) | Draft: `4.8m deep`
- **Global Radar Map (Leaflet Lat, Lng)**: `[-30.0, -20.0]` (Base `[-30.0, -20.0]` + offset `[0.0, 0.0]`) | **Radar %**: `X: 38%, Y: 32%`
- **Voyage Route (`Oct 15`)**:
  - **Departure (`startPoint`)**: Suva, Fiji `(SVG: 110, 240)`
  - **Destination (`destPoint`)**: Balboa, Panama `(SVG: 890, 150)`
  - **Current Route Position (`currentPoint`)**: `(SVG: 830, 185)`
  - **Protected Zone**: `MALPELO MARINE SANCTUARY BORDER` `(Points: 580,90 700,80 720,190 600,200)`
- **Varying Intermediate Stops**:
  1. **ALERT #1 (Boundary Skim 0.8 NM — 2.5h)**: `01°12'10" S, 092°45'00" W` `(SVG: 670, 140)` — Approached sanctuary boundary at `13.8 kts` before abrupt evasive turn (Suspicious Dwell)
  2. **ALERT #2 (Radar Evasion — 1.8h)**: `00°58'40" S, 091°10'15" W` `(SVG: 770, 220)` — Full rudder maneuver following naval cutter patrol radar lock (Minor Drift)
- **DLL Trajectory Nodes (`trajectoryDLL`)**:
  - `T1 (13:00)`: `lat: -0.9, lng: -93.2` (`14.1 kts`, `120°`)
  - `T2 (14:00)`: `lat: -1.05, lng: -92.8` (`13.9 kts`, `120°`)
  - `T3 (15:00)`: `lat: -1.2, lng: -92.75` (`13.8 kts`, `120°` — Vector heads towards Marine Protected Area)

---

#### **V-006 — "SILENT SQUID" (`ALBACORA I`)**
- **MMSI / IMO / Callsign**: `312876543` / `8954321` / `HP77`
- **Flag**: Belize (`BZ` — Flag of Convenience) | **Type**: Jigging Vessel (55m)
- **Base Risk Score**: `68` (Varies `67–69`) | **Status**: `ALERTIVE`
- **Current AIS Coordinates**: `02°55'14"S 087°33'12"W`
- **Speed / Course / Draft**: `0.1 kts` (`000° Drift`) | Draft: `4.2m deep`
- **Global Radar Map (Leaflet Lat, Lng)**: `[-23.8, 73.8]` (Base `[-25.0, 75.0]` + offset `[+1.2, -1.2]`) | **Radar %**: `X: 62%, Y: 60%`
- **Voyage Route (`Oct 18`)**:
  - **Departure (`startPoint`)**: Puntarenas, Costa Rica `(SVG: 130, 150)`
  - **Destination (`destPoint`)**: Guayaquil, Ecuador `(SVG: 880, 310)`
  - **Current Route Position (`currentPoint`)**: `(SVG: 780, 290)`
  - **Protected Zone**: `COCOS ISLAND BIOSPHERE RESERVE` `(Points: 360,220 490,200 520,310 390,325)`
- **Varying Intermediate Stops**:
  1. **ALERT #1 (Nocturnal Squid Lights — 28h)**: `05°30'00" N, 087°04'00" W` `(SVG: 400, 250)` — Super-bright 800 kW halogen light cluster detected by VIIRS satellite (Suspicious Dwell)
  2. **ALERT #2 (Buffer Zone Drift — 19h)**: `05°12'18" N, 086°42'30" W` `(SVG: 510, 280)` — Low speed `0.6 kts` drift in Cocos ecological buffer (Severe Incursion)
- **DLL Trajectory Nodes (`trajectoryDLL`)**:
  - `T1 (11:00)`: `lat: -2.8, lng: -87.8` (`10.4 kts`, `95°`)
  - `T2 (12:00)`: `lat: -2.9, lng: -87.55` (`0.1 kts`, `0°` — Speed dropped to 0.1 kts for 45 mins)
  - `T3 (12:45)`: `lat: -2.92, lng: -87.55` (`0.1 kts`, `0°` — Dwell continues)

---

#### **V-007 — "ROUTE DRIFTER" (`GOLDEN WAVE`)**
- **MMSI / IMO / Callsign**: `440123456` / `9432109` / `DSB2`
- **Flag**: South Korea (`KR`) | **Type**: Longline Tuna Boat (51.2m)
- **Base Risk Score**: `65` (Varies `64–66`) | **Status**: `ALERTIVE`
- **Current AIS Coordinates**: `04°50'18"S 090°15'42"W`
- **Speed / Course / Draft**: `7.2 kts` (`285° West-North-West`) | Draft: `3.9m deep`
- **Global Radar Map (Leaflet Lat, Lng)**: `[13.4, 66.6]` (Base `[15.0, 65.0]` + offset `[-1.6, +1.6]`) | **Radar %**: `X: 42%, Y: 82%`
- **Voyage Route (`Oct 14`)**:
  - **Departure (`startPoint`)**: Chimbote, Peru `(SVG: 870, 240)`
  - **Destination (`destPoint`)**: Busan, South Korea `(SVG: 130, 90)`
  - **Current Route Position (`currentPoint`)**: `(SVG: 210, 120)`
  - **Protected Zone**: `SPRFMO HIGH-SEAS TRENCH POCKET` `(Points: 480,140 600,130 620,230 500,240)`
- **Varying Intermediate Stops**:
  1. **ALERT #1 (68 NM Off-Track Detour — 42h)**: `04°50'18" S, 090°15'42" W` `(SVG: 620, 180)` — Diverged from great-circle line into high-seas squid hotspot (`1.2 kts`, Suspicious Dwell)
  2. **ALERT #2 (Unreported Longline Set — 31h)**: `04°18'55" S, 089°32'10" W` `(SVG: 460, 210)` — Circular loitering matching unannounced fishing deployment (Severe Incursion)
- **DLL Trajectory Nodes (`trajectoryDLL`)**:
  - `T1 (06:00)`: `lat: -4.2, lng: -89.0` (`8.5 kts`, `240°`)
  - `T2 (09:00)`: `lat: -4.6, lng: -89.7` (`7.8 kts`, `260°`)
  - `T3 (12:00)`: `lat: -4.83, lng: -90.26` (`7.2 kts`, `285°` — Detour towards shallow seamount area)

---

### 3. Normal Commercial & Research Traffic (`NORMAL` — Low Risk Score < 50)

| Code | Nickname & Vessel Name | Flag | Type | Score | Current AIS Coordinates | Speed & Heading | Departure $\rightarrow$ Destination | Waypoint / Checkpoint Location | Leaflet Map `[Lat, Lng]` & Radar `(X%, Y%)` |
| :--- | :--- | :--- | :--- | :---: | :--- | :--- | :--- | :--- | :--- |
| **V-008** | **"MERIDIAN STAR"**<br>`MV MERIDIAN STAR` | Germany (`DE`) | Container Ship (280m) | `12` | `00°45'10"N 086°12'00"W` | `18.5 kts`<br>`245° WSW` | San Antonio, Chile `(140,340)` $\rightarrow$ Yokohama, Japan `(920,90)`<br>Current SVG: `(860,110)` | **CHECKPOINT #1**: `00°45'10" N, 086°12'00" W` `(SVG: 480,235)` — Central Pacific Commercial Fairway | `[11.6, 88.4]`<br>Radar: `68%, 18%` |
| **V-009** | **"ATLANTIC TRADER"**<br>`MV ATLANTIC TRADER` | United Kingdom (`GB`) | Bulk Ore Carrier (225m) | `15` | `01°15'00"S 083°10'00"W` | `14.2 kts`<br>`190° S` | Punta Arenas, Chile `(920,360)` $\rightarrow$ Callao, Peru `(220,140)`<br>Current SVG: `(320,180)` | **CHECKPOINT #1**: `01°15'00" S, 083°10'00" W` `(SVG: 610,260)` — Humboldt Coastal Eco-Buffer | `[15.8, 134.2]`<br>Radar: `82%, 28%` |
| **V-010** | **"PACIFIC VOYAGER"**<br>`MV PACIFIC VOYAGER` | Japan (`JP`) | General Cargo Vessel (195m) | `18` | `02°00'00"S 093°50'00"W` | `15.6 kts`<br>`270° W` | Manta, Ecuador `(130,200)` $\rightarrow$ Balboa, Panama `(920,150)`<br>Current SVG: `(860,160)` | **CHECKPOINT #1**: `06°40'00" N, 080°00'00" W` `(SVG: 510,180)` — Gulf of Panama Fairway Separation | `[-42.0, 158.0]`<br>Radar: `18%, 48%` |
| **V-011** | **"NORDIC HORIZON"**<br>`LNG NORDIC HORIZON` | Norway (`NO`) | LNG Tanker (299m) | `8` | `03°10'00"S 081°40'00"W` | `19.1 kts`<br>`160° SSE` | Panama Canal Fairway `(110,120)` $\rightarrow$ Tokyo Bay, Japan `(930,280)`<br>Current SVG: `(880,270)` | **CHECKPOINT #1**: `03°10'00" N, 120°40'00" W` `(SVG: 520,205)` — Equatorial Abyssal Deepwater Zone | `[-50.8, 20.8]`<br>Radar: `86%, 62%` |
| **V-012** | **"CORAL NAVIGATOR"**<br>`MV CORAL NAVIGATOR` | Netherlands (`NL`) | Refrigerated Cargo Ship (152m) | `22` | `00°20'00"S 089°00'00"W` | `16.4 kts`<br>`225° SW` | Antofagasta, Chile `(880,310)` $\rightarrow$ Valparaíso, Chile `(260,180)`<br>Current SVG: `(360,210)` | **CHECKPOINT #1 (6h Weather Detour)**: `28°15'00" S, 072°10'00" W` `(SVG: 500,235)` — Juan Fernández Buffer Corridor | `[0.4, -0.4]`<br>Radar: `58%, 15%` |
| **V-013** | **"EQUATORIAL DRIFT"**<br>`MT EQUATORIAL DRIFT` | Singapore (`SG`) | Chemical Tanker (145m) | `14` | `01°40'00"S 086°50'00"W` | `13.0 kts`<br>`310° NW` | Balboa Anchorage `(150,140)` $\rightarrow$ Buenaventura, Colombia `(900,250)`<br>Current SVG: `(840,240)` | **CHECKPOINT #1**: `05°10'00" N, 078°20'00" W` `(SVG: 530,195)` — Colombia Pacific EEZ Fairway | `[-13.4, 153.4]`<br>Radar: `65%, 35%` |
| **V-014** | **"CAPE TRANSIT"**<br>`MV CAPE TRANSIT` | Malta (`MT`) | Pure Car & Truck Carrier (200m) | `10` | `04°00'00"S 085°00'00"W` | `17.8 kts`<br>`135° SE` | Valparaíso, Chile `(860,320)` $\rightarrow$ Auckland, NZ `(120,210)`<br>Current SVG: `(190,230)` | **CHECKPOINT #1**: `33°40'00" S, 110°15'00" W` `(SVG: 490,265)` — South Pacific Subtropical Gyre Lane | `[56.8, -173.8]`<br>Radar: `74%, 72%` |
| **V-015** | **"ISLAND EXPRESS"**<br>`MV ISLAND EXPRESS` | Ecuador (`EC`) | Inter-Island Passenger Ferry (88m) | `5` | `00°50'00"S 090°30'00"W` | `12.5 kts`<br>`080° ENE` | Santa Cruz Pier `(200,160)` $\rightarrow$ San Cristóbal, Galápagos `(860,200)`<br>Current SVG: `(790,190)` | **CHECKPOINT #1**: `00°45'00" S, 090°20'00" W` `(SVG: 560,180)` — Local Archipelagic Transit Channel | `[28.0, -60.0]`<br>Radar: `48%, 22%` |
| **V-016** | **"OCEAN PIONEER"**<br>`RV OCEAN PIONEER` | United States (`US`) | Scientific Research Vessel (84m) | `11` | `02°30'00"S 092°00'00"W` | `4.5 kts`<br>`180° S` | Callao Research Pier `(850,210)` $\rightarrow$ Guayaquil, Ecuador `(220,130)`<br>Current SVG: `(310,150)` | **CHECKPOINT #1**: `03°15'00" S, 081°45'00" W` `(SVG: 570,180)` — UNESCO Certified Science Survey Grid | `[13.2, 112.8]`<br>Radar: `41%, 55%` |
| **V-017** | **"BLUE CURRENT"**<br>`MT BLUE CURRENT` | Panama (`PA`) | Aframax Crude Oil Tanker (245m) | `16` | `03°30'00"S 084°00'00"W` | `13.5 kts`<br>`290° WNW` | Chimbote Terminal `(870,270)` $\rightarrow$ Callao Port `(280,210)`<br>Current SVG: `(380,230)` | **CHECKPOINT #1**: `10°40'00" S, 078°10'00" W` `(SVG: 590,248)` — Callao IMO Traffic Separation Zone | `[33.4, 151.6]`<br>Radar: `79%, 65%` |
| **V-018** | **"AURORA BOREALIS"**<br>`CS AURORA BOREALIS` | France (`FR`) | Subsea Fiber Cable Vessel (112m) | `7` | `01°05'00"S 088°20'00"W` | `2.1 kts`<br>`015° NNE` | Valparaíso Base `(160,310)` $\rightarrow$ Arica Terminal, Chile `(890,150)`<br>Current SVG: `(820,170)` | **CHECKPOINT #1**: `24°30'00" S, 071°50'00" W` `(SVG: 540,230)` — Subsea Communications Cable Corridor | `[-25.4, 110.4]`<br>Radar: `55%, 28%` |
| **V-019** | **"HORIZON LEADER"**<br>`MT HORIZON LEADER` | Liberia (`LR`) | LPG Gas Carrier (180m) | `13` | `04°30'00"S 087°00'00"W` | `16.0 kts`<br>`260° W` | Balboa Vehicle Pier `(130,160)` $\rightarrow$ San Antonio, Chile `(910,290)`<br>Current SVG: `(840,270)` | **CHECKPOINT #1**: `14°20'00" S, 077°40'00" W` `(SVG: 510,225)` — Southbound RoRo Freight Channel | `[-34.2, 49.2]`<br>Radar: `63%, 85%` |
| **V-020** | **"ZEPHYR TRADE"**<br>`MV ZEPHYR TRADE` | Hong Kong (`HK`) | Multi-Purpose Cargo Carrier (168m) | `17` | `02°50'00"S 090°00'00"W` | `14.8 kts`<br>`330° NNW` | Antofagasta Wharf `(860,290)` $\rightarrow$ Kaohsiung, Taiwan `(140,110)`<br>Current SVG: `(220,140)` | **CHECKPOINT #1**: `18°50'00" S, 095°30'00" W` `(SVG: 520,215)` — International Bulk Mineral Corridor | `[-4.0, -97.0]`<br>Radar: `49%, 58%` |

*(Note: In `GlobalRadarView.tsx`, the Coast Guard patrol vessel **USCG CUTTER ARGUS** is also plotted at static patrol position `[-5.0, -100.0]` moving at `28 kts`, heading `320°`.)*

---

## Part 3: Which Ships Change for Each Filter Available in the App

### A. Global Radar View — "Threat Focus (Synced)" Filters & Top KPI HUD Cards
Clicking the top KPI HUD cards or the **Threat Focus (Synced)** buttons in `GlobalRadarView.tsx` sets `riskFilterCategory` and immediately changes both the **Suspicious Ships List** and the **Leaflet Radar Map markers**:

| Filter Button / KPI Card | Filter Key | Selection Logic | Ships Displayed (Count) | Exact Ships Included | Ships Filtered Out |
| :--- | :--- | :--- | :---: | :--- | :--- |
| **🚨 High Risk**<br>*(or "High Risk Ships" KPI)* | `HIGH_RISK` | `score >= 80` **OR** `isVesselSanctuaryTrespassing` **OR** `isVesselSignalTurnedOff` | **5 Ships** | `V-001` (Score 96, Sanctuary + Dark)<br>`V-002` (Score 92, Dark)<br>`V-003` (Score 89)<br>`V-004` (Score 95)<br>`V-005` (Score 74, Sanctuary Boundary) | `V-006` through `V-020` (15 ships) |
| **🚫 Sanctuary**<br>*(or "Sanctuary Trespassing" KPI)* | `SANCTUARY` | `isVesselSanctuaryTrespassing(v)` matches keywords (`sanctuary`, `protected area`, `marine reserve`, `no-fish`, `boundary crossing`, `galápagos`) | **2 Ships** | `V-001` ("OCEAN GHOST" — Galápagos Sanctuary Node #4)<br>`V-005` ("BOUNDARY BREAKER" — Approaching Marine Protected Area boundary) | `V-002`, `V-003`, `V-004`, and `V-006` through `V-020` (18 ships) |
| **📡 Signal Off**<br>*(or "Signal Turned Off" KPI)* | `SIGNAL_OFF` | `isVesselSignalTurnedOff(v)` checks `!v.isOnline` or keywords (`signal off`, `telemetry gap`, `blackout`, `dark`, `cut off`, `disabled`) | **2 Ships** | `V-001` ("OCEAN GHOST" — `isOnline: false`, 6h 12m Signal Off)<br>`V-002` ("SHADOW REEFER" — `isOnline: false`, 4h 45m Telemetry Gap) | `V-003` through `V-020` (18 ships) |
| **🌐 All Ships**<br>*(or "Boats Tracked" KPI)* | `ALL` | Defers to the active **Suspicion Level (`riskTier`)** button below it | **4, 3, or 20 Ships** | Depends on `Suspicion Level` (`High (>80)`, `Med (50-80)`, or `All Ships`) | Depends on `Suspicion Level` |

---

### B. Global Radar View — "Suspicion Level" (`riskTier`) Filters
When `Threat Focus` is set to `ALL` (or when clicking any Suspicion Level button, which automatically resets `Threat Focus` to `ALL`), the ship list and radar markers change as follows:

| Suspicion Level Button | Filter Key | Score Condition | Ships Displayed (Count) | Exact Ships Included |
| :--- | :--- | :--- | :---: | :--- |
| **High (>80)** *(Default on initial load)* | `HIGH` | `v.score >= 80` | **4 Ships** | `V-001` (96), `V-004` (95), `V-002` (92), `V-003` (89) |
| **Med (50-80)** | `MEDIUM` | `v.score >= 50 && v.score < 80` | **3 Ships** | `V-005` (74), `V-006` (68), `V-007` (65) |
| **All Ships** *(or "Reset" / "View All Monitored Ships (20)")* | `ALL` | No score restriction | **20 Ships** | All vessels `V-001` through `V-020` |

---

### C. 20-Vessel Matrix & DSA View (`DsaMatrixView.tsx`) — Status Filters
In the **20-Vessel Matrix** screen, vessels are filtered by their `dashboardStatus`:

| Matrix Filter Button | Status Key | Ships Displayed (Count) | Exact Ships Included |
| :--- | :--- | :---: | :--- |
| **ALL (20)** | `ALL` | **20 Ships** | `V-001` through `V-020` |
| **CRITICAL (4)** | `CRITICAL` | **4 Ships** | `V-001` ("OCEAN GHOST"), `V-002` ("SHADOW REEFER"), `V-003` ("DARK DRIFTER"), `V-004` ("PHANTOM RUNNER") |
| **ALERTIVE (3)** | `ALERTIVE` | **3 Ships** | `V-005` ("BOUNDARY BREAKER"), `V-006` ("SILENT SQUID"), `V-007` ("ROUTE DRIFTER") |
| **NORMAL (13)** | `NORMAL` | **13 Ships** | `V-008` ("MERIDIAN STAR"), `V-009` ("ATLANTIC TRADER"), `V-010` ("PACIFIC VOYAGER"), `V-011` ("NORDIC HORIZON"), `V-012` ("CORAL NAVIGATOR"), `V-013` ("EQUATORIAL DRIFT"), `V-014` ("CAPE TRANSIT"), `V-015` ("ISLAND EXPRESS"), `V-016` ("OCEAN PIONEER"), `V-017` ("BLUE CURRENT"), `V-018` ("AURORA BOREALIS"), `V-019` ("HORIZON LEADER"), `V-020` ("ZEPHYR TRADE") |

---

### D. Search Bar Filter (Global Header Search & Matrix Search)
Typing into the search bar filters the active ship list in real time across:
- **Global Radar View**: Matches `vesselCode` (e.g. `V-001`), `nickname` (e.g. `OCEAN GHOST`), `name` (e.g. `HAI LONG`), `mmsi`, `imo`, `callsign`, `behavioralTrigger`, and `algorithmUsed` (e.g. `Dijkstra`, `Quadtree`, `Spatial Hash`, `Doubly Linked List`, `Binary Search`).
- **20-Vessel Matrix View**: Matches `vesselCode`, `nickname`, `name`, `behavioralTrigger`, and `systemAction`.

---

### E. Country Flag & Ship Type Breakdown Across All 20 Vessels
For reference across the **Country Flag** and **Ship Type** categories:

#### **1. Ships Grouped by Country Flag**
- **Panama (`PA`) — 2 Ships**: `V-001` (FV HAI LONG 88 — Critical), `V-017` (MT BLUE CURRENT — Normal)
- **Liberia (`LR`) — 2 Ships**: `V-003` (FV SOUTHERN STAR — Critical), `V-019` (MT HORIZON LEADER — Normal)
- **China (`CN`) — 1 Ship**: `V-002` (HAI QING 12 — Critical)
- **Vanuatu (`VU`) — 1 Ship**: `V-004` (FV POSEIDON VI — Critical)
- **Cook Islands (`CK`) — 1 Ship**: `V-005` (PACIFIC RAIDER — Alertive)
- **Belize (`BZ`) — 1 Ship**: `V-006` (ALBACORA I — Alertive)
- **South Korea (`KR`) — 1 Ship**: `V-007` (GOLDEN WAVE — Alertive)
- **Germany (`DE`) — 1 Ship**: `V-008` (MV MERIDIAN STAR — Normal)
- **United Kingdom (`GB`) — 1 Ship**: `V-009` (MV ATLANTIC TRADER — Normal)
- **Japan (`JP`) — 1 Ship**: `V-010` (MV PACIFIC VOYAGER — Normal)
- **Norway (`NO`) — 1 Ship**: `V-011` (LNG NORDIC HORIZON — Normal)
- **Netherlands (`NL`) — 1 Ship**: `V-012` (MV CORAL NAVIGATOR — Normal)
- **Singapore (`SG`) — 1 Ship**: `V-013` (MT EQUATORIAL DRIFT — Normal)
- **Malta (`MT`) — 1 Ship**: `V-014` (MV CAPE TRANSIT — Normal)
- **Ecuador (`EC`) — 1 Ship**: `V-015` (MV ISLAND EXPRESS — Normal)
- **United States (`US`) — 1 Ship**: `V-016` (RV OCEAN PIONEER — Normal)
- **France (`FR`) — 1 Ship**: `V-018` (CS AURORA BOREALIS — Normal)
- **Hong Kong (`HK`) — 1 Ship**: `V-020` (MV ZEPHYR TRADE — Normal)

#### **2. Ships Grouped by Vessel / Gear Type**
- **Net Trawlers & Squid Jiggers (`4 Ships`)**:
  - `V-001` (Squid Jigging Vessel, 73m)
  - `V-004` (Deep Sea Industrial Trawler, 67.4m)
  - `V-005` (High-Speed Trawler, 62m)
  - `V-006` (Jigging Vessel, 55m)
- **Longline Boats (`2 Ships`)**:
  - `V-003` (Pelagic Longline Fishing Boat, 58m)
  - `V-007` (Longline Tuna Boat, 51.2m)
- **Freezer / Reefer Ships (`2 Ships`)**:
  - `V-002` (Cargo Reefer Transshipment Ship, 89.5m)
  - `V-012` (Refrigerated Cargo Ship, 152m)
- **Commercial Cargo, Tankers & Specialized Vessels (`12 Ships`)**:
  - `V-008` (Container Ship), `V-009` (Bulk Ore Carrier), `V-010` (General Cargo Vessel), `V-011` (LNG Tanker), `V-013` (Chemical Tanker), `V-014` (Pure Car & Truck Carrier), `V-015` (Inter-Island Passenger Ferry), `V-016` (Scientific Oceanographic Research), `V-017` (Aframax Crude Oil Tanker), `V-018` (Subsea Fiber Cable Repair Vessel), `V-019` (LPG Gas Carrier), `V-020` (Multi-Purpose Cargo Carrier)
