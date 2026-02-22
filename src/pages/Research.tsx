import { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  TrendingUp,
  BarChart3,
  FileText,
  BookOpen,
  ArrowRight,
  Calendar,
  Star,
  Lightbulb,
  Shield,
  Globe,
  Search,
  Grid,
  List,
} from 'lucide-react';
import { Input } from '@/components/ui/input';

interface ResearchItem {
  id: string;
  category: 'fundamental' | 'technical' | 'sector' | 'macro' | 'strategy' | 'learning';
  date: string;
  title: string;
  description: string;
  tag: string;
  readTime: string;
  source: string;
  featured?: boolean;
}

const CATEGORIES = [
  { key: 'all', label: 'All', icon: BookOpen },
  { key: 'fundamental', label: 'Fundamental', icon: FileText },
  { key: 'technical', label: 'Technical', icon: BarChart3 },
  { key: 'sector', label: 'Sector Reports', icon: TrendingUp },
  { key: 'macro', label: 'Macro & Global', icon: Globe },
  { key: 'strategy', label: 'Strategies', icon: Lightbulb },
  { key: 'learning', label: 'Learning', icon: BookOpen },
];

const CATEGORY_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  fundamental: { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/30' },
  technical: { bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/30' },
  sector: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/30' },
  macro: { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/30' },
  strategy: { bg: 'bg-rose-500/10', text: 'text-rose-400', border: 'border-rose-500/30' },
  learning: { bg: 'bg-cyan-500/10', text: 'text-cyan-400', border: 'border-cyan-500/30' },
};

const GRADIENT_MAP: Record<string, string> = {
  fundamental: 'from-blue-500/15 via-transparent to-transparent',
  technical: 'from-purple-500/15 via-transparent to-transparent',
  sector: 'from-emerald-500/15 via-transparent to-transparent',
  macro: 'from-amber-500/15 via-transparent to-transparent',
  strategy: 'from-rose-500/15 via-transparent to-transparent',
  learning: 'from-cyan-500/15 via-transparent to-transparent',
};

const researchItems: ResearchItem[] = [
  {
    id: 'r1',
    category: 'fundamental',
    date: 'Feb 20, 2026',
    title: 'Q3 FY26 Earnings Review: IT Sector Outperforms Expectations',
    description: 'TCS, Infosys, and Wipro beat street estimates with strong deal wins. Revenue growth accelerates to 5.2% QoQ led by BFSI and healthcare verticals. Margin expansion driven by pyramid optimisation and AI-led productivity gains.',
    tag: 'Earnings Analysis',
    readTime: '8 min read',
    source: 'NextBull Research',
    featured: true,
  },
  {
    id: 'r2',
    category: 'technical',
    date: 'Feb 18, 2026',
    title: 'NIFTY 50 Technical Outlook: Key Levels to Watch This Week',
    description: 'NIFTY forming a bullish flag pattern above 23,500 support. RSI at 58 indicates room for further upside. Key resistance at 24,200 with breakout target of 24,800. Put-Call Ratio at 1.2 signals bullish undertone. Bank NIFTY showing relative strength.',
    tag: 'Technical Analysis',
    readTime: '6 min read',
    source: 'NextBull Research',
    featured: true,
  },
  {
    id: 'r3',
    category: 'macro',
    date: 'Feb 15, 2026',
    title: 'RBI MPC Holds Rates Steady: What It Means for Markets',
    description: 'RBI keeps repo rate unchanged at 6.5% for the 10th consecutive time with a neutral stance. GDP growth projected at 7.0% for FY26. Rupee stability and controlled inflation (CPI at 4.8%) support the decision. FII flows turning positive after 3 months of outflows.',
    tag: 'Monetary Policy',
    readTime: '10 min read',
    source: 'NextBull Research',
  },
  {
    id: 'r4',
    category: 'sector',
    date: 'Feb 12, 2026',
    title: 'Banking Sector Deep Dive: PSU Banks vs Private Banks',
    description: 'Private banks trading at 2.5x P/B vs PSU banks at 1.1x P/B. SBI and Bank of Baroda show improving asset quality with GNPA below 3%. HDFC Bank and ICICI Bank leading on CASA ratio. Credit growth at 14.5% YoY supports the bullish thesis.',
    tag: 'Sector Analysis',
    readTime: '12 min read',
    source: 'NextBull Research',
  },
  {
    id: 'r5',
    category: 'strategy',
    date: 'Feb 10, 2026',
    title: 'Options Strategy: Iron Condor on NIFTY for Range-Bound Markets',
    description: 'With India VIX at 13.5 and NIFTY in a 23,500–24,200 range, iron condor strategy offers optimal risk-reward. Sell 23,400 PE and 24,300 CE, buy 23,200 PE and 24,500 CE. Max profit ₹8,400 per lot with defined risk of ₹6,600. Ideal for 15-20 DTE.',
    tag: 'Options Strategy',
    readTime: '7 min read',
    source: 'NextBull Research',
  },
  {
    id: 'r6',
    category: 'macro',
    date: 'Feb 8, 2026',
    title: 'US Fed Minutes: Impact on Indian Markets & FII Flows',
    description: 'Fed signals rate cuts likely by Q2 2026 as Core PCE drops to 2.4%. DXY weakening below 103 is positive for emerging markets. FII flows into Indian equities turned positive at ₹12,500 Cr in February. Bond yields declining supports IT and pharma sector valuations.',
    tag: 'Global Macro',
    readTime: '9 min read',
    source: 'NextBull Research',
  },
  {
    id: 'r7',
    category: 'fundamental',
    date: 'Feb 5, 2026',
    title: 'Reliance Industries: Sum-of-Parts Valuation Update',
    description: 'Jio Platforms valued at ₹8.5L Cr (35x EV/EBITDA), Retail at ₹4.2L Cr (50x P/E), and O2C at ₹5.8L Cr (7x EV/EBITDA). Target price ₹3,250 with 18% upside. New energy capex of ₹75,000 Cr creating long-term optionality. Promoter holding stable at 50.3%.',
    tag: 'Stock Analysis',
    readTime: '11 min read',
    source: 'NextBull Research',
  },
  {
    id: 'r8',
    category: 'sector',
    date: 'Feb 2, 2026',
    title: 'Defence Sector: Order Book Boom & FY26 Revenue Visibility',
    description: 'HAL, BEL, and Mazagon Dock sit on combined order book of ₹2.8L Cr. Government defence spending up 13% YoY in Union Budget. Atmanirbhar Bharat push driving import substitution. HAL P/E at 38x vs global defence avg of 22x — premium justified by 25% EPS growth.',
    tag: 'Sector Analysis',
    readTime: '9 min read',
    source: 'NextBull Research',
  },
  {
    id: 'r9',
    category: 'learning',
    date: 'Jan 28, 2026',
    title: 'Understanding F&O Expiry: How to Trade Weekly Options',
    description: 'Complete guide to weekly NIFTY and Bank NIFTY expiry dynamics. Covers max pain theory, OI build-up interpretation, time decay (theta) management, and practical strategies for expiry day trading. Includes real examples from recent expiries with P&L breakdowns.',
    tag: 'Education',
    readTime: '15 min read',
    source: 'NextBull Academy',
  },
  {
    id: 'r10',
    category: 'technical',
    date: 'Jan 25, 2026',
    title: 'Multi-Timeframe Analysis: Identifying High-Probability Setups',
    description: 'How to combine weekly, daily, and hourly charts for confirmation. Uses moving average confluence (20/50/200 EMA alignment), RSI divergences, and volume profile to identify entries. Backtested on NIFTY 50 stocks with 68% win rate over 200 trades.',
    tag: 'Technical Guide',
    readTime: '13 min read',
    source: 'NextBull Academy',
  },
  {
    id: 'r11',
    category: 'strategy',
    date: 'Jan 22, 2026',
    title: 'Momentum Investing: Building a Relative Strength Portfolio',
    description: 'Systematic approach to picking top 15 stocks by 6-month relative strength from NIFTY 200 universe. Rebalanced monthly with 10% trailing stop-loss. Backtested CAGR of 28% vs NIFTY\'s 14% over 5 years. Current top picks: Trent, Persistent, Zomato, M&M, PB Fintech.',
    tag: 'Investment Strategy',
    readTime: '10 min read',
    source: 'NextBull Research',
  },
  {
    id: 'r12',
    category: 'learning',
    date: 'Jan 18, 2026',
    title: 'Reading FII/DII Data: The Ultimate Guide for Indian Traders',
    description: 'How to interpret daily FII/DII cash and derivative data from NSE. Covers provisional vs actual figures, sector-wise FII allocation trends, and how sustained FII selling creates buying opportunities. Includes a framework for combining FII data with technical levels.',
    tag: 'Education',
    readTime: '12 min read',
    source: 'NextBull Academy',
  },
];

const Research = () => {
  const [activeCategory, setActiveCategory] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredItems = useMemo(() => {
    let items = activeCategory === 'all'
      ? researchItems
      : researchItems.filter(item => item.category === activeCategory);

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      items = items.filter(
        item =>
          item.title.toLowerCase().includes(q) ||
          item.description.toLowerCase().includes(q) ||
          item.tag.toLowerCase().includes(q)
      );
    }

    return items;
  }, [activeCategory, searchQuery]);

  const featuredItems = researchItems.filter(item => item.featured);

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8">
      {/* ── HEADER ── */}
      <div>
        <h1 className="text-3xl font-extrabold text-foreground tracking-tight">Research & Insights</h1>
        <p className="text-sm text-muted-foreground mt-1">
          In-depth market analysis, sector reports, and trading strategies by NextBull Research
        </p>
      </div>

      {/* ── FEATURED ARTICLES ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {featuredItems.map((item) => {
          const colors = CATEGORY_COLORS[item.category];
          return (
            <Card
              key={item.id}
              className={`relative overflow-hidden bg-gradient-to-br ${GRADIENT_MAP[item.category]} border ${colors.border} hover:scale-[1.01] transition-all duration-300 cursor-pointer group`}
            >
              {/* Featured ribbon */}
              <div className="absolute top-3 right-3">
                <Badge className="bg-primary/90 text-primary-foreground text-[10px] font-bold gap-1 px-2 py-0.5 border-0">
                  <Star className="w-3 h-3" /> FEATURED
                </Badge>
              </div>
              {/* Decorative glow */}
              <div className={`absolute -bottom-10 -right-10 w-40 h-40 rounded-full ${colors.bg} blur-3xl opacity-40`} />
              <CardContent className="p-6 relative z-10">
                <div className="flex items-center gap-2 mb-3">
                  <Badge variant="outline" className={`${colors.bg} ${colors.text} border-0 text-[10px] font-semibold uppercase tracking-wider`}>
                    {item.tag}
                  </Badge>
                  <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                    <Calendar className="w-3 h-3" /> {item.date}
                  </span>
                </div>
                <h2 className="text-xl font-bold text-foreground mb-2 group-hover:text-primary transition-colors leading-tight">
                  {item.title}
                </h2>
                <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">
                  {item.description}
                </p>
                <div className="flex items-center justify-between mt-4">
                  <span className="text-[11px] text-muted-foreground">{item.readTime} · {item.source}</span>
                  <span className="text-primary text-xs font-semibold flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    Read more <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* ── FILTERS & SEARCH ── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        {/* Category pills */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            return (
              <button
                key={cat.key}
                onClick={() => setActiveCategory(cat.key)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 ${activeCategory === cat.key
                    ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20'
                    : 'bg-secondary/60 text-muted-foreground hover:bg-secondary hover:text-foreground'
                  }`}
              >
                <Icon className="w-3 h-3" />
                {cat.label}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          {/* Search */}
          <div className="relative flex-1 sm:w-56">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <Input
              placeholder="Search research..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-8 text-xs bg-secondary/50 border-border/50"
            />
          </div>
          {/* View mode toggle */}
          <div className="flex gap-0.5 bg-secondary/50 rounded-lg p-0.5">
            <Button
              variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
              size="icon"
              className="h-7 w-7"
              onClick={() => setViewMode('grid')}
            >
              <Grid className="w-3.5 h-3.5" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'secondary' : 'ghost'}
              size="icon"
              className="h-7 w-7"
              onClick={() => setViewMode('list')}
            >
              <List className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      </div>

      {/* ── RESULTS COUNT ── */}
      <p className="text-xs text-muted-foreground -mt-4">
        Showing {filteredItems.length} {filteredItems.length === 1 ? 'article' : 'articles'}
        {activeCategory !== 'all' && ` in ${CATEGORIES.find(c => c.key === activeCategory)?.label}`}
      </p>

      {/* ── ARTICLES ── */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredItems.map((item) => {
            const colors = CATEGORY_COLORS[item.category];
            return (
              <Card
                key={item.id}
                className="bg-card/70 border-border/40 hover:border-primary/30 backdrop-blur-sm transition-all duration-200 cursor-pointer group overflow-hidden relative"
              >
                {/* Top accent line */}
                <div className={`absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r ${GRADIENT_MAP[item.category].replace('via-transparent to-transparent', 'to-transparent')}`} />
                <CardContent className="p-5 flex flex-col h-full">
                  <div className="flex items-center gap-2 mb-3">
                    <Badge variant="outline" className={`${colors.bg} ${colors.text} border-0 text-[10px] font-semibold`}>
                      {item.tag}
                    </Badge>
                  </div>
                  <h3 className="text-base font-bold text-foreground mb-2 group-hover:text-primary transition-colors leading-snug line-clamp-2">
                    {item.title}
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3 mb-4 flex-1">
                    {item.description}
                  </p>
                  <div className="flex items-center justify-between text-[11px] text-muted-foreground mt-auto pt-3 border-t border-border/30">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" /> {item.date}
                    </span>
                    <span>{item.readTime}</span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredItems.map((item) => {
            const colors = CATEGORY_COLORS[item.category];
            return (
              <Card
                key={item.id}
                className="bg-card/70 border-border/40 hover:border-primary/30 backdrop-blur-sm transition-all duration-200 cursor-pointer group"
              >
                <CardContent className="p-5 flex flex-col sm:flex-row gap-4">
                  {/* Left meta */}
                  <div className="flex sm:flex-col items-center sm:items-start gap-2 sm:w-32 flex-shrink-0">
                    <Badge variant="outline" className={`${colors.bg} ${colors.text} border-0 text-[10px] font-semibold`}>
                      {item.tag}
                    </Badge>
                    <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                      <Calendar className="w-3 h-3" /> {item.date}
                    </span>
                  </div>
                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base font-bold text-foreground group-hover:text-primary transition-colors leading-snug mb-1">
                      {item.title}
                    </h3>
                    <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                      {item.description}
                    </p>
                  </div>
                  {/* Right meta */}
                  <div className="flex sm:flex-col items-center sm:items-end gap-2 sm:w-24 flex-shrink-0 text-[11px] text-muted-foreground">
                    <span>{item.readTime}</span>
                    <span className="text-primary text-xs font-semibold flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      Read <ArrowRight className="w-3 h-3" />
                    </span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {filteredItems.length === 0 && (
        <div className="text-center py-16">
          <Search className="w-10 h-10 text-muted-foreground/50 mx-auto mb-3" />
          <p className="text-muted-foreground text-sm">No articles found matching your criteria</p>
          <Button variant="link" size="sm" onClick={() => { setActiveCategory('all'); setSearchQuery(''); }}>
            Clear filters
          </Button>
        </div>
      )}
    </div>
  );
};

export default Research;
