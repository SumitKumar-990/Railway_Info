import React, { useState } from 'react';
import { API_ENDPOINTS } from '../../data/mockData';
import { ApiEndpoint } from '../../types';
import { Code2, Play, Copy, Check, Terminal, FileCode, Layers } from 'lucide-react';

export default function ApiPlaygroundView() {
  const [selectedEndpointId, setSelectedEndpointId] = useState<string>('api-1');
  const [trainIdParam, setTrainIdParam] = useState<string>('12301');
  const [codeLang, setCodeLang] = useState<'curl' | 'js' | 'python'>('curl');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [activeResponse, setActiveResponse] = useState<object | null>(API_ENDPOINTS[0].sampleResponseBody);
  const [copied, setCopied] = useState<boolean>(false);

  const selectedEndpoint = API_ENDPOINTS.find(e => e.id === selectedEndpointId) || API_ENDPOINTS[0];

  const handleExecuteApi = () => {
    setIsLoading(true);
    setTimeout(() => {
      // Dynamic simulated JSON payload
      if (selectedEndpoint.id === 'api-1') {
        setActiveResponse({
          ...selectedEndpoint.sampleResponseBody,
          train_id: trainIdParam,
          prediction_updated_at: new Date().toISOString()
        });
      } else {
        setActiveResponse(selectedEndpoint.sampleResponseBody);
      }
      setIsLoading(false);
    }, 400);
  };

  const handleCopyCode = () => {
    let snippet = '';
    if (codeLang === 'curl') {
      snippet = `curl -X GET "https://api.railvue.ir.gov.in/v1/trains/${trainIdParam}/eta" \\
  -H "Authorization: Bearer rv_live_key_993821" \\
  -H "Accept: application/json"`;
    } else if (codeLang === 'js') {
      snippet = `const response = await fetch('https://api.railvue.ir.gov.in/v1/trains/${trainIdParam}/eta', {
  headers: {
    'Authorization': 'Bearer rv_live_key_993821',
    'Accept': 'application/json'
  }
});
const data = await response.json();
console.log(data);`;
    } else {
      snippet = `import requests

url = "https://api.railvue.ir.gov.in/v1/trains/${trainIdParam}/eta"
headers = {"Authorization": "Bearer rv_live_key_993821"}

response = requests.get(url, headers=headers)
print(response.json())`;
    }

    navigator.clipboard.writeText(snippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 border border-slate-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-bold font-mono uppercase tracking-wider mb-2">
            <Code2 className="w-3.5 h-3.5" />
            <span>Developer Integration Portal</span>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight font-heading">
            RailVue AI API Sandbox & Playground
          </h1>
          <p className="text-slate-300 text-sm mt-1 max-w-2xl">
            Test backend REST endpoints, inspect JSON ETA payload structures, and integrate AI predictions into external systems.
          </p>
        </div>
      </div>

      {/* MAIN PLAYGROUND LAYOUT (2 Columns) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Endpoint Config & Params (5 Cols) */}
        <div className="lg:col-span-5 space-y-5">
          {/* Endpoint Picker */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">
              Select Endpoint
            </label>
            <div className="space-y-2">
              {API_ENDPOINTS.map(ep => (
                <button
                  key={ep.id}
                  onClick={() => {
                    setSelectedEndpointId(ep.id);
                    setActiveResponse(ep.sampleResponseBody);
                  }}
                  className={`w-full text-left p-3 rounded-xl border text-xs font-medium transition ${
                    selectedEndpointId === ep.id
                      ? 'bg-blue-50 border-blue-500 text-blue-900 shadow-xs ring-1 ring-blue-500/20'
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="bg-emerald-600 text-white font-mono font-bold text-[10px] px-1.5 py-0.5 rounded">
                      {ep.method}
                    </span>
                    <span className="font-mono font-bold text-slate-900">{ep.path}</span>
                  </div>
                  <p className="text-[11px] text-slate-500 line-clamp-1">{ep.description}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Parameters Form */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 font-heading border-b border-slate-100 pb-2">
              Request Parameters
            </h3>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                trainId <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={trainIdParam}
                onChange={e => setTrainIdParam(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 text-xs font-mono font-bold text-slate-900 px-3 py-2 rounded-lg outline-none focus:border-blue-500"
              />
              <p className="text-[10px] text-slate-400 mt-1">Unique 5-digit Indian Railways train number</p>
            </div>

            {/* Action Execute Button */}
            <button
              onClick={handleExecuteApi}
              disabled={isLoading}
              className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20 transition cursor-pointer"
            >
              {isLoading ? (
                <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></span>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-current" />
                  <span>Execute "Try API" Simulation</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Column: Code Snippets & Response Output (7 Cols) */}
        <div className="lg:col-span-7 space-y-5">
          {/* Code Snippet Card */}
          <div className="bg-slate-900 rounded-xl border border-slate-800 text-white overflow-hidden shadow-md">
            <div className="p-3 border-b border-slate-800 bg-slate-950 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-cyan-400" />
                <span className="text-xs font-bold font-mono text-slate-300">Request Snippet</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex bg-slate-800 p-0.5 rounded-md text-[10px] font-mono">
                  <button
                    onClick={() => setCodeLang('curl')}
                    className={`px-2 py-0.5 rounded ${codeLang === 'curl' ? 'bg-blue-600 text-white font-bold' : 'text-slate-400'}`}
                  >
                    cURL
                  </button>
                  <button
                    onClick={() => setCodeLang('js')}
                    className={`px-2 py-0.5 rounded ${codeLang === 'js' ? 'bg-blue-600 text-white font-bold' : 'text-slate-400'}`}
                  >
                    JavaScript
                  </button>
                  <button
                    onClick={() => setCodeLang('python')}
                    className={`px-2 py-0.5 rounded ${codeLang === 'python' ? 'bg-blue-600 text-white font-bold' : 'text-slate-400'}`}
                  >
                    Python
                  </button>
                </div>
                <button
                  onClick={handleCopyCode}
                  className="p-1 rounded text-slate-400 hover:text-white transition"
                  title="Copy snippet"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <pre className="p-4 text-xs font-mono text-cyan-300 overflow-x-auto">
              {codeLang === 'curl' && `curl -X GET "https://api.railvue.ir.gov.in/v1/trains/${trainIdParam}/eta" \\
  -H "Authorization: Bearer rv_live_key_993821" \\
  -H "Accept: application/json"`}
              {codeLang === 'js' && `const response = await fetch('https://api.railvue.ir.gov.in/v1/trains/${trainIdParam}/eta', {
  headers: {
    'Authorization': 'Bearer rv_live_key_993821',
    'Accept': 'application/json'
  }
});
const data = await response.json();`}
              {codeLang === 'python' && `import requests
url = "https://api.railvue.ir.gov.in/v1/trains/${trainIdParam}/eta"
headers = {"Authorization": "Bearer rv_live_key_993821"}
response = requests.get(url, headers=headers)
print(response.json())`}
            </pre>
          </div>

          {/* JSON Response Viewer */}
          <div className="bg-slate-950 rounded-xl border border-slate-800 text-white overflow-hidden shadow-lg">
            <div className="p-3 border-b border-slate-800 bg-slate-900/80 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
                <span className="text-xs font-bold font-mono text-emerald-400">200 OK Response</span>
              </div>
              <span className="text-[10px] font-mono text-slate-400">Content-Type: application/json</span>
            </div>

            <pre className="p-4 text-xs font-mono text-emerald-300 overflow-x-auto max-h-[380px]">
              {JSON.stringify(activeResponse, null, 2)}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
