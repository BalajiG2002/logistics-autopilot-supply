import React, { useState } from 'react';
import { PurchaseOrder, Supplier, PolicyConfig } from '../types/logistics.ts';
import { Check, X, Sliders, TrendingUp, Sparkles, AlertCircle, ArrowUpRight } from 'lucide-react';

interface ManagerTabProps {
  orders: PurchaseOrder[];
  suppliers: Supplier[];
  policy: PolicyConfig;
  isProcessing: boolean;
  onApprovalAction: (poId: string, action: 'APPROVE' | 'REJECT', notes?: string) => Promise<void>;
  onUpdatePolicy: (policy: Partial<PolicyConfig>) => Promise<void>;
  onFetchInsights: () => Promise<string>;
}

export const ManagerTab: React.FC<ManagerTabProps> = ({
  orders,
  suppliers,
  policy,
  isProcessing,
  onApprovalAction,
  onUpdatePolicy,
  onFetchInsights,
}) => {
  const [valueLimit, setValueLimit] = useState(policy.autoApprovalValueLimit);
  const [minScore, setMinScore] = useState(policy.minimumSupplierScore);
  const [chaseHours, setChaseHours] = useState(policy.chaseIntervalHours);
  const [policySaved, setPolicySaved] = useState(false);
  const [insightText, setInsightText] = useState<string | null>(null);
  const [isLoadingInsight, setIsLoadingInsight] = useState(false);
  const [rejectNote, setRejectNote] = useState('');
  const [activeRejectId, setActiveRejectId] = useState<string | null>(null);

  const pendingExceptions = orders.filter((p) => p.status === 'PENDING_MANAGER');

  const handleSavePolicy = async (e: React.FormEvent) => {
    e.preventDefault();
    await onUpdatePolicy({
      autoApprovalValueLimit: Number(valueLimit),
      minimumSupplierScore: Number(minScore),
      chaseIntervalHours: Number(chaseHours),
    });
    setPolicySaved(true);
    setTimeout(() => setPolicySaved(false), 3000);
  };

  const handleGenerateInsights = async () => {
    setIsLoadingInsight(true);
    try {
      const summary = await onFetchInsights();
      setInsightText(summary);
    } finally {
      setIsLoadingInsight(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* 1. Executive Exception Approval Queue */}
      <section className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1 rounded bg-purple-50 text-purple-700">
                <AlertCircle className="w-4 h-4" />
              </span>
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Meena's Executive Approval Queue (Exceptions Only)
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              The Autopilot auto-approves compliant orders. Meena only reviews policy threshold breaches with 1-line AI syntheses.
            </p>
          </div>
          <span className="text-xs font-mono font-semibold px-2.5 py-1 bg-purple-50 text-purple-800 rounded-md tabular-nums self-start sm:self-auto">
            {pendingExceptions.length} Action Items Pending
          </span>
        </div>

        {pendingExceptions.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500">
            <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-2">
              <Check className="w-5 h-5" />
            </div>
            <strong>Zero Manager Bottlenecks.</strong>
            <p className="mt-1 text-slate-400">
              All active orders have either passed autonomous rules or are already being fulfilled by suppliers.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {pendingExceptions.map((po) => {
              return (
                <div key={po.id} className="p-5 hover:bg-slate-50/50 transition-colors">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="space-y-1.5 max-w-3xl">
                      <div className="flex items-center gap-3">
                        <span className="font-mono font-bold text-slate-900 text-sm">{po.id}</span>
                        <span className="text-slate-400">·</span>
                        <span className="text-sm font-medium text-slate-800">{po.item}</span>
                        <span className="text-slate-400">·</span>
                        <span className="font-mono font-bold text-slate-900 tabular-nums">
                          ${po.estimatedValue.toLocaleString()}
                        </span>
                      </div>

                      <div className="text-xs text-purple-900 bg-purple-50 p-2.5 rounded-lg border border-purple-200">
                        <strong className="text-purple-700 font-semibold mr-1">AI Executive Summary:</strong>
                        {po.managerAiSummary || 'Order value exceeds autonomous policy limit. Review required.'}
                      </div>

                      <div className="flex items-center gap-4 text-xs text-slate-500 pt-0.5">
                        <span>Requisitioned by {po.handlerName}</span>
                        <span>·</span>
                        <span>Candidate Supplier: <strong>{po.supplierName}</strong></span>
                        <span>·</span>
                        <span>Required: {po.neededBy}</span>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-2 shrink-0">
                      {activeRejectId === po.id ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            placeholder="Reason for rejection..."
                            value={rejectNote}
                            onChange={(e) => setRejectNote(e.target.value)}
                            className="text-xs px-2.5 py-1.5 border border-slate-200 rounded bg-white text-slate-800"
                          />
                          <button
                            onClick={() => {
                              onApprovalAction(po.id, 'REJECT', rejectNote);
                              setActiveRejectId(null);
                              setRejectNote('');
                            }}
                            className="px-3 py-1.5 bg-red-600 text-white rounded text-xs font-semibold cursor-pointer"
                          >
                            Confirm Reject
                          </button>
                          <button
                            onClick={() => setActiveRejectId(null)}
                            className="p-1.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <>
                          <button
                            onClick={() => setActiveRejectId(po.id)}
                            disabled={isProcessing}
                            className="px-3 py-2 bg-slate-100 hover:bg-red-50 hover:text-red-700 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" />
                            <span>Reject</span>
                          </button>
                          <button
                            onClick={() => onApprovalAction(po.id, 'APPROVE')}
                            disabled={isProcessing}
                            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>1-Click Approve</span>
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* 2. Grid: Policy Rules & Supplier League Table */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Autonomous Policy Settings */}
        <section className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="p-1 rounded bg-slate-100 text-slate-700">
                <Sliders className="w-4 h-4" />
              </span>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Governance & Policy Rules
              </h3>
            </div>
            <p className="text-xs text-slate-500 mb-5">
              The Approval Agent evaluates every incoming order against these boundaries before dispatch.
            </p>

            <form onSubmit={handleSavePolicy} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Autonomous Auto-Approval Limit (USD)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-mono text-xs">$</span>
                  <input
                    type="number"
                    min="500"
                    max="50000"
                    step="250"
                    value={valueLimit}
                    onChange={(e) => setValueLimit(Number(e.target.value))}
                    className="w-full pl-7 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono font-bold text-slate-900 tabular-nums"
                  />
                </div>
                <span className="text-[11px] text-slate-400 mt-0.5 block">
                  Orders $\le$ limit pass automatically. Orders &gt; limit escalate to Meena.
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Minimum Supplier Rating (0.0 to 10.0)
                </label>
                <input
                  type="number"
                  min="5.0"
                  max="9.5"
                  step="0.1"
                  value={minScore}
                  onChange={(e) => setMinScore(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono font-bold text-slate-900 tabular-nums"
                />
                <span className="text-[11px] text-slate-400 mt-0.5 block">
                  Suppliers falling below this score are automatically flagged and bypassed.
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Chaser Follow-up Interval (Hours)
                </label>
                <input
                  type="number"
                  min="6"
                  max="72"
                  step="6"
                  value={chaseHours}
                  onChange={(e) => setChaseHours(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono font-bold text-slate-900 tabular-nums"
                />
                <span className="text-[11px] text-slate-400 mt-0.5 block">
                  Idle orders trigger automated chaser reminders after this duration.
                </span>
              </div>

              <div className="pt-2 flex items-center justify-between">
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                >
                  Save Policy Parameters
                </button>
                {policySaved && (
                  <span className="text-xs font-medium text-emerald-600 flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" /> Policy updated
                  </span>
                )}
              </div>
            </form>
          </div>

          <div className="mt-6 p-3 bg-slate-50 border border-slate-200 rounded-lg text-[11px] text-slate-600">
            <strong>Complete Flow Guarantee:</strong> "Dual-Doc Requirement" is permanently enforced. An order can NEVER be closed without both Goods Receipt and Commercial Invoice verified.
          </div>
        </section>

        {/* Right: Dynamic Supplier Scorecard & League Table */}
        <section className="lg:col-span-7 bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="p-5 border-b border-slate-200 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="p-1 rounded bg-emerald-50 text-emerald-700">
                  <TrendingUp className="w-4 h-4" />
                </span>
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                  Autonomous Supplier Scorecard & Failover Ranks
                </h3>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Calculated via rolling formula: 10 × (0.6 × on_time + 0.4 × (1 − damage))
              </p>
            </div>
            <span className="text-[11px] font-mono text-slate-400">Auto-Rerouting Active</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-4">Rank / Supplier</th>
                  <th className="py-2.5 px-4">Category</th>
                  <th className="py-2.5 px-4 text-center">Score</th>
                  <th className="py-2.5 px-4 text-center">On-Time</th>
                  <th className="py-2.5 px-4 text-center">Damage Rate</th>
                  <th className="py-2.5 px-4 text-right">Routing Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {[...suppliers]
                  .sort((a, b) => b.score - a.score)
                  .map((sup, idx) => {
                    const isTopGrain = sup.id === 'sup-2';
                    const isSunrise = sup.id === 'sup-1';
                    return (
                      <tr key={sup.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3 px-4 font-medium text-slate-900">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-slate-400 text-xs w-4">#{idx + 1}</span>
                            <div>
                              <div className="font-bold text-slate-900">{sup.name}</div>
                              <div className="text-[11px] text-slate-400">{sup.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-slate-600">{sup.itemCategory}</td>
                        <td className="py-3 px-4 text-center font-mono font-bold tabular-nums text-slate-900 text-sm">
                          <span className={`px-2 py-0.5 rounded ${
                            sup.score >= 9.0
                              ? 'bg-emerald-50 text-emerald-700'
                              : sup.score >= 7.0
                              ? 'bg-blue-50 text-blue-700'
                              : 'bg-red-50 text-red-700'
                          }`}>
                            {sup.score.toFixed(1)}/10
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center font-mono tabular-nums text-slate-700">
                          {(sup.onTimeRate * 100).toFixed(0)}%
                        </td>
                        <td className="py-3 px-4 text-center font-mono tabular-nums text-slate-700">
                          {(sup.damageRate * 100).toFixed(1)}%
                        </td>
                        <td className="py-3 px-4 text-right">
                          {isTopGrain && (
                            <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                              Preferred Failover
                            </span>
                          )}
                          {isSunrise && (
                            <span className="text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded">
                              Incumbent (Watching)
                            </span>
                          )}
                          {!isTopGrain && !isSunrise && (
                            <span className={`text-[11px] font-semibold px-2 py-0.5 rounded ${
                              sup.status === 'ACTIVE'
                                ? 'text-slate-700 bg-slate-100'
                                : 'text-red-700 bg-red-50'
                            }`}>
                              {sup.status}
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {/* 3. Executive AI Insight Briefing Generator */}
      <section className="bg-white border border-slate-200 rounded-xl p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 mb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1 rounded bg-emerald-50 text-emerald-700">
                <Sparkles className="w-4 h-4" />
              </span>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Insight Agent: Executive Logistics Synthesis
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Powered by Google Gemini 3.8 Flash: synthesizes operational velocity, supplier trends, and vendor risks.
            </p>
          </div>

          <button
            onClick={handleGenerateInsights}
            disabled={isLoadingInsight}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white rounded-lg text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer self-start sm:self-auto shadow-xs"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>{isLoadingInsight ? 'Synthesizing with Gemini...' : 'Generate Weekly Manager Briefing'}</span>
          </button>
        </div>

        {insightText ? (
          <div className="p-5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 leading-relaxed font-sans prose prose-sm max-w-none whitespace-pre-wrap">
            {insightText}
          </div>
        ) : (
          <div className="p-6 bg-slate-50 border border-slate-200 rounded-lg text-center text-xs text-slate-500">
            Click <strong>"Generate Weekly Manager Briefing"</strong> to invoke the Insight Agent. It aggregates real database cycle times, auto-approval metrics, and vendor degradation warnings into an executive summary.
          </div>
        )}
      </section>
    </div>
  );
};
