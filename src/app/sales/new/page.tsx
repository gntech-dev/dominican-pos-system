'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getAuthHeaders } from '@/lib/auth';
import ReceiptModal from '@/components/receipts/ReceiptModal';
import FormalInvoiceModal from '@/components/receipts/FormalInvoiceModal';
import LogoSection from '@/components/ui/LogoSection';

interface Product {
  id: string;
  name: string;
  code: string;
  price: number;
  stock: number;
}

interface Customer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  rnc?: string;
}

interface SaleItem {
  productId: string;
  quantity: number;
  unitPrice: number;
  product?: Product;
}

interface NCFSequence {
  id: string;
  type: string;
  currentNumber: number;
  maxNumber: number;
  remaining?: number;
}

interface ReceiptItem {
  id: string;
  quantity: number;
  unitPrice: number;
  totalPrice?: number;
  product: {
    name: string;
    code: string;
    description?: string;
  };
}

interface ReceiptData {
  id?: string;
  saleNumber?: string;
  ncf: string;
  createdAt: string;
  subtotal: number;
  tax: number;
  total: number;
  paymentMethod: string;
  cashierName?: string;
  business?: {
    name?: string;
    rnc?: string;
    address?: string;
    phone?: string;
    email?: string;
    website?: string;
    slogan?: string;
  };
  customer?: {
    name: string;
    rnc?: string;
    email?: string;
  };
  items: ReceiptItem[];
}

interface RncValidationResult {
  valid: boolean;
  businessName?: string;
  error?: string;
}

interface UserProfile {
  id: string;
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  fullName: string;
  role: string;
}

