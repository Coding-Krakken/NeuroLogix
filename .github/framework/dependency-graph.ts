/**
 * Dependency Graph (Phase A)
 *
 * Deterministic DAG validation and wave planning for hybrid orchestration.
 *
 * @module framework/dependency-graph
 */

import type {
  AgentId,
  DependencyGraphNode,
  DependencyGraphValidation,
  Priority,
} from "./types";

export interface DependencyGraphNodeInput {
  id: string;
  title: string;
  agent: AgentId;
  dependsOn?: string[];
  priority?: Priority;
}

export interface DependencyGraphPlan {
  nodes: DependencyGraphNode[];
  waves: string[][];
  validation: DependencyGraphValidation;
}

export class DependencyGraphBuilder {
  build(inputs: DependencyGraphNodeInput[]): DependencyGraphPlan {
    const nodes = this.normalize(inputs);
    const validation = this.validate(nodes);

    if (!validation.valid) {
      return {
        nodes,
        waves: [],
        validation,
      };
    }

    return {
      nodes,
      waves: this.buildWaves(nodes),
      validation,
    };
  }

  validate(nodes: DependencyGraphNode[]): DependencyGraphValidation {
    const ids = new Set(nodes.map((node) => node.id));
    for (const node of nodes) {
      for (const dependency of node.dependsOn) {
        if (!ids.has(dependency)) {
          return {
            valid: false,
            cyclePath: [dependency],
          };
        }
      }
    }

    const cyclePath = this.findCyclePath(nodes);
    if (cyclePath.length > 0) {
      return {
        valid: false,
        cyclePath,
      };
    }

    return { valid: true };
  }

  private normalize(inputs: DependencyGraphNodeInput[]): DependencyGraphNode[] {
    return [...inputs]
      .map((input) => ({
        id: input.id,
        title: input.title,
        agent: input.agent,
        dependsOn: [...(input.dependsOn ?? [])],
        priority: input.priority ?? "P2",
      }))
      .sort((left, right) => left.id.localeCompare(right.id));
  }

  private findCyclePath(nodes: DependencyGraphNode[]): string[] {
    const byId = new Map(nodes.map((node) => [node.id, node] as const));
    const visiting = new Set<string>();
    const visited = new Set<string>();
    const stack: string[] = [];

    const dfs = (nodeId: string): string[] | undefined => {
      if (visiting.has(nodeId)) {
        const cycleStart = stack.indexOf(nodeId);
        return cycleStart >= 0
          ? [...stack.slice(cycleStart), nodeId]
          : [nodeId, nodeId];
      }

      if (visited.has(nodeId)) {
        return undefined;
      }

      visiting.add(nodeId);
      stack.push(nodeId);

      const current = byId.get(nodeId);
      if (current) {
        for (const dependencyId of current.dependsOn) {
          const cyclePath = dfs(dependencyId);
          if (cyclePath) {
            return cyclePath;
          }
        }
      }

      stack.pop();
      visiting.delete(nodeId);
      visited.add(nodeId);
      return undefined;
    };

    for (const node of nodes) {
      const cyclePath = dfs(node.id);
      if (cyclePath) {
        return cyclePath;
      }
    }

    return [];
  }

  private buildWaves(nodes: DependencyGraphNode[]): string[][] {
    const inDegree = new Map<string, number>();
    const dependents = new Map<string, string[]>();

    for (const node of nodes) {
      inDegree.set(node.id, node.dependsOn.length);
      for (const dependency of node.dependsOn) {
        const children = dependents.get(dependency) ?? [];
        children.push(node.id);
        dependents.set(dependency, children);
      }
    }

    const waves: string[][] = [];
    let frontier = nodes
      .filter((node) => (inDegree.get(node.id) ?? 0) === 0)
      .map((node) => node.id)
      .sort((left, right) => left.localeCompare(right));

    while (frontier.length > 0) {
      waves.push(frontier);
      const next: string[] = [];

      for (const nodeId of frontier) {
        const children = dependents.get(nodeId) ?? [];
        for (const childId of children) {
          const degree = (inDegree.get(childId) ?? 0) - 1;
          inDegree.set(childId, degree);
          if (degree === 0) {
            next.push(childId);
          }
        }
      }

      frontier = next.sort((left, right) => left.localeCompare(right));
    }

    return waves;
  }
}
