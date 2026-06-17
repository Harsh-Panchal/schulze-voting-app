# Kubernetes Manifests

These manifests are for future deployment. They define how the frontend
container runs in a Kubernetes cluster.

## Files (to be created when deploying):
- `deployment.yaml` — Frontend pods (replicas, resource limits, probes)
- `service.yaml` — ClusterIP service exposing port 3000
- `ingress.yaml` — External access via domain name
- `hpa.yaml` — Horizontal Pod Autoscaler (scale on CPU/memory)

## Quick Reference:
```bash
# Apply all manifests
kubectl apply -f k8s/

# Check pod status
kubectl get pods -l app=schulze-frontend

# View logs
kubectl logs -l app=schulze-frontend --tail=100
```
