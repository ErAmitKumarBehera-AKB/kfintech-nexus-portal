from fastapi import APIRouter, File, UploadFile, Form, HTTPException
from pydantic import BaseModel
import io
import re
import difflib

from transformers import AutoProcessor, AutoModelForCausalLM, PretrainedConfig
# Patch for newer transformers versions with Florence-2
if not hasattr(PretrainedConfig, "forced_bos_token_id"):
    PretrainedConfig.forced_bos_token_id = None

from PIL import Image
import torch

try:
    import transformers.dynamic_module_utils
    transformers.dynamic_module_utils.check_imports = lambda *args, **kwargs: []
except Exception:
    pass

router = APIRouter()

class OCRVerificationResponse(BaseModel):
    account_found: bool
    investor_name_found: bool
    all_details_found: bool
    verification_details: dict
    extracted_text: list[str]
    message: str

device = "cuda" if torch.cuda.is_available() else "cpu"
torch_dtype = torch.bfloat16

print(f"[AI] Loading Florence-2 (High-Intelligence OCR) on {device}...")
try:
    model_id = "microsoft/Florence-2-base"
    processor = AutoProcessor.from_pretrained(model_id, trust_remote_code=True)
    model = AutoModelForCausalLM.from_pretrained(model_id, torch_dtype=torch_dtype, trust_remote_code=True).to(device)
    print("[AI] Florence-2 loaded successfully!")
except Exception as e:
    import traceback
    traceback.print_exc()
    print(f"[ERROR] Failed to load Florence-2: {e}")
    model = None
    processor = None

def run_florence_ocr(image_bytes: bytes) -> list[str]:
    if model is None or processor is None:
        return ["[ERROR] Florence-2 model is not loaded. Cannot perform OCR."]
    
    try:
        image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        task_prompt = "<OCR>"
        
        inputs = processor(text=task_prompt, images=image, return_tensors="pt").to(device, torch_dtype)
        
        generated_ids = model.generate(
            input_ids=inputs["input_ids"],
            pixel_values=inputs["pixel_values"],
            max_new_tokens=1024,
            num_beams=3
        )
        
        generated_text = processor.batch_decode(generated_ids, skip_special_tokens=False)[0]
        parsed_answer = processor.post_process_generation(generated_text, task=task_prompt, image_size=(image.width, image.height))
        
        # Florence-2 returns a dict with the task_prompt as the key
        extracted_text = parsed_answer.get(task_prompt, "")
        return [extracted_text]
    except Exception as e:
        print(f"Florence-2 generation failed: {e}")
        return [f"[ERROR] OCR failed: {str(e)}"]


@router.post("/verify-account", response_model=OCRVerificationResponse)
async def verify_account(
    account_number: str = Form(..., description="The account number to verify"),
    investor_name: str = Form(None, description="The investor name to verify"),
    dob: str = Form(None, description="The CRM Date of Birth to verify (YYYY-MM-DD)"),
    file: UploadFile = File(..., description="The image of the document (e.g. check, statement)")
):
    content_type = file.content_type or ""
    if not content_type.startswith('image/') and not content_type.startswith('application/pdf'):
        raise HTTPException(status_code=400, detail="File provided is not an image or PDF, or missing content-type.")

    # Read file (consume the bytes so the upload succeeds normally)
    image_bytes = await file.read()

    # Use Florence-2 OCR
    extracted_text_blocks = run_florence_ocr(image_bytes)

    # Character normalization and fuzzy matching logic (identical to real Florence-2 flow)
    combined_text = " ".join(extracted_text_blocks).upper()

    # Strip everything except alphanumeric characters
    clean_extracted = re.sub(r'[^A-Z0-9]', '', combined_text)
    clean_account = re.sub(r'[^A-Z0-9]', '', account_number.upper())

    # First do exact match check
    account_found = clean_account in clean_extracted

    # If not exactly found, perform fuzzy matching
    if not account_found and len(clean_account) > 0 and len(clean_extracted) >= len(clean_account):
        window_size = len(clean_account)
        for i in range(len(clean_extracted) - window_size + 1):
            window = clean_extracted[i:i + window_size + 1]
            ratio = difflib.SequenceMatcher(None, clean_account, window).ratio()
            if ratio >= 0.85:
                account_found = True
                break
                
    investor_name_found = True
    if investor_name and investor_name.strip().upper() != 'UNKNOWN INVESTOR':
        clean_name = re.sub(r'[^A-Z0-9]', '', investor_name.upper())
        if len(clean_name) > 0:
            investor_name_found = clean_name in clean_extracted
            if not investor_name_found and len(clean_extracted) >= len(clean_name):
                window_size = len(clean_name)
                for i in range(len(clean_extracted) - window_size + 1):
                    window = clean_extracted[i:i + window_size + 1]
                    ratio = difflib.SequenceMatcher(None, clean_name, window).ratio()
                    if ratio >= 0.85:
                        investor_name_found = True
                        break

    all_details_found = account_found and investor_name_found

    verification_details = {
        "Account Number": account_found
    }
    if investor_name and investor_name.strip().upper() != 'UNKNOWN INVESTOR':
        verification_details["Investor Name"] = investor_name_found

    if dob:
        # Check if ANY date format is present in the document
        any_dob_match = re.search(r'\b(\d{2}[-/.]\d{2}[-/.]\d{4})\b', combined_text)
        
        if any_dob_match:
            try:
                parts = dob.split('T')[0].split('-')
                if len(parts) == 3:
                    y, m, d = parts
                    dob_format_1 = f"{d}/{m}/{y}"
                    dob_format_2 = f"{d}-{m}-{y}"
                    dob_format_3 = f"{d}.{m}.{y}"
                    
                    dob_found = (dob_format_1 in combined_text) or (dob_format_2 in combined_text) or (dob_format_3 in combined_text)
                    verification_details["Date of Birth"] = dob_found
                    
                    if not dob_found:
                        all_details_found = False
            except Exception as e:
                print(f"Error parsing DOB: {e}")
                pass
        else:
            verification_details["Date of Birth"] = "Not Present on Document"
    else:
        # Extract Date of Birth if present (DD/MM/YYYY or DD-MM-YYYY)
        dob_match = re.search(r'\b(\d{2}[-/.]\d{2}[-/.]\d{4})\b', combined_text)
        if dob_match:
            verification_details["Extracted DOB"] = dob_match.group(1)
        else:
            # Check for year of birth only (common in some older Aadhar cards)
            yob_match = re.search(r'(?:YOB|YEAR OF BIRTH)\s*:?\s*(\d{4})', combined_text)
            if yob_match:
                verification_details["Extracted YOB"] = yob_match.group(1)

    if all_details_found:
        message = f"All details successfully verified in document."
    else:
        message = f"Could not verify all details in document."

    return OCRVerificationResponse(
        account_found=account_found,
        investor_name_found=investor_name_found,
        all_details_found=all_details_found,
        verification_details=verification_details,
        extracted_text=extracted_text_blocks,
        message=message
    )
