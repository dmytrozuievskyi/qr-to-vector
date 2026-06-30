window.QRApp.vectorizer = (function() {
  const { state, ui } = window.QRApp;
  const SCALE = 1000;

  async function updateGridPreview() {
    const state = window.QRApp.state;
    if (state.pipelineState && state.pipelineState.currentStage >= 2) {
      await ui.tick();
      await computeMatrix();
      await computePolygons();
      await computeVerification();
      ui.viewStage(state.pipelineState.currentStage);
    }
  }

  async function computeMatrix() {
    if(!state.imgData) return;
    const btnNext = document.getElementById('btn-next-matrix');
    if(btnNext) btnNext.disabled = true;
    
    if (!state.pipelineState || state.pipelineState.imgData !== state.imgData) {
      state.pipelineState = {
        currentStage: 2,
        W: state.imgData.width,
        H: state.imgData.height,
        imgData: state.imgData,
        px: null,
        cells: null,
        gridSize: 0,
        rawIslands: null,
        shrunkIslands: null
      };
    }
    const ps = state.pipelineState;
    
    try {
      await ui.tick();
      const W = ps.W, H = ps.H;
      let px = ps.px;
      if (!px) {
        if (typeof OffscreenCanvas !== 'undefined') {
          const off = new OffscreenCanvas(W,H);
          const oc = off.getContext('2d');
          oc.drawImage(state.imgData,0,0);
          px = oc.getImageData(0,0,W,H).data;
        } else {
          const tempCv = document.createElement('canvas');
          tempCv.width = W; tempCv.height = H;
          const oc = tempCv.getContext('2d');
          oc.drawImage(state.imgData,0,0);
          px = oc.getImageData(0,0,W,H).data;
        }
        ps.px = px;
      }

      let cells;
      if (state.decompose) {
        const code = jsQR(px, W, H, {inversionAttempts:'attemptBoth'});
        if(!code) throw new Error('Decompose failed: could not read QR data');
        
        const qr = qrcode(0, 'M');
        qr.addData(code.data);
        qr.make();
        const gridN = qr.getModuleCount();
        cells = new Uint8Array(gridN * gridN);
        
        const maskStep = state.centerMaskStep || 0;
        const maskBounds = getMaskBounds(gridN, gridN, maskStep);

        for(let r=0; r<gridN; r++) {
          for(let c=0; c<gridN; c++) {
            if (maskBounds && c >= maskBounds.startX && c < maskBounds.endX && r >= maskBounds.startY && r < maskBounds.endY) {
              cells[r*gridN + c] = 0;
              continue;
            }
            cells[r*gridN + c] = qr.isDark(r, c) ? 1 : 0;
          }
        }
        ps.cells = cells;
        ps.gridSize = {nX: gridN, nY: gridN};
        
        const grid = detectGrid(px,W,H);
        ps.gridBBox = grid.bbox;
      } else {
        const grid = detectGrid(px,W,H);
        ps.gridSize = {nX: grid.nX, nY: grid.nY};
        ps.gridBBox = grid.bbox;
        
        cells = classifyCells(px,W,H,grid);
        ps.cells = cells;
      }
      
      if(btnNext) btnNext.disabled = false;
      ui.viewStage(state.pipelineState ? state.pipelineState.currentStage : 2);
    } catch(e){
      console.error(e);
      if(btnNext) btnNext.disabled = false;
    }
  }

  async function computePolygons() {
    const ps = state.pipelineState;
    if(!ps || !ps.cells) return;
    
    const btnNext = document.getElementById('btn-next-polygons');
    if(btnNext) btnNext.disabled = true;

    try {
      await ui.tick();
      const nX = ps.gridSize.nX;
      const nY = ps.gridSize.nY;
      
      const islands = buildIslands(ps.cells, nX, nY);
      ps.rawIslands = islands;

      await ui.tick();
      const thicknessFrac = parseFloat(document.getElementById('sl-shrink').value) / 100;
      const shrink = -thicknessFrac; 
      const rawBevel = parseFloat(document.getElementById('sl-bevel').value) / 100;
      const bevel = rawBevel * 0.499; 
      const isRound = document.getElementById('tog-corner-style').classList.contains('on');
      
      const shrunk = shrinkIslands(islands, shrink, bevel, isRound);
      
      state.currentIslands = shrunk;
      state.gridSize = {nX: nX, nY: nY};
      ps.shrunkIslands = shrunk;
      
      if(btnNext) btnNext.disabled = false;
      ui.viewStage(state.pipelineState ? state.pipelineState.currentStage : 3);
    } catch(e){
      console.error(e);
      if(btnNext) btnNext.disabled = false;
    }
  }

  async function computeVerification() {
    const ps = state.pipelineState;
    if(!ps || !ps.shrunkIslands) return;
    
    try {
      await ui.tick();
      const shrunk = ps.shrunkIslands;
      const btnExport = document.getElementById('btn-export');
      if(btnExport) btnExport.disabled = true;

      let origText = null;
      if (ps.px) {
        const codeOrig = jsQR(ps.px, ps.W, ps.H, {inversionAttempts:'attemptBoth'});
        origText = codeOrig ? codeOrig.data : null;
      }
      
      const vCv = document.createElement('canvas');
      vCv.width = 400; vCv.height = 400;
      const vCtx = vCv.getContext('2d');
      vCtx.fillStyle = '#FFF'; vCtx.fillRect(0,0,400,400);
      
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      for (const path of shrunk) {
        for (const pt of path) {
          minX = Math.min(minX, pt.X); minY = Math.min(minY, pt.Y);
          maxX = Math.max(maxX, pt.X); maxY = Math.max(maxY, pt.Y);
        }
      }
      const geoW = maxX - minX, geoH = maxY - minY;
      const vScale = 250 / Math.max(geoW, geoH);
      const offX = (400 - geoW * vScale) / 2;
      const offY = (400 - geoH * vScale) / 2;

      vCtx.fillStyle = '#000';
      vCtx.beginPath();
      for(const path of shrunk){
        path.forEach((pt,i)=>{
          const x = (pt.X - minX) * vScale + offX;
          const y = (pt.Y - minY) * vScale + offY;
          i===0 ? vCtx.moveTo(x,y) : vCtx.lineTo(x,y);
        });
        vCtx.closePath();
      }
      vCtx.fill('evenodd');
      
      const vPx = vCtx.getImageData(0,0,400,400);
      let outText = null;

      const codeOut = jsQR(vPx.data, 400, 400, {inversionAttempts:'dontInvert'});
      if (codeOut) {
        outText = codeOut.data;
      }
      
      ps.verification = { origText, outText };
      
      if(btnExport) btnExport.disabled = false;
      ui.viewStage(state.pipelineState ? state.pipelineState.currentStage : 4);
    } catch(e) {
      console.error(e);
    }
  }

  function detectGrid(px, W, H) {
    const gray = new Uint8Array(W * H);
    for(let i = 0; i < W * H; i++) gray[i] = Math.round(0.299 * px[i*4] + 0.587 * px[i*4+1] + 0.114 * px[i*4+2]);
    const thresh = otsu(gray);
    let dark = 0; 
    for(const v of gray) if(v < thresh) dark++;
    let invert = dark > gray.length * 0.55;
    
    const bbox = findBoundingBox(gray, W, H, thresh, invert);
    
    let nX, nY, modPx;
    const manualActive = document.getElementById('tog-manual-grid').classList.contains('on');
    if (manualActive) {
      nX = parseInt(document.getElementById('in-grid-w').value, 10);
      nY = parseInt(document.getElementById('in-grid-h').value, 10);
      modPx = (bbox.width / nX + bbox.height / nY) / 2;
    } else {
      const estimated = estimateCellCountAndModPx(gray, W, H, thresh, invert, bbox);
      nX = estimated.nW;
      nY = estimated.nH;
      modPx = estimated.modPx;
    }
    
    return { gray, thresh, invert, bbox, nX, nY, modPx };
  }

  function otsu(gray){
    const hist = new Int32Array(256);
    for(const v of gray) hist[v]++;
    const total = gray.length;
    let sum=0; for(let i=0;i<256;i++) sum+=i*hist[i];
    let sumB=0, wB=0, max=0, thresh=128;
    for(let t=0;t<256;t++){
      wB+=hist[t]; if(!wB) continue;
      const wF=total-wB; if(!wF) break;
      sumB+=t*hist[t];
      const mB=sumB/wB, mF=(sum-sumB)/wF;
      const between=wB*wF*(mB-mF)**2;
      if(between>max){max=between;thresh=t;}
    }
    return thresh;
  }

  function findBoundingBox(gray, W, H, thresh, invert) {
    let minX = W, minY = H, maxX = 0, maxY = 0;
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        let isDark = gray[y * W + x] < thresh;
        if (invert) isDark = !isDark;
        if (isDark) {
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
        }
      }
    }
    if (minX > maxX) {
      minX = 0; minY = 0; maxX = W - 1; maxY = H - 1;
    }
    return { minX, minY, maxX, maxY, width: maxX - minX + 1, height: maxY - minY + 1 };
  }

  function estimateCellCountAndModPx(gray, W, H, thresh, invert, bbox) {
    let moduleSizes = [];
    for (let y = bbox.minY; y <= bbox.maxY; y += 2) {
      let runs = [];
      let runLen = 0;
      let currentDark = (gray[y * W + bbox.minX] < thresh);
      if (invert) currentDark = !currentDark;
      
      for (let x = bbox.minX; x <= bbox.maxX; x++) {
        let isDark = gray[y * W + x] < thresh;
        if (invert) isDark = !isDark;
        
        if (isDark === currentDark) {
          runLen++;
        } else {
          runs.push({ len: runLen, dark: currentDark });
          runLen = 1;
          currentDark = isDark;
        }
      }
      runs.push({ len: runLen, dark: currentDark });

      for (let i = 0; i < runs.length - 4; i++) {
        if (runs[i].dark && !runs[i+1].dark && runs[i+2].dark && !runs[i+3].dark && runs[i+4].dark) {
          let l1 = runs[i].len, l2 = runs[i+1].len, l3 = runs[i+2].len, l4 = runs[i+3].len, l5 = runs[i+4].len;
          let avg = (l1 + l2 + l3 + l4 + l5) / 7.0;
          let maxDiff = avg * 0.75;
          if (Math.abs(l1 - avg) < maxDiff && Math.abs(l2 - avg) < maxDiff &&
              Math.abs(l3 - avg * 3) < maxDiff * 3 && Math.abs(l4 - avg) < maxDiff &&
              Math.abs(l5 - avg) < maxDiff) {
            moduleSizes.push(avg);
          }
        }
      }
    }
    
    for (let x = bbox.minX; x <= bbox.maxX; x += 2) {
      let runs = [];
      let runLen = 0;
      let currentDark = (gray[bbox.minY * W + x] < thresh);
      if (invert) currentDark = !currentDark;
      
      for (let y = bbox.minY; y <= bbox.maxY; y++) {
        let isDark = gray[y * W + x] < thresh;
        if (invert) isDark = !isDark;
        
        if (isDark === currentDark) {
          runLen++;
        } else {
          runs.push({ len: runLen, dark: currentDark });
          runLen = 1;
          currentDark = isDark;
        }
      }
      runs.push({ len: runLen, dark: currentDark });

      for (let i = 0; i < runs.length - 4; i++) {
        if (runs[i].dark && !runs[i+1].dark && runs[i+2].dark && !runs[i+3].dark && runs[i+4].dark) {
          let l1 = runs[i].len, l2 = runs[i+1].len, l3 = runs[i+2].len, l4 = runs[i+3].len, l5 = runs[i+4].len;
          let avg = (l1 + l2 + l3 + l4 + l5) / 7.0;
          let maxDiff = avg * 0.75;
          if (Math.abs(l1 - avg) < maxDiff && Math.abs(l2 - avg) < maxDiff &&
              Math.abs(l3 - avg * 3) < maxDiff * 3 && Math.abs(l4 - avg) < maxDiff &&
              Math.abs(l5 - avg) < maxDiff) {
            moduleSizes.push(avg);
          }
        }
      }
    }
    
    let modPx;
    if (moduleSizes.length > 0) {
      moduleSizes.sort((a, b) => a - b);
      modPx = moduleSizes[Math.floor(moduleSizes.length / 2)];
    } else {
      modPx = bbox.width / 21;
    }
    
    let nW = Math.round(bbox.width / modPx);
    let nH = Math.round(bbox.height / modPx);
    
    const ratio = Math.min(bbox.width, bbox.height) / Math.max(bbox.width, bbox.height);
    if (ratio > 0.85) {
      let n = Math.round((nW + nH) / 2);
      if(n < 10) n = 21; if(n > 177) n = 177;
      const valid = [21,25,29,33,37,41,45,49,53,57,61,65,69,73,77,81,85,89,93,97,
                   101,105,109,113,117,121,125,129,133,137,141,145,149,153,157,
                   161,165,169,173,177];
      n = valid.reduce((a,b) => Math.abs(b - n) < Math.abs(a - n) ? b : a);
      nW = n;
      nH = n;
      modPx = (bbox.width + bbox.height) / (2 * n);
    } else {
      nW = Math.max(1, nW);
      nH = Math.max(1, nH);
    }
    
    return { nW, nH, modPx };
  }

  function getMaskBounds(nX, nY, maskStep) {
    if (maskStep <= 0) return null;
    if (nX !== nY) return null; 
    
    const rawMax = nX % 2 === 1 ? Math.floor((nX - 1) / 2) + 1 : nX / 2;
    const maxStep = Math.max(0, rawMax - 1);
    const clampedStep = Math.min(maskStep, maxStep);
    
    if (clampedStep <= 0) return null;
    
    const maskW = nX % 2 === 1 ? (clampedStep - 1) * 2 + 1 : clampedStep * 2;
    const maskH = nY % 2 === 1 ? (clampedStep - 1) * 2 + 1 : clampedStep * 2;
    
    const startX = Math.floor((nX - maskW) / 2);
    const endX = startX + maskW;
    const startY = Math.floor((nY - maskH) / 2);
    const endY = startY + maskH;
    
    return { startX, endX, startY, endY, maskW, maskH, clampedStep };
  }

  function classifyCells(px, W, H, grid) {
    const { gray, thresh, invert, bbox, nX, nY } = grid;
    const cw = bbox.width / nX;
    const ch = bbox.height / nY;
    const cells = new Uint8Array(nX * nY);
    
    const maskStep = state.centerMaskStep || 0;
    const maskBounds = getMaskBounds(nX, nY, maskStep);

    for(let row = 0; row < nY; row++) {
      for(let col = 0; col < nX; col++) {
        if (maskBounds && col >= maskBounds.startX && col < maskBounds.endX && row >= maskBounds.startY && row < maskBounds.endY) {
          cells[row * nX + col] = 0;
          continue;
        }
        
        const cx = Math.round(bbox.minX + (col + 0.5) * cw);
        const cy = Math.round(bbox.minY + (row + 0.5) * ch);
        
        let darkCount = 0;
        for(let dy = -1; dy <= 1; dy++) {
          for(let dx = -1; dx <= 1; dx++) {
            const xi = Math.min(W - 1, Math.max(0, cx + dx));
            const yi = Math.min(H - 1, Math.max(0, cy + dy));
            let isDark = gray[yi * W + xi] < thresh;
            if(invert) isDark = !isDark;
            if(isDark) darkCount++;
          }
        }
        cells[row * nX + col] = darkCount >= 5 ? 1 : 0;
      }
    }
    return cells;
  }

  function buildIslands(cells, nX, nY){
    const gapValue = document.getElementById('sl-cell-gap') ? parseFloat(document.getElementById('sl-cell-gap').value)/100 : 0.0;
    const gapScale = 1.0 - gapValue;
    const subj = new ClipperLib.Paths();
    for(let r=0;r<nY;r++) for(let c=0;c<nX;c++){
      if(!cells[r*nX+c]) continue;
      
      const cx = (c + 0.5) * SCALE;
      const cy = (r + 0.5) * SCALE;
      const halfSize = (SCALE / 2) * gapScale;
      
      subj.push([
        {X: cx - halfSize, Y: cy - halfSize},
        {X: cx + halfSize, Y: cy - halfSize},
        {X: cx + halfSize, Y: cy + halfSize},
        {X: cx - halfSize, Y: cy + halfSize}
      ]);
    }
    const clipper = new ClipperLib.Clipper();
    const solution = new ClipperLib.Paths();
    clipper.AddPaths(subj, ClipperLib.PolyType.ptSubject, true);
    clipper.Execute(ClipperLib.ClipType.ctUnion, solution,
      ClipperLib.PolyFillType.pftNonZero, ClipperLib.PolyFillType.pftNonZero);
    return solution.filter(p=>p.length>=3);
  }

  function shrinkIslands(islands, shrinkFrac, bevelFrac, isRound){
    const delta = -shrinkFrac*SCALE;
    const co = new ClipperLib.ClipperOffset(2.0, 0.1);
    const subj = new ClipperLib.Paths();
    islands.forEach(p => subj.push(p));
    
    co.AddPaths(subj, ClipperLib.JoinType.jtMiter, ClipperLib.EndType.etClosedPolygon);
    const shkResult = new ClipperLib.Paths();
    co.Execute(shkResult, delta);
    
    if (bevelFrac <= 0 || shkResult.length === 0) {
      return shkResult.filter(p=>p.length>=3);
    }
    
    const bevelRadius = bevelFrac * SCALE;
    const coIn = new ClipperLib.ClipperOffset(2.0, 0.1);
    coIn.AddPaths(shkResult, ClipperLib.JoinType.jtMiter, ClipperLib.EndType.etClosedPolygon);
    const inResult = new ClipperLib.Paths();
    coIn.Execute(inResult, -bevelRadius);
    
    if (inResult.length === 0) {
      return shkResult.filter(p=>p.length>=3);
    }
    
    const jt = isRound ? ClipperLib.JoinType.jtRound : ClipperLib.JoinType.jtSquare;
    const coOut = new ClipperLib.ClipperOffset(2.0, 0.25);
    coOut.AddPaths(inResult, jt, ClipperLib.EndType.etClosedPolygon);
    const finalResult = new ClipperLib.Paths();
    coOut.Execute(finalResult, bevelRadius);
    
    return finalResult.filter(p=>p.length>=3);
  }



  return { computeMatrix, computePolygons, computeVerification, updateGridPreview, getMaskBounds };
})();
