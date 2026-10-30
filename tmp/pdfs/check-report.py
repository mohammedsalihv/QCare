from pathlib import Path
import pdfplumber
from pypdf import PdfReader
for file in [Path('output/pdf/cmc-clinical-audit-sample.pdf'), Path('tmp/pdfs/long-audit.pdf')]:
    reader = PdfReader(file)
    all_text = '\n'.join(p.extract_text() for p in reader.pages)
    for expected in ['CANADIAN MEDICAL CENTER', 'Concerned people', 'Assessment findings', 'Corrective action plan', 'Review & approval', 'Activity record', 'Dr. Amina Hassan']:
        assert expected.casefold() in all_text.casefold(), expected
    with pdfplumber.open(file) as pdf:
        for i, page in enumerate(pdf.pages):
            assert f'Page {i+1} of {len(pdf.pages)}' in page.extract_text(), 'Missing footer'
            body = [w for w in page.extract_words() if 104 < w['top'] < page.height - 60]
            assert body, 'Empty content page'
            assert len(page.rects) >= 4, 'Expected bordered section/table cells'
            assert all(w['x0'] >= 44 and w['x1'] <= page.width - 42 for w in body), 'Text outside horizontal margins'
            assert all(w['bottom'] <= page.height - 60 for w in body), 'Text overlaps footer'
    print(f'{file}: {len(reader.pages)} pages; text, names, page numbering, and margins verified')
