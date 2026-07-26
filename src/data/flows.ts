export type NodeId = string

export type FlowNode = {
  id: NodeId
  label: string
  sub?: string
  x: number
  y: number
  w?: number
  h?: number
  kind: 'edge' | 'aws' | 'cluster' | 'data' | 'ci' | 'obs' | 'app'
}

export type FlowEdge = {
  from: NodeId
  to: NodeId
  label?: string
}

export type FlowStep = {
  id: string
  title: string
  body: string
  activeNodes: NodeId[]
  activeEdges: number[]
  callout?: string
}

export type FlowDef = {
  id: string
  title: string
  blurb: string
  nodes: FlowNode[]
  edges: FlowEdge[]
  steps: FlowStep[]
}

export const FLOWS: FlowDef[] = [
  {
    id: 'request',
    title: 'Request path',
    blurb: 'Browser → DNS → TLS load balancer → ingress → pods → Cognito / S3 / Postgres',
    nodes: [
      { id: 'browser', label: 'Browser', sub: 'qrify-web', x: 40, y: 210, kind: 'edge' },
      { id: 'dns', label: 'Route53', sub: 'ExternalDNS', x: 200, y: 210, kind: 'aws' },
      { id: 'lb', label: 'AWS LB', sub: 'ACM TLS', x: 360, y: 210, kind: 'aws' },
      { id: 'ingress', label: 'ingress-nginx', sub: 'ClusterIP', x: 520, y: 210, kind: 'cluster' },
      { id: 'api', label: 'qrify-web-api', sub: 'FastAPI', x: 700, y: 120, kind: 'app' },
      { id: 'web', label: 'qrify-web', sub: 'Next.js', x: 700, y: 300, kind: 'app' },
      { id: 'cognito', label: 'Cognito', sub: 'JWT / JWKS', x: 900, y: 60, kind: 'aws' },
      { id: 's3', label: 'S3', sub: 'PNG · IRSA', x: 900, y: 160, kind: 'data' },
      { id: 'rds', label: 'Postgres', sub: 'metadata', x: 900, y: 260, kind: 'data' },
    ],
    edges: [
      { from: 'browser', to: 'dns' },
      { from: 'dns', to: 'lb' },
      { from: 'lb', to: 'ingress' },
      { from: 'ingress', to: 'api', label: 'api.*' },
      { from: 'ingress', to: 'web', label: 'web' },
      { from: 'api', to: 'cognito', label: 'verify' },
      { from: 'api', to: 's3', label: 'IRSA' },
      { from: 'api', to: 'rds', label: 'SQLAlchemy' },
    ],
    steps: [
      {
        id: 'r0',
        title: 'Client hits a named host',
        body: 'Users never talk to pods directly. They hit DNS names like api.dev.qrify-web.com — ExternalDNS keeps records pointed at the load balancer.',
        activeNodes: ['browser', 'dns'],
        activeEdges: [0],
        callout: 'DNS is the front door',
      },
      {
        id: 'r1',
        title: 'TLS terminates at the LB',
        body: 'ACM certificate on the AWS load balancer. Traffic lands encrypted at the edge, then forwards into the cluster through ingress-nginx.',
        activeNodes: ['dns', 'lb', 'ingress'],
        activeEdges: [1, 2],
        callout: 'ACM · ingress-nginx',
      },
      {
        id: 'r2',
        title: 'Ingress routes to the right Service',
        body: 'Host-based rules split web vs API. Services are ClusterIP — only reachable inside the mesh of the cluster via ingress.',
        activeNodes: ['ingress', 'api', 'web'],
        activeEdges: [3, 4],
        callout: 'Host → Service → Pod',
      },
      {
        id: 'r3',
        title: 'Save path verifies Cognito JWT',
        body: 'Authenticated routes use Depends(get_current_user). The API fetches JWKS, validates the token, and treats Cognito sub as user_id. Preview stays public + rate-limited.',
        activeNodes: ['api', 'cognito'],
        activeEdges: [5],
        callout: 'Stateless auth at the API',
      },
      {
        id: 'r4',
        title: 'PNG to S3, metadata to Postgres',
        body: 'Object storage via IRSA (no static keys in the pod). SQLAlchemy pool talks to RDS. One product action, two persistence planes.',
        activeNodes: ['api', 's3', 'rds'],
        activeEdges: [6, 7],
        callout: 'IRSA · pool_pre_ping',
      },
    ],
  },
  {
    id: 'deploy',
    title: 'Deploy / GitOps',
    blurb: 'GitHub Actions → OIDC → ECR → cluster-state tag → Argo CD sync → rolling pods',
    nodes: [
      { id: 'dev', label: 'Developer', sub: 'git push', x: 50, y: 200, kind: 'edge' },
      { id: 'gha', label: 'GitHub Actions', sub: 'OIDC · no long keys', x: 220, y: 200, kind: 'ci' },
      { id: 'ecr', label: 'ECR', sub: 'image push', x: 400, y: 120, kind: 'aws' },
      { id: 'cs', label: 'cluster-state', sub: 'Helm values tag', x: 400, y: 280, kind: 'ci' },
      { id: 'argo', label: 'Argo CD', sub: 'desired state', x: 600, y: 200, kind: 'cluster' },
      { id: 'pods', label: 'App pods', sub: 'rolling update', x: 800, y: 200, kind: 'app' },
      { id: 'approve', label: 'Prod gate', sub: 'Environment approval', x: 220, y: 340, kind: 'ci' },
    ],
    edges: [
      { from: 'dev', to: 'gha' },
      { from: 'gha', to: 'ecr' },
      { from: 'gha', to: 'cs' },
      { from: 'cs', to: 'argo' },
      { from: 'ecr', to: 'pods', label: 'pull' },
      { from: 'argo', to: 'pods', label: 'sync' },
      { from: 'gha', to: 'approve', label: 'prod' },
      { from: 'approve', to: 'cs' },
    ],
    steps: [
      {
        id: 'd0',
        title: 'Push triggers CI via OIDC',
        body: 'Actions requests a GitHub OIDC token, assumes an AWS role with AssumeRoleWithWebIdentity, and gets short-lived creds. No long-lived AWS keys in GitHub Secrets.',
        activeNodes: ['dev', 'gha'],
        activeEdges: [0],
        callout: 'OIDC trust policy',
      },
      {
        id: 'd1',
        title: 'Build & push the image',
        body: 'Composite actions (pinned @v1.0.0) build and push to ECR. Shared workflows stay versioned so pipelines don’t float on latest.',
        activeNodes: ['gha', 'ecr'],
        activeEdges: [1],
        callout: 'Pinned github-actions',
      },
      {
        id: 'd2',
        title: 'Git is the control plane',
        body: 'CI updates the image tag in cluster-state. Argo CD watches Git and reconciles. We don’t kubectl apply production by hand.',
        activeNodes: ['gha', 'cs', 'argo'],
        activeEdges: [2, 3],
        callout: 'Desired state in Git',
      },
      {
        id: 'd3',
        title: 'Cluster converges',
        body: 'Argo syncs Helm releases; kubelet pulls the new digest from ECR; pods roll. Drift shows up as OutOfSync, not as a mystery SSH session.',
        activeNodes: ['argo', 'ecr', 'pods'],
        activeEdges: [4, 5],
        callout: 'Pull · sync · roll',
      },
      {
        id: 'd4',
        title: 'Prod promote is gated',
        body: 'Promoting to prod waits on a GitHub Environment approval. Change control without giving up automation.',
        activeNodes: ['gha', 'approve', 'cs'],
        activeEdges: [6, 7],
        callout: 'Human gate · automated path',
      },
    ],
  },
  {
    id: 'secrets',
    title: 'Secrets pipeline',
    blurb: 'SOPS in Git → Terraform → AWS Secrets Manager → ESO → Kubernetes Secret → envFrom',
    nodes: [
      { id: 'sops', label: 'SOPS files', sub: 'encrypted in Git', x: 60, y: 200, kind: 'ci' },
      { id: 'tf', label: 'Terraform', sub: 'sops provider', x: 240, y: 200, kind: 'aws' },
      { id: 'sm', label: 'Secrets Manager', sub: 'qrify/...', x: 430, y: 200, kind: 'aws' },
      { id: 'eso', label: 'External Secrets', sub: 'IRSA', x: 620, y: 200, kind: 'cluster' },
      { id: 'ksec', label: 'K8s Secret', sub: 'namespace', x: 800, y: 120, kind: 'cluster' },
      { id: 'pod', label: 'Pod envFrom', sub: 'runtime', x: 800, y: 280, kind: 'app' },
    ],
    edges: [
      { from: 'sops', to: 'tf' },
      { from: 'tf', to: 'sm' },
      { from: 'sm', to: 'eso' },
      { from: 'eso', to: 'ksec' },
      { from: 'eso', to: 'pod' },
      { from: 'ksec', to: 'pod' },
    ],
    steps: [
      {
        id: 's0',
        title: 'Encrypted values live in Git',
        body: 'Secret *material* is SOPS-encrypted in the secrets-manager repo. Plaintext never sits in cluster-state or app repos.',
        activeNodes: ['sops'],
        activeEdges: [],
        callout: 'Git ≠ plaintext',
      },
      {
        id: 's1',
        title: 'Terraform materializes AWS secrets',
        body: 'TF reads SOPS and writes AWS Secrets Manager paths like qrify/platform/grafana-admin and per-env app secrets.',
        activeNodes: ['sops', 'tf', 'sm'],
        activeEdges: [0, 1],
        callout: 'SM as system of record',
      },
      {
        id: 's2',
        title: 'ESO syncs into the cluster',
        body: 'External Secrets Operator (IRSA) watches ExternalSecret CRs and creates/updates native Kubernetes Secrets.',
        activeNodes: ['sm', 'eso', 'ksec'],
        activeEdges: [2, 3],
        callout: 'Controller reconcile',
      },
      {
        id: 's3',
        title: 'Pods consume via envFrom',
        body: 'Workloads mount secrets as environment variables. Rotate in SM → ESO refreshes → next restart/reconcile picks it up.',
        activeNodes: ['eso', 'ksec', 'pod'],
        activeEdges: [4, 5],
        callout: 'No kubectl create secret',
      },
    ],
  },
  {
    id: 'observe',
    title: 'Observability',
    blurb: 'Prometheus scrapes /metrics · Promtail → Loki · Grafana queries both',
    nodes: [
      { id: 'apps', label: 'App pods', sub: '/metrics · stdout', x: 80, y: 200, kind: 'app' },
      { id: 'prom', label: 'Prometheus', sub: 'ServiceMonitors', x: 320, y: 100, kind: 'obs' },
      { id: 'promtail', label: 'Promtail', sub: 'DaemonSet', x: 320, y: 300, kind: 'obs' },
      { id: 'loki', label: 'Loki', sub: 'emptyDir store', x: 540, y: 300, kind: 'obs' },
      { id: 'graf', label: 'Grafana', sub: 'dashboards', x: 760, y: 200, kind: 'obs' },
    ],
    edges: [
      { from: 'apps', to: 'prom', label: 'scrape' },
      { from: 'apps', to: 'promtail', label: 'tail' },
      { from: 'promtail', to: 'loki' },
      { from: 'prom', to: 'graf' },
      { from: 'loki', to: 'graf' },
    ],
    steps: [
      {
        id: 'o0',
        title: 'Apps expose signals',
        body: 'API Instrumentator exposes /metrics. Containers write logs to stdout/stderr — the kubelet/container runtime owns the files Promtail tails.',
        activeNodes: ['apps'],
        activeEdges: [],
        callout: 'Metrics ≠ logs',
      },
      {
        id: 'o1',
        title: 'Prometheus scrapes',
        body: 'ServiceMonitors tell Prometheus what to scrape and how often. Time-series answer: is it slow, erroring, or hot?',
        activeNodes: ['apps', 'prom'],
        activeEdges: [0],
        callout: 'Pull model',
      },
      {
        id: 'o2',
        title: 'Promtail ships logs to Loki',
        body: 'A DaemonSet on each node tails container logs and pushes to Loki. Storage here is emptyDir — fine for demo, not durable production logging.',
        activeNodes: ['apps', 'promtail', 'loki'],
        activeEdges: [1, 2],
        callout: 'Known tradeoff',
      },
      {
        id: 'o3',
        title: 'Grafana is the pane of glass',
        body: 'Grafana does not collect — it queries Prometheus and Loki. One UI for “is it broken?” and “what did it print?”',
        activeNodes: ['prom', 'loki', 'graf'],
        activeEdges: [3, 4],
        callout: 'Operate what you ship',
      },
    ],
  },
]

export const FLOW_BY_ID = Object.fromEntries(FLOWS.map((f) => [f.id, f])) as Record<
  string,
  FlowDef
>
