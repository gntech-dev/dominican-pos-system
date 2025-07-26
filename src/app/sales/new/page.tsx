'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
  sku: string;
}

interface Customer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  rnc?: string;
  cedula?: string;
}

interface RncSearchResult {
  rnc: string;
  businessName: string;
  commercialName?: string;
  status: string;
  category: string;
}

interface SaleItem {
  productId: string;
  quantity: number;
  unitPrice: number;
  product?: Product;
}

interface NcfSequence {
  id: string;
  ncfType: string;
  prefix: string;
  currentNumber: number;
  endNumber: number;
  isActive: boolean;
}

export default function NewSalePage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [ncfSequences, setNcfSequences] = useState<NcfSequence[]>([]);
  const [saleItems, setSaleItems] = useState<SaleItem[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [selectedNcfType, setSelectedNcfType] = useState<string>('B02');
  const [isB01Invoice, setIsB01Invoice] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [customerSearchTerm, setCustomerSearchTerm] = useState('');
  const [showRncSearch, setShowRncSearch] = useState(false);
  const [rncSearchTerm, setRncSearchTerm] = useState('');
  const [rncSearchResults, setRncSearchResults] = useState<RncSearchResult[]>([]);
  const [isSearchingRnc, setIsSearchingRnc] = useState(false);

  // Load initial data
  useEffect(() => {
    loadProducts();
    loadCustomers();
    loadNcfSequences();
  }, []);

  const loadProducts = async () => {
    try {
      const response = await fetch('/api/products');
      if (response.ok) {
        const data = await response.json();
        setProducts(data);
      }
    } catch (error) {
      console.error('Error loading products:', error);
    }
  };

  const loadCustomers = async () => {
    try {
      const response = await fetch('/api/customers');
      if (response.ok) {
        const data = await response.json();
        setCustomers(data);
      }
    } catch (error) {
      console.error('Error loading customers:', error);
    }
  };

  const loadNcfSequences = async () => {
    try {
      const response = await fetch('/api/ncf-sequences');
      if (response.ok) {
        const data = await response.json();
        setNcfSequences(data.filter((seq: NcfSequence) => seq.isActive));
      }
    } catch (error) {
      console.error('Error loading NCF sequences:', error);
    }
  };

  const searchRnc = async () => {
    if (!rncSearchTerm.trim()) return;

    setIsSearchingRnc(true);
    try {
      const response = await fetch('/api/rnc/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          query: rncSearchTerm.trim(),
          searchType: 'search',
          limit: 10
        })
      });

      if (response.ok) {
        const data = await response.json();
        setRncSearchResults(data.results || []);
      } else {
        setRncSearchResults([]);
      }
    } catch (error) {
      console.error('Error searching RNC:', error);
      setRncSearchResults([]);
    } finally {
      setIsSearchingRnc(false);
    }
  };

  const selectFromRnc = (rncResult: RncSearchResult) => {
    const tempCustomer: Customer = {
      id: `temp-${rncResult.rnc}`,
      name: rncResult.businessName,
      rnc: rncResult.rnc
    };
    setSelectedCustomer(tempCustomer);
    setIsB01Invoice(true);
    setSelectedNcfType('B01');
    setShowRncSearch(false);
    setRncSearchTerm('');
    setRncSearchResults([]);
  };

  const addProduct = (product: Product) => {
    const existingItemIndex = saleItems.findIndex(item => item.productId === product.id);
    
    if (existingItemIndex >= 0) {
      const newItems = [...saleItems];
      if (newItems[existingItemIndex].quantity < product.stock) {
        newItems[existingItemIndex].quantity += 1;
        setSaleItems(newItems);
      } else {
        alert('No hay suficiente stock');
      }
    } else {
      if (product.stock > 0) {
        setSaleItems([...saleItems, {
          productId: product.id,
          quantity: 1,
          unitPrice: product.price,
          product
        }]);
      } else {
        alert('Producto sin stock');
      }
    }
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      setSaleItems(saleItems.filter(item => item.productId !== productId));
      return;
    }

    const product = products.find(p => p.id === productId);
    if (product && quantity > product.stock) {
      alert('No hay suficiente stock');
      return;
    }

    setSaleItems(saleItems.map(item => 
      item.productId === productId ? { ...item, quantity } : item
    ));
  };

  const removeItem = (productId: string) => {
    setSaleItems(saleItems.filter(item => item.productId !== productId));
  };

  const calculateSubtotal = () => {
    return saleItems.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
  };

  const calculateTax = () => {
    return calculateSubtotal() * 0.18; // 18% ITBIS
  };

  const calculateTotal = () => {
    return calculateSubtotal() + calculateTax();
  };

  const handleNcfTypeChange = (ncfType: string) => {
    setSelectedNcfType(ncfType);
    if (ncfType === 'B01') {
      setIsB01Invoice(true);
    } else {
      setIsB01Invoice(false);
      if (selectedCustomer?.id?.startsWith('temp-')) {
        setSelectedCustomer(null);
      }
    }
  };

  const processSale = async () => {
    if (saleItems.length === 0) {
      alert('Agregue productos a la venta');
      return;
    }

    if (selectedNcfType === 'B01' && !selectedCustomer?.rnc) {
      alert('Para facturas B01 debe seleccionar un cliente con RNC válido');
      return;
    }

    setLoading(true);
    try {
      const saleData = {
        customerId: selectedCustomer?.id?.startsWith('temp-') ? null : selectedCustomer?.id,
        tempCustomer: selectedCustomer?.id?.startsWith('temp-') ? {
          name: selectedCustomer.name,
          rnc: selectedCustomer.rnc
        } : null,
        ncfType: selectedNcfType,
        items: saleItems.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice
        })),
        subtotal: calculateSubtotal(),
        tax: calculateTax(),
        total: calculateTotal()
      };

      const response = await fetch('/api/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(saleData)
      });

      if (response.ok) {
        const result = await response.json();
        alert('Venta procesada exitosamente');
        
        // Open receipt print dialog
        const printResponse = await fetch(`/api/receipts/${result.id}`);
        if (printResponse.ok) {
          const receiptData = await printResponse.json();
          // Here you would open the receipt print dialog
          // For now, we'll navigate to sales page
          router.push('/sales');
        }
      } else {
        const error = await response.json();
        alert(`Error al procesar la venta: ${error.error}`);
      }
    } catch (error) {
      console.error('Error processing sale:', error);
      alert('Error al procesar la venta');
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(customerSearchTerm.toLowerCase()) ||
    (customer.rnc && customer.rnc.includes(customerSearchTerm)) ||
    (customer.cedula && customer.cedula.includes(customerSearchTerm))
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto p-6 max-w-7xl">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Nueva Venta</h1>
            <p className="text-gray-600">Procese ventas con cumplimiento DGII completo</p>
          </div>
          <button
            onClick={() => router.push('/sales')}
            className="px-6 py-3 bg-white text-gray-700 rounded-lg shadow-md hover:shadow-lg hover:bg-gray-50 transition-all duration-200 flex items-center gap-2"
          >
            <span>←</span> Volver a Ventas
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Products Section */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
              <h2 className="text-2xl font-semibold mb-6 text-gray-800 flex items-center gap-2">
                <span className="text-blue-600">🏪</span> Productos
              </h2>
              
              {/* Product Search */}
              <div className="mb-6">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="🔍 Buscar productos por nombre o SKU..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-lg"
                  />
                </div>
              </div>

              {/* Products Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto">
                {filteredProducts.map((product) => (
                  <div
                    key={product.id}
                    className="border-2 border-gray-200 rounded-xl p-4 hover:border-blue-300 hover:shadow-lg cursor-pointer transition-all duration-200 bg-gradient-to-r from-white to-gray-50"
                    onClick={() => addProduct(product)}
                  >
                    <h3 className="font-semibold text-gray-900 text-lg">{product.name}</h3>
                    <p className="text-sm text-gray-600 mb-2">SKU: {product.sku}</p>
                    <div className="flex justify-between items-center">
                      <span className="text-xl font-bold text-green-600">
                        $RD {product.price.toFixed(2)}
                      </span>
                      <span className={`text-sm px-2 py-1 rounded-full ${product.stock > 10 ? 'bg-green-100 text-green-800' : product.stock > 0 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>
                        Stock: {product.stock}
                      </span>
                    </div>
                  </div>
                ))}
                {filteredProducts.length === 0 && (
                  <div className="col-span-2 text-center py-8 text-gray-500">
                    No se encontraron productos
                  </div>
                )}
              </div>
          </div>
        </div>

        {/* Sale Summary Section */}
        <div className="space-y-6">
          {/* Customer Selection */}
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
            <h3 className="text-xl font-semibold mb-4 text-gray-800 flex items-center gap-2">
              <span className="text-blue-600">👤</span> Cliente
            </h3>
            
            {/* Customer Search */}
            <div className="mb-4">
              <input
                type="text"
                placeholder="🔍 Buscar cliente..."
                value={customerSearchTerm}
                onChange={(e) => setCustomerSearchTerm(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
              />
            </div>

            {/* Customer Selection */}
            {customerSearchTerm && (
              <div className="mb-4 max-h-32 overflow-y-auto border-2 border-gray-200 rounded-xl">
                {filteredCustomers.map((customer) => (
                  <div
                    key={customer.id}
                    className="p-3 hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-b-0 transition-colors"
                    onClick={() => {
                      setSelectedCustomer(customer);
                      setCustomerSearchTerm('');
                    }}
                  >
                    <div className="font-medium text-sm">{customer.name}</div>
                    {customer.rnc && (
                      <div className="text-xs text-gray-600">RNC: {customer.rnc}</div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* RNC Search Button */}
            <button
              onClick={() => setShowRncSearch(true)}
              className="w-full mb-4 px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
            >
              <span>🏢</span> Buscar por RNC (DGII)
            </button>

            {/* Selected Customer */}
            {selectedCustomer && (
              <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border-2 border-green-200">
                <div className="font-semibold text-green-800">{selectedCustomer.name}</div>
                {selectedCustomer.rnc && (
                  <div className="text-sm text-green-700">RNC: {selectedCustomer.rnc}</div>
                )}
                <button
                  onClick={() => setSelectedCustomer(null)}
                  className="text-xs text-red-600 hover:text-red-800 mt-2 bg-white px-2 py-1 rounded-lg shadow"
                >
                  ✕ Remover
                </button>
              </div>
            )}
          </div>

          {/* NCF Type Selection */}
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
            <h3 className="text-xl font-semibold mb-4 text-gray-800 flex items-center gap-2">
              <span className="text-blue-600">📋</span> Tipo de Comprobante
            </h3>
            <select
              value={selectedNcfType}
              onChange={(e) => handleNcfTypeChange(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-lg"
            >
              {ncfSequences.map((sequence) => (
                <option key={sequence.id} value={sequence.ncfType}>
                  {sequence.ncfType} - {sequence.prefix}
                </option>
              ))}
            </select>
            {selectedNcfType === 'B01' && (
              <div className="mt-3 p-3 bg-amber-50 border-l-4 border-amber-400 rounded-r-lg">
                <p className="text-sm text-amber-800">
                  ⚠️ Las facturas B01 requieren un cliente con RNC válido
                </p>
              </div>
            )}
          </div>

          {/* Sale Items */}
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
            <h3 className="text-xl font-semibold mb-4 text-gray-800 flex items-center gap-2">
              <span className="text-blue-600">🛒</span> Artículos
            </h3>
            
            {saleItems.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">🛒</div>
                <p className="text-gray-500 text-lg">
                  No hay productos agregados
                </p>
                <p className="text-gray-400 text-sm mt-2">
                  Seleccione productos de la lista para agregarlos
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {saleItems.map((item) => (
                  <div key={item.productId} className="flex items-center justify-between p-4 border-2 border-gray-200 rounded-xl hover:border-blue-300 transition-all duration-200 bg-gradient-to-r from-white to-gray-50">
                    <div className="flex-1">
                      <div className="font-semibold text-gray-900">{item.product?.name}</div>
                      <div className="text-sm text-gray-600">$RD {item.unitPrice.toFixed(2)} c/u</div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => updateQuantity(item.productId, parseInt(e.target.value) || 0)}
                        className="w-20 px-3 py-2 border-2 border-gray-300 rounded-lg text-center focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                      <button
                        onClick={() => removeItem(item.productId)}
                        className="text-red-600 hover:text-red-800 bg-red-50 hover:bg-red-100 p-2 rounded-lg transition-all duration-200"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Sale Summary */}
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
            <h3 className="text-xl font-semibold mb-4 text-gray-800 flex items-center gap-2">
              <span className="text-blue-600">💰</span> Resumen
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-600">Subtotal:</span>
                <span className="font-semibold">$RD {calculateSubtotal().toFixed(2)}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-600">ITBIS (18%):</span>
                <span className="font-semibold">$RD {calculateTax().toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-bold text-xl pt-3 border-t-2 border-gray-300">
                <span className="text-gray-800">Total:</span>
                <span className="text-green-600">$RD {calculateTotal().toFixed(2)}</span>
              </div>
            </div>
            
            <button
              onClick={processSale}
              disabled={loading || saleItems.length === 0}
              className="w-full mt-6 px-6 py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 disabled:from-gray-400 disabled:to-gray-500 transition-all duration-200 font-bold text-lg shadow-lg hover:shadow-xl"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="animate-spin">⏳</span> Procesando...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  💳 Procesar Venta
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* RNC Search Modal */}
      {showRncSearch && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-8 w-full max-w-3xl mx-4 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                  <span className="text-blue-600">🏢</span> Buscar Cliente por RNC
                </h3>
                <p className="text-gray-600 mt-1">Busque clientes registrados en la DGII</p>
              </div>
              <button
                onClick={() => {
                  setShowRncSearch(false);
                  setRncSearchTerm('');
                  setRncSearchResults([]);
                }}
                className="text-gray-500 hover:text-gray-700 bg-gray-100 hover:bg-gray-200 p-2 rounded-full transition-all duration-200"
              >
                ✕
              </button>
            </div>
            
            <div className="mb-6">
              <div className="flex space-x-3">
                <input
                  type="text"
                  placeholder="🔍 Ingrese RNC o nombre de empresa..."
                  value={rncSearchTerm}
                  onChange={(e) => setRncSearchTerm(e.target.value)}
                  className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-lg"
                  onKeyPress={(e) => e.key === 'Enter' && searchRnc()}
                />
                <button
                  onClick={searchRnc}
                  disabled={isSearchingRnc || !rncSearchTerm.trim()}
                  className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 disabled:from-gray-400 disabled:to-gray-500 transition-all duration-200 shadow-lg flex items-center gap-2"
                >
                  {isSearchingRnc ? (
                    <>
                      <span className="animate-spin">⏳</span> Buscando...
                    </>
                  ) : (
                    <>
                      🔍 Buscar
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="max-h-96 overflow-y-auto">
              {rncSearchResults.length > 0 ? (
                <div className="space-y-3">
                  {rncSearchResults.map((result) => (
                    <div
                      key={result.rnc}
                      className="p-4 border-2 border-gray-200 rounded-xl hover:border-blue-300 hover:shadow-lg cursor-pointer transition-all duration-200 bg-gradient-to-r from-white to-gray-50"
                      onClick={() => selectFromRnc(result)}
                    >
                      <div className="font-bold text-lg text-gray-900">{result.businessName}</div>
                      {result.commercialName && result.commercialName !== result.businessName && (
                        <div className="text-gray-700 mt-1">{result.commercialName}</div>
                      )}
                      <div className="text-blue-600 font-semibold mt-2">RNC: {result.rnc}</div>
                      <div className="flex gap-4 text-sm text-gray-600 mt-2">
                        <span className={`px-2 py-1 rounded-full ${result.status === 'ACTIVO' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                          Estado: {result.status}
                        </span>
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full">
                          {result.category}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : rncSearchTerm && !isSearchingRnc ? (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">🔍</div>
                  <p className="text-gray-500 text-lg">
                    No se encontraron resultados
                  </p>
                  <p className="text-gray-400 text-sm mt-2">
                    Intente con otro RNC o nombre de empresa
                  </p>
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">🏢</div>
                  <p className="text-gray-500 text-lg">
                    Ingrese un RNC o nombre de empresa para buscar
                  </p>
                  <p className="text-gray-400 text-sm mt-2">
                    Conectado con la base de datos oficial de la DGII
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
