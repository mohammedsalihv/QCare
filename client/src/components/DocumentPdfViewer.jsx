import { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Minus, Plus, Maximize2 } from 'lucide-react';
import { getDocument, GlobalWorkerOptions, TextLayer } from 'pdfjs-dist/legacy/build/pdf.mjs';
import workerUrl from 'pdfjs-dist/legacy/build/pdf.worker.min.mjs?url';
import 'pdfjs-dist/web/pdf_viewer.css';

GlobalWorkerOptions.workerSrc = workerUrl;

// Render authenticated file bytes locally. Never execute PDF actions or embed
// the file as an active browser document (Chrome blocks sandboxed PDF plugins).
export default function DocumentPdfViewer({ src, name }) {
  const [pdf, setPdf] = useState(null);
  const [page, setPage] = useState(1);
  const [zoom, setZoom] = useState(1);
  const [width, setWidth] = useState(800);
  const [error, setError] = useState('');
  const [rendered, setRendered] = useState('');
  const host = useRef(null), canvas = useRef(null), text = useRef(null);
  const renderKey = `${page}-${zoom}-${width}`;

  useEffect(() => { if (host.current) host.current.scrollTop = 0; }, [page]);

  useEffect(() => {
    const observer = new ResizeObserver(([entry]) => setWidth(Math.max(200, entry.contentRect.width - 40)));
    observer.observe(host.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    let active = true;
    const base = `${import.meta.env.BASE_URL}pdf-resources/`;
    const task = getDocument({ url: src, cMapUrl: `${base}cmaps/`, cMapPacked: true, standardFontDataUrl: `${base}standard_fonts/`, wasmUrl: `${base}wasm/`, enableXfa: false });
    task.promise.then(document => { if (active) setPdf(document); }).catch(e => {
      if (active) console.error('PDF reader initialization failed:', e.name, e.message);
      if (active) setError(e.name === 'PasswordException' ? 'This PDF is password protected. Ask the owner to upload an unlocked copy.' : 'This PDF could not be opened. Ask the owner to check the file or upload a replacement.');
    });
    return () => { active = false; void task.destroy(); };
  }, [src]);

  useEffect(() => {
    if (!pdf) return;
    let active = true, painting, textLayer;
    pdf.getPage(page).then(async pdfPage => {
      if (!active) return;
      const natural = pdfPage.getViewport({ scale: 1 });
      const viewport = pdfPage.getViewport({ scale: width / natural.width * zoom });
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      const target = canvas.current;
      target.width = Math.floor(viewport.width * ratio);
      target.height = Math.floor(viewport.height * ratio);
      target.style.width = `${viewport.width}px`;
      target.style.height = `${viewport.height}px`;
      const layer = text.current;
      layer.replaceChildren();
      layer.parentElement.style.setProperty('--scale-factor', viewport.scale);
      painting = pdfPage.render({ canvas: target, viewport, transform: ratio === 1 ? null : [ratio, 0, 0, ratio, 0, 0] });
      await painting.promise;
      if (!active) return;
      textLayer = new TextLayer({ textContentSource: pdfPage.streamTextContent(), container: layer, viewport });
      await textLayer.render();
      if (active) { setRendered(renderKey); setError(''); }
    }).catch(e => { if (active && e.name !== 'RenderingCancelledException') setError('This page could not be displayed. Try another page or ask the owner to check the PDF.'); });
    return () => { active = false; painting?.cancel(); textLayer?.cancel(); };
  }, [pdf, page, zoom, width, renderKey]);

  return <section className="dl-pdf" aria-label={`PDF reader: ${name}`}>
    <div className="dl-pdf-toolbar"><div className="dl-pdf-pages">
      <button aria-label="Previous PDF page" disabled={!pdf || page <= 1} onClick={() => setPage(value => value - 1)}><ChevronLeft size={16} /></button>
      <span aria-live="polite">Page {page} of {pdf?.numPages || '…'}</span>
      <button aria-label="Next PDF page" disabled={!pdf || page >= pdf.numPages} onClick={() => setPage(value => value + 1)}><ChevronRight size={16} /></button>
    </div><div className="dl-pdf-zoom"><button aria-label="Zoom out" disabled={!pdf || zoom <= 0.5} onClick={() => setZoom(value => Math.max(.5, value - .25))}><Minus size={16} /></button><span>{Math.round(zoom * 100)}%</span><button aria-label="Zoom in" disabled={!pdf || zoom >= 2} onClick={() => setZoom(value => Math.min(2, value + .25))}><Plus size={16} /></button><button disabled={!pdf} onClick={() => setZoom(1)}><Maximize2 size={15} /> Fit width</button></div></div>
    {error ? <p role="alert" className="dl-error">{error}</p> : rendered !== renderKey && <p role="status" className="dl-pdf-loading">Loading PDF page…</p>}
    <div ref={host} className="dl-pdf-stage" tabIndex={0} aria-label="PDF page; scroll to read"><div className="dl-pdf-paper" style={{ visibility: pdf ? 'visible' : 'hidden' }}><canvas ref={canvas} aria-label={`Page ${page} of ${name}`} /><div ref={text} className="textLayer" /></div></div>
  </section>;
}
