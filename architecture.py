"""
AMCart Microservices Architecture Diagram
Generated using the `diagrams` Python package.
Run: python3 architecture.py
Output: amcart_architecture.png
"""

from diagrams import Diagram, Cluster, Edge
from diagrams.aws.network import CloudFront, ELB
from diagrams.aws.security import WAF
from diagrams.aws.storage import S3
from diagrams.onprem.database import PostgreSQL
from diagrams.onprem.inmemory import Redis
from diagrams.onprem.queue import Kafka
from diagrams.onprem.network import Nginx
from diagrams.onprem.monitoring import Prometheus, Grafana
from diagrams.onprem.tracing import Jaeger
from diagrams.elastic.elasticsearch import Elasticsearch
from diagrams.onprem.compute import Server
from diagrams.generic.compute import Rack
from diagrams.programming.framework import FastAPI

graph_attr = {
    "fontsize": "28",
    "bgcolor": "#f7f8fa",
    "pad": "1.0",
    "ranksep": "1.2",
    "nodesep": "0.8",
    "splines": "spline",
}

edge_colors = {
    "sync": "#2196F3",       # blue - sync REST/gRPC
    "event": "#FF9800",      # orange - async Kafka events
    "data": "#4CAF50",       # green - data store access
    "saga": "#E91E63",       # pink - saga orchestration
    "observe": "#9E9E9E",    # grey - observability
}

