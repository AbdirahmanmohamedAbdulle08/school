import React, { useState, useEffect } from 'react';
import { Html5QrcodeScanner, Html5QrcodeScanType } from 'html5-qrcode';
import { QrCode, Search, Package, AlertCircle, RefreshCw, X } from 'lucide-react';
import api from '../../services/api';

const QRScanner = () => {
  const [scanResult, setScanResult] = useState(null);
  const [scannedProduct, setScannedProduct] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [scannerStarted, setScannerStarted] = useState(false);

  useEffect(() => {
    // Only initialize scanner if not already started and component mounted
    if (!scannerStarted) {
      startScanner();
    }
    
    return () => {
      // Cleanup happens via the clear() method manually
    };
  }, []);

  const startScanner = () => {
    const html5QrcodeScanner = new Html5QrcodeScanner(
      "reader",
      { 
        fps: 10, 
        qrbox: { width: 250, height: 250 },
        supportedScanTypes: [Html5QrcodeScanType.SCAN_TYPE_CAMERA]
      },
      false
    );

    html5QrcodeScanner.render(onScanSuccess, onScanFailure);
    setScannerStarted(true);

    // Save instance to window to clear it later
    window.html5QrcodeScanner = html5QrcodeScanner;
  };

  const stopScanner = () => {
    if (window.html5QrcodeScanner) {
      window.html5QrcodeScanner.clear().catch(error => {
        console.error("Failed to clear html5QrcodeScanner. ", error);
      });
      setScannerStarted(false);
    }
  };

  async function onScanSuccess(decodedText, decodedResult) {
    if (decodedText === scanResult) return; // Prevent duplicate rapid scans
    
    setScanResult(decodedText);
    stopScanner();
    fetchProductDetails(decodedText);
  }

  function onScanFailure(error) {
    // handle scan failure, usually better to ignore and keep scanning
    // console.warn(`Code scan error = ${error}`);
  }

  const fetchProductDetails = async (code) => {
    setIsLoading(true);
    setError('');
    try {
      // Trying to find product by SKU or ID
      const { data } = await api.get(`/products`); // In a real app, use a specific endpoint like /products/scan/:code
      
      const productsList = data.products || data;
      const found = productsList.find(p => p.sku === code || p._id === code);
      if (found) {
        setScannedProduct(found);
      } else {
        setError(`Product with code "${code}" not found in inventory.`);
      }
    } catch (err) {
      setError('Failed to fetch product details.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleManualSearch = async (e) => {
    e.preventDefault();
    const code = e.target.elements.code.value;
    if (!code) return;
    
    if (scannerStarted) stopScanner();
    setScanResult(code);
    fetchProductDetails(code);
  };

  const resetScanner = () => {
    setScanResult(null);
    setScannedProduct(null);
    setError('');
    startScanner();
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <QrCode className="w-8 h-8 text-brand-600 dark:text-brand-400" />
          QR & Barcode Scanner
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">Scan products to instantly view details and inventory levels.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Scanner Panel */}
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 flex flex-col">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2 mb-4">
            <Search className="w-5 h-5 text-slate-400" />
            Scanner Input
          </h2>

          {!scanResult ? (
            <div className="flex-1 flex flex-col">
              <div id="reader" className="w-full bg-slate-100 dark:bg-slate-800 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 min-h-[300px]">
                {/* Scanner mounts here */}
              </div>
              
              <div className="mt-6 flex items-center">
                <div className="h-px bg-slate-200 dark:bg-slate-700 flex-1"></div>
                <span className="px-4 text-sm text-slate-400">OR</span>
                <div className="h-px bg-slate-200 dark:bg-slate-700 flex-1"></div>
              </div>

              <form onSubmit={handleManualSearch} className="mt-6 flex gap-3">
                <input 
                  name="code"
                  type="text" 
                  placeholder="Enter barcode / SKU manually" 
                  className="flex-1 px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-brand-500 dark:text-white"
                />
                <button type="submit" className="px-6 py-2 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-medium rounded-lg hover:bg-slate-800 dark:hover:bg-white transition-colors">
                  Search
                </button>
              </form>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
              <div className="w-16 h-16 bg-brand-100 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400 rounded-full flex items-center justify-center mb-4">
                <QrCode className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-1">Code Scanned</h3>
              <p className="text-slate-500 dark:text-slate-400 mb-6 font-mono bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded">{scanResult}</p>
              
              <button onClick={resetScanner} className="px-6 py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-medium rounded-lg transition-colors flex items-center gap-2">
                <RefreshCw className="w-4 h-4" /> Scan Another Item
              </button>
            </div>
          )}
        </div>

        {/* Results Panel */}
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2 mb-6">
            <Package className="w-5 h-5 text-slate-400" />
            Product Details
          </h2>

          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-64 text-slate-400">
              <RefreshCw className="w-8 h-8 animate-spin mb-4 text-brand-600" />
              <p>Looking up product details...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
              <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-1">Not Found</h3>
              <p className="text-red-500 dark:text-red-400 max-w-sm">{error}</p>
            </div>
          ) : scannedProduct ? (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{scannedProduct.name}</h3>
                  <p className="text-slate-500 dark:text-slate-400 mt-1">SKU: {scannedProduct.sku}</p>
                </div>
                <span className={`px-3 py-1 text-sm font-medium rounded-full ${
                  scannedProduct.status === 'Active' 
                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400'
                  : 'bg-slate-100 text-slate-700 dark:bg-slate-500/10 dark:text-slate-400'
                }`}>
                  {scannedProduct.status || 'Active'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-100 dark:border-slate-700/50">
                  <div className="text-sm text-slate-500 dark:text-slate-400 mb-1">In Stock</div>
                  <div className="text-2xl font-bold text-slate-900 dark:text-white">
                    {scannedProduct.quantity} <span className="text-base font-normal text-slate-500">{scannedProduct.unit}</span>
                  </div>
                </div>
                <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-100 dark:border-slate-700/50">
                  <div className="text-sm text-slate-500 dark:text-slate-400 mb-1">Price</div>
                  <div className="text-2xl font-bold text-slate-900 dark:text-white">
                    ${scannedProduct.price?.toFixed(2)}
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-medium text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-700 pb-2">Additional Info</h4>
                
                <div className="grid grid-cols-2 gap-y-3 text-sm">
                  <div className="text-slate-500 dark:text-slate-400">Category</div>
                  <div className="text-slate-900 dark:text-white font-medium text-right">{scannedProduct.category || 'N/A'}</div>
                  
                  <div className="text-slate-500 dark:text-slate-400">Reorder Level</div>
                  <div className="text-slate-900 dark:text-white font-medium text-right">{scannedProduct.reorderLevel || 0}</div>
                  
                  <div className="text-slate-500 dark:text-slate-400">Vendor</div>
                  <div className="text-slate-900 dark:text-white font-medium text-right">{scannedProduct.vendor || 'N/A'}</div>
                  
                  <div className="text-slate-500 dark:text-slate-400">Added On</div>
                  <div className="text-slate-900 dark:text-white font-medium text-right">
                    {scannedProduct.createdAt ? new Date(scannedProduct.createdAt).toLocaleDateString() : 'N/A'}
                  </div>
                </div>
              </div>

            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-64 text-center text-slate-400">
              <Search className="w-12 h-12 mb-4 opacity-20" />
              <p>Scan a product barcode or enter SKU<br/>to see details here.</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default QRScanner;
