# Technical Decision Document: Container Orchestration

## ECS Fargate vs Amazon EKS

| | |
|---|---|
| **Project** | AMCart — E-Commerce Platform |
| **Author** | AMCart Engineering Team |
| **Date** | April 2026 |
| **Status** | Approved |
| **Decision** | AWS ECS with Fargate launch type |

---

## Contents

1. [Introduction](#1-introduction)
2. [Requirements at a Glance](#2-requirements-at-a-glance)
3. [Available Tools](#3-available-tools)
4. [Comparison Analysis](#4-comparison-analysis)
5. [Recommendation](#5-recommendation)
6. [Assumptions](#6-assumptions)
7. [Risks](#7-risks)
8. [Appendix](#8-appendix)

---

## 1. Introduction

### 1.1 Objective and Scope

AMCart is an e-commerce platform built with a microservices architecture consisting of 10 independently deployable services (Auth, Product, Search, Cart, Checkout, Order, Inventory, Payment, Notification, and Admin). Each service is containerized using Docker.

We need a container orchestration platform on AWS that can:
- Run and manage all 10 services reliably
- Scale each service independently based on traffic
- Integrate smoothly with our existing AWS infrastructure (RDS, ElastiCache, MSK, ALB)
- Be operationally manageable by a small team (2–3 engineers)

This document evaluates **Amazon ECS with Fargate** against **Amazon EKS** and recommends the best fit for AMCart's current stage and team size.

---

## 2. Requirements at a Glance

| # | Requirement | Priority |
|---|---|---|
| R1 | Run 10 containerized microservices in production | Must Have |
| R2 | Auto-scale each service independently (CPU/memory based) | Must Have |
| R3 | Path-based routing via ALB (`/api/auth/*`, `/api/cart/*`, etc.) | Must Have |
| R4 | Zero-downtime deployments (rolling or blue/green) | Must Have |
| R5 | Secrets injection (DB passwords, API keys) without hardcoding | Must Have |
| R6 | Centralized logging and monitoring | Must Have |
| R7 | Cost-efficient for 10 services at moderate traffic (~50K DAU) | Should Have |
| R8 | Minimal operational overhead for a small team | Should Have |
| R9 | Multi-cloud portability | Nice to Have |
| R10 | Advanced scheduling (GPU, spot instance bin-packing) | Not Required |

---

## 3. Available Tools

### 3.1 Amazon ECS with Fargate

Amazon Elastic Container Service (ECS) is AWS's own container orchestration service. With the **Fargate launch type**, you don't manage any servers at all — you just tell AWS how much CPU and memory each container needs, and AWS handles the rest.

Think of it like ordering a taxi: you say where you want to go (your container spec), and someone else drives (AWS manages the infrastructure). You never see the car's engine.

#### 3.1.1 Features

- **Serverless compute**: No EC2 instances to patch, update, or monitor. You define task definitions (CPU, memory, container image), and Fargate runs them.
- **Native AWS integration**: Works out of the box with ALB (target groups), CloudWatch (logs), Secrets Manager (inject secrets as env vars), IAM (task roles), and ECR (pull images).
- **Service Auto Scaling**: Scale task count based on CPU, memory, or custom CloudWatch metrics. Each service scales independently.
- **Rolling deployments**: Built-in rolling update strategy. Can also do blue/green via CodeDeploy.
- **Service discovery**: AWS Cloud Map integration for service-to-service communication.
- **Security**: Each task gets its own ENI (network interface) and can have its own security group.

#### 3.1.2 Pricing

Fargate pricing is **per vCPU and per GB of memory, per second**.

| Resource | Price (us-east-1) |
|---|---|
| vCPU per hour | $0.04048 |
| Memory (GB) per hour | $0.004445 |

**Estimated monthly cost for AMCart (10 services, 2 tasks each):**

| Service | vCPU | Memory | Tasks | Monthly Cost |
|---|---|---|---|---|
| Auth, Product, Order, Inventory, Payment, Checkout (6 svc) | 1 | 2 GB | 2 each | ~$140 |
| Cart, Search (2 svc) | 0.5 | 1 GB | 2 each | ~$18 |
| Notification, Admin (2 svc) | 0.5 | 1 GB | 1 each | ~$9 |

**Total compute: ~$167/month** (before scaling)

No ECS control plane charge — ECS itself is free. You only pay for Fargate compute.

---

### 3.2 Amazon EKS (Elastic Kubernetes Service)

Amazon EKS is AWS's managed Kubernetes service. Kubernetes is the industry-standard open-source container orchestration platform, and EKS runs it on AWS with the control plane managed by AWS.

Think of it like buying a car: you own it, you can customize everything (engine, paint, tires), but you also have to maintain it, insure it, and learn to drive manual.

#### 3.2.1 Features

- **Full Kubernetes ecosystem**: Helm charts, custom operators, service mesh (Istio/Linkerd), CRDs (Custom Resource Definitions) — the entire CNCF ecosystem is available.
- **Multi-cloud portability**: Your Kubernetes manifests work on GCP (GKE), Azure (AKS), or on-premises with minimal changes.
- **Advanced scheduling**: Node affinity, taints/tolerations, pod priority, spot instance node groups, GPU scheduling.
- **Horizontal Pod Autoscaler (HPA)**: Scale based on CPU, memory, or custom metrics via KEDA.
- **Self-healing**: Automatic pod restarts, replica management, liveness/readiness probes.
- **Community support**: Massive ecosystem, thousands of community-maintained Helm charts and operators.

#### 3.2.2 Pricing

| Component | Price |
|---|---|
| EKS Control Plane | $0.10/hour = **$73/month** (fixed, even if no pods run) |
| EC2 Worker Nodes (managed node group) | Depends on instance type |
| OR Fargate pods on EKS | Same Fargate pricing as ECS + 20% overhead |

**Estimated monthly cost for AMCart (10 services, 2 replicas each):**

| Component | Monthly Cost |
|---|---|
| EKS Control Plane | $73 |
| 3x t3.medium nodes (2 vCPU, 4GB each) | ~$100 |
| OR Fargate on EKS (same workload as above) | ~$200 (Fargate cost + overhead) |
| ALB Ingress Controller overhead | ~$5 |

**Total: ~$175–275/month** depending on node type and mode.

---

## 4. Comparison Analysis

### 4.1 Point Matrix

| Criteria | Weight | ECS Fargate | EKS | Notes |
|---|---|---|---|---|
| Operational complexity | 25% | ⭐⭐⭐⭐⭐ (5) | ⭐⭐ (2) | ECS: near-zero ops. EKS: node upgrades, cluster version upgrades, networking plugins |
| AWS integration | 20% | ⭐⭐⭐⭐⭐ (5) | ⭐⭐⭐ (3) | ECS is native. EKS needs controllers for ALB, Secrets, logging |
| Cost (at our scale) | 15% | ⭐⭐⭐⭐⭐ (5) | ⭐⭐⭐ (3) | ECS: no control plane fee. EKS: $73/month just to exist |
| Time to first deploy | 10% | ⭐⭐⭐⭐⭐ (5) | ⭐⭐ (2) | ECS: ~1 day. EKS: ~1 week minimum |
| Auto-scaling simplicity | 10% | ⭐⭐⭐⭐ (4) | ⭐⭐⭐⭐⭐ (5) | EKS HPA/KEDA is more powerful but more complex |
| Multi-cloud portability | 5% | ⭐ (1) | ⭐⭐⭐⭐⭐ (5) | ECS is AWS-only. Kubernetes runs everywhere |
| Ecosystem / extensibility | 5% | ⭐⭐ (2) | ⭐⭐⭐⭐⭐ (5) | Kubernetes ecosystem is unmatched |
| Team skill required | 10% | ⭐⭐⭐⭐⭐ (5) | ⭐⭐ (2) | ECS: basic AWS knowledge. EKS: needs K8s expertise |

**Weighted Score:**
- **ECS Fargate: 4.55 / 5**
- **EKS: 2.85 / 5**

### 4.2 Operational Complexity

This is the biggest differentiator for our team size.

**ECS Fargate — what you manage:**
- Task definitions (JSON/Terraform) — define CPU, memory, image, env vars
- Service config — desired count, scaling policy
- That's basically it

**EKS — what you manage:**
- Cluster version upgrades (every ~4 months, Kubernetes deprecates old versions aggressively)
- Node group AMI updates and patching
- VPC CNI plugin configuration
- AWS Load Balancer Controller (Helm chart) for ALB integration
- External Secrets Operator for Secrets Manager integration
- Fluentd/Fluent Bit DaemonSet for logging to CloudWatch
- CoreDNS for service discovery
- Cluster Autoscaler or Karpenter for node scaling
- RBAC policies, ServiceAccounts, NetworkPolicies

With a 2–3 person team, the EKS overhead would eat into time we should be spending on product features. We'd essentially need at least one person dedicated to "keeping Kubernetes happy," which we can't afford right now.

### 4.3 Cost Efficiency

At AMCart's current scale (~10 services, ~50K daily active users), the numbers tell a clear story:

| | ECS Fargate | EKS + EC2 Nodes | EKS + Fargate |
|---|---|---|---|
| Control plane | $0 | $73/month | $73/month |
| Compute (10 svc × 2 tasks) | ~$167 | ~$100 (3 nodes) | ~$200 |
| ALB integration | Built-in | Needs controller | Needs controller |
| Logging | Built-in | Needs FluentBit | Needs FluentBit |
| **Total** | **~$167** | **~$173** | **~$273** |

The raw compute costs look similar for ECS vs EKS+EC2, but EKS has hidden costs:
- Engineer time to manage K8s (the real expense)
- The $73/month control plane fee even during zero traffic
- Additional tooling (monitoring, secrets, ingress controllers)

At 50+ services or if we were multi-cloud, EKS would start winning. At 10 services on AWS-only, ECS is clearly cheaper both in dollars and in engineering time.

---

## 5. Recommendation

**We recommend Amazon ECS with Fargate launch type** for AMCart's container orchestration.

**Why:**

1. **Our team is small.** We have 2–3 engineers. ECS lets us focus on building features instead of maintaining Kubernetes infrastructure. The operational overhead of EKS is simply not justified at our scale.

2. **We're AWS-only.** We have no multi-cloud requirement. Our entire stack (RDS, ElastiCache, MSK, ALB, CloudFront, SES) is on AWS. ECS integrates natively with all of these — no controllers, operators, or glue code needed.

3. **Fargate eliminates server management.** No EC2 instances to patch, no node groups to upgrade, no capacity planning. We define CPU/memory per service, and AWS handles the rest.

4. **Cost is lower.** No EKS control plane fee, no infrastructure tooling overhead, and significantly less engineering time spent on ops.

5. **Migration path exists.** Since our services are containerized with Docker, moving from ECS to EKS later is a configuration migration, not a code rewrite. If we grow to 50+ services or need multi-cloud, we can revisit this decision.

---

## 6. Assumptions

1. AMCart will remain AWS-only for the next 12–18 months. No plans for multi-cloud deployment.
2. The team size stays at 2–5 engineers. No dedicated DevOps/Platform engineering hire planned.
3. Traffic remains moderate (~50K DAU). Flash sale peaks handled by Fargate auto-scaling (up to 20 tasks per service).
4. All 10 services are stateless HTTP APIs — no long-running batch jobs or GPU workloads.
5. Fargate's cold start time (~30–60 seconds for new tasks) is acceptable since we always keep minimum 2 tasks running per critical service.
6. We don't need advanced Kubernetes features like service mesh (Istio), custom operators, or CRDs.

---

## 7. Risks

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| **Vendor lock-in**: ECS is AWS-proprietary. If we need to leave AWS, we can't take ECS with us. | Low | High | Our services are standard Docker containers. Only the orchestration layer (task definitions) is ECS-specific. Migration to K8s would require rewriting deployment configs, not application code. |
| **Fargate cold starts**: New tasks take 30–60 seconds to spin up. During sudden traffic spikes, requests may queue. | Medium | Medium | Keep minimum 2 tasks per service. Use predictive scaling before known events (flash sales). ALB health checks ensure traffic only routes to healthy tasks. |
| **Fargate pricing at scale**: At very high task counts, Fargate can be more expensive than EC2 spot instances. | Low | Medium | Monitor costs monthly. If we consistently run 50+ tasks, evaluate switching to ECS on EC2 with spot instances (same ECS, different launch type — no migration needed). |
| **Limited ecosystem**: ECS doesn't have Kubernetes' rich ecosystem of tools (Helm, operators, service mesh). | Medium | Low | We don't currently need these tools. If we do in the future, it's a signal to re-evaluate EKS. |

---

## 8. Appendix

### 8.1 References

| # | Reference |
|---|---|
| 1 | [Amazon ECS Documentation](https://docs.aws.amazon.com/ecs/) |
| 2 | [Amazon EKS Documentation](https://docs.aws.amazon.com/eks/) |
| 3 | [AWS Fargate Pricing](https://aws.amazon.com/fargate/pricing/) |
| 4 | [EKS Pricing](https://aws.amazon.com/eks/pricing/) |
| 5 | [ECS vs EKS — AWS Containers Blog](https://aws.amazon.com/blogs/containers/) |
| 6 | [AMCart Architecture Diagram — architecture.mmd](../architecture.mmd) |
