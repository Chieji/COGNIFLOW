/**
 * Unified Knowledge Graph Component
 * 
 * Merges functionality from KnowledgeGraph, KnowledgeGraphEnhanced, and KnowledgeGraphOptimized.
 * - Optimized simulation stability
 * - Enhanced visuals (gradients, glow effects)
 * - Error boundary protection
 * - Performance monitoring
 */

import React, { useRef, useState, useEffect, useMemo, useCallback } from 'react';
import * as d3 from 'd3';
import { Note, Connection, View, AiSettings } from '../types';
import { findConnections } from '../services/geminiService';
import Spinner from './Spinner';
import { SparklesIcon } from './icons';

interface KnowledgeGraphProps {
  notes: Note[];
  connections: Connection[];
  setConnections: (connections: Connection[]) => void;
  settings: AiSettings;
  setActiveNoteId: (id: string) => void;
  setView: (view: View) => void;
}

interface GraphNode extends d3.SimulationNodeDatum {
  id: string;
  title: string;
}

interface GraphLink extends d3.SimulationLinkDatum<GraphNode> {
  source: string | GraphNode;
  target: string | GraphNode;
  strength?: number;
}

const DEFAULT_SIMULATION_CONFIG = {
  maxIterations: 300,
  decayFactor: 0.95,
  alphaTarget: 0,
  alphaDecay: 0.0228,
};

class SVGErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean; error: Error | null }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error: Error) { return { hasError: true, error }; }
  render() {
    if (this.state.hasError) return <div className="text-red-500 text-center p-4">Graph rendering error: {this.state.error?.message}</div>;
    return this.props.children;
  }
}

