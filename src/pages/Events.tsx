import { Card } from '@/components/ui/card';
import { Calendar, Clock, MapPin } from 'lucide-react';

interface Event {
  date: string;
  time: string;
  title: string;
  type: 'earnings' | 'ipo' | 'dividend' | 'split' | 'meeting';
  company?: string;
  details?: string;
}

const upcomingEvents: Event[] = [
  {
    date: 'Dec 10, 2025',
    time: '09:30 AM',
    title: 'Infosys Q3 Earnings Call',
    type: 'earnings',
    company: 'Infosys Ltd',
    details: 'Quarterly earnings announcement and guidance',
  },
  {
    date: 'Dec 12, 2025',
    time: '10:00 AM',
    title: 'Tata Motors AGM',
    type: 'meeting',
    company: 'Tata Motors',
    details: 'Annual General Meeting for shareholders',
  },
  {
    date: 'Dec 15, 2025',
    time: '09:00 AM',
    title: 'New IPO: TechStart Ltd',
    type: 'ipo',
    company: 'TechStart Ltd',
    details: 'IPO opens for subscription - Price band: ₹450-480',
  },
  {
    date: 'Dec 18, 2025',
    time: 'Ex-Date',
    title: 'HDFC Bank Dividend',
    type: 'dividend',
    company: 'HDFC Bank',
    details: 'Interim dividend of ₹19.50 per share',
  },
  {
    date: 'Dec 20, 2025',
    time: 'Record Date',
    title: 'Reliance Stock Split',
    type: 'split',
    company: 'Reliance Industries',
    details: '1:5 stock split - Record date for eligibility',
  },
];

const Events = () => {
  const getEventColor = (type: string) => {
    switch (type) {
      case 'earnings':
        return 'border-l-primary bg-primary/5';
      case 'ipo':
        return 'border-l-success bg-success/5';
      case 'dividend':
        return 'border-l-chart-2 bg-chart-2/5';
      case 'split':
        return 'border-l-warning bg-warning/5';
      case 'meeting':
        return 'border-l-chart-3 bg-chart-3/5';
      default:
        return 'border-l-muted-foreground';
    }
  };

  const getEventBadge = (type: string) => {
    switch (type) {
      case 'earnings':
        return 'Earnings';
      case 'ipo':
        return 'IPO';
      case 'dividend':
        return 'Dividend';
      case 'split':
        return 'Stock Split';
      case 'meeting':
        return 'Meeting';
      default:
        return type;
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-4xl font-bold text-foreground mb-8">Upcoming Events</h1>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-foreground mb-4">This Week</h2>
          {upcomingEvents.slice(0, 3).map((event, index) => (
            <Card
              key={index}
              className={`p-4 border-l-4 ${getEventColor(event.type)} cursor-pointer hover:shadow-md transition-shadow`}
            >
              <div className="flex items-start justify-between mb-2">
                <span className="text-xs font-medium px-2 py-1 rounded-full bg-secondary text-secondary-foreground">
                  {getEventBadge(event.type)}
                </span>
                <span className="text-muted-foreground text-sm">{event.company}</span>
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">{event.title}</h3>
              <p className="text-muted-foreground text-sm mb-3">{event.details}</p>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {event.date}
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {event.time}
                </div>
              </div>
            </Card>
          ))}
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-foreground mb-4">Next Week</h2>
          {upcomingEvents.slice(3).map((event, index) => (
            <Card
              key={index}
              className={`p-4 border-l-4 ${getEventColor(event.type)} cursor-pointer hover:shadow-md transition-shadow`}
            >
              <div className="flex items-start justify-between mb-2">
                <span className="text-xs font-medium px-2 py-1 rounded-full bg-secondary text-secondary-foreground">
                  {getEventBadge(event.type)}
                </span>
                <span className="text-muted-foreground text-sm">{event.company}</span>
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">{event.title}</h3>
              <p className="text-muted-foreground text-sm mb-3">{event.details}</p>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {event.date}
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {event.time}
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Events;
