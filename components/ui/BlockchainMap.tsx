"use client";

import { useEffect, useRef, useState, useCallback } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import { useBlockchainTopology } from '@/lib/hooks/useBlockchainTopology';

// Color palette by group
const NODE_COLORS: Record<number, string> = {
  1: '#f97316', // Smart Contract — orange
  2: '#6366f1', // En attente — indigo
  3: '#8b5cf6', // Maire — violet
  4: '#3b82f6', // DGDDL — blue
  5: '#10b981', // Agent Financier — emerald
  6: '#f59e0b', // Commune — amber
  7: '#64748b', // Other — slate
};

const LEGEND = [
  { color: '#f97316', label: 'Smart Contract' },
  { color: '#f59e0b', label: 'Commune' },
  { color: '#8b5cf6', label: 'Maire' },
  { color: '#10b981', label: 'Agent Financier' },
  { color: '#3b82f6', label: 'DGDDL' },
];

function nodeColor(node: any): string {
  return NODE_COLORS[node.group] ?? '#64748b';
}

function drawNode(node: any, ctx: CanvasRenderingContext2D, globalScale: number) {
  const { x, y, val = 10, label, sublabel, group } = node;
  // Guard: skip if position not yet computed by the simulation
  if (!isFinite(x) || !isFinite(y)) return;
  const radius = Math.sqrt(val) * 2.5;
  const color = NODE_COLORS[group] ?? '#64748b';

  // Glow
  const glow = ctx.createRadialGradient(x, y, radius * 0.2, x, y, radius * 1.6);
  glow.addColorStop(0, color + '55');
  glow.addColorStop(1, 'transparent');
  ctx.beginPath();
  ctx.arc(x, y, radius * 1.6, 0, 2 * Math.PI);
  ctx.fillStyle = glow;
  ctx.fill();

  // Main circle
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, 2 * Math.PI);
  ctx.fillStyle = color;
  ctx.fill();

  // White ring for contract
  if (group === 1) {
    ctx.strokeStyle = 'rgba(255,255,255,0.8)';
    ctx.lineWidth = 2 / globalScale;
    ctx.stroke();
  }

  // Labels (only when zoomed enough and label exists)
  const safeScale = isFinite(globalScale) && globalScale > 0 ? globalScale : 1;
  if (safeScale >= 0.5 && label) {
    const labelSize = Math.max(3, 5 / safeScale);
    ctx.font = `bold ${labelSize}px Inter, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const textWidth = ctx.measureText(label).width;
    ctx.fillStyle = 'rgba(15,23,42,0.85)';
    ctx.fillRect(x - textWidth / 2 - 3, y + radius + 2, textWidth + 6, labelSize + 4);

    ctx.fillStyle = '#ffffff';
    ctx.fillText(label, x, y + radius + 4 + labelSize / 2);

    if (sublabel && safeScale >= 0.7) {
      const subSize = Math.max(2.5, 3.5 / safeScale);
      ctx.font = `${subSize}px Inter, sans-serif`;
      ctx.fillStyle = 'rgba(255,255,255,0.6)';
      ctx.fillText(sublabel, x, y + radius + 4 + labelSize + subSize + 2);
    }
  }
}

export default function BlockchainMap() {
  const [dimensions, setDimensions] = useState({ width: 800, height: 480 });
  const containerRef = useRef<HTMLDivElement>(null);
  const { graphData, stats, loading, error } = useBlockchainTopology();

  useEffect(() => {
    const update = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight,
        });
      }
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  const paintNode = useCallback(
    (node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
      drawNode(node, ctx, globalScale);
    },
    []
  );

  const agentCount = graphData.nodes.filter(n => n.group === 5).length;
  const maireCount = graphData.nodes.filter(n => n.group === 3).length;
  const communeCount = graphData.nodes.filter(n => n.group === 6).length;

  return (
    <div className="space-y-3">
      {/* Stats row */}
      {!loading && stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-slate-800/60 border border-orange-500/20 rounded-xl p-3 text-center">
            <p className="text-2xl font-black text-orange-400">1</p>
            <p className="text-xs text-slate-400 mt-1">Smart Contract</p>
          </div>
          <div className="bg-slate-800/60 border border-amber-500/20 rounded-xl p-3 text-center">
            <p className="text-2xl font-black text-amber-400">{communeCount}</p>
            <p className="text-xs text-slate-400 mt-1">Commune{communeCount > 1 ? 's' : ''}</p>
          </div>
          <div className="bg-slate-800/60 border border-violet-500/20 rounded-xl p-3 text-center">
            <p className="text-2xl font-black text-violet-400">{maireCount}</p>
            <p className="text-xs text-slate-400 mt-1">Maire{maireCount > 1 ? 's' : ''}</p>
          </div>
          <div className="bg-slate-800/60 border border-emerald-500/20 rounded-xl p-3 text-center">
            <p className="text-2xl font-black text-emerald-400">{agentCount}</p>
            <p className="text-xs text-slate-400 mt-1">Agent{agentCount > 1 ? 's' : ''} Financier{agentCount > 1 ? 's' : ''}</p>
          </div>
        </div>
      )}

      {/* Graph container */}
      <div ref={containerRef} className="w-full h-[480px] bg-slate-900 rounded-3xl overflow-hidden relative border border-slate-700/50">

        {/* Loading */}
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-20">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-white/20 border-t-orange-400 rounded-full animate-spin mx-auto mb-4" />
              <p className="text-white font-bold">Chargement du réseau...</p>
              <p className="text-white/50 text-xs mt-1">Connexion à Polygon Amoy</p>
            </div>
          </div>
        )}

        {/* Legend */}
        <div className="absolute top-4 left-4 z-10 flex flex-col gap-1.5 pointer-events-none">
          {LEGEND.map(({ color, label }) => (
            <div key={label} className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
              <span className="text-xs text-slate-300 font-medium">{label}</span>
            </div>
          ))}
        </div>

        {/* Stats badge top-right */}
        {!loading && stats && (
          <div className="absolute top-4 right-4 z-10 bg-black/50 backdrop-blur-sm rounded-xl px-3 py-2 text-xs text-white/70 text-right">
            <p className="font-bold text-white">{stats.totalTransactions} tx validée{stats.totalTransactions > 1 ? 's' : ''}</p>
            <p>Bloc #{stats.blockNumber !== 'N/A' ? Number(stats.blockNumber).toLocaleString('fr-FR') : 'N/A'}</p>
            <p className="text-white/40">Polygon Amoy</p>
          </div>
        )}

        {/* RPC warning */}
        {error && !loading && (
          <div className="absolute bottom-4 left-4 right-4 bg-amber-500/15 border border-amber-500/30 rounded-xl p-3 text-xs z-10">
            <p className="font-bold text-amber-300">Connexion RPC limitée</p>
            <p className="text-amber-200/70 mt-0.5">Les données sont chargées depuis la base KOMOE. Les transactions restent valides sur la blockchain.</p>
          </div>
        )}

        {/* Force graph */}
        {typeof window !== 'undefined' && !loading && (
          <ForceGraph2D
            width={dimensions.width}
            height={dimensions.height}
            graphData={graphData}
            nodeCanvasObject={paintNode}
            nodeCanvasObjectMode={() => 'replace'}
            nodeColor={nodeColor}
            nodeLabel={(node: any) => node.description || node.label || node.id}
            linkColor={(link: any) =>
              link.type === 'blockchain'
                ? 'rgba(249,115,22,0.4)'
                : link.type === 'institutional'
                ? 'rgba(245,158,11,0.3)'
                : 'rgba(255,255,255,0.15)'
            }
            linkWidth={(link: any) => (link.type === 'blockchain' ? 2 : 1)}
            linkDirectionalArrowLength={(link: any) => (link.type === 'blockchain' ? 5 : 0)}
            linkDirectionalArrowRelPos={1}
            linkDirectionalParticles={(link: any) => (link.type === 'blockchain' ? 2 : 0)}
            linkDirectionalParticleSpeed={0.004}
            linkDirectionalParticleColor={(link: any) => 'rgba(249,115,22,0.8)'}
            backgroundColor="#0f172a"
            d3AlphaDecay={0.015}
            d3VelocityDecay={0.25}
            cooldownTicks={120}
          />
        )}
      </div>
    </div>
  );
}
