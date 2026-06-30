window.QRApp.export = (function() {
  const { state, ui } = window.QRApp;
  const SCALE = 1000; 

  function exportFile(){
    if(!state.currentIslands) return;
    const format = document.getElementById('out-format').value;
    if (format === 'eps') exportEPS();
    else if (format === 'svg') exportSVG();
    else if (format === 'png') exportPNG();
  }

  function getDocGeometry() {
    const wVal = parseFloat(document.getElementById('out-w').value);
    const hVal = parseFloat(document.getElementById('out-h').value);
    const unit = document.getElementById('out-unit').value;
    const ptPerUnit = unit==='mm'?2.834645:unit==='in'?72:1;
    const docW = wVal*ptPerUnit, docH = hVal*ptPerUnit;

    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const path of state.currentIslands) {
      for (const pt of path) {
        minX = Math.min(minX, pt.X); minY = Math.min(minY, pt.Y);
        maxX = Math.max(maxX, pt.X); maxY = Math.max(maxY, pt.Y);
      }
    }
    if (minX === Infinity) return null;

    const geoW = maxX - minX, geoH = maxY - minY;
    const cScale = Math.min(docW / geoW, docH / geoH);
    const actualW = geoW * cScale, actualH = geoH * cScale;
    const offsetX = (docW - actualW) / 2, offsetY = (docH - actualH) / 2;

    return { wVal, hVal, unit, docW, docH, minX, minY, cScale, offsetX, offsetY };
  }

  function exportEPS(){
    const geo = getDocGeometry();
    if (!geo) return;
    const { wVal, hVal, unit, docW, docH, minX, minY, cScale, offsetX, offsetY } = geo;

    let eps='%!PS-Adobe-3.0 EPSF-3.0\n';
    eps+='%%BoundingBox: 0 0 '+Math.round(docW)+' '+Math.round(docH)+'\n';
    eps+='%%HiResBoundingBox: 0 0 '+docW.toFixed(4)+' '+docH.toFixed(4)+'\n';
    eps+='%%Creator: QR Engraving Tool\n%%EndComments\n\n';
    eps+='0 0 0 setrgbcolor\n\n';
    eps+='newpath\n';
    for(const path of state.currentIslands){
      if(path.length<2) continue;
      const f=path[0];
      const fx = (f.X - minX) * cScale + offsetX;
      const fy = (f.Y - minY) * cScale + offsetY;
      eps+=fx.toFixed(4)+' '+(docH-fy).toFixed(4)+' moveto\n';
      for(let i=1;i<path.length;i++){
        const px = (path[i].X - minX) * cScale + offsetX;
        const py = (path[i].Y - minY) * cScale + offsetY;
        eps+=px.toFixed(4)+' '+(docH-py).toFixed(4)+' lineto\n';
      }
      eps+='closepath\n';
    }
    eps+='eofill\n\n%%EOF\n';

    downloadBlob(new Blob([eps],{type:'application/postscript'}), 'qr_engraving.eps');
  }

  function exportSVG(){
    const geo = getDocGeometry();
    if (!geo) return;
    const { wVal, hVal, unit, docW, docH, minX, minY, cScale, offsetX, offsetY } = geo;

    let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${docW} ${docH}" width="${wVal}${unit}" height="${hVal}${unit}">\n`;
    svg += `<path fill="#000000" fill-rule="evenodd" d="`;
    
    for(const path of state.currentIslands){
      if(path.length<2) continue;
      for(let i=0;i<path.length;i++){
        const px = (path[i].X - minX) * cScale + offsetX;
        const py = (path[i].Y - minY) * cScale + offsetY;
        
        svg += (i===0 ? 'M' : 'L') + ` ${px.toFixed(4)} ${py.toFixed(4)} `;
      }
      svg += 'Z ';
    }
    svg += `"/>\n</svg>`;

    downloadBlob(new Blob([svg],{type:'image/svg+xml'}), 'qr_engraving.svg');
  }

  function exportPNG(){
    let wVal = parseFloat(document.getElementById('out-w').value);
    let hVal = parseFloat(document.getElementById('out-h').value);
    const unit = document.getElementById('out-unit').value;
    
    let SZ_W = wVal, SZ_H = hVal;
    if (unit === 'in') { SZ_W *= 300; SZ_H *= 300; }
    else if (unit === 'mm') { SZ_W *= (300 / 25.4); SZ_H *= (300 / 25.4); }
    
    SZ_W = Math.max(10, Math.round(SZ_W));
    SZ_H = Math.max(10, Math.round(SZ_H));

    const paddingX = Math.round(SZ_W * 0.03125);
    const paddingY = Math.round(SZ_H * 0.03125);
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const path of state.currentIslands) {
      for (const pt of path) {
        minX = Math.min(minX, pt.X); minY = Math.min(minY, pt.Y);
        maxX = Math.max(maxX, pt.X); maxY = Math.max(maxY, pt.Y);
      }
    }
    if (minX === Infinity) return;
    
    const geoW = maxX - minX, geoH = maxY - minY;
    const cScale = Math.min((SZ_W - paddingX*2) / geoW, (SZ_H - paddingY*2) / geoH);
    const actualW = geoW * cScale, actualH = geoH * cScale;
    const offsetX = (SZ_W - actualW) / 2, offsetY = (SZ_H - actualH) / 2;

    const canvas = document.createElement('canvas');
    canvas.width = SZ_W; canvas.height = SZ_H;
    const ctx = canvas.getContext('2d');
    
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    for(const path of state.currentIslands){
      if(path.length<2) continue;
      path.forEach((pt,i) => {
        const px = (pt.X - minX) * cScale + offsetX;
        const py = (pt.Y - minY) * cScale + offsetY;
        i===0 ? ctx.moveTo(px,py) : ctx.lineTo(px,py);
      });
      ctx.closePath();
    }
    ctx.fill('evenodd');

    canvas.toBlob((blob) => {
      downloadBlob(blob, 'qr_engraving.png');
    }, 'image/png');
  }

  function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
  }

  return { exportFile };
})();
