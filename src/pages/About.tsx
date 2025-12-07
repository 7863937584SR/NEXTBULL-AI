import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, Brain, Shield, Zap } from 'lucide-react';

const About = () => {
  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-4xl font-bold text-foreground mb-4">About NextBull GPT</h1>
      <p className="text-xl text-muted-foreground mb-12">
        Your AI-powered trading intelligence platform combining the power of multiple AI models 
        to deliver the best possible insights for your trading decisions.
      </p>

      <div className="grid md:grid-cols-2 gap-6 mb-12">
        <Card className="bg-card border-border">
          <CardHeader>
            <Brain className="w-10 h-10 text-primary mb-2" />
            <CardTitle>Multi-Model AI</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              NextBull GPT combines multiple AI models to provide you with the most accurate 
              and comprehensive market analysis, sentiment detection, and trading insights.
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader>
            <TrendingUp className="w-10 h-10 text-success mb-2" />
            <CardTitle>Real-time Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Get instant market analysis, news summaries, and sentiment readings 
              powered by live data feeds and advanced natural language processing.
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader>
            <Shield className="w-10 h-10 text-chart-2 mb-2" />
            <CardTitle>Secure Trading</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Connect your broker accounts securely with API-level encryption. 
              Your credentials are never stored and all connections use industry-standard security.
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader>
            <Zap className="w-10 h-10 text-warning mb-2" />
            <CardTitle>Lightning Fast</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Built for speed with real-time data streaming, instant AI responses, 
              and optimized performance for time-sensitive trading decisions.
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-secondary/30 border-border">
        <CardContent className="py-8">
          <h2 className="text-2xl font-bold text-foreground mb-4">How NextBull GPT Works</h2>
          <div className="space-y-4 text-muted-foreground">
            <p>
              NextBull GPT is designed to be your intelligent trading companion. When you ask a question, 
              our system processes it through multiple AI models simultaneously:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Advanced reasoning models for complex market analysis</li>
              <li>Fast models for quick sentiment and news processing</li>
              <li>Specialized models for financial data interpretation</li>
            </ul>
            <p>
              The results are then combined and refined to give you the single best answer, 
              ensuring you get comprehensive and accurate insights every time.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default About;
