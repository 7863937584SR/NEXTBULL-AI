import { useState } from 'react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Filter, Grid, List } from 'lucide-react';

interface ResearchItem {
  category: string;
  date: string;
  title: string;
  description: string;
  type: string;
}

const researchItems: ResearchItem[] = [
  {
    category: 'Research',
    date: 'Sep 5, 2025',
    title: 'Why stock markets fluctuate',
    description: 'Our new research explains the various factors causing stock market fluctuations, including economic indicators, investor sentiment, and global events.',
    type: 'Publication',
  },
  {
    category: 'Product',
    date: 'Aug 28, 2025',
    title: 'Introducing Realtime Trading API updates',
    description: "We're releasing a more advanced speech-to-text model and new API capabilities including real-time data streaming and automated order execution.",
    type: 'Release',
  },
  {
    category: 'Research',
    date: 'Aug 15, 2025',
    title: 'Market sentiment analysis using AI',
    description: 'A comprehensive study on how artificial intelligence can be leveraged to analyze market sentiment from news and social media.',
    type: 'Publication',
  },
  {
    category: 'Research',
    date: 'Jul 20, 2025',
    title: 'Technical analysis patterns recognition',
    description: 'Deep learning models for automated detection of chart patterns and their predictive accuracy.',
    type: 'Conclusion',
  },
];

const Research = () => {
  const [activeFilter, setActiveFilter] = useState('All');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');

  const filters = ['All', 'Publication', 'Conclusion', 'Milestone', 'Release'];

  const filteredItems = activeFilter === 'All' 
    ? researchItems 
    : researchItems.filter(item => item.type === activeFilter);

  return (
    <div className="p-8">
      <h1 className="text-4xl font-bold text-foreground mb-8">Research</h1>

      <div className="flex items-center justify-between mb-6">
        <Tabs defaultValue="All" className="w-auto">
          <TabsList>
            {filters.map((filter) => (
              <TabsTrigger
                key={filter}
                value={filter}
                onClick={() => setActiveFilter(filter)}
              >
                {filter}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" className="gap-2">
            <Filter className="w-4 h-4" />
            Filter
          </Button>
          <span className="text-muted-foreground">Sort</span>
          <div className="flex gap-1">
            <Button
              variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
              size="icon"
              onClick={() => setViewMode('grid')}
            >
              <Grid className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'secondary' : 'ghost'}
              size="icon"
              onClick={() => setViewMode('list')}
            >
              <List className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {filteredItems.map((item, index) => (
          <div
            key={index}
            className="flex gap-8 py-6 border-t border-border hover:bg-secondary/30 transition-colors px-4 -mx-4 rounded-lg cursor-pointer"
          >
            <div className="w-32 flex-shrink-0">
              <p className="text-muted-foreground text-sm">{item.category}</p>
              <p className="text-muted-foreground text-sm">{item.date}</p>
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-semibold text-foreground mb-2">{item.title}</h3>
              <p className="text-muted-foreground leading-relaxed">{item.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Research;
