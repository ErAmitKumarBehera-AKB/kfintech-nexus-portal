import os
from PIL import Image, ImageDraw

def create_ocr_test_image(name, account_number, filename):
    print(f"Generating crisp, OCR-ready test document for {name}...")
    
    # 1. Create a high-resolution crisp white canvas (800x1000 pixels)
    width, height = 800, 1000
    image = Image.new("RGB", (width, height), color=(255, 255, 255))
    draw = ImageDraw.Draw(image)
    
    # 2. Structured structured text payload optimized for EasyOCR coordinates
    lines = [
        "==================================================",
        "      KFINTECH NEXUS PORTAL - INVESTOR SERVICES   ",
        "==================================================",
        "TICKET DATA RECONCILIATION FILE",
        "TICKET ID: 6a3922c5fe092faaee21dfcf",
        "DOCUMENT TYPE: ACCOUNTS & DIVIDEND SERVICE UPDATE",
        "",
        "--------------------------------------------------",
        "INVESTOR PROFILE DETAILS:",
        "--------------------------------------------------",
        f"INVESTOR NAME: {name.upper()}",
        "FOLIO NUMBER: FL-99482011A",
        "ACCOUNT HOLDER STATUS: PRIMARY RESIDENT",
        "",
        "--------------------------------------------------",
        "REQUESTED CHANGES FOR FUTURE DIVIDEND PAYOUTS:",
        "--------------------------------------------------",
        "NEW TARGET BANK NAME: APEX DEVELOPMENT BANK",
        f"NEW ACCOUNT NUMBER: {account_number}",
        "NEW TARGET IFSC CODE: KFIN0004112",
        "",
        "==================================================",
        " VALIDATION SIGNATURE BLOCK - NEXUS AI SECURE",
        "=================================================="
    ]
    
    # 3. Draw text lines down the canvas using clean layout intervals
    y_position = 50
    line_spacing = 35
    
    for line in lines:
        # Using default bitmap font to prevent missing font errors across OS environments
        draw.text((60, y_position), line, fill=(0, 0, 0))
        y_position += line_spacing
        
    # 4. Save directly as a clean image file
    image.save(filename, "PNG")
    print("Success! File saved as: " + os.path.abspath(filename))

if __name__ == "__main__":
    users = [
        ("Amit Sharma", "912010024883109", "investor_statement_q3.png"),
        ("Priya Sharma", "1122334455", "investor_statement_priya.png"),
        ("John Doe", "1111111111", "investor_statement_john.png"),
        ("Jane Smith", "9999999999", "investor_statement_jane.png")
    ]
    
    for user in users:
        create_ocr_test_image(*user)
    print("Ready to test against your live EasyOCR API endpoint.")
