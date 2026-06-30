window.QRApp = window.QRApp || {};
window.QRApp.state = {
  imgData: null,
  originalImg: null,
  currentIslands: null,
  gridSize: 0,
  autoDetect: true,
  settingsChanged: false,
  autoWarp: true,
  decompose: false,

  cropMode: false,
  cropSrcImg: null,
  cropScale: 1,
  cropSel: null,
  cropDragging: false,
  cropStart: null,

  pipelineState: {
    currentStage: -1,
    maxStage: -1,
    W: 0, H: 0,
    imgData: null,
    thresholdedPx: null,
    cells: null,
    gridSize: 0,
    rawIslands: null,
    shrunkIslands: null
  }
};

window.QRApp.elements = {
  get canvas() { return document.getElementById('preview-canvas'); },
  get ctx()    { return document.getElementById('preview-canvas').getContext('2d'); },
  get wrap()   { return document.getElementById('canvas-wrap'); },
  get logBox() { return document.getElementById('log'); }
};
