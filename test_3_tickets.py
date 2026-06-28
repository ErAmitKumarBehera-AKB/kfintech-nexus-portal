"""
3-Ticket End-to-End Test Script
Investor → L1 Escalate → L2 Approve + LocalStack SMS/Email
"""
import requests
import io
import json
import time
from PIL import Image, ImageDraw

NODE_URL = "http://localhost:5000/api"
AI_URL   = "http://localhost:8000"

# ── Credentials ──
INVESTOR_EMAIL = "investor@kfintech.com"
L1_EMAIL       = "l1agent@kfintech.com"
L2_EMAIL       = "l2agent@kfintech.com"
PASSWORD       = "KFintech@2026"

TICKETS = [
    {
        "title": "🚨 Fraudulent Liquidation Alert",
        "complaint": (
            "I've been hacked! My entire portfolio was liquidated this morning "
            "without my permission. Freeze my account immediately!"
        ),
        "account": "9876543210",
    },
    {
        "title": "📊 Analytics Dashboard Praise",
        "complaint": (
            "The new analytics dashboard is absolutely brilliant! "
            "It perfectly highlights my dividend yield history. Great job team!"
        ),
        "account": "1111111111",
    },
    {
        "title": "📝 Nominee Change Request",
        "complaint": (
            "Could you send the forms to change the nominee on my mutual fund folio? "
            "I would like to add my spouse as the nominee."
        ),
        "account": "2222222222",
    },
]


def login(email):
    r = requests.post(f"{NODE_URL}/auth/login", json={"email": email, "password": PASSWORD})
    r.raise_for_status()
    token = r.json().get("accessToken")
    print(f"  ✅ Logged in: {email}")
    return token


def make_doc_image(ticket_num, account, complaint):
    """Generate a realistic-looking document PNG in memory."""
    img = Image.new("RGB", (800, 600), color=(255, 255, 255))
    d = ImageDraw.Draw(img)
    lines = [
        "==================================================",
        "   KFINTECH NEXUS PORTAL - INVESTOR SERVICES      ",
        "==================================================",
        f"TICKET ID  : LIVE_TEST_{ticket_num}",
        f"ACCOUNT NO : {account}",
        "INVESTOR   : DEMO INVESTOR",
        "DATE       : 2026-06-27",
        "--------------------------------------------------",
        f"COMPLAINT  : {complaint[:60]}",
        "==================================================",
        "       NEXUS AI SECURE PROCESSING BLOCK           ",
        "==================================================",
    ]
    y = 40
    for line in lines:
        d.text((50, y), line, fill=(0, 0, 0))
        y += 38
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    buf.seek(0)
    return buf


def check_ocr(ticket_id, investor_token):
    """Direct OCR test via Python AI backend to show OCR model output."""
    print(f"\n  🔬 OCR Model Test — Ticket {ticket_id}")
    try:
        r = requests.post(
            f"{AI_URL}/ocr/verify-account",
            data={"account_number": "9876543210"},
            files={"file": ("doc.png", make_doc_image("OCR_TEST", "9876543210", "OCR model verification test"), "image/png")},
            timeout=30,
        )
        if r.ok:
            data = r.json()
            print(f"    Extracted Text  : {data.get('extracted_text', 'N/A')[:120]}")
            print(f"    Account Found   : {data.get('account_found')}")
            print(f"    Match Score     : {data.get('match_score', 'N/A')}")
        else:
            print(f"    OCR HTTP {r.status_code}: {r.text[:100]}")
    except Exception as e:
        print(f"    OCR error: {e}")


