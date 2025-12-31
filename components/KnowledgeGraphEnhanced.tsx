import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { motion } from 'framer-motion';
import { Connection, Note } from '../types';

interface KnowledgeGraphEnhancedProps {
  notes: Note[];
  connections: Connection[];
  onNoteSelect?: (noteId: string) => void;
  activeNoteId?: string;
}

const KnowledgeGraphEnhanced: React.FC<KnowledgeGraphEnhancedProps> = ({
  notes,
  connections,
  onNoteSelect,
  activeNoteId,
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    if (!svgRef.current || !containerRef.current || notes.length === 0) return;

    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;

    // Clear previous content
    d3.select(svgRef.current).selectAll('*').remove();

    // Create SVG with gradient defs
    const svg = d3
      .select(svgRef.current)
      .attr('width', width)
      .attr('height', height)
      .attr('viewBox', [0, 0, width, height]);

    // Add gradient definitions for glow effect
    const defs = svg.append('defs');

    // Glow filter
    const filter = defs
      .append('filter')
      .attr('id', 'glow')
      .attr('x', '-50%')
      .attr('y', '-50%')
      .attr('width', '200%')
      .attr('height', '200%');

    filter
      .append('feGaussianBlur')
      .attr('stdDeviation', 4)
      .attr('result', 'coloredBlur');

    filter
      .append('feMerge')
      .selectAll('feMergeNode')
      .data([0, 1])
      .enter()
      .append('feMergeNode')
      .attr('in', (d) => (d === 0 ? 'coloredBlur' : 'SourceGraphic'));

    // Gradient for nodes
    const gradient = defs
      .append('linearGradient')
      .attr('id', 'nodeGradient')
      .attr('x1', '0%')
      .attr('y1', '0%')
      .attr('x2', '100%')
      .attr('y2', '100%');

    gradient.append('stop').attr('offset', '0%').attr('stop-color', '#00d9ff');
    gradient.append('stop').attr('offset', '100%').attr('stop-color', '#0066ff');

    // Prepare data
    const nodeMap = new Map(notes.map((n) => [n.id, n]));
    const nodes = notes.map((note) => ({
      id: note.id,
      title: note.title || 'Untitled',
      fx: undefined,
      fy: undefined,
    }));

    const links = connections.map((conn) => ({
      source: conn.sourceNoteId,
      target: conn.targetNoteId,
      strength: conn.strength || 0.5,
    }));

    // Create force simulation with optimized parameters
    const simulation = d3
      .forceSimulation(nodes)
      .force(
        'link',
        d3
          .forceLink(links)
          .id((d: any) => d.id)
          .distance(100)
          .strength(0.1)
      )
      .force('charge', d3.forceManyBody().strength(-300))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(40))
      .alphaDecay(0.02)
      .velocityDecay(0.4);

    // Create link elements with gradient stroke
    const link = svg
      .selectAll('line')
      .data(links)
      .enter()
      .append('line')
      .attr('stroke', 'rgba(0, 217, 255, 0.2)')
      .attr('stroke-width', (d: any) => Math.max(1, d.strength * 3))
      .attr('stroke-dasharray', '5,5')
      .style('filter', 'url(#glow)');

    // Create node elements
    const node = svg
      .selectAll('circle')
      .data(nodes)
      .enter()
      .append('circle')
      .attr('r', 20)
      .attr('fill', (d: any) => (d.id === activeNoteId ? 'url(#nodeGradient)' : 'rgba(0, 217, 255, 0.6)'))
      .attr('stroke', (d: any) => (d.id === activeNoteId ? '#00d9ff' : 'rgba(0, 217, 255, 0.4)'))
      .attr('stroke-width', (d: any) => (d.id === activeNoteId ? 3 : 1))
      .style('filter', 'url(#glow)')
      .style('cursor', 'pointer')
      .on('click', (event: any, d: any) => {
        onNoteSelect?.(d.id);
      })
      .on('mouseover', function (event: any, d: any) {
        d3.select(this)
          .transition()
          .duration(200)
          .attr('r', 28)
          .attr('stroke-width', 2);

        // Highlight connected links
        link.style('stroke', (l: any) =>
          l.source.id === d.id || l.target.id === d.id
            ? 'rgba(0, 217, 255, 0.8)'
            : 'rgba(0, 217, 255, 0.1)'
        );

        // Dim other nodes
        node.style('opacity', (n: any) =>
          n.id === d.id || links.some((l: any) => (l.source.id === d.id && l.target.id === n.id) || (l.target.id === d.id && l.source.id === n.id))
            ? 1
            : 0.3
        );
      })
      .on('mouseout', function () {
        d3.select(this)
          .transition()
          .duration(200)
          .attr('r', 20)
          .attr('stroke-width', (d: any) => (d.id === activeNoteId ? 3 : 1));

        link.style('stroke', 'rgba(0, 217, 255, 0.2)');
        node.style('opacity', 1);
      })
      .call(
        d3.drag<any, any>()
          .on('start', (event: any, d: any) => {
            if (!event.active) simulation.alphaTarget(0.3).restart();
            d.fx = d.x;
            d.fy = d.y;
          })
          .on('drag', (event: any, d: any) => {
            d.fx = event.x;
            d.fy = event.y;
          })
          .on('end', (event: any, d: any) => {
            if (!event.active) simulation.alphaTarget(0);
            d.fx = null;
            d.fy = null;
          })
      );

    // Add labels
    const labels = svg
      .selectAll('text')
      .data(nodes)
      .enter()
      .append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '.3em')
      .attr('font-size', '12px')
      .attr('fill', '#e2e8f0')
      .attr('pointer-events', 'none')
      .attr('font-weight', (d: any) => (d.id === activeNoteId ? 'bold' : 'normal'))
      .text((d: any) => d.title.substring(0, 10));

    // Update positions on simulation tick
    simulation.on('tick', () => {
      link
        .attr('x1', (d: any) => d.source.x)
        .attr('y1', (d: any) => d.source.y)
        .attr('x2', (d: any) => d.target.x)
        .attr('y2', (d: any) => d.target.y);

      node.attr('cx', (d: any) => d.x).attr('cy', (d: any) => d.y);

      labels.attr('x', (d: any) => d.x).attr('y', (d: any) => d.y);
    });

    // Handle window resize
    const handleResize = () => {
      const newWidth = containerRef.current?.clientWidth || width;
      const newHeight = containerRef.current?.clientHeight || height;

      svg.attr('width', newWidth).attr('height', newHeight);
      simulation.force('center', d3.forceCenter(newWidth / 2, newHeight / 2));
      simulation.alpha(0.3).restart();
    };

    window.addEventListener('resize', handleResize);

    setIsInitialized(true);

    return () => {
      window.removeEventListener('resize', handleResize);
      simulation.stop();
    };
  }, [notes, connections, activeNoteId, onNoteSelect]);

  return (
    <motion.div
      ref={containerRef}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="w-full h-full bg-gradient-to-br from-dark-bg via-dark-primary to-dark-bg rounded-xl overflow-hidden relative"
    >
      <svg
        ref={svgRef}
        className="w-full h-full"
        style={{
          background: 'linear-gradient(135deg, rgba(10, 14, 39, 0.5) 0%, rgba(20, 24, 41, 0.5) 100%)',
        }}
      />

      {/* Legend */}
      <motion.div
        className="absolute bottom-4 left-4 glass-dark rounded-lg p-3 text-xs text-dark-text-secondary"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <div className="flex items-center gap-2 mb-2">
          <div className="w-3 h-3 rounded-full bg-cyan-500"></div>
          <span>Drag nodes to move</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full border border-cyan-500"></div>
          <span>Click to select</span>
        </div>
      </motion.div>

      {/* Info Panel */}
      {notes.length > 0 && (
        <motion.div
          className="absolute top-4 right-4 glass-dark rounded-lg p-3 text-xs text-dark-text-secondary"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="font-semibold text-dark-accent mb-1">Graph Stats</div>
          <div>Nodes: {notes.length}</div>
          <div>Connections: {connections.length}</div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default KnowledgeGraphEnhanced;
