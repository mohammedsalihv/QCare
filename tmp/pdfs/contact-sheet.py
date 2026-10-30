from pathlib import Path
from PIL import Image, ImageOps, ImageDraw
pages = sorted(Path('tmp/pdfs').glob('long-*.png'), key=lambda p: int(p.stem.split('-')[-1]))
sheet = Image.new('RGB', (4 * 350, ((len(pages) + 3) // 4) * 520), '#e5e7eb')
for i, file in enumerate(pages):
    image = Image.open(file).convert('RGB')
    image.thumbnail((330, 480))
    x, y = (i % 4) * 350 + 10, (i // 4) * 520 + 25
    sheet.paste(image, (x, y))
    ImageDraw.Draw(sheet).text((x, y-17), f'Page {i+1}', fill='black')
sheet.save('tmp/pdfs/long-contact.png')
