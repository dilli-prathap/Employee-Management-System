# Employee Management System — 3-Tier Kubernetes App

A simple 3-tier application deployed on Kubernetes:

| Tier | Technology | Purpose |
|---|---|---|
| Presentation | Nginx + HTML/CSS/JS | Serves the UI, proxies `/api` calls to backend |
| Application | Node.js + Express | REST API for employee CRUD operations |
| Data | MySQL 8.0 | Stores employee records |

## Project Structure

```
employee-management-system/
├── backend/            # Express API
│   ├── server.js
│   ├── package.json
│   └── Dockerfile
├── frontend/            # Nginx + static UI
│   ├── index.html
│   ├── style.css
│   ├── app.js
│   ├── nginx.conf
│   └── Dockerfile
├── k8s/                 # Kubernetes manifests (apply in order)
│   ├── 00-namespace.yaml
│   ├── 01-mysql-secret.yaml
│   ├── 02-mysql-configmap.yaml
│   ├── 03-mysql-pvc.yaml
│   ├── 04-mysql-deployment.yaml
│   ├── 05-mysql-service.yaml
│   ├── 06-backend-deployment.yaml
│   ├── 07-backend-service.yaml
│   ├── 08-frontend-deployment.yaml
│   └── 09-frontend-service.yaml
└── README.md
```

## 1. Build the Docker images

From the project root:

```bash
docker build -t employee-backend:latest ./backend
docker build -t employee-frontend:latest ./frontend
```

### If using Minikube
Load the images directly into the cluster's Docker daemon:

```bash
minikube image load employee-backend:latest
minikube image load employee-frontend:latest
```

### If using kind
```bash
kind load docker-image employee-backend:latest
kind load docker-image employee-frontend:latest
```

(If you're using a remote cluster, push both images to a registry — e.g. Docker Hub — and update the `image:` field in `06-backend-deployment.yaml` and `08-frontend-deployment.yaml` accordingly.)

## 2. Deploy to Kubernetes

Apply all manifests (the numeric prefixes keep them in the right order — namespace and secrets first, database, then backend, then frontend):

```bash
kubectl apply -f k8s/
```

Check that everything is running:

```bash
kubectl get pods -n employee-management
kubectl get svc -n employee-management
```

Wait until all pods show `Running` and `1/1` (or `2/2`) ready. The MySQL pod needs to be ready before the backend can connect — the backend has built-in retry logic, so it will keep retrying until MySQL is available.

## 3. Access the app

### Minikube
```bash
minikube service frontend-service -n employee-management
```

### kind / other clusters
Port-forward the frontend service:
```bash
kubectl port-forward -n employee-management svc/frontend-service 8080:80
```
Then open **http://localhost:8080**

The frontend Service is also exposed as a `NodePort` on port `30080`, so on clusters with direct node access you can hit `http://<node-ip>:30080`.

## How the tiers talk to each other

- **Browser → Frontend**: the browser only ever talks to Nginx (the frontend Service).
- **Frontend → Backend**: Nginx proxies any request to `/api/*` to `http://backend-service:5000/api/*` using Kubernetes' internal DNS. This means the browser never needs to know the backend's address.
- **Backend → Database**: the backend connects to `mysql-service:3306` using credentials pulled from the `mysql-secret` Secret. `mysql-service` is a headless Service pointing at the single MySQL pod.

## Data persistence

MySQL data is stored on a `PersistentVolumeClaim` (`mysql-pvc`, 1Gi) so data survives pod restarts. On first startup, the `mysql-init-script` ConfigMap seeds the `employees` table with a few sample rows.

## Scaling

Backend and frontend are stateless and run 2 replicas by default:
```bash
kubectl scale deployment backend-deployment -n employee-management --replicas=4
kubectl scale deployment frontend-deployment -n employee-management --replicas=4
```
MySQL runs as a single replica (a `StatefulSet` with replication would be needed for production-grade HA, which is out of scope for this simple demo).

## Cleaning up

```bash
kubectl delete namespace employee-management
```

## Notes on "simply"

This is intentionally minimal so the Kubernetes concepts stay clear:
- No Ingress controller (uses NodePort instead) — add one if you want a real domain/TLS.
- Secrets use plain `stringData` for readability — in production, use a secrets manager or sealed secrets.
- No HorizontalPodAutoscaler or resource limits — add `resources:` blocks and an HPA for production use.
