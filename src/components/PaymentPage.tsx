import { useState } from 'react';
import { CheckCircle2, Loader2, ArrowLeft } from 'lucide-react';
import type { CartItem } from '@/lib/supabase';
import { supabase } from '@/lib/supabase';

type Method = 'bKash' | 'Nagad' | 'Card';

type Props = {
  cart: CartItem[];
  customerName: string;
  customerPhone: string;
  address: string;
  onBack: () => void;
  onOrderComplete: () => void;
};

export default function PaymentPage({ cart, customerName, customerPhone, address, onBack, onOrderComplete }: Props) {
  const [method, setMethod] = useState<Method>('bKash');
  const [trxId, setTrxId] = useState('');
  const [cardNum, setCardNum] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<number | null>(null);
  const [error, setError] = useState('');

  const total = cart.reduce((sum, item) => sum + item.price * item.qty, 0);

  const methods: { key: Method; label: string; color: string }[] = [
    { key: 'bKash', label: 'bKash', color: 'bg-pink-50 border-pink-500 text-pink-600' },
    { key: 'Nagad', label: 'Nagad', color: 'bg-orange-50 border-orange-500 text-orange-600' },
    { key: 'Card', label: 'Card', color: 'bg-blue-50 border-blue-500 text-blue-600' },
  ];

  const handleSubmit = async () => {
    setError('');
    let paymentRef = '';

    if (method === 'Card') {
      if (!cardNum.trim()) { setError('অনুগ্রহ করে Card Number লিখুন!'); return; }
      paymentRef = `Card (${cardNum.slice(-4)})`;
    } else {
      if (!trxId.trim()) { setError('অনুগ্রহ করে Transaction ID লিখুন!'); return; }
      paymentRef = `${method} (TrxID: ${trxId})`;
    }

    setSubmitting(true);

    try {
      const { data: orderData, error: orderError } = await supabase
        .from('orders').insert({
          customer_name: customerName, address, phone: customerPhone,
          total, payment_method: method, payment_ref: paymentRef, status: 'pending',
        }).select('id').single();

      if (orderError || !orderData) {
        setError('অর্ডার জমা দিতে সমস্যা হয়েছে। আবার চেষ্টা করুন।');
        setSubmitting(false); return;
      }

      const orderItems = cart.map((item) => ({
        order_id: orderData.id, product_id: item.id,
        product_name: item.name, price: item.price, qty: item.qty,
      }));

      const { error: itemsError } = await supabase.from('order_items').insert(orderItems);

      if (itemsError) {
        setError('অর্ডার আইটেম সংরক্ষণে সমস্যা হয়েছে।');
        setSubmitting(false); return;
      }

      setSuccess(orderData.id);
    } catch {
      setError('নেটওয়ার্ক সমস্যা। আবার চেষ্টা করুন।');
      setSubmitting(false);
    }
  };

  if (success !== null) {
    return (
      <div className="max-w-md mx-auto py-16 px-4 text-center">
        <CheckCircle2 className="w-20 h-20 text-primary-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-primary-800 mb-2">অর্ডার সফল হয়েছে!</h2>
        <p className="text-gray-600 mb-2">আপনার অর্ডারটি সফলভাবে জমা হয়েছে এবং 'Pending' অবস্থায় রয়েছে।</p>
        <p className="font-bold text-lg text-primary-700 mb-6">অর্ডার আইডি: #{success}</p>
        <button onClick={onOrderComplete} className="bg-primary-600 hover:bg-primary-700 text-white font-bold px-8 py-3 rounded-full transition">
          হোমে ফিরুন
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto py-8 px-4">
      <button onClick={onBack} className="flex items-center gap-1 text-gray-500 hover:text-gray-700 mb-4 text-sm">
        <ArrowLeft className="w-4 h-4" /> কার্টে ফিরুন
      </button>

      <div className="bg-white rounded-2xl shadow-md p-6">
        <h2 className="text-xl font-bold text-primary-800 text-center mb-2">পেমেন্ট করুন</h2>
        <p className="text-center text-sm text-gray-500 mb-5">
          মোট প্রদেয়: <strong className="text-primary-700 text-lg">{total} ৳</strong>
        </p>

        <label className="text-sm font-bold text-gray-700 mb-2 block">পেমেন্ট মাধ্যম বেছে নিন:</label>
        <div className="grid grid-cols-3 gap-2 mb-5">
          {methods.map((m) => (
            <button key={m.key} onClick={() => setMethod(m.key)}
              className={`py-3 rounded-xl text-sm font-bold border-2 transition ${
                method === m.key ? m.color : 'border-gray-200 text-gray-400 hover:border-gray-300'
              }`}>
              {m.label}
            </button>
          ))}
        </div>

        {method !== 'Card' ? (
          <div className="space-y-3 mb-5">
            <div className="bg-primary-50 text-sm text-gray-700 p-3 rounded-lg">
              অনুগ্রহ করে আমাদের <strong>01700-000000</strong> ({method} Merchant) নম্বরে টাকা পাঠান এবং Transaction ID লিখুন।
            </div>
            <div>
              <label className="text-sm font-bold text-gray-700 block mb-1">Transaction ID (TrxID):</label>
              <input type="text" value={trxId} onChange={(e) => setTrxId(e.target.value)} placeholder="e.g. 9H7X6Y5Z"
                className="w-full px-3 py-2 text-sm border rounded-lg outline-none focus:border-primary-500" />
            </div>
          </div>
        ) : (
          <div className="mb-5">
            <label className="text-sm font-bold text-gray-700 block mb-1">Card Number:</label>
            <input type="text" value={cardNum} onChange={(e) => setCardNum(e.target.value)} placeholder="4532 XXXX XXXX 8899"
              className="w-full px-3 py-2 text-sm border rounded-lg outline-none focus:border-primary-500" />
          </div>
        )}

        {error && <p className="text-red-500 text-sm mb-3 text-center">{error}</p>}

        <button onClick={handleSubmit} disabled={submitting}
          className="w-full flex items-center justify-center gap-2 bg-accent-500 hover:bg-accent-600 disabled:bg-gray-300 text-white font-bold py-3 rounded-xl transition">
          {submitting ? (<><Loader2 className="w-5 h-5 animate-spin" /> অর্ডার জমা হচ্ছে...</>) : 'অর্ডার নিশ্চিত করুন'}
        </button>
      </div>
    </div>
  );
}
