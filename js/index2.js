//Добавить bg fff - page item
//Добавить паддинги у page item убрать у page wrapper or
//Добавить номер страницы
//Подумать о реализации переключения по страницам (1 2 3 ... n-1 n)
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

  $blockContent.innerHTML += `<h2 class="simple-read__title">${document.title}</h2>`;

  const $article = document.querySelector('article');
  let $pages;
  let pageHeight = 750;
  if($article) {
    $pages = generateBookPages($article, pageHeight);

    $blockContent.appendChild($pages);
  }


  $wrapper.appendChild($blockContent);
  $blockBody.appendChild($wrapper);

  const $iframe = document.createElement('iframe');
  $iframe.className = 'simple-read simple-read_hide';
  setTimeout(() => {
    $iframe.classList.remove('simple-read_hide');
  }, 600);

  document.body.appendChild($iframe);

  const iframeDocument = $iframe.contentWindow.document;
  
  iframeDocument.head.innerHTML += getFrameFonts();

  addStylesheet(iframeDocument, 'css/iframe.css');
  
  const $interface = getUI();
  iframeDocument.body.appendChild($interface);
  iframeDocument.body.appendChild($blockBody);

  if (!$pages) {
    return;
  }

  let thisPageNum = 0;
  const pageWidth = 810;
  const pagesNum = iframeDocument.querySelectorAll('.pages__item').length;
  const $pagesNextBtn = iframeDocument.querySelector('.pages__next');
  const $pagesPrevBtn = iframeDocument.querySelector('.pages__prev');
  const $pagesList = iframeDocument.querySelector('.pages__list');
  const $pagesCount = iframeDocument.querySelector('.pages__count');

  $pagesCount.innerHTML = `${thisPageNum + 1}/${pagesNum}`;

  $pagesNextBtn.addEventListener('click', function() {
    $pagesPrevBtn.removeAttribute('disabled');
    
    if (thisPageNum >= pagesNum - 1) {
      return;
    }


    if (thisPageNum >= pagesNum - 2) {
      $pagesNextBtn.setAttribute('disabled', '');
    }

    $pagesList.style.transform = `translateX(${++thisPageNum * -pageWidth}px)`;

    $pagesCount.innerHTML = `${thisPageNum + 1}/${pagesNum}`;
  });

  $pagesPrevBtn.addEventListener('click', function() {
    $pagesNextBtn.removeAttribute('disabled');
    if (thisPageNum <= 0) {
      return;
    }

    if (thisPageNum <= 1) {
      $pagesPrevBtn.setAttribute('disabled', '');
    }

    $pagesList.style.transform = `translateX(${--thisPageNum * -pageWidth}px)`;

    $pagesCount.innerHTML = `${thisPageNum + 1}/${pagesNum}`;
  });
}

function createElem(nameClass, html) {
  const elem = document.createElement('div');
  elem.className = nameClass;

  if (html) {
    elem.innerHTML = html;
  }

  return elem;
}

function generateBookPages($article, maxPageHeight) {
  let sumHeight = 0;
  let $pagesList = createElem('pages__list');
  let $bookPage = createElem('pages__item');
  
  clone($article);

  function clone($article) {
    [...$article.children].forEach(($elem) => {
      if ($elem.tagName === 'PRE') {
        $bookPage.appendChild($elem.cloneNode(true));
        sumHeight += getElemFullHeight($elem);     
        return;
      }
  
      if ($elem.className.indexOf('hljs') !== -1 || $elem.tagName === 'CODE' ||
          $elem.tagName === 'BR') {
        return;
      }

      if ($elem.tagName === 'IMG' && (400 + sumHeight) > maxPageHeight) {
        $pagesList.appendChild($bookPage);
        $bookPage = createElem('pages__item');
        sumHeight = 400;
        $bookPage.appendChild($elem.cloneNode(true));
        return;
      }
  
      if (getElemFullHeight($elem) > maxPageHeight) {
        clone($elem);
      } else if ( (sumHeight + getElemFullHeight($elem)) <= maxPageHeight ) {
        $bookPage.appendChild($elem.cloneNode(true));
        sumHeight += getElemFullHeight($elem);      
      } else {
        $pagesList.appendChild($bookPage);
        $bookPage = createElem('pages__item');
        $bookPage.appendChild($elem.cloneNode(true));
        sumHeight = getElemFullHeight($elem);
      }
    });
  }

  if ($bookPage.innerHTML) {
    $pagesList.appendChild($bookPage);
  }

  let $pagesWrapper = createElem('pages__wrapper');
  $pagesWrapper.appendChild($pagesList);

  let $pages = createElem(
    'pages',
    `<button class="pages__prev" disabled>←</button><button class="pages__next">→</button>
     <span class="pages__count">1/15</span>`);
  $pages.appendChild($pagesWrapper)

  return $pages;
}

function getElemFullHeight($elem) {
  const style = window.getComputedStyle($elem);
  const margins = parseFloat(style.marginTop) + parseFloat(style.marginBottom);

  return $elem.offsetHeight + margins;
}

function createBookPage() {
  const $page = document.createElement('div');
  $page.className = 'page';

  return $page;
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