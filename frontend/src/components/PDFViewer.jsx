import { useState } from 'react';
import { ZoomIn, ZoomOut, RotateCw, Download, ChevronLeft, ChevronRight, Maximize2, Minimize2 } from 'lucide-react';

const PDFViewer = ({ file, fileName, onClose }) => {
  const [zoom, setZoom] = useState(100);
  const [rotation, setRotation] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 25, 200));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 25, 50));
  const handleRotate = () => setRotation(prev => (prev + 90) % 360);

  const handleDownload = () => {
    if (file) {
      const link = document.createElement('a');
      link.href = file;
      link.download = fileName || 'documento.pdf';
      link.click();
    }
  };

  // Si no hay archivo, mostrar placeholder
  if (!file) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-100 rounded-lg border-2 border-dashed border-gray-300">
        <div className="text-center p-8">
          <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <p className="text-gray-500 font-medium">Seleccione un documento</p>
          <p className="text-gray-400 text-sm mt-1">El documento se mostrará aquí</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col h-full bg-gray-800 rounded-lg overflow-hidden ${isFullscreen ? 'fixed inset-0 z-50' : ''}`}>
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 bg-gray-900 border-b border-gray-700">
        <div className="flex items-center gap-2">
          <span className="text-white text-sm font-medium truncate max-w-[200px]">
            {fileName || 'Documento'}
          </span>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={handleZoomOut}
            className="p-2 text-gray-300 hover:text-white hover:bg-gray-700 rounded transition-colors"
            title="Reducir"
          >
            <ZoomOut size={18} />
          </button>
          <span className="text-gray-300 text-sm min-w-[50px] text-center">{zoom}%</span>
          <button
            onClick={handleZoomIn}
            className="p-2 text-gray-300 hover:text-white hover:bg-gray-700 rounded transition-colors"
            title="Ampliar"
          >
            <ZoomIn size={18} />
          </button>
          <div className="w-px h-6 bg-gray-700 mx-2" />
          <button
            onClick={handleRotate}
            className="p-2 text-gray-300 hover:text-white hover:bg-gray-700 rounded transition-colors"
            title="Rotar"
          >
            <RotateCw size={18} />
          </button>
          <button
            onClick={handleDownload}
            className="p-2 text-gray-300 hover:text-white hover:bg-gray-700 rounded transition-colors"
            title="Descargar"
          >
            <Download size={18} />
          </button>
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-2 text-gray-300 hover:text-white hover:bg-gray-700 rounded transition-colors"
            title={isFullscreen ? 'Salir de pantalla completa' : 'Pantalla completa'}
          >
            {isFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
          </button>
        </div>
      </div>

      {/* PDF Content */}
      <div className="flex-1 overflow-auto bg-gray-700" style={{ padding: 0 }}>
        {file.startsWith('data:application/pdf') || file.endsWith('.pdf') ? (
          <iframe
            src={`${file}#navpanes=0&scrollbar=1&toolbar=1&view=FitH`}
            className="w-full h-full bg-white"
            style={{ border: 'none', minHeight: 'calc(100vh - 280px)', display: 'block' }}
            title="PDF Viewer"
          />
        ) : file.startsWith('data:image') || /\.(jpg|jpeg|png|gif|webp)$/i.test(file) ? (
          <div
            className="flex justify-center items-start min-h-full"
            style={{
              transform: `scale(${zoom / 100}) rotate(${rotation}deg)`,
              transformOrigin: 'top center',
              transition: 'transform 0.2s ease',
            }}
          >
            <img
              src={file}
              alt={fileName}
              className="w-full object-contain"
              style={{ maxHeight: 'calc(100vh - 280px)' }}
            />
          </div>
        ) : (
          <div className="flex items-center justify-center h-full bg-white">
            <div className="text-center p-8">
              <p className="text-gray-500">Vista previa no disponible para este tipo de archivo</p>
              <button onClick={handleDownload} className="btn btn-primary mt-4">
                Descargar archivo
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Footer con botón cerrar en fullscreen */}
      {isFullscreen && (
        <div className="px-4 py-2 bg-gray-900 border-t border-gray-700">
          <button
            onClick={() => setIsFullscreen(false)}
            className="btn btn-secondary"
          >
            Cerrar pantalla completa
          </button>
        </div>
      )}
    </div>
  );
};

export default PDFViewer;
