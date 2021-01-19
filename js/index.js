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
  $iframe.contentWindow.focus();
  window.addEventListener('beforeunload', () => {
    voiceCancel();
  });

  const iframeDocument = $iframe.contentWindow.document;
  
  iframeDocument.head.innerHTML += getFrameFonts();

  addStylesheet(iframeDocument, 'css/iframe.css');
  
  const $interface = getUI(iframeDocument);
  iframeDocument.body.appendChild($interface);
  iframeDocument.body.appendChild($blockBody);

  if (!$pages) {
    return;
  }

  createPagesControls(iframeDocument);
}

function createPagesControls(doc) {
  let thisPageNum = 0;
  const pageWidth = 810;
  const pagesNum = doc.querySelectorAll('.pages__item').length;
  const $pagesNextBtn = doc.querySelector('.pages__next');
  const $pagesPrevBtn = doc.querySelector('.pages__prev');
  const $pagesList = doc.querySelector('.pages__list');
  const $allPages = doc.querySelectorAll('.pages__item');
  const $pagesCount = doc.querySelector('.pages__count');

  $pagesCount.innerHTML = `${thisPageNum + 1}/${pagesNum}`;

  if(pagesNum === 1) {
    $pagesNextBtn.setAttribute('disabled', '');
  }

  $pagesNextBtn.addEventListener('click', function() {
    nextPage();
  });

  $pagesPrevBtn.addEventListener('click', function() {
    prevPage();
  });

  doc.addEventListener('keyup', (event) => {
    if(event.keyCode === 39) {
      nextPage();
    } else if(event.keyCode === 37) {
      prevPage();
    }
  });

  function nextPage() {
    if (thisPageNum >= pagesNum - 1) {
      return;
    }

    $pagesPrevBtn.removeAttribute('disabled');

    if (thisPageNum >= pagesNum - 2) {
      $pagesNextBtn.setAttribute('disabled', '');
    }

    $pagesList.style.transform = `translateX(${++thisPageNum * -pageWidth}px)`;
    $pagesCount.innerHTML = `${thisPageNum + 1}/${pagesNum}`;

    const activePage = doc.querySelector('.pages__item_active');
    if (activePage) {
      activePage.classList.remove('pages__item_active');
    }

    $allPages[thisPageNum].classList.add('pages__item_active');
  }

  function prevPage() {
    if (thisPageNum <= 0) {
      return;
    }

    $pagesNextBtn.removeAttribute('disabled');

    if (thisPageNum <= 1) {
      $pagesPrevBtn.setAttribute('disabled', '');
    }

    $pagesList.style.transform = `translateX(${--thisPageNum * -pageWidth}px)`;
    $pagesCount.innerHTML = `${thisPageNum + 1}/${pagesNum}`;

    const activePage = doc.querySelector('.pages__item_active');
    if (activePage) {
      activePage.classList.remove('pages__item_active');
    }

    $allPages[thisPageNum].classList.add('pages__item_active');
  }
}

function createElem(options) {
  const elem = document.createElement(options.tag);
  elem.className = options.nameClass;

  if (options.html) {
    elem.innerHTML = options.html;
  }

  return elem;
}

function generateBookPages($article, maxPageHeight) {
  let sumHeight = 0;
  const imgMaxHeight = 320;

  let $pagesList = createElem({
    tag: 'div', 
    nameClass: 'pages__list'
  });
  let $bookPage = createElem({
    tag: 'div', 
    nameClass: 'pages__item pages__item_active'
  });
  
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

      if ($elem.tagName === 'IMG' || $elem.tagName === 'FIGURE') {
        if ((imgMaxHeight + sumHeight) > maxPageHeight) {
          $pagesList.appendChild($bookPage);
          $bookPage = createElem({
            tag: 'div',
            nameClass: 'pages__item'}
          );
          sumHeight = imgMaxHeight;
          $bookPage.appendChild($elem.cloneNode(true));
        } else {
          sumHeight += imgMaxHeight;
          $bookPage.appendChild($elem.cloneNode(true));
        }

        return;
      }

      if (/H[1-6]/g.test($elem.tagName)) {
        const elemText = $elem.innerText;
        const lastSymbol = elemText[elemText.length - 1];
        if (lastSymbol !== '.' && lastSymbol !== '?' && lastSymbol !== '!') {
          $elem.innerText += '.';
        }
      }
  
      if (getElemFullHeight($elem) > maxPageHeight) {
        clone($elem);
      } else if ( (sumHeight + getElemFullHeight($elem)) <= maxPageHeight ) {
        $bookPage.appendChild($elem.cloneNode(true));
        sumHeight += getElemFullHeight($elem);      
      } else {
        $pagesList.appendChild($bookPage);
        $bookPage = createElem({
          tag: 'div',
          nameClass: 'pages__item'}
        );
        $bookPage.appendChild($elem.cloneNode(true));
        sumHeight = getElemFullHeight($elem);
      }
    });
  }

  if ($bookPage.innerHTML) {
    $pagesList.appendChild($bookPage);
  }

  let $pagesWrapper = createElem({
    tag: 'div',
    nameClass: 'pages__wrapper'
  });
  $pagesWrapper.appendChild($pagesList);

  let $pages = createElem({
    tag: 'div', 
    nameClass: 'pages',
    html: `
      <button class="pages__prev" disabled><img src="${getPath('images/angle-left.svg')}"></button>
      <button class="pages__next"><img src="${getPath('images/angle-right.svg')}"></button>
      <span class="pages__count"></span>`
  });
  $pages.appendChild($pagesWrapper);

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

