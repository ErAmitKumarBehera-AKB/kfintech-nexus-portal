from PIL import Image, ImageDraw, ImageFont
import os

# Create a blank white image
img = Image.new('RGB', (800, 600), color = 'white')
d = ImageDraw.Draw(img)

# Try to use a default font, or load a basic one if available
# We will just draw text
text = """
KFintech Nexus Bank

STATEMENT OF ACCOUNT
-----------------------------------
Investor Name: Amit
Account Number: 9876543210

Transaction History:
01/01/2026 - Initial Deposit - $10,000
15/01/2026 - Mutual Fund Transfer - $5,000

Thank you for banking with us!
"""

try:
    font = ImageFont.truetype("arial.ttf", 36)
except:
    font = ImageFont.load_default()

# Draw text on image (scaled up)
d.text((50, 50), text, fill=(0,0,0), font=font)

# Save the image directly to the frontend public folder
output_path = r"c:\Users\Nerd repair centre\Desktop\models\frontend\public\demo_statement.png"
os.makedirs(os.path.dirname(output_path), exist_ok=True)
img.save(output_path)
print(f"Successfully generated demo statement at {output_path}")
