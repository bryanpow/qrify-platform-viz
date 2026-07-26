import { motion } from 'framer-motion'
import type { FlowDef, FlowNode, FlowStep } from '../data/flows'

const KIND_COLOR: Record<FlowNode['kind'], string> = {
  edge: '#8b9bb0',
  aws: '#6ec8d9',
  cluster: '#5ddea8',
  data: '#f4b45c',
  ci: '#9bb7ff',
  obs: '#ff9d7a',
  app: '#e8eef6',
}

function nodeBox(n: FlowNode) {
  const w = n.w ?? 130
  const h = n.h ?? 58
  return { w, h, cx: n.x + w / 2, cy: n.y + h / 2 }
}

function edgePath(from: FlowNode, to: FlowNode) {
  const a = nodeBox(from)
  const b = nodeBox(to)
  const x1 = a.cx
  const y1 = a.cy
  const x2 = b.cx
  const y2 = b.cy
  const dx = Math.abs(x2 - x1)
  const c1x = x1 + dx * 0.4
  const c2x = x2 - dx * 0.4
  return `M ${x1} ${y1} C ${c1x} ${y1}, ${c2x} ${y2}, ${x2} ${y2}`
}

type Props = {
  flow: FlowDef
  step: FlowStep
  playing: boolean
}

export function Schematic({ flow, step, playing }: Props) {
  const activeNodeSet = new Set(step.activeNodes)
  const activeEdgeSet = new Set(step.activeEdges)
  const anyActive = step.activeNodes.length > 0 || step.activeEdges.length > 0

  return (
    <svg className="schematic" viewBox="0 0 1020 400" preserveAspectRatio="xMidYMid meet">
      <defs>
        <filter id="softGlow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {flow.edges.map((e, i) => {
        const from = flow.nodes.find((n) => n.id === e.from)!
        const to = flow.nodes.find((n) => n.id === e.to)!
        const d = edgePath(from, to)
        const active = activeEdgeSet.has(i)
        const dim = anyActive && !active
        return (
          <g key={`${e.from}-${e.to}-${i}`}>
            <path
              d={d}
              className={`edge-path${active ? ' active' : ''}${dim ? ' dim' : ''}`}
              id={`edge-${flow.id}-${i}`}
            />
            {e.label && (
              <text className="edge-label" dy="-6">
                <textPath href={`#edge-${flow.id}-${i}`} startOffset="50%" textAnchor="middle">
                  {e.label}
                </textPath>
              </text>
            )}
            {active && playing && (
              <>
                <circle r="4.5" className="packet" filter="url(#softGlow)">
                  <animateMotion dur="1.6s" repeatCount="indefinite" path={d} />
                </circle>
                <circle r="3" className="packet" opacity="0.55">
                  <animateMotion dur="1.6s" begin="0.55s" repeatCount="indefinite" path={d} />
                </circle>
              </>
            )}
          </g>
        )
      })}

      {flow.nodes.map((n) => {
        const { w, h } = nodeBox(n)
        const active = activeNodeSet.has(n.id)
        const dim = anyActive && !active
        const accent = KIND_COLOR[n.kind]
        return (
          <motion.g
            key={n.id}
            initial={false}
            animate={{ scale: active ? 1.04 : 1 }}
            transition={{ type: 'spring', stiffness: 320, damping: 22 }}
            style={{ transformOrigin: `${n.x + w / 2}px ${n.y + h / 2}px` }}
          >
            <rect
              x={n.x}
              y={n.y}
              width={w}
              height={h}
              rx={10}
              className={`node-rect${active ? ' active' : ''}${dim ? ' dim' : ''}`}
            />
            <rect
              x={n.x}
              y={n.y}
              width={4}
              height={h}
              rx={2}
              fill={accent}
              opacity={active ? 1 : 0.55}
            />
            <text className="node-kind" x={n.x + 14} y={n.y + 16}>
              {n.kind}
            </text>
            <text className="node-label" x={n.x + 14} y={n.y + 34}>
              {n.label}
            </text>
            {n.sub && (
              <text className="node-sub" x={n.x + 14} y={n.y + 48}>
                {n.sub}
              </text>
            )}
          </motion.g>
        )
      })}
    </svg>
  )
}
