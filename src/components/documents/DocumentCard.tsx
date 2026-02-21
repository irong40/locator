import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Download, Pencil, Trash2, FileText, FileSpreadsheet, FileImage, File } from 'lucide-react';
import { useUserRole } from '@/hooks/useUserRole';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface DocumentCardProps {
  document: {
    id: string;
    title: string;
    description: string | null;
    file_path: string;
    file_name: string;
    file_size: number;
    file_type: string;
    created_at: string | null;
    document_categories: {
      name: string;
    } | null;
  };
  onDownload: (filePath: string) => void | Promise<void>;
  onEdit: () => void;
  onDelete: () => void;
  isDeleting?: boolean;
}

function getFileIcon(fileType: string) {
  if (fileType.includes('pdf')) return FileText;
  if (fileType.includes('sheet') || fileType.includes('excel') || fileType.includes('csv'))
    return FileSpreadsheet;
  if (fileType.includes('image')) return FileImage;
  return File;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function DocumentCard({
  document,
  onDownload,
  onEdit,
  onDelete,
  isDeleting,
}: DocumentCardProps) {
  const { isAdmin } = useUserRole();
  const [downloading, setDownloading] = useState(false);
  const Icon = getFileIcon(document.file_type);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      await onDownload(document.file_path);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <Card className="group hover:shadow-md transition-shadow">
      <CardContent className="p-5">
        <div className="flex items-start gap-3">
          <div className="rounded-lg bg-muted p-2.5 flex-shrink-0">
            <Icon className="h-5 w-5 text-muted-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm leading-tight truncate">{document.title}</h3>
            {document.document_categories && (
              <Badge variant="secondary" className="mt-1.5 text-xs">
                {document.document_categories.name}
              </Badge>
            )}
            {document.description && (
              <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                {document.description}
              </p>
            )}
            <div className="flex items-center gap-3 mt-3 text-xs text-muted-foreground">
              <span>{formatFileSize(document.file_size)}</span>
              {document.created_at && (
                <span>{new Date(document.created_at).toLocaleDateString()}</span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 mt-4 pt-3 border-t">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={handleDownload}
            disabled={downloading}
          >
            <Download className="h-3.5 w-3.5 mr-1.5" />
            {downloading ? 'Preparing...' : 'Download'}
          </Button>
          {isAdmin && (
            <>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onEdit}>
                <Pencil className="h-3.5 w-3.5" />
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Trash2 className="h-3.5 w-3.5 text-destructive" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Document</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete "{document.title}"? This will permanently
                      remove the file.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={onDelete}
                      disabled={isDeleting}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      {isDeleting ? 'Deleting...' : 'Delete'}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
