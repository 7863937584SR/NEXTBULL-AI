import { useState, useEffect, useRef, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowRightLeft, 
  Calculator, 
  TrendingUp, 
  Clock,
  RefreshCw,
  Bookmark,
  BookmarkCheck
} from 'lucide-react';
import { fetchForexRates } from '@/services/forexService';

interface CurrencyConverterProps {
  className?: string;
}

interface ConversionResult {
  from: string;
  to: string;
  fromAmount: number;
  toAmount: number;
  rate: number;
  timestamp: Date;
}

// Popular currency codes with flags and names
const CURRENCIES = [
  { code: 'USD', name: 'US Dollar', flag: '🇺🇸', symbol: '$' },
  { code: 'EUR', name: 'Euro', flag: '🇪🇺', symbol: '€' },
  { code: 'GBP', name: 'British Pound', flag: '🇬🇧', symbol: '£' },
  { code: 'JPY', name: 'Japanese Yen', flag: '🇯🇵', symbol: '¥' },
  { code: 'INR', name: 'Indian Rupee', flag: '🇮🇳', symbol: '₹' },
  { code: 'AUD', name: 'Australian Dollar', flag: '🇦🇺', symbol: 'A$' },
  { code: 'CAD', name: 'Canadian Dollar', flag: '🇨🇦', symbol: 'C$' },
  { code: 'CHF', name: 'Swiss Franc', flag: '🇨🇭', symbol: 'Fr' },
  { code: 'CNY', name: 'Chinese Yuan', flag: '🇨🇳', symbol: '¥' },
  { code: 'SEK', name: 'Swedish Krona', flag: '🇸🇪', symbol: 'kr' },
  { code: 'NOK', name: 'Norwegian Krone', flag: '🇳🇴', symbol: 'kr' },
  { code: 'SGD', name: 'Singapore Dollar', flag: '🇸🇬', symbol: 'S$' },
  { code: 'HKD', name: 'Hong Kong Dollar', flag: '🇭🇰', symbol: 'HK$' },
  { code: 'NZD', name: 'New Zealand Dollar', flag: '🇳🇿', symbol: 'NZ$' },
  { code: 'MXN', name: 'Mexican Peso', flag: '🇲🇽', symbol: '$' },
];

