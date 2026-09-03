"use client";

import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Legend, PieChart, Pie, Cell
} from 'recharts';

const monthlyData = [
  { name: 'Jan', trips: 2, distance: 45 },
  { name: 'Feb', trips: 3, distance: 78 },
  { name: 'Mar', trips: 5, distance: 120 },
  { name: 'Apr', trips: 4, distance: 95 },
  { name: 'May', trips: 7, distance: 180 },
  { name: 'Jun', trips: 8, distance: 210 },
];

const difficultyData = [
  { name: 'Easy', value: 400 },
  { name: 'Moderate', value: 300 },
  { name: 'Hard', value: 300 },
  { name: 'Expert', value: 200 },
];

const COLORS = ['#165C38', '#F26D21', '#FF9F1C', '#1D3B55'];

export function DistanceChart() {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart data={monthlyData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
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

export function DifficultyChart() {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={difficultyData}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={80}
          fill="#8884d8"
          paddingAngle={5}
          dataKey="value"
        >
          {difficultyData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip contentStyle={{ backgroundColor: '#121212', border: '1px solid rgba(255,255,255,0.1)' }} />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}
