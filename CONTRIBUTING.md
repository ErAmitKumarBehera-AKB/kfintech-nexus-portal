# Contributing to KFintech Nexus Portal

Welcome! Thank you for your interest in contributing to the **KFintech Nexus Portal**, an AI-driven, enterprise-grade grievance management system. We are actively expanding this project for our upcoming hackathon presentation and value high-impact contributions that drive **business efficiency, AI accuracy, and system scalability.**

## 🎯 Our Hackathon Vision
Our goal is to demonstrate how unstructured, complex investor grievances can be fully automated using LLMs (Llama-3.2-3B-Instruct), NLP (FinBERT), Computer Vision (Florence-2 Vision OCR), and Voice AI (Whisper). Contributions should align with these core objectives:
1. **Minimizing Human Touch-Points:** Automating triage, sentiment scoring, and summarization.
2. **Zero-Trust Compliance:** Strict Maker-Checker (L1/L2) workflows and immutable audit logs via the Super Admin Control Center.
3. **Enterprise Scalability:** Ensuring the Dockerized microservices can scale effectively in both GPU and CPU deployment modes.

## 🛠️ Development Workflow

1. **Fork & Clone:** Fork the repository to your own GitHub account and clone it locally.
2. **Branch Naming Strategy:** 
   - Feature: `feat/ai-model-upgrade`
   - Bugfix: `fix/ocr-accuracy`
   - Performance: `perf/mongodb-indexing`
3. **Run Locally via Docker:**
   We strictly use Docker Compose to ensure environmental parity.
   ```bash
   # GPU Accelerated Mode (Preferred — requires NVIDIA GPU + Docker GPU support)
   docker-compose up --build -d
   
   # CPU Fallback Mode (No GPU required — uses python:3.10-slim + PyTorch CPU wheels)
   docker-compose -f docker-compose.cpu.yml up --build -d
   ```
4. **Post-Deployment:** Initialize the MongoDB replica set (required once per fresh deploy):
   ```bash
   docker exec -it kfintech_mongo mongosh --eval "rs.initiate()"
   # CPU mode: docker exec -it kfintech_mongo_cpu mongosh --eval "rs.initiate()"
   ```
5. **Commit:** Write clear, concise commit messages detailing *why* the change was made and its *business impact*.
6. **Open a Pull Request:** Ensure your PR template is fully filled out, explicitly stating the metrics improved (e.g., "Reduced LLM inference time by 20%").

## 📏 Code Quality & Standards
- **AI Microservice (Python):** Must adhere to **PEP 8**. Ensure GPU memory management is optimized. Test with both `Dockerfile` (GPU) and `Dockerfile.cpu` (CPU) to ensure cross-platform compatibility.
- **Orchestrator & Frontend (JS/React):** Use **ESLint** and **Prettier**. Maintain the Glassmorphic UI aesthetic with Framer Motion animations.
- **Security:** **NEVER** commit real AWS credentials. The system relies entirely on **LocalStack** for secure, localized S3/SES/SNS simulation.
- **Testing:** Verify your changes work in both GPU and CPU Docker Compose modes before submitting.

## 🏗️ Architecture Notes
- **AI Models:** FinBERT (sentiment), Florence-2 (OCR), Whisper-Tiny (voice), Llama-3.2-3B-Instruct (summarization/chat) — all run in Mock Mode by default for lightweight deployment.
- **Frontend:** React + Vite + TailwindCSS + Framer Motion. 4 role-based dashboards (Investor, L1 Maker, L2 Checker, Super Admin).
- **Backend:** Node.js/Express orchestrator + FastAPI AI microservice + MongoDB ReplicaSet + AWS LocalStack.

Your contributions help us build the future of automated, intelligent financial operations!
