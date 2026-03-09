import { Check, Upload, AlertCircle, Info } from 'lucide-react';

const DocumentChecklist = ({
  documents,
  uploadedDocs,
  selectedDocId,
  onSelectDocument,
  onUploadDocument,
  completedFields,
  readOnly = false, // When true, hide upload buttons and requirement indicators
}) => {
  const getDocumentStatus = (doc) => {
    const uploaded = uploadedDocs[doc.id];
    const fieldsCompleted = completedFields[doc.id] || {};
    const totalFields = doc.fields?.length || 0;
    const completedCount = Object.keys(fieldsCompleted).filter(k => fieldsCompleted[k]).length;

    if (!uploaded) return 'pending';
    if (totalFields === 0) return 'complete';
    if (completedCount === totalFields) return 'complete';
    if (completedCount > 0) return 'partial';
    return 'uploaded';
  };

  const getStatusIndicator = (status) => {
    switch (status) {
      case 'complete':
        return <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />;
      case 'partial':
        return <div className="w-1.5 h-1.5 rounded-full bg-yellow-500" />;
      case 'uploaded':
        return <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />;
      default:
        return <div className="w-1.5 h-1.5 rounded-full bg-gray-300 dark:bg-gray-600" />;
    }
  };

  const getRequirementIndicator = (doc) => {
    if (doc.required) {
      return <span className="inline-flex w-1.5 h-1.5 rounded-full bg-amber-500" title="Requerido" />;
    }
    if (doc.conditionalRequired || doc.conditionalText) {
      return <span className="inline-flex w-1.5 h-1.5 rounded-full bg-amber-400/60" title="Condicional" />;
    }
    return null;
  };

  return (
    <div className="space-y-1">
      {documents.map((doc) => {
        const status = getDocumentStatus(doc);
        const isSelected = selectedDocId === doc.id;
        const hasFile = !!uploadedDocs[doc.id];
        const isImportant = doc.important;
        const hasConditionalText = doc.conditionalText;

        return (
          <div key={doc.id} className="space-y-0.5">
            <div
              className={`rounded-lg p-2 cursor-pointer transition-all flex items-center gap-2 ${
                isSelected
                  ? 'bg-primary/15 ring-2 ring-primary shadow-sm scale-[1.02]'
                  : hasFile
                    ? 'hover:bg-muted/80 hover:shadow-sm'
                    : 'hover:bg-muted/50 opacity-60'
              } ${isImportant && !hasFile ? 'border-l-2 border-amber-500' : ''}`}
              onClick={() => hasFile && onSelectDocument(doc.id)}
            >
              {/* Status indicator */}
              <div className="flex-shrink-0 flex items-center gap-1">
                {getStatusIndicator(status)}
                {!readOnly && getRequirementIndicator(doc)}
              </div>

              {/* Document name */}
              <div className="flex-1 min-w-0">
                <span className={`text-xs block leading-snug font-medium ${
                  isSelected ? 'text-primary' : hasFile ? 'text-foreground' : 'text-muted-foreground'
                }`}>
                  {doc.name}
                </span>
              </div>

              {/* Upload button - hidden in readOnly mode */}
              {!readOnly && (
                <label className="cursor-pointer flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                  <input
                    type="file"
                    className="hidden"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        onUploadDocument(doc.id, file);
                      }
                    }}
                  />
                  <div className={`p-1.5 rounded-md transition-all ${
                    hasFile
                      ? 'bg-emerald-100 text-emerald-600 hover:bg-emerald-200 dark:bg-emerald-900/30 dark:hover:bg-emerald-900/50'
                      : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                  }`}>
                    {hasFile ? <Check size={14} /> : <Upload size={14} />}
                  </div>
                </label>
              )}
              {/* Show checkmark in readOnly mode if file exists */}
              {readOnly && hasFile && (
                <div className="p-1.5 rounded-md bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30">
                  <Check size={14} />
                </div>
              )}
            </div>

            {/* Conditional text tooltip */}
            {hasConditionalText && !hasFile && (
              <div className="ml-3 flex items-start gap-1 text-[10px] text-amber-600 dark:text-amber-500 bg-amber-50 dark:bg-amber-900/20 rounded px-1.5 py-0.5">
                <Info size={10} className="flex-shrink-0 mt-0.5" />
                <span className="leading-tight">{doc.conditionalText}</span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default DocumentChecklist;
