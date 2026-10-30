# Prompt for Building the AEGIS Underwater Drone (AUV/ROV) Tactical Simulator

Copy and paste the prompt below to build a full-featured **AEGIS Subsea Autonomous Underwater Vehicle (AUV/ROV) Simulator** synchronized with the exact 20-vessel AEGIS dataset, coordinates, filters, and Data Structures & Algorithms (DSA) architecture.

---

```markdown
Build a production-grade, interactive 3D & HUD-driven "AEGIS Subsea AUV-09 (Autonomous Underwater Vehicle) Tactical Interceptor & Hydrophone Recon Simulator" web application (React + TypeScript + Tailwind CSS + Three.js / Canvas 3D + Leaflet mini-map) for marine wildlife protection (UN SDG 14) and illegal fishing (IUU) hull/gear inspection.

### 1. CORE MISSION & SYNCHRONIZED 20-VESSEL DATASET
The simulator must embed and synchronize with the exact 20-vessel AEGIS maritime surveillance dataset (`V-001` to `V-020`), allowing the operator to deploy an underwater reconnaissance drone (`AUV-09 POSEIDON-EYE`) directly beneath any of the 20 vessels to inspect their hulls, submerged fishing gear, draft displacement, acoustic cavitation signatures, and marine wildlife proximity:

#### A. CRITICAL PRIORITY TARGETS (Risk Score >= 80)
1. **V-001 ("OCEAN GHOST" / FV HAI LONG 88)**:
   - MMSI: `412789120` | IMO: `9144820` | Flag: Panama (`PA`) | Type: Squid Jigging Vessel (73.2m, 1,840 GT)
   - Risk Score: `96` | Status: `CRITICAL` | AIS Status: `isOnline: false` (`6h 12m ago - Signal Off`) | Sanctuary Trespass: `true`
   - Current Coordinates: `04°18'22"S 082°44'09"W` | Speed: `1.4 kts` | Heading: `142° SE` | Draft: `5.2m deep` (`+1.4m heavier — loaded with catch`)
   - Route: Valparaíso, Chile `(120,330)` -> Busan, South Korea `(920,80)` | Current SVG `(790,190)` | Protected Zone: `GALÁPAGOS SANCTUARY POLYGON #4`
   - Waypoints:
     - `STOP #1`: `04°18'22"S, 082°44'09"W` (72h Trawling, 0.4 kts, dragging illegal fine-mesh squid jigs inside no-take reserve)
     - `STOP #2`: `02°11'05"S, 085°18'33"W` (114h Sanctuary / Transshipment alongside HAI QING 12, 0.1 kts)
     - `STOP #3`: `01°55'40"S, 091°12'04"W` (4.8h Cargo Hand-off / 19h loitering longlines, 0.8 kts)
   - Underwater Drone Recon Target: Submerged fine-mesh squid jigging lines at 45m–120m depth, overloaded hull draft (`5.2m`), disabled acoustic transponder ping, Scalloped Hammerhead shark entanglement risk.
   - DSA Algorithm: `Graph Traversal (BFS & Polygon Edge Intersection)` — `O(V + E)`

2. **V-002 ("SHADOW REEFER" / HAI QING 12)**:
   - MMSI: `413890211` | IMO: `9348123` | Flag: China (`CN`) | Type: Cargo Reefer Transshipment Ship (89.5m, 3,200 GT)
   - Risk Score: `92` | Status: `CRITICAL` | AIS Status: `isOnline: false` (`4h 45m ago - Telemetry Gap`) | Sanctuary Trespass: `false`
   - Current Coordinates: `02°11'05"S 085°18'33"W` | Speed: `0.2 kts` | Heading: `210° SW` | Draft: `6.8m deep` (`+2.1m heavier — draft increased mid-sea`)
   - Route: Fuzhou, China `(100,110)` -> Manta, Ecuador `(900,260)` | Current SVG `(850,250)` | Protected Zone: `HIGH SEAS TRANSSHIPMENT BUFFER`
   - Waypoints:
     - `STOP #1`: `02°11'05"S, 085°18'33"W` (4.8h Dark Gap, 0.2 kts, hull-to-hull transfer)
     - `STOP #2`: `03°02'19"S, 086°40'11"W` (6.2h Dual Rafting alongside 2 unlicensed catcher boats, 0.3 kts)
   - Underwater Drone Recon Target: Hull-to-hull rubber fenders, submerged bilge discharge plume, Plimsoll draft line submerged `+2.1m` deeper than manifest (`6.8m`), dual anchor chains hanging in deep water.
   - DSA Algorithm: `Doubly Linked List (DLL) Gap Traversal & Temporal Delta Analysis` — `O(N)`

