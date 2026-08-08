import React, { useEffect, useRef } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { X, Camera } from 'lucide-react';

const QRScanner = ({ onScan, onClose, title = "Scan QR Code" }) => {
    const scannerRef = useRef(null);

    useEffect(() => {
        const scanner = new Html5QrcodeScanner("reader", {
            fps: 10,
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1.0
        });

        scanner.render((decodedText) => {
            onScan(decodedText);
            scanner.clear();
        }, (error) => {
            // console.warn(error);
        });

        return () => {
            scanner.clear().catch(err => console.error("Failed to clear scanner", err));
        };
    }, [onScan]);

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md">
            <div className="bg-white dark:bg-slate-900 rounded-[40px] shadow-2xl w-full max-w-md overflow-hidden border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 duration-300">
                <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-brand-500/10 rounded-xl flex items-center justify-center text-brand-500">
                            <Camera size={20} />
                        </div>
                        <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">{title}</h2>
                    </div>
                    <button 
                        onClick={onClose} 
                        className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-500"
                    >
                        <X size={24} />
                    </button>
                </div>

                <div className="p-8">
                    <div id="reader" className="overflow-hidden rounded-3xl border-4 border-slate-100 dark:border-slate-800 shadow-inner"></div>
                    
                    <div className="mt-8 text-center">
                        <p className="text-sm text-slate-500 font-medium leading-relaxed">
                            Position the QR code within the frame to scan. Ensure good lighting for faster detection.
                        </p>
                    </div>
                </div>

                <div className="p-6 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800">
                    <button 
                        onClick={onClose}
                        className="w-full py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest text-slate-500 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-sm hover:bg-slate-100 transition-all"
                    >
                        Close Camera
                    </button>
                </div>
            </div>
        </div>
    );
};

export default QRScanner;
