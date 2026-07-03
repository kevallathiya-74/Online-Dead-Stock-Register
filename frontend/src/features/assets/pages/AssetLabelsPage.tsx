import {
    ArrowDownTrayIcon,
    ArrowPathIcon,
    InformationCircleIcon,
    PrinterIcon,
    QrCodeIcon,
} from '@heroicons/react/24/outline';
import { QRCodeCanvas } from 'qrcode.react';
import React, { useEffect, useRef, useState } from 'react';
import { toast } from 'react-toastify';
import DashboardLayout from '../../../components/layout/DashboardLayout';
import api from '../../../services/api';

const AssetLabelsPage: React.FC = () => {
  const [assets, setAssets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAsset, setSelectedAsset] = useState('');
  const [selectedAssetData, setSelectedAssetData] = useState<any>(null);
  const [labelType, setLabelType] = useState('qr');
  const [labelSize, setLabelSize] = useState('medium');
  const [generating, setGenerating] = useState(false);
  const qrCodeRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    loadAssets();
  }, []);

  useEffect(() => {
    if (selectedAsset) {
      const asset = assets.find(a => a._id === selectedAsset || a.id === selectedAsset);
      setSelectedAssetData(asset || null);
    } else {
      setSelectedAssetData(null);
    }
  }, [selectedAsset, assets]);

  const loadAssets = async () => {
    try {
      setLoading(true);
      const response = await api.get('/assets', {
        params: { limit: 100 }
      });
      const assetsData = response.data.data || response.data;
      const assetsList = Array.isArray(assetsData) ? assetsData : [];
      setAssets(assetsList);
      if (assetsList.length === 0) {
        toast.info('No assets found. Add assets first to generate labels.');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to load assets');
      setAssets([]);
    } finally {
      setLoading(false);
    }
  };

  const getQRData = (asset: any) => {
    return JSON.stringify({
      type: 'asset',
      id: asset._id || asset.id,
      asset_id: asset.unique_asset_id,
      name: asset.name || `${asset.manufacturer} ${asset.model}`,
      manufacturer: asset.manufacturer,
      model: asset.model,
      serial: asset.serial_number,
      category: asset.asset_type,
      location: asset.location,
      status: asset.status,
      condition: asset.condition,
      scan_url: `${window.location.origin}/assets/${asset._id || asset.id}`
    });
  };

  const handleGenerateLabel = async () => {
    if (!selectedAsset) {
      toast.error('Please select an asset');
      return;
    }
    if (!selectedAssetData) {
      toast.error('Asset data not found');
      return;
    }

    try {
      setGenerating(true);
      await new Promise(resolve => setTimeout(resolve, 100));

      if (!qrCodeRef.current) {
        toast.error('QR code not ready. Please try again.');
        return;
      }

      const canvas = qrCodeRef.current;
      canvas.toBlob((blob) => {
        if (!blob) {
          toast.error('Failed to generate QR code image');
          return;
        }
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${selectedAssetData.unique_asset_id}_${labelType}_label.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        toast.success(`${labelType.toUpperCase()} label generated and downloaded for: ${selectedAssetData.name || selectedAssetData.unique_asset_id}`);
      });
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error: any) { /* Error handled by API interceptor */ } finally {
      setGenerating(false);
    }
  };

  const handlePrintLabel = () => {
    if (!selectedAsset) {
      toast.error('Please select an asset');
      return;
    }
    if (!selectedAssetData) {
      toast.error('Asset data not found');
      return;
    }

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error('Please allow popups to print labels');
      return;
    }

    const qrData = getQRData(selectedAssetData);
    const assetName = selectedAssetData.name || `${selectedAssetData.manufacturer} ${selectedAssetData.model}`;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Print Label - ${selectedAssetData.unique_asset_id}</title>
          <style>
            @media print {
              body { margin: 0; }
              @page { margin: 0.5cm; }
            }
            body {
              font-family: Arial, sans-serif;
              display: flex;
              justify-content: center;
              align-items: center;
              min-height: 100vh;
              margin: 0;
            }
            .label {
              text-align: center;
              padding: 20px;
              border: 2px solid #000;
              max-width: ${labelSize === 'small' ? '2in' : labelSize === 'medium' ? '3in' : '4in'};
            }
            .label h2 { margin: 10px 0; font-size: 14px; }
            .label p { margin: 5px 0; font-size: 12px; }
            .qr-container { margin: 10px 0; }
          </style>
        </head>
        <body>
          <div class="label">
            <div class="qr-container" id="qr-container"></div>
            <h2>${assetName}</h2>
            <p><strong>${selectedAssetData.unique_asset_id}</strong></p>
            <p>${selectedAssetData.location || 'N/A'}</p>
            <p>Status: ${selectedAssetData.status || 'N/A'}</p>
          </div>
          <script src="https://cdn.jsdelivr.net/npm/qrcode@1.5.3/build/qrcode.min.js"></script>
          <script>
            const qrData = ${JSON.stringify(qrData)};
            const qrSize = ${labelSize === 'small' ? '150' : labelSize === 'medium' ? '200' : '250'};
            
            QRCode.toCanvas(qrData, { width: qrSize, margin: 1 }, function (error, canvas) {
              if (error) {
                document.getElementById('qr-container').innerHTML = '<p>Failed to generate QR code</p>';
              } else {
                document.getElementById('qr-container').appendChild(canvas);
                setTimeout(() => window.print(), 500);
              }
            });
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
    toast.success('Opening print dialog...');
  };

  const handleBulkGenerate = async () => {
    const activeAssets = assets.filter(a => 
      a.status === 'Active' || 
      a.status === 'Available' || 
      a.status === 'Under Maintenance'
    );
    
    if (activeAssets.length === 0) {
      toast.error('No active assets found for label generation');
      return;
    }

    try {
      setGenerating(true);
      toast.info(`Generating labels for ${activeAssets.length} assets. This may take a moment...`, {
        autoClose: 5000
      });

      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        toast.error('Please allow popups to generate bulk labels');
        setGenerating(false);
        return;
      }

      let htmlContent = `
        <!DOCTYPE html>
        <html>
          <head>
            <title>Bulk Asset Labels</title>
            <style>
              @media print {
                body { margin: 0; }
                @page { margin: 0.5cm; }
                .label { page-break-inside: avoid; }
              }
              body { font-family: Arial, sans-serif; padding: 20px; }
              .label-grid {
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
                gap: 20px;
                margin: 20px 0;
              }
              .label {
                text-align: center;
                padding: 15px;
                border: 2px solid #000;
              }
              .label h3 { margin: 10px 0; font-size: 14px; }
              .label p { margin: 5px 0; font-size: 12px; }
              .qr-container { margin: 10px 0; }
            </style>
          </head>
          <body>
            <h1>Asset Labels (${activeAssets.length} items)</h1>
            <div class="label-grid">
      `;

      activeAssets.forEach((asset, index) => {
        const assetName = asset.name || `${asset.manufacturer} ${asset.model}`;
        htmlContent += `
          <div class="label">
            <div class="qr-container" id="qr-${index}"></div>
            <h3>${assetName}</h3>
            <p><strong>${asset.unique_asset_id}</strong></p>
            <p>${asset.location || 'N/A'}</p>
          </div>
        `;
      });

      htmlContent += `
            </div>
            <script src="https://cdn.jsdelivr.net/npm/qrcode@1.5.3/build/qrcode.min.js"></script>
            <script>
              const assets = ${JSON.stringify(activeAssets.map(a => getQRData(a)))};
              let generated = 0;
              
              assets.forEach((qrData, index) => {
                QRCode.toCanvas(qrData, { width: 150, margin: 1 }, function (error, canvas) {
                  if (!error) {
                    document.getElementById('qr-' + index).appendChild(canvas);
                  }
                  generated++;
                  if (generated === assets.length) {
                    setTimeout(() => window.print(), 500);
                  }
                });
              });
            </script>
          </body>
        </html>
      `;

      printWindow.document.write(htmlContent);
      printWindow.document.close();
      toast.success(`Successfully generated labels for ${activeAssets.length} assets. Print dialog will open automatically.`, {
        autoClose: 4000
      });
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error: any) { /* Error handled by API interceptor */ } finally {
      setGenerating(false);
    }
  };

  const handleDownloadTemplate = () => {
    const csvContent = [
      ['Asset ID', 'Name', 'Manufacturer', 'Model', 'Serial Number', 'Location', 'Status'].join(','),
      ['AST-001', 'Sample Asset', 'Dell', 'Latitude 5520', 'SN123456', 'Office 101', 'Active'].join(',')
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'bulk_label_template.csv');
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
    toast.success('Template downloaded successfully');
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="w-10 h-10 rounded-full border-4 border-slate-200 border-t-brand-600 animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold font-display text-slate-900">
            Asset Labels & QR Codes
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Generate and print labels and QR codes for assets
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Configuration Card */}
          <div className="bg-white rounded-xl border border-slate-100 shadow-card p-6 space-y-6">
            <div>
              <h3 className="text-base font-semibold font-display text-slate-900">Label Configuration</h3>
              <hr className="border-slate-100 mt-2" />
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-655 mb-1.5">Select Asset</label>
                <select
                  value={selectedAsset}
                  onChange={(e) => setSelectedAsset(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm border border-slate-205 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
                >
                  <option value="">Select an asset</option>
                  {assets.map((asset) => {
                    const assetName = asset.name || `${asset.manufacturer} ${asset.model}` || 'Unknown Asset';
                    return (
                      <option key={asset._id || asset.id} value={asset._id || asset.id}>
                        {assetName} ({asset.unique_asset_id})
                      </option>
                    );
                  })}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-655 mb-1.5">Label Type</label>
                  <select
                    value={labelType}
                    onChange={(e) => setLabelType(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm border border-slate-205 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
                  >
                    <option value="qr">QR Code</option>
                    <option value="barcode">Barcode</option>
                    <option value="text">Text Label</option>
                    <option value="combined">Combined (QR + Text)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-655 mb-1.5">Label Size</label>
                  <select
                    value={labelSize}
                    onChange={(e) => setLabelSize(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm border border-slate-205 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
                  >
                    <option value="small">Small (2x1 inch)</option>
                    <option value="medium">Medium (3x2 inch)</option>
                    <option value="large">Large (4x3 inch)</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleGenerateLabel}
                  disabled={!selectedAsset || generating}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-all shadow-brand cursor-pointer"
                >
                  <ArrowDownTrayIcon className="w-4.5 h-4.5" />
                  {generating ? 'Generating...' : 'Download Label'}
                </button>
                <button
                  onClick={handlePrintLabel}
                  disabled={!selectedAsset}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 text-sm font-semibold rounded-xl hover:bg-slate-50 transition-colors disabled:opacity-55 cursor-pointer"
                >
                  <PrinterIcon className="w-4.5 h-4.5 text-slate-500" />
                  Print
                </button>
              </div>
            </div>
          </div>

          {/* Preview Card */}
          <div className="bg-white rounded-xl border border-slate-100 shadow-card p-6 space-y-6">
            <div>
              <h3 className="text-base font-semibold font-display text-slate-900">Label Preview</h3>
              <hr className="border-slate-100 mt-2" />
            </div>

            <div className="flex items-center justify-center min-h-[300px] bg-slate-50 border border-dashed border-slate-200 rounded-xl p-6">
              {selectedAssetData ? (
                <div className="text-center space-y-3">
                  <div className="hidden">
                    <QRCodeCanvas
                      ref={qrCodeRef}
                      value={getQRData(selectedAssetData)}
                      size={labelSize === 'small' ? 200 : labelSize === 'medium' ? 300 : 400}
                      level="H"
                      includeMargin
                    />
                  </div>
                  
                  <div className="inline-block bg-white p-4 rounded-2xl shadow-card border border-slate-150">
                    <QRCodeCanvas
                      value={getQRData(selectedAssetData)}
                      size={labelSize === 'small' ? 140 : labelSize === 'medium' ? 180 : 220}
                      level="H"
                      includeMargin
                    />
                  </div>
                  
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">
                      {selectedAssetData.name || `${selectedAssetData.manufacturer} ${selectedAssetData.model}`}
                    </h4>
                    <p className="text-xs text-slate-505 font-mono mt-0.5">{selectedAssetData.unique_asset_id}</p>
                    <p className="text-[10px] text-slate-400 mt-1">
                      {selectedAssetData.location || 'No location'} &bull; {selectedAssetData.status || 'Unknown status'}
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-slate-400">Select an asset to see preview</p>
              )}
            </div>
          </div>

          {/* Bulk Operations */}
          <div className="bg-white rounded-xl border border-slate-100 shadow-card p-6 md:col-span-2 space-y-6">
            <div>
              <h3 className="text-base font-semibold font-display text-slate-900">Bulk Label Generation</h3>
              <hr className="border-slate-100 mt-2" />
            </div>

            <div className="p-4 bg-sky-50 border border-sky-100 text-sky-850 rounded-xl flex items-start gap-3">
              <InformationCircleIcon className="w-5 h-5 text-sky-600 mt-0.5 flex-shrink-0" />
              <p className="text-xs leading-relaxed">
                Generate and print scannable labels for multiple assets simultaneously. Perfect for processing newly onboarded batches.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-2 text-xs">
              <span className="text-slate-500 font-semibold mr-2">
                {assets.length} total assets &bull; {assets.filter(a => a.status === 'Active' || a.status === 'Available').length} eligible for labels
              </span>

              <button
                onClick={handleBulkGenerate}
                disabled={generating || assets.length === 0}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold rounded-xl disabled:opacity-50 transition-colors cursor-pointer"
              >
                <QrCodeIcon className="w-4 h-4 text-slate-500" />
                {generating ? 'Generating...' : 'Generate All Active Assets'}
              </button>

              <button
                onClick={handleDownloadTemplate}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold rounded-xl transition-colors cursor-pointer"
              >
                <ArrowDownTrayIcon className="w-4 h-4 text-slate-500" />
                Download Batch Template
              </button>

              <button
                onClick={loadAssets}
                disabled={loading}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold rounded-xl disabled:opacity-50 transition-colors cursor-pointer"
              >
                <ArrowPathIcon className="w-4 h-4 text-slate-505" />
                {loading ? 'Loading...' : 'Refresh Assets'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AssetLabelsPage;
