import React, { useState, useEffect } from 'react';
import { PurchaseOrder, StepLog, POStatus } from '../types/logistics.ts';
import { ArrowRight, Play, RotateCcw, ShieldCheck, Clock, FileCheck } from 'lucide-react';

interface AutopilotPipelineProps {
  orders: PurchaseOrder[];
  stepLogs: StepLog[];
  isProcessing: boolean;
  onTriggerScheduler: () => Promise<void>;
}

const ORDERED_STEPS: { step: POStatus; label: string; description: string }[] = [
  { step: 'REQUESTED', label: 'Requested', description: 'Intake Agent extracts specs' },
  { step: 'APPROVED', label: 'Approved', description: 'Auto-pilot or Manager' },
  { step: 'ORDERED', label: 'Ordered', description: 'Dispatch Agent emails supplier' },
  { step: 'CONFIRMED', label: 'Confirmed', description: 'Supplier accepts SLA' },
  { step: 'SHIPPED', label: 'Shipped', description: 'En route with tracking' },
  { step: 'RECEIVED', label: 'Received', description: 'Arrived at FreshMart dock' },
  { step: 'DOCS_COMPLETE', label: 'Docs Complete', description: 'Receipt + Invoice verified' },
  { step: 'CLOSED', label: 'Closed', description: 'Settled & outcome scored' },
];

export const AutopilotPipeline: React.FC<AutopilotPipelineProps> = ({
  orders,
  stepLogs,
  isProcessing,
  onTriggerScheduler,
}) => {
  const [countdown, setCountdown] = useState(30);
  const [autoTick, setAutoTick] = useState(true);

  // Live simulation timer for APScheduler
  useEffect(() => {
    if (!autoTick) return;
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          onTriggerScheduler();
          return 30;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [autoTick, onTriggerScheduler]);

  return (
    <div className="space-y-8">
      {/* 1. State Machine Visualizer */}
      <section className="bg-white border border-slate-200 rounded-xl p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 mb-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1 rounded bg-emerald-50 text-emerald-700">
                <ShieldCheck className="w-4 h-4" />
              </span>
              <h2 className="text-base font-semibold text-slate-900">
                Complete Flow State Machine & Guarantee
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Strict deterministic transitions. An order can move to CLOSED <em>only</em> when both Receipt and Commercial Invoice are present.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-500 font-mono">
              Next Autonomous Scan in <strong className="text-slate-900 tabular-nums">{countdown}s</strong>
            </span>
            <button
              onClick={() => {
                onTriggerScheduler();
                setCountdown(30);
              }}
              disabled={isProcessing}
              className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Play className="w-3.5 h-3.5" />
              <span>Tick Scheduler Now</span>
            </button>
          </div>
        </div>

        {/* State Progression Rail */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
          {ORDERED_STEPS.map((item, idx) => {
            const count = orders.filter((o) => o.status === item.step).length;
            const isClosed = item.step === 'CLOSED';
            const isDocs = item.step === 'DOCS_COMPLETE';
            return (
              <div
                key={item.step}
                className={`relative p-3 rounded-lg border transition-all ${
                  count > 0
                    ? 'border-emerald-600 bg-emerald-50/40 shadow-xs'
                    : 'border-slate-200 bg-slate-50/60'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-mono text-slate-400 font-bold">
                    0{idx + 1}
                  </span>
                  <span className={`text-xs font-mono font-bold px-1.5 py-0.2 rounded tabular-nums ${
                    count > 0 ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'
                  }`}>
                    {count}
                  </span>
                </div>

                <div className="text-xs font-bold text-slate-900 truncate">
                  {item.label}
                </div>
                <div className="text-[11px] text-slate-500 leading-tight mt-1 line-clamp-2">
                  {item.description}
                </div>

                {isDocs && (
                  <div className="mt-2 pt-1 border-t border-emerald-200 text-[10px] text-emerald-800 font-semibold flex items-center gap-1">
                    <FileCheck className="w-3 h-3" />
                    <span>Dual-Doc Gate</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-4 p-3 bg-slate-50 border border-slate-200 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between text-xs text-slate-600 gap-2">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
            <span><strong>Tracker Agent:</strong> Continuously probes idle POs and alerts missing paperwork.</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-600"></span>
            <span><strong>Chaser Agent:</strong> Triggers escalation emails at 24h/48h intervals without human lag.</span>
          </div>
        </div>
      </section>

      {/* 2. Step Audit Log (steps_log table) */}
      <section className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="p-5 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Autonomous Step Execution Audit Trail (steps_log)
            </h3>
            <span className="text-xs text-slate-500">
              Immutable event log recording every agent deliberation, policy check, and outcome calculation
            </span>
          </div>
          <span className="text-xs font-mono text-slate-400 tabular-nums">
            {stepLogs.length} Events Logged
          </span>
        </div>

        <div className="divide-y divide-slate-100 max-h-96 overflow-y-auto">
          {stepLogs.map((log) => {
            const isSelfHeal = log.actor === 'SELF_HEALING_AGENT';
            const isOutcome = log.actor === 'OUTCOME_AGENT';
            const isChaser = log.actor === 'CHASER_AGENT';
            const isApproval = log.actor === 'APPROVAL_AGENT';
            return (
              <div
                key={log.id}
                className={`p-3.5 hover:bg-slate-50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs ${
                  isSelfHeal ? 'bg-amber-50/50' : ''
                }`}
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-slate-900">{log.poId}</span>
                    <span className="text-slate-300">·</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                      isSelfHeal
                        ? 'bg-amber-100 text-amber-900'
                        : isOutcome
                        ? 'bg-purple-100 text-purple-900'
                        : isChaser
                        ? 'bg-blue-100 text-blue-900'
                        : isApproval
                        ? 'bg-emerald-100 text-emerald-900'
                        : 'bg-slate-100 text-slate-800'
                    }`}>
                      {log.actor}
                    </span>
                    <span className="text-slate-300">·</span>
                    <span className="font-mono text-slate-500 text-[11px]">{log.step}</span>
                  </div>
                  <p className="text-slate-700 font-medium">{log.message}</p>
                </div>

                <div className="text-[11px] font-mono text-slate-400 whitespace-nowrap self-start sm:self-auto tabular-nums">
                  {new Date(log.timestamp).toLocaleTimeString()}
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};