const KnowledgeGraph: React.FC<KnowledgeGraphProps> = ({ notes, connections, setConnections, settings, setActiveNoteId, setView }) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const simulationRef = useRef<d3.Simulation<GraphNode, GraphLink> | null>(null);
  const iterationCountRef = useRef(0);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const graphData = useMemo(() => {
    const nodes: GraphNode[] = notes.map(note => ({ id: note.id, title: note.title }));
    const links: GraphLink[] = connections.map(conn => ({
      source: conn.source,
      target: conn.target,
      strength: 0.5
    }));
    return { nodes, links };
  }, [notes, connections]);

  const handleDiscover = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      if (!settings.keys.gemini) throw new Error("API key for Gemini is not configured.");

      const newConnections = await findConnections(notes, settings.keys.gemini);
      const existingConnectionSet = new Set(connections.map(c => `${c.source}-${c.target}`));
      const uniqueNewConnections = newConnections.filter(c => {
        const forward = `${c.source}-${c.target}`;
        const backward = `${c.target}-${c.source}`;
        return !existingConnectionSet.has(forward) && !existingConnectionSet.has(backward);
      });

      setConnections([...connections, ...uniqueNewConnections]);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
    }
  }, [notes, connections, settings.keys.gemini, setConnections]);

  useEffect(() => {
    if (!svgRef.current || !containerRef.current || graphData.nodes.length === 0) return;

    const { width, height } = containerRef.current.getBoundingClientRect();
    const svg = d3.select(svgRef.current)
      .attr('width', width)
      .attr('height', height)
      .attr('viewBox', [0, 0, width, height]);

    svg.selectAll('*').remove();

    // Define gradients and filters
    const defs = svg.append('defs');
    const filter = defs.append('filter').attr('id', 'glow').attr('x', '-50%').attr('y', '-50%').attr('width', '200%').attr('height', '200%');
    filter.append('feGaussianBlur').attr('stdDeviation', 4).attr('result', 'coloredBlur');
    filter.append('feMerge').selectAll('feMergeNode').data([0, 1]).enter().append('feMergeNode').attr('in', d => d === 0 ? 'coloredBlur' : 'SourceGraphic');

    const gradient = defs.append('linearGradient').attr('id', 'nodeGradient').attr('x1', '0%').attr('y1', '0%').attr('x2', '100%').attr('y2', '100%');
    gradient.append('stop').attr('offset', '0%').attr('stop-color', '#00d9ff');
    gradient.append('stop').attr('offset', '100%').attr('stop-color', '#0066ff');

    const simulation = d3.forceSimulation<GraphNode>(graphData.nodes)
      .force('link', d3.forceLink<GraphNode, GraphLink>(graphData.links).id(d => d.id).distance(100))
      .force('charge', d3.forceManyBody().strength(-300))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(40))
      .alphaDecay(DEFAULT_SIMULATION_CONFIG.alphaDecay)
      .alphaTarget(DEFAULT_SIMULATION_CONFIG.alphaTarget);

    simulationRef.current = simulation;
    iterationCountRef.current = 0;

    const drag = (sim: d3.Simulation<GraphNode, undefined>) => {
      return d3.drag<SVGGElement, GraphNode>()
        .on('start', (event) => {
          if (!event.active) sim.alphaTarget(0.3).restart();
          event.subject.fx = event.subject.x;
          event.subject.fy = event.subject.y;
        })
        .on('drag', (event) => {
          event.subject.fx = event.x;
          event.subject.fy = event.y;
        })
        .on('end', (event) => {
          if (!event.active) sim.alphaTarget(0);
          event.subject.fx = null;
          event.subject.fy = null;
        });
    };

    const link = svg.append('g')
      .selectAll('line')
      .data(graphData.links)
      .enter().append('line')
      .attr('stroke', 'rgba(0, 217, 255, 0.2)')
      .attr('stroke-width', d => Math.max(1, (d.strength || 0.5) * 3))
      .style('filter', 'url(#glow)');

    const node = svg.append('g')
      .selectAll('g')
      .data(graphData.nodes)
      .enter().append('g')
      .attr('class', 'cursor-pointer')
      .call(drag(simulation) as any)
      .on('click', (_, d) => {
        setActiveNoteId(d.id);
        setView(View.Notes);
      })
      .on('mouseover', function () {
        d3.select(this).select('circle')
          .transition().duration(200)
          .attr('r', 28)
          .attr('stroke-width', 2);
      })
      .on('mouseout', function () {
        d3.select(this).select('circle')
          .transition().duration(200)
          .attr('r', 20)
          .attr('stroke-width', 1);
      });

    node.append('circle')
      .attr('r', 20)
      .attr('fill', 'url(#nodeGradient)')
      .attr('stroke', '#00d9ff')
      .attr('stroke-width', 1)
      .style('filter', 'url(#glow)');

    node.append('text')
      .text(d => d.title)
      .attr('text-anchor', 'middle')
      .attr('dy', '.3em')
      .attr('font-size', '12px')
      .attr('fill', '#e2e8f0')
      .attr('pointer-events', 'none')
      .attr('class', 'select-none');

    simulation.on('tick', () => {
      iterationCountRef.current++;
      if (iterationCountRef.current >= DEFAULT_SIMULATION_CONFIG.maxIterations) simulation.stop();

      link
        .attr('x1', d => (d.source as any).x)
        .attr('y1', d => (d.source as any).y)
        .attr('x2', d => (d.target as any).x)
        .attr('y2', d => (d.target as any).y);
      node.attr('transform', d => `translate(${d.x},${d.y})`);
    });

    return () => {
      simulation.stop();
    };

  }, [graphData, setActiveNoteId, setView]);

  return (
    <SVGErrorBoundary>
      <div className="p-6 md:p-8 flex-1 flex flex-col h-full">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Knowledge Graph</h2>
          <button
            onClick={handleDiscover}
            disabled={isLoading}
            className="flex items-center px-4 py-2 bg-light-accent text-white rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? <Spinner /> : <SparklesIcon className="w-5 h-5 mr-2" />}
            {isLoading ? "Discovering..." : "Discover Connections"}
          </button>
        </div>
        {error && <p className="text-sm text-red-500 mb-2">{error}</p>}
        <div ref={containerRef} className="flex-1 w-full h-full bg-gradient-to-br from-dark-bg via-dark-primary to-dark-bg rounded-xl overflow-hidden relative border border-light-primary dark:border-dark-primary">
          <svg ref={svgRef} className="w-full h-full" style={{ background: 'linear-gradient(135deg, rgba(10, 14, 39, 0.5) 0%, rgba(20, 24, 41, 0.5) 100%)' }}></svg>
        </div>
      </div>
    </SVGErrorBoundary>
  );
};

export default KnowledgeGraph;
