"""
generate_demo_images.py
Creates 15 realistic investor complaint images with varied text, fonts and layouts.
"""
import sys, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
from PIL import Image, ImageDraw, ImageFont
import os, textwrap, random

# ── Output directory ──────────────────────────────────────────────────────────
OUT_DIR = os.path.join(os.path.dirname(__file__), "demo_images")
os.makedirs(OUT_DIR, exist_ok=True)

# ── 15 realistic complaints ───────────────────────────────────────────────────
COMPLAINTS = [
    {
        "id": "KFIN-001",
        "subject": "Mutual Fund Redemption Not Received",
        "body": (
            "Dear Sir/Madam,\n\n"
            "I submitted a redemption request for my SBI Blue Chip Fund (Folio: 5823419) "
            "on 14th June 2026 for an amount of Rs. 1,25,000. As of today, the amount has "
            "not been credited to my bank account (HDFC xxxx7821). The SLA for redemption "
            "is T+3 days and it has been over 8 working days. Please resolve this urgently.\n\n"
            "Investor: Rajesh Mehta\nFolio: 5823419\nAmount: Rs. 1,25,000"
        )
    },
    {
        "id": "KFIN-002",
        "subject": "KYC Rejection Without Reason",
        "body": (
            "To The Grievance Officer,\n\n"
            "My KYC application (Ref: KYC2026061402) was rejected without any communication "
            "or reason. I had submitted all required documents — Aadhaar, PAN, and bank proof. "
            "I need to make a new SIP of Rs. 5,000/month in Axis Flexi Cap Fund but cannot "
            "proceed without KYC approval. This is causing financial loss.\n\n"
            "Name: Priya Sharma\nPAN: ABCPS1234F\nEmail: priya.sharma@gmail.com"
        )
    },
    {
        "id": "KFIN-003",
        "subject": "Wrong NAV Applied to Purchase",
        "body": (
            "Respected Authority,\n\n"
            "I placed a purchase order for HDFC Mid Cap Opportunities Fund at 2:30 PM on "
            "June 18, 2026. According to SEBI regulations, orders before 3:00 PM cutoff "
            "should receive same-day NAV. However, I was allotted next-day NAV of Rs. 84.32 "
            "instead of Rs. 83.97. This discrepancy of Rs. 0.35/unit on 500 units is causing "
            "a loss of Rs. 175. Please rectify and reprocess the transaction.\n\n"
            "Transaction ID: TXN2026061803\nFolio: 9901234"
        )
    },
    {
        "id": "KFIN-004",
        "subject": "SIP Auto-Debit Failed for 3 Consecutive Months",
        "body": (
            "Dear KFintech Team,\n\n"
            "My SIP mandate for ICICI Prudential Nifty 50 Index Fund (Folio: 3341288, "
            "SIP Amount: Rs. 10,000/month) has failed for June, July, and August 2026 "
            "despite sufficient balance in my account. My bank (SBI xxxx9012) has confirmed "
            "no debit instructions were received. The SIP start date was March 2026. "
            "I request immediate restoration and backdating of missed installments.\n\n"
            "Client ID: CL09934\nMandate Ref: NACH2026031001"
        )
    },
    {
        "id": "KFIN-005",
        "subject": "Dividend Not Credited — Rs. 32,000 Overdue",
        "body": (
            "To: Grievance Cell, KFintech\n\n"
            "I have been a unit holder of Franklin India Income Opportunities Fund (Folio: 7123456, "
            "IDCW option) since 2018. The dividend declared on May 30, 2026 at Rs. 1.80 per unit "
            "for my 17,800 units amounting to Rs. 32,040 has not been credited. "
            "Bank account: Axis Bank xxxx3311 (IFSC: UTIB0001234). "
            "Please investigate and transfer the amount within 48 hours.\n\n"
            "PAN: GHKPL9087K\nInvestor: Suresh Pillai"
        )
    },
    {
        "id": "KFIN-006",
        "subject": "Folio Merger Request Pending for 45 Days",
        "body": (
            "Subject: Unresolved Folio Consolidation Request\n\n"
            "I submitted a folio consolidation request on May 10, 2026 to merge Folio 1122334 "
            "and Folio 5566778 under the same PAN (XYZAB1234C). After 45 days, no action has "
            "been taken and I have received no update. I hold units worth approximately "
            "Rs. 8,00,000 across both folios. This is affecting my portfolio management.\n\n"
            "Request Ref: CONS2026051001\nName: Ananya Singh\nMobile: 98XXXXXXXX"
        )
    },
    {
        "id": "KFIN-007",
        "subject": "Nominee Registration Not Updated",
        "body": (
            "Grievance Department,\n\n"
            "I submitted a nominee addition form (Form 1) for my Mirae Asset Large Cap Fund "
            "holdings (Folio: 4490123) on June 1, 2026. My nominee is my wife, Mrs. Kavita Verma "
            "(Aadhaar: 8XXX XXXX 1234). Despite 25 days passing, the nominee update is not "
            "reflected in my account. I am a senior citizen aged 72 and this is critical for "
            "estate planning. Please escalate immediately.\n\n"
            "Investor: Ramesh Verma, Age: 72"
        )
    },
    {
        "id": "KFIN-008",
        "subject": "Duplicate Units Showing in Portfolio",
        "body": (
            "Dear Support Team,\n\n"
            "My online portfolio (Login: investor@domain.com) is showing duplicate units for "
            "Kotak Standard Multicap Fund. I hold 250 units (Folio: 6671239) but the portal "
            "shows 500 units. This is causing incorrect valuation display of Rs. 2,14,000 "
            "instead of actual Rs. 1,07,000. I have not made any additional purchase. "
            "This appears to be a system error. Please audit and correct urgently.\n\n"
            "Date Noticed: June 19, 2026\nBrowser: Chrome 126"
        )
    },
    {
        "id": "KFIN-009",
        "subject": "ELSS Lock-in Calculation Error — Tax Filing Impacted",
        "body": (
            "To the Grievance Officer,\n\n"
            "My ELSS investment in DSP Tax Saver Fund (Folio: 2293481, invested March 18, 2023) "
            "should have completed its 3-year lock-in period on March 18, 2026. However, the "
            "system is still showing it as locked. I need to redeem Rs. 50,000 for medical "
            "expenses. This error is also affecting my ITR filing for AY2026-27 under "
            "Section 80C. Please unlock and allow redemption immediately.\n\n"
            "PAN: PANNO5678M\nTax Certificate Attached"
        )
    },
    {
        "id": "KFIN-010",
        "subject": "Account Takeover — Unauthorized Redemption of Rs. 3.2 Lakhs",
        "body": (
            "URGENT — FRAUD COMPLAINT\n\n"
            "I discovered on June 20, 2026 that an unauthorized redemption of Rs. 3,20,000 "
            "was processed from my account (Folio: 8812990) on June 17, 2026 to an unknown "
            "bank account. I did not initiate this transaction. My registered mobile and email "
            "were changed without my knowledge on June 15, 2026. I have filed a police complaint "
            "(FIR No: 2026/DL/00312). Please freeze my account and initiate a fraud investigation.\n\n"
            "Investor: Deepak Gupta\nPolice Station: Rohini, Delhi"
        )
    },
    {
        "id": "KFIN-011",
        "subject": "Name Mismatch Between PAN and Folio",
        "body": (
            "Dear KFintech,\n\n"
            "My folio (3340981) shows the name as 'Anjali K. Nair' but my PAN card name "
            "is 'Anjali Krishnan Nair'. This mismatch is causing rejection of my SWP "
            "(Systematic Withdrawal Plan) requests. I have submitted a name correction request "
            "(Ref: NAMECORR2026001) with notarized affidavit on June 5, 2026 but no resolution "
            "has been provided. Monthly SWP of Rs. 15,000 has been stopped since June.\n\n"
            "Investor: Anjali Krishnan Nair\nPAN: BCDKN4567P"
        )
    },
    {
        "id": "KFIN-012",
        "subject": "STP Switch Between Funds Not Executed",
        "body": (
            "To Whom It May Concern,\n\n"
            "I set up a Systematic Transfer Plan (STP) on June 10, 2026 to transfer "
            "Rs. 20,000/month from Nippon India Liquid Fund (Folio: 9921003) to Nippon India "
            "Multi Cap Fund (Folio: 9921004). The first transfer was due on June 15, 2026 "
            "but was not executed. Rs. 20,000 remains in the liquid fund earning lower returns. "
            "STP Reference: STP2026061001. This is an opportunity loss.\n\n"
            "Name: Vikram Joshi\nMobile: 9XXXXXXXXX"
        )
    },
    {
        "id": "KFIN-013",
        "subject": "Password Reset OTP Not Received — Account Locked",
        "body": (
            "Technical Support,\n\n"
            "I am unable to access my KFintech Nexus investor portal account "
            "(registered email: mohan.das2024@yahoo.in, Mobile: 9876XXXXXX). "
            "I requested a password reset on June 18 and June 19, 2026 but the OTP "
            "was never received on my registered mobile or email. I tried multiple times. "
            "My account got locked after 5 failed attempts. I have upcoming SIP deductions "
            "on June 25 and need access urgently to verify bank mandate.\n\n"
            "Client Code: INV00284673\nLast Login: April 2026"
        )
    },
    {
        "id": "KFIN-014",
        "subject": "Capital Gains Statement Showing Incorrect Data",
        "body": (
            "Dear Accounts Team,\n\n"
            "The Capital Gains statement generated from KFintech for FY 2025-26 shows "
            "incorrect acquisition dates for units of Parag Parikh Flexi Cap Fund (Folio: 1178234). "
            "Units purchased on Jan 10, 2024 are shown as Feb 5, 2024, incorrectly classifying "
            "them as STCG instead of LTCG, resulting in higher tax liability. Gains affected: "
            "Rs. 45,000. I need this corrected before July 31 ITR filing deadline.\n\n"
            "Investor: Meenakshi Rao\nCA Reference: CA/MR/2026/007"
        )
    },
    {
        "id": "KFIN-015",
        "subject": "NFO Allotment Not Received — Cheque Encashed",
        "body": (
            "Subject: Non-receipt of NFO units — Edelweiss Balanced Advantage Fund\n\n"
            "I applied for Edelweiss Balanced Advantage Fund NFO on June 5, 2026 for Rs. 50,000 "
            "via cheque (Cheque No. 001234, ICICI Bank). The cheque was encashed on June 7, 2026 "
            "but no units have been allotted as of June 20, 2026. The NFO closed on June 10, 2026. "
            "Application Form Reference: APP2026060501. Please allot units at NFO price or "
            "refund the amount with interest immediately.\n\n"
            "Distributor ARN: ARN-123456\nPAN: EFGKL3456T"
        )
    },
]

