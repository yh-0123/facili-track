import React, { useState, useRef } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import './qrCodeModal.css';

const QRCodeModal = ({ assetUrl, onClose }) => {
  const [showQRCode, setShowQRCode] = useState(false);
  const qrRef = useRef(null);

  // Ensure the asset URL starts with your local dev URL
  const modifiedAssetUrl = assetUrl.startsWith('http://localhost:3000/')
    ? assetUrl
    : `http://localhost:3000${assetUrl}`;

  const handleGenerateClick = () => {
    setShowQRCode(true);
  };

  const handleDownload = () => {
    const canvas = qrRef.current?.querySelector('canvas');
    if (!canvas) return;

    const url = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.href = url;
    link.download = 'qr-code.png';
    link.click();
  };

  const handlePrint = () => {
    const canvas = qrRef.current?.querySelector('canvas');
    if (!canvas) return;

    const dataUrl = canvas.toDataURL('image/png');

    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Print QR Code</title>
          <style>
            body {
              margin: 0;
              display: flex;
              justify-content: center;
              align-items: center;
              height: 100vh;
            }
            img {
              width: 300px;
              height: 300px;
            }
          </style>
        </head>
        <body>
          <img id="qr-img" src="${dataUrl}" />
          <script>
            const img = document.getElementById('qr-img');
            img.onload = function() {
              window.print();
              window.onafterprint = function() {
                window.close();
              };
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="qr-modal-overlay">
      <div className="qr-modal-content">
        {!showQRCode ? (
          <>
            <p className="qr-modal-heading">Do you want to generate a QR code for this asset?</p>
            <div className="qr-modal-buttons">
              <button className="qr-modal-button qr-modal-cancel-btn" onClick={onClose}>
                Cancel
              </button>
              <button className="qr-modal-button qr-modal-generate-btn" onClick={handleGenerateClick}>
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
              <button className="qr-modal-button qr-modal-download-btn" onClick={handleDownload}>
                Download
              </button>
              <button className="qr-modal-button qr-modal-print-btn" onClick={handlePrint}>
                Print
              </button>
              <button className="qr-modal-button qr-modal-close-btn" onClick={onClose}>
                Close
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default QRCodeModal;
