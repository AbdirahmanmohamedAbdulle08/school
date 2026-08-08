import React, { useState, useEffect, useRef } from 'react';
import { 
  Barcode, QrCode, Printer, Download, Search, 
  Settings, RefreshCw, FileText, Check
} from 'lucide-react';
import api from '../../services/api';
import JsBarcode from 'jsbarcode';
import { QRCodeSVG } from 'qrcode.react';
import { jsPDF } from "jspdf";

const BarcodeGenerator = () => {
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState('');
  const [barcodeType, setBarcodeType] = useState('CODE128');
  const [labelSize, setLabelSize] = useState('standard');
  const [quantity, setQuantity] = useState(1);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generated, setGenerated] = useState(false);
  
  const barcodeRef = useRef(null);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const { data } = await api.get('/products');
      setProducts(data.products || data);
    } catch (error) {
      console.error('Failed to fetch products:', error);
    }
  };

  const handleGenerate = (e) => {
    e.preventDefault();
    if (!selectedProduct) return;
    
    setIsGenerating(true);
    setGenerated(false);
    
    setTimeout(() => {
      if (barcodeType !== 'QR') {
        const product = products.find(p => p._id === selectedProduct);
        if (product && barcodeRef.current) {
          try {
            JsBarcode(barcodeRef.current, product.sku || product._id.toString().substring(0, 10), {
              format: barcodeType,
              lineColor: "#000",
              width: 2,
              height: 40,
              displayValue: true
            });
          } catch(e) {
            console.error("Barcode generation error:", e);
          }
        }
      }
      setIsGenerating(false);
      setGenerated(true);
    }, 500);
  };

  const product = products.find(p => p._id === selectedProduct);
  const barcodeValue = product?.sku || product?._id?.toString().substring(0, 10) || 'SAMPLE123';

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = () => {
    if (!product) return;
    
    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: labelSize === 'standard' ? [50, 25] : labelSize === 'large' ? [100, 50] : [75, 38]
    });

    const svgElement = document.getElementById('barcode-svg');
    
    if (barcodeType === 'QR') {
        // QR rendering to PDF logic
        // For simplicity, we just add text in this mockup, real integration requires canvas translation
        pdf.text(product.name, 5, 10);
        pdf.text(`SKU: ${barcodeValue}`, 5, 15);
    } else {
        if (svgElement) {
           const svgData = new XMLSerializer().serializeToString(svgElement);
           const canvas = document.createElement("canvas");
           const ctx = canvas.getContext("2d");
           const img = new Image();
           img.onload = () => {
              canvas.width = img.width;
              canvas.height = img.height;
              ctx.drawImage(img, 0, 0);
              const imgData = canvas.toDataURL("image/png");
              pdf.addImage(imgData, 'PNG', 5, 5, 40, 15);
              pdf.save(`barcode_${barcodeValue}.pdf`);
           };
           img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));
           return;
        }
    }
    pdf.save(`barcode_${barcodeValue}.pdf`);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Barcode className="w-8 h-8 text-brand-600 dark:text-brand-400" />
            Barcode & Label Generator
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Create, print, and download product barcodes.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Configuration Panel */}
        <div className="lg:col-span-1 bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2 mb-6">
            <Settings className="w-5 h-5 text-slate-400" />
            Configuration
          </h2>

          <form onSubmit={handleGenerate} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Select Product
              </label>
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <select 
                  value={selectedProduct}
                  onChange={(e) => {
                      setSelectedProduct(e.target.value);
                      setGenerated(false);
                  }}
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-brand-500 dark:text-white"
                  required
                >
                  <option value="">Search product...</option>
                  {products.map(p => (
                    <option key={p._id} value={p._id}>{p.name} ({p.sku})</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Barcode Type
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setBarcodeType('CODE128')}
                  className={`flex flex-col items-center justify-center p-3 rounded-lg border-2 transition-colors ${
                    barcodeType === 'CODE128' 
                    ? 'border-brand-600 bg-brand-50 dark:bg-brand-900/20 text-brand-700 dark:text-brand-400' 
                    : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <Barcode className="w-6 h-6 mb-1" />
                  <span className="text-xs font-medium">1D Barcode</span>
                </button>
                <button
                  type="button"
                  onClick={() => setBarcodeType('QR')}
                  className={`flex flex-col items-center justify-center p-3 rounded-lg border-2 transition-colors ${
                    barcodeType === 'QR' 
                    ? 'border-brand-600 bg-brand-50 dark:bg-brand-900/20 text-brand-700 dark:text-brand-400' 
                    : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <QrCode className="w-6 h-6 mb-1" />
                  <span className="text-xs font-medium">2D QR Code</span>
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Label Size
              </label>
              <select 
                value={labelSize}
                onChange={(e) => setLabelSize(e.target.value)}
                className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-brand-500 dark:text-white"
              >
                <option value="standard">Standard (50x25mm)</option>
                <option value="medium">Medium (75x38mm)</option>
                <option value="large">Large (100x50mm)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Quantity
              </label>
              <input 
                type="number" 
                min="1" 
                max="500"
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-brand-500 dark:text-white"
              />
            </div>

            <button
              type="submit"
              disabled={!selectedProduct || isGenerating}
              className="w-full py-2.5 px-4 bg-brand-600 hover:bg-brand-700 disabled:bg-slate-300 dark:disabled:bg-slate-800 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              {isGenerating ? (
                <><RefreshCw className="w-4 h-4 animate-spin" /> Generating...</>
              ) : generated ? (
                <><Check className="w-4 h-4" /> Regenerate</>
              ) : (
                <><FileText className="w-4 h-4" /> Generate Barcode</>
              )}
            </button>
          </form>
        </div>

        {/* Preview Panel */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col print:shadow-none print:border-none">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between print:hidden">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Live Preview</h2>
            {generated && (
              <div className="flex gap-2">
                <button onClick={handlePrint} className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-medium transition-colors flex items-center gap-2">
                  <Printer className="w-4 h-4" /> Print
                </button>
                <button onClick={handleDownloadPDF} className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-medium transition-colors flex items-center gap-2">
                  <Download className="w-4 h-4" /> PDF
                </button>
              </div>
            )}
          </div>
          
          <div className="flex-1 p-8 flex items-center justify-center bg-slate-50 dark:bg-slate-950/50 rounded-b-xl overflow-auto print:p-0 print:bg-white">
            {!generated ? (
              <div className="text-center text-slate-400 dark:text-slate-500">
                <Barcode className="w-16 h-16 mx-auto mb-3 opacity-20" />
                <p>Select a product and configure options to preview</p>
              </div>
            ) : (
              <div className="grid gap-4 place-items-center print:block" style={{
                gridTemplateColumns: `repeat(auto-fill, minmax(200px, 1fr))`
              }}>
                {Array.from({ length: quantity }).map((_, idx) => (
                  <div key={idx} className="bg-white text-black p-4 border border-dashed border-slate-300 rounded print:border-none print:break-inside-avoid print:mb-4 flex flex-col items-center justify-center" style={{
                    width: labelSize === 'standard' ? '200px' : labelSize === 'large' ? '380px' : '280px',
                    height: labelSize === 'standard' ? '100px' : labelSize === 'large' ? '190px' : '140px'
                  }}>
                    <div className="text-xs font-bold mb-1 truncate w-full text-center">{product?.name}</div>
                    {barcodeType === 'QR' ? (
                      <QRCodeSVG value={barcodeValue} size={labelSize === 'standard' ? 50 : 80} />
                    ) : (
                      <svg id="barcode-svg" ref={barcodeRef}></svg>
                    )}
                    <div className="text-[10px] text-slate-500 mt-1">{barcodeValue}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BarcodeGenerator;