def run():
    print("\n" + "="*60)
    print("  KFintech Nexus — 3-Ticket E2E Test")
    print("="*60)

    # ── Step 1: Login all users ──
    print("\n[1] Authenticating users...")
    investor_token = login(INVESTOR_EMAIL)
    l1_token       = login(L1_EMAIL)
    l2_token       = login(L2_EMAIL)

    # ── Step 2: OCR Model Output Check ──
    print("\n[2] OCR Model Direct Test...")
    check_ocr("PRE_TEST", investor_token)

    created_ids = []

    # ── Step 3: Investor raises 3 tickets ──
    print("\n[3] Investor raising 3 tickets...")
    for i, tkt in enumerate(TICKETS):
        doc_buf = make_doc_image(i + 1, tkt["account"], tkt["complaint"])
        r = requests.post(
            f"{NODE_URL}/tickets",
            data={"complaintText": tkt["complaint"], "accountNumber": tkt["account"]},
            files={"file": ("document.png", doc_buf, "image/png")},
            headers={"Authorization": f"Bearer {investor_token}"},
        )
        if r.status_code == 201:
            tid = r.json()["ticket"]["_id"]
            created_ids.append(tid)
            ticket = r.json()["ticket"]
            print(f"\n  Ticket {i+1}: {tkt['title']}")
            print(f"    ID            : {tid}")
            print(f"    Status        : {ticket.get('status')}")
            print(f"    Priority      : {ticket.get('assignedPriority', 'N/A')}")
            print(f"    Sentiment     : {ticket.get('aiSentimentScore', 'N/A')}")
            print(f"    Fraud Flag    : {ticket.get('isPotentialFraud', 'N/A')}")
            print(f"    OCR Verified  : {ticket.get('ocrMatchVerified', 'N/A')}")
            ocr = ticket.get("ocrExtractedText", "None")
            print(f"    OCR Extract   : {ocr[:100] if ocr else 'None'}...")
            summary = ticket.get("aiSummary", [])
            print(f"    AI Summary    : {json.dumps(summary)[:120]}")
        else:
            print(f"  ❌ Ticket {i+1} FAILED: {r.status_code} — {r.text[:100]}")
        time.sleep(1)

    if not created_ids:
        print("\n❌ No tickets created. Aborting.")
        return

    # ── Step 4: L1 escalates all tickets to L2 ──
    print(f"\n[4] L1 Maker escalating {len(created_ids)} tickets to L2...")
    for i, tid in enumerate(created_ids):
        r = requests.put(
            f"{NODE_URL}/admin/escalate/{tid}",
            json={"notes": f"L1 Review complete. Escalating ticket {i+1} to L2 checker."},
            headers={"Authorization": f"Bearer {l1_token}"},
        )
        status = "✅ Escalated" if r.ok else f"❌ Failed ({r.status_code})"
        print(f"  Ticket {i+1} ({tid[:12]}...) → {status}")
        if not r.ok:
            print(f"    Response: {r.text[:100]}")
        time.sleep(0.5)

    # ── Step 5: L2 approves all tickets ──
    print(f"\n[5] L2 Checker approving all tickets (triggers LocalStack SES + SNS)...")
    for i, tid in enumerate(created_ids):
        r = requests.post(
            f"{NODE_URL}/l2/finalize",
            json={
                "ticketId": tid,
                "action": "APPROVE",
                "notes": f"Verified and approved by L2 checker. Ticket {i+1} cleared."
            },
            headers={"Authorization": f"Bearer {l2_token}"},
        )
        if r.ok:
            ticket = r.json().get("ticket", {})
            print(f"\n  Ticket {i+1} ({tid[:12]}...) → ✅ APPROVED & RESOLVED")
            print(f"    Final Status  : {ticket.get('status')}")
        else:
            print(f"\n  Ticket {i+1} ({tid[:12]}...) → ❌ L2 Approve failed ({r.status_code})")
            print(f"    Error: {r.text[:120]}")
        time.sleep(0.5)

    print("\n" + "="*60)
    print("  ✅ End-to-End Test Complete!")
    print("  📧 LocalStack SES emails sent to: investor@kfintech.com")
    print("  📲 LocalStack SNS SMS sent to investor's registered phone")
    print("="*60 + "\n")


if __name__ == "__main__":
    run()
