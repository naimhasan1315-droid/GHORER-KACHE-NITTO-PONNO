import { useCallback, useEffect, useState } from 'react';
import Header from '@/components/Header';
import HomePage from '@/components/HomePage';
import ProductsPage from '@/components/ProductsPage';
import ProductModal from '@/components/ProductModal';
import CartSidebar from '@/components/CartSidebar';
import PaymentPage from '@/components/PaymentPage';
import AdminPage from '@/components/AdminPage';
import Footer from '@/components/Footer';
import { supabase } from '@/lib/supabase';
import type { Product, CartItem } from '@/lib/supabase';

type Section = 'home' | 'products' | 'payment' | 'admin';

function App() {
  const [section, setSection] = useState<Section>('home');
  const [products, setProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [initialCategory, setInitialCategory] = useState('All');

  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [address, setAddress] = useState('');

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase.from('products').select('*').order('category, name');
      if (!error && data) setProducts(data as Product[]);
      setProductsLoading(false);
    })();
  }, []);

  const addToCart = useCallback((p: Product) => {
    setCart((prev) => {
      const existing = prev.find((c) => c.id === p.id);
      if (existing) return prev.map((c) => (c.id === p.id ? { ...c, qty: c.qty + 1 } : c));
      return [...prev, { ...p, qty: 1 }];
    });
    setCartOpen(true);
  }, []);

  const changeQty = useCallback((id: number, delta: number) => {
    setCart((prev) =>
      prev
        .map((c) => (c.id === id ? { ...c, qty: c.qty + delta } : c))
        .filter((c) => c.qty > 0)
    );
  }, []);

  const removeItem = useCallback((id: number) => {
    setCart((prev) => prev.filter((c) => c.id !== id));
  }, []);

  const cartCount = cart.reduce((sum, c) => sum + c.qty, 0);

  const goToPayment = () => {
    if (cart.length === 0) return;
    if (!customerName.trim() || !address.trim()) {
      alert('অনুগ্রহ করে আপনার নাম ও ঠিকানা প্রদান করুন।');
      return;
    }
    setCartOpen(false);
    setSection('payment');
  };

  const orderComplete = () => {
    setCart([]);
    setCustomerName('');
    setCustomerPhone('');
    setAddress('');
    setSection('home');
  };

  const handleCategoryClick = (cat: string) => {
    setInitialCategory(cat);
    setSection('products');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header
        section={section}
        onNavigate={setSection}
        cartCount={cartCount}
        onCartClick={() => setCartOpen(true)}
      />

      <main className="flex-1">
        {section === 'home' && (
          <HomePage onShopNow={() => setSection('products')} onCategoryClick={handleCategoryClick} />
        )}

        {(section === 'home' || section === 'products') && (
          <ProductsPage
            products={products}
            loading={productsLoading}
            initialCategory={initialCategory}
            onAddToCart={addToCart}
            onProductClick={setSelectedProduct}
          />
        )}

        {section === 'payment' && (
          <PaymentPage
            cart={cart}
            customerName={customerName}
            customerPhone={customerPhone}
            address={address}
            onBack={() => {
              setCartOpen(true);
              setSection('products');
            }}
            onOrderComplete={orderComplete}
          />
        )}

        {section === 'admin' && <AdminPage onBack={() => setSection('home')} />}
      </main>

      <Footer onAdminClick={() => setSection('admin')} />

      {selectedProduct && (
        <ProductModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
          onAddToCart={addToCart}
        />
      )}

      <CartSidebar
        open={cartOpen}
        cart={cart}
        customerName={customerName}
        customerPhone={customerPhone}
        address={address}
        onNameChange={setCustomerName}
        onPhoneChange={setCustomerPhone}
        onAddressChange={setAddress}
        onQtyChange={changeQty}
        onRemove={removeItem}
        onClose={() => setCartOpen(false)}
        onProceed={goToPayment}
      />
    </div>
  );
}

export default App;
