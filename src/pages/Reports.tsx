import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Plus, X, Calendar as CalendarIcon, Trash2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface SavedReport {
  id: string;
  title: string;
  content: string;
  created_at: string;
}

const Reports = () => {
  const [reports, setReports] = useState<SavedReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState<SavedReport | null>(null);
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const fetchReports = async () => {
      try {
        const { data, error } = await supabase
          .from('saved_reports')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setReports(data || []);
      } catch (err: any) {
        console.error('Error fetching reports:', err);
        toast({ title: "Error", description: "Failed to load reports.", variant: "destructive" });
      } finally {
        setLoading(false);
      }
    };

    fetchReports();
  }, [user, toast]);

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    try {
      const { error } = await supabase.from('saved_reports').delete().eq('id', id);
      if (error) throw error;
      setReports(prev => prev.filter(r => r.id !== id));
      toast({ title: "Deleted", description: "Report deleted successfully." });
    } catch (err: any) {
      console.error(err);
      toast({ title: "Error", description: "Failed to delete report.", variant: "destructive" });
    }
  };

  const handleNewReport = () => {
    if (!user) {
      toast({
        title: "Please log in",
        description: "You need to be logged in to create reports.",
        variant: "destructive",
      });
      navigate('/auth');
      return;
    }

    // Navigate to chat and start report generation
    navigate('/');
    toast({
      title: "Create a report",
      description: "Ask NextBull AI to generate a financial report for any company.",
    });
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[50vh]">
        <div className="animate-pulse space-y-4 w-full max-w-3xl">
          <div className="h-10 bg-secondary rounded w-1/4"></div>
          <div className="h-64 bg-secondary rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto flex-1 overflow-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-foreground tracking-tight">Financial Reports</h1>
          <p className="text-muted-foreground mt-1">Saved intelligence from NextBull AI</p>
        </div>
        <Button onClick={handleNewReport} className="gap-2 bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-500/20">
          <Plus className="w-4 h-4" />
          New Report
        </Button>
      </div>

      {reports.length === 0 ? (
        <Card className="bg-card/40 border-border/50 shadow-sm">
          <CardContent className="flex flex-col items-center justify-center py-20">
            <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mb-6">
              <FileText className="w-10 h-10 text-emerald-400" />
            </div>
            <h2 className="text-xl font-bold text-foreground mb-2">No Reports Yet</h2>
            <p className="text-muted-foreground text-center mb-8 max-w-md">
              Your generated financial reports from NextBull AI will be securely saved here for future reference.
            </p>
            <Button onClick={handleNewReport} variant="outline" className="border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10">
              Generate Your First Report
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {reports.map((report) => (
            <Card
              key={report.id}
              className="bg-card/60 border-border/50 cursor-pointer hover:border-emerald-500/50 hover:bg-card transition-all group overflow-hidden relative"
              onClick={() => setSelectedReport(report)}
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-cyan-500 opacity-0 group-hover:opacity-100 transition-opacity" />
              <CardContent className="p-6">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="p-2.5 bg-secondary rounded-xl">
                    <FileText className="w-5 h-5 text-emerald-400" />
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all -mt-1 -mr-1"
                    onClick={(e) => handleDelete(e, report.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
                <h3 className="font-bold text-foreground text-lg mb-2 line-clamp-2 leading-tight group-hover:text-emerald-50 text-balance">
                  {report.title}
                </h3>
                <p className="text-muted-foreground text-xs flex items-center gap-1.5 font-medium">
                  <CalendarIcon className="w-3 h-3" />
                  {new Date(report.created_at).toLocaleDateString('en-IN', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                  })}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={!!selectedReport} onOpenChange={(open) => !open && setSelectedReport(null)}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-hidden flex flex-col p-0 border-border/50 bg-background/95 backdrop-blur-xl">
          <DialogHeader className="px-6 py-4 border-b border-border/40 bg-card/50 flex-shrink-0">
            <DialogTitle className="text-xl font-bold flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                <FileText className="w-4 h-4 text-emerald-400" />
              </div>
              {selectedReport?.title}
            </DialogTitle>
          </DialogHeader>
          <div className="p-6 md:p-8 overflow-y-auto custom-scrollbar flex-1 bg-card/30">
            {selectedReport && (
              <div className="prose prose-invert prose-emerald max-w-none">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {selectedReport.content}
                </ReactMarkdown>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Reports;
