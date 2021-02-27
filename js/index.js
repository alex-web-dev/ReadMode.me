(() => {

  if(!document.querySelector('.simple-read')) {
    addTrackingScript();
    createFrame();
  }

  function addTrackingScript() {
    const $oldTracking = document.querySelector('script[src*="js/tracking.js"]');
    if ($oldTracking) {
      $oldTracking.remove();
    }

    const $tracking = document.createElement('script');
    $tracking.type = 'text/javascript';
    $tracking.src = getPath('js/tracking.js');
    const $s = document.getElementsByTagName('script')[0];
    $s.parentNode.insertBefore($tracking, $s);
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
    const $iframe = document.querySelector('.simple-read');
    $iframe.removeEventListener('transitionend', removeFrame);
    $iframe.remove();
  }
  
  function disableHTML(doc) {
    const $html = doc.querySelector('html');
    $html.classList.add('simple-read__disable');
  }
  
  function enableHTML(doc){
    const $html = doc.querySelector('html');
    $html.classList.remove('simple-read__disable');
  }
  
  function addStylesheet(doc, url) {
    const path = chrome.extension.getURL(url);
    const style = document.createElement('link');
    style.rel   = 'stylesheet';
    style.type  = 'text/css';
    style.href  = path;
  
    doc.head.appendChild(style);
  }

  async function getArticle() {
    const url = location.href;

    let article = {
      title: '',
      content: ''
    };

    article.title = getTitle();

    if (url.includes('fontanka.ru') && document.querySelector('section[itemprop="articleBody"]')) {
      const $articleClone = document.querySelector('section[itemprop="articleBody"]').cloneNode(true);
      $articleClone.querySelectorAll('.plyr, .flickity-button').forEach(item => item.remove());
      article.content = $articleClone.innerHTML;
    } else if (url.includes('echo.msk.ru') && document.querySelector('div[itemprop="articleBody"]')) {
      const $articleClone = document.querySelector('[itemprop="articleBody"]').cloneNode(true);
      $articleClone.querySelectorAll('figcaption').forEach(item => item.remove());
      article.content = $articleClone.innerHTML;
    } else if (url.includes('e1.ru') && document.querySelector('[itemprop="articleBody"]')) {      
      if (document.body.querySelector('h2[itemprop="headline"]')) {
        article.title = document.body.querySelector('h2[itemprop="headline"]').cloneNode(true);
      }

      const $articleClone = document.querySelector('[itemprop="articleBody"]').cloneNode(true);
      $articleClone.querySelectorAll('figcaption, .M1am9, .M1b3, .JDan3').forEach(item => item.remove());
      article.content = $articleClone.innerHTML;
    }

    if (article.content) {
      return article;
    }       

    if (typeof Mercury == 'undefined') {
      article.content = 'Содержимое страницы не найдено. Попробуйте обновить страницу.';
      return article;
    }

    Mercury.parse().then(result => {
      const minLength = 50;
      if (result.content.length >= minLength) {
        article.content = result.content;
      } else if (document.querySelector('article')) {
        const $defaultArticle = document.querySelector('article').cloneNode(true);
        $defaultArticle.querySelectorAll('header, h1').forEach(($elem) => $elem.remove());
        article.content = $defaultArticle.innerHTML;
      } else {
        article.content = 'Содержимое страницы не найдено';
      }
    });

    return await article;
  }

  function getTitle() {
    const $title = document.body.querySelector('h1');
    if ($title) {
      return $title.cloneNode(true);
    } else {
      return '';
    }
  }

  function getKeywords() {
    const $keywords = document.querySelector('meta[name*="eywords"]');
    
    if ($keywords && $keywords.getAttribute('content')) {
      return $keywords.getAttribute('content')
    } else {
      return '';
    }
  }

  async function appendFrameTemplate() {
    const $blockBody = document.createElement('div');
    $blockBody.className = 'simple-read__body';
    
    const $wrapper = document.createElement('div');
    $wrapper.className = 'wrapper';
  
    const $blockContent = document.createElement('div');
    $blockContent.className = 'simple-read__content';

    const article = await getArticle();
    if (article.title) {
      $blockContent.appendChild(article.title);
    }
    $blockContent.innerHTML += article.content;

    $wrapper.appendChild($blockContent);
    $blockBody.appendChild($wrapper);
  
    const $iframe = document.createElement('iframe');
    $iframe.className = 'simple-read simple-read_hide';
    setTimeout(() => {
      $iframe.classList.remove('simple-read_hide');
    }, 400);
  
    document.body.appendChild($iframe);
    $iframe.contentWindow.focus();
    window.addEventListener('beforeunload', () => {
      voiceCancel();
    });
  
    const iframeWindow = $iframe.contentWindow;
    const iframeDocument = iframeWindow.document;

    iframeDocument.head.innerHTML += getFrameFonts();
    addStylesheet(iframeDocument, 'css/iframe.css');
    
    const $interface = getUI(iframeDocument);
    iframeDocument.body.appendChild($interface);
    iframeDocument.body.appendChild($blockBody);


  
    scrollAnchorLinks(iframeWindow);
    addAnchorToTitles(iframeDocument);

    const $links = iframeDocument.querySelectorAll('a:not([href*="#"]):not([target="_blank"])');
    fixNotAnchorLinks($links);

    iframeWindow.addEventListener('click', (e) => {
      setTimeout(() => {
        const selectionText = iframeWindow.getSelection().toString().trim();
        if (!selectionText) {
          return;
        }
  
        const contextMenuOffsetX = 150;
        const contextMenuOffsetY = 60;
        const coords = {};

        if (e.clientX > (window.innerWidth - contextMenuOffsetX)) {
          coords.x = e.clientX - contextMenuOffsetX;
        } else {
          coords.x = e.clientX;
        }

        if (e.layerY > (window.innerHeight - contextMenuOffsetY)) {
          coords.y = e.layerY - contextMenuOffsetY;
        } else if (e.layerY < contextMenuOffsetY) {
          coords.y = contextMenuOffsetY;
        } else {
          coords.y = e.layerY;
        }
        
        const $contextMenu = getContextMenu(iframeWindow, coords);
        iframeDocument.body.appendChild($contextMenu);
      }, 10);
    });

    iframeWindow.addEventListener('mouseup', (e) => {
      const $contextMenu = iframeDocument.querySelector('.context-menu');
      if ($contextMenu) {
        $contextMenu.remove();
      }
    });
  }

  function addAnchorToTitles(iframeDoc) {
    let titlesAnchorsArray = [];
    [...document.querySelectorAll('h2, h3, h4, h5, h6')].forEach($title => {
        const $titlePrev = $title.previousElementSibling;
        if ($titlePrev && $titlePrev.getAttribute('name') && !$title.getAttribute('name')) {
          titlesAnchorsArray.push({
            text: $title.innerText ?? '',
            anchor: $titlePrev.getAttribute('name') ?? ''
          });
        }
    });

    iframeDoc.querySelectorAll('h2, h3, h4, h5, h6').forEach(($title, i) => {
      titlesAnchorsArray.forEach(item => {
        if(item.text === $title.innerText) {
          $title.setAttribute('name', item.anchor)
        }
      });
    });
  }

  function scrollAnchorLinks(win) {
    const doc = win.document;
    const $links = doc.querySelectorAll('a[href*="#"]:not([target="_blank"])')
    
    $links.forEach(($link) => {
      $link.addEventListener('click', (e) => {
        e.preventDefault();
  
        const blockID = $link.getAttribute('href');
        const blockName = $link.getAttribute('href').substr(1);
        const $block = doc.querySelector(`[name="${blockName}"]`) || doc.querySelector(blockID);
        
        if ($block) {
          const blockOffsetTop = $block.getBoundingClientRect().top;
          win.scrollBy({ top: (blockOffsetTop), left: 0, behavior: 'smooth' });
        }
      });
    });
  }
  
  function fixNotAnchorLinks($links) {
    $links.forEach(($link) => {
      $link.addEventListener('click', (e) => {
        e.preventDefault();
        removeFrame();
        location.href = $link.getAttribute('href');
      });
    });
  }
  
  function getUI(doc) {
    const $ui = document.createElement('div');
    $ui.className = 'interface';
  
    const $left = document.createElement('div');
    $left.className = 'interface__left';

    // const $simularPopupBtn = getSimularPopupBtn(doc);
    const $bookmarksPopupBtn = getBookmarksPopupBtn(doc);
    
    // $left.appendChild($simularPopupBtn);
    $left.appendChild($bookmarksPopupBtn);

    const $bookmarksBtn = getBookmarksBtn();
    const $voiceBtn = getVoiceBtn(doc);
    const $closeBtn = getCloseBtn();
  
    $ui.appendChild($left);
    $ui.appendChild($voiceBtn);
    $ui.appendChild($bookmarksBtn);
    $ui.appendChild($closeBtn);
  
    return $ui;
  }
  
  function getCloseBtn() {
    const $btn = document.createElement('button');
    $btn.className = 'interface__btn interface__btn_close';
    $btn.innerHTML = `<img src="${getPath('images/close.svg')}">`;
  
    $btn.addEventListener('click', () => {
      deleteFrame();
      voiceCancel();
    });
  
    return $btn;
  }
  
  function getBookmarksBtn() {
    const $btn = document.createElement('button');
    $btn.className = 'interface__btn interface__btn_bookmarks';
    $btn.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="48" viewBox="0 0 48 48">
        <path d="M34 6h-20c-2.21 0-3.98 1.79-3.98 4l-.02 32 14-6 14 6v-32c0-2.21-1.79-4-4-4z"/>
        <path class="test" d="M0 0h48v48h-48z" fill="none" />
      </svg>
    `;
  
    const thisURL = document.location.href;
    chrome.storage.local.get(['bookmarks'], function(result) {
      const bookmarks = result.bookmarks;
  
      if(hasBookmark(thisURL, bookmarks)) {
        $btn.classList.add('interface__btn_bookmarks_active');
      }
    });
  
    $btn.addEventListener('click', () => {
      chrome.storage.local.get(['bookmarks'], function(result) {
        const bookmarks = result.bookmarks;
      
        if(hasBookmark(thisURL, bookmarks)) {
            removeBookmark(thisURL);
            $btn.classList.remove('interface__btn_bookmarks_active');
            return;
        };

        const thisArticleName = document.title;
        addToBookmarks(thisURL, thisArticleName);
        $btn.classList.add('interface__btn_bookmarks_active');
      });
    });
  
    return $btn;
  }
  
  function getBookmarksPopupBtn(doc) {
    const $btn = document.createElement('button');
    $btn.className = 'interface__left-btn interface__btn_bookmarks-popup';
    $btn.innerHTML = 'Закладки';
    
    $btn.addEventListener('click', () => {
      const $popup = doc.querySelector('.bookmarks');
      if ($popup) {
        return;
      }
      
      chrome.storage.local.get(['bookmarks'], function(result) {
        const bookmarks = result.bookmarks;
        addBookmarksPopup(doc, bookmarks);
      });
    });
  
    return $btn;
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
  
  function addToBookmarks(url, name) {
    const newBookmark = {
      name: name,
      url: url
    }  
  
    chrome.storage.local.get(['bookmarks'], function(result) {
      const bookmarks = result.bookmarks;
      if (bookmarks) {
        if (hasBookmark(newBookmark.url, bookmarks)) {
          removeBookmark(newBookmark.url);
          return;
        }
        
        bookmarks.unshift(newBookmark);
        chrome.storage.local.set({'bookmarks': bookmarks});
      } else {
        chrome.storage.local.set({'bookmarks': [newBookmark]});
      }
    });
  }
  
  function hasBookmark(url, bookmarks) {
      if (!bookmarks) {
        return;
      }
      
      const isHasBookmark = bookmarks.some((item) => {
        return item.url === url
      });
  
      return isHasBookmark ? true : false;
  }
  
  function removeBookmark(url) {
    chrome.storage.local.get(['bookmarks'], (result) => {
      const bookmarks = result.bookmarks;
  
      bookmarks.forEach((bookmark, key) => {
        if (bookmark.url === url) {
          bookmarks.splice(key, 1);
        }
      });
  
      if (bookmarks.length === 0) {
        clearBookmarks();
      } else {
        chrome.storage.local.set({'bookmarks': bookmarks});
      }
    });
  }
  
  function clearBookmarks() {
    chrome.storage.local.remove('bookmarks');
  }
  
  function addBookmarksPopup(doc, bookmarks) {
    if (!doc) {
      return;
    }
  
    const $bookmarksPopup = document.createElement('div');
    $bookmarksPopup.className = 'bookmarks hide';
  
    const $popupContent = getBookmarksPopupContent(bookmarks);
    $bookmarksPopup.appendChild($popupContent);
  
    $bookmarksPopup.innerHTML += '<div class="mask"></div>';
    $bookmarksPopup.addEventListener('click', (e) => {
      if (e.target.classList.contains('mask')) {
        removePopup(doc, '.bookmarks');
      }
    });
  
    doc.body.appendChild($bookmarksPopup);
    setTimeout(() => {
      $bookmarksPopup.classList.remove('hide');
    }, 200);
  
    const $closePopupBtn = document.createElement('button');
    $closePopupBtn.className = 'close-btn bookmarks__close';
    $closePopupBtn.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg"  width="20" viewBox="0 0 329 329">
      <path d="m194.800781 164.769531 128.210938-128.214843c8.34375-8.339844 8.34375-21.824219 0-30.164063-8.339844-8.339844-21.824219-8.339844-30.164063 0l-128.214844 128.214844-128.210937-128.214844c-8.34375-8.339844-21.824219-8.339844-30.164063 0-8.34375 8.339844-8.34375 21.824219 0 30.164063l128.210938 128.214843-128.210938 128.214844c-8.34375 8.339844-8.34375 21.824219 0 30.164063 4.15625 4.160156 9.621094 6.25 15.082032 6.25 5.460937 0 10.921875-2.089844 15.082031-6.25l128.210937-128.214844 128.214844 128.214844c4.160156 4.160156 9.621094 6.25 15.082032 6.25 5.460937 0 10.921874-2.089844 15.082031-6.25 8.34375-8.339844 8.34375-21.824219 0-30.164063zm0 0"/>
    </svg>
    `;
    $closePopupBtn.addEventListener('click', () => {
      removePopup(doc, '.bookmarks');
    });
    $bookmarksPopup.appendChild($closePopupBtn);
  
    $bookmarkLinks = $bookmarksPopup.querySelectorAll('a');
    fixNotAnchorLinks($bookmarkLinks);
  }
  
  function getBookmarksPopupContent(bookmarks) {
    const $popupContent = document.createElement('div');
    $popupContent.className = 'bookmarks__content';
    $popupContent.innerHTML = '<div class="bookmarks__title">Закладки</div>'
  
    if (!bookmarks) {
      $popupContent.innerHTML += '<p>Список закладок пуст</p>';
    } else {
      const $bookmarksList = document.createElement('ul');
      $bookmarksList.className = 'bookmarks__list';
      bookmarks.forEach((bookmark, i) => {
        $bookmarksList.innerHTML += `
          <li class="bookmarks__item">
            <a href="${bookmark.url}" class="bookmarks__link">
              <img src="http://www.google.com/s2/favicons?domain=${bookmark.url}" class="bookmarks__icon">
              ${i + 1}. ${bookmark.name}
            </a>
          </li>
        `;
      });
  
      $popupContent.appendChild($bookmarksList);
    }
  
    return $popupContent;
  }
  
  function removePopup(doc, selector) {
    const $popup = doc.querySelector(selector);
    if (!$popup) {
      return;
    }

    $popup.classList.add('hide');
    setTimeout(() => {
      $popup.remove();
    }, 300);
  }
  
  function getVoiceBtn(doc) {
    const $voiceBtn = document.createElement('button');
    $voiceBtn.className = 'interface__btn interface__btn_voice';
    $voiceBtn.innerHTML = `
      <svg height="18">
        <path d="M3.587 5.933c-0.956 0-1.55 0.5-1.55 1.306v2.161c0 0.415 0.161 0.804 0.453 1.098 0.292 0.293 0.682 0.455 1.097 0.455h1.743l5.686 5.688v-16.429l-5.63 5.721h-1.799zM10.016 2.654v11.572l-4.272-4.273h-2.158c-0.303 0-0.549-0.248-0.549-0.553v-2.161c0-0.091 0-0.306 0.55-0.306h2.217l4.212-4.279zM12.005 10.987v-1c0.556 0 1.008-0.452 1.008-1.008s-0.452-1.008-1.008-1.008v-1c1.107 0 2.008 0.901 2.008 2.008s-0.901 2.008-2.008 2.008zM16.029 8.987c0 2.206-1.794 4-4 4v-1c1.654 0 3-1.346 3-3s-1.346-3-3-3v-1c2.205 0 4 1.795 4 4z" />
      </svg>`;
  
    $voiceBtn.addEventListener('click', () => {
      if($voiceBtn.dataset.voice === 'active') {
        voiceCancel();
        $voiceBtn.removeAttribute('data-voice', 'active');
      } else {
        const $articleClone = doc.querySelector('.simple-read__content').cloneNode(true);
        const $itemCodeTags = $articleClone.querySelectorAll('code');
        $itemCodeTags.forEach($codeTag => $codeTag.remove());
        
        $articleCloneTitle = $articleClone.querySelector('h1');
        if ($articleCloneTitle) {
          $articleCloneTitle.remove();
        }

        let text = $articleClone.innerText;
        voiceStart(text, doc);
        $voiceBtn.setAttribute('data-voice', 'active');
      }
    });
  
    return $voiceBtn;
  }
  
  speechSynthesis.addEventListener('voiceschanged', e => {});

  let voiceTextsArray = [];
  function voiceStart(text, doc) {    
    let optimalTextLength = 1500; //SpeechSynthesis limit
    let i = 0;    
    
    while ((text.length > optimalTextLength) && i < optimalTextLength * 2) {
      if ( i >= optimalTextLength && /[!?\.,]/.test(text[i]) ) {
        voiceTextsArray.push(text.substring(0, i + 1));
        text = text.substring(i + 1, text.length);
        i = 0;
      }

      i++;
    }

    if (text.length) {
      voiceTextsArray.push(text);
    }

    const synth = window.speechSynthesis;
    const voices = synth.getVoices();
    const voicePlayer = new SpeechSynthesisUtterance(voiceTextsArray[0]);
    const voiceName = isRusText(voiceTextsArray[0]) ? 'Google русский' : 'Google US English';
  
    voicePlayer.onend = function() {
      voiceTextsArray.splice(0, 1);
      if(voiceTextsArray.length === 0) {
        const voiceBtn = doc.querySelector('.interface__btn_voice');
        voiceBtn.removeAttribute('data-voice');
      } else {
        voicePlayer.text = voiceTextsArray[0];        
        speakText();
      }
    }
  
    voicePlayer.onerror = function() {
      alert('При попытке озвучить текст произошла ошибка.');
    }
  
    for (let voice of voices) {
      if (voice.name === voiceName) {
        voicePlayer.voice = voice;
      }
    }

    const voiceBtn = doc.querySelector('.interface__btn_voice');
    const speakingUpdate = setInterval(() => {
      voiceTextsArray.splice(0, 1);

      window.speechSynthesis.pause();
      window.speechSynthesis.resume();
      if (voiceBtn.dataset.voice !== 'active') {
        clearInterval(speakingUpdate);
      }
    }, 10000);

    speakText();

    function speakText() {
      synth.speak(voicePlayer);
    }
  }
  
  function voiceCancel() {
    const synth = window.speechSynthesis;
    synth.cancel();
    voiceTextsArray = [];
  }

  function getContextMenu(win, coords) {
    const $template = document.createElement('div');
    $template.className = 'context-menu';
    $template.style.left = `${coords.x}px`;
    $template.style.top = `${coords.y + 10}px`;

    const $copyBtn = getCopyBtn(win);
    const $searchBtn = getSearchBtn(win);
    const $translateBtn = getTranslateBtn(win);

    $template.appendChild($copyBtn);
    $template.appendChild($searchBtn);
    $template.appendChild($translateBtn);

    return $template;
  }  

  function getTranslateBtn(win) {
    const $btn = document.createElement('button');
    $btn.className = 'context-menu__btn context-menu__btn_translate';
    $btn.innerHTML = `
      <img src="${getPath('images/translate.svg')}" class="context-menu__icon" alt="Google Translate">
    `;

    $btn.addEventListener('mouseup', () => {
      const selectionText = win.getSelection().toString().trim();
      if (!selectionText) {
        return;
      }

      const textURL = encodeURI(selectionText);
      const translateLang = isRusText(selectionText) ? 'en' : 'ru';
      const url = `https://translate.google.ru/?sl=auto&tl=${translateLang}&text=${textURL}&op=translate`;
      window.open(url, 'translate', 'target="_blank"')
    });

    return $btn;
  }

  function getSearchBtn(win) {
    const $btn = document.createElement('button');
    $btn.className = 'context-menu__btn context-menu__btn_search';
    $btn.innerHTML = `
      <img src="${getPath('images/search.svg')}" class="context-menu__icon" alt="Google Search">
    `;

    $btn.addEventListener('mouseup', () => {
      const selectionText = win.getSelection().toString().trim();
      if (!selectionText) {
        return;
      }

      const textURL = encodeURI(selectionText);
      const url = `https://www.google.com/search?q=${textURL}`;
      window.open(url, 'search', 'target="_blank"');
    });

    return $btn;
  }

  function getCopyBtn(win) {
    const $btn = document.createElement('button');
    $btn.className = 'context-menu__btn context-menu__btn_copy';
    $btn.innerHTML = `
      <img src="${getPath('images/files.svg')}" class="context-menu__icon" alt="Copy">
    `;

    $btn.addEventListener('mouseup', () => {
      const selectionText = win.getSelection().toString().trim();
      if (!selectionText) {
        return;
      }

      navigator.clipboard.writeText(selectionText)
      .then(() => {})
      .catch(err => {
        showMessage(win.document, 'Скопировать не удалось');
      });
    });

    return $btn;
  }

  function showMessage(doc, text) {
    const $template = document.createElement('div');
    $template.className = 'message message_hide';
    $template.innerHTML = text;
    
    doc.body.appendChild($template);
    setTimeout(() => {
      $template.classList.remove('message_hide');
    });
    setTimeout(() => {
      $template.remove();
    }, 3000);
  }

  function isRusText(text) {
    return /[а-я]/i.test(text);
  }

  // function makeRequest(url, options = {}) {
  //   return fetch(url, options).then(response => {
  //     if (response.status = 200) {
  //       return response.json();
  //     }

  //     return response.text().then(text => {
  //       throw new Error(text);
  //     });
  //   }).catch(err => console.log(err));
  // }

  // function getSimularPopupBtn(doc) {
  //   const $btn = document.createElement('button');
  //   $btn.className = 'interface__left-btn interface__btn_simular-popup';
  //   $btn.innerHTML = 'Похожие';
    
  //   $btn.addEventListener('click', () => {
  //     const $simularPopup = doc.querySelector('.simular');
  //     if ($simularPopup) {
  //       return;
  //     }

  //     addSimularPopup(doc);
  //   });
  
  //   return $btn;
  // }

  // async function addSimularPopup(doc) {
  //   if (!doc) {
  //     return;
  //   }
    
  //   const $popup = document.createElement('div');
  //   const $popupContent = await getSimularPopupContent();
  //   $popup.className = 'simular hide';
  //   $popup.appendChild($popupContent);
  //   $popup.innerHTML += '<div class="mask"></div>';

  //   $popup.addEventListener('click', (e) => {
  //     if (e.target.classList.contains('mask')) {
  //       removePopup(doc, '.simular');
  //     }
  //   });
  
  //   doc.body.appendChild($popup);
  //   setTimeout(() => {
  //     $popup.classList.remove('hide');
  //   }, 200);
  
  //   const $closePopupBtn = document.createElement('button');
  //   $closePopupBtn.className = 'close-btn simular__close';
  //   $closePopupBtn.innerHTML = `
  //   <svg xmlns="http://www.w3.org/2000/svg"  width="20" viewBox="0 0 329 329">
  //     <path d="m194.800781 164.769531 128.210938-128.214843c8.34375-8.339844 8.34375-21.824219 0-30.164063-8.339844-8.339844-21.824219-8.339844-30.164063 0l-128.214844 128.214844-128.210937-128.214844c-8.34375-8.339844-21.824219-8.339844-30.164063 0-8.34375 8.339844-8.34375 21.824219 0 30.164063l128.210938 128.214843-128.210938 128.214844c-8.34375 8.339844-8.34375 21.824219 0 30.164063 4.15625 4.160156 9.621094 6.25 15.082032 6.25 5.460937 0 10.921875-2.089844 15.082031-6.25l128.210937-128.214844 128.214844 128.214844c4.160156 4.160156 9.621094 6.25 15.082032 6.25 5.460937 0 10.921874-2.089844 15.082031-6.25 8.34375-8.339844 8.34375-21.824219 0-30.164063zm0 0"/>
  //   </svg>
  //   `;
  //   $closePopupBtn.addEventListener('click', () => {
  //     removePopup(doc, '.simular');
  //   });
  //   $popup.appendChild($closePopupBtn);
  // }

  // async function getSimularPopupContent() {
  //   const $popupContent = document.createElement('div');

  //   $popupContent.className = 'simular__content';
  //   $popupContent.innerHTML = '<div class="simular__title">Похожие</div>';

  //   const title = document.querySelector('h1') ? 
  //     document.querySelector('h1').innerText : '';
  //   const obj = {
  //     title,
  //     keywords: getKeywords()
  //   }

  //   await makeRequest('https://free.ru.net/_api/get_similar.php', {
  //     method: 'POST',
  //     body: JSON.stringify(obj)
  //   }).then(result => {
  //     const simularsArray = result;
  //     if (!simularsArray) {
  //       $popupContent.innerHTML += '<p>Похожих не найдено</p>';
  //     } else {
  //       const $simularList = document.createElement('ul');
  //       $simularList.className = 'simular__list';
  //       simularsArray.forEach((item, i) => {
          
  //         const $img = item.img ? `
  //           <a href="${item.link}" class="simular__link" target="_blank">
  //             <img src="${item.img}" class="simular__img">
  //           </a>
  //         ` : '';

  //         $simularList.innerHTML += `
  //           <li class="simular__item">
  //             <a href="${item.link}" class="simular__link" target="_blank">
  //               <p class="simular__item-title">${item.title}</p>
  //             </a>
  //             ${$img}
  //             <p class="simular__item-desc">${item.description}</p>
  //           </li>
  //         `;
  //       });
    
  //       $popupContent.appendChild($simularList);
  //     }
  //   });

  //   return $popupContent;
  // }
})();