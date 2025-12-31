/**
 * Optimized Knowledge Graph Component
 * 
 * Improvements:
 * - Simulation timeout and decay limits for long-term stability
 * - Error boundary for SVG rendering
 * - Pause simulation when tab is inactive
 * - Memory-efficient node/link rendering
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
}

interface SimulationConfig {
  maxIterations: number;
  decayFactor: number;
  alphaTarget: number;
  alphaDecay: number;
}

const DEFAULT_SIMULATION_CONFIG: SimulationConfig = {
  maxIterations: 300,
  decayFactor: 0.95,
  alphaTarget: 0,
  alphaDecay: 0.0228,
};

/**
 * Error Boundary Component for SVG Rendering
 */
class SVGErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error) {
    console.error('SVG Rendering Error:', error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center h-full bg-red-500/10 border border-red-500/30 rounded-lg">
          <div className="text-center">
            <p className="text-red-400 font-semibold">SVG Rendering Error</p>
            <p className="text-sm text-red-300 mt-1">{this.state.error?.message}</p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

const KnowledgeGraphOptimized: React.FC<KnowledgeGraphProps> = ({
  notes,
  connections,
  setConnections,
  settings,
  setActiveNoteId,
  setView,
}) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const simulationRef = useRef<d3.Simulation<GraphNode, GraphLink> | null>(null);
  const iterationCountRef = useRef(0);
  const isTabActiveRef = useRef(true);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [performanceMetrics, setPerformanceMetrics] = useState({
    nodeCount: 0,
    linkCount: 0,
    fps: 0,
    simulationTime: 0,
  });

  const graphData = useMemo(() => {
    const nodes: GraphNode[] = notes.map((note) => ({ id: note.id, title: note.title }));
    const links: GraphLink[] = connections.map((conn) => ({ source: conn.source, target: conn.target }));
    return { nodes, links };
  }, [notes, connections]);

  /**
   * Monitor tab visibility to pause/resume simulation
   */
  useEffect(() => {
    const handleVisibilityChange = () => {
      isTabActiveRef.current = !document.hidden;
      if (simulationRef.current) {
        if (isTabActiveRef.current) {
          simulationRef.current.alpha(0.3).restart();
        } else {
          simulationRef.current.stop();
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  /**
   * Handle discovery of new connections
   */
  const handleDiscover = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      if (!settings.keys.gemini) {
        throw new Error('API key for Gemini is not configured. Please set it in Settings.');
      }

      const newConnections = await findConnections(notes, settings.keys.gemini);

      // Merge connections, avoiding duplicates
      const existingConnectionSet = new Set(connections.map((c) => `${c.source}-${c.target}`));
      const uniqueNewConnections = newConnections.filter((c) => {
        const forward = `${c.source}-${c.target}`;
        const backward = `${c.target}-${c.source}`;
        return !existingConnectionSet.has(forward) && !existingConnectionSet.has(backward);
      });

      setConnections([...connections, ...uniqueNewConnections]);
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred.';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [notes, connections, settings.keys.gemini, setConnections]);

  /**
   * Initialize and render the D3 force-directed graph
   */
  useEffect(() => {
    if (!svgRef.current || !containerRef.current || graphData.nodes.length === 0) return;

    const { width, height } = containerRef.current.getBoundingClientRect();
    const svg = d3.select(svgRef.current).attr('width', width).attr('height', height);
    svg.selectAll('*').remove();

    // Create simulation with performance constraints
    const simulation = d3
      .forceSimulation<GraphNode>(graphData.nodes)
      .force(
        'link',
        d3
          .forceLink<GraphNode, GraphLink>(graphData.links)
          .id((d) => d.id)
          .distance(100)
      )
      .force('charge', d3.forceManyBody().strength(-300))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .alphaDecay(DEFAULT_SIMULATION_CONFIG.alphaDecay)
      .alphaTarget(DEFAULT_SIMULATION_CONFIG.alphaTarget);

    simulationRef.current = simulation;
    iterationCountRef.current = 0;

    // Drag behavior
    const drag = (sim: d3.Simulation<GraphNode, undefined>) => {
      function dragstarted(event: d3.D3DragEvent<SVGGElement, GraphNode, GraphNode>) {
        if (!event.active) sim.alphaTarget(0.3).restart();
        event.subject.fx = event.subject.x;
        event.subject.fy = event.subject.y;
      }

      function dragged(event: d3.D3DragEvent<SVGGElement, GraphNode, GraphNode>) {
        event.subject.fx = event.x;
        event.subject.fy = event.y;
      }

      function dragended(event: d3.D3DragEvent<SVGGElement, GraphNode, GraphNode>) {
        if (!event.active) sim.alphaTarget(0);
        event.subject.fx = null;
        event.subject.fy = null;
      }

      return d3.drag<SVGGElement, GraphNode>().on('start', dragstarted).on('drag', dragged).on('end', dragended);
    };

    // Render links
    const link = svg
      .append('g')
      .selectAll('line')
      .data(graphData.links)
      .enter()
      .append('line')
      .attr('class', 'stroke-gray-400 dark:stroke-gray-600')
      .attr('stroke-width', 1.5);

    // Render nodes
    const node = svg
      .append('g')
      .selectAll('g')
      .data(graphData.nodes)
      .enter()
      .append('g')
      .attr('class', 'cursor-pointer')
      .call(drag(simulation) as any)
      .on('click', (event, d) => {
        setActiveNoteId(d.id);
        setView(View.Notes);
      });

    node
      .append('circle')
      .attr('r', 10)
      .attr('class', 'fill-light-accent stroke-light-surface dark:stroke-dark-surface')
      .attr('stroke-width', 2);

    node
      .append('text')
      .text((d) => d.title)
      .attr('x', 15)
      .attr('y', 5)
      .attr('class', 'fill-light-text dark:fill-dark-text text-sm select-none');

    // Performance monitoring
    let lastFrameTime = performance.now();
    let frameCount = 0;

    // Simulation tick with iteration limit
    simulation.on('tick', () => {
      iterationCountRef.current++;

      // Stop simulation after max iterations
      if (iterationCountRef.current >= DEFAULT_SIMULATION_CONFIG.maxIterations) {
        simulation.stop();
      }

      // Update link positions
      link
        .attr('x1', (d) => (d.source as any).x)
        .attr('y1', (d) => (d.source as any).y)
        .attr('x2', (d) => (d.target as any).x)
        .attr('y2', (d) => (d.target as any).y);

      // Update node positions
      node.attr('transform', (d) => `translate(${d.x},${d.y})`);

      // Calculate FPS
      frameCount++;
      const now = performance.now();
      if (now - lastFrameTime >= 1000) {
        setPerformanceMetrics({
          nodeCount: graphData.nodes.length,
          linkCount: graphData.links.length,
          fps: frameCount,
          simulationTime: iterationCountRef.current,
        });
        frameCount = 0;
        lastFrameTime = now;
      }
    });

    // Cleanup
    return () => {
      simulation.stop();
    };
  }, [graphData, setActiveNoteId, setView]);

  return (
    <div className="p-6 md:p-8 flex-1 flex flex-col h-full">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Knowledge Graph</h2>
        <button
          onClick={handleDiscover}
          disabled={isLoading}
          className="flex items-center px-4 py-2 bg-light-accent text-white rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? <Spinner /> : <SparklesIcon className="w-5 h-5 mr-2" />}
          {isLoading ? 'Discovering...' : 'Discover Connections'}
        </button>
      </div>

      {/* Performance Metrics */}
      <div className="mb-4 text-xs text-gray-500 flex gap-4">
        <span>Nodes: {performanceMetrics.nodeCount}</span>
        <span>Links: {performanceMetrics.linkCount}</span>
        <span>FPS: {performanceMetrics.fps}</span>
        <span>Iterations: {performanceMetrics.simulationTime}</span>
      </div>

      {error && <p className="text-sm text-red-500 mb-2">{error}</p>}

      <SVGErrorBoundary>
        <div
          ref={containerRef}
          className="flex-1 w-full h-full border border-light-primary dark:border-dark-primary rounded-lg overflow-hidden"
        >
          <svg ref={svgRef}></svg>
        </div>
      </SVGErrorBoundary>
    </div>
  );
};

export default KnowledgeGraphOptimized;
