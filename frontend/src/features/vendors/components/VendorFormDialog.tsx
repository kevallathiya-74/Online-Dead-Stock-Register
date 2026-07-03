import { XMarkIcon } from '@heroicons/react/24/outline';
import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';

interface VendorFormData {
  vendor_name: string;
  contact_person: string;
  email: string;
  phone: string;
  address: {
    street: string;
    city: string;
    state: string;
    zip_code: string;
    country: string;
  };
  payment_terms: string;
  is_active: boolean;
}

interface VendorFormDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: VendorFormData) => Promise<void>;
  initialData?: Partial<VendorFormData>;
  isEdit?: boolean;
}

const VendorFormDialog: React.FC<VendorFormDialogProps> = ({
  open,
  onClose,
  onSubmit,
  initialData,
  isEdit = false,
}) => {
  const [formData, setFormData] = useState<VendorFormData>({
    vendor_name: '',
    contact_person: '',
    email: '',
    phone: '',
    address: {
      street: '',
      city: '',
      state: '',
      zip_code: '',
      country: '',
    },
    payment_terms: '',
    is_active: true,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      if (initialData) {
        setFormData({
          vendor_name: initialData.vendor_name || '',
          contact_person: initialData.contact_person || '',
          email: initialData.email || '',
          phone: initialData.phone || '',
          address: {
            street: initialData.address?.street || '',
            city: initialData.address?.city || '',
            state: initialData.address?.state || '',
            zip_code: initialData.address?.zip_code || '',
            country: initialData.address?.country || '',
          },
          payment_terms: initialData.payment_terms || '',
          is_active: initialData.is_active ?? true,
        });
      } else {
        setFormData({
          vendor_name: '',
          contact_person: '',
          email: '',
          phone: '',
          address: {
            street: '',
            city: '',
            state: '',
            zip_code: '',
            country: '',
          },
          payment_terms: '',
          is_active: true,
        });
      }
      setErrors({});
    }
  }, [open, initialData]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!formData.vendor_name.trim()) {
      newErrors.vendor_name = 'Vendor name is required';
    }
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }
    if (formData.phone && !/^\+?[\d\s\-()]+$/.test(formData.phone)) {
      newErrors.phone = 'Invalid phone format';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleAddressChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      address: {
        ...prev.address,
        [field]: value,
      },
    }));
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      toast.error('Please fix the form errors');
      return;
    }
    setSubmitting(true);
    try {
      await onSubmit(formData);
      handleClose();
    } catch { /* ignore */ } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setFormData({
      vendor_name: '',
      contact_person: '',
      email: '',
      phone: '',
      address: {
        street: '',
        city: '',
        state: '',
        zip_code: '',
        country: '',
      },
      payment_terms: '',
      is_active: true,
    });
    setErrors({});
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in text-xs text-slate-655">
      <div className="bg-white rounded-2xl border border-slate-100 max-w-2xl w-full flex flex-col shadow-card-xl animate-fade-in-up">
        
        {/* Title */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between flex-shrink-0">
          <h3 className="text-base font-bold font-display text-slate-900">
            {isEdit ? 'Edit Vendor' : 'Add New Vendor'}
          </h3>
          <button onClick={handleClose} className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg cursor-pointer">
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable form content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          
          {/* Basic Info */}
          <div className="space-y-3">
            <h4 className="font-bold text-slate-900 text-[10px] uppercase tracking-wider">Basic Information</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-655 mb-1">Vendor Name *</label>
                <input
                  type="text"
                  required
                  value={formData.vendor_name}
                  onChange={(e) => handleChange('vendor_name', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 ${errors.vendor_name ? 'border-red-400' : 'border-slate-205'}`}
                  placeholder="e.g. Acme Corporation"
                />
                {errors.vendor_name && <p className="text-red-500 text-[10px] mt-0.5 font-medium">{errors.vendor_name}</p>}
              </div>

              <div>
                <label className="block font-semibold text-slate-655 mb-1">Contact Person</label>
                <input
                  type="text"
                  value={formData.contact_person}
                  onChange={(e) => handleChange('contact_person', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-205 rounded-xl"
                  placeholder="John Doe"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-655 mb-1">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 ${errors.email ? 'border-red-400' : 'border-slate-205'}`}
                  placeholder="contact@vendor.com"
                />
                {errors.email && <p className="text-red-500 text-[10px] mt-0.5 font-medium">{errors.email}</p>}
              </div>

              <div>
                <label className="block font-semibold text-slate-655 mb-1">Phone</label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 ${errors.phone ? 'border-red-400' : 'border-slate-205'}`}
                  placeholder="1234567890"
                />
                {errors.phone && <p className="text-red-500 text-[10px] mt-0.5 font-medium">{errors.phone}</p>}
              </div>
            </div>
          </div>

          {/* Address Info */}
          <div className="space-y-3 pt-2">
            <h4 className="font-bold text-slate-900 text-[10px] uppercase tracking-wider">Address Details</h4>
            
            <div className="space-y-3">
              <div>
                <label className="block font-semibold text-slate-655 mb-1">Street Address</label>
                <input
                  type="text"
                  value={formData.address.street}
                  onChange={(e) => handleAddressChange('street', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-205 rounded-xl"
                  placeholder="123 Main St"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-655 mb-1">City</label>
                  <input
                    type="text"
                    value={formData.address.city}
                    onChange={(e) => handleAddressChange('city', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-205 rounded-xl"
                    placeholder="New York"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-655 mb-1">State</label>
                  <input
                    type="text"
                    value={formData.address.state}
                    onChange={(e) => handleAddressChange('state', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-205 rounded-xl"
                    placeholder="NY"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-655 mb-1">ZIP Code</label>
                  <input
                    type="text"
                    value={formData.address.zip_code}
                    onChange={(e) => handleAddressChange('zip_code', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-205 rounded-xl"
                    placeholder="10001"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-655 mb-1">Country</label>
                  <input
                    type="text"
                    value={formData.address.country}
                    onChange={(e) => handleAddressChange('country', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-205 rounded-xl"
                    placeholder="USA"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Business Info */}
          <div className="space-y-3 pt-2">
            <h4 className="font-bold text-slate-900 text-[10px] uppercase tracking-wider">Business Details</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-655 mb-1">Payment Terms</label>
                <input
                  type="text"
                  placeholder="e.g. Net 30"
                  value={formData.payment_terms}
                  onChange={(e) => handleChange('payment_terms', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-205 rounded-xl"
                />
              </div>

              <div className="flex items-center pt-5">
                <label className="flex items-center gap-2 font-bold text-slate-900 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => handleChange('is_active', e.target.checked)}
                    className="w-4.5 h-4.5 text-brand-600 rounded border-slate-300 focus:ring-brand-500"
                  />
                  Active status (vendor is available for purchases)
                </label>
              </div>
            </div>
          </div>

        </div>

        {/* Action Controls */}
        <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-end gap-3 flex-shrink-0 bg-slate-50/50 font-semibold">
          <button
            onClick={handleClose}
            disabled={submitting}
            className="px-4 py-2 border border-slate-205 text-slate-705 rounded-lg hover:bg-slate-50 cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg cursor-pointer shadow-brand"
          >
            {submitting && <div className="w-3.5 h-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />}
            {submitting ? 'Saving...' : isEdit ? 'Update Vendor' : 'Add Vendor'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default VendorFormDialog;