function getUI(doc) {
  const ui = document.createElement('div');
  ui.className = 'interface';

  const closeBtn = getCloseBtn();
  const voiceBtn = getVoiceBtn(doc);

  ui.appendChild(voiceBtn);
  ui.appendChild(closeBtn);

  doc.addEventListener('keyup', deleteFrameKeyEvent);

  function deleteFrameKeyEvent(event) {
    if(event.keyCode === 27) {
      deleteFrame();
      voiceCancel();
      doc.removeEventListener('keyup', deleteFrameKeyEvent);
    }
  }

  return ui;
}

function getVoiceBtn(doc) {
  const voiceBtn = createElem({
    tag: 'button',
    nameClass: 'interface__btn interface__btn_voice',
    html: `
    <svg height="18">
      <path d="M3.587 5.933c-0.956 0-1.55 0.5-1.55 1.306v2.161c0 0.415 0.161 0.804 0.453 1.098 0.292 0.293 0.682 0.455 1.097 0.455h1.743l5.686 5.688v-16.429l-5.63 5.721h-1.799zM10.016 2.654v11.572l-4.272-4.273h-2.158c-0.303 0-0.549-0.248-0.549-0.553v-2.161c0-0.091 0-0.306 0.55-0.306h2.217l4.212-4.279zM12.005 10.987v-1c0.556 0 1.008-0.452 1.008-1.008s-0.452-1.008-1.008-1.008v-1c1.107 0 2.008 0.901 2.008 2.008s-0.901 2.008-2.008 2.008zM16.029 8.987c0 2.206-1.794 4-4 4v-1c1.654 0 3-1.346 3-3s-1.346-3-3-3v-1c2.205 0 4 1.795 4 4z" />
    </svg>`
  });

  voiceBtn.addEventListener('click', () => {
    if(voiceBtn.dataset.voice === 'active') {
      voiceCancel();
      
      voiceBtn.removeAttribute('data-voice', 'active');
    } else {
      const activePageClone = doc.querySelector('.pages__item_active').cloneNode(true);
      const itemCodeTags = activePageClone.querySelectorAll('code');
      itemCodeTags.forEach(codeTag => codeTag.remove());

      const text = activePageClone.innerText;
      voiceStart(text, doc);
      voiceBtn.setAttribute('data-voice', 'active');
    }
    
  });

  return voiceBtn;
}

function getCloseBtn() {
  const closeBtn = createElem({
    tag: 'button',
    nameClass: 'interface__btn interface__btn_close',
    html: `<img src="${getPath('images/close.svg')}" alt="Выйти" title="Выйти">`
  });

  closeBtn.addEventListener('click', () => {
    deleteFrame();
    voiceCancel();
  });

  return closeBtn;
}

function voiceCancel() {
  const synth = window.speechSynthesis;
  synth.cancel();
}

function voiceResume() {
  const synth = window.speechSynthesis;
  synth.resume();
}

function voiceStart(text, doc) {
  const length = 3399;
  text = text.substring(0, length);
  
  const synth = window.speechSynthesis;
  const voices = synth.getVoices();
  const voicePlayer = new SpeechSynthesisUtterance(text);
  const voiceName = 'Google русский';

  voicePlayer.onend = function() {
    const voiceBtn = doc.querySelector('.interface__btn_voice');
    voiceBtn.removeAttribute('data-voice');
  }

  voicePlayer.onerror = function() {
    alert('При попытке озвучить текст произошла ошибка.');
  }

  for (let voice of voices) {
      if (voice.name === voiceName) {
        voicePlayer.voice = voice;
      }
  }

  synth.speak(voicePlayer);

  const voiceBtn = doc.querySelector('.interface__btn_voice');
  const speaking = setInterval(() => {
    synth.resume();

    if (voiceBtn.dataset.voice !== 'active') {
      clearInterval(speaking);
    }
  }, 4000);
}

speechSynthesis.addEventListener('voiceschanged', function() {
});

function getPath(url) {
  return chrome.extension.getURL(url);
}

function getFrameFonts() {
  return `
    <link rel="preconnect" href="https://fonts.gstatic.com">
    <link href="https://fonts.googleapis.com/css2?family=Merriweather:wght@400;700;900&display=swap" rel="stylesheet">';
  `;
}