import { createHash } from "node:crypto";
import type {
  DependencyGraphNode,
  DispatchNodeStatus,
  Priority,
  SchedulePlan,
  SchedulePlanNode,
  SchedulePlanWave,
  ScheduleWave,
  ScheduledNode,
} from "./types";

const PRIORITY_RANK: Record<Priority, number> = { P0: 0, P1: 1, P2: 2, P3: 3 };

const sortNodeIds = (
  leftId: string,
  rightId: string,
  byId: Map<string, DependencyGraphNode>,
): number => {
  const left = byId.get(leftId);
  const right = byId.get(rightId);
  if (!left || !right) return leftId.localeCompare(rightId);
  const byPriority =
    PRIORITY_RANK[left.priority] - PRIORITY_RANK[right.priority];
  return byPriority !== 0 ? byPriority : left.id.localeCompare(right.id);
};

export class WaveScheduler {
  createPlan(nodes: DependencyGraphNode[]): SchedulePlan {
    const byId = new Map(nodes.map((node) => [node.id, node] as const));
    const inDegree = new Map<string, number>();
    const dependents = new Map<string, string[]>();

    for (const node of nodes) {
      inDegree.set(node.id, node.dependsOn.length);
      for (const parentId of node.dependsOn) {
        const children = dependents.get(parentId) ?? [];
        children.push(node.id);
        dependents.set(parentId, children);
      }
    }

    const waves: SchedulePlanWave[] = [];
    const waveIndexByNodeId = new Map<string, number>();
    let frontier = nodes
      .filter((node) => (inDegree.get(node.id) ?? 0) === 0)
      .map((node) => node.id)
      .sort((l, r) => sortNodeIds(l, r, byId));
    let waveIndex = 0;
    let assigned = 0;

    while (frontier.length > 0) {
      const currentWaveIds = [...frontier];
      for (const nodeId of currentWaveIds) {
        waveIndexByNodeId.set(nodeId, waveIndex);
        assigned += 1;
      }
      waves.push({ waveIndex, nodeIds: [...currentWaveIds] });

      const next: string[] = [];
      for (const nodeId of currentWaveIds) {
        for (const childId of dependents.get(nodeId) ?? []) {
          const degree = (inDegree.get(childId) ?? 0) - 1;
          inDegree.set(childId, degree);
          if (degree === 0) next.push(childId);
        }
      }

      frontier = next.sort((l, r) => sortNodeIds(l, r, byId));
      waveIndex += 1;
    }

    if (assigned !== nodes.length)
      throw new Error(
        "Wave scheduler requires a valid acyclic dependency graph",
      );

    const scheduleNodes: SchedulePlanNode[] = nodes
      .map((node) => ({
        nodeId: node.id,
        agentId: node.agent,
        priority: node.priority,
        dependsOn: [...node.dependsOn].sort((l, r) => l.localeCompare(r)),
        waveIndex: waveIndexByNodeId.get(node.id) ?? -1,
      }))
      .sort((left, right) => {
        if (left.waveIndex !== right.waveIndex)
          return left.waveIndex - right.waveIndex;
        const byPriority =
          PRIORITY_RANK[left.priority] - PRIORITY_RANK[right.priority];
        return byPriority !== 0
          ? byPriority
          : left.nodeId.localeCompare(right.nodeId);
      });

    const schedulePlanHash = createHash("sha256")
      .update(
        JSON.stringify({
          waves: waves.map((wave) => ({
            waveIndex: wave.waveIndex,
            nodeIds: wave.nodeIds,
          })),
          nodes: scheduleNodes,
        }),
      )
      .digest("hex");

    return { waves, nodes: scheduleNodes, schedulePlanHash };
  }

  toRuntimeWave(plan: SchedulePlan, waveIndex: number): ScheduleWave {
    const wave = plan.waves.find(
      (candidate) => candidate.waveIndex === waveIndex,
    );
    if (!wave) throw new Error(`Wave ${waveIndex} not found in schedule plan`);
    const byNodeId = new Map(
      plan.nodes.map((node) => [node.nodeId, node] as const),
    );

    const nodes: ScheduledNode[] = wave.nodeIds.map((nodeId) => {
      const node = byNodeId.get(nodeId);
      if (!node)
        throw new Error(`Node ${nodeId} missing from schedule plan node list`);
      return {
        nodeId: node.nodeId,
        title: node.nodeId,
        agentId: node.agentId,
        dependsOn: [...node.dependsOn],
        priority: node.priority,
        priorityRank: PRIORITY_RANK[node.priority],
        waveIndex,
      };
    });

    return { waveIndex, nodes, nodeIds: [...wave.nodeIds] };
  }

  static isNodeReady(
    node: ScheduledNode,
    statusByNodeId: Record<string, DispatchNodeStatus>,
  ): boolean {
    return node.dependsOn.every((dependencyId) => {
      const value = statusByNodeId[dependencyId];
      return value === "completed" || value === "succeeded";
    });
  }
}
