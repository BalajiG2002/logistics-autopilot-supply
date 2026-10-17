import React, { useState } from 'react';
import { PurchaseOrder, POStatus } from '../types/logistics.ts';
import { Search, Filter, CheckCircle2, Clock, Truck, FileText, ExternalLink } from 'lucide-react';

interface OrdersViewProps {
  orders: PurchaseOrder[];
  onSelectOrder: (order: PurchaseOrder) => void;
  onReceiveCargo: (poId: string) => void;
  onCloseOrder: (poId: string) => void;
}

export const OrdersView: React.FC<OrdersViewProps> = ({
  orders,
  onSelectOrder,
  onReceiveCargo,
  onCloseOrder,
}) => {
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredOrders = orders.filter((o) => {
    const matchesSearch =
      o.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.item.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (o.supplierName && o.supplierName.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchesSearch) return false;

    if (filterStatus === 'ALL') return true;
    if (filterStatus === 'IN_TRANSIT') return o.status === 'ORDERED' || o.status === 'CONFIRMED' || o.status === 'SHIPPED';
    if (filterStatus === 'PENDING') return o.status === 'PENDING_MANAGER' || o.status === 'REQUESTED';
    if (filterStatus === 'RECEIVED') return o.status === 'RECEIVED' || o.status === 'DOCS_COMPLETE';
    if (filterStatus === 'CLOSED') return o.status === 'CLOSED';
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Search & Filter Header */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by order ID, item name, or supplier..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 placeholder-slate-400 focus:outline-hidden focus:ring-1 focus:ring-emerald-500 font-sans"
          />
        </div>

        {/* Status Filters */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg text-xs overflow-x-auto">
          {[
            { id: 'ALL', label: 'All Orders' },
            { id: 'IN_TRANSIT', label: 'In Transit' },
            { id: 'PENDING', label: 'Exceptions' },
            { id: 'RECEIVED', label: 'At Dock' },
            { id: 'CLOSED', label: 'Closed' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterStatus(tab.id)}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors cursor-pointer whitespace-nowrap ${
                filterStatus === tab.id
                  ? 'bg-white text-slate-900 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
            Purchase Orders Ledger ({filteredOrders.length})
          </h2>
          <span className="text-xs text-slate-500">
            Click any row to open the full visual lifecycle tracker
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">PO #</th>
                <th className="py-3 px-4">Item & Specifications</th>
                <th className="py-3 px-4 text-right">Contract Value</th>
                <th className="py-3 px-4">Supplier</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Target SLA</th>
                <th className="py-3 px-4 text-center">GRN Receipt</th>
                <th className="py-3 px-4 text-center">Invoice</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400 italic">
                    No orders matching the selected filter criteria.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((po) => (
                  <tr
                    key={po.id}
                    onClick={() => onSelectOrder(po)}
                    className="hover:bg-slate-50 transition-colors cursor-pointer group"
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
                    <td className="py-3.5 px-4 text-slate-700">
                      {po.supplierName || 'Pending Assignment'}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`inline-block px-2.5 py-0.5 rounded text-[11px] font-semibold ${
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
                        <span className="text-emerald-600 font-mono text-[11px] font-semibold">
                          Verified
                        </span>
                      ) : (
                        <span className="text-slate-400 font-mono text-[11px]">Pending</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      {po.documents.invoiceUploaded ? (
                        <span className="text-emerald-600 font-mono text-[11px] font-semibold">
                          Verified
                        </span>
                      ) : (
                        <span className="text-amber-600 font-mono text-[11px]">Missing</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                      {po.status === 'SHIPPED' && (
                        <button
                          onClick={() => onReceiveCargo(po.id)}
                          className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded text-[11px] font-semibold cursor-pointer"
                        >
                          Receive Dock
                        </button>
                      )}
                      {po.status === 'DOCS_COMPLETE' && (
                        <button
                          onClick={() => onCloseOrder(po.id)}
                          className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded text-[11px] font-semibold cursor-pointer"
                        >
                          Close PO
                        </button>
                      )}
                      {po.status !== 'SHIPPED' && po.status !== 'DOCS_COMPLETE' && (
                        <button
                          onClick={() => onSelectOrder(po)}
                          className="text-emerald-700 hover:text-emerald-900 font-semibold text-[11px] flex items-center gap-1 ml-auto cursor-pointer"
                        >
                          <span>Track</span>
                          <ExternalLink className="w-3 h-3" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
