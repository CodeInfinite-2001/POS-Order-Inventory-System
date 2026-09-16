import React, { useState, useEffect } from 'react';
import {
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Eye,
  RefreshCw,
  CreditCard,
  Ban,
  X,
  History,
} from 'lucide-react';

export default function OrdersList({
  orders,
  onRefresh,
  onCancelOrder,
  onOpenCheckout,
  loading,
}) {
  const [filterStatus, setFilterStatus] = useState('All');
  const [selectedOrderForAudit, setSelectedOrderForAudit] = useState(null);
  const [now, setNow] = useState(Date.now());

  // Update clock every second for accurate countdowns
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const statuses = ['All', 'Reserved', 'Paid', 'Cancelled', 'Expired', 'Failed'];

  const filteredOrders = orders.filter(
    o => filterStatus === 'All' || o.status === filterStatus
  );

  const getStatusBadge = order => {
    switch (order.status) {
      case 'Paid':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Paid
          </span>
        );
      case 'Reserved': {
        const remainingSec = Math.max(
          0,
          Math.floor((new Date(order.expiresAt).getTime() - now) / 1000)
        );
        const mins = Math.floor(remainingSec / 60);
        const secs = remainingSec % 60;
        const formatted = `${mins}:${secs < 10 ? '0' : ''}${secs}`;

        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <Clock className="w-3.5 h-3.5 text-blue-400 animate-pulse" />
            <span>Reserved ({formatted})</span>
          </span>
        );
      }
      case 'Cancelled':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-500/10 text-slate-400 border border-slate-500/20">
            <Ban className="w-3.5 h-3.5" />
            Cancelled
          </span>
        );
      case 'Expired':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <AlertCircle className="w-3.5 h-3.5" />
            Expired (5m)
          </span>
        );
      case 'Failed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <XCircle className="w-3.5 h-3.5" />
            Payment Failed
          </span>
        );
      default:
        return <span>{order.status}</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900/60 p-6 rounded-2xl border border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">
            Order Lifecycle Management
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Track order status transitions, inspect audit logs, and complete active reservations.
          </p>
        </div>
        <button
          onClick={onRefresh}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Orders</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {statuses.map(s => (
          <button
            key={s}
            onClick={() => setFilterStatus(s)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              filterStatus === s
                ? 'bg-blue-600 text-white'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700 border border-slate-700/50'
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {/* Orders Table */}
      <div className="overflow-hidden rounded-2xl bg-slate-900 border border-slate-800 shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-800/80 text-xs uppercase font-semibold text-slate-400 border-b border-slate-700/80">
              <tr>
                <th className="py-3.5 px-4">Order #</th>
                <th className="py-3.5 px-4">Customer</th>
                <th className="py-3.5 px-4">Items</th>
                <th className="py-3.5 px-4">Total Amount</th>
                <th className="py-3.5 px-4">Current Status</th>
                <th className="py-3.5 px-4">Created At</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-slate-500">
                    No orders matching status "{filterStatus}".
                  </td>
                </tr>
              ) : (
                filteredOrders.map(order => (
                  <tr key={order._id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4 font-mono text-xs font-bold text-white">
                      {order.orderNumber}
                    </td>
                    <td className="py-3 px-4 text-xs font-medium text-slate-300">
                      {order.customerName || 'Guest'}
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-400">
                      <span title={order.items.map(i => `${i.quantity}x ${i.name}`).join(', ')}>
                        {order.items.reduce((s, i) => s + i.quantity, 0)} item(s) (
                        {order.items.length} sku)
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-white">
                      ${order.totalAmount.toFixed(2)}
                    </td>
                    <td className="py-3 px-4">{getStatusBadge(order)}</td>
                    <td className="py-3 px-4 text-xs text-slate-400 font-mono">
                      {new Date(order.createdAt).toLocaleTimeString()}
                    </td>
                    <td className="py-3 px-4 text-right space-x-1.5 whitespace-nowrap">
                      {/* If Reserved, offer Pay or Cancel */}
                      {order.status === 'Reserved' && (
                        <>
                          <button
                            onClick={() => onOpenCheckout(order)}
                            className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-sm transition-colors"
                          >
                            Pay
                          </button>
                          <button
                            onClick={() => onCancelOrder(order._id)}
                            className="px-2 py-1 rounded-lg border border-slate-700 text-slate-400 hover:text-rose-400 hover:border-rose-500/30 text-xs font-medium transition-colors"
                          >
                            Cancel
                          </button>
                        </>
                      )}

                      {/* Audit Log / Detail Trigger */}
                      <button
                        onClick={() => setSelectedOrderForAudit(order)}
                        className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                        title="View status transition audit log"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Audit Log Modal */}
      {selectedOrderForAudit && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <History className="w-5 h-5 text-blue-400" />
                <h3 className="text-base font-bold text-white">
                  Order Audit Log: {selectedOrderForAudit.orderNumber}
                </h3>
              </div>
              <button
                onClick={() => setSelectedOrderForAudit(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Status transition timeline */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Lifecycle State Transitions
              </h4>
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {selectedOrderForAudit.history && selectedOrderForAudit.history.length > 0 ? (
                  selectedOrderForAudit.history.map((h, i) => (
                    <div
                      key={i}
                      className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/60 text-xs space-y-0.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-white">{h.status}</span>
                        <span className="font-mono text-slate-400 text-[11px]">
                          {new Date(h.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      <p className="text-slate-400 text-[11px]">{h.reason || 'Status updated'}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-500">No recorded history entries.</p>
                )}
              </div>
            </div>

            {/* Items */}
            <div className="border-t border-slate-800 pt-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                Purchased Items
              </h4>
              <div className="divide-y divide-slate-800 text-xs">
                {selectedOrderForAudit.items.map((item, i) => (
                  <div key={i} className="py-1.5 flex justify-between">
                    <span className="text-white">
                      {item.quantity}x {item.name}
                    </span>
                    <span className="font-mono text-slate-300">${item.subtotal.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedOrderForAudit(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
