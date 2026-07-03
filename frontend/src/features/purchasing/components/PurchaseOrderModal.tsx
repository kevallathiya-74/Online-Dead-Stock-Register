import {
    CalculatorIcon,
    PlusIcon,
    ShoppingBagIcon,
    TrashIcon,
    XMarkIcon,
} from '@heroicons/react/24/outline';
import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import api from '../../../services/api';

interface PurchaseOrderModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (poData: any) => void;
}

interface OrderItem {
  id: string;
  description: string;
  quantity: number;
  unit_price: number;
  total: number;
}

const PurchaseOrderModal: React.FC<PurchaseOrderModalProps> = ({ open, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    vendor: '',
    delivery_date: '',
    billing_address: '',
    shipping_address: '',
    terms: 'Net 30',
    notes: '',
    urgent: false,
  });

  const [items, setItems] = useState<OrderItem[]>([]);
  const [newItem, setNewItem] = useState({
    description: '',
    quantity: 1,
    unit_price: 0,
  });
  
  const [loading, setLoading] = useState(false);
  const [vendors, setVendors] = useState<any[]>([]);
  const [loadingVendors, setLoadingVendors] = useState(true);

  useEffect(() => {
    const loadVendors = async () => {
      try {
        setLoadingVendors(true);
        const response = await api.get('/vendors');
        const vendorData = response.data?.data || response.data || [];
        setVendors(Array.isArray(vendorData) ? vendorData : []);
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (error: any) {
        toast.error('Failed to load vendors');
        setVendors([]);
      } finally {
        setLoadingVendors(false);
      }
    };

    if (open) {
      loadVendors();
    }
  }, [open]);

  const terms = [
    'Net 15',
    'Net 30',
    'Net 45',
    'Net 60',
    'Cash on Delivery',
    '2/10 Net 30',
  ];

  if (!open) return null;

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleItemChange = (field: string, value: any) => {
    setNewItem(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const addItem = () => {
    if (!newItem.description.trim()) {
      toast.error('Please enter item description');
      return;
    }

    const item: OrderItem = {
      id: Date.now().toString(),
      description: newItem.description,
      quantity: newItem.quantity,
      unit_price: newItem.unit_price,
      total: newItem.quantity * newItem.unit_price,
    };

    setItems(prev => [...prev, item]);
    setNewItem({
      description: '',
      quantity: 1,
      unit_price: 0,
    });
    toast.success('Item added to purchase order');
  };

  const removeItem = (itemId: string) => {
    setItems(prev => prev.filter(item => item.id !== itemId));
    toast.info('Item removed from purchase order');
  };

  const calculateTotals = () => {
    const subtotal = items.reduce((sum, item) => sum + item.total, 0);
    const tax = subtotal * 0.18; // 18% GST
    const total = subtotal + tax;
    return { subtotal, tax, total };
  };

  const handleSubmit = async () => {
    if (!formData.vendor) {
      toast.error('Please select a vendor');
      return;
    }

    if (items.length === 0) {
      toast.error('Please add at least one item');
      return;
    }

    if (!formData.delivery_date) {
      toast.error('Please select expected delivery date');
      return;
    }

    setLoading(true);
    try {
      const { subtotal, tax, total } = calculateTotals();
      
      const purchaseOrder = {
        vendor: formData.vendor,
        department: 'General',
        items: items.map(item => ({
          description: item.description,
          category: 'General',
          quantity: item.quantity,
          unit_price: item.unit_price,
          total_price: item.total,
          specifications: '',
          brand_preference: ''
        })),
        subtotal: subtotal,
        tax_amount: tax,
        shipping_cost: 0,
        total_amount: total,
        currency: 'INR',
        status: 'draft',
        priority: formData.urgent ? 'urgent' : 'medium',
        expected_delivery_date: new Date(formData.delivery_date).toISOString(),
        delivery_address: {
          street: formData.shipping_address || formData.billing_address || '',
          city: '',
          state: '',
          zip_code: '',
          country: 'India',
          contact_person: '',
          contact_phone: ''
        },
        payment_terms: formData.terms,
        payment_method: 'bank_transfer',
        notes: formData.notes
      };

      const response = await api.post('/purchase-management/orders', purchaseOrder);
      const createdPO = response.data?.data || response.data;
      
      onSubmit(createdPO);
      toast.success('Purchase Order created successfully!');
      
      setFormData({
        vendor: '',
        delivery_date: '',
        billing_address: '',
        shipping_address: '',
        terms: 'Net 30',
        notes: '',
        urgent: false,
      });
      setItems([]);
      onClose();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to create purchase order');
    } finally {
      setLoading(false);
    }
  };

  const { subtotal, tax, total } = calculateTotals();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in text-xs text-slate-655">
      <div className="bg-white rounded-2xl border border-slate-100 max-w-4xl w-full h-[90vh] flex flex-col shadow-card-xl animate-fade-in-up">
        
        {/* Title Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-1.5 font-bold font-display text-slate-900 text-sm">
            <ShoppingBagIcon className="w-5 h-5 text-brand-600" />
            Create Purchase Order
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg cursor-pointer">
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Modal Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Vendor Info Section */}
            <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-card space-y-3">
              <h4 className="font-bold text-slate-900 text-sm">Vendor & Delivery Parameters</h4>
              
              <div className="space-y-3">
                <div>
                  <label className="block font-semibold text-slate-655 mb-1">Select Vendor *</label>
                  <select
                    value={formData.vendor}
                    onChange={(e) => handleInputChange('vendor', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-205 rounded-xl bg-white"
                    disabled={loadingVendors}
                  >
                    <option value="">Choose Vendor...</option>
                    {vendors.filter(v => v.is_active).map((v) => (
                      <option key={v._id} value={v._id}>{v.vendor_name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-655 mb-1">Expected Delivery Date *</label>
                  <input
                    type="date"
                    required
                    value={formData.delivery_date}
                    onChange={(e) => handleInputChange('delivery_date', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-205 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-655 mb-1">Payment Terms</label>
                  <select
                    value={formData.terms}
                    onChange={(e) => handleInputChange('terms', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-205 rounded-xl bg-white"
                  >
                    {terms.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>
            </div>

            {/* Address Info Section */}
            <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-card space-y-3">
              <h4 className="font-bold text-slate-900 text-sm">Address Details</h4>
              
              <div className="space-y-3">
                <div>
                  <label className="block font-semibold text-slate-655 mb-1">Billing Address</label>
                  <textarea
                    rows={2}
                    value={formData.billing_address}
                    onChange={(e) => handleInputChange('billing_address', e.target.value)}
                    placeholder="Enter Billing address..."
                    className="w-full px-3 py-2 border border-slate-205 rounded-xl focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-655 mb-1">Shipping Address</label>
                  <textarea
                    rows={2}
                    value={formData.shipping_address}
                    onChange={(e) => handleInputChange('shipping_address', e.target.value)}
                    placeholder="Enter Shipping address..."
                    className="w-full px-3 py-2 border border-slate-205 rounded-xl focus:outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Add Order Line Items */}
          <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-card space-y-3">
            <h4 className="font-bold text-slate-900 text-sm">Add Items</h4>
            <div className="grid grid-cols-1 md:grid-cols-6 gap-3 items-end">
              <div className="md:col-span-3">
                <label className="block font-semibold text-slate-655 mb-1">Item Description *</label>
                <input
                  type="text"
                  value={newItem.description}
                  onChange={(e) => handleItemChange('description', e.target.value)}
                  placeholder="e.g. Dell XPS 15 Laptop"
                  className="w-full px-3 py-2 border border-slate-205 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-655 mb-1">Quantity</label>
                <input
                  type="number"
                  min={1}
                  value={newItem.quantity}
                  onChange={(e) => handleItemChange('quantity', parseInt(e.target.value) || 1)}
                  className="w-full px-3 py-2 border border-slate-205 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-655 mb-1">Unit Price (₹)</label>
                <input
                  type="number"
                  placeholder="0"
                  value={newItem.unit_price}
                  onChange={(e) => handleItemChange('unit_price', parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-slate-205 rounded-xl"
                />
              </div>

              <div>
                <button
                  onClick={addItem}
                  className="w-full inline-flex items-center justify-center gap-1.5 py-2 px-4 bg-brand-600 hover:bg-brand-700 text-white font-semibold rounded-xl cursor-pointer"
                >
                  <PlusIcon className="w-4 h-4" />
                  Add Item
                </button>
              </div>
            </div>
          </div>

          {/* Order Items Table Grid */}
          {items.length > 0 && (
            <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-card space-y-4">
              <h4 className="font-bold text-slate-900 text-sm">Order Items</h4>
              <div className="overflow-x-auto border border-slate-55 rounded-xl">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-500 font-semibold uppercase">
                      <th className="pb-3 pt-2 pl-4">Description</th>
                      <th className="pb-3 pt-2 text-center">Quantity</th>
                      <th className="pb-3 pt-2 text-right">Unit Price</th>
                      <th className="pb-3 pt-2 text-right">Total</th>
                      <th className="pb-3 pt-2 text-center pr-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 text-slate-700">
                    {items.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-55/50">
                        <td className="py-3 pl-4 font-bold text-slate-900">{item.description}</td>
                        <td className="py-3 text-center font-medium">{item.quantity}</td>
                        <td className="py-3 text-right">₹{item.unit_price.toLocaleString('en-IN')}</td>
                        <td className="py-3 text-right font-bold">₹{item.total.toLocaleString('en-IN')}</td>
                        <td className="py-3 text-center pr-4">
                          <button
                            onClick={() => removeItem(item.id)}
                            className="p-1.5 text-slate-450 hover:text-red-655 hover:bg-red-50 rounded-lg cursor-pointer"
                          >
                            <TrashIcon className="w-4.5 h-4.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Totals Summary Panel */}
              <div className="flex justify-end pt-2">
                <div className="w-72 bg-slate-50 border border-slate-100 rounded-xl p-4 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-450">Subtotal:</span>
                    <span className="font-semibold text-slate-800">₹{subtotal.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-455">Tax (18% GST):</span>
                    <span className="font-semibold text-slate-800">₹{tax.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-slate-200 font-bold text-slate-900">
                    <span>Total Amount:</span>
                    <span className="text-brand-600">₹{total.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Notes Input */}
          <div>
            <label className="block font-semibold text-slate-655 mb-1">Additional Notes / Special Instructions</label>
            <textarea
              rows={2}
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              placeholder="Provide delivery guidelines..."
              className="w-full px-3 py-2 border border-slate-205 rounded-xl focus:outline-none"
            />
          </div>

          {/* Alert Preview */}
          {items.length > 0 && (
            <div className="p-3.5 bg-green-50 border border-green-100 text-green-800 rounded-xl flex items-start gap-2 leading-relaxed">
              <CalculatorIcon className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
              <div>
                Purchase Order will be created with <strong className="text-slate-900">{items.length}</strong> items totaling <strong className="text-slate-900">₹{total.toLocaleString('en-IN')}</strong>.
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-end gap-3 flex-shrink-0 bg-slate-50/50 font-semibold">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 border border-slate-205 text-slate-705 rounded-lg hover:bg-slate-50 cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || items.length === 0}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg cursor-pointer shadow-brand"
          >
            {loading && <div className="w-3.5 h-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />}
            {loading ? 'Creating Order...' : 'Create Purchase Order'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PurchaseOrderModal;