# ── Font helper ───────────────────────────────────────────────────────────────
def get_font(size=16):
    """Try to load a clean system font, fallback to default."""
    candidates = [
        "C:/Windows/Fonts/arial.ttf",
        "C:/Windows/Fonts/calibri.ttf",
        "C:/Windows/Fonts/segoeui.ttf",
        "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
        "/System/Library/Fonts/Helvetica.ttc",
    ]
    for path in candidates:
        if os.path.exists(path):
            try:
                return ImageFont.truetype(path, size)
            except Exception:
                pass
    return ImageFont.load_default()

# ── Image generation ──────────────────────────────────────────────────────────
BACKGROUNDS = ["#FFFFFF", "#F8F9FA", "#FFF8F0", "#F0F4FF", "#F0FFF4"]
BORDER_COLORS = ["#003366", "#800000", "#006633", "#333333", "#8B0000"]

def create_complaint_image(complaint: dict, index: int) -> str:
    """Render a complaint dict as a realistic A4-style document image."""
    W, H = 900, 700
    bg_color = BACKGROUNDS[index % len(BACKGROUNDS)]
    border_color = BORDER_COLORS[index % len(BORDER_COLORS)]

    img = Image.new("RGB", (W, H), bg_color)
    draw = ImageDraw.Draw(img)

    # Border
    draw.rectangle([10, 10, W-10, H-10], outline=border_color, width=3)

    # Header bar
    draw.rectangle([10, 10, W-10, 80], fill=border_color)

    # Logo text in header
    font_logo = get_font(22)
    draw.text((30, 25), "KFintech Nexus — Investor Grievance Portal", fill="#FFFFFF", font=font_logo)

    # Complaint ID + Subject
    font_id   = get_font(13)
    font_sub  = get_font(17)
    font_body = get_font(14)

    draw.text((30, 95), f"Complaint ID: {complaint['id']}    Date: June 2026    Priority: HIGH",
              fill="#555555", font=font_id)

    draw.rectangle([30, 120, W-30, 122], fill=border_color)  # divider

    draw.text((30, 130), f"Subject: {complaint['subject']}", fill=border_color, font=font_sub)

    draw.rectangle([30, 160, W-30, 161], fill="#CCCCCC")  # thin divider

    # Body text — wrap to fit
    body_lines = []
    for para in complaint["body"].split("\n"):
        wrapped = textwrap.wrap(para, width=95) if para.strip() else [""]
        body_lines.extend(wrapped)

    y = 172
    for line in body_lines:
        if y > H - 50:
            draw.text((30, y), "... [continued]", fill="#999999", font=font_body)
            break
        draw.text((30, y), line, fill="#222222", font=font_body)
        y += 20

    # Footer
    draw.rectangle([10, H-45, W-10, H-10], fill="#EEEEEE")
    draw.text((30, H-35), f"Generated by KFintech Test Suite | ID: {complaint['id']} | Confidential",
              fill="#888888", font=font_id)

    out_path = os.path.join(OUT_DIR, f"{complaint['id']}.png")
    img.save(out_path, "PNG")
    return out_path


if __name__ == "__main__":
    print(f"\n[IMG] Generating {len(COMPLAINTS)} demo complaint images -> {OUT_DIR}\n")
    paths = []
    for i, c in enumerate(COMPLAINTS):
        path = create_complaint_image(c, i)
        paths.append(path)
        print(f"  [OK] {c['id']}: {c['subject'][:60]}")
    print(f"\n[DONE] {len(paths)} images saved in: {OUT_DIR}\n")