3. **V-003 ("DARK DRIFTER" / FV SOUTHERN STAR)**:
   - MMSI: `354921008` | IMO: `8872019` | Flag: Liberia (`LR`) | Type: Pelagic Longline Fishing Boat (58.0m, 1,250 GT)
   - Risk Score: `89` | Status: `CRITICAL` | AIS Status: `isOnline: true` (`14 mins ago`) | Sanctuary Trespass: `false`
   - Current Coordinates: `01°55'40"S 091°12'04"W` | Speed: `0.8 kts` | Heading: `045° NE` | Draft: `4.1m deep`
   - Route: Montevideo, Uruguay `(880,330)` -> Papeete, French Polynesia `(120,180)` | Current SVG `(160,170)` | Protected Zone: `NAZCA RIDGE SEAMOUNT BIOSPHERE`
   - Waypoints:
     - `STOP #1`: `01°55'40"S, 091°12'04"W` (19.2h Longline Drift at 0.8 kts; 80 miles of pelagic longlines deployed)
     - `STOP #2`: `02°28'15"S, 090°44'30"W` (14.5h Saw-tooth Netting over shark migration corridor)
   - Underwater Drone Recon Target: 80-mile baited pelagic monofilament longline curtain with thousands of steel J-hooks suspended at 35m–90m depth; live acoustic detection of Leatherback Sea Turtles and Whale Sharks near hooks.
   - DSA Algorithm: `Sliding Window Kinematic Velocity Scan & Pattern Clustering` — `O(W)`

4. **V-004 ("PHANTOM RUNNER" / FV POSEIDON VI)**:
   - MMSI: `224098410` | IMO: `9012845` | Flag: Vanuatu (`VU`) | Type: Deep Sea Industrial Trawler (67.4m, 2,100 GT)
   - Risk Score: `95` | Status: `CRITICAL` | AIS Status: `isOnline: true` (`2 mins ago - Fabricated Coordinates`, 142 NM SAR mismatch) | Sanctuary Trespass: `false`
   - Current Coordinates: `03°42'18"S 089°22'50"W` | Speed: `5.2 kts` | Heading: `320° NW` | Draft: `5.9m deep` (`+1.8m heavier`)
   - Route: Callao, Peru `(860,270)` -> Kaohsiung, Taiwan `(150,100)` | Current SVG `(190,135)` | Protected Zone: `PERU-CHILE TRENCH BENTHIC CORRIDOR`
   - Waypoints:
     - `STOP #1`: `03°42'18"S, 089°22'50"W` (38h AIS Spoofed 142 NM, deep trench bottom-trawling at 5.2 kts)
     - `STOP #2`: `04°15'35"S, 088°50'12"W` (54h Heavy Net Drag across deep seamounts)
   - Underwater Drone Recon Target: Heavy steel otter boards and benthic bottom-trawl dredge scraping cold-water coral seamounts at 280m depth, massive sediment turbidity plume, hydraulic winch cable tension telemetry.
   - DSA Algorithm: `Spatial Hash Mapping & SAR Discrepancy Cross-Check` — `O(1)`

#### B. ELEVATED RISK TARGETS (`ALERTIVE` — Risk Score 50–80)
5. **V-005 ("BOUNDARY BREAKER" / PACIFIC RAIDER)**:
   - Flag: Cook Islands (`CK`) | Type: High-Speed Trawler (62m) | Score: `74` | Status: `ALERTIVE` | Sanctuary Trespass: `true` ("Approaching marine protected area boundary at high speed")
   - Coordinates: `01°12'10"S 092°45'00"W` | Speed: `13.8 kts` | Heading: `120° SE` | Draft: `4.8m deep` | Route: Suva, Fiji -> Balboa, Panama (`MALPELO MARINE SANCTUARY BORDER`)
   - Underwater Target: High-RPM twin-screw propeller cavitation signature (`13.8 kts`), retracted mid-water trawl doors ready for rapid deployment, Quadtree boundary raycast vector line.
