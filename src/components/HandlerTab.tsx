import React, { useState } from 'react';
import { PurchaseOrder, DamageInspectionResult } from '../types/logistics.ts';
import { SAMPLE_SHIPMENTS } from '../utils/sampleShipments.ts';
import { Mic, MicOff, Send, Package, AlertTriangle, CheckCircle, ShieldAlert, ArrowRight, UploadCloud, FileText } from 'lucide-react';

interface HandlerTabProps {
  orders: PurchaseOrder[];
  isProcessing: boolean;
  onSubmitIntake: (rawText: string) => Promise<void>;
  onReceiveCargo: (poId: string, receiptRef?: string) => Promise<void>;
  onInspectDamage: (params: { poId: string; damagedBagsCount: number; damageNotes?: string; imageBase64?: string }) => Promise<DamageInspectionResult | null>;
  onCloseOrder: (poId: string) => Promise<void>;
}

export const HandlerTab: React.FC<HandlerTabProps> = ({
  orders,
  isProcessing,
  onSubmitIntake,
  onReceiveCargo,
  onInspectDamage,
  onCloseOrder,
}) => {
  const [inputText, setInputText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [selectedPoId, setSelectedPoId] = useState<string>(orders.find((p) => p.status === 'RECEIVED')?.id || orders[0]?.id || '');
  const [selectedSample, setSelectedSample] = useState(SAMPLE_SHIPMENTS[0]);
  const [customBagsDamaged, setCustomBagsDamaged] = useState<number>(20);
  const [inspectionResult, setInspectionResult] = useState<DamageInspectionResult | null>(null);
  const [isInspecting, setIsInspecting] = useState(false);
  const [closureError, setClosureError] = useState<string | null>(null);

  // Web Speech API Voice Recognition
  const toggleVoiceRecording = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Speech recognition is not supported in this browser. Please use text input or standard Chrome.');
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInputText(transcript);
        setIsListening(false);
      };

      recognition.onerror = () => {
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch (err) {
      console.warn('Speech recognition start failed:', err);
      setIsListening(false);
    }
  };

  const handleQuickSubmit = async (text: string) => {
    setInputText(text);
    await onSubmitIntake(text);
    setInputText('');
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    await onSubmitIntake(inputText.trim());
    setInputText('');
  };

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

  const selectedPo = orders.find((p) => p.id === selectedPoId);

  return (
    <div className="space-y-8">
      {/* 1. Ravi's Requisition Bar (Fastest Flow Entry Point) */}
      <section className="bg-white border border-slate-200 rounded-xl p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              Ravi's Logistics Intake & Requisition Terminal
            </h2>
            <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
              <span>FreshMart Central Warehouse Dock #4</span>
              <span aria-hidden="true">·</span>
              <span>Autonomous Order-to-Delivery Pipeline</span>
            </div>
          </div>

          {/* Quick preset triggers for judging demo */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-slate-400 font-medium mr-1">Demo Scenarios:</span>
            <button
              onClick={() => handleQuickSubmit('Need 500 bags of rice by Friday')}
              disabled={isProcessing}
              className="px-2.5 py-1 text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md transition-colors cursor-pointer"
            >
              500 bags Rice (Auto-Approved)
            </button>
            <button
              onClick={() => handleQuickSubmit('Urgent: 2,500 bags of premium basmati rice for next Monday')}
              disabled={isProcessing}
              className="px-2.5 py-1 text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md transition-colors cursor-pointer"
            >
              2,500 bags Basmati ($8,750 - Manager Review)
            </button>
            <button
              onClick={() => handleQuickSubmit('Order 150 sacks of flour by tomorrow morning')}
              disabled={isProcessing}
              className="px-2.5 py-1 text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md transition-colors cursor-pointer"
            >
              150 sacks Flour (Fast Flow)
            </button>
          </div>
        </div>

        {/* Natural Language + Voice Input Form */}
        <form onSubmit={handleFormSubmit} className="relative flex items-center gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder='Speak or type: e.g. "Need 500 bags of rice by Friday" or "Order 100 crates of farm milk"'
              disabled={isProcessing}
              className="w-full pl-4 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
            />
            <button
              type="button"
              onClick={toggleVoiceRecording}
              title={isListening ? 'Stop listening' : 'Start voice input (Speech to Text)'}
              className={`absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-md transition-colors cursor-pointer ${
                isListening ? 'bg-red-500 text-white animate-pulse' : 'text-slate-400 hover:text-slate-700'
              }`}
            >
              {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>
          </div>

          <button
            type="submit"
            disabled={isProcessing || !inputText.trim()}
            className="px-5 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-lg text-sm font-semibold flex items-center gap-2 transition-colors shrink-0 shadow-xs cursor-pointer"
          >
            <Send className="w-4 h-4" />
            <span>Launch Autopilot</span>
          </button>
        </form>

        <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
          <p>
            The <strong className="text-slate-700">Intake Agent</strong> normalizes voice/text to PO schema, and the <strong className="text-slate-700">Approval Agent</strong> runs instant policy verification in milliseconds.
          </p>
          <span className="font-mono text-emerald-600 font-semibold tabular-nums">SLA: &lt; 2.0s Fast Path</span>
        </div>
      </section>

      {/* 2. Active Orders Ledger */}
      <section className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="p-5 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Dock Procurement Orders & State Flow
            </h3>
            <span className="text-xs text-slate-500">
              Complete flow: from requisition through dual-document verification to closed ledger
            </span>
          </div>
          <span className="text-xs font-mono text-slate-500 tabular-nums">
            Total Orders: {orders.length}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">PO Identifier</th>
                <th className="py-3 px-4">Item & Specifications</th>
                <th className="py-3 px-4 text-right">Value (USD)</th>
                <th className="py-3 px-4">Assigned Supplier</th>
                <th className="py-3 px-4">Current Step</th>
                <th className="py-3 px-4">Delivery SLA</th>
                <th className="py-3 px-4 text-center">Receipt (GRN)</th>
                <th className="py-3 px-4 text-center">Invoice</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {orders.map((po) => {
                const isSelected = po.id === selectedPoId;
                return (
                  <tr
                    key={po.id}
                    onClick={() => setSelectedPoId(po.id)}
                    className={`hover:bg-slate-50 transition-colors cursor-pointer ${
                      isSelected ? 'bg-emerald-50/50' : ''
                    }`}
                  >
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                      {po.id}
                    </td>
                    <td className="py-3.5 px-4 font-medium text-slate-800">
                      <div>{po.item}</div>
                      <div className="text-[11px] text-slate-400">{po.requestId}</div>
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono tabular-nums text-slate-900 font-semibold">
                      ${po.estimatedValue.toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 text-slate-700 font-medium">
                      {po.supplierName || 'Evaluating...'}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`inline-block px-2 py-0.5 text-[11px] font-semibold rounded-md ${
                        po.status === 'CLOSED'
                          ? 'bg-slate-100 text-slate-800'
                          : po.status === 'ORDERED' || po.status === 'SHIPPED'
                          ? 'bg-blue-50 text-blue-700'
                          : po.status === 'RECEIVED'
                          ? 'bg-amber-50 text-amber-700'
                          : po.status === 'PENDING_MANAGER'
                          ? 'bg-purple-50 text-purple-700'
                          : po.status === 'REJECTED'
                          ? 'bg-red-50 text-red-700'
                          : 'bg-emerald-50 text-emerald-700'
                      }`}>
                        {po.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap">
                      {po.neededBy}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      {po.documents.receiptUploaded ? (
                        <span className="text-emerald-600 font-mono text-[11px] font-semibold">Verified</span>
                      ) : (
                        <span className="text-slate-400 font-mono text-[11px]">Missing</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      {po.documents.invoiceUploaded ? (
                        <span className="text-emerald-600 font-mono text-[11px] font-semibold">Verified</span>
                      ) : (
                        <span className="text-amber-600 font-mono text-[11px]">Missing</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      {po.status === 'SHIPPED' && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onReceiveCargo(po.id);
                          }}
                          className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded text-[11px] font-semibold cursor-pointer"
                        >
                          Receive Cargo
                        </button>
                      )}
                      {po.status === 'DOCS_COMPLETE' && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCloseAttempt(po.id);
                          }}
                          className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded text-[11px] font-semibold cursor-pointer"
                        >
                          Close PO
                        </button>
                      )}
                      {po.status === 'RECEIVED' && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedPoId(po.id);
                          }}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded text-[11px] font-semibold cursor-pointer"
                        >
                          Inspect
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* 3. Multimodal Inspection Dock & Feedback Loop Simulator */}
      <section className="bg-white border border-slate-200 rounded-xl p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200 mb-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1 rounded bg-purple-50 text-purple-700">
                <AlertTriangle className="w-4 h-4" />
              </span>
              <h3 className="text-base font-semibold text-slate-900">
                Multimodal Cargo Receiving & Quality Inspection Dock
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Ravi inspects delivered cargo: computer vision classifies damaged sacks, triggers the Outcome Agent, and activates the self-healing supplier loop!
            </p>
          </div>

          <div className="flex items-center gap-3">
            <label className="text-xs font-medium text-slate-600">Selected Order:</label>
            <select
              value={selectedPoId}
              onChange={(e) => setSelectedPoId(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-200 rounded-md px-3 py-1.5 font-mono font-semibold text-slate-800"
            >
              {orders.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.id}: {p.item} ({p.status})
                </option>
              ))}
            </select>
          </div>
        </div>

        {closureError && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 shrink-0 text-red-600" />
            <span><strong>Complete Flow Rule Enforced:</strong> {closureError}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Visual Cargo Evidence */}
          <div className="lg:col-span-5 space-y-4">
            <div className="text-xs font-semibold text-slate-800">
              1. Visual Evidence (Photo / Barcode / Packing Slip)
            </div>

            {/* Presets */}
            <div className="grid grid-cols-2 gap-2">
              {SAMPLE_SHIPMENTS.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setSelectedSample(s)}
                  className={`p-2.5 rounded-lg border text-left text-xs transition-colors cursor-pointer ${
                    selectedSample.id === s.id
                      ? 'border-emerald-600 bg-emerald-50/40 text-emerald-950 font-semibold'
                      : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700'
                  }`}
                >
                  <div className="truncate font-medium">{s.title}</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    {s.type === 'PRISTINE' ? '0 defects' : `${s.estimatedDamageCount} torn bags`}
                  </div>
                </button>
              ))}
            </div>

            {/* Visual Frame */}
            <div className="relative rounded-lg overflow-hidden border border-slate-200 bg-slate-900 aspect-4/3 flex items-center justify-center">
              <img
                src={selectedSample.dataUrl}
                alt={selectedSample.title}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
              <div className="absolute top-2 left-2 bg-slate-900/80 backdrop-blur-xs text-white text-[10px] font-mono px-2 py-0.5 rounded">
                DOCK CAM #4 · {selectedPo?.id || 'PO-105'}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <label className="text-xs font-medium text-slate-600 shrink-0">
                Damaged Unit Count:
              </label>
              <input
                type="number"
                min="0"
                max="500"
                value={customBagsDamaged}
                onChange={(e) => setCustomBagsDamaged(Number(e.target.value))}
                className="w-24 text-xs font-mono font-bold bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 text-slate-900 tabular-nums"
              />
              <span className="text-xs text-slate-400">bags / sacks</span>
            </div>
          </div>

          {/* Right Column: Multimodal Agent Reasoning & Outcome Impact */}
          <div className="lg:col-span-7 flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-slate-800">
                  2. Multimodal AI Inspection & Outcome Agent
                </span>
                <button
                  onClick={handleRunInspection}
                  disabled={isInspecting || !selectedPoId}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-semibold flex items-center gap-2 shadow-xs cursor-pointer"
                >
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>{isInspecting ? 'Analyzing Image...' : 'Run Multimodal Inspection'}</span>
                </button>
              </div>

              {inspectionResult ? (
                <div className="p-4 bg-purple-50/50 border border-purple-200 rounded-lg space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-purple-900">
                      Classification: {inspectionResult.damageLevel} DAMAGE DETECTED
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
                      <strong>Self-Healing Loop Triggered:</strong> Outcome Agent recalculated supplier score formula:
                      <div className="font-mono text-slate-600 mt-0.5">
                        score = 10 × (0.6 × on_time + 0.4 × (1 − damage))
                      </div>
                      The next rice procurement order will automatically divert to <span className="text-emerald-700 font-semibold">Golden Grain Corp</span>!
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-6 bg-slate-50 border border-slate-200 rounded-lg text-center text-xs text-slate-500">
                  Select a cargo visual and click <strong>"Run Multimodal Inspection"</strong> to simulate Ravi inspecting torn rice bags.
                  The agent will classify defects and autonomously recalculate supplier scorecards.
                </div>
              )}
            </div>

            {/* Document Checklist & Closure Action */}
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-800">
                  3. Complete Flow Guarantee: Dual-Doc Verification ({selectedPo?.id})
                </span>
                <span className="text-[11px] text-slate-500">
                  Both Receipt + Invoice required
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-white border border-slate-200 rounded flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-slate-500" />
                    <div>
                      <div className="text-xs font-medium text-slate-900">Goods Receipt (GRN)</div>
                      <div className="text-[11px] text-slate-400">
                        {selectedPo?.documents.receiptRef || 'Not yet uploaded'}
                      </div>
                    </div>
                  </div>
                  {selectedPo?.documents.receiptUploaded ? (
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <button
                      onClick={() => selectedPo && onReceiveCargo(selectedPo.id)}
                      className="px-2 py-1 bg-emerald-600 text-white rounded text-[11px] font-medium cursor-pointer"
                    >
                      Receive & Sign
                    </button>
                  )}
                </div>

                <div className="p-3 bg-white border border-slate-200 rounded flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-slate-500" />
                    <div>
                      <div className="text-xs font-medium text-slate-900">Commercial Invoice</div>
                      <div className="text-[11px] text-slate-400">
                        {selectedPo?.documents.invoiceRef || 'Pending supplier'}
                      </div>
                    </div>
                  </div>
                  {selectedPo?.documents.invoiceUploaded ? (
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <span className="text-[11px] font-mono text-amber-600 font-semibold">
                      Chaser Alert
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <span className="text-xs text-slate-500">
                  {selectedPo?.status === 'CLOSED'
                    ? 'Order is finalized and archived in ledger.'
                    : selectedPo?.documents.receiptUploaded && selectedPo?.documents.invoiceUploaded
                    ? 'All documents matched. Ready for closure!'
                    : 'Closure locked until supplier provides missing invoice.'}
                </span>

                {selectedPo?.status !== 'CLOSED' && (
                  <button
                    onClick={() => selectedPo && handleCloseAttempt(selectedPo.id)}
                    className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                  >
                    Attempt Closure (Verify Docs)
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
