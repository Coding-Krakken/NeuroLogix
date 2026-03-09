type FrameworkLifecycleState =
  | "draft"
  | "candidate"
  | "smoke_validated"
  | "publish_blocked"
  | "published"
  | "superseded";

const lifecycleAliases: Record<string, FrameworkLifecycleState> = {
  draft: "draft",
  candidate: "candidate",
  smoke_validated: "smoke_validated",
  smokevalidated: "smoke_validated",
  publish_blocked: "publish_blocked",
  publishblocked: "publish_blocked",
  published: "published",
  superseded: "superseded",
};

export const normalizeLifecycle = (
  lifecycleValue: string,
): FrameworkLifecycleState => {
  const normalized = lifecycleValue
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");

  const value = lifecycleAliases[normalized];
  if (!value) {
    throw new Error(
      `Unsupported lifecycle state '${lifecycleValue}'. Expected one of: draft, candidate, smoke_validated, publish_blocked, published, superseded.`,
    );
  }

  return value;
};
