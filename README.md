# QRify Platform Visualizer

Interactive schematic for interview walkthroughs — **not** the QR product.

Four animated flows:

1. **Request path** — DNS → TLS LB → ingress → pods → Cognito / S3 / Postgres  
2. **Deploy / GitOps** — Actions OIDC → ECR → cluster-state → Argo → pods (+ prod gate)  
3. **Secrets** — SOPS → Terraform → Secrets Manager → ESO → envFrom  
4. **Observability** — /metrics → Prometheus · Promtail → Loki · Grafana  

## Run locally

```bash
npm install
npm run dev
```

Open the URL Vite prints (usually http://localhost:5173).

## Interview tips

- Start on **Request path**, hit **Auto**, narrate as packets move  
- Keys: `←` `→` step · `Space` next · `P` pause · `1`–`4` switch flows  
- Framing line: *“Thin product domain on purpose — this is the platform.”*

## Stack

Vite · React · TypeScript · Framer Motion · SVG schematic
