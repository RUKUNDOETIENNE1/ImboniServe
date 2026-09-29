import pypdf
import sys

path = r"C:\Users\Steve\Dropbox\PC\Downloads\http_intouchpay_api_v1.2.pdf"
reader = pypdf.PdfReader(path)
print(f"NUM_PAGES={len(reader.pages)}", file=sys.stderr)

out_path = r"C:\Dev\ImboniResto\scripts\pay-002-intouch-pdf-text.txt"
with open(out_path, "w", encoding="utf-8") as f:
    for i, page in enumerate(reader.pages):
        f.write(f"\n\n===== PAGE {i+1} =====\n\n")
        text = page.extract_text() or ""
        f.write(text)

print(f"WROTE={out_path}", file=sys.stderr)
