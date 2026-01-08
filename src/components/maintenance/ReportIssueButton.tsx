import { useState } from 'react';
import { Bug } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { maintenanceAgent, type Priority } from '@/lib/maintenance-agent';

interface ReportIssueButtonProps {
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
}

export function ReportIssueButton({ position = 'bottom-right' }: ReportIssueButtonProps) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<Priority>('medium');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const positionClasses = {
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      toast({
        title: 'Title Required',
        description: 'Please enter a title for your issue.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const ticketNumber = maintenanceAgent.reportIssue(
        title.trim(),
        description.trim() || undefined,
        priority,
        { email: user?.email ?? undefined, userId: user?.id }
      );

      toast({
        title: 'Issue Reported',
        description: `Your issue has been logged. Ticket: ${ticketNumber}`,
      });

      setTitle('');
      setDescription('');
      setPriority('medium');
      setOpen(false);
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to submit issue. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className={`fixed ${positionClasses[position]} z-50 h-12 w-12 rounded-full shadow-lg hover:shadow-xl transition-shadow bg-background border-2 border-primary`}
          title="Report an Issue"
        >
          <Bug className="h-5 w-5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Report an Issue</DialogTitle>
          <DialogDescription>
            Describe the problem you're experiencing. We'll look into it.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              placeholder="Brief description of the issue"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="description">Details (optional)</Label>
            <Textarea
              id="description"
              placeholder="Steps to reproduce, expected behavior, etc."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="priority">Priority</Label>
            <Select value={priority} onValueChange={(v) => setPriority(v as Priority)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low - Minor inconvenience</SelectItem>
                <SelectItem value="medium">Medium - Affects my work</SelectItem>
                <SelectItem value="high">High - Blocking my work</SelectItem>
                <SelectItem value="critical">Critical - System down</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <p className="text-xs text-muted-foreground">
            Current page and browser info will be included automatically.
          </p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? 'Submitting...' : 'Submit Issue'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