with Diagram(
    "AMCart — Target Microservices Architecture",
    filename="amcart_architecture",
    show=False,
    direction="TB",
    graph_attr=graph_attr,
    outformat="png",
):

    # ── Edge / CDN Layer ──────────────────────────────────────────
    with Cluster("Edge Layer"):
        waf = WAF("AWS WAF")
        cdn = CloudFront("CloudFront CDN")
        static = S3("S3 Static\nAssets")
        waf >> Edge(color=edge_colors["sync"]) >> cdn >> Edge(color=edge_colors["sync"]) >> static

    # ── API Gateway ───────────────────────────────────────────────
    with Cluster("API Gateway"):
        alb = ELB("ALB")
        gw1 = Nginx("Gateway-1")
        gw2 = Nginx("Gateway-2")
        redis_token = Redis("Redis\nToken Store")
        alb >> Edge(color=edge_colors["sync"]) >> [gw1, gw2]
        gw1 >> Edge(color=edge_colors["data"], style="dashed") >> redis_token
        gw2 >> Edge(color=edge_colors["data"], style="dashed") >> redis_token

    cdn >> Edge(label="/api/*", color=edge_colors["sync"]) >> alb

    # ── Core Services ─────────────────────────────────────────────
    with Cluster("Core Services"):

        with Cluster("Auth Service"):
            auth_api = FastAPI("Auth API")
            auth_db = PostgreSQL("auth_db")
            auth_api >> Edge(color=edge_colors["data"]) >> auth_db

        with Cluster("Search Service"):
            search_api = FastAPI("Search API")
            search_es = Elasticsearch("Elasticsearch")
            search_api >> Edge(color=edge_colors["data"]) >> search_es

        with Cluster("Product Service"):
            product_api = FastAPI("Product API")
            product_db = PostgreSQL("product_db")
            product_api >> Edge(color=edge_colors["data"]) >> product_db

        with Cluster("Admin Service"):
            admin_api = FastAPI("Admin API")
            admin_db = PostgreSQL("admin_db")
            admin_api >> Edge(color=edge_colors["data"]) >> admin_db

        with Cluster("Cart Service"):
            cart_api = FastAPI("Cart API")
            cart_redis = Redis("cart_redis")
            cart_api >> Edge(color=edge_colors["data"]) >> cart_redis

        with Cluster("Order Service"):
            order_api = FastAPI("Order API")
            order_db = PostgreSQL("order_db")
            order_api >> Edge(color=edge_colors["data"]) >> order_db

        with Cluster("Inventory Service"):
            inv_api = FastAPI("Inventory API")
            inv_db = PostgreSQL("inventory_db")
            inv_api >> Edge(color=edge_colors["data"]) >> inv_db

        with Cluster("Payment Service"):
            pay_api = FastAPI("Payment API")
            pay_ext = Server("Stripe /\nRazorpay")
            pay_api >> Edge(color=edge_colors["sync"]) >> pay_ext

        with Cluster("Notification Service"):
            notif_api = FastAPI("Notification API")
            notif_ext = Server("SES / Twilio")
            notif_api >> Edge(color=edge_colors["sync"]) >> notif_ext

    # Gateway → Services (sync)
    gw1 >> Edge(color=edge_colors["sync"]) >> auth_api
    gw1 >> Edge(color=edge_colors["sync"]) >> search_api
    gw1 >> Edge(color=edge_colors["sync"]) >> product_api
    gw1 >> Edge(color=edge_colors["sync"]) >> admin_api
    gw1 >> Edge(color=edge_colors["sync"]) >> cart_api
    gw2 >> Edge(color=edge_colors["sync"]) >> order_api
    gw2 >> Edge(color=edge_colors["sync"]) >> inv_api
    gw2 >> Edge(color=edge_colors["sync"]) >> pay_api
    gw2 >> Edge(color=edge_colors["sync"]) >> notif_api

    # Admin → Product & Inventory (CRUD, stock mgmt)
    admin_api >> Edge(label="CRUD", color=edge_colors["sync"], style="bold") >> product_api
    admin_api >> Edge(label="stock mgmt", color=edge_colors["sync"], style="bold") >> inv_api

    # ── Checkout Saga ─────────────────────────────────────────────
    with Cluster("Checkout Saga Orchestrator"):
        saga = Rack("Saga\nCoordinator")

    gw1 >> Edge(label="POST /checkout", color=edge_colors["saga"]) >> saga
    saga >> Edge(label="1 reserve", color=edge_colors["saga"]) >> inv_api
    saga >> Edge(label="2 charge", color=edge_colors["saga"]) >> pay_api
    saga >> Edge(label="3 create", color=edge_colors["saga"]) >> order_api
    saga >> Edge(label="4 clear", color=edge_colors["saga"]) >> cart_api
    saga >> Edge(label="5 notify", color=edge_colors["saga"]) >> notif_api

    # ── Kafka Event Bus ───────────────────────────────────────────
    with Cluster("Kafka Event Bus"):
        k_order = Kafka("order.*")
        k_inv = Kafka("inventory.*")
        k_pay = Kafka("payment.*")
        k_cart = Kafka("cart.*")
        k_notif = Kafka("notification.*")
        k_dlq = Kafka("DLQ")

    # Producers
    order_api >> Edge(color=edge_colors["event"]) >> k_order
    inv_api >> Edge(color=edge_colors["event"]) >> k_inv
    pay_api >> Edge(color=edge_colors["event"]) >> k_pay
    cart_api >> Edge(color=edge_colors["event"]) >> k_cart

    # ── Kafka Consumers ───────────────────────────────────────────
    with Cluster("Kafka Consumers"):
        c_stock = Rack("Stock\nConsumer")
        c_cart = Rack("Cart-Clear\nConsumer")
        c_notif = Rack("Notification\nConsumer")
        c_es = Rack("CDC→ES\nSync")

    k_order >> Edge(color=edge_colors["event"]) >> c_stock
    k_order >> Edge(color=edge_colors["event"]) >> c_cart
    k_pay >> Edge(color=edge_colors["event"]) >> c_notif
    k_inv >> Edge(color=edge_colors["event"]) >> c_es
    c_es >> Edge(color=edge_colors["data"]) >> search_es

    # ── Observability ─────────────────────────────────────────────
    with Cluster("Observability (sidecar agents)"):
        jaeger = Jaeger("Jaeger\nTracing")
        prom = Prometheus("Prometheus")
        graf = Grafana("Grafana")
        elk = Elasticsearch("ELK Stack")
        prom >> Edge(color=edge_colors["observe"]) >> graf
