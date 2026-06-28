"""
run_florence_test.py
Sends all demo images to Florence-2 OCR + Llama summarize endpoints.
Prints a clean per-complaint report.
"""
import sys, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

import os, requests, time

BACKEND_URL = "http://localhost:8000"
IMG_DIR = os.path.join(os.path.dirname(__file__), "demo_images")

# ── API helpers ───────────────────────────────────────────────────────────────
def test_ocr(image_path: str, account_number: str = "TEST0000") -> dict:
    try:
        with open(image_path, "rb") as f:
            resp = requests.post(
                f"{BACKEND_URL}/ocr/verify-account",
                files={"file": (os.path.basename(image_path), f, "image/png")},
                data={"account_number": account_number},
                timeout=120
            )
        if resp.status_code == 200:
            return resp.json()
        return {"error": f"HTTP {resp.status_code}: {resp.text[:200]}"}
    except Exception as e:
        return {"error": str(e)}

def test_summarize(text: str) -> dict:
    try:
        resp = requests.post(
            f"{BACKEND_URL}/summarize/analyze",
            json={"text": text},
            timeout=180
        )
        if resp.status_code == 200:
            return resp.json()
        return {"error": f"HTTP {resp.status_code}: {resp.text[:200]}"}
    except Exception as e:
        return {"error": str(e)}

def health_check() -> bool:
    try:
        r = requests.get(f"{BACKEND_URL}/health", timeout=10)
        return r.status_code == 200
    except Exception:
        return False

def sep(title=""):
    print("\n" + "=" * 80)
    if title:
        print(f"  {title}")
        print("=" * 80)

# ── Static bullets that Llama should NOT produce ─────────────────────────────
GENERIC_BULLETS = {
    "Investor complaint received and logged.",
    "AI analysis flagged potential priority issue.",
    "Manual review recommended by compliance team."
}

# ── Main ──────────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    sep("KFintech Florence-2 OCR + Llama Summarize -- End-to-End Test")
    print(f"  Backend : {BACKEND_URL}")
    print(f"  Images  : {IMG_DIR}")

    # Wait for backend to be ready
    print("\n[WAIT] Waiting for backend to be ready...")
    for i in range(30):
        if health_check():
            print("[OK] Backend is healthy!\n")
            break
        print(f"  Retry {i+1}/30...", end="\r")
        time.sleep(2)
    else:
        print("[FAIL] Backend not reachable after 60s. Make sure containers are running.")
        sys.exit(1)

    # Find all images
    if not os.path.isdir(IMG_DIR):
        print(f"[FAIL] Image directory not found: {IMG_DIR}")
        print("       Run 'python generate_demo_images.py' first.")
        sys.exit(1)

    images = sorted([
        os.path.join(IMG_DIR, f)
        for f in os.listdir(IMG_DIR)
        if f.lower().endswith(".png")
    ])

    if not images:
        print(f"[FAIL] No PNG images in {IMG_DIR}. Run generate_demo_images.py first.")
        sys.exit(1)

    print(f"[INFO] Found {len(images)} demo images\n")

    ocr_success  = 0
    llm_success  = 0
    generic_count = 0
    results = []

    for idx, img_path in enumerate(images, 1):
        img_name = os.path.basename(img_path)
        sep(f"Test {idx}/{len(images)} -- {img_name}")

        # ── Florence-2 OCR ────────────────────────────────────────────────────
        print("[OCR] Running Florence-2...")
        t0 = time.time()
        ocr = test_ocr(img_path)
        ocr_elapsed = round(time.time() - t0, 1)

        if "error" in ocr:
            print(f"  [FAIL] OCR error: {ocr['error']}")
            extracted = ""
        else:
            extracted = " ".join(ocr.get("extracted_text", []))
            chars = len(extracted)
            print(f"  [OK] OCR done in {ocr_elapsed}s -- {chars} chars extracted")
            print(f"  [PREVIEW] {extracted[:250]}{'...' if chars > 250 else ''}")
            ocr_success += 1

        # ── Llama Summarize ───────────────────────────────────────────────────
        if len(extracted) > 30:
            print(f"\n[LLM] Running Llama-3.2 Summarize...")
            t1 = time.time()
            summ = test_summarize(extracted)
            llm_elapsed = round(time.time() - t1, 1)

            if "error" in summ:
                print(f"  [FAIL] Summarize error: {summ['error']}")
                bullets = []
            else:
                bullets = summ.get("bullets", [])
                is_generic = any(b in GENERIC_BULLETS for b in bullets)
                status = "[WARN] GENERIC STATIC RESPONSE" if is_generic else "[OK] UNIQUE & SPECIFIC"
                print(f"  {status}  ({llm_elapsed}s)")
                for i, b in enumerate(bullets, 1):
                    print(f"    [{i}] {b}")
                llm_success += 1
                if is_generic:
                    generic_count += 1
        else:
            print("\n[SKIP] No usable OCR text -- skipping summarize step")
            bullets = []

        results.append({
            "image": img_name,
            "ocr_ok": "error" not in ocr,
            "chars": len(extracted),
            "bullets": bullets
        })

    # ── Summary report ────────────────────────────────────────────────────────
    sep("FINAL REPORT")
    print(f"  Total images tested     : {len(images)}")
    print(f"  Florence-2 OCR passed   : {ocr_success}/{len(images)}")
    print(f"  Llama Summarize passed  : {llm_success}/{len(images)}")
    print(f"  Generic/static bullets  : {generic_count}  (target: 0)")
    print()

    if ocr_success == len(images) and generic_count == 0:
        print("  [PASS] ALL TESTS PASSED -- Florence-2 + Llama working correctly!")
    elif ocr_success == len(images):
        print("  [PARTIAL] OCR OK but Llama produced some generic responses.")
    else:
        print("  [FAIL] Some OCR tests failed -- check backend logs.")
    sep()
