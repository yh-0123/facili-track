import React, { useState, useRef } from 'react';
import { QRCodeCanvas } from 'qrcode.react'; // Corrected import
import './qrCodeModal.css'; // Import the CSS

const QRCodeModal = ({ assetUrl, onClose }) => {
  const [showQRCode, setShowQRCode] = useState(false);
  const qrRef = useRef(null);

  // Modify assetUrl to ensure it starts with http://localhost:3000/
  const modifiedAssetUrl = assetUrl.startsWith('http://localhost:3000/')
    ? assetUrl
    : `http://localhost:3000${assetUrl}`;

  const handleGenerateClick = () => {
    setShowQRCode(true);
  };

  const handleDownload = () => {
    const canvas = qrRef.current.querySelector('canvas');
    const url = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.href = url;
    link.download = 'qr-code.png';
    link.click();
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    const canvas = qrRef.current.querySelector('canvas');
    const dataUrl = canvas.toDataURL();

    printWindow.document.write(`
      <html>
        <head><title>Print QR Code</title></head>
        <body style="margin:0;display:flex;justify-content:center;align-items:center;height:100vh;">
          <img src="${dataUrl}" style="width:300px;height:300px;" />
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    printWindow.close();
  };

  return (
    <div className="qr-modal-overlay">
      <div className="qr-modal-content">
        {!showQRCode ? (
          <>
            <p className="qr-modal-heading">Do you want to generate a QR code for this asset?</p>
            <div className="qr-modal-buttons">
              <button
                className="qr-modal-button qr-modal-cancel-btn"
                onClick={onClose}
              >
                Cancel
              </button>
              <button
                className="qr-modal-button qr-modal-generate-btn"
                onClick={handleGenerateClick}
              >
                Generate QR Code
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="qr-modal-code" ref={qrRef}>
              <QRCodeCanvas value={modifiedAssetUrl} size={256} />
              <p className="qr-modal-url">{modifiedAssetUrl}</p>
            </div>
            <div className="qr-modal-buttons">
              <button
                className="qr-modal-button qr-modal-close-btn"
                onClick={onClose}
              >
                Close
              </button>
              <button
                className="qr-modal-button qr-modal-download-btn"
                onClick={handleDownload}
              >
                Download
              </button>
              <button
                className="qr-modal-button qr-modal-print-btn"
                onClick={handlePrint}
              >
                Print
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default QRCodeModal;
