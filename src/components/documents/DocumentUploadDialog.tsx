import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Upload } from 'lucide-react';

const ACCEPTED_FILE_TYPES = '.pdf,.docx,.doc,.xlsx,.xls,.pptx,.ppt,.txt';
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

interface DocumentUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: { id: string; name: string }[];
  onUpload: (data: {
    file: File;
    title: string;
    description?: string;
    categoryId: string;
  }) => void;
  isPending: boolean;
}

export function DocumentUploadDialog({
  open,
  onOpenChange,
  categories,
  onUpload,
  isPending,
}: DocumentUploadDialogProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState('');

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setCategoryId('');
    setFile(null);
    setFileError('');
  };

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) resetForm();
    onOpenChange(isOpen);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    setFileError('');
    if (!selected) {
      setFile(null);
      return;
    }
    if (selected.size > MAX_FILE_SIZE) {
      setFileError('File must be under 10MB.');
      setFile(null);
      return;
    }
    setFile(selected);
    // Auto-fill title from filename if empty
    if (!title) {
      setTitle(selected.name.replace(/\.[^/.]+$/, ''));
    }
  };

  const handleSubmit = () => {
    if (!file || !title.trim() || !categoryId) return;
    onUpload({
      file,
      title: title.trim(),
      description: description.trim() || undefined,
      categoryId,
    });
  };

  const isValid = file && title.trim() && categoryId && title.length <= 200;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Upload Document</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="doc-file">File</Label>
            <Input
              id="doc-file"
              type="file"
              accept={ACCEPTED_FILE_TYPES}
              onChange={handleFileChange}
            />
            {fileError && <p className="text-sm text-destructive">{fileError}</p>}
            <p className="text-xs text-muted-foreground">
              PDF, Word, Excel, PowerPoint, or Text. Max 10MB.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="doc-title">Title</Label>
            <Input
              id="doc-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Document title"
              maxLength={200}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="doc-desc">Description (optional)</Label>
            <Textarea
              id="doc-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description..."
              maxLength={1000}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="doc-category">Category</Label>
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {isPending && <Progress value={undefined} className="h-2" />}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)} disabled={isPending}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!isValid || isPending}>
            <Upload className="h-4 w-4 mr-2" />
            {isPending ? 'Uploading...' : 'Upload'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
