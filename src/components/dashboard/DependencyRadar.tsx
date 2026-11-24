import { useMemo } from 'react';
import ReactFlow, { 
  Background, 
  Controls, 
  Node, 
  Edge, 
  MarkerType,
  Handle,
  Position
} from 'reactflow';
import 'reactflow/dist/style.css';
import { ScanResult } from '../../types';

interface DependencyRadarProps {
  results: ScanResult[];
}

const PackageNode = ({ data }: { data: any }) => {
  const getRiskStyles = (risk: string) => {
    switch (risk) {
      case 'Critical': return 'border-red-600 bg-red-600 text-white';
      case 'High': return 'border-red-500 border-2 bg-white text-red-700 font-bold';
      case 'Medium': return 'border-orange-500 border-dashed bg-white text-orange-700';
      case 'Low': return 'border-green-500 bg-white text-green-700';
      default: return 'border-gray-400 bg-white text-gray-600';
    }
  };

  return (
    <div className={`px-4 py-2 font-mono text-xs uppercase tracking-wider min-w-[150px] text-center transition-all ${getRiskStyles(data.risk)}`}>
      <Handle type="target" position={Position.Top} className="opacity-0" />
      <div className="font-bold truncate">{data.label}</div>
      {data.version && <div className="text-[9px] mt-1 opacity-70">v{data.version}</div>}
      <div className="text-[9px] mt-1 opacity-70">{data.risk}</div>
      <Handle type="source" position={Position.Bottom} className="opacity-0" />
    </div>
  );
};

export default function DependencyRadar({ results }: DependencyRadarProps) {
  const nodeTypes = useMemo(() => ({ package: PackageNode }), []);

  const { nodes, edges } = useMemo(() => {
    const initialNodes: Node[] = [
      {
        id: 'root',
        type: 'default',
        data: { label: 'PROJECT_ROOT' },
        position: { x: 0, y: 0 },
        style: { 
          background: '#000', 
          color: '#fff', 
          border: '2px solid #000', 
          fontFamily: 'monospace', 
          fontWeight: 'bold', 
          padding: '12px 24px',
          textTransform: 'uppercase',
          letterSpacing: '1px',
          borderRadius: '0px'
        }
      }
    ];

    const initialEdges: Edge[] = [];
    const radius = Math.max(350, results.length * 40);
    const angleStep = (2 * Math.PI) / Math.max(results.length, 1);

    results.forEach((pkg, index) => {
      const angle = index * angleStep;
      const x = radius * Math.cos(angle);
      const y = radius * Math.sin(angle);

      initialNodes.push({
        id: `${pkg.name}@${pkg.resolvedVersion ?? pkg.versionRange}`,
        type: 'package',
        position: { x, y },
        data: { label: pkg.name, version: pkg.resolvedVersion, risk: pkg.riskLabel },
      });

      const edgeColor = pkg.riskLabel === 'Critical' ? '#dc2626' : 
                        pkg.riskLabel === 'High' ? '#ef4444' : 
                        pkg.riskLabel === 'Medium' ? '#f97316' : 
                        pkg.riskLabel === 'Low' ? '#22c55e' : '#9ca3af';

      initialEdges.push({
        id: `edge-${pkg.name}@${pkg.resolvedVersion ?? pkg.versionRange}`,
        source: 'root',
        target: `${pkg.name}@${pkg.resolvedVersion ?? pkg.versionRange}`,
        animated: pkg.riskLabel === 'Critical',
        style: { stroke: edgeColor, strokeWidth: pkg.riskLabel === 'Critical' || pkg.riskLabel === 'High' ? 2 : 1 },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: edgeColor,
        },
      });
    });

    return { nodes: initialNodes, edges: initialEdges };
  }, [results]);

  return (
    <div className="w-full h-full relative">
      <div className="absolute top-4 left-4 z-10 font-mono text-xs uppercase tracking-widest font-bold bg-[#f4f4f4] p-2 border border-black/20">
        Dependency_Radar_Active
      </div>
      <ReactFlow 
        nodes={nodes} 
        edges={edges} 
        nodeTypes={nodeTypes}
        fitView
        className="bg-transparent"
        minZoom={0.2}
      >
        <Background color="#000" gap={20} size={1} />
        <Controls className="bg-white border border-black/20 fill-black shadow-none" />
      </ReactFlow>
    </div>
  );
}