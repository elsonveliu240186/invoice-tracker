import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Upload, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/shared/ui/button';
import { uploadTemplate } from '../api/templateApi';

const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

interface TemplateUploadFormProps {
  onUploadSuccess?: () => void;
}

export function TemplateUploadForm({ onUploadSuccess }: TemplateUploadFormProps) {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    if (!file) {
      setSelectedFile(null);
      return;
    }
    if (!file.name.endsWith('.docx')) {
      toast.error(t('settings.invoiceTemplate.errors.invalidType'));
      setSelectedFile(null);
      if (inputRef.current) inputRef.current.value = '';
      return;
    }
    if (file.size > MAX_SIZE_BYTES) {
      toast.error(t('settings.invoiceTemplate.errors.tooLarge'));
      setSelectedFile(null);
      if (inputRef.current) inputRef.current.value = '';
      return;
    }
    setSelectedFile(file);
  }

  async function handleUpload() {
    if (!selectedFile || pending) return;
    setPending(true);
    try {
      await uploadTemplate(selectedFile);
      toast.success(t('settings.invoiceTemplate.toast.uploadSuccess'));
      setSelectedFile(null);
      if (inputRef.current) inputRef.current.value = '';
      onUploadSuccess?.();
    } catch {
      toast.error(t('settings.invoiceTemplate.toast.uploadFailed'));
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex flex-col gap-3" data-testid="template-upload-form">
      <p className="text-xs text-[var(--color-muted-foreground)]">
        {t('settings.invoiceTemplate.helpDocx')}
      </p>
      <div className="flex items-center gap-3 flex-wrap">
        <input
          ref={inputRef}
          type="file"
          accept=".docx"
          onChange={handleFileChange}
          disabled={pending}
          data-testid="template-file-input"
          className="text-sm file:mr-2 file:rounded file:border-0 file:bg-[var(--color-accent)] file:px-3 file:py-1 file:text-xs file:font-medium"
        />
        <Button
          onClick={() => void handleUpload()}
          disabled={!selectedFile || pending}
          data-testid="btn-upload-template"
        >
          {pending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
          ) : (
            <Upload className="mr-2 h-4 w-4" aria-hidden="true" />
          )}
          {t('settings.invoiceTemplate.uploadButton')}
        </Button>
      </div>
    </div>
  );
}
