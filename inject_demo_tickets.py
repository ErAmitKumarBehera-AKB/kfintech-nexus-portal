import requests
import time
import json
import io

NODE_API_URL = "http://localhost:5000/api/tickets"

demo_tickets = [
    {
        "description": "Extreme Panic (Urgent)",
        "complaintText": "I've been hacked! My entire portfolio was liquidated this morning without my permission. I need someone to freeze my account instantly before all my funds are withdrawn!"
    },
    {
        "description": "Happy Investor (Positive)",
        "complaintText": "I just saw the new analytics dashboard and it is absolutely brilliant. It perfectly highlights my dividend yield history. Great job to the development team!"
    },
    {
        "description": "Routine Maintenance (Neutral)",
        "complaintText": "Could you please send me the forms required to change the nominee on my mutual fund folio? I would like to add my spouse."
    },
    {
        "description": "Legal Threat (Severe Frustration)",
        "complaintText": "It has been 45 days since my KYC update request. I have emailed you 10 times with zero response. If this is not resolved today, I am filing a formal complaint with the SEC."
    },
    {
        "description": "Mild Annoyance (Minor Bug)",
        "complaintText": "The mobile app keeps crashing every time I try to view my tax statements. It's quite annoying, please look into fixing this bug soon."
    }
]

def inject_tickets():
    print("Waiting for AI Backend (GPU Server) to finish downloading FinBERT at localhost:8000...")
    
    # Wait for the AI Backend to become available
    retries = 120 # Wait up to 10 minutes
    while retries > 0:
        try:
            res = requests.get("http://localhost:8000/")
            if res.status_code == 200:
                print("AI GPU Backend is UP and FinBERT is loaded!")
                break
        except requests.exceptions.ConnectionError:
            time.sleep(5)
            retries -= 1
            print(f"Still downloading AI models... ({retries} checks left)")
            
    if retries == 0:
        print("Error: AI Backend did not start in time.")
        return

    print("Waiting for Node Service at localhost:5000...")
    retries = 10
    while retries > 0:
        try:
            res = requests.get("http://localhost:5000/")
            break
        except requests.exceptions.ConnectionError:
            time.sleep(5)
            retries -= 1
    
    print("Node Service is UP! Injecting Demo Tickets...")
    
    try:
        from PIL import Image, ImageDraw
    except ImportError:
        import os
        os.system("pip install Pillow")
        from PIL import Image, ImageDraw
        
    for i, t in enumerate(demo_tickets):
        print(f"\n--- Injecting Ticket {i+1}: {t['description']} ---")
        
        # Generate high-resolution crisp white canvas
        width, height = 800, 1000
        img = Image.new("RGB", (width, height), color=(255, 255, 255))
        d = ImageDraw.Draw(img)
        
        lines = [
            "==================================================",
            "      KFINTECH NEXUS PORTAL - INVESTOR SERVICES   ",
            "==================================================",
            "TICKET DATA RECONCILIATION FILE",
            f"TICKET ID: DEMO_TKT_{i}",
            "DOCUMENT TYPE: ACCOUNTS & DIVIDEND SERVICE UPDATE",
            "",
            "--------------------------------------------------",
            "INVESTOR PROFILE DETAILS:",
            "--------------------------------------------------",
            "INVESTOR NAME: JOHN DOE",
            f"FOLIO NUMBER: FL-99482011{i}",
            "ACCOUNT HOLDER STATUS: PRIMARY RESIDENT",
            "",
            "--------------------------------------------------",
            "REQUESTED CHANGES FOR FUTURE DIVIDEND PAYOUTS:",
            "--------------------------------------------------",
            "NEW TARGET BANK NAME: APEX DEVELOPMENT BANK",
            f"NEW ACCOUNT NUMBER: 12345678{i}",
            f"NEW TARGET IFSC CODE: KFIN000411{i}",
            "",
            "==================================================",
            " VALIDATION SIGNATURE BLOCK - NEXUS AI SECURE",
            "=================================================="
        ]
        
        y_position = 50
        line_spacing = 35
        for line in lines:
            d.text((60, y_position), line, fill=(0, 0, 0))
            y_position += line_spacing
        
        img_byte_arr = io.BytesIO()
        img.save(img_byte_arr, format='PNG')
        img_byte_arr.seek(0)
        
        files = {
            'file': ('document.png', img_byte_arr, 'image/png')
        }
        data = {
            "complaintText": t['complaintText'],
            "accountNumber": f"12345678{i}"
        }
        
        try:
            res = requests.post("http://localhost:5000/api/tickets", data=data, files=files)
            if res.status_code == 201:
                print(f"Success! Ticket ID: {res.json()['ticket']['_id']}")
                print(f"AI Assigned Priority: {res.json()['ticket']['assignedPriority']}")
                print(f"AI Frustration Index: {res.json()['ticket']['aiSentimentScore']}")
                print(f"AI Insights: {res.json()['ticket']['aiSummary']}")
                print(f"OCR Extracted: {res.json()['ticket']['ocrExtractedText']}")
            else:
                print(f"Failed! Status Code: {res.status_code}, Response: {res.text}")
        except Exception as e:
            print(f"Exception: {e}")
            
        time.sleep(1) # brief pause between tickets

if __name__ == "__main__":
    inject_tickets()
