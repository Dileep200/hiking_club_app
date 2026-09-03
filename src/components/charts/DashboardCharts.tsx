"use client";

import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Legend, PieChart, Pie, Cell
} from 'recharts';

const COLORS = ['#165C38', '#F26D21', '#FF9F1C', '#1D3B55'];

export function DistanceChart({ data }: { data?: any[] }) {
  if (!data || data.length === 0) {
    return <div className="h-[300px] flex items-center justify-center text-gray-500">No trip data available yet</div>;
  }
  return (
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="colorDist" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#F26D21" stopOpacity={0.8}/>
            <stop offset="95%" stopColor="#F26D21" stopOpacity={0}/>
          </linearGradient>
        </defs>
        <XAxis dataKey="name" stroke="#6b7280" />
        <YAxis stroke="#6b7280" />
        <Tooltip 
          contentStyle={{ backgroundColor: '#121212', border: '1px solid rgba(255,255,255,0.1)' }}
          itemStyle={{ color: '#F26D21' }}
        />
        <Area type="monotone" dataKey="distance" stroke="#F26D21" fillOpacity={1} fill="url(#colorDist)" />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function DifficultyChart({ data }: { data?: any[] }) {
  if (!data || data.length === 0) {
    return <div className="h-[300px] flex items-center justify-center text-gray-500">No trips created yet</div>;
  }
  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={80}
          fill="#8884d8"
          paddingAngle={5}
          dataKey="value"
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip contentStyle={{ backgroundColor: '#121212', border: '1px solid rgba(255,255,255,0.1)' }} />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}
