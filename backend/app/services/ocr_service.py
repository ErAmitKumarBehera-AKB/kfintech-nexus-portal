import re
import difflib

try:
    import easyocr
    import torch
    reader = easyocr.Reader(['en'], gpu=torch.cuda.is_available())
except Exception as e:
    reader, print_err = None, print(f"EasyOCR Init Failed: {e}")

def extract_and_verify(images: list[bytes], account_number: str):
    if not reader: return False, [], "OCR Engine Offline"
    if not images: return False, [], "No images provided"

    all_blocks = []
    for img in images:
        try:
            res = reader.readtext(img)
            all_blocks.extend([text for (_, text, _) in res])
        except Exception as e:
            print(f"OCR Error on an image: {e}")

    if not all_blocks:
        return False, [], "Image quality too poor or no text detected across provided documents."

    combined = " ".join(all_blocks).upper()
    clean_extracted = re.sub(r'[^A-Z0-9]', '', combined)
    clean_acc = re.sub(r'[^A-Z0-9]', '', account_number.upper())

    # 1. Field Extraction (e.g. IFSC)
    fields = {}
    if ifsc := re.search(r'[A-Z]{4}0[A-Z0-9]{6}', combined):
        fields['IFSC'] = ifsc.group(0)

    # 2. Account Verification & Confidence Scoring
    if not clean_acc:
        acc_found, score = False, 0.0
    else:
        acc_found, score = clean_acc in clean_extracted, 1.0
    
    if not acc_found and clean_acc and len(clean_extracted) >= len(clean_acc):
        # Optimized Fuzzy Matching via SequenceMatcher on window slices
        w = len(clean_acc)
        score = max((difflib.SequenceMatcher(None, clean_acc, clean_extracted[i:i+w]).ratio() 
                     for i in range(len(clean_extracted) - w + 1)), default=0.0)
        acc_found = score >= 0.85

    # 3. Message formatting
    msg = f"Account '{account_number}' {'verified' if acc_found else 'not found'} (Confidence: {score:.2f})."
    msg += f" Extracted Fields: {fields}" if fields else ""
    if not acc_found and score < 0.4: msg += " The image may be too blurry."

    return acc_found, all_blocks, msg
