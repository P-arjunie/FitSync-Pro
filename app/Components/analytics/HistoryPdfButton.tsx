import React from 'react';

interface HistoryPdfButtonProps {
  type: string;
  startDate?: string;
  endDate?: string;
  status?: string;
}

const HistoryPdfButton: React.FC<HistoryPdfButtonProps> = ({
  type,
  startDate,
  endDate,
  status
}) => {
  const handleDownloadPdf = () => {
    // Build the query parameters
    const params = new URLSearchParams();
    params.append('type', type);
    
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    if (status) params.append('status', status);
    
    // Create the URL for the PDF endpoint
    const pdfUrl = `/api/analytics/history/pdf?${params.toString()}`;
    
    // Open the URL in a new tab/window
    window.open(pdfUrl, '_blank');
  };

  return (
    <button
      onClick={handleDownloadPdf}
      className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
      </svg>
      Export PDF
    </button>
  );
};

export default HistoryPdfButton;