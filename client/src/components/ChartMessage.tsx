import { BarChart, Bar, PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { ChevronLeft } from 'lucide-react';

interface ChartMessageProps {
  type: 'bar' | 'pie' | 'line';
  data: any[];
  title?: string;
  dataKey?: string;
  nameKey?: string;
  onDrillDown?: (item: any) => { data: any[], title: string } | null;
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export default function ChartMessage({ type, data, title, dataKey = 'value', nameKey = 'name', onDrillDown }: ChartMessageProps) {
  const [drillDownData, setDrillDownData] = useState<{ data: any[], title: string } | null>(null);
  const [selectedItem, setSelectedItem] = useState<string | null>(null);

  const handleClick = (data: any) => {
    if (onDrillDown) {
      const result = onDrillDown(data);
      if (result) {
        setDrillDownData(result);
        setSelectedItem(data[nameKey]);
      }
    }
  };

  const handleBack = () => {
    setDrillDownData(null);
    setSelectedItem(null);
  };

  const currentData = drillDownData?.data || data;
  const currentTitle = drillDownData?.title || title;

  return (
    <div className="w-full bg-background border rounded-lg p-4 my-2">
      <div className="flex items-center justify-between mb-3">
        {currentTitle && <h4 className="text-sm font-semibold">{currentTitle}</h4>}
        {drillDownData && (
          <Button variant="ghost" size="sm" onClick={handleBack} className="gap-1">
            <ChevronLeft className="w-4 h-4" />
            Voltar
          </Button>
        )}
      </div>
      
      {type === 'bar' && (
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={currentData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey={nameKey} />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar 
              dataKey={dataKey} 
              fill="#3b82f6" 
              radius={[8, 8, 0, 0]}
              onClick={handleClick}
              cursor={onDrillDown ? "pointer" : "default"}
            />
          </BarChart>
        </ResponsiveContainer>
      )}
      
      {type === 'pie' && (
        <ResponsiveContainer width="100%" height={250}>
          <PieChart>
            <Pie
              data={currentData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
              outerRadius={80}
              fill="#8884d8"
              dataKey={dataKey}
              onClick={handleClick}
              cursor={onDrillDown ? "pointer" : "default"}
            >
              {currentData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      )}
      
      {type === 'line' && (
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={currentData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey={nameKey} />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line 
              type="monotone" 
              dataKey={dataKey} 
              stroke="#3b82f6" 
              strokeWidth={2}
              onClick={handleClick}
              cursor={onDrillDown ? "pointer" : "default"}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
      
      {onDrillDown && !drillDownData && (
        <p className="text-xs text-muted-foreground mt-2 text-center">
          💡 Clique em uma barra/fatia para ver detalhes
        </p>
      )}
    </div>
  );
}
