import os
from PIL import Image, ImageDraw

def create_ocr_test_image():
    print("Generating crisp, OCR-ready test document...")
    
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
        "INVESTOR NAME: AMIT SHARMA",
        "FOLIO NUMBER: FL-99482011A",
        "ACCOUNT HOLDER STATUS: PRIMARY RESIDENT",
        "",
        "--------------------------------------------------",
        "REQUESTED CHANGES FOR FUTURE DIVIDEND PAYOUTS:",
        "--------------------------------------------------",
        "NEW TARGET BANK NAME: APEX DEVELOPMENT BANK",
        "NEW ACCOUNT NUMBER: 912010024883109",
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
    output_filename = "investor_statement_q3.png"
    image.save(output_filename, "PNG")
    print("Success! File saved as: " + os.path.abspath(output_filename))
    print("Ready to test against your live EasyOCR API endpoint.")

if __name__ == "__main__":
    create_ocr_test_image()
