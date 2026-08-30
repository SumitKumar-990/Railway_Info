import React, { useState } from 'react';
import Sidebar from './components/layout/Sidebar';
import Header from './components/layout/Header';

import OverviewDashboard from './components/overview/OverviewDashboard';
import LiveTrainMonitor from './components/monitor/LiveTrainMonitor';
import EtaPredictionsView from './components/predictions/EtaPredictionsView';
import NetworkIntelligenceView from './components/network/NetworkIntelligenceView';
import DelayAnalyticsView from './components/analytics/DelayAnalyticsView';
import TrainDetailsView from './components/details/TrainDetailsView';
import AlertsEventsView from './components/alerts/AlertsEventsView';
import LiveSimulationBar from './components/simulation/LiveSimulationBar';

import { useLiveTrainData } from './hooks/useLiveTrainData';
import { OPERATIONAL_ALERTS } from './data/mockData';
import { NavPage } from './types';

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('UI Runtime Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center text-white my-8 max-w-2xl mx-auto">
          <div className="text-3xl mb-3">⚠️</div>
          <h2 className="text-xl font-bold text-white mb-2">View Render Issue Detected</h2>
          <p className="text-sm text-slate-400 mb-6 font-mono">
            {this.state.error?.message || 'An unexpected rendering error occurred.'}
          </p>
          <button
            onClick={() => {
              this.setState({ hasError: false, error: null });
              window.location.reload();
            }}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition"
          >
            Reload Dashboard
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  const [activePage, setActivePage] = useState<NavPage>('overview');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const {
    trains,
    selectedTrain,
    selectedTrainId,
    setSelectedTrainId,
    simulationState,
    toggleEvent,
    resetSimulation,
    toastNotification
  } = useLiveTrainData();

  const criticalAlertCount = OPERATIONAL_ALERTS.filter(a => a.severity === 'critical').length;

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-slate-50 text-slate-900 flex font-sans antialiased">
        {/* 1. PERSISTENT LEFT SIDEBAR (Desktop fixed / Mobile slide drawer) */}
        <Sidebar
          activePage={activePage}
          onPageChange={setActivePage}
          criticalAlertCount={criticalAlertCount}
          mobileMenuOpen={mobileMenuOpen}
          onCloseMobile={() => setMobileMenuOpen(false)}
        />

        {/* MAIN CONTAINER (OFFSET BY SIDEBAR WIDTH W-64 ONLY ON MD+ DESKTOP SCREENS) */}
        <div className="flex-1 md:ml-64 flex flex-col min-w-0">
          {/* 2. TOP HEADER */}
          <Header
            activePage={activePage}
            trains={trains}
            selectedTrain={selectedTrain}
            onSelectTrain={setSelectedTrainId}
            onNavigateToDetails={() => setActivePage('details')}
            lastUpdated={simulationState.lastTickTimestamp}
            onToggleMobileMenu={() => setMobileMenuOpen(prev => !prev)}
          />

          {/* 3. DYNAMIC PAGE CONTENT VIEW */}
          <main className="p-3 sm:p-5 md:p-8 flex-1 max-w-7xl w-full mx-auto space-y-6">
            {activePage === 'overview' && (
              <OverviewDashboard
                trains={trains}
                selectedTrain={selectedTrain}
                onSelectTrain={setSelectedTrainId}
                onNavigatePage={setActivePage}
              />
            )}

            {activePage === 'monitor' && (
              <LiveTrainMonitor
                trains={trains}
                onSelectTrain={setSelectedTrainId}
                onNavigateToDetails={() => setActivePage('details')}
              />
            )}

            {activePage === 'predictions' && (
              <EtaPredictionsView
                trains={trains}
                selectedTrain={selectedTrain}
                onSelectTrain={setSelectedTrainId}
                onNavigateToDetails={() => setActivePage('details')}
              />
            )}

            {activePage === 'network' && <NetworkIntelligenceView />}

            {activePage === 'analytics' && <DelayAnalyticsView />}

            {activePage === 'details' && (
              <TrainDetailsView
                train={selectedTrain}
                trains={trains}
                onSelectTrain={setSelectedTrainId}
              />
            )}

            {activePage === 'alerts' && <AlertsEventsView />}
          </main>
        </div>

        {/* 4. FLOATING SIMULATION ENGINE CONTROLLER */}
        <LiveSimulationBar
          simulationState={simulationState}
          onToggleEvent={toggleEvent}
          onReset={resetSimulation}
          toastMessage={toastNotification}
        />
      </div>
    </ErrorBoundary>
  );
}
