// High quality inline SVG representations for shipment inspection testing
export interface SampleCargo {
  id: string;
  title: string;
  description: string;
  type: 'DAMAGED_TORN' | 'DAMAGED_CRUSH' | 'PRISTINE';
  estimatedDamageCount: number;
  dataUrl: string;
}

// Generate base64 SVG data URLs for instant offline multimodal inspection testing
function createSvgDataUrl(svgString: string): string {
  return `data:image/svg+xml;utf8,${encodeURIComponent(svgString)}`;
}

export const SAMPLE_SHIPMENTS: SampleCargo[] = [
  {
    id: 'sample-torn-rice',
    title: 'Torn Rice Sacks & Grain Spillage (PO-105 Sample)',
    description: 'Pallet of 300 burlap sacks with torn seams, visible grain leakage and damaged outer wrapping.',
    type: 'DAMAGED_TORN',
    estimatedDamageCount: 20,
    dataUrl: createSvgDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400">
        <rect width="600" height="400" fill="#2d3748"/>
        <!-- Pallet Base -->
        <rect x="50" y="320" width="500" height="30" fill="#8c6239" rx="4"/>
        <rect x="80" y="350" width="50" height="20" fill="#5c3a1e"/>
        <rect x="275" y="350" width="50" height="20" fill="#5c3a1e"/>
        <rect x="470" y="350" width="50" height="20" fill="#5c3a1e"/>
        
        <!-- Intact Sacks -->
        <rect x="70" y="240" width="130" height="75" fill="#d4b483" rx="10"/>
        <rect x="210" y="240" width="130" height="75" fill="#d4b483" rx="10"/>
        <rect x="350" y="240" width="130" height="75" fill="#c6a16e" rx="10"/>
        
        <!-- Damaged Sacks with Tears & Spill -->
        <rect x="130" y="160" width="140" height="75" fill="#bfa074" rx="10"/>
        <!-- Jagged Tear on burlap -->
        <path d="M 160 180 L 175 210 L 195 195 L 210 225 L 225 190" stroke="#78350f" stroke-width="4" fill="none"/>
        <ellipse cx="190" cy="205" rx="18" ry="12" fill="#451a03"/>
        
        <!-- Rice Grain Spillage -->
        <circle cx="185" cy="235" r="3" fill="#fef08a"/>
        <circle cx="195" cy="242" r="2.5" fill="#fef08a"/>
        <circle cx="210" cy="250" r="3" fill="#fef08a"/>
        <circle cx="170" cy="255" r="2" fill="#fef08a"/>
        <circle cx="180" cy="268" r="2.5" fill="#fef08a"/>
        <circle cx="230" cy="275" r="3" fill="#fef08a"/>
        <circle cx="200" cy="290" r="3.5" fill="#fef08a"/>
        <circle cx="215" cy="305" r="3" fill="#fef08a"/>
        <circle cx="190" cy="318" r="4" fill="#fef08a"/>
        <circle cx="240" cy="315" r="3" fill="#fef08a"/>
        <path d="M 170 320 Q 220 310 270 320" stroke="#fef08a" stroke-width="8" stroke-linecap="round"/>

        <!-- Defect Tag Overlay -->
        <rect x="380" y="80" width="170" height="80" fill="#b91c1c" rx="6"/>
        <text x="465" y="112" fill="#ffffff" font-family="sans-serif" font-weight="bold" font-size="14" text-anchor="middle">DEFECT IDENTIFIED</text>
        <text x="465" y="132" fill="#fecaca" font-family="sans-serif" font-size="12" text-anchor="middle">20 Torn Sacks / Spillage</text>
        <text x="465" y="148" fill="#fecaca" font-family="sans-serif" font-size="11" text-anchor="middle">Transit Damage Flagged</text>
      </svg>
    `),
  },
  {
    id: 'sample-pristine-delivery',
    title: 'Certified Pristine Grain Delivery (Clean Pass)',
    description: 'Pallet of 500 bags with intact hermetic wrap, unbroken seals, and barcode verified.',
    type: 'PRISTINE',
    estimatedDamageCount: 0,
    dataUrl: createSvgDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400">
        <rect width="600" height="400" fill="#1e293b"/>
        <!-- Pallet Base -->
        <rect x="50" y="320" width="500" height="30" fill="#8c6239" rx="4"/>
        <rect x="80" y="350" width="50" height="20" fill="#5c3a1e"/>
        <rect x="275" y="350" width="50" height="20" fill="#5c3a1e"/>
        <rect x="470" y="350" width="50" height="20" fill="#5c3a1e"/>
        
        <!-- Clean Stacked Sacks -->
        <rect x="70" y="240" width="130" height="75" fill="#38bdf8" rx="8" opacity="0.9"/>
        <rect x="210" y="240" width="130" height="75" fill="#38bdf8" rx="8" opacity="0.9"/>
        <rect x="350" y="240" width="130" height="75" fill="#38bdf8" rx="8" opacity="0.9"/>
        <rect x="140" y="160" width="130" height="75" fill="#0284c7" rx="8" opacity="0.9"/>
        <rect x="280" y="160" width="130" height="75" fill="#0284c7" rx="8" opacity="0.9"/>
        
        <!-- Clear Wrap / Security Bands -->
        <line x1="60" y1="200" x2="490" y2="200" stroke="#bae6fd" stroke-width="4" stroke-dasharray="10 5"/>
        <line x1="60" y1="280" x2="490" y2="280" stroke="#bae6fd" stroke-width="4" stroke-dasharray="10 5"/>

        <!-- Quality Stamp Tag -->
        <circle cx="480" cy="120" r="45" fill="#15803d"/>
        <text x="480" y="115" fill="#ffffff" font-family="sans-serif" font-weight="bold" font-size="12" text-anchor="middle">QUALITY PASS</text>
        <text x="480" y="132" fill="#bbf7d0" font-family="sans-serif" font-size="11" text-anchor="middle">0 Defects</text>
      </svg>
    `),
  },
];
