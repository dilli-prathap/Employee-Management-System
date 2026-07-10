# Employee Management System — 3-Tier Kubernetes App

A **3-Tier Employee Management System** built using **HTML, CSS, JavaScript, Node.js, MySQL, Docker, and Kubernetes**.

The project demonstrates how a modern web application is containerized using Docker and deployed on Kubernetes using Deployments, Services, ConfigMaps, Secrets, Persistent Volumes, and Namespaces.


| Tier | Technology | Purpose |
|---|---|---|
| Presentation | Nginx + HTML/CSS/JS | Serves the UI, proxies `/api` calls to backend |
| Application | Node.js + Express | REST API for employee CRUD operations |
| Data | MySQL 8.0 | Stores employee records |

## Project Architecture
<img width="987" height="587" alt="Screenshot 2026-07-10 174744" src="https://github.com/user-attachments/assets/fb51eb88-d7ca-4f62-a948-7290e2f7fb70" />

## Project Structure

```
employee-management-system/
├── backend/           
│   ├── server.js
│   ├── package.json
│   └── Dockerfile
├── frontend/            
│   ├── index.html
│   ├── style.css
│   ├── app.js
│   ├── nginx.conf
│   └── Dockerfile
├── k8s/                 
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

---

# REST API Endpoints

| Method | Endpoint | Description |
|---------|----------|-------------|
| GET | /api/employees | Get all employees |
| GET | /api/employees/:id | Get employee |
| POST | /api/employees | Add employee |
| PUT | /api/employees/:id | Update employee |
| DELETE | /api/employees/:id | Delete employee |

---
## FRONTEND:
<img width="1861" height="990" alt="Screenshot 2026-07-10 171153" src="https://github.com/user-attachments/assets/a8ce1435-f1a6-4759-8952-7939dde08913" />

## EDIT:
<img width="1796" height="982" alt="Screenshot 2026-07-10 171211" src="https://github.com/user-attachments/assets/8a4cf1a7-83e8-4d45-be62-52728cacbbb3" />

## BACKEND Response:
<img width="1298" height="107" alt="Screenshot 2026-07-10 171855" src="https://github.com/user-attachments/assets/541806c1-c8f6-49cd-86db-498d9dfc1655" />


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

# 🎯 Learning Outcomes

- Three-Tier Architecture
- Docker Containerization
- Kubernetes Deployments
- Service Discovery
- ConfigMaps
- Secrets
- Persistent Storage
- REST API Development
- MySQL Integration
- Kubernetes Networking

---

# 👨‍💻 Author

**Dilli Prathap**

B.Tech CSE (IoT)

Cloud | DevOps | Kubernetes | AWS Enthusiast

---

# ⭐ If you found this project useful, please give it a star.
