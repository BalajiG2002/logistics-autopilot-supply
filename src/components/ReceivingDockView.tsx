import React, { useState } from 'react';
import { PurchaseOrder, DamageInspectionResult } from '../types/logistics.ts';
import { SAMPLE_SHIPMENTS } from '../utils/sampleShipments.ts';
import { Truck, CheckCircle2, AlertTriangle, ShieldAlert, FileText, ArrowRight } from 'lucide-react';

interface ReceivingDockViewProps {
  orders: PurchaseOrder[];
  isProcessing: boolean;
  onReceiveCargo: (poId: string, receiptRef?: string) => Promise<void>;
  onInspectDamage: (params: { poId: string; damagedBagsCount: number; damageNotes?: string; imageBase64?: string }) => Promise<DamageInspectionResult | null>;
  onCloseOrder: (poId: string) => Promise<void>;
  onSelectOrder: (order: PurchaseOrder) => void;
}

export const ReceivingDockView: React.FC<ReceivingDockViewProps> = ({
  orders,
  isProcessing,
  onReceiveCargo,
  onInspectDamage,
  onCloseOrder,
  onSelectOrder,
}) => {
  const [selectedPoId, setSelectedPoId] = useState<string>(
    orders.find((p) => p.status === 'RECEIVED')?.id || orders[0]?.id || ''
  );
  const [selectedSample, setSelectedSample] = useState(SAMPLE_SHIPMENTS[0]);
  const [customBagsDamaged, setCustomBagsDamaged] = useState<number>(20);
  const [inspectionResult, setInspectionResult] = useState<DamageInspectionResult | null>(null);
  const [isInspecting, setIsInspecting] = useState(false);
  const [closureError, setClosureError] = useState<string | null>(null);

  const selectedPo = orders.find((p) => p.id === selectedPoId);

  const handleRunInspection = async () => {
    if (!selectedPoId) return;
    setIsInspecting(true);
    setClosureError(null);
    try {
      const res = await onInspectDamage({
        poId: selectedPoId,
        damagedBagsCount: customBagsDamaged,
        damageNotes: `${customBagsDamaged} bags damaged with torn seams and spillage`,
        imageBase64: selectedSample.dataUrl,
      });
      setInspectionResult(res);
    } finally {
      setIsInspecting(false);
    }
  };

  const handleCloseAttempt = async (poId: string) => {
    setClosureError(null);
    try {
      await onCloseOrder(poId);
    } catch (err: any) {
      setClosureError(err.message || 'Complete flow check failed');
    }
  };

  const dockOrders = orders.filter((o) => o.status === 'SHIPPED' || o.status === 'RECEIVED' || o.status === 'DOCS_COMPLETE');

  return (
    <div className="space-y-6">
      {/* Dock Queue Strip */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Warehouse Dock Receiving & Inspection Terminal
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Central Dock #4 · Verify incoming physical cargo, run computer vision damage checks, and issue Goods Receipt Notes (GRN).
            </p>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold text-slate-600">Active Cargo:</label>
            <select
              value={selectedPoId}
              onChange={(e) => setSelectedPoId(e.target.value)}
              className="text-xs font-mono font-bold bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800"
            >
              {dockOrders.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.id}: {o.item} ({o.status})
                </option>
              ))}
            </select>
          </div>
        </div>

        {closureError && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 shrink-0 text-red-600" />
            <span><strong>Documentation Requirement:</strong> {closureError}</span>
          </div>
        )}

        {/* Selected Order Summary Banner */}
        {selectedPo && (
          <div className="mt-4 p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-slate-900 text-sm">{selectedPo.id}</span>
                <span className="text-slate-400">·</span>
                <span className="font-semibold text-slate-800">{selectedPo.item}</span>
                <span className="text-slate-400">·</span>
                <span className="px-2 py-0.5 rounded font-mono font-bold bg-slate-200 text-slate-900 text-[11px]">
                  {selectedPo.status}
                </span>
              </div>
              <div className="text-slate-500">
                Supplier: <strong>{selectedPo.supplierName}</strong> · Value: <strong className="font-mono tabular-nums">${selectedPo.estimatedValue.toLocaleString()}</strong> · Needed: {selectedPo.neededBy}
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {selectedPo.status === 'SHIPPED' && (
                <button
                  onClick={() => onReceiveCargo(selectedPo.id)}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-semibold cursor-pointer shadow-xs"
                >
                  Confirm Physical Delivery & Sign GRN
                </button>
              )}

              {selectedPo.status === 'DOCS_COMPLETE' && (
                <button
                  onClick={() => handleCloseAttempt(selectedPo.id)}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-semibold cursor-pointer shadow-xs"
                >
                  Verify & Close Order
                </button>
              )}

              <button
                onClick={() => onSelectOrder(selectedPo)}
                className="px-3 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg font-semibold hover:bg-slate-100 cursor-pointer"
              >
                Track Lifecycle →
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Multimodal Damage Inspection Dock */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Visual Cargo Frame */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-4">
          <div className="text-xs font-bold text-slate-900 uppercase tracking-wider">
            1. Shipment Photography & Barcode Verification
          </div>

          <div className="grid grid-cols-2 gap-2">
            {SAMPLE_SHIPMENTS.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setSelectedSample(s)}
                className={`p-2.5 rounded-lg border text-left text-xs transition-colors cursor-pointer ${
                  selectedSample.id === s.id
                    ? 'border-emerald-600 bg-emerald-50/50 text-emerald-950 font-semibold'
                    : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700'
                }`}
              >
                <div className="truncate font-medium">{s.title}</div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  {s.type === 'PRISTINE' ? 'Clean Cargo (0 defects)' : `${s.estimatedDamageCount} torn bags`}
                </div>
              </button>
            ))}
          </div>

          <div className="relative rounded-lg overflow-hidden border border-slate-200 bg-slate-900 aspect-4/3 flex items-center justify-center">
            <img
              src={selectedSample.dataUrl}
              alt={selectedSample.title}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />
            <div className="absolute top-2 left-2 bg-slate-900/80 backdrop-blur-xs text-white text-[10px] font-mono px-2 py-0.5 rounded">
              DOCK RECEIVING CAM · {selectedPo?.id || 'PO-105'}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <label className="text-xs font-semibold text-slate-700 shrink-0">
              Damaged Unit Count:
            </label>
            <input
              type="number"
              min="0"
              max="500"
              value={customBagsDamaged}
              onChange={(e) => setCustomBagsDamaged(Number(e.target.value))}
              className="w-24 text-xs font-mono font-bold bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-900 tabular-nums"
            />
            <span className="text-xs text-slate-400">damaged units</span>
          </div>
        </div>

        {/* Right Column: AI Analysis & Outcome Recalculation */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-5 shadow-2xs flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                2. AI Multimodal Quality Inspection
              </span>
              <button
                onClick={handleRunInspection}
                disabled={isInspecting || !selectedPoId}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-semibold flex items-center gap-2 shadow-xs cursor-pointer"
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>{isInspecting ? 'Analyzing Cargo Photo...' : 'Run Multimodal Inspection'}</span>
              </button>
            </div>

            {inspectionResult ? (
              <div className="p-4 bg-purple-50/50 border border-purple-200 rounded-lg space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-purple-900">
                    Defect Classification: {inspectionResult.damageLevel} DAMAGE
                  </span>
                  <span className="font-mono text-purple-700 font-bold tabular-nums">
                    Confidence: {(inspectionResult.confidenceScore * 100).toFixed(0)}%
                  </span>
                </div>

                <p className="text-xs text-purple-950 leading-relaxed">
                  {inspectionResult.analysisSummary}
                </p>

                <div className="grid grid-cols-2 gap-3 text-xs pt-2 border-t border-purple-200">
                  <div>
                    <span className="text-purple-600 block text-[11px]">Damaged Items</span>
                    <strong className="text-purple-950 font-mono text-sm tabular-nums">
                      {inspectionResult.damagedBagsCount} units ({inspectionResult.damagePercentage.toFixed(1)}%)
                    </strong>
                  </div>
                  <div>
                    <span className="text-purple-600 block text-[11px]">Supplier Penalty</span>
                    <strong className="text-red-600 font-mono text-sm tabular-nums">
                      -{inspectionResult.scorePenalty.toFixed(1)} Rating Pts
                    </strong>
                  </div>
                </div>

                <div className="bg-white p-2.5 rounded border border-purple-200 text-[11px] text-purple-900 flex items-start gap-2">
                  <ShieldAlert className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
                  <div>
                    <strong>Outcome Agent Executed:</strong> Score updated via formula:
                    <div className="font-mono text-slate-600 mt-0.5">
                      score = 10 × (0.6 × on_time + 0.4 × (1 − damage))
                    </div>
                    Vendor rating adjusted in real time. Future grain requisitions will failover to top-rated vendors.
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-6 bg-slate-50 border border-slate-200 rounded-lg text-center text-xs text-slate-500">
                Select a cargo photo and click <strong>"Run Multimodal Inspection"</strong> to evaluate packaging integrity and adjust the supplier scorecard.
              </div>
            )}
          </div>

          {/* Dual-Doc Verification Invariant */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800">
                3. Dual-Document Closure Check ({selectedPo?.id})
              </span>
              <span className="text-[11px] text-slate-500 font-mono">
                Receipt (GRN) + Invoice
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-white border border-slate-200 rounded-lg flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold text-slate-900">Goods Receipt (GRN)</div>
                  <div className="text-[11px] text-slate-400 font-mono">
                    {selectedPo?.documents.receiptRef || 'Not issued'}
                  </div>
                </div>
                {selectedPo?.documents.receiptUploaded ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                ) : (
                  <button
                    onClick={() => selectedPo && onReceiveCargo(selectedPo.id)}
                    className="px-2 py-1 bg-emerald-600 text-white rounded text-[11px] font-semibold cursor-pointer"
                  >
                    Sign GRN
                  </button>
                )}
              </div>

              <div className="p-3 bg-white border border-slate-200 rounded-lg flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold text-slate-900">Commercial Invoice</div>
                  <div className="text-[11px] text-slate-400 font-mono">
                    {selectedPo?.documents.invoiceRef || 'Pending supplier'}
                  </div>
                </div>
                {selectedPo?.documents.invoiceUploaded ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                ) : (
                  <span className="text-[11px] font-mono text-amber-600 font-bold">
                    Missing
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <span className="text-xs text-slate-500">
                {selectedPo?.status === 'CLOSED'
                  ? 'Order is finalized and archived.'
                  : selectedPo?.documents.receiptUploaded && selectedPo?.documents.invoiceUploaded
                  ? 'All documents matched. Ready to close.'
                  : 'Order cannot close until commercial invoice is provided.'}
              </span>

              {selectedPo?.status !== 'CLOSED' && (
                <button
                  onClick={() => selectedPo && handleCloseAttempt(selectedPo.id)}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg cursor-pointer"
                >
                  Finalize & Close
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
