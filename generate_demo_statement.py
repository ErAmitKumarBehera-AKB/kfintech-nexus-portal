from PIL import Image, ImageDraw, ImageFont
import os

def create_demo_statement(name, account_number, filename):
    img = Image.new('RGB', (800, 600), color = 'white')
    d = ImageDraw.Draw(img)

    text = f"""
KFintech Nexus Bank

STATEMENT OF ACCOUNT
-----------------------------------
Investor Name: {name}
Account Number: {account_number}

Transaction History:
01/01/2026 - Initial Deposit - $10,000
15/01/2026 - Mutual Fund Transfer - $5,000

Thank you for banking with us!
"""

    try:
        font = ImageFont.truetype("arial.ttf", 36)
    except:
        font = ImageFont.load_default()

    d.text((50, 50), text, fill=(0,0,0), font=font)

    output_path = rf"c:\Users\Nerd repair centre\Desktop\models\frontend\public\{filename}"
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    img.save(output_path)
    print(f"Successfully generated demo statement at {output_path}")

users = [
    ("Amit", "9876543210", "demo_statement_amit.png"),
    ("Priya Sharma", "1122334455", "demo_statement_priya.png"),
    ("John Doe", "1111111111", "demo_statement_john.png"),
    ("Jane Smith", "9999999999", "demo_statement_jane.png")
]

for user in users:
    create_demo_statement(*user)