export const CurrencyConverter = ({ className = '' }: CurrencyConverterProps) => {
  const [fromCurrency, setFromCurrency] = useState('USD');
  const [toCurrency, setToCurrency] = useState('INR');
  const [amount, setAmount] = useState('1');
  const [result, setResult] = useState<ConversionResult | null>(null);
  const [savedConversions, setSavedConversions] = useState<ConversionResult[]>([]);

  const { data: forexRates, isLoading, refetch } = useQuery({
    queryKey: ['forex-rates-converter'],
    queryFn: fetchForexRates,
    refetchInterval: 60000,
    retry: 2,
  });

  // Extended rate fetching function for more currency pairs
  const getExchangeRate = async (from: string, to: string): Promise<number> => {
    if (from === to) return 1;
    
    try {
      // Try to get rate from our forex service first
      if (forexRates) {
        const directRate = forexRates.find(rate => rate.pair === `${from}/${to}`);
        if (directRate) return directRate.rate;
        
        const inverseRate = forexRates.find(rate => rate.pair === `${to}/${from}`);
        if (inverseRate) return 1 / inverseRate.rate;
        
        // Cross-rate calculation via USD
        if (from !== 'USD' && to !== 'USD') {
          const fromToUsd = forexRates.find(rate => rate.pair === `USD/${from}`);
          const usdToTarget = forexRates.find(rate => rate.pair === `USD/${to}`);
          
          if (fromToUsd && usdToTarget) {
            return usdToTarget.rate / fromToUsd.rate;
          }
        }
      }
      
      // Fallback to external API
      const response = await fetch(
        `https://api.exchangerate-api.com/v4/latest/${from}`
      );
      
      if (!response.ok) {
        // Secondary fallback
        const fallbackResponse = await fetch(
          `https://api.frankfurter.app/latest?from=${from}&to=${to}`
        );
        
        if (fallbackResponse.ok) {
          const data = await fallbackResponse.json();
          return data.rates[to] || 1;
        }
        
        throw new Error('Unable to fetch exchange rate');
      }
      
      const data = await response.json();
      return data.rates[to] || 1;
      
    } catch (error) {
      console.error('Exchange rate fetch failed:', error);
      throw new Error('Unable to fetch exchange rate. Please try again.');
    }
  };

  const convertCurrency = async () => {
    const numAmount = parseFloat(amount) || 0;
    if (numAmount <= 0) return;
    
    try {
      const rate = await getExchangeRate(fromCurrency, toCurrency);
      const convertedAmount = numAmount * rate;
      
      const newResult: ConversionResult = {
        from: fromCurrency,
        to: toCurrency,
        fromAmount: numAmount,
        toAmount: convertedAmount,
        rate,
        timestamp: new Date(),
      };
      
      setResult(newResult);
    } catch (error) {
      console.error('Conversion failed:', error);
    }
  };

  const swapCurrencies = () => {
    setFromCurrency(toCurrency);
    setToCurrency(fromCurrency);
    if (result) {
      setAmount(result.toAmount.toString());
    }
  };

  const saveConversion = () => {
    if (result) {
      setSavedConversions(prev => [result, ...prev.slice(0, 4)]);
    }
  };

  const getCurrencyInfo = (code: string) => {
    return CURRENCIES.find(c => c.code === code) || { 
      code, name: code, flag: '💱', symbol: code 
    };
  };

  // Debounced conversion — waits 500ms after the last input change before firing
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (amount && fromCurrency && toCurrency) {
      debounceRef.current = setTimeout(() => {
        convertCurrency();
      }, 500);
    }
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [amount, fromCurrency, toCurrency, forexRates]);

  return (
    <Card className={`${className} bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5 border-border/40 backdrop-blur-sm`}>
      <CardHeader>
        <CardTitle className="text-xl font-bold flex items-center gap-3">
          <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-500/10 ring-1 ring-blue-500/20">
            <Calculator className="w-5 h-5 text-blue-500" />
          </div>
          Currency Converter
          <Button
            variant="ghost"
            size="sm"
            onClick={() => refetch()}
            disabled={isLoading}
            className="ml-auto"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Amount Input */}
        <div className="space-y-2">
          <Label htmlFor="amount" className="text-sm font-medium">Amount</Label>
          <Input
            id="amount"
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Enter amount"
            className="text-lg font-mono"
            min="0"
            step="0.01"
          />
        </div>

        {/* Currency Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
          {/* From Currency */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">From</Label>
            <select
              value={fromCurrency}
              onChange={(e) => setFromCurrency(e.target.value)}
              className="w-full p-3 rounded-md border border-border bg-secondary text-sm font-medium"
            >
              {CURRENCIES.map(currency => {
                const info = getCurrencyInfo(currency.code);
                return (
                  <option key={currency.code} value={currency.code}>
                    {info.flag} {currency.code} - {currency.name}
                  </option>
                );
              })}
            </select>
          </div>

          {/* To Currency */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">To</Label>
            <div className="flex gap-2">
              <select
                value={toCurrency}
                onChange={(e) => setToCurrency(e.target.value)}
                className="flex-1 p-3 rounded-md border border-border bg-secondary text-sm font-medium"
              >
                {CURRENCIES.map(currency => {
                  const info = getCurrencyInfo(currency.code);
                  return (
                    <option key={currency.code} value={currency.code}>
                      {info.flag} {currency.code} - {currency.name}
                    </option>
                  );
                })}
              </select>
              <Button
                variant="outline"
                size="icon"
                onClick={swapCurrencies}
                className="shrink-0"
              >
                <ArrowRightLeft className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Conversion Result */}
        {result && (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-500/10 to-blue-500/10 border border-emerald-500/20">
              <div className="flex items-center justify-between mb-3">
                <div className="text-sm text-muted-foreground">
                  Conversion Result
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs">
                    <Clock className="w-3 h-3 mr-1" />
                    {result.timestamp.toLocaleTimeString()}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={saveConversion}
                    className="h-auto p-1"
                  >
                    <Bookmark className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="text-3xl font-bold font-mono">
                  {getCurrencyInfo(fromCurrency).symbol}{result.fromAmount.toLocaleString()} {fromCurrency}
                </div>
                <div className="text-sm text-muted-foreground">=</div>
                <div className="text-3xl font-bold font-mono text-emerald-500">
                  {getCurrencyInfo(toCurrency).symbol}{result.toAmount.toLocaleString(undefined, { 
                    minimumFractionDigits: 2, 
                    maximumFractionDigits: 4 
                  })} {toCurrency}
                </div>
                <div className="text-sm text-muted-foreground">
                  Exchange Rate: 1 {fromCurrency} = {result.rate.toFixed(6)} {toCurrency}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="space-y-3">
          <div className="text-sm font-medium">Quick Amounts</div>
          <div className="flex flex-wrap gap-2">
            {['1', '10', '100', '1000', '10000'].map(quickAmount => (
              <Button
                key={quickAmount}
                variant="outline"
                size="sm"
                onClick={() => setAmount(quickAmount)}
                className="text-xs"
              >
                {getCurrencyInfo(fromCurrency).symbol}{quickAmount}
              </Button>
            ))}
          </div>
        </div>

        {/* Popular Pairs */}
        <div className="space-y-3">
          <div className="text-sm font-medium">Popular Pairs</div>
          <div className="grid grid-cols-2 gap-2">
            {[
              { from: 'USD', to: 'INR' },
              { from: 'EUR', to: 'USD' },
              { from: 'GBP', to: 'USD' },
              { from: 'USD', to: 'JPY' },
            ].map(pair => (
              <Button
                key={`${pair.from}-${pair.to}`}
                variant="outline"
                size="sm"
                onClick={() => {
                  setFromCurrency(pair.from);
                  setToCurrency(pair.to);
                }}
                className="text-xs justify-start"
              >
                {getCurrencyInfo(pair.from).flag} {pair.from} → {getCurrencyInfo(pair.to).flag} {pair.to}
              </Button>
            ))}
          </div>
        </div>

        {/* Recent Conversions */}
        {savedConversions.length > 0 && (
          <div className="space-y-3">
            <div className="text-sm font-medium flex items-center gap-2">
              <BookmarkCheck className="w-4 h-4 text-emerald-500" />
              Recent Conversions
            </div>
            <div className="space-y-2">
              {savedConversions.map((conversion, index) => (
                <div 
                  key={index}
                  className="flex items-center justify-between p-2 rounded-lg bg-secondary/30 text-sm"
                >
                  <div>
                    {getCurrencyInfo(conversion.from).symbol}{conversion.fromAmount} {conversion.from} → 
                    {getCurrencyInfo(conversion.to).symbol}{conversion.toAmount.toFixed(2)} {conversion.to}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {conversion.timestamp.toLocaleTimeString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CurrencyConverter;