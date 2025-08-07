import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { MessageSquare, Send, Loader2 } from 'lucide-react';

interface FeedbackModalProps {
  trigger?: React.ReactNode;
  currentPage?: string;
}

const PAGE_OPTIONS = [
  'Quick API Testing',
  'Collections',
  'Smart Import',
  'Response Validation',
  'Test Code Generation',
  'BDD Code Generation',
  'Jira Integration',
  'Bitbucket Integration',
  'Other'
];

export const FeedbackModal: React.FC<FeedbackModalProps> = ({ 
  trigger, 
  currentPage = 'Quick API Testing' 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    lanId: '',
    pageLocation: currentPage,
    feedback: ''
  });
  
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.lanId.trim()) {
      toast({
        title: "Missing LAN ID",
        description: "Please enter your LAN ID",
        variant: "destructive",
      });
      return;
    }

    if (!formData.feedback.trim()) {
      toast({
        title: "Missing Feedback",
        description: "Please enter your feedback message",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          lanId: formData.lanId.trim(),
          pageLocation: formData.pageLocation || null,
          feedback: formData.feedback.trim()
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast({
          title: "Feedback Submitted",
          description: "Thank you for your feedback! We'll review it shortly.",
        });
        
        // Reset form and close modal
        setFormData({
          lanId: '',
          pageLocation: currentPage,
          feedback: ''
        });
        setIsOpen(false);
      } else {
        toast({
          title: "Submission Failed",
          description: result.message || "Failed to submit feedback. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Feedback submission error:', error);
      toast({
        title: "Network Error",
        description: "Failed to submit feedback. Please check your connection and try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm" className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4" />
            Feedback
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            Submit Feedback
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="lanId">LAN ID *</Label>
            <Input
              id="lanId"
              placeholder="Enter your LAN ID (e.g., OCBC123)"
              value={formData.lanId}
              onChange={(e) => handleInputChange('lanId', e.target.value)}
              maxLength={50}
              required
            />
            <p className="text-xs text-gray-500">
              Your LAN ID helps us identify and respond to your feedback
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="pageLocation">Page/Module (Optional)</Label>
            <Select 
              value={formData.pageLocation} 
              onValueChange={(value) => handleInputChange('pageLocation', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select page or module" />
              </SelectTrigger>
              <SelectContent>
                {PAGE_OPTIONS.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-gray-500">
              Which part of the application are you providing feedback about?
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="feedback">Feedback Message *</Label>
            <Textarea
              id="feedback"
              placeholder="Describe your feedback, suggestions, or report issues..."
              value={formData.feedback}
              onChange={(e) => handleInputChange('feedback', e.target.value)}
              rows={4}
              maxLength={5000}
              required
            />
            <p className="text-xs text-gray-500">
              {formData.feedback.length}/5000 characters
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !formData.lanId.trim() || !formData.feedback.trim()}
              className="flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Submit Feedback
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}; 