window.QRApp.ui = (function() {
  function updateLabel(id, val){ document.getElementById(id).textContent = parseFloat(val).toFixed(2); }
  function updateIntLabel(id, val){ const el = document.getElementById(id); if (el) el.textContent = String(val); }
  function setText(id, val){ const el = document.getElementById(id); if (el) el.textContent = val; }
  
  function toggleAuto(){
    const state = window.QRApp.state;
    state.autoDetect = !state.autoDetect;
    document.getElementById('tog-auto').classList.toggle('on', state.autoDetect);
    markSettingsChanged();
  }
  
  function toggleAutoWarp(){
    const state = window.QRApp.state;
    state.autoWarp = !state.autoWarp;
    document.getElementById('tog-autowarp').classList.toggle('on', state.autoWarp);
  }
  
  function toggleDecompose(){
    const state = window.QRApp.state;
    state.decompose = !state.decompose;
    document.getElementById('tog-decompose').classList.toggle('on', state.decompose);
    markSettingsChanged();
  }
  
  function toggleManualGrid() {
    const tog = document.getElementById('tog-manual-grid');
    const inputs = document.getElementById('manual-grid-inputs');
    tog.classList.toggle('on');
    if (tog.classList.contains('on')) {
      inputs.style.opacity = '1';
      inputs.style.pointerEvents = 'auto';
    } else {
      inputs.style.opacity = '0.4';
      inputs.style.pointerEvents = 'none';
    }
    markSettingsChanged();
    if (window.QRApp.vectorizer && window.QRApp.vectorizer.updateGridPreview) {
      window.QRApp.vectorizer.updateGridPreview();
    }
  }
  
  function setStage(n){
    const state = window.QRApp.state;
    if (state.pipelineState) {
      state.pipelineState.currentStage = n;
      if (n > state.pipelineState.maxStage) state.pipelineState.maxStage = n;
    }
    for(let i=0;i<=4;i++){
      const p=document.getElementById('sp-'+i);
      if(!p) continue;
      if(i<n) p.className='stage-pill done clickable';
      else if(i===n) p.className='stage-pill active clickable';
      else p.className='stage-pill';
      p.style.borderColor = '';
      p.style.color = '';
      p.style.background = '';
      
      if (state.decompose && (i === 1 || i === 2)) {
        p.classList.remove('clickable');
        p.style.opacity = '0.3';
        p.style.pointerEvents = 'none';
      } else {
        p.style.opacity = '1';
        p.style.pointerEvents = 'auto';
      }
    }
  }

  function viewStage(n) {
    const state = window.QRApp.state;
    const ps = state.pipelineState;
    if (!ps || n > ps.maxStage || ps.maxStage === -1) return;
    
    
    

    for(let i=0; i<=4; i++){
      const block = document.getElementById('block-'+i);
      if(block) block.style.display = (i === n) ? 'block' : 'none';
    }

    for(let i=0;i<=4;i++){
      const p=document.getElementById('sp-'+i);
      if(!p) continue;
      if(i <= ps.maxStage) {
        if(i === n) {
          p.style.borderColor = '#1E3A6E';
          p.style.color = '#1E3A6E';
          p.style.background = 'rgba(30,58,110,.06)';
          if (window.matchMedia('(max-width: 1100px) and (orientation: portrait)').matches) {
            const inlineAlign = i === 4 ? 'end' : (i === 0 ? 'start' : 'center');
            setTimeout(() => { p.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: inlineAlign }); }, 50);
          }
        } else {
          p.style.borderColor = '#D1C7B1';
          p.style.color = '#5C6B8A';
          p.style.background = 'transparent';
        }
      }
      if (state.decompose && (i === 1 || i === 2)) {
        p.classList.remove('clickable');
        p.style.opacity = '0.3';
        p.style.pointerEvents = 'none';
      } else {
        p.style.opacity = '1';
        p.style.pointerEvents = 'auto';
      }
    }

    const sz = getPreviewSize();
    const cv = window.QRApp.elements.canvas;
    const ctx = window.QRApp.elements.ctx;
    cv.width = sz; cv.height = sz;
    ctx.clearRect(0,0,sz,sz);

    if (n === 0) {
      
      if (n === 0 && state.originalImg) {
        const s = (sz - 60) / Math.max(state.originalImg.width, state.originalImg.height);
        const nw = state.originalImg.width * s;
        const nh = state.originalImg.height * s;
        ctx.drawImage(state.originalImg, (sz-nw)/2, (sz-nh)/2, nw, nh);
      }
    } else if (n === 1) {
      
      if (n === 1 && state.imgData) {
        const s = (sz - 60) / Math.max(state.imgData.width, state.imgData.height);
        const nw = state.imgData.width * s;
        const nh = state.imgData.height * s;
        ctx.drawImage(state.imgData, (sz-nw)/2, (sz-nh)/2, nw, nh);
      }
    } else if (n === 2 && ps.gridBBox) {
      
      const s = sz / Math.max(ps.W, ps.H);
      const nw = ps.W * s;
      const nh = ps.H * s;
      const ox = (sz - nw) / 2;
      const oy = (sz - nh) / 2;
      ctx.drawImage(ps.imgData, ox, oy, nw, nh);
      
      if (ps.gridBBox) {
        ctx.strokeStyle = 'rgba(0, 255, 255, 0.8)';
        ctx.lineWidth = 1;
        const scaleX = s;
        const scaleY = s;
        const bw = ps.gridBBox.width;
        const bh = ps.gridBBox.height;
        const bx = ps.gridBBox.minX;
        const by = ps.gridBBox.minY;
        const cw = bw / ps.gridSize.nX;
        const ch = bh / ps.gridSize.nY;
        
        ctx.beginPath();
        for (let r=0; r<=ps.gridSize.nY; r++) {
          const y = oy + Math.floor((by + r*ch) * scaleY) + 0.5;
          ctx.moveTo(ox + Math.floor(bx * scaleX), y);
          ctx.lineTo(ox + Math.floor((bx + bw) * scaleX), y);
        }
        for (let c=0; c<=ps.gridSize.nX; c++) {
          const x = ox + Math.floor((bx + c*cw) * scaleX) + 0.5;
          ctx.moveTo(x, oy + Math.floor(by * scaleY));
          ctx.lineTo(x, oy + Math.floor((by + bh) * scaleY));
        }
        ctx.stroke();
        
        const maskStep = state.centerMaskStep || 0;
        if (maskStep > 0 && window.QRApp.vectorizer && window.QRApp.vectorizer.getMaskBounds) {
          const maskBounds = window.QRApp.vectorizer.getMaskBounds(ps.gridSize.nX, ps.gridSize.nY, maskStep);
          if (maskBounds) {
            const maskPxX = bx + maskBounds.startX * cw;
            const maskPxY = by + maskBounds.startY * ch;
            const maskPxW = maskBounds.maskW * cw;
            const maskPxH = maskBounds.maskH * ch;
            
            ctx.fillStyle = 'rgba(255, 0, 0, 0.4)';
            ctx.fillRect(
              ox + Math.floor(maskPxX * scaleX),
              oy + Math.floor(maskPxY * scaleY),
              Math.ceil(maskPxW * scaleX),
              Math.ceil(maskPxH * scaleY)
            );
          }
        }
        
        const slMask = document.getElementById('sl-center-mask');
        if (slMask) {
          if (ps.gridSize.nX !== ps.gridSize.nY) {
            slMask.disabled = true;
            slMask.parentElement.style.opacity = '0.4';
          } else {
            slMask.disabled = false;
            slMask.parentElement.style.opacity = '1';
            
            const nX = ps.gridSize.nX;
            const rawMax = nX % 2 === 1 ? Math.floor((nX - 1) / 2) + 1 : nX / 2;
            const maxStep = Math.max(0, rawMax - 1);
            slMask.max = maxStep;
            if (parseInt(slMask.value, 10) > maxStep) {
              slMask.value = maxStep;
              state.centerMaskStep = maxStep;
              ui.updateIntLabel('lbl-center-mask', maxStep);
            }
          }
        }
      }
    } else if ((n === 3 || n === 4) && ps.shrunkIslands) {
      drawComparisonPreview();
    }
    
    
    const vRow = document.getElementById('verification-row');
    if (vRow) {
      const statusBadge = document.getElementById('v-status-badge');
      const vLinks = vRow.querySelector('.v-links');
      
      if ((n === 3 || n === 4) && ps.verification) {
        statusBadge.classList.add('ready');
        if(vLinks) vLinks.classList.add('ready');
        
        const v = ps.verification;
        let showRecreate = false;

        if (v.origText === v.outText && v.origText !== null) {
          statusBadge.className = 'v-status ok';
          statusBadge.innerHTML = `<div class="icon">✓</div><span>${window.QRApp.i18n ? window.QRApp.i18n.get('lbl_v_passed') : 'Verification Passed'}</span>`;
        } else if (v.origText && !v.outText) {
          statusBadge.className = 'v-status err';
          statusBadge.innerHTML = `<div class="icon">✕</div><span>${window.QRApp.i18n ? window.QRApp.i18n.get('lbl_v_fail_gen') : 'Could not scan generated QR'}</span>`;
          if (!state.decompose) showRecreate = true;
        } else if (!v.origText && v.outText) {
          statusBadge.className = 'v-status info';
          statusBadge.innerHTML = `<div class="icon">i</div><span>${window.QRApp.i18n ? window.QRApp.i18n.get('lbl_v_scan_out') : 'Output is scannable (Original was not)'}</span>`;
        } else if (v.origText && v.outText) {
          statusBadge.className = 'v-status err';
          statusBadge.innerHTML = `<div class="icon">✕</div><span>${window.QRApp.i18n ? window.QRApp.i18n.get('lbl_v_mismatch') : 'Data mismatch!'}</span>`;
          if (!state.decompose) showRecreate = true;
        } else {
          statusBadge.className = 'v-status info';
          statusBadge.innerHTML = `<div class="icon">i</div><span>${window.QRApp.i18n ? window.QRApp.i18n.get('lbl_v_fail_both') : 'Neither QR could be scanned'}</span>`;
        }
        
        const btnRecreate = document.getElementById('btn-recreate-data');
        const btnCancelRecreate = document.getElementById('btn-cancel-recreate');
        const recreateTip = document.getElementById('recreate-tooltip-icon');
        const recreateBubble = document.getElementById('recreate-tooltip-bubble');
        
        if (state.decompose) {
          statusBadge.className = 'v-status info';
          statusBadge.innerHTML = '<div class="icon">i</div><span data-i18n="lbl_v_recreated">Generated from Scanned Data</span>';
          if (btnRecreate) btnRecreate.style.display = 'none';
          if (btnCancelRecreate) btnCancelRecreate.style.display = 'inline-block';
          if (recreateTip) recreateTip.style.display = 'inline-flex';
          if (recreateBubble) recreateBubble.innerHTML = window.QRApp.i18n ? window.QRApp.i18n.get('tip_cancel_recreate', 'Cancels the data-driven generation and returns to tracing the image.') + '<span class="tooltip-caret"></span>' : 'Cancels the data-driven generation and returns to tracing the image.<span class="tooltip-caret"></span>';
        } else {
          const dispVal = showRecreate ? 'inline-flex' : 'none';
          if (btnRecreate) btnRecreate.style.display = showRecreate ? 'inline-block' : 'none';
          if (btnCancelRecreate) btnCancelRecreate.style.display = 'none';
          if (recreateTip) recreateTip.style.display = dispVal;
          if (recreateBubble) recreateBubble.innerHTML = window.QRApp.i18n ? window.QRApp.i18n.get('tip_recreate_data', `Regenerates the output vector from the QR's decoded data instead of the traced image — produces a mathematically perfect result when tracing gives a bad match.`) + '<span class="tooltip-caret"></span>' : `Regenerates the output vector from the QR's decoded data instead of the traced image — produces a mathematically perfect result when tracing gives a bad match.<span class="tooltip-caret"></span>`;
        }
        
        document.getElementById('in-orig-link').value = v.origText || '—';
        document.getElementById('in-out-link').value = v.outText || '—';
      } else {
        statusBadge.classList.remove('ready');
        if(vLinks) vLinks.classList.remove('ready');
        statusBadge.className = 'v-status';
        statusBadge.innerHTML = `<div class="icon" style="background:#9AAABF;">i</div><span>${window.QRApp.i18n ? window.QRApp.i18n.get('lbl_v_waiting') : 'Waiting for generation...'}</span>`;
        document.getElementById('in-orig-link').value = '—';
        document.getElementById('in-out-link').value = '—';
        
        const btnRecreate = document.getElementById('btn-recreate-data');
        const btnCancelRecreate = document.getElementById('btn-cancel-recreate');
        const recreateTip = document.getElementById('recreate-tooltip-icon');
        if (btnRecreate) btnRecreate.style.display = 'none';
        if (btnCancelRecreate) btnCancelRecreate.style.display = 'none';
        if (recreateTip) recreateTip.style.display = 'none';
      }
    }
    
    
    const pc = document.querySelector('.preview-controls');
    const togDiff = document.getElementById('tog-diff');
    const slOpacity = document.getElementById('sl-opacity');
    if (pc) {
      if (n === 3 || n === 4) pc.classList.add('active');
      else pc.classList.remove('active');
      
      if (state.decompose) {
        pc.style.opacity = '0.4';
        pc.style.pointerEvents = 'none';
        if (togDiff) togDiff.classList.remove('on');
      } else {
        pc.style.opacity = '1';
        pc.style.pointerEvents = 'auto';
      }
    }
  }
  


  function updateMainButton(overrideState) {
    const state = window.QRApp.state;
    const i18n = window.QRApp.i18n;
    if (overrideState) state.actionState = overrideState;
    const btn = document.getElementById('btn-main-action');
    if(!btn) return;
    
    const getTxt = (key, def) => i18n ? i18n.get(key) : def;

    if (!state.imgData) {
      btn.disabled = true;
      btn.textContent = getTxt('btn_process', 'Process');
      btn.className = 'btn-process state-process';
      return;
    }
    btn.disabled = false;
    if (state.actionState === 'process') {
      btn.textContent = getTxt('btn_process', 'Process');
      btn.className = 'btn-process state-process';
    } else if (state.actionState === 'update') {
      btn.textContent = getTxt('btn_update', 'Update');
      btn.className = 'btn-process state-update';
    } else if (state.actionState === 'export') {
      const formatSel = document.getElementById('out-format');
      const format = formatSel ? formatSel.value.toUpperCase() : 'EPS';
      btn.textContent = getTxt('btn_export', 'Export') + ' ' + format;
      btn.className = 'btn-process state-export';
    }
  }

  function markSettingsChanged() {
    const state = window.QRApp.state;
    if (state.actionState === 'export' || state.actionState === 'update') {
      if (state.actionState !== 'update') updateMainButton('update');
      
      
      
    }
  }

  function toggleDiff() {
    const state = window.QRApp.state;
    document.getElementById('tog-diff').classList.toggle('on');
    viewStage(state.pipelineState ? state.pipelineState.currentStage : 4);
  }


  
  function tick(){ return new Promise(r=>setTimeout(r,20)); }
  
  function getPreviewSize(){ 
    const w = window.QRApp.elements.wrap; 
    return Math.max(200, Math.min(w.clientWidth-4, w.clientHeight-4, 800)); 
  }

  function drawCellPreview(cells, nX, nY){
    
  }

  function drawIslandPreview(islands){
    const state = window.QRApp.state;
    const ps = state.pipelineState;
    if(!ps || !islands || !ps.gridBBox) return;
    
    const sz = getPreviewSize();
    const cv = window.QRApp.elements.canvas;
    const ctx = window.QRApp.elements.ctx;
    
    
    const s = (sz - 60) / Math.max(ps.W, ps.H);
    const nw = ps.W * s;
    const nh = ps.H * s;
    const ox = (sz - nw) / 2;
    const oy = (sz - nh) / 2;
    
    const scaleX = s;
    const scaleY = s;
    const bx = ps.gridBBox.minX;
    const by = ps.gridBBox.minY;
    const bw = ps.gridBBox.width;
    const bh = ps.gridBBox.height;
    
    
    const vectorScaleX = bw / (ps.gridSize.nX * 1000);
    const vectorScaleY = bh / (ps.gridSize.nY * 1000);

    ctx.fillStyle = '#1A2B4C';
    ctx.beginPath();
    for(const path of islands){
      path.forEach((pt,i)=>{
        const x = ox + (bx + pt.X * vectorScaleX) * scaleX;
        const y = oy + (by + pt.Y * vectorScaleY) * scaleY;
        i===0 ? ctx.moveTo(x,y) : ctx.lineTo(x,y);
      });
      ctx.closePath();
    }
    ctx.fill('evenodd');
  }

  function drawComparisonPreview() {
    const state = window.QRApp.state;
    const ps = state.pipelineState;
    if (!ps || !ps.shrunkIslands) return;
    
    drawIslandPreview(ps.shrunkIslands);
    
    const opacity = parseInt(document.getElementById('sl-opacity').value) / 100;
    const diff = document.getElementById('tog-diff').classList.contains('on');
    
    const cv = window.QRApp.elements.canvas;
    const ctx = window.QRApp.elements.ctx;
    
    const s = (cv.width - 60) / Math.max(ps.W, ps.H);
    const nw = ps.W * s;
    const nh = ps.H * s;
    const ox = (cv.width - nw) / 2;
    const oy = (cv.height - nh) / 2;
    
    if (opacity > 0 && ps.imgData && !diff) {
      ctx.globalAlpha = opacity;
      ctx.drawImage(ps.imgData, ox, oy, nw, nh);
      ctx.globalAlpha = 1.0;
    }
    
    if (diff && ps.imgData) {
      const tmpCv = document.createElement('canvas');
      tmpCv.width = cv.width; tmpCv.height = cv.height;
      const tCtx = tmpCv.getContext('2d');
      tCtx.fillStyle = '#FFFFFF';
      tCtx.fillRect(0,0,cv.width,cv.height);
      tCtx.drawImage(ps.imgData, ox, oy, nw, nh);
      
      const origPx = tCtx.getImageData(0,0,cv.width,cv.height).data;
      const curPx = ctx.getImageData(0,0,cv.width,cv.height).data;
      
      const outPx = new Uint8ClampedArray(origPx.length);
      for(let i=0; i<origPx.length; i+=4) {
        const lOrig = origPx[i]*0.3 + origPx[i+1]*0.59 + origPx[i+2]*0.11;
        let oDark = lOrig < 128;
        const vDark = curPx[i+3] > 128;
        
        if (oDark && !vDark) {
          outPx[i]=255; outPx[i+1]=0; outPx[i+2]=0; outPx[i+3]=255;
        } else if (!oDark && vDark) {
          outPx[i]=0; outPx[i+1]=200; outPx[i+2]=255; outPx[i+3]=255;
        } else {
          outPx[i] = vDark ? 0 : 255;
          outPx[i+1] = vDark ? 0 : 255;
          outPx[i+2] = vDark ? 0 : 255;
          outPx[i+3] = 255;
        }
      }
      const idata = new ImageData(outPx, cv.width, cv.height);
      ctx.putImageData(idata, 0, 0);
    }
  }

  function drawCropOverlay(){
    const state = window.QRApp.state;
    const cv = window.QRApp.elements.canvas;
    const ctx = window.QRApp.elements.ctx;
    ctx.clearRect(0,0,cv.width,cv.height);
    ctx.drawImage(state.cropSrcImg, 0, 0, cv.width, cv.height);
    
    ctx.fillStyle = 'rgba(0,0,0,0.52)'; 
    ctx.fillRect(0,0,cv.width,cv.height);
    
    if(!state.cropPts) {
      if (state.cropRectDragging && state.cropStart && state.cropCurrent) {
        const x = Math.min(state.cropStart.x, state.cropCurrent.x) * state.cropScale;
        const y = Math.min(state.cropStart.y, state.cropCurrent.y) * state.cropScale;
        const w = Math.abs(state.cropStart.x - state.cropCurrent.x) * state.cropScale;
        const h = Math.abs(state.cropStart.y - state.cropCurrent.y) * state.cropScale;
        
        ctx.clearRect(x,y,w,h);
        ctx.drawImage(state.cropSrcImg, x/state.cropScale, y/state.cropScale, w/state.cropScale, h/state.cropScale, x, y, w, h);
        ctx.strokeStyle = '#1E3A6E'; ctx.lineWidth = 2; ctx.strokeRect(x,y,w,h);
      } else {
        ctx.fillStyle = '#FFF';
        ctx.font = '21px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(window.QRApp.i18n ? window.QRApp.i18n.get('lbl_crop_select') : 'Select area to crop', cv.width/2, cv.height/2);
        ctx.textAlign = 'left';
      }
      return;
    }
    
    
    ctx.save();
    ctx.beginPath();
    state.cropPts.forEach((pt, i) => {
      const px = pt.x * state.cropScale;
      const py = pt.y * state.cropScale;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    });
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(state.cropSrcImg, 0, 0, cv.width, cv.height);
    ctx.restore();
    
    
    ctx.strokeStyle = '#1E3A6E'; 
    ctx.lineWidth = 2;
    ctx.beginPath();
    state.cropPts.forEach((pt, i) => {
      const px = pt.x * state.cropScale;
      const py = pt.y * state.cropScale;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    });
    ctx.closePath();
    ctx.stroke();
    
    
    const hs = 15; 
    ctx.fillStyle = '#E8E2D5';
    
    state.cropPts.forEach(pt => {
      const px = pt.x * state.cropScale;
      const py = pt.y * state.cropScale;
      ctx.fillRect(px - hs/2, py - hs/2, hs, hs);
      ctx.strokeRect(px - hs/2, py - hs/2, hs, hs);
    });
    
    for (let i=0; i<4; i++) {
      const pt1 = state.cropPts[i];
      const pt2 = state.cropPts[(i+1)%4];
      const px = (pt1.x + pt2.x)/2 * state.cropScale;
      const py = (pt1.y + pt2.y)/2 * state.cropScale;
      ctx.beginPath();
      ctx.arc(px, py, hs/2, 0, 2*Math.PI);
      ctx.fill();
      ctx.stroke();
    }
  }

  return { updateLabel, updateIntLabel, setText, toggleAuto, toggleAutoWarp, toggleDecompose, toggleManualGrid, toggleDiff, setStage, viewStage, tick, getPreviewSize, drawCellPreview, drawIslandPreview, drawCropOverlay, updateMainButton, markSettingsChanged };
})();
