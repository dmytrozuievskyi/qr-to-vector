window.QRApp.imageUtils = (function() {
  const { state, elements, ui, math } = window.QRApp;

  async function autoDetectQR(img){
    const MAX_SCAN = 1400;
    const ss = Math.min(1, MAX_SCAN/Math.max(img.width, img.height));
    const sw = Math.round(img.width*ss), sh = Math.round(img.height*ss);
    const sc = document.createElement('canvas');
    sc.width = sw; sc.height = sh;
    sc.getContext('2d').drawImage(img,0,0,sw,sh);
    const idata = sc.getContext('2d').getImageData(0,0,sw,sh);

    const code = jsQR(idata.data, sw, sh, {inversionAttempts:'attemptBoth'});

    if(!code){
      enterCropMode(img);
      return;
    }

    const cs = 1/ss;
    const corners = {
      tl:{x:code.location.topLeftCorner.x*cs,    y:code.location.topLeftCorner.y*cs},
      tr:{x:code.location.topRightCorner.x*cs,   y:code.location.topRightCorner.y*cs},
      br:{x:code.location.bottomRightCorner.x*cs, y:code.location.bottomRightCorner.y*cs},
      bl:{x:code.location.bottomLeftCorner.x*cs,  y:code.location.bottomLeftCorner.y*cs}
    };

    state.cropMode = true;
    state.cropSrcImg = img;
    state.cropPts = [corners.tl, corners.tr, corners.br, corners.bl];
    state.cropScale = Math.min(ui.getPreviewSize()/img.width, ui.getPreviewSize()/img.height, 1);
    
    await ui.tick(); await ui.tick();

    
    
    confirmCrop();
  }

  function showDetectionOverlay(img, corners){
    const canvas = elements.canvas;
    const ctx = elements.ctx;
    const wrap = elements.wrap;
    const maxW = Math.max(200, wrap.clientWidth-2);
    const maxH = Math.max(200, wrap.clientHeight-2)||540;
    const s = Math.min(maxW/img.width, maxH/img.height, 1);
    
    canvas.width = Math.round(img.width*s); 
    canvas.height = Math.round(img.height*s);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    
    ctx.fillStyle = 'rgba(0,0,0,0.45)';
    ctx.fillRect(0,0,canvas.width,canvas.height);
    ctx.strokeStyle = '#c8f04a'; ctx.lineWidth = 2; ctx.setLineDash([5,3]);
    
    ctx.beginPath();
    const pts = [corners.tl, corners.tr, corners.br, corners.bl];
    pts.forEach(({x,y},i)=>{ i===0 ? ctx.moveTo(x*s,y*s) : ctx.lineTo(x*s,y*s); });
    ctx.closePath(); ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle = '#c8f04a';
    pts.forEach(({x,y})=>{ ctx.beginPath(); ctx.arc(x*s,y*s,5,0,Math.PI*2); ctx.fill(); });
  }

  function perspectiveWarp(img, corners, outW, outH){
    
    outH = outH || outW;
    const pad = 0; 
    const srcPts = [corners.tl, corners.tr, corners.br, corners.bl];
    const dstPts = [{x:pad,y:pad},{x:outW-pad,y:pad},{x:outW-pad,y:outH-pad},{x:pad,y:outH-pad}];
    const H = math.computeHomography(srcPts, dstPts);
    const Hinv = math.invertMat3(H);
    
    const srcCv = document.createElement('canvas');
    srcCv.width = img.width; srcCv.height = img.height;
    srcCv.getContext('2d').drawImage(img,0,0);
    const srcPx = srcCv.getContext('2d').getImageData(0,0,img.width,img.height).data;
    
    const W = img.width, IH = img.height;
    const outCv = document.createElement('canvas');
    outCv.width = outW; outCv.height = outH;
    const oc = outCv.getContext('2d');
    const outId = oc.createImageData(outW,outH);
    const outPx = outId.data;
    
    for(let oy=0;oy<outH;oy++){
      for(let ox=0;ox<outW;ox++){
        const [sx,sy] = math.applyH(Hinv, ox, oy);
        const oi = (oy*outW+ox)*4;
        if(sx<0 || sy<0 || sx>=W-1 || sy>=IH-1){
          outPx[oi] = outPx[oi+1] = outPx[oi+2] = 255; outPx[oi+3] = 255; 
          continue;
        }
        const xi = Math.floor(sx), yi = Math.floor(sy);
        const fx = sx-xi, fy = sy-yi, x1 = xi+1, y1 = yi+1;
        for(let c=0;c<3;c++){
          const p00 = srcPx[(yi*W+xi)*4+c], p10 = srcPx[(yi*W+x1)*4+c];
          const p01 = srcPx[(y1*W+xi)*4+c], p11 = srcPx[(y1*W+x1)*4+c];
          outPx[oi+c] = Math.round(p00*(1-fx)*(1-fy) + p10*fx*(1-fy) + p01*(1-fx)*fy + p11*fx*fy);
        }
        outPx[oi+3] = 255;
      }
    }
    oc.putImageData(outId,0,0);
    return outCv;
  }

  function enterCropMode(img){
    state.decompose = false;
    state.cropMode = true; 
    if (state.cropSrcImg !== img) {
      state.cropPts = null;
    }
    state.cropSrcImg = img; 
    state.cropRectDragging = false;
    state.cropStart = null;
    state.cropCurrent = null;

    ui.setStage(1);
    ui.viewStage(1);

    const wrap = elements.wrap;
    const maxW = Math.max(200, wrap.clientWidth-2);
    const maxH = Math.max(200, wrap.clientHeight-2)||540;
    
    state.cropScale = Math.min(maxW/img.width, maxH/img.height, 1);
    
    const canvas = elements.canvas;
    canvas.width = Math.round(img.width*state.cropScale);
    canvas.height = Math.round(img.height*state.cropScale);
    canvas.classList.add('crop-mode');
    
    ui.drawCropOverlay();
  }

  function exitCropMode(msg){
    state.cropMode = false;
    const canvas = elements.canvas;
    const ctx = elements.ctx;
    
    canvas.classList.remove('crop-mode');
    
    ui.setStage(1);
    ui.viewStage(1);
    
    window.QRApp.vectorizer.computeMatrix().then(() => {
      ui.setStage(2);
      ui.viewStage(2);
    });
  }

  function confirmCrop(){
    if(!state.cropPts){ skipCrop(); return; }
    const corners = {
      tl: state.cropPts[0],
      tr: state.cropPts[1],
      br: state.cropPts[2],
      bl: state.cropPts[3]
    };
    
    const d1 = Math.hypot(corners.tr.x - corners.tl.x, corners.tr.y - corners.tl.y); 
    const d2 = Math.hypot(corners.br.x - corners.tr.x, corners.br.y - corners.tr.y); 
    const d3 = Math.hypot(corners.bl.x - corners.br.x, corners.bl.y - corners.br.y); 
    const d4 = Math.hypot(corners.tl.x - corners.bl.x, corners.tl.y - corners.bl.y); 
    
    let outW = Math.round(Math.max(d1, d3));
    let outH = Math.round(Math.max(d2, d4));
    
    
    const maxDim = 800;
    if (outW > maxDim || outH > maxDim) {
      const scale = maxDim / Math.max(outW, outH);
      outW = Math.round(outW * scale);
      outH = Math.round(outH * scale);
    }
    outW = Math.max(100, outW);
    outH = Math.max(100, outH);
    
    let warpedCanvas;
    let isSquare = false;
    let outSize = Math.max(outW, outH);
    
    const ratio = Math.min(outW, outH) / Math.max(outW, outH);
    if (ratio > 0.95) {
      
      isSquare = true;
      outW = outH = outSize;
    } else {
      
      try {
        warpedCanvas = perspectiveWarp(state.cropSrcImg, corners, outSize, outSize);
        const wcCtx = warpedCanvas.getContext('2d');
        const wcPx = wcCtx.getImageData(0,0,outSize,outSize).data;
        const code = jsQR(wcPx, outSize, outSize, {inversionAttempts:'attemptBoth'});
        if (code && code.location) {
          isSquare = true; 
          outW = outH = outSize;
        }
      } catch(e) {}
    }
    
    try {
      if (isSquare && warpedCanvas) {
        
      } else {
        
        warpedCanvas = perspectiveWarp(state.cropSrcImg, corners, outW, outH);
      }
    } catch(e) {
      console.error(e);
      return;
    }
    
    
    if (isSquare) {
      const wcCtx = warpedCanvas.getContext('2d');
      const wcPx = wcCtx.getImageData(0,0,outSize,outSize).data;
      const code = jsQR(wcPx, outSize, outSize, {inversionAttempts:'attemptBoth'});
      if (code && code.location) {
        const refinedCorners = {
          tl: {x: code.location.topLeftCorner.x, y: code.location.topLeftCorner.y},
          tr: {x: code.location.topRightCorner.x, y: code.location.topRightCorner.y},
          br: {x: code.location.bottomRightCorner.x, y: code.location.bottomRightCorner.y},
          bl: {x: code.location.bottomLeftCorner.x, y: code.location.bottomLeftCorner.y}
        };
        try {
          warpedCanvas = perspectiveWarp(warpedCanvas, refinedCorners, outSize, outSize);
        } catch(e) {
          
        }
      }
    }
    
    const img = new Image();
    img.onload = ()=>{ 
      state.imgData = img; 
      exitCropMode('Cropped to '+outW+'x'+outH+'px — click Process'); 
    };
    img.src = warpedCanvas.toDataURL('image/png');
  }

  function skipCrop(){ 
    state.imgData = state.cropSrcImg; 
    exitCropMode('Full image '+state.cropSrcImg.width+'x'+state.cropSrcImg.height+'px — click Process'); 
  }

  function reEnterCrop(){
    ui.updateMainButton(); 
    ui.setStage(1);
    enterCropMode(state.originalImg);
  }

  function loadFile(file){
    if(!file) return;
    const reader = new FileReader();
    reader.onload = e => {
      const img = new Image();
      img.onload = () => {
        
        const tmpCv = document.createElement('canvas');
        tmpCv.width = img.width; tmpCv.height = img.height;
        const tmpCtx = tmpCv.getContext('2d');
        tmpCtx.fillStyle = '#FFFFFF';
        tmpCtx.fillRect(0, 0, tmpCv.width, tmpCv.height);
        tmpCtx.drawImage(img, 0, 0);
        
        const opaqueImg = new Image();
        opaqueImg.onload = () => {
          state.originalImg = opaqueImg;
          document.getElementById('drop-label').textContent = file.name;
          document.getElementById('drop-zone').classList.add('has-image');
          
          state.decompose = false;
          state.imgData = null; 
          state.cropSrcImg = null; 
          state.cropPts = null;
          state.currentIslands = null;
          state.pipelineState = {
            currentStage: -1,
            maxStage: -1,
            W: 0, H: 0, imgData: null, thresholdedPx: null, cells: null, gridSize: 0, rawIslands: null, shrunkIslands: null
          };
          ui.setStage(0);
          ui.updateMainButton('process');
          
          if(state.autoWarp) autoDetectQR(opaqueImg);
          else enterCropMode(opaqueImg);
        };
        opaqueImg.src = tmpCv.toDataURL('image/png');
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  }

  return { loadFile, enterCropMode, exitCropMode, confirmCrop, skipCrop, reEnterCrop };
})();