6. **V-006 ("SILENT SQUID" / ALBACORA I)**:
   - Flag: Belize (`BZ`) | Type: Jigging Vessel (55.4m) | Score: `68` | Status: `ALERTIVE`
   - Coordinates: `02°55'14"S 087°33'12"W` | Speed: `0.1 kts` (`000° Drift`) | Draft: `4.2m deep` | Route: Puntarenas, Costa Rica -> Guayaquil, Ecuador (`COCOS ISLAND BIOSPHERE RESERVE`)
   - Underwater Target: 45-minute dead-drift engine cooling intake inspection (verifying Captain's Two-Way Stoppage Report: auxiliary coolant pump repair vs. nocturnal 800 kW halogen squid-attracting light cone penetrating 60m underwater).
7. **V-007 ("ROUTE DRIFTER" / GOLDEN WAVE)**:
   - Flag: South Korea (`KR`) | Type: Longline Tuna Boat (51.2m) | Score: `65` | Status: `ALERTIVE`
   - Coordinates: `04°50'18"S 090°15'42"W` | Speed: `7.2 kts` (`285° WNW`) | Draft: `3.9m deep` | Route: Chimbote, Peru -> Busan, South Korea (`SPRFMO HIGH-SEAS TRENCH POCKET`)
   - Underwater Target: 68 NM off-track seamount detour inspection, secondary stern line-shooter housing, Dijkstra shortest-path deviation corridor overlay.

#### C. NORMAL COMMERCIAL & RESEARCH TRAFFIC (`NORMAL` — Risk Score < 50)
Include all 13 compliant vessels (`V-008` through `V-020`) with their exact coordinates, speeds, drafts, and underwater hull/keel profiles for baseline acoustic calibration:
- **V-008 ("MERIDIAN STAR" / MV MERIDIAN STAR)**: Germany (`DE`), Container Ship (282m), Score `12`, `00°45'10"N 086°12'00"W`, `18.5 kts`, `245° WSW`, Draft `12.4m`, San Antonio -> Yokohama.
- **V-009 ("ATLANTIC TRADER" / MV ATLANTIC TRADER)**: UK (`GB`), Bulk Ore Carrier (225m), Score `15`, `01°15'00"S 083°10'00"W`, `14.2 kts`, `190° S`, Draft `11.0m`, Punta Arenas -> Callao.
- **V-010 ("PACIFIC VOYAGER" / MV PACIFIC VOYAGER)**: Japan (`JP`), General Cargo (195m), Score `18`, `02°00'00"S 093°50'00"W`, `15.6 kts`, `270° W`, Draft `9.8m`, Manta -> Balboa.
- **V-011 ("NORDIC HORIZON" / LNG NORDIC HORIZON)**: Norway (`NO`), LNG Tanker (299m), Score `8`, `03°10'00"S 081°40'00"W`, `19.1 kts`, `160° SSE`, Draft `11.8m`, Panama -> Tokyo Bay.
- **V-012 ("CORAL NAVIGATOR" / MV CORAL NAVIGATOR)**: Netherlands (`NL`), Refrigerated Cargo (152m), Score `22`, `00°20'00"S 089°00'00"W`, `16.4 kts`, `225° SW`, Draft `7.5m`, Antofagasta -> Valparaíso (8 NM weather swell bypass).
- **V-013 ("EQUATORIAL DRIFT" / MT EQUATORIAL DRIFT)**: Singapore (`SG`), Chemical Tanker (145m), Score `14`, `01°40'00"S 086°50'00"W`, `13.0 kts`, `310° NW`, Draft `8.4m`, Balboa -> Buenaventura.
- **V-014 ("CAPE TRANSIT" / MV CAPE TRANSIT)**: Malta (`MT`), Pure Car & Truck Carrier (200m), Score `10`, `04°00'00"S 085°00'00"W`, `17.8 kts`, `135° SE`, Draft `9.0m`, Valparaíso -> Auckland.
- **V-015 ("ISLAND EXPRESS" / MV ISLAND EXPRESS)**: Ecuador (`EC`), Inter-Island Ferry (88m), Score `5`, `00°50'00"S 090°30'00"W`, `12.5 kts`, `080° ENE`, Draft `4.2m`, Santa Cruz -> San Cristóbal (electric-hybrid quiet acoustic signature).
- **V-016 ("OCEAN PIONEER" / RV OCEAN PIONEER)**: USA (`US`), Scientific Research (84m), Score `11`, `02°30'00"S 092°00'00"W`, `4.5 kts`, `180° S`, Draft `5.1m`, Callao -> Guayaquil (UNESCO multibeam bathymetric sonar array active).
- **V-017 ("BLUE CURRENT" / MT BLUE CURRENT)**: Panama (`PA`), Aframax Crude Tanker (245m), Score `16`, `03°30'00"S 084°00'00"W`, `13.5 kts`, `290° WNW`, Draft `13.5m`, Chimbote -> Callao.
- **V-018 ("AURORA BOREALIS" / CS AURORA BOREALIS)**: France (`FR`), Subsea Cable Repair (112m), Score `7`, `01°05'00"S 088°20'00"W`, `2.1 kts`, `015° NNE`, Draft `6.2m`, Valparaíso -> Arica (friendly maintenance ROV deployed on subsea fiber optic line).
- **V-019 ("HORIZON LEADER" / MT HORIZON LEADER)**: Liberia (`LR`), LPG Gas Carrier (180m), Score `13`, `04°30'00"S 087°00'00"W`, `16.0 kts`, `260° W`, Draft `8.9m`, Balboa -> San Antonio.
- **V-020 ("ZEPHYR TRADE" / MV ZEPHYR TRADE)**: Hong Kong (`HK`), Multi-Purpose Cargo (168m), Score `17`, `02°50'00"S 090°00'00"W`, `14.8 kts`, `330° NNW`, Draft `8.2m`, Antofagasta -> Kaohsiung.

---

### 2. SYNCHRONIZED VESSEL FILTERS (EXACT MATCH WITH AEGIS RADAR)
Include the exact multi-mode filter bar so the drone operator can filter which target ships appear in the Deployment Selector & Surface Mini-Radar:
1. **Threat Focus (Synced)**:
   - `HIGH_RISK` (**5 Ships**: `V-001`, `V-002`, `V-003`, `V-004`, `V-005` — matches `score >= 80 || sanctuaryTrespass || signalTurnedOff`)
   - `SANCTUARY` (**2 Ships**: `V-001`, `V-005` — vessels breaching or skimming Galápagos / Malpelo Marine Protected Area boundaries)
   - `SIGNAL_OFF` (**2 Ships**: `V-001`, `V-002` — dark fleet vessels with AIS transponder disabled / telemetry blackout)
   - `ALL` (Defers to Suspicion Level filter)
2. **Suspicion Level (`riskTier`)**:
   - `HIGH (>80)` (**4 Ships**: `V-001`, `V-004`, `V-002`, `V-003`)
   - `MEDIUM (50-80)` (**3 Ships**: `V-005`, `V-006`, `V-007`)
   - `ALL SHIPS` (**All 20 Ships**: `V-001` through `V-020`)
3. **Matrix Status Filter**:
   - `CRITICAL` (4), `ALERTIVE` (3), `NORMAL` (13), `ALL` (20)
4. **Country Flag & Gear Type Filter**:
   - Filterable by Flag (`Panama`, `China`, `Liberia`, `Vanuatu`, `Cook Islands`, `Belize`, `South Korea`, etc.) and Gear Type (`Net Trawlers`, `Longline Boats`, `Freezer Ships`, `Commercial/Research`).
5. **Live 2.5-Second Telemetry Ticker**:
   - Continuously oscillates each vessel's coordinates ($\pm 3''$ Lat/Lng), Speed Over Ground ($\pm 0.18\text{ kts}$), Heading ($\pm 2^\circ$), and Draft ($\pm 0.03\text{ m}$) using $\text{phase} = \text{tick} \times 0.4 + \text{vesselNum} \times 0.8$.

---

### 3. INTERACTIVE 3D SUBSEA VIEWPORT & DRONE FLIGHT CONTROLS
Build a real-time 3D underwater viewport (using Three.js / HTML5 Canvas) with keyboard (`WASD` + `Up/Down` depth, `Space` sonar ping, `B` Stack Backtrack, `C` Evidence Capture) and on-screen joystick/thruster controls:
1. **4 Optical & Acoustic Vision Modes**:
   - **Standard Low-Light Subsea Optical**: Deep-ocean volumetric fog, bioluminescent particles, dual LED floodlights, and caustic surface light rays.
   - **FLIR Thermal Infrared (`Thermal Hull & Discharge`)**: Highlights hot engine room cooling discharges, illegal nocturnal halogen light heat signatures (`V-006`), and warm-blooded marine megafauna (Hammerhead Sharks, Blue Whales, Leatherback Turtles).
   - **Multibeam Forward-Looking Sonar (`Bathymetric & Net Wireframe`)**: High-contrast cyan/emerald acoustic point-cloud wireframe rendering submerged trawl nets (`V-001`, `V-004`), 80-mile longline hooks (`V-003`), hull keels, and seamount trenches even in zero-visibility turbidity.
   - **Laser Draft & Plimsoll Profiler**: Projects a green laser grid onto the target ship's submerged hull to measure exact waterline draft displacement (e.g., verifying `V-001` is `+1.4m` overloaded at `5.2m` or `V-002` is `+2.1m` deeper at `6.8m`).
2. **Dynamic Underwater Scene Per Selected Ship**:
   - Renders the selected vessel's submerged 3D hull scaled to its exact `lengthMeters` and `calculatedDraft`, rotating propellers proportional to `sogKts`, plus vessel-specific underwater anomalies (illegal fine-mesh nets on `V-001`, rafted dual hulls on `V-002`, baited longline curtains on `V-003`, bottom-trawl dredge scraping coral on `V-004`, nocturnal 800kW light beams on `V-006`, scientific sonar beams on `V-016`, subsea fiber cable & friendly ROV on `V-018`).

---

### 4. INTERACTIVE DATA STRUCTURES & ALGORITHMS (DSA) SUBSEA MODULES
Integrate interactive visualizers for the core AEGIS underwater algorithms directly in the HUD:
1. **Stack (LIFO) Breadcrumb Backtracking & Emergency Retreat (`O(1)` Push/Pop)**:
   - As the AUV flies through underwater canyons, murky sediment plumes, or tangled fishing nets, every coordinate node `(x, y, depth, heading, timestamp)` is pushed onto a visual **LIFO Breadcrumb Stack**.
   - Clicking **"Trigger LIFO Stack Backtrack"** (or when acoustic tether signal drops below `-95 dBm` / net collision hazard triggers) automatically pops nodes in reverse order to pilot the drone safely back to the launch point with a 100% recovery rate.
2. **Circular Queue (Ring Buffer) Offline Hydrophone Telemetry (`O(1)` Enqueue/Dequeue)**:
   - Displays a live 16-slot **Circular Queue Ring Buffer** recording acoustic hydrophone packets (`propeller cavitation Hz`, `sonar ping dB`, `hull draft delta`, `encrypted hash`) when the drone dives below the thermocline and loses satellite link.
   - Includes a **"Simulate Signal Blackout / Surface & Flush Buffer"** toggle demonstrating zero data loss when reconnecting to `USCG CUTTER ARGUS`.
3. **Subsea Evidence Capture & Cryptographic Dossier Logger**:
   - Allows the operator to lock onto underwater infractions (e.g., illegal net mesh size, overloaded Plimsoll mark, severed acoustic beacon, entangled protected shark species), capture a timestamped sonar/optical frame, and append it to the vessel's court-admissible boarding dossier.
```
