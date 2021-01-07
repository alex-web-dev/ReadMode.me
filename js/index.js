if(!document.querySelector('.simple-read')) {
  createFrame();
}


function createFrame() {
  appendFrameTemplate();

  disableHTML(document);  
}

function deleteFrame() {
  const iframe = document.querySelector('.simple-read');
  iframe.classList.add('simple-read_hide');

  iframe.addEventListener('transitionend', removeFrame);

  enableHTML(document);
}

function removeFrame() {
  const iframe = document.querySelector('.simple-read');
  iframe.removeEventListener('transitionend', removeFrame);
  iframe.remove();
}

function disableHTML(doc) {
  const html = doc.querySelector('html');
  
  html.classList.add('disable');
}

function enableHTML(doc){
  const html = doc.querySelector('html');
  html.classList.remove('disable');
}

function addStylesheet(doc, url) {
  const path = chrome.extension.getURL(url);
  const style = document.createElement('link');
  style.rel   = 'stylesheet';
  style.type  = 'text/css';
  style.href  = path;

  doc.head.appendChild(style);
}

function appendFrameTemplate() {
  const $blockBody = document.createElement('div');
  $blockBody.className = 'simple-read__body';
  
  const $wrapper = document.createElement('div');
  $wrapper.className = 'wrapper';

  const $blockContent = document.createElement('div');
  $blockContent.className = 'simple-read__content';

  $blockContent.innerHTML += `<h2>${document.title}</h2>`;

  const $allArticles = document.querySelectorAll('article');
  $allArticles.forEach(($article) => {
    $blockContent.innerHTML += `<article>${$article.innerHTML}</article>`;
  });

  $wrapper.appendChild($blockContent);
  $blockBody.appendChild($wrapper);

  const $iframe = document.createElement('iframe');
  $iframe.className = 'simple-read simple-read_hide';
  setTimeout(() => {
    $iframe.classList.remove('simple-read_hide');
  }, 200);

  document.body.appendChild($iframe);

  const iframeDocument = $iframe.contentWindow.document;
  
  iframeDocument.head.innerHTML += getFrameFonts();

  addStylesheet(iframeDocument, 'css/iframe.css');
  
  const $interface = getUI();
  iframeDocument.body.appendChild($interface);
  iframeDocument.body.appendChild($blockBody);
}

function getUI() {
  const ui = document.createElement('div');
  ui.className = 'interface';

  const closeBtn = document.createElement('button');
  closeBtn.className = 'interface__btn interface__btn_close';
  closeBtn.innerHTML = `<img src="${getPath('images/close.svg')}">`;
  closeBtn.addEventListener('click', () => {
    deleteFrame();
  });

  ui.appendChild(closeBtn);

  return ui;
}

function getPath(url) {
  return chrome.extension.getURL(url);
}

function getFrameFonts() {
  return `
    <link rel="preconnect" href="https://fonts.gstatic.com">
    <link href="https://fonts.googleapis.com/css2?family=Merriweather:wght@400;700;900&display=swap" rel="stylesheet">';
  `;
}