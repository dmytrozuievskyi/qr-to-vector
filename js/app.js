window.QRApp.app = (function() {
  const { state, elements, ui, imageUtils, vectorizer, export: exporter } = window.QRApp;

  function intersect(x1,y1, x2,y2, x3,y3, x4,y4) {
    const D = (x1 - x2)*(y3 - y4) - (y1 - y2)*(x3 - x4);
    if (Math.abs(D) < 1e-6) return null;
    const x = ((x1*y2 - y1*x2)*(x3 - x4) - (x1 - x2)*(x3*y4 - y3*x4))/D;
    const y = ((x1*y2 - y1*x2)*(y3 - y4) - (y1 - y2)*(x3*y4 - y3*x4))/D;
    return {x, y};
  }

  function init() {
    bindEvents();
    setupAdaptiveLayout();
    
    const bar = document.getElementById('stage-bar');
    if (bar) {
      bar.addEventListener('scroll', updateStageBarMask);
      window.addEventListener('resize', updateStageBarMask);
      setTimeout(updateStageBarMask, 100);
    }
  }

  function updateStageBarMask() {
    const bar = document.getElementById('stage-bar');
    if (!bar) return;
    const isMobile = window.matchMedia('(max-width: 1200px) and (orientation: portrait)').matches;
    if (!isMobile) {
      bar.style.maskImage = '';
      bar.style.webkitMaskImage = '';
      return;
    }
    
    const maxScroll = bar.scrollWidth - bar.clientWidth;
    if (maxScroll <= 0) {
      bar.style.maskImage = 'none';
      bar.style.webkitMaskImage = 'none';
      return;
    }
    
    const left = Math.ceil(bar.scrollLeft);
    const canScrollLeft = left > 5;
    const canScrollRight = left < maxScroll - 5;
    
    if (canScrollLeft && canScrollRight) {
      bar.style.maskImage = 'linear-gradient(to right, transparent, black 32px, black calc(100% - 32px), transparent)';
      bar.style.webkitMaskImage = 'linear-gradient(to right, transparent, black 32px, black calc(100% - 32px), transparent)';
    } else if (canScrollLeft) {
      bar.style.maskImage = 'linear-gradient(to right, transparent, black 32px, black)';
      bar.style.webkitMaskImage = 'linear-gradient(to right, transparent, black 32px, black)';
    } else if (canScrollRight) {
      bar.style.maskImage = 'linear-gradient(to left, transparent, black 32px, black)';
      bar.style.webkitMaskImage = 'linear-gradient(to left, transparent, black 32px, black)';
    } else {
      bar.style.maskImage = 'none';
      bar.style.webkitMaskImage = 'none';
    }
  }

  function setupAdaptiveLayout() {
    const app = document.getElementById('app');
    const preview = document.querySelector('.preview-area');
    const wrap = document.getElementById('canvas-wrap');
    const sidebar = document.querySelector('.sidebar');
    
    if (!app || !preview || !wrap || !sidebar) return;
    
    const adjust = () => {
      const isMobile = window.matchMedia('(max-width: 1200px) and (orientation: portrait)').matches;
      const stages = document.getElementById('sidebar-stages');
      
      if (isMobile) {
        app.style.maxWidth = 'none';
        if (stages) {
          stages.style.minHeight = '0px';
        }
      } else {
        if (stages) stages.style.minHeight = '0px';
        app.style.maxWidth = 'none'; 
        const targetWrapWidth = wrap.clientHeight;
        const cs = window.getComputedStyle(preview);
        const padX = parseFloat(cs.paddingLeft) + parseFloat(cs.paddingRight);
        const sidebarWidth = sidebar.getBoundingClientRect().width;
        const targetAppWidth = sidebarWidth + targetWrapWidth + padX;
        app.style.maxWidth = Math.min(2100, targetAppWidth) + 'px';
      }
      
      if (typeof window.QRApp.ui?.resize === 'function') {
        window.QRApp.ui.resize();
      }
    };
    
    window.addEventListener('resize', adjust);
    
    setTimeout(adjust, 0);
  }

  function bindEvents() {
    
    document.querySelectorAll('.lang-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const lang = e.target.dataset.lang;
        window.QRApp.i18n.setLanguage(lang);
      });
    });

    
    const togAutowarp = document.getElementById('tog-autowarp');
    if (togAutowarp) togAutowarp.addEventListener('click', ui.toggleAutoWarp);
    const togAuto = document.getElementById('tog-auto');
    if (togAuto) togAuto.addEventListener('click', ui.toggleAuto);
    
    document.getElementById('tog-manual-grid').addEventListener('click', ui.toggleManualGrid);
    
    document.getElementById('tog-diff').addEventListener('click', ui.toggleDiff);
    document.getElementById('sl-opacity').addEventListener('input', () => {
      if (state.pipelineState && state.pipelineState.currentStage >= 3) {
        ui.viewStage(state.pipelineState.currentStage);
      }
    });
    
    
    const updatePolygonsLive = async () => {
      ui.markSettingsChanged();
      if (state.pipelineState && state.pipelineState.cells) {
        await vectorizer.computePolygons();
        await vectorizer.computeVerification();
      }
    };

    document.getElementById('sl-cell-gap').addEventListener('change', updatePolygonsLive);
    document.getElementById('sl-shrink').addEventListener('input', function(e) {
      const val = parseInt(this.value, 10);
      ui.updateLabel('lbl-shrink', (val > 0 ? '+' : '') + (val/100).toFixed(2));
    });
    document.getElementById('sl-shrink').addEventListener('change', updatePolygonsLive);
    
    document.getElementById('sl-cell-gap').addEventListener('input', function(e) {
      ui.updateLabel('lbl-cell-gap', (this.value/100).toFixed(2));
    });
    
    document.getElementById('tog-corner-style').addEventListener('click', function(e) {
      this.classList.toggle('on');
      updatePolygonsLive();
    });
    
    document.getElementById('sl-bevel').addEventListener('input', function(e) {
      ui.updateLabel('lbl-bevel', (this.value/100).toFixed(2));
    });
    document.getElementById('sl-bevel').addEventListener('change', updatePolygonsLive);
    
    document.getElementById('out-format').addEventListener('change', function(e) {
      const format = this.value.toUpperCase();
      const baseText = window.QRApp.i18n.get('btn_export');
      document.getElementById('btn-export').textContent = baseText + ' ' + format;

      const unitSelect = document.getElementById('out-unit');
      const wInput = document.getElementById('out-w');
      const hInput = document.getElementById('out-h');

      if (this.value === 'png') {
        if (!state.lastVectorSize) {
          state.lastVectorSize = { w: wInput.value, h: hInput.value, unit: unitSelect.value };
          wInput.value = 2048;
          hInput.value = 2048;
          unitSelect.value = 'px';
        }
        unitSelect.disabled = true;
        unitSelect.parentElement.style.opacity = '0.5';
      } else {
        if (state.lastVectorSize) {
          wInput.value = state.lastVectorSize.w;
          hInput.value = state.lastVectorSize.h;
          unitSelect.value = state.lastVectorSize.unit;
          state.lastVectorSize = null;
        }
        unitSelect.disabled = false;
        unitSelect.parentElement.style.opacity = '1';
      }
    });
    
    
    document.getElementById('in-grid-w').addEventListener('change', () => {
      ui.markSettingsChanged();
      vectorizer.updateGridPreview();
    });
    
    const slMask = document.getElementById('sl-center-mask');
    if (slMask) {
      slMask.addEventListener('input', function(e) {
        ui.updateIntLabel('lbl-center-mask', this.value);
        state.centerMaskStep = parseInt(this.value, 10);
        if (state.pipelineState && state.pipelineState.currentStage >= 2) {
           ui.viewStage(2);
        }
      });
      slMask.addEventListener('change', function(e) {
        ui.markSettingsChanged();
        vectorizer.updateGridPreview();
      });
    }
    document.getElementById('in-grid-h').addEventListener('change', () => {
      ui.markSettingsChanged();
      vectorizer.updateGridPreview();
    });
    
    
    
    
    document.getElementById('btn-next-matrix').addEventListener('click', async () => {
      await vectorizer.computePolygons();
      ui.setStage(3);
      ui.viewStage(3);
    });
    
    document.getElementById('btn-next-polygons').addEventListener('click', async () => {
      await vectorizer.computeVerification();
      ui.setStage(4);
      ui.viewStage(4);
    });
    
    
    const btnExport = document.getElementById('btn-export');
    if(btnExport) btnExport.addEventListener('click', () => {
      window.QRApp.export.exportFile();
    });
    
    
    const btnRecreate = document.getElementById('btn-recreate-data');
    if (btnRecreate) {
      btnRecreate.addEventListener('click', async () => {
        state.decompose = true;
        await vectorizer.computeMatrix();
        await vectorizer.computePolygons();
        await vectorizer.computeVerification();
        ui.viewStage(4);
      });
    }
    
    const btnCancelRecreate = document.getElementById('btn-cancel-recreate');
    if (btnCancelRecreate) {
      btnCancelRecreate.addEventListener('click', async () => {
        state.decompose = false;
        await vectorizer.computeMatrix();
        await vectorizer.computePolygons();
        await vectorizer.computeVerification();
        ui.viewStage(4);
      });
    }
    
    const logHeader = document.getElementById('log-header');
    
    
    document.getElementById('btn-crop-confirm').addEventListener('click', imageUtils.confirmCrop);
    document.getElementById('btn-crop-skip').addEventListener('click', imageUtils.skipCrop);
    
    
    for(let i=0; i<=4; i++) {
      const sp = document.getElementById('sp-'+i);
      if(sp) {
        sp.addEventListener('click', () => {
          if (state.decompose && (i === 1 || i === 2)) return; 
          if (i === 1) {
            imageUtils.reEnterCrop();
          } else {
            ui.setStage(i);
            ui.viewStage(i);
          }
        });
      }
    }
    
    
    const dz = document.getElementById('drop-zone');
    const fi = document.getElementById('file-input');
    
    dz.addEventListener('dragover', e => { e.preventDefault(); dz.classList.add('drag-over'); });
    dz.addEventListener('dragleave', () => dz.classList.remove('drag-over'));
    dz.addEventListener('drop', e => { 
      e.preventDefault(); 
      dz.classList.remove('drag-over'); 
      imageUtils.loadFile(e.dataTransfer.files[0]); 
    });
    fi.addEventListener('change', e => imageUtils.loadFile(e.target.files[0]));
    
    document.addEventListener('paste', e => {
      const items = e.clipboardData?.items; 
      if(!items) return;
      for(const item of items){ 
        if(item.type.startsWith('image/')){ 
          e.preventDefault(); 
          const f = item.getAsFile(); 
          if(f){ imageUtils.loadFile(f); break; } 
        } 
      }
    });

    
    const canvas = elements.canvas;
    function canvasToImg(e){
      const rect = canvas.getBoundingClientRect();
      const touch = e.touches?.[0];
      const cssX = (touch?touch.clientX:e.clientX) - rect.left;
      const cssY = (touch?touch.clientY:e.clientY) - rect.top;
      return {
        ix: Math.max(0, Math.min(state.cropSrcImg.width, Math.round(cssX*canvas.width/rect.width/state.cropScale))),
        iy: Math.max(0, Math.min(state.cropSrcImg.height, Math.round(cssY*canvas.height/rect.height/state.cropScale)))
      };
    }

    canvas.addEventListener('mousedown', e => {
      if(!state.cropMode) return; 
      e.preventDefault();
      const {ix,iy} = canvasToImg(e); 
      
      if (!state.cropPts) {
        state.cropStart = {x: ix, y: iy};
        state.cropCurrent = {x: ix, y: iy};
        state.cropRectDragging = true;
        return;
      }
      
      const hitRadius = 20 / state.cropScale;
      state.cropDraggingIdx = -1;
      state.dragStartX = ix;
      state.dragStartY = iy;
      state.dragStartPts = state.cropPts.map(p => ({x: p.x, y: p.y}));
      
      for (let i=0; i<4; i++) {
        const pt = state.cropPts[i];
        if (Math.hypot(pt.x - ix, pt.y - iy) < hitRadius) {
          state.cropDraggingIdx = i;
          return;
        }
      }
      for (let i=0; i<4; i++) {
        const pt1 = state.cropPts[i];
        const pt2 = state.cropPts[(i+1)%4];
        const mx = (pt1.x + pt2.x) / 2;
        const my = (pt1.y + pt2.y) / 2;
        if (Math.hypot(mx - ix, my - iy) < hitRadius) {
          state.cropDraggingIdx = i + 4;
          return;
        }
      }
    });
    
    canvas.addEventListener('mousemove', e => {
      if(!state.cropMode) return;
      const {ix,iy} = canvasToImg(e);
      
      if (!state.cropPts && state.cropRectDragging) {
        state.cropCurrent = {x: ix, y: iy};
        ui.drawCropOverlay();
        return;
      }
      
      if (state.cropPts && state.cropDraggingIdx >= 0) {
        if (state.cropDraggingIdx < 4) {
          state.cropPts[state.cropDraggingIdx].x = ix;
          state.cropPts[state.cropDraggingIdx].y = iy;
        } else {
          const edgeIdx = state.cropDraggingIdx - 4;
          const i = edgeIdx;
          const origA = state.dragStartPts[i];
          const origB = state.dragStartPts[(i + 1) % 4];
          const origC = state.dragStartPts[(i + 2) % 4];
          const origD = state.dragStartPts[(i + 3) % 4];
          
          const M2x = ix + origB.x - origA.x;
          const M2y = iy + origB.y - origA.y;
          
          const newA = intersect(origA.x, origA.y, origD.x, origD.y, ix, iy, M2x, M2y);
          const newB = intersect(origB.x, origB.y, origC.x, origC.y, ix, iy, M2x, M2y);
          
          if (newA && newB) {
            state.cropPts[i].x = newA.x;
            state.cropPts[i].y = newA.y;
            state.cropPts[(i + 1) % 4].x = newB.x;
            state.cropPts[(i + 1) % 4].y = newB.y;
          }
        }
        ui.drawCropOverlay();
      }
    });
    
    canvas.addEventListener('mouseup', () => { 
      if(!state.cropMode) return;
      if (!state.cropPts && state.cropRectDragging) {
        state.cropRectDragging = false;
        if (state.cropStart && state.cropCurrent) {
          const w = Math.abs(state.cropStart.x - state.cropCurrent.x);
          const h = Math.abs(state.cropStart.y - state.cropCurrent.y);
          if (w > 10 && h > 10) {
            const minX = Math.min(state.cropStart.x, state.cropCurrent.x);
            const minY = Math.min(state.cropStart.y, state.cropCurrent.y);
            const maxX = Math.max(state.cropStart.x, state.cropCurrent.x);
            const maxY = Math.max(state.cropStart.y, state.cropCurrent.y);
            state.cropPts = [
              {x: minX, y: minY},
              {x: maxX, y: minY},
              {x: maxX, y: maxY},
              {x: minX, y: maxY}
            ];
          }
        }
        ui.drawCropOverlay();
      } else if (state.cropPts) {
        state.cropDraggingIdx = -1;
      }
    });
    
    canvas.addEventListener('mouseleave', () => { 
      if(!state.cropMode) return;
      state.cropRectDragging = false;
      state.cropDraggingIdx = -1; 
    });
    
    canvas.addEventListener('touchstart', e => { 
      if(!state.cropMode) return; 
      e.preventDefault(); 
      const {ix,iy} = canvasToImg(e); 
      
      if (!state.cropPts) {
        state.cropStart = {x: ix, y: iy};
        state.cropCurrent = {x: ix, y: iy};
        state.cropRectDragging = true;
        return;
      }
      
      const hitRadius = 30 / state.cropScale;
      state.cropDraggingIdx = -1;
      state.dragStartX = ix;
      state.dragStartY = iy;
      state.dragStartPts = state.cropPts.map(p => ({x: p.x, y: p.y}));
      
      for (let i=0; i<4; i++) {
        const pt = state.cropPts[i];
        if (Math.hypot(pt.x - ix, pt.y - iy) < hitRadius) {
          state.cropDraggingIdx = i;
          return;
        }
      }
      for (let i=0; i<4; i++) {
        const pt1 = state.cropPts[i];
        const pt2 = state.cropPts[(i+1)%4];
        const mx = (pt1.x + pt2.x) / 2;
        const my = (pt1.y + pt2.y) / 2;
        if (Math.hypot(mx - ix, my - iy) < hitRadius) {
          state.cropDraggingIdx = i + 4;
          return;
        }
      }
    }, {passive:false});
    
    canvas.addEventListener('touchmove', e => { 
      if(!state.cropMode) return; 
      e.preventDefault(); 
      const {ix,iy} = canvasToImg(e); 
      
      if (!state.cropPts && state.cropRectDragging) {
        state.cropCurrent = {x: ix, y: iy};
        ui.drawCropOverlay();
        return;
      }
      
      if (state.cropPts && state.cropDraggingIdx >= 0) {
        if (state.cropDraggingIdx < 4) {
          state.cropPts[state.cropDraggingIdx].x = ix;
          state.cropPts[state.cropDraggingIdx].y = iy;
        } else {
          const edgeIdx = state.cropDraggingIdx - 4;
          const i = edgeIdx;
          const origA = state.dragStartPts[i];
          const origB = state.dragStartPts[(i + 1) % 4];
          const origC = state.dragStartPts[(i + 2) % 4];
          const origD = state.dragStartPts[(i + 3) % 4];
          
          const M2x = ix + origB.x - origA.x;
          const M2y = iy + origB.y - origA.y;
          
          const newA = intersect(origA.x, origA.y, origD.x, origD.y, ix, iy, M2x, M2y);
          const newB = intersect(origB.x, origB.y, origC.x, origC.y, ix, iy, M2x, M2y);
          
          if (newA && newB) {
            state.cropPts[i].x = newA.x;
            state.cropPts[i].y = newA.y;
            state.cropPts[(i + 1) % 4].x = newB.x;
            state.cropPts[(i + 1) % 4].y = newB.y;
          }
        }
        ui.drawCropOverlay(); 
      }
    }, {passive:false});
    
    canvas.addEventListener('touchend', () => { 
      if(!state.cropMode) return;
      if (!state.cropPts && state.cropRectDragging) {
        state.cropRectDragging = false;
        if (state.cropStart && state.cropCurrent) {
          const w = Math.abs(state.cropStart.x - state.cropCurrent.x);
          const h = Math.abs(state.cropStart.y - state.cropCurrent.y);
          if (w > 10 && h > 10) {
            const minX = Math.min(state.cropStart.x, state.cropCurrent.x);
            const minY = Math.min(state.cropStart.y, state.cropCurrent.y);
            const maxX = Math.max(state.cropStart.x, state.cropCurrent.x);
            const maxY = Math.max(state.cropStart.y, state.cropCurrent.y);
            state.cropPts = [
              {x: minX, y: minY},
              {x: maxX, y: minY},
              {x: maxX, y: maxY},
              {x: minX, y: maxY}
            ];
          }
        }
        ui.drawCropOverlay();
      } else if (state.cropPts) {
        state.cropDraggingIdx = -1;
      }
    });

    
    window.QRApp.i18n.setLanguage('en');
    ui.updateMainButton('process');
  }

  window.addEventListener('DOMContentLoaded', init);

  return { init };
})();
