import { jsPDF } from 'jspdf';
import { TargetVessel } from '../types';

export function generateVesselPdfReport(vessel: TargetVessel): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;

  // Header Banner Background (Dark Maritime Navy)
  doc.setFillColor(11, 22, 38);
  doc.rect(0, 0, pageWidth, 32, 'F');

  // Decorative Accent Strip (Sky Blue)
  doc.setFillColor(2, 132, 199);
  doc.rect(0, 31, pageWidth, 1.5, 'F');

  // Header Titles
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text('AEGIS NAVAL PATROL & SURVEILLANCE DOSSIER', margin, 11);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(186, 230, 253);
  doc.text(`TARGET DESIGNATION: "${vessel.nickname}" [${vessel.vesselCode}] • ${vessel.name}`, margin, 17);

  const timestamp = new Date().toUTCString();
  doc.setFontSize(7.5);
  doc.setTextColor(148, 163, 184);
  doc.text(`ISSUED: ${timestamp} | REF: AEGIS-DSA-${vessel.vesselCode}-${vessel.mmsi.slice(0, 4)}`, margin, 23);
  doc.text(`ALGORITHMIC CORE: ${vessel.algorithmUsed || 'Graph Traversal'} (${vessel.dsaComplexity || 'O(V+E)'})`, margin, 28);

  // Status Badge on Top Right
  const isCritical = vessel.dashboardStatus === 'CRITICAL';
  const isAlertive = vessel.dashboardStatus === 'ALERTIVE';
  const badgeColor = isCritical ? [239, 68, 68] : isAlertive ? [245, 158, 11] : [16, 185, 129];

  doc.setFillColor(badgeColor[0], badgeColor[1], badgeColor[2]);
  doc.roundedRect(pageWidth - margin - 42, 7, 42, 16, 2, 2, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text(`${vessel.dashboardStatus} ALERT`, pageWidth - margin - 39, 13);
  doc.setFontSize(7.5);
  doc.text(`THREAT SCORE: ${vessel.score}/100`, pageWidth - margin - 39, 18);

  let currentY = 38;

  // Helper function to draw section header
  const drawSectionHeader = (title: string, y: number) => {
    doc.setFillColor(241, 245, 249);
    doc.rect(margin, y, contentWidth, 6.5, 'F');
    doc.setFillColor(2, 132, 199);
    doc.rect(margin, y, 2.5, 6.5, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(15, 23, 42);
    doc.text(title, margin + 5, y + 4.5);
    return y + 9;
  };

  // 1. Target Vessel Identification Section
  currentY = drawSectionHeader('1. TARGET VESSEL SPECIFICATIONS & TACTICAL PROFILE', currentY);

  const idCol1X = margin + 2;
  const idCol2X = margin + (contentWidth / 2) + 2;

  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);

  const idRows = [
    { label1: 'Tactical Nickname:', val1: `"${vessel.nickname}" (${vessel.vesselCode})`, label2: 'Flag of Registry:', val2: `${vessel.flag} (${vessel.flagCode})` },
    { label1: 'Commercial Name:', val1: vessel.name, label2: 'Ship Classification:', val2: vessel.type },
    { label1: 'MMSI Number:', val1: vessel.mmsi, label2: 'IMO Number:', val2: vessel.imo },
    { label1: 'Radio Callsign:', val1: vessel.callsign, label2: 'Displacement / Draft:', val2: `${vessel.displacement} • ${vessel.calculatedDraft}` },
    { label1: 'Beneficial Owner:', val1: vessel.beneficialOwner, label2: 'RFMO Authorization:', val2: vessel.rfmoAuthorization },
  ];

  idRows.forEach((r) => {
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(71, 85, 105);
    doc.text(r.label1, idCol1X, currentY);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(15, 23, 42);
    doc.text(r.val1, idCol1X + 34, currentY);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(71, 85, 105);
    doc.text(r.label2, idCol2X, currentY);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(15, 23, 42);
    doc.text(r.val2, idCol2X + 34, currentY);

    currentY += 4.5;
  });

  currentY += 2;

  // 2. Behavioral Pattern & Algorithmic Trigger from 20-Vessel Matrix
  currentY = drawSectionHeader('2. BEHAVIORAL PATTERN & ALGORITHMIC TRIGGER (AEGIS SPEC)', currentY);

  doc.setFillColor(254, 242, 242);
  doc.roundedRect(margin, currentY, contentWidth, 16, 1.5, 1.5, 'F');
  doc.setDrawColor(252, 165, 165);
  doc.roundedRect(margin, currentY, contentWidth, 16, 1.5, 1.5, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(185, 28, 28);
  doc.text('ALGORITHMIC TRIGGER:', margin + 3, currentY + 4.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(15, 23, 42);
  doc.text(vessel.behavioralTrigger, margin + 38, currentY + 4.5);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(2, 132, 199);
  doc.text('SYSTEM DISPATCH ACTION:', margin + 3, currentY + 9.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(15, 23, 42);
  doc.text(vessel.systemAction, margin + 38, currentY + 9.5);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(100, 116, 139);
  doc.text('DATA STRUCTURE / DSA:', margin + 3, currentY + 13.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(15, 23, 42);
  doc.text(`${vessel.algorithmUsed} [${vessel.dsaComplexity}]`, margin + 38, currentY + 13.5);

  currentY += 19;

  // 3. Intercepted Live Telemetry Section
  currentY = drawSectionHeader('3. INTERCEPTED SATELLITE TELEMETRY & NAVIGATIONAL DATA', currentY);

  const telemetryBoxWidth = contentWidth / 4;
  const telemetryData = [
    { label: 'COORDINATES', val: vessel.currentCoordinates, sub: 'Satellite Pinpointed' },
    { label: 'SPEED (SOG)', val: `${vessel.sogKts} knots`, sub: 'Velocity Telemetry' },
    { label: 'HEADING (COG)', val: `${vessel.cogDeg}° (${vessel.cogDirection})`, sub: 'Course Vector' },
    { label: 'SPOOFING RISK', val: vessel.aisSpoofingRisk.split(' ')[0], sub: 'Spatial Hash Cross-check' },
  ];

  telemetryData.forEach((t, i) => {
    const boxX = margin + i * telemetryBoxWidth;
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(boxX, currentY, telemetryBoxWidth - 2, 14, 1.5, 1.5, 'F');
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(boxX, currentY, telemetryBoxWidth - 2, 14, 1.5, 1.5, 'S');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(100, 116, 139);
    doc.text(t.label, boxX + 2.5, currentY + 4);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(2, 132, 199);
    doc.text(t.val, boxX + 2.5, currentY + 8.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6);
    doc.setTextColor(71, 85, 105);
    doc.text(t.sub, boxX + 2.5, currentY + 12);
  });

  currentY += 17;

  // 4. AEGIS Target Performance Metrics & SDG 14 Impact
  currentY = drawSectionHeader('4. AEGIS ALGORITHMIC PERFORMANCE & SDG 14 MARINE WILDLIFE IMPACT', currentY);

  const dsaKpiBoxWidth = contentWidth / 3;
  const dsaKpis = [
    { title: 'DETECTION RATE', val: '+87% Improvement', sub: 'Graph Traversal (BFS/Dijkstra)' },
    { title: 'MONITORED AREA', val: '+340% Expansion', sub: 'Spatial Hash & Quadtrees' },
    { title: 'RESPONSE DISPATCH', val: '6 hrs -> 42 min', sub: 'Priority Queue (Max-Heap)' },
  ];

  dsaKpis.forEach((k, i) => {
    const boxX = margin + i * dsaKpiBoxWidth;
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(boxX, currentY, dsaKpiBoxWidth - 2, 13, 1.5, 1.5, 'F');
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(boxX, currentY, dsaKpiBoxWidth - 2, 13, 1.5, 1.5, 'S');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(100, 116, 139);
    doc.text(k.title, boxX + 3, currentY + 4);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(16, 185, 129);
    doc.text(k.val, boxX + 3, currentY + 8);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6);
    doc.setTextColor(71, 85, 105);
    doc.text(k.sub, boxX + 3, currentY + 11.5);
  });

  currentY += 16;

  // SDG 14 Impact Note
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(185, 28, 28);
  doc.text('SDG 14 BIODIVERSITY RISK:', margin + 2, currentY);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text(
    'IUU fishing causes $10-$23.5B economic damage annually. Threatens 100M sharks, 70M seahorses, and 16 sea cucumber species.',
    margin + 42,
    currentY
  );
  currentY += 5;

  // 5. Legal Enforcement Basis Section
  currentY = drawSectionHeader('5. LEGAL ENFORCEMENT BASIS (UNCLOS & SDG 14 MANDATES)', currentY);

  doc.setFillColor(254, 242, 242);
  doc.roundedRect(margin, currentY, contentWidth, 20, 1.5, 1.5, 'F');
  doc.setDrawColor(252, 165, 165);
  doc.roundedRect(margin, currentY, contentWidth, 20, 1.5, 1.5, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(185, 28, 28);
  doc.text('TREATY: UN CONVENTION ON THE LAW OF THE SEA (UNCLOS ARTICLES 62, 73 & 111)', margin + 3, currentY + 4.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(69, 10, 10);
  doc.text(
    '1. Sovereign coastal rights for conservation of biological resources in marine protected polygons.\n' +
    '2. Valid invocation of Right of Hot Pursuit (Art. 111) via continuous satellite radar and transponder audit trail.\n' +
    '3. Coast guard cutters and patrol assets authorized to intercept, board, seize fish holds, and escort to nearest port.',
    margin + 3,
    currentY + 9
  );

  currentY += 24;

  // Sign-off
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(15, 23, 42);
  doc.text('AUTHORIZING COMMAND:', margin + 2, currentY + 3);
  doc.setFont('helvetica', 'normal');
  doc.text('Cmdr. Elena Rostova — Senior Maritime Enforcement Officer, AEGIS Operations', margin + 42, currentY + 3);

  doc.setFont('helvetica', 'bold');
  doc.text('INTERDICTION ASSET:', margin + 2, currentY + 7);
  doc.setFont('helvetica', 'normal');
  doc.text(`USCGC Vigilant (WMEC-617) • Action Directive: ${vessel.systemAction}`, margin + 42, currentY + 7);

  // Footer banner
  doc.setFillColor(15, 23, 42);
  doc.rect(0, pageHeight - 11, pageWidth, 11, 'F');

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184);
  doc.text('CONFIDENTIAL // LAW ENFORCEMENT SENSITIVE • AEGIS ALGORITHMIC SURVEILLANCE', margin, pageHeight - 4.5);
  doc.text('PAGE 1 OF 1', pageWidth - margin - 18, pageHeight - 4.5);

  // Save the PDF directly to client
  const filename = `${vessel.vesselCode}_${vessel.nickname.replace(/\s+/g, '_')}_AEGIS_Dossier.pdf`;
  doc.save(filename);
}
