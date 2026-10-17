import React, { useState, useEffect } from 'react';
import { McpToolDeclaration, Supplier } from '../types/logistics.ts';
import { Cpu, Terminal, Play, CheckCircle2, RefreshCw, Zap, ShieldAlert, ArrowRight } from 'lucide-react';

interface McpInspectorProps {
  suppliers: Supplier[];
  isProcessing: boolean;
  onExecuteMcpTool: (name: string, args: any) => Promise<any>;
}

export const McpInspector: React.FC<McpInspectorProps> = ({
  suppliers,
  isProcessing,
  onExecuteMcpTool,
}) => {
  const [tools, setTools] = useState<McpToolDeclaration[]>([]);
  const [selectedToolName, setSelectedToolName] = useState<string>('mcp_self_healing_failover');
  const [toolArgsJson, setToolArgsJson] = useState<string>('{\n  "supplierId": "sup-1",\n  "simulateDamageEvent": true\n}');
  const [executionOutput, setExecutionOutput] = useState<any>(null);
  const [isExecuting, setIsExecuting] = useState(false);

  useEffect(() => {
    fetch('/api/mcp/tools')
      .then((res) => res.json())
      .then((data) => {
        if (data.tools) {
          setTools(data.tools);
        }
      })
      .catch((err) => console.warn('Failed to load MCP tools:', err));
  }, []);

  const handleSelectTool = (tool: McpToolDeclaration) => {
    setSelectedToolName(tool.name);
    // Provide nice starter arguments based on schema
    const defaultArgs: Record<string, any> = {};
    Object.entries(tool.parameters.properties).forEach(([key, prop]) => {
      defaultArgs[key] = prop.example !== undefined ? prop.example : '';
    });
    setToolArgsJson(JSON.stringify(defaultArgs, null, 2));
    setExecutionOutput(null);
  };

  const handleRunMcp = async () => {
    setIsExecuting(true);
    try {
      let parsed = {};
      try {
        parsed = JSON.parse(toolArgsJson);
      } catch (e) {
        alert('Invalid JSON in argument parameters');
        return;
      }
      const res = await onExecuteMcpTool(selectedToolName, parsed);
      setExecutionOutput(res);
    } finally {
      setIsExecuting(false);
    }
  };

  const sunrise = suppliers.find((s) => s.id === 'sup-1');
  const golden = suppliers.find((s) => s.id === 'sup-2');

  return (
    <div className="space-y-8">
      {/* 1. Self-Healing Feedback Loop Visualizer */}
      <section className="bg-white border border-slate-200 rounded-xl p-6">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-200 mb-4">
          <span className="p-1 rounded bg-amber-50 text-amber-700">
            <Zap className="w-4 h-4" />
          </span>
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              Autonomous Quality Feedback Loop & Self-Healing Failover
            </h2>
            <p className="text-xs text-slate-500">
              Demonstrates end-to-end learning: damage penalties recalculate supplier score, automatically re-routing subsequent requisitions.
            </p>
          </div>
        </div>

        {/* 4-Step Diagram */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 my-4">
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
            <div className="text-[10px] font-mono font-bold text-slate-400 mb-1">STAGE 1: INCIDENT</div>
            <div className="text-xs font-bold text-slate-900">Dock Damage Flagged</div>
            <p className="text-[11px] text-slate-600 mt-1">
              Ravi identifies 20 torn sacks on PO-105 delivered by Sunrise Rice Co.
            </p>
          </div>

          <div className="p-4 bg-purple-50/50 border border-purple-200 rounded-lg">
            <div className="text-[10px] font-mono font-bold text-purple-600 mb-1">STAGE 2: MULTIMODAL AGENT</div>
            <div className="text-xs font-bold text-purple-950">Vision Defect Audit</div>
            <p className="text-[11px] text-purple-900 mt-1">
              Gemini vision detects tear patterns, grain spill, and computes 6.7% cargo defect penalty.
            </p>
          </div>

          <div className="p-4 bg-amber-50/50 border border-amber-200 rounded-lg">
            <div className="text-[10px] font-mono font-bold text-amber-600 mb-1">STAGE 3: FORMULA RECALC</div>
            <div className="text-xs font-bold text-amber-950">Outcome Agent Rescore</div>
            <p className="text-[11px] text-amber-900 mt-1 font-mono">
              score = 10×(0.6×OT + 0.4×(1-Dmg))
            </p>
            <div className="text-[11px] text-amber-800 font-semibold mt-1">
              Sunrise rating: 8.2 → {sunrise?.score.toFixed(1)}/10
            </div>
          </div>

          <div className="p-4 bg-emerald-50/50 border border-emerald-200 rounded-lg">
            <div className="text-[10px] font-mono font-bold text-emerald-600 mb-1">STAGE 4: SELF-HEAL</div>
            <div className="text-xs font-bold text-emerald-950">Dynamic Failover Routing</div>
            <p className="text-[11px] text-emerald-900 mt-1">
              Next grain order automatically bypasses Sunrise and routes to <strong className="text-emerald-950">Golden Grain Corp (Score {golden?.score.toFixed(1)})</strong>!
            </p>
          </div>
        </div>

        {/* Live Comparison strip */}
        <div className="p-4 bg-slate-900 text-white rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs font-mono">
          <div>
            <span className="text-slate-400 block text-[10px]">INCUMBENT GRAIN VENDOR</span>
            <strong className="text-sm text-slate-100">{sunrise?.name}</strong>
            <span className="text-slate-400 block mt-0.5">
              Score: <strong className={sunrise && sunrise.score < 7.0 ? 'text-red-400' : 'text-amber-300'}>{sunrise?.score.toFixed(1)}/10</strong> · Status: {sunrise?.status}
            </span>
          </div>

          <div className="text-center font-bold text-emerald-400 flex items-center justify-center gap-2">
            <span>⚡ AUTONOMOUS REROUTE</span>
            <ArrowRight className="w-4 h-4" />
          </div>

          <div className="text-right">
            <span className="text-slate-400 block text-[10px]">PREFERRED FAILOVER VENDOR</span>
            <strong className="text-sm text-emerald-300">{golden?.name}</strong>
            <span className="text-slate-400 block mt-0.5">
              Score: <strong className="text-emerald-300">{golden?.score.toFixed(1)}/10</strong> · On-time: 96%
            </span>
          </div>
        </div>
      </section>

      {/* 2. Model Context Protocol (MCP) Tool Inspector */}
      <section className="bg-white border border-slate-200 rounded-xl p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200 mb-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1 rounded bg-slate-100 text-slate-700">
                <Cpu className="w-4 h-4" />
              </span>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                MCP Tool Registry & Protocol Console
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Declarative Model Context Protocol tools exposed to the agent framework. Direct JSON-RPC execution enabled.
            </p>
          </div>

          <span className="text-xs font-mono text-slate-600 bg-slate-100 px-2.5 py-1 rounded-md tabular-nums">
            Protocol: 2024-11-05 · {tools.length} Tools Decorated
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: Tool Selection List */}
          <div className="lg:col-span-5 space-y-2">
            <div className="text-xs font-semibold text-slate-700 mb-2">
              Decorated Protocol Tools:
            </div>
            <div className="space-y-1.5 max-h-96 overflow-y-auto pr-1">
              {tools.map((t) => {
                const isSelected = t.name === selectedToolName;
                return (
                  <button
                    key={t.name}
                    type="button"
                    onClick={() => handleSelectTool(t)}
                    className={`w-full text-left p-2.5 rounded-lg border text-xs transition-colors cursor-pointer ${
                      isSelected
                        ? 'border-slate-900 bg-slate-900 text-white shadow-xs'
                        : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold truncate">{t.name}</span>
                      <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                        isSelected ? 'bg-slate-800 text-slate-300' : 'bg-slate-200 text-slate-600'
                      }`}>
                        {t.category}
                      </span>
                    </div>
                    <p className={`text-[11px] mt-1 line-clamp-1 ${isSelected ? 'text-slate-300' : 'text-slate-500'}`}>
                      {t.description}
                    </p>
                    <div className="mt-1 text-[10px] text-slate-400 font-mono">
                      Called {t.executionCount}x
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right: Tool Schema & Interactive Execution Console */}
          <div className="lg:col-span-7 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-700">
                Execute MCP Tool: <strong className="font-mono text-slate-900">{selectedToolName}</strong>
              </span>
              <button
                onClick={handleRunMcp}
                disabled={isExecuting || isProcessing}
                className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
              >
                <Play className="w-3.5 h-3.5" />
                <span>{isExecuting ? 'Executing...' : 'Run Tool Call'}</span>
              </button>
            </div>

            <div>
              <label className="block text-[11px] font-mono text-slate-500 mb-1">
                Tool Input Parameters (JSON Schema):
              </label>
              <textarea
                rows={5}
                value={toolArgsJson}
                onChange={(e) => setToolArgsJson(e.target.value)}
                className="w-full p-3 font-mono text-xs bg-slate-900 text-emerald-400 rounded-lg border border-slate-700 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-mono text-slate-500 mb-1">
                MCP Tool Execution Result (JSON-RPC):
              </label>
              <div className="p-3 font-mono text-xs bg-slate-900 text-slate-200 rounded-lg border border-slate-700 min-h-36 max-h-60 overflow-y-auto">
                {executionOutput ? (
                  <pre className="whitespace-pre-wrap">{JSON.stringify(executionOutput, null, 2)}</pre>
                ) : (
                  <span className="text-slate-500 italic">
                    // Tool output will stream here after execution...
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
