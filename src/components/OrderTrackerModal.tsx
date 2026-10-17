import React from 'react';
import { PurchaseOrder, StepLog, POStatus } from '../types/logistics.ts';
import { X, CheckCircle2, Clock, Truck, FileText, AlertCircle, ShieldAlert, ArrowRight, Package } from 'lucide-react';

interface OrderTrackerModalProps {
  order: PurchaseOrder | null;
  stepLogs: StepLog[];
  onClose: () => void;
  onReceiveCargo?: (poId: string) => void;
  onCloseOrder?: (poId: string) => void;
}

const FLOW_STEPS: { step: POStatus; label: string; desc: string }[] = [
  { step: 'REQUESTED', label: 'Requested', desc: 'Requisition submitted' },
  { step: 'APPROVED', label: 'Approved', desc: 'Policy verified' },
  { step: 'ORDERED', label: 'Ordered', desc: 'Dispatched to supplier' },
  { step: 'CONFIRMED', label: 'Confirmed', desc: 'Supplier acknowledged' },
  { step: 'SHIPPED', label: 'Shipped', desc: 'In transit to warehouse' },
  { step: 'RECEIVED', label: 'Received', desc: 'Arrived at dock' },
  { step: 'DOCS_COMPLETE', label: 'Docs Complete', desc: 'Receipt & Invoice matched' },
  { step: 'CLOSED', label: 'Closed', desc: 'Finalized & archived' },
];

export const OrderTrackerModal: React.FC<OrderTrackerModalProps> = ({
  order,
  stepLogs,
  onClose,
  onReceiveCargo,
  onCloseOrder,
}) => {
  if (!order) return null;

  const currentStepIndex = FLOW_STEPS.findIndex((s) => s.step === order.status);
  const relevantLogs = stepLogs.filter((l) => l.poId === order.id);

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-3xl w-full p-6 shadow-2xl border border-slate-200 my-8">
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-3">
              <span className="text-xl font-bold font-mono text-slate-900">
                {order.id}
              </span>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                order.status === 'CLOSED'
                  ? 'bg-slate-100 text-slate-800'
                  : order.status === 'ORDERED' || order.status === 'SHIPPED'
                  ? 'bg-blue-50 text-blue-700'
                  : order.status === 'RECEIVED'
                  ? 'bg-amber-50 text-amber-700'
                  : order.status === 'PENDING_MANAGER'
                  ? 'bg-purple-50 text-purple-700'
                  : order.status === 'REJECTED'
                  ? 'bg-red-50 text-red-700'
                  : 'bg-emerald-50 text-emerald-700'
              }`}>
                {order.status}
              </span>
            </div>
            <h3 className="text-base font-semibold text-slate-800 mt-1">
              {order.item}
            </h3>
            <div className="text-xs text-slate-500 mt-0.5">
              Requisition {order.requestId} · Handled by {order.handlerName}
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status Stepper Progression */}
        <div className="my-6">
          <div className="text-xs font-semibold text-slate-700 mb-3">
            Order Fulfillment Pipeline Status
          </div>

          <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
            {FLOW_STEPS.map((s, idx) => {
              const isPast = currentStepIndex > idx;
              const isCurrent = currentStepIndex === idx;

              return (
                <div key={s.step} className="text-center">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center mx-auto text-xs font-bold transition-all ${
                      isPast
                        ? 'bg-emerald-600 text-white'
                        : isCurrent
                        ? 'bg-emerald-600 text-white ring-4 ring-emerald-100'
                        : 'bg-slate-100 text-slate-400'
                    }`}
                  >
                    {isPast ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
                  </div>
                  <div className={`text-[11px] font-semibold mt-1.5 truncate ${
                    isCurrent ? 'text-slate-900 font-bold' : isPast ? 'text-slate-700' : 'text-slate-400'
                  }`}>
                    {s.label}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Specifications & Document Verification Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs">
          <div className="space-y-2">
            <div>
              <span className="text-slate-400 block text-[11px]">Commodity / Quantity</span>
              <strong className="text-slate-900 text-sm">{order.quantity} {order.unit}</strong>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">Estimated Value</span>
              <strong className="text-slate-900 font-mono text-sm tabular-nums">
                ${order.estimatedValue.toLocaleString()} USD
              </strong>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">Delivery SLA Target</span>
              <strong className="text-slate-900">{order.neededBy}</strong>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">Assigned Supplier</span>
              <strong className="text-slate-900">{order.supplierName || 'Pending Assignment'}</strong>
            </div>
          </div>

          <div className="space-y-2 border-t sm:border-t-0 sm:border-l border-slate-200 sm:pl-4 pt-2 sm:pt-0">
            <div>
              <span className="text-slate-400 block text-[11px]">Approval Details</span>
              <span className="text-slate-800">
                {order.approvedBy ? `${order.approvedBy.replace('_', ' ')}` : 'Pending'}
                {order.approvalReason && ` (${order.approvalReason})`}
              </span>
            </div>

            <div>
              <span className="text-slate-400 block text-[11px]">Delivery Receipt (GRN)</span>
              {order.documents.receiptUploaded ? (
                <span className="text-emerald-700 font-medium flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Verified: {order.documents.receiptRef}
                </span>
              ) : (
                <span className="text-amber-700 font-medium">Pending Cargo Arrival</span>
              )}
            </div>

            <div>
              <span className="text-slate-400 block text-[11px]">Commercial Invoice</span>
              {order.documents.invoiceUploaded ? (
                <span className="text-emerald-700 font-medium flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Verified: {order.documents.invoiceRef} (${order.documents.invoiceAmount?.toLocaleString()})
                </span>
              ) : (
                <span className="text-amber-700 font-medium">Missing (Chaser Active)</span>
              )}
            </div>

            {order.isFlaggedIdle && (
              <div className="p-2 bg-amber-50 border border-amber-200 rounded text-amber-800 text-[11px]">
                <strong>Attention:</strong> {order.idleReason}
              </div>
            )}
          </div>
        </div>

        {/* Step Timeline */}
        <div className="mt-5">
          <div className="text-xs font-semibold text-slate-700 mb-2">
            Audit Activity Log for {order.id}
          </div>

          <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
            {relevantLogs.length === 0 ? (
              <div className="text-xs text-slate-400 italic">No events logged yet.</div>
            ) : (
              relevantLogs.map((log) => (
                <div key={log.id} className="p-2 bg-white border border-slate-100 rounded text-xs flex items-start justify-between gap-2">
                  <div>
                    <span className="font-semibold text-slate-800 mr-2">{log.actor}:</span>
                    <span className="text-slate-600">{log.message}</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono shrink-0 tabular-nums">
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Actions Footer */}
        <div className="mt-6 pt-4 border-t border-slate-200 flex items-center justify-between">
          <span className="text-xs text-slate-400">
            {order.status === 'CLOSED'
              ? 'Order is finalized.'
              : 'Complete flow requires both receipt and invoice to close.'}
          </span>

          <div className="flex items-center gap-2">
            {order.status === 'SHIPPED' && onReceiveCargo && (
              <button
                onClick={() => {
                  onReceiveCargo(order.id);
                  onClose();
                }}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold cursor-pointer"
              >
                Mark Received at Dock
              </button>
            )}

            {order.status === 'DOCS_COMPLETE' && onCloseOrder && (
              <button
                onClick={() => {
                  onCloseOrder(order.id);
                  onClose();
                }}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold cursor-pointer"
              >
                Close & Archive Order
              </button>
            )}

            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-semibold cursor-pointer"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