export default function NewSalePage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [saleItems, setSaleItems] = useState<SaleItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [customerSearchTerm, setCustomerSearchTerm] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [loading, setLoading] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [receiptData, setReceiptData] = useState<ReceiptData | null>(null);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [saleIdForInvoice, setSaleIdForInvoice] = useState<string | null>(null);
  
  // NCF related states
  const [ncfSequences, setNcfSequences] = useState<NCFSequence[]>([]);
  const [selectedNcfType, setSelectedNcfType] = useState<string>('');
  const [showNcfGuide, setShowNcfGuide] = useState(false);
  
  // Walk-in customer RNC validation
  const [walkInRnc, setWalkInRnc] = useState('');
  const [walkInCustomerName, setWalkInCustomerName] = useState('');
  const [rncValidationLoading, setRncValidationLoading] = useState(false);
  const [rncValidationResult, setRncValidationResult] = useState<RncValidationResult | null>(null);
  
  // User profile state
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [userProfileLoading, setUserProfileLoading] = useState(false);

  // Categories and validation states
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [validatingRnc, setValidatingRnc] = useState(false);

  // Debug modal state changes
  useEffect(() => {
    console.log('Modal states:', {
      showReceiptModal,
      showInvoiceModal,
      saleIdForInvoice
    });
  }, [showReceiptModal, showInvoiceModal, saleIdForInvoice]);

  // Filtered data
  const filteredProducts = (() => {
    if (!searchTerm.trim()) return products;
    return products.filter(product =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.code.toLowerCase().includes(searchTerm.toLowerCase())
    );
  })();

  const filteredCustomers = (() => {
    if (!customerSearchTerm.trim()) return [];
    return customers.filter(customer =>
      customer.name.toLowerCase().includes(customerSearchTerm.toLowerCase()) ||
      (customer.rnc && customer.rnc.includes(customerSearchTerm))
    );
  })();

  // Load initial data
  useEffect(() => {
    // Check authentication first
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    const loadData = async () => {
      await Promise.all([
        loadProducts(),
        loadCustomers(),
        loadCategories(),
        loadNCFSequences(),
        loadUserProfile()
      ]);
    };

    loadData();
  }, [router]);

  const loadProducts = async () => {
    try {
      const response = await fetch('/api/products', {
        method: 'GET',
        headers: getAuthHeaders()
      });

      if (response.ok) {
        // Handle the API response format: { success: true, data: { products: [...] } }
        const result = await response.json();
        console.log('Products API response:', result);
        
        let productsArray = [];
        if (result.success && result.data && result.data.products) {
          productsArray = result.data.products;
        } else if (Array.isArray(result)) {
          productsArray = result;
        }

        // Convert Decimal fields to numbers
        const processedProducts = productsArray.map((product: any) => ({
          ...product,
          price: Number(product.price || 0),
          stock: Number(product.stock || 0)
        }));

        setProducts(processedProducts);
      } else if (response.status === 401) {
        // Redirect to login if unauthorized
        localStorage.removeItem('token');
        router.push('/login');
      }
    } catch (error) {
      console.error('Error loading products:', error);
    }
  };

  const loadCustomers = async () => {
    try {
      const response = await fetch('/api/customers', {
        method: 'GET',
        headers: getAuthHeaders()
      });

      if (response.ok) {
        // Handle the API response format: { success: true, data: { customers: [...] } }
        const result = await response.json();
        console.log('Customers API response:', result);
        
        let customersArray = [];
        if (result.success && result.data && result.data.customers) {
          customersArray = result.data.customers;
        } else if (Array.isArray(result)) {
          customersArray = result;
        }

        setCustomers(customersArray);
      }
    } catch (error) {
      console.error('Error loading customers:', error);
    }
  };

  const loadCategories = async () => {
    try {
      const response = await fetch('/api/categories', {
        method: 'GET',
        headers: getAuthHeaders()
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Categories API response:', result);
        
        let categoriesArray = [];
        if (result.success && result.data && result.data.categories) {
          categoriesArray = result.data.categories;
        } else if (Array.isArray(result)) {
          categoriesArray = result;
        }

        setCategories(categoriesArray);
      }
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const loadNCFSequences = async () => {
    try {
      const response = await fetch('/api/ncf-sequences', {
        method: 'GET',
        headers: getAuthHeaders()
      });

      if (response.ok) {
        // Handle the API response format: { success: true, data: [...] }
        const result = await response.json();
        console.log('🔍 NCF Sequences API response:', result);
        
        let sequencesArray = [];
        if (result.success && Array.isArray(result.data)) {
          sequencesArray = result.data;
        } else if (Array.isArray(result)) {
          sequencesArray = result;
        }

        console.log('📋 Raw sequences array:', sequencesArray);

        // Filter for active sequences and sequences that have remaining capacity
        const activeSequences = sequencesArray.filter((seq: any) => {
          const isActive = seq.isActive === true; // Use correct field name from database
          const hasRemaining = seq.currentNumber < seq.maxNumber;
          const notExpired = !seq.isExpired;
          console.log(`📊 Sequence ${seq.type}: isActive=${isActive}, current=${seq.currentNumber}, max=${seq.maxNumber}, hasRemaining=${hasRemaining}, notExpired=${notExpired}`);
          return isActive && hasRemaining && notExpired;
        }).map((seq: any) => ({
          ...seq,
          remaining: seq.maxNumber - seq.currentNumber
        }));

        console.log('✅ Active sequences found:', activeSequences);
        setNcfSequences(activeSequences);
        
        // Set default NCF type if not set and sequences are available
        if (!selectedNcfType && activeSequences.length > 0) {
          // Default to B02 (consumer) if available, otherwise first available
          const defaultSeq = activeSequences.find((seq: any) => seq.type === 'B02') || activeSequences[0];
          console.log('🎯 Setting default NCF type:', defaultSeq.type);
          setSelectedNcfType(defaultSeq.type);
        } else if (activeSequences.length === 0) {
          console.warn('⚠️ No active NCF sequences found after filtering');
        }
      } else {
        console.error('❌ NCF sequences API error:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('💥 Error loading NCF sequences:', error);
    }
  };

  const loadUserProfile = async () => {
    setUserProfileLoading(true);
    try {
      const response = await fetch('/api/auth/profile', {
        method: 'GET',
        headers: getAuthHeaders()
      });

      if (response.ok) {
        const result = await response.json();
        console.log('👤 User profile loaded:', result);
        
        if (result.success && result.data) {
          setUserProfile(result.data);
        }
      } else if (response.status === 401) {
        // Redirect to login if unauthorized
        localStorage.removeItem('token');
        router.push('/login');
      } else {
        console.error('Failed to load user profile:', response.status);
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
    } finally {
      setUserProfileLoading(false);
    }
  };

  // Function to validate RNC using DGII database
  const validateRnc = async (rnc: string) => {
    if (!rnc || rnc.length < 9) {
      setRncValidationResult(null);
      return;
    }

    setRncValidationLoading(true);
    setRncValidationResult(null);

    try {
      const cleanRnc = rnc.replace(/\D/g, '');
      const response = await fetch(`/api/rnc/validate?rnc=${cleanRnc}`, {
        method: 'GET',
        headers: getAuthHeaders()
      });

      if (response.ok) {
        const result = await response.json();
        console.log('RNC validation result:', result);
        
        if (result.success && result.data) {
          setRncValidationResult({
            valid: true,
            businessName: result.data.name || result.data.businessName
          });
        } else {
          setRncValidationResult({
            valid: false,
            error: result.error || 'RNC no encontrado en la base de datos de DGII'
          });
        }
      } else {
        setRncValidationResult({
          valid: false,
          error: 'Error al validar RNC con DGII'
        });
      }
    } catch (error) {
      console.error('Error validating RNC:', error);
      setRncValidationResult({
        valid: false,
        error: 'Error de conexión al validar RNC'
      });
    } finally {
      setRncValidationLoading(false);
    }
  };

  // Function to validate walk-in customer RNC
  const validateWalkInRnc = async () => {
    if (!walkInRnc || walkInRnc.length < 9) {
      setRncValidationResult(null);
      return;
    }

    setValidatingRnc(true);
    setRncValidationResult(null);

    try {
      const cleanRnc = walkInRnc.replace(/\D/g, '');
      const response = await fetch(`/api/rnc/validate?rnc=${cleanRnc}`, {
        method: 'GET',
        headers: getAuthHeaders()
      });

      if (response.ok) {
        const result = await response.json();
        console.log('RNC validation result:', result);
        
        if (result.success && result.data) {
          setRncValidationResult({
            valid: true,
            businessName: result.data.name || result.data.businessName
          });
        } else {
          setRncValidationResult({
            valid: false,
            error: result.error || 'RNC no encontrado en la base de datos de DGII'
          });
        }
      } else {
        setRncValidationResult({
          valid: false,
          error: 'Error al validar RNC con DGII'
        });
      }
    } catch (error) {
      console.error('Error validating RNC:', error);
      setRncValidationResult({
        valid: false,
        error: 'Error de conexión al validar RNC'
      });
    } finally {
      setValidatingRnc(false);
    }
  };

  const handleCustomerRncChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newRnc = e.target.value;
    setWalkInRnc(newRnc);
    
    // Auto-validate when RNC is complete (9 or 11 digits)
    const cleanRnc = newRnc.replace(/\D/g, '');
    if (cleanRnc.length === 9 || cleanRnc.length === 11) {
      validateRnc(newRnc);
    } else {
      setRncValidationResult(null);
    }
  };

  const handleNcfTypeChange = (newType: string) => {
    setSelectedNcfType(newType);
    console.log('NCF type changed to:', newType);
  };

  const addProduct = (product: Product) => {
    const existingItem = saleItems.find(item => item.productId === product.id);
    
    if (existingItem) {
      // Update quantity
      setSaleItems(saleItems.map(item => 
        item.productId === product.id 
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      // Add new item
      setSaleItems([...saleItems, {
        productId: product.id,
        quantity: 1,
        unitPrice: product.price,
        product: product
      }]);
    }
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(productId);
      return;
    }
    
    setSaleItems(saleItems.map(item => 
      item.productId === productId 
        ? { ...item, quantity }
        : item
    ));
  };

  const removeItem = (productId: string) => {
    setSaleItems(saleItems.filter(item => item.productId !== productId));
  };

  const calculateSubtotal = () => {
    return saleItems.reduce((total, item) => total + (item.quantity * item.unitPrice), 0);
  };

  const calculateTax = () => {
    return calculateSubtotal() * 0.18; // 18% ITBIS
  };

  const calculateTotal = () => {
    return calculateSubtotal() + calculateTax();
  };

  const handleReceiptClose = () => {
    console.log('Receipt modal closing');
    setShowReceiptModal(false);
    setReceiptData(null);
  };

  const handleShowInvoice = (saleId: string) => {
    console.log('Showing invoice for sale:', saleId);
    setSaleIdForInvoice(saleId);
    setShowReceiptModal(false); // Close receipt modal
    setShowInvoiceModal(true);   // Open invoice modal
  };

  const handleInvoiceClose = () => {
    console.log('Invoice modal closing');
    setShowInvoiceModal(false);
    setSaleIdForInvoice(null);
  };

  const processSale = async () => {
    if (saleItems.length === 0) {
      alert('Agregue productos antes de procesar la venta');
      return;
    }

    if (!selectedNcfType) {
      alert('Seleccione un tipo de NCF');
      return;
    }

    setLoading(true);

    try {
      // Prepare sale data with customer info at root level (not nested)
      const saleData: any = {
        items: saleItems.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice
        })),
        paymentMethod,
        ncfType: selectedNcfType
      };

      // Add customer data based on whether it's a registered customer or walk-in
      if (selectedCustomer) {
        saleData.customerId = selectedCustomer.id;
        // Note: For registered customers, the backend will fetch RNC from database
      } else if (walkInRnc.trim()) {
        saleData.customerRnc = walkInRnc.trim();
        saleData.customerName = walkInCustomerName.trim() || (rncValidationResult?.businessName) || 'Cliente No Registrado';
      }

      console.log('Processing sale with data:', saleData);

      const response = await fetch('/api/sales', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify(saleData)
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Sale processed successfully:', result);
        
        const saleId = result.data?.id || result.id;
        
        if (saleId) {
          // Clear the form
          setSaleItems([]);
          setSelectedCustomer(null);
          setCustomerSearchTerm('');
          setWalkInRnc('');
          setWalkInCustomerName('');
          setRncValidationResult(null);

          try {
            // Fetch receipt data
            const receiptResponse = await fetch(`/api/receipts/${saleId}`, {
              method: 'GET',
              headers: getAuthHeaders()
            });

            if (receiptResponse.ok) {
              const receiptApiData = await receiptResponse.json();
              console.log('Receipt data received:', receiptApiData);
              console.log('🧾 DEBUG - Raw NCF from API:', receiptApiData.sale?.ncf);
              console.log('🧾 DEBUG - NCF type:', typeof receiptApiData.sale?.ncf);

              // Transform the API data to match ReceiptData interface
              const transformedReceiptData: ReceiptData = {
                id: saleId,
                saleNumber: receiptApiData.sale?.saleNumber || `VTA-${Date.now()}`,
                ncf: receiptApiData.sale?.ncf || '',
                createdAt: new Date().toISOString(),
                subtotal: Number(receiptApiData.sale?.subtotal || calculateSubtotal()),
                tax: Number(receiptApiData.sale?.itbis || calculateTax()),
                total: Number(receiptApiData.sale?.total || calculateTotal()),
                paymentMethod: receiptApiData.sale?.paymentMethod || paymentMethod,
                cashierName: receiptApiData.sale?.cashier?.firstName && receiptApiData.sale?.cashier?.lastName 
                  ? `${receiptApiData.sale.cashier.firstName} ${receiptApiData.sale.cashier.lastName}`.trim()
                  : userProfile?.fullName || userProfile?.firstName || 'Cajero',
                business: {
                  name: receiptApiData.business?.name || 'Su Empresa',
                  rnc: receiptApiData.business?.rnc || '',
                  address: receiptApiData.business?.address || '',
                  phone: receiptApiData.business?.phone || '',
                  email: receiptApiData.business?.email || '',
                },
                customer: {
                  name: receiptApiData.customer?.name || 
                        selectedCustomer?.name || 
                        walkInCustomerName || 
                        (rncValidationResult?.businessName) || 
                        'Cliente General',
                  rnc: receiptApiData.customer?.rnc || 
                       selectedCustomer?.rnc || 
                       walkInRnc || 
                       undefined
                },
                items: receiptApiData.sale?.items?.map((item: any, index: number) => ({
                  id: item.id || `item-${index}`,
                  quantity: item.quantity || 1,
                  unitPrice: Number(item.unitPrice || item.price || 0),
                  totalPrice: Number(item.quantity || 1) * Number(item.unitPrice || item.price || 0),
                  product: {
                    name: item.product?.name || item.name || 'Producto',
                    code: item.product?.code || item.code || '',
                    description: item.product?.description || ''
                  }
                })) || saleItems.map((item, index) => ({
                  id: item.productId || `item-${index}`,
                  quantity: item.quantity,
                  unitPrice: item.unitPrice,
                  totalPrice: item.quantity * item.unitPrice,
                  product: {
                    name: item.product?.name || 'Producto',
                    code: item.product?.code || '',
                    description: ''
                  }
                }))
              };

              console.log('Transformed receipt data:', transformedReceiptData);
              console.log('🧾 DEBUG - Transformed NCF:', transformedReceiptData.ncf);
              console.log('🧾 DEBUG - Will pass to modal:', !!transformedReceiptData.ncf);
              setReceiptData(transformedReceiptData);
              setShowReceiptModal(true);
            } else {
              console.error('Failed to fetch receipt data');
              alert('Venta procesada, pero error al generar recibo');
            }
          } catch (receiptError) {
            console.error('Error fetching receipt:', receiptError);
            alert('Venta procesada, pero error al generar recibo');
          }
        } else {
          console.error('No sale ID returned');
          alert('Venta procesada, pero error al obtener ID');
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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto p-3 max-w-full">
        {/* Professional Header */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 mb-4 shadow-sm">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              {/* Small Logo for POS Interface */}
              <LogoSection 
                className="h-10 w-10" 
                size="small"
                showFallback={false}
              />
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">💳</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Nueva Venta</h1>
                <p className="text-xs text-gray-600">POS System • DGII Compliant</p>
              </div>
              {/* User Profile Indicator */}
              {userProfile && (
                <button
                  onClick={() => router.push('/profile')}
                  className="ml-4 flex items-center gap-2 bg-blue-50 px-3 py-2 rounded-lg border border-blue-200 hover:bg-blue-100 transition-all duration-200 cursor-pointer"
                  title="Ver mi perfil"
                >
                  <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs font-bold">
                      {userProfile.firstName?.[0]?.toUpperCase()}{userProfile.lastName?.[0]?.toUpperCase()}
                    </span>
                  </div>
                  <div className="text-xs">
                    <div className="font-semibold text-gray-900">{userProfile.fullName}</div>
                    <div className="text-blue-600">{userProfile.role}</div>
                  </div>
                </button>
              )}
            </div>
            <button
              onClick={() => router.push('/sales')}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-all font-medium border border-gray-300 text-sm"
            >
              ← Volver
            </button>
          </div>
        </div>

        {/* Professional Three-Column Layout */}
        <div className="grid grid-cols-12 gap-4">
          {/* Left Column - Products */}
          <div className="col-span-12 lg:col-span-5">
            <div className="bg-white rounded-lg border border-gray-200 p-4 h-[70vh] flex flex-col shadow-sm">
              {/* Professional Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center">
                    <span className="text-white text-xs">📦</span>
                  </div>
                  <h2 className="text-base font-bold text-gray-900">Productos</h2>
                  <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded-lg text-xs font-medium border border-blue-200">
                    {filteredProducts.length}
                  </span>
                </div>
              </div>
              
              {/* Professional Search & Filter */}
              <div className="space-y-3 mb-4">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-400 text-sm">🔍</span>
                  </div>
                  <input
                    type="text"
                    placeholder="Buscar productos..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-gray-50 text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition-all placeholder-gray-500 font-medium text-sm"
                  />
                </div>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition-all font-medium text-sm"
                >
                  <option value="">Todas las categorías</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Professional Products Grid */}
              <div className="flex-1 overflow-hidden">
                <div className="grid grid-cols-1 gap-3 h-full overflow-y-auto">
                  {filteredProducts.map((product) => (
                    <div
                      key={product.id}
                      className="group bg-white border border-gray-200 rounded-lg p-3 hover:bg-gray-50 cursor-pointer transition-all duration-200 hover:border-blue-300 shadow-sm"
                      onClick={() => addProduct(product)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-900 text-sm group-hover:text-blue-600 transition-colors truncate">
                            {product.name}
                          </h3>
                          <div className="flex items-center justify-between mt-1">
                            <span className="text-green-600 font-bold text-sm">
                              $RD {Number(product.price || 0).toFixed(2)}
                            </span>
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium border ${
                              product.stock > 10 
                                ? 'bg-green-50 text-green-700 border-green-200' 
                                : product.stock > 0 
                                ? 'bg-yellow-50 text-yellow-700 border-yellow-200' 
                                : 'bg-red-50 text-red-700 border-red-200'
                            }`}>
                              {product.stock}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  {filteredProducts.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-8">
                      <div className="text-3xl mb-2 text-gray-400">📦</div>
                      <p className="text-gray-600 font-medium text-sm">No hay productos</p>
                      <p className="text-gray-500 text-xs">Prueba otros términos</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Middle Column - Customer & Cart */}
          <div className="col-span-12 lg:col-span-4 space-y-4">
            {/* Professional Customer Section */}
            <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-6 h-6 bg-green-600 rounded-lg flex items-center justify-center">
                  <span className="text-white text-xs">👤</span>
                </div>
                <h3 className="text-base font-bold text-gray-900">Cliente</h3>
              </div>
              
              {/* Professional Customer Search */}
              <div className="relative mb-3">
                <input
                  type="text"
                  placeholder="Buscar cliente..."
                  value={customerSearchTerm}
                  onChange={(e) => setCustomerSearchTerm(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition-all placeholder-gray-500 font-medium text-sm"
                />
              </div>

              {/* Customer Selection Dropdown */}
              {customerSearchTerm && (
                <div className="mb-3 max-h-24 overflow-y-auto bg-white border border-gray-200 rounded-lg shadow-sm">
                  {filteredCustomers.map((customer) => (
                    <div
                      key={customer.id}
                      className="p-2 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0 transition-colors"
                      onClick={() => {
                        setSelectedCustomer(customer);
                        setCustomerSearchTerm('');
                        setWalkInRnc('');
                        setWalkInCustomerName('');
                        setRncValidationResult(null);
                      }}
                    >
                      <div className="font-semibold text-gray-900 text-sm">{customer.name}</div>
                      {customer.rnc && (
                        <div className="text-xs text-gray-600">RNC: {customer.rnc}</div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Selected Customer */}
              {selectedCustomer && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="font-semibold text-green-800 text-sm">{selectedCustomer.name}</div>
                  {selectedCustomer.rnc && (
                    <div className="text-xs text-green-600">RNC: {selectedCustomer.rnc}</div>
                  )}
                  <button
                    onClick={() => {
                      setSelectedCustomer(null);
                      setWalkInRnc('');
                      setWalkInCustomerName('');
                      setRncValidationResult(null);
                    }}
                    className="mt-2 text-xs text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 px-2 py-1 rounded-md border border-red-200 font-medium transition-colors"
                  >
                    ✕ Remover
                  </button>
                </div>
              )}

              {/* Professional Walk-in Customer */}
              {!selectedCustomer && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <h4 className="font-semibold text-blue-800 mb-2 text-sm">🚶 Cliente Ocasional</h4>
                  
                  <div className="space-y-2">
                    <input
                      type="text"
                      placeholder="RNC..."
                      value={walkInRnc}
                      onChange={(e) => setWalkInRnc(e.target.value)}
                      className="w-full px-3 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition-all placeholder-gray-500 font-medium text-sm"
                    />
                    <input
                      type="text"
                      placeholder="Nombre..."
                      value={walkInCustomerName}
                      onChange={(e) => setWalkInCustomerName(e.target.value)}
                      className="w-full px-3 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition-all placeholder-gray-500 font-medium text-sm"
                    />
                  </div>

                  {walkInRnc && (
                    <button
                      onClick={validateWalkInRnc}
                      disabled={validatingRnc}
                      className="w-full mt-2 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg font-medium disabled:opacity-50 transition-all text-sm"
                    >
                      {validatingRnc ? '🔄 Validando...' : '✓ Validar RNC'}
                    </button>
                  )}

                  {/* RNC Validation Result */}
                  {rncValidationResult && (
                    <div className={`mt-2 p-2 rounded-lg border text-xs ${
                      rncValidationResult.valid 
                        ? 'bg-green-50 border-green-200 text-green-800' 
                        : 'bg-red-50 border-red-200 text-red-800'
                    }`}>
                      <div className="flex items-center gap-1">
                        <span>{rncValidationResult.valid ? '✅' : '❌'}</span>
                        <span className="font-medium">
                          {rncValidationResult.valid ? 'RNC Válido' : 'RNC Inválido'}
                        </span>
                      </div>
                      {rncValidationResult.businessName && (
                        <div className="mt-1 opacity-90 text-xs">
                          {rncValidationResult.businessName}
                        </div>
                      )}
                      {rncValidationResult.error && (
                        <div className="mt-1 opacity-90 text-xs">
                          {rncValidationResult.error}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Professional Shopping Cart */}
            <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-purple-600 rounded-lg flex items-center justify-center">
                    <span className="text-white text-xs">🛒</span>
                  </div>
                  <h3 className="text-base font-bold text-gray-900">Carrito</h3>
                </div>
                {saleItems.length > 0 && (
                  <span className="bg-purple-50 text-purple-700 px-2 py-1 rounded-lg text-xs font-bold border border-purple-200">
                    {saleItems.length}
                  </span>
                )}
              </div>
              
              {saleItems.length === 0 ? (
                <div className="text-center py-6">
                  <div className="text-3xl mb-2 text-gray-400">🛒</div>
                  <p className="text-gray-600 font-medium text-sm">Carrito vacío</p>
                  <p className="text-gray-500 text-xs">Agrega productos</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {saleItems.map((item) => (
                    <div key={item.productId} className="flex items-center gap-2 p-2 bg-gray-50 border border-gray-200 rounded-lg transition-all shadow-sm">
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-gray-900 text-xs truncate">{item.product?.name}</div>
                        <div className="text-xs text-gray-600">$RD {Number(item.unitPrice || 0).toFixed(2)}</div>
                      </div>
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => updateQuantity(item.productId, parseInt(e.target.value) || 0)}
                          className="w-12 px-1 py-1 bg-white text-gray-900 border border-gray-300 rounded text-center focus:ring-1 focus:ring-blue-500 focus:border-blue-500 focus:outline-none font-medium text-xs"
                        />
                        <button
                          onClick={() => removeItem(item.productId)}
                          className="w-6 h-6 flex items-center justify-center text-red-600 hover:text-white hover:bg-red-500 bg-red-50 rounded transition-all text-xs border border-red-200"
                        >
                          ×
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Summary & Payment */}
          <div className="col-span-12 lg:col-span-3 space-y-4">
            {/* Professional Summary & Payment */}
            <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-6 h-6 bg-green-600 rounded-lg flex items-center justify-center">
                  <span className="text-white text-xs">💰</span>
                </div>
                <h3 className="text-base font-bold text-gray-900">Resumen</h3>
              </div>
              
              <div className="space-y-3">
                {/* Summary Lines */}
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Subtotal:</span>
                    <span className="font-semibold text-gray-900">$RD {calculateSubtotal().toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">ITBIS (18%):</span>
                    <span className="font-semibold text-gray-900">$RD {calculateTax().toFixed(2)}</span>
                  </div>
                  <div className="border-t border-gray-200 pt-2">
                    <div className="flex justify-between items-center">
                      <span className="text-base font-bold text-gray-900">TOTAL:</span>
                      <span className="text-lg font-bold text-green-600">$RD {calculateTotal().toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {/* Payment Method */}
                <div className="pt-3 border-t border-gray-200">
                  <label className="block text-sm font-medium text-gray-900 mb-2">Método de Pago</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition-all font-medium text-sm"
                  >
                    <option value="CASH">💵 Efectivo</option>
                    <option value="CARD">💳 Tarjeta</option>
                    <option value="TRANSFER">🏦 Transferencia</option>
                    <option value="CHECK">📝 Cheque</option>
                    <option value="CREDIT">🏷️ Crédito</option>
                  </select>
                </div>

                {/* NCF Type Selection */}
                <div className="pt-3 border-t border-gray-200">
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-gray-900">Tipo de NCF</label>
                    <button
                      onClick={() => setShowNcfGuide(true)}
                      className="text-xs text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-2 py-1 rounded-md border border-blue-200 transition-colors"
                    >
                      ❓ Guía
                    </button>
                  </div>
                  <select
                    value={selectedNcfType}
                    onChange={(e) => setSelectedNcfType(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition-all font-medium text-sm"
                  >
                    <option value="">Seleccionar NCF...</option>
                    {ncfSequences.map((sequence) => (
                      <option key={sequence.type} value={sequence.type}>
                        {sequence.type} - {sequence.type === 'B01' ? 'Crédito Fiscal' : 
                                           sequence.type === 'B02' ? 'Consumo' :
                                           sequence.type === 'B03' ? 'Nota de Débito' :
                                           sequence.type === 'B04' ? 'Nota de Crédito' : sequence.type}
                        {sequence.remaining !== undefined && ` (${sequence.remaining} restantes)`}
                      </option>
                    ))}
                  </select>
                  
                  {/* NCF Requirements Warning */}
                  {selectedNcfType === 'B01' && (!selectedCustomer && !walkInRnc) && (
                    <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <div className="flex items-center gap-1 text-yellow-800 text-xs">
                        <span>⚠️</span>
                        <span>B01 requiere cliente con RNC válido</span>
                      </div>
                    </div>
                  )}
                  
                  {/* NCF Info */}
                  {selectedNcfType && (
                    <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="text-blue-800 text-xs">
                        <div className="flex items-center gap-1 font-medium">
                          <span>🧾</span>
                          <span>NCF: {selectedNcfType}</span>
                        </div>
                        {(() => {
                          const sequence = ncfSequences.find(s => s.type === selectedNcfType);
                          if (sequence) {
                            return (
                              <div className="mt-1 opacity-90">
                                Próximo número: {sequence.currentNumber + 1}
                                {sequence.remaining !== undefined && ` • ${sequence.remaining} restantes`}
                              </div>
                            );
                          }
                          return null;
                        })()}
                      </div>
                    </div>
                  )}
                </div>

                {/* Professional Process Button */}
                <button
                  onClick={processSale}
                  disabled={loading || saleItems.length === 0}
                  className="w-full mt-4 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all duration-200 font-bold text-sm"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="animate-spin">⏳</span> Procesando...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      🚀 Procesar Venta
                    </span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Thermal Receipt Modal */}
      {showReceiptModal && receiptData && (
        <ReceiptModal
          receiptData={receiptData!}
          onClose={handleReceiptClose}
          onEmailSent={() => {
            console.log('Email sent successfully');
          }}
          showInvoiceButton={true}
          onShowInvoice={() => handleShowInvoice(receiptData?.id || receiptData?.saleNumber || '')}
        />
      )}

      {/* Formal Invoice Modal */}
      {showInvoiceModal && saleIdForInvoice && (
        <FormalInvoiceModal
          isOpen={showInvoiceModal}
          onClose={handleInvoiceClose}
          saleId={saleIdForInvoice!}
        />
      )}

      {/* NCF Guide Modal */}
      {showNcfGuide && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900">Guía de Tipos de NCF</h3>
              <button
                onClick={() => setShowNcfGuide(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="border border-blue-200 rounded-lg p-4 bg-blue-50">
                <h4 className="font-bold text-blue-900 mb-2">🧾 B01 - Crédito Fiscal</h4>
                <p className="text-blue-800 text-sm mb-2">
                  Para empresas que pueden usar como crédito fiscal el ITBIS pagado.
                </p>
                <div className="text-xs text-blue-700">
                  <strong>Requisitos:</strong>
                  <ul className="list-disc list-inside mt-1 space-y-1">
                    <li>Cliente debe tener RNC válido</li>
                    <li>Cliente debe estar registrado en DGII</li>
                    <li>Aplicable para ventas gravadas con ITBIS</li>
                  </ul>
                </div>
              </div>

              <div className="border border-green-200 rounded-lg p-4 bg-green-50">
                <h4 className="font-bold text-green-900 mb-2">🛍️ B02 - Consumo</h4>
                <p className="text-green-800 text-sm mb-2">
                  Para ventas a consumidores finales que no requieren crédito fiscal.
                </p>
                <div className="text-xs text-green-700">
                  <strong>Uso:</strong>
                  <ul className="list-disc list-inside mt-1 space-y-1">
                    <li>Ventas al por menor</li>
                    <li>Clientes sin RNC o personas físicas</li>
                    <li>No requiere datos fiscales del cliente</li>
                  </ul>
                </div>
              </div>

              <div className="border border-orange-200 rounded-lg p-4 bg-orange-50">
                <h4 className="font-bold text-orange-900 mb-2">📈 B03 - Nota de Débito</h4>
                <p className="text-orange-800 text-sm mb-2">
                  Para aumentar el valor de una factura ya emitida.
                </p>
              </div>

              <div className="border border-red-200 rounded-lg p-4 bg-red-50">
                <h4 className="font-bold text-red-900 mb-2">📉 B04 - Nota de Crédito</h4>
                <p className="text-red-800 text-sm mb-2">
                  Para disminuir el valor de una factura ya emitida o para anulaciones.
                </p>
              </div>

              <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                <h5 className="font-bold text-gray-900 mb-2">💡 Recomendaciones</h5>
                <ul className="text-sm text-gray-700 space-y-1">
                  <li>• Use B01 para empresas con RNC válido</li>
                  <li>• Use B02 para consumidores finales</li>
                  <li>• Verifique que tenga secuencias NCF disponibles</li>
                  <li>• Los NCF deben usarse en orden secuencial</li>
                </ul>
              </div>
            </div>

            <div className="flex justify-end mt-6">
              <button
                onClick={() => setShowNcfGuide(false)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
