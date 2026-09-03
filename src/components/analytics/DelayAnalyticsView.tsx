import React from 'react';
import {
  DELAY_TRENDS_DATA,
  DELAY_DISTRIBUTION_DATA,
  DELAY_CAUSES_DATA,
  MODEL_ACCURACY_COMPARISON
} from '../../data/mockData';
import { BarChart3, TrendingUp, PieChart, ShieldCheck, Award } from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell
} from 'recharts';

export default function DelayAnalyticsView() {
  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 border border-slate-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/20 border border-cyan-400/30 text-cyan-300 text-xs font-bold font-mono uppercase tracking-wider mb-2">
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Operations Intelligence & Analytics</span>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight font-heading">
            Network Delay & ML Model Analytics
          </h1>
          <p className="text-slate-300 text-sm mt-1 max-w-2xl">
            Historical delay cause attribution, duration distributions, and AI model performance benchmarks vs legacy scheduling.
          </p>
        </div>
      </div>

      {/* TOP ROW: 24H DELAY TREND & MODEL ACCURACY BENCHMARK */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 1. Delay Trends Line Chart */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 font-heading">24-Hour Average Network Delay Trend</h3>
              <p className="text-xs text-slate-500">Hourly average delay in minutes across monitored trains</p>
            </div>
            <span className="text-xs font-mono font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded">
              Avg: 18.1 min
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={DELAY_TRENDS_DATA} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="time" stroke="#64748b" fontSize={11} fontWeight="bold" />
                <YAxis stroke="#64748b" fontSize={11} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#fff', borderRadius: '8px' }} />
                <Line type="monotone" dataKey="avgDelay" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4 }} name="Avg Delay (min)" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 2. Model Accuracy Comparison Bar Chart */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 font-heading">ETA Prediction Accuracy Benchmark</h3>
                <p className="text-xs text-slate-500">RailVue AI vs legacy NTES & static timetables</p>
              </div>
              <Award className="w-6 h-6 text-emerald-500" />
            </div>

            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={MODEL_ACCURACY_COMPARISON} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="name" stroke="#64748b" fontSize={10} fontWeight="bold" />
                  <YAxis domain={[50, 100]} stroke="#64748b" fontSize={11} />
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#fff', borderRadius: '8px' }} />
                  <Bar dataKey="accuracy" radius={[6, 6, 0, 0]}>
                    {MODEL_ACCURACY_COMPARISON.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 flex items-center justify-between text-xs font-bold text-emerald-900">
            <span>RailVue AI Engine Performance:</span>
            <span className="font-mono text-emerald-700 text-sm">94.8% Accuracy (+12.4% over NTES)</span>
          </div>
        </div>
      </div>

      {/* BOTTOM ROW: DELAY DISTRIBUTION & TOP CAUSES */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 3. Delay Duration Distribution */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
          <div className="mb-4">
            <h3 className="text-base font-bold text-slate-900 font-heading">Delay Duration Distribution</h3>
            <p className="text-xs text-slate-500">Breakdown of trains by delay time brackets</p>
          </div>

          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={DELAY_DISTRIBUTION_DATA} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="range" stroke="#64748b" fontSize={11} fontWeight="bold" />
                <YAxis stroke="#64748b" fontSize={11} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#fff', borderRadius: '8px' }} />
                <Bar dataKey="count" fill="#0284c7" radius={[4, 4, 0, 0]} name="Train Count" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 4. Top Delay Causes Horizontal Bar Chart */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
          <div className="mb-4">
            <h3 className="text-base font-bold text-slate-900 font-heading">Top Primary Delay Causes</h3>
            <p className="text-xs text-slate-500">Root cause attribution percentage across network</p>
          </div>

          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={DELAY_CAUSES_DATA} layout="vertical" margin={{ top: 0, right: 20, left: 40, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis type="number" stroke="#64748b" fontSize={11} />
                <YAxis dataKey="cause" type="category" stroke="#64748b" fontSize={10} fontWeight="bold" width={110} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#fff', borderRadius: '8px' }} />
                <Bar dataKey="value" fill="#f59e0b" radius={[0, 6, 6, 0]} name="Share (%)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
