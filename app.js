const canvas = document.getElementById('editorCanvas');
const ctx = canvas.getContext('2d');

const imageInput = document.getElementById('imageInput');
const brightness = document.getElementById('brightness');
const contrast = document.getElementById('contrast');
const saturate = document.getElementById('saturate');
const effectButtons = [...document.querySelectorAll('[data-effect]')];
const rotateLeft = document.getElementById('rotateLeft');
const rotateRight = document.getElementById('rotateRight');
const flipHorizontal = document.getElementById('flipHorizontal');
const flipVertical = document.getElementById('flipVertical');
const resetButton = document.getElementById('reset');
const downloadButton = document.getElementById('download');
const statusLabel = document.getElementById('status');

const state = {
  image: null,
  brightness: 100,
  contrast: 100,
  saturate: 100,
  effect: 'none',
  rotation: 0,
  flipX: 1,
  flipY: 1,
};

const setStatus = (text) => {
  statusLabel.textContent = text;
};

const buildFilter = () => {
  const effectsMap = {
    none: 'none',
    grayscale: 'grayscale(1)',
    sepia: 'sepia(1)',
    invert: 'invert(1)',
  };

  return `brightness(${state.brightness}%) contrast(${state.contrast}%) saturate(${state.saturate}%) ${effectsMap[state.effect]}`;
};

const drawImage = () => {
  if (!state.image) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    return;
  }

  const img = state.image;
  const rotated = Math.abs(state.rotation % 180) === 90;
  canvas.width = rotated ? img.naturalHeight : img.naturalWidth;
  canvas.height = rotated ? img.naturalWidth : img.naturalHeight;

  ctx.save();
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.translate(canvas.width / 2, canvas.height / 2);
  ctx.rotate((state.rotation * Math.PI) / 180);
  ctx.scale(state.flipX, state.flipY);

  ctx.filter = buildFilter();
  ctx.drawImage(img, -img.naturalWidth / 2, -img.naturalHeight / 2);
  ctx.restore();
};

const setActiveEffect = (effect) => {
  state.effect = effect;
  effectButtons.forEach((button) => {
    button.classList.toggle('active', button.dataset.effect === effect);
  });
};

const resetEditor = () => {
  state.brightness = 100;
  state.contrast = 100;
  state.saturate = 100;
  state.effect = 'none';
  state.rotation = 0;
  state.flipX = 1;
  state.flipY = 1;

  brightness.value = state.brightness;
  contrast.value = state.contrast;
  saturate.value = state.saturate;

  setActiveEffect('none');
  drawImage();
};

imageInput.addEventListener('change', (event) => {
  const [file] = event.target.files;
  if (!file) return;

  const img = new Image();
  img.onload = () => {
    state.image = img;
    resetEditor();
    setStatus(`Loaded: ${file.name}`);
  };

  img.onerror = () => {
    setStatus('Unable to load image. Please try another file.');
  };

  img.src = URL.createObjectURL(file);
});

brightness.addEventListener('input', () => {
  state.brightness = Number(brightness.value);
  drawImage();
});

contrast.addEventListener('input', () => {
  state.contrast = Number(contrast.value);
  drawImage();
});

saturate.addEventListener('input', () => {
  state.saturate = Number(saturate.value);
  drawImage();
});

effectButtons.forEach((button) => {
  button.addEventListener('click', () => {
    setActiveEffect(button.dataset.effect);
    drawImage();
  });
});

rotateLeft.addEventListener('click', () => {
  state.rotation -= 90;
  drawImage();
});

rotateRight.addEventListener('click', () => {
  state.rotation += 90;
  drawImage();
});

flipHorizontal.addEventListener('click', () => {
  state.flipX *= -1;
  drawImage();
});

flipVertical.addEventListener('click', () => {
  state.flipY *= -1;
  drawImage();
});

resetButton.addEventListener('click', () => {
  if (!state.image) return;
  resetEditor();
  setStatus('Edits reset.');
});

downloadButton.addEventListener('click', () => {
  if (!state.image) {
    setStatus('Load an image first before downloading.');
    return;
  }

  const link = document.createElement('a');
  const safeName = imageInput.files[0]?.name.replace(/\.[^/.]+$/, '') || 'photo';
  link.download = `${safeName}-edited.png`;
  link.href = canvas.toDataURL('image/png');
  link.click();
  setStatus('Downloaded edited image.');
});

setStatus('Choose an image to begin editing.');
