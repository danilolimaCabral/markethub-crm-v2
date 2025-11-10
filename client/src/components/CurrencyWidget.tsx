import { useState, useEffect } from 'react';
import { DollarSign, TrendingUp, TrendingDown } from 'lucide-react';
import { Card } from './ui/card';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

interface Currency {
  code: string;
  name: string;
  buy: number;
  sell: number;
  variation: number;
}

interface HistoricalData {
  time: string;
  value: number;
}

export default function CurrencyWidget() {
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [selectedCurrency, setSelectedCurrency] = useState<string>('USD');
  const [historicalData, setHistoricalData] = useState<HistoricalData[]>([]);

  const fetchHistoricalData = async (currencyCode: string) => {
    try {
      // API para dados históricos (últimos 30 pontos = ~24h com intervalo de 48min)
      const response = await fetch(`https://economia.awesomeapi.com.br/json/daily/${currencyCode}-BRL/30`);
      const data = await response.json();
      
      const historical: HistoricalData[] = data.reverse().map((item: any) => ({
        time: new Date(parseInt(item.timestamp) * 1000).toLocaleTimeString('pt-BR', { 
          hour: '2-digit', 
          minute: '2-digit' 
        }),
        value: parseFloat(item.bid)
      }));
      
      setHistoricalData(historical);
    } catch (error) {
      console.error('Erro ao buscar dados históricos:', error);
    }
  };

  const fetchCurrencies = async () => {
    try {
      // API gratuita de cotações brasileira
      const response = await fetch('https://economia.awesomeapi.com.br/json/last/USD-BRL,EUR-BRL,BTC-BRL');
      const data = await response.json();

      const currenciesData: Currency[] = [
        {
          code: 'USD',
          name: 'Dólar',
          buy: parseFloat(data.USDBRL.bid),
          sell: parseFloat(data.USDBRL.ask),
          variation: parseFloat(data.USDBRL.pctChange)
        },
        {
          code: 'EUR',
          name: 'Euro',
          buy: parseFloat(data.EURBRL.bid),
          sell: parseFloat(data.EURBRL.ask),
          variation: parseFloat(data.EURBRL.pctChange)
        },
        {
          code: 'BTC',
          name: 'Bitcoin',
          buy: parseFloat(data.BTCBRL.bid),
          sell: parseFloat(data.BTCBRL.ask),
          variation: parseFloat(data.BTCBRL.pctChange)
        }
      ];

      setCurrencies(currenciesData);
      setLastUpdate(new Date());
      setLoading(false);
    } catch (error) {
      console.error('Erro ao buscar cotações:', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrencies();
    fetchHistoricalData(selectedCurrency);
    // Atualizar a cada 1 minuto
    const interval = setInterval(() => {
      fetchCurrencies();
      fetchHistoricalData(selectedCurrency);
    }, 60000);
    return () => clearInterval(interval);
  }, [selectedCurrency]);

  if (loading) {
    return (
      <Card className="p-4">
        <div className="flex items-center gap-2 text-muted-foreground">
          <DollarSign className="w-5 h-5 animate-pulse" />
          <span className="text-sm">Carregando cotações...</span>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <DollarSign className="w-5 h-5 text-green-600" />
          <h3 className="font-semibold text-foreground">Cotações</h3>
        </div>
        <span className="text-xs text-muted-foreground">
          {lastUpdate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>

      <div className="space-y-3 mb-4">
        {currencies.map((currency) => (
          <div 
            key={currency.code} 
            className={`flex items-center justify-between p-2 rounded cursor-pointer transition-colors ${
              selectedCurrency === currency.code ? 'bg-primary/10' : 'hover:bg-muted/50'
            }`}
            onClick={() => setSelectedCurrency(currency.code)}
          >
            <div>
              <p className="font-medium text-sm text-foreground">{currency.name}</p>
              <p className="text-xs text-muted-foreground">{currency.code}/BRL</p>
            </div>
            <div className="text-right">
              <p className="font-bold text-sm text-foreground">
                R$ {currency.code === 'BTC' 
                  ? currency.buy.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
                  : currency.buy.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                }
              </p>
              <div className={`flex items-center gap-1 text-xs ${currency.variation >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {currency.variation >= 0 ? (
                  <TrendingUp className="w-3 h-3" />
                ) : (
                  <TrendingDown className="w-3 h-3" />
                )}
                <span>{Math.abs(currency.variation).toFixed(2)}%</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Gráfico Histórico */}
      {historicalData.length > 0 && (
        <div className="mt-4 pt-4 border-t border-border">
          <p className="text-xs text-muted-foreground mb-2">
            Variação 24h - {currencies.find(c => c.code === selectedCurrency)?.name}
          </p>
          <ResponsiveContainer width="100%" height={120}>
            <LineChart data={historicalData}>
              <XAxis 
                dataKey="time" 
                tick={{ fontSize: 10 }}
                interval="preserveStartEnd"
                tickFormatter={(value, index) => {
                  // Mostrar apenas alguns labels
                  if (index === 0 || index === historicalData.length - 1) {
                    return value;
                  }
                  return '';
                }}
              />
              <YAxis 
                tick={{ fontSize: 10 }}
                width={60}
                domain={['auto', 'auto']}
                tickFormatter={(value) => 
                  selectedCurrency === 'BTC' 
                    ? `${(value / 1000).toFixed(0)}k`
                    : value.toFixed(2)
                }
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--popover))', 
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '6px',
                  fontSize: '12px'
                }}
                formatter={(value: any) => [
                  `R$ ${selectedCurrency === 'BTC' 
                    ? value.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
                    : value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                  }`,
                  'Valor'
                ]}
              />
              <Line 
                type="monotone" 
                dataKey="value" 
                stroke="hsl(var(--primary))" 
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </Card>
  );
}
