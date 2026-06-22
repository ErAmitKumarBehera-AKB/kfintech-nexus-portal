---
name: Bug report
about: Report a system anomaly impacting Nexus workflows or AI accuracy.
title: '[BUG] '
labels: 'bug, needs triage'
assignees: ''
---

## 🐛 Defect Description
A clear and concise description of the defect, emphasizing its impact on the **business process** (e.g., "OCR fails on high-noise scans, leading to manual review bottlenecks").

## 🔄 Reproduction Steps
1. Navigate to '...'
2. Trigger action '....'
3. Observe anomaly: '....'

## 🎯 Expected Business Outcome
What should the system have done? (e.g., "The system should flag the document as invalid and hold the ticket in L1 rather than failing silently.")

## 📊 Impact & Severity
- [ ] Critical (Halts Maker/Checker Workflow or Data Corruption)
- [ ] High (AI Model inaccuracy > 10%)
- [ ] Medium (UI/UX defect, workarounds exist)
- [ ] Low (Cosmetic)

## 📸 Evidence (Logs / Screenshots)
Add any relevant Docker logs (`docker logs kfintech_backend`), LocalStack traces, or UI screenshots.

## 🖥️ Environment Profile:
 - OS: [e.g. Windows, macOS, Linux]
 - GPU Mode active? [Yes/No]
 - LocalStack Version: [e.g. 2.3.2]
