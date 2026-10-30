from pathlib import Path
from PIL import Image, ImageDraw
from pypdf import PdfReader
count = len(PdfReader('tmp/pdfs/long-audit.pdf').pages)
pages = sorted(Path('tmp/pdfs').glob('approved-long-*.png'), key=lambda p: int(p.stem.split('-')[-1]))[:count]
sheet = Image.new('RGB', (4 * 320, ((len(pages) + 3) // 4) * 470), '#e5e7eb')
for i, file in enumerate(pages):
    im = Image.open(file).convert('RGB'); im.thumbnail((300, 430))
    x, y = (i % 4) * 320 + 10, (i // 4) * 470 + 25
    sheet.paste(im, (x, y)); ImageDraw.Draw(sheet).text((x, y-17), f'Page {i+1}', fill='black')
sheet.save('tmp/pdfs/table-contact.png')
print(f'{count} stress-report pages rendered')
