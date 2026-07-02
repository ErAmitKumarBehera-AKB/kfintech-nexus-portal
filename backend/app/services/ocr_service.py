import re
import difflib

import threading

_reader = None
_reader_lock = threading.Lock()

def get_reader():
    global _reader
    if _reader is None:
        with _reader_lock:
            if _reader is None:
                try:
                    import easyocr
                    import torch
                    _reader = easyocr.Reader(['en'], gpu=torch.cuda.is_available())
                except Exception as e:
                    print(f"EasyOCR Init Failed: {e}")
    return _reader

def extract_and_verify(images: list[bytes], account_number: str):
    reader = get_reader()
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

def extract_and_verify_kyc(images: list[bytes], target_name: str, target_dob: str):
    reader = get_reader()
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
    
    clean_name = re.sub(r'[^A-Z0-9]', '', target_name.upper()) if target_name else ""
    
    dob_variations = []
    if target_dob:
        m = re.match(r'^(\d{4})-(\d{2})-(\d{2})$', target_dob)
        if m:
            y, m_num, d = m.groups()
            dob_variations.extend([
                f"{d}{m_num}{y}",  # DDMMYYYY (Standard Indian KYC format)
                f"{y}{m_num}{d}",  # YYYYMMDD
                y                  # YYYY (Many older Aadhaars only have year)
            ])
        else:
            dob_variations.append(re.sub(r'[^A-Z0-9]', '', target_dob.upper()))

    name_found = False
    dob_found = False

    if clean_name:
        w_name = len(clean_name)
        if w_name > 0 and len(clean_extracted) >= w_name:
            score_name = max((difflib.SequenceMatcher(None, clean_name, clean_extracted[i:i+w_name]).ratio() 
                         for i in range(len(clean_extracted) - w_name + 1)), default=0.0)
            name_found = score_name >= 0.80
        else:
            name_found = clean_name in clean_extracted

    if dob_variations:
        for var in dob_variations:
            w_dob = len(var)
            if w_dob > 0 and len(clean_extracted) >= w_dob:
                score_dob = max((difflib.SequenceMatcher(None, var, clean_extracted[i:i+w_dob]).ratio() 
                             for i in range(len(clean_extracted) - w_dob + 1)), default=0.0)
                if score_dob >= 0.85:
                    dob_found = True
                    break

    match_found = (name_found if target_name else True) and (dob_found if target_dob else True)

    msg = f"KYC Verification: {'Successful' if match_found else 'Failed'}."
    if target_name: msg += f" Name: {'Found' if name_found else 'Missing'}."
    if target_dob: msg += f" DOB: {'Found' if dob_found else 'Missing'}."

    return match_found, all_blocks, msg
