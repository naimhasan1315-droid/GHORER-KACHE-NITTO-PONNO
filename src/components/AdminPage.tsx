import { useEffect, useState } from 'react';
import { Shield, CheckCircle2, Clock, Trash2, Loader2, ArrowLeft } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { OrderRow } from '@/lib/supabase';

type Props = { onBack: () => void; };

export default function AdminPage({ onBack }: Props) {
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<number | null>(null);

  const loadOrders = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
    if (!error && data) setOrders(data as OrderRow[]);
    setLoading(false);
  };

  useEffect(() => { loadOrders(); }, []);

  const approveOrder = async (id: number) => {
    setActionId(id);
    const { error } = await supabase.from('orders').update({ status: 'approved' }).eq('id', id);
    if (!error) setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status: 'approved' } : o)));
    setActionId(null);
  };

  const clearAll = async () => {
    if (!confirm('সব অর্ডার তথ্য মুছে ফেলতে চান?')) return;
    setActionId(-1);
    const { error: e1 } = await supabase.from('order_items').delete().neq('id', 0);
    const { error: e2 } = await supabase.from('orders').delete().neq('id', 0);
    if (!e1 && !e2) setOrders([]);
    setActionId(null);
  };

  return (
    <div className="max-w-5xl mx-auto py-8 px-4">
      <button onClick={onBack} className="flex items-center gap-1 text-gray-500 hover:text-gray-700 mb-4 text-sm">
        <ArrowLeft className="w-4 h-4" /> হোমে ফিরুন
      </button>

      <div className="bg-white rounded-2xl shadow-md p-6">
        <div className="flex items-center gap-2 mb-1">
          <Shield className="w-6 h-6 text-primary-600" />
          <h2 className="text-xl font-bold text-primary-800">অ্যাডমিন প্যানেল — অর্ডার লিস্ট</h2>
        </div>
        <p className="text-sm text-gray-500 mb-4">
          নতুন পেমেন্ট পাওয়ার পর যাচাই করে <strong>Approve</strong> বাটনে চাপ দিন।
        </p>

        <button onClick={clearAll} disabled={actionId === -1}
          className="mb-4 flex items-center gap-1 bg-red-500 hover:bg-red-600 disabled:bg-gray-300 text-white text-sm font-bold px-3 py-1.5 rounded-lg transition">
          <Trash2 className="w-4 h-4" /> সব অর্ডার মুছুন
        </button>

        {loading ? (
          <div className="flex items-center justify-center py-12 text-gray-400"><Loader2 className="w-8 h-8 animate-spin" /></div>
        ) : orders.length === 0 ? (
          <p className="text-center text-gray-400 py-12">কোনো অর্ডার পাওয়া যায়নি।</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-primary-50 text-left">
                  <th className="p-2.5 text-sm font-bold text-primary-800 border border-gray-200">#ID</th>
                  <th className="p-2.5 text-sm font-bold text-primary-800 border border-gray-200">কাস্টমার</th>
                  <th className="p-2.5 text-sm font-bold text-primary-800 border border-gray-200">টাকা</th>
                  <th className="p-2.5 text-sm font-bold text-primary-800 border border-gray-200">মেথড / TrxID</th>
                  <th className="p-2.5 text-sm font-bold text-primary-800 border border-gray-200">স্ট্যাটাস</th>
                  <th className="p-2.5 text-sm font-bold text-primary-800 border border-gray-200">অ্যাকশন</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o.id} className="hover:bg-gray-50">
                    <td className="p-2.5 text-sm border border-gray-200 font-bold">#{o.id}</td>
                    <td className="p-2.5 text-sm border border-gray-200">
                      <div className="font-semibold">{o.customer_name}</div>
                      <div className="text-xs text-gray-400">{o.address}</div>
                      {o.phone && <div className="text-xs text-gray-400">{o.phone}</div>}
                    </td>
                    <td className="p-2.5 text-sm border border-gray-200 font-bold text-primary-700">{o.total} ৳</td>
                    <td className="p-2.5 text-sm border border-gray-200">{o.payment_ref}</td>
                    <td className="p-2.5 text-sm border border-gray-200">
                      {o.status === 'pending' ? (
                        <span className="inline-flex items-center gap-1 bg-accent-100 text-accent-700 px-2 py-0.5 rounded-full text-xs font-bold">
                          <Clock className="w-3 h-3" /> Pending
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 bg-primary-100 text-primary-700 px-2 py-0.5 rounded-full text-xs font-bold">
                          <CheckCircle2 className="w-3 h-3" /> Approved
                        </span>
                      )}
                    </td>
                    <td className="p-2.5 text-sm border border-gray-200">
                      {o.status === 'pending' ? (
                        <button onClick={() => approveOrder(o.id)} disabled={actionId === o.id}
                          className="bg-primary-600 hover:bg-primary-700 disabled:bg-gray-300 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition">
                          {actionId === o.id ? '...' : 'Approve'}
                        </button>
                      ) : (
                        <span className="text-primary-600 text-xs font-semibold flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> অনুমোদিত
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
