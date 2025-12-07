import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Plus } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

const Reports = () => {
  const [reports] = useState<any[]>([]);
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

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
      description: "Ask NextBull GPT to generate a financial report for any company.",
    });
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-4xl font-bold text-foreground">Financial Reports</h1>
        <Button onClick={handleNewReport} className="gap-2">
          <Plus className="w-4 h-4" />
          New Report
        </Button>
      </div>

      {reports.length === 0 ? (
        <Card className="bg-card border-border">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <FileText className="w-16 h-16 text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold text-foreground mb-2">No Reports Yet</h2>
            <p className="text-muted-foreground text-center mb-6">
              Your generated financial reports will appear here.
            </p>
            <Button onClick={handleNewReport} variant="outline">
              Generate Your First Report
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {reports.map((report) => (
            <Card key={report.id} className="bg-card border-border cursor-pointer hover:border-primary/50 transition-colors">
              <CardContent className="p-6">
                <h3 className="font-semibold text-foreground mb-2">{report.title}</h3>
                <p className="text-muted-foreground text-sm">{report.date}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default Reports;
