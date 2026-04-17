# Technical Decision Document: Event Streaming / Message Broker

## Amazon MSK (Kafka) vs Amazon SQS/SNS

| | |
|---|---|
| **Project** | AMCart — E-Commerce Platform |
| **Author** | AMCart Engineering Team |
| **Date** | April 2026 |
| **Status** | Approved |
| **Decision** | Amazon MSK (Managed Apache Kafka) |

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

AMCart's microservices architecture requires an asynchronous communication layer between services. When a customer checks out, multiple things need to happen: stock gets updated, the cart gets cleared, and a confirmation email gets sent. These actions shouldn't block the checkout response — they should happen in the background.

We also need:
- **CDC (Change Data Capture)**: When inventory changes in PostgreSQL, the Elasticsearch search index needs to stay in sync.
- **Saga compensation**: If a payment fails after stock was reserved, we need to reliably roll back that reservation.
- **Dead Letter Queue**: Failed messages shouldn't be lost — they need to be quarantined for later investigation.

This document evaluates **Amazon MSK (Managed Kafka)** against **Amazon SQS/SNS** and recommends the best fit for AMCart's event-driven communication needs.

---

## 2. Requirements at a Glance

| # | Requirement | Priority |
|---|---|---|
| R1 | Asynchronous communication between services (fire-and-forget) | Must Have |
| R2 | Message ordering within a specific entity (e.g. all events for order #123 arrive in order) | Must Have |
| R3 | Multiple consumers reading the same event independently | Must Have |
| R4 | Message replay — reprocess old messages when a consumer has a bug | Must Have |
| R5 | Dead Letter Queue for failed messages | Must Have |
| R6 | At-least-once delivery guarantee | Must Have |
| R7 | Support CDC pipeline (DB → event stream → Elasticsearch sync) | Should Have |
| R8 | High throughput during flash sales (~10K events/second burst) | Should Have |
| R9 | Event sourcing capability (reconstruct state from event history) | Nice to Have |
| R10 | Serverless / zero-ops management | Nice to Have |

---

## 3. Available Tools

### 3.1 Amazon SQS/SNS

**SQS** (Simple Queue Service) is a fully managed message queue. Think of it like a mailbox — someone drops a letter in, and one person picks it up.

**SNS** (Simple Notification Service) is a pub/sub notification service. Think of it like a group chat — one person sends a message, and everyone in the group sees it.

Together, they form the **SNS + SQS fan-out pattern**: SNS broadcasts an event to multiple SQS queues, and each queue has its own consumer.

```
Payment Service → SNS topic "payment.succeeded"
                    ├→ SQS queue → Stock Consumer
                    ├→ SQS queue → Cart Consumer
                    └→ SQS queue → Notification Consumer
```

#### 3.1.1 Features

- **Fully serverless**: Zero infrastructure to manage. No brokers, no clusters, no patching. You create a queue/topic via API and start using it.
- **Auto-scaling**: Scales to virtually unlimited throughput automatically. No capacity planning needed.
- **SQS DLQ**: Built-in dead letter queue. After N failed processing attempts, the message moves to a separate queue.
- **SQS FIFO queues**: Guarantee strict ordering within a "message group" (e.g. all messages for order #123 stay in order). Throughput limited to 3,000 msg/sec per queue with batching.
- **SNS filtering**: Consumers can subscribe with filter policies — e.g. "only give me events where `status = failed`."
- **Retention**: SQS retains messages for up to 14 days.
- **Pay-per-use**: You only pay for the messages you send. Zero cost when idle.

#### 3.1.2 Pricing

| Component | Price |
|---|---|
| SQS Standard: first 1M requests/month | Free |
| SQS Standard: per 1M requests after | $0.40 |
| SQS FIFO: per 1M requests | $0.50 |
| SNS: first 1M publishes/month | Free |
| SNS: per 1M after | $0.50 |
| Data transfer | $0.09/GB |

**Estimated monthly cost for AMCart:**

| Component | Volume | Cost |
|---|---|---|
| SNS publishes (~5 topics, ~500K events/month) | 500K | ~$0 (free tier) |
| SQS receives (~4 consumers × 500K) | 2M | ~$0.80 |
| SQS DLQ polls | Minimal | ~$0 |
| **Total** | | **~$1–5/month** |

Extremely cheap. Practically free at our scale.

---

### 3.2 Amazon MSK (Managed Streaming for Apache Kafka)

Amazon MSK is a fully managed Apache Kafka service. Kafka is fundamentally different from SQS — it's a **distributed commit log**, not a message queue.

Think of SQS like a to-do list: you write a task, someone picks it up, and it disappears. Kafka is more like a diary: you write entries, and anyone can come back and read them — even entries from last week. The entries stay there for as long as you want.

This "diary" approach is what makes Kafka powerful for event streaming, CDC, and event sourcing.

#### 3.2.1 Features

- **Persistent event log**: Messages are stored on disk for a configurable retention period (default 7 days, can be unlimited). Consumers can **replay** from any point in time.
- **Consumer groups**: Multiple independent consumer groups can each read the entire stream at their own pace. Adding a new consumer doesn't require any changes to the producer or the topic.
- **Ordering guarantee**: Within a partition (keyed by order_id, user_id, etc.), messages are strictly ordered. No need for FIFO mode — it's the default behavior.
- **High throughput**: Handles millions of events per second. Designed for real-time streaming, not just messaging.
- **Exactly-once semantics**: With idempotent producers and transactional APIs, Kafka can guarantee exactly-once processing.
- **Kafka Connect**: Built-in CDC support. Debezium connector reads PostgreSQL WAL (write-ahead log) and streams changes to Kafka topics automatically.
- **Event sourcing ready**: Since events are retained, you can reconstruct the current state of any entity by replaying its event history.

#### 3.2.2 Pricing

MSK pricing is per broker-hour, not per message.

| Component | Price |
|---|---|
| kafka.t3.small broker (2 vCPU, 2GB) | $0.0456/hour |
| Storage | $0.10/GB/month |
| Data transfer (inter-AZ) | $0.01/GB |

**Estimated monthly cost for AMCart (3 brokers, Multi-AZ):**

| Component | Cost |
|---|---|
| 3× kafka.t3.small brokers (24/7) | ~$100 |
| 50 GB storage | ~$5 |
| Data transfer | ~$10 |
| **Total** | **~$115–150/month** |

Significantly more expensive than SQS, but you get a fundamentally different capability.

---

## 4. Comparison Analysis

### 4.1 Point Matrix

| Criteria | Weight | Amazon MSK (Kafka) | SQS/SNS | Notes |
|---|---|---|---|---|
| Message ordering | 20% | ⭐⭐⭐⭐⭐ (5) | ⭐⭐⭐ (3) | Kafka: native per-partition. SQS FIFO: works but limited throughput |
| Message replay | 20% | ⭐⭐⭐⭐⭐ (5) | ⭐ (1) | SQS deletes messages after consumption. Kafka retains them |
| Multiple independent consumers | 15% | ⭐⭐⭐⭐⭐ (5) | ⭐⭐⭐ (3) | Kafka: consumer groups, zero config. SQS: needs SNS fan-out to multiple queues |
| CDC support | 10% | ⭐⭐⭐⭐⭐ (5) | ⭐ (1) | Kafka Connect + Debezium is the industry standard for CDC |
| Operational complexity | 15% | ⭐⭐ (2) | ⭐⭐⭐⭐⭐ (5) | SQS: zero ops. MSK: broker management, monitoring, scaling |
| Cost at our scale | 10% | ⭐⭐ (2) | ⭐⭐⭐⭐⭐ (5) | SQS: ~$5/month. MSK: ~$130/month |
| Throughput / performance | 5% | ⭐⭐⭐⭐⭐ (5) | ⭐⭐⭐⭐ (4) | Both handle our load easily. Kafka wins at extreme scale |
| Event sourcing | 5% | ⭐⭐⭐⭐⭐ (5) | ⭐ (1) | SQS can't do this at all |

**Weighted Score:**
- **Amazon MSK: 3.95 / 5**
- **SQS/SNS: 2.90 / 5**

### 4.2 Message Replay — The Killer Feature

This is the single biggest reason to choose Kafka over SQS.

**Scenario**: Your CDC Elasticsearch Sync consumer has a bug. It's been writing wrong data to the search index for 3 days. You fix the bug on Thursday.

**With SQS**: Those messages are gone. They were consumed and deleted. Your only option is to write a custom script to manually re-sync all products from PostgreSQL to Elasticsearch. This could take hours and is error-prone.

**With Kafka**: You reset the consumer's offset to Monday. The consumer re-reads all messages from the last 3 days and rebuilds the search index correctly. Takes minutes, zero custom code.

In an e-commerce platform where data consistency directly affects revenue (wrong prices in search, wrong stock counts, missing orders), message replay is not a luxury — it's a safety net.

### 4.3 CDC Pipeline — Database to Elasticsearch Sync

AMCart needs to keep the Elasticsearch product search index in sync with the PostgreSQL product database. When an admin adds a new product or updates a price, that change needs to appear in search results.

**With SQS/SNS:**
```
Product Service updates DB → Product Service publishes SNS event → SQS → ES Sync Consumer
```
The problem: the application code is responsible for publishing the event. If the code has a bug, or the publish fails after the DB write succeeds, the search index goes stale silently. This is called the "dual write problem."

**With Kafka + Debezium CDC:**
```
Product Service updates DB → PostgreSQL WAL → Debezium reads WAL → Kafka topic → ES Sync Consumer
```
The event comes directly from the database transaction log (WAL). If the row was written to PostgreSQL, the event is guaranteed to appear in Kafka. No dual write problem. No application code involved in publishing.

This is a fundamentally more reliable architecture. For an e-commerce platform, having search results that don't match actual inventory is a direct revenue loss.

---

## 5. Recommendation

**We recommend Amazon MSK (Managed Apache Kafka)** for AMCart's event streaming layer.

**Why:**

1. **Message replay is essential for data integrity.** In an e-commerce platform, we deal with money, stock counts, and order history. When a consumer has a bug (and it will), we need to be able to reprocess past events without data loss. SQS simply cannot do this.

2. **CDC pipeline with Debezium.** Keeping our Elasticsearch search index in sync with PostgreSQL is a core requirement. Kafka Connect + Debezium is the industry standard solution. Doing this with SQS requires fragile application-level event publishing.

3. **Saga compensation reliability.** Our checkout saga (lock → reserve → charge → create order → clear cart) needs reliable event ordering and the ability to replay compensation events if something goes wrong during rollback. Kafka's per-partition ordering guarantees this.

4. **Consumer independence.** Adding a new consumer (e.g. an analytics pipeline, a recommendation engine) doesn't require changes to any producer or existing consumer. With SQS, you'd need to add a new SQS queue and subscribe it to the SNS topic.

5. **The cost difference is justified.** Yes, MSK costs ~$130/month vs ~$5/month for SQS. But one incident of lost checkout events or stale search results could cost far more in lost revenue and customer trust. The $125/month premium buys us replay capability, CDC support, and operational peace of mind.

---

## 6. Assumptions

1. We'll use MSK with 3 kafka.t3.small brokers across 3 AZs. This provides fault tolerance (1 broker can fail without data loss).
2. Message retention is set to 7 days. This gives us a full week to catch and replay failed consumer processing.
3. We have 5–6 topics: `order.created`, `payment.succeeded`, `payment.failed`, `inventory.updated`, `checkout.compensate`, and a DLQ topic.
4. Each topic has 3 partitions (one per broker). This allows up to 3 parallel consumers per consumer group.
5. Average event size is ~1 KB. At 500K events/day, storage usage is minimal (~3.5 GB/week).
6. Debezium CDC connector will be deployed as an ECS Fargate task running Kafka Connect in standalone mode.
7. The team will invest ~1 week in initial Kafka setup and learning. After that, MSK is largely hands-off.

---

## 7. Risks

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| **Operational complexity**: MSK requires monitoring broker health, disk usage, partition rebalancing, and consumer lag. More moving parts than SQS. | Medium | Medium | Use MSK's built-in CloudWatch metrics. Set alarms for: consumer lag > 1000, disk usage > 80%, under-replicated partitions > 0. AWS handles broker patching and version upgrades. |
| **Cost at idle**: MSK brokers run 24/7 even with zero traffic. Unlike SQS, you pay whether or not messages are flowing. | High | Low | The ~$130/month is a fixed cost we accept. If the product fails, we can shut down MSK entirely. At scale, per-message cost is actually lower than SQS. |
| **Kafka learning curve**: The team has limited Kafka experience. Concepts like partitions, offsets, consumer groups, and rebalancing take time to learn. | Medium | Medium | Start with simple configurations (3 partitions per topic, single consumer per group). Use the `confluent-kafka` Python library which has good documentation. Keep our first consumers simple. |
| **Partition hot-spotting**: If partition key is poorly chosen (e.g. all events land on one partition), throughput degrades and ordering breaks. | Low | Medium | Use `order_id` or `user_id` as partition key — natural distribution. Monitor partition-level metrics via CloudWatch. |
| **MSK version upgrades**: Kafka version upgrades can cause brief consumer disconnections. | Low | Low | MSK supports rolling upgrades with zero downtime. Schedule upgrades during low-traffic hours. |

---

## 8. Appendix

### 8.1 References

| # | Reference |
|---|---|
| 1 | [Amazon MSK Documentation](https://docs.aws.amazon.com/msk/) |
| 2 | [Amazon SQS Documentation](https://docs.aws.amazon.com/sqs/) |
| 3 | [Amazon SNS Documentation](https://docs.aws.amazon.com/sns/) |
| 4 | [MSK Pricing](https://aws.amazon.com/msk/pricing/) |
| 5 | [SQS Pricing](https://aws.amazon.com/sqs/pricing/) |
| 6 | [Debezium CDC Connector for PostgreSQL](https://debezium.io/documentation/reference/connectors/postgresql.html) |
| 7 | [Kafka vs SQS — When to Use What (AWS Blog)](https://aws.amazon.com/blogs/big-data/) |
| 8 | [AMCart Architecture Diagram — architecture.mmd](../architecture.mmd) |
