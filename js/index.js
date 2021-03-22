(() => {

  if(!document.querySelector('.simple-read')) {
    createFrame();

    window.addEventListener('beforeunload', () => {
      voiceCancel();
    });
  }

  function addTrackingScript() {
    const $tracking = document.createElement('script');
    $tracking.type = 'text/javascript';
    $tracking.src = getPath('js/tracking.js');

    const $analytics = document.createElement('script');
    $analytics.type = 'text/javascript';
    $analytics.src = 'https://www.googletagmanager.com/gtag/js?id=G-6TWKPEBEBM';

    document.head.appendChild($analytics);
    document.head.appendChild($tracking);
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
    const path = getPath(url);
    const style = document.createElement('link');
    style.rel   = 'stylesheet';
    style.type  = 'text/css';
    style.href  = path;
  
    doc.head.appendChild(style);
  }

  function addScript(doc, url) {
    const path = getPath(url);
    const script = document.querySelector('script');
    script.type = 'text/javascript';
    script.src = getPath('js/tracking.js');

    doc.head.appendChild(script);
  }

  async function getArticle() {
    const url = location.href;

    if (url.includes('fontanka.ru') && document.querySelector('section[itemprop="articleBody"]')) {
      return getFontankaArticle();
    } else if (url.includes('yandex.ru/news') && document.querySelector('article')) {
      return getYandexArticle();
    } else if (url.includes('e1.ru') && document.querySelector('[itemprop="articleBody"]')) {
      return getE1Article();
    } else if (url.includes('echo.msk.ru') && document.querySelector('div[itemprop="articleBody"]')) {
      return getEchoMSKArticle();
    }

    let article = {};
    const readabilityArticle = new Readability(document.cloneNode(true), {
      keepClasses: true
    }).parse();
    article.title = document.createElement('h1');
    article.title.innerHTML = await readabilityArticle.title
    article.content = await readabilityArticle.content;

    return await article;
  }

  function getYandexArticle() {
    const article = {};
    const $articleContentClone = document.querySelector('article').cloneNode(true);
    const removeClasses = `
      .news-story__head, .mg-carousel, h1, .news-story__socials, .mg-button, .mg-snippet__image,
      .news-story__media-stack, .news-snippet-source-info__turbo-icon, .mg-story__doc-reference-img`;
    $articleContentClone.querySelectorAll(removeClasses).forEach(item => item.remove());

    article.title = getTitle();
    article.content = $articleContentClone.innerHTML;
    return article;
  }

  function getE1Article() {
    const article = {};
    const $articleContentClone = document.querySelector('[itemprop="articleBody"]').cloneNode(true);
    $articleContentClone.querySelectorAll('figcaption, .M1am9, .M1b3, .JDan3, button').forEach(item => item.remove());
    
    article.title = document.querySelector('h2[itemprop="headline"]').cloneNode(true);
    article.content = $articleContentClone.innerHTML;
    return article;
  }

  function getEchoMSKArticle() {
    const article = {};
    const $articleContentClone = document.querySelector('[itemprop="articleBody"]').cloneNode(true);
    $articleContentClone.querySelectorAll('figcaption').forEach(item => item.remove());
    
    article.title = getTitle();
    article.content = $articleContentClone.innerHTML;
    return article;
  }

  function getFontankaArticle() {
    const article = {};
    const $articleContentClone = document.querySelector('section[itemprop="articleBody"]').cloneNode(true);
    $articleContentClone.querySelectorAll('.plyr, .flickity-button, button').forEach(item => item.remove());
    
    const $articleImgs = $articleContentClone.querySelectorAll('[id*="images"]');
    $articleImgs.forEach(($imgBlock) => {
      const $next = $imgBlock.nextElementSibling;
      if ($next.innerText.includes('Ссылка скопирована!')) {
        $next.remove();
      }
    });

    article.title = getTitle();
    article.content = $articleContentClone.innerHTML;
    return article;
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
  
    document.body.appendChild($iframe);
    $iframe.contentWindow.focus();

    const iframeWindow = $iframe.contentWindow;
    const iframeDocument = iframeWindow.document;


    const $interface = getUI(iframeWindow);
    iframeDocument.body.appendChild($blockBody);
    iframeDocument.body.appendChild($interface);

    addFrameSettings($iframe);

    setTimeout(() => {
      $iframe.classList.remove('simple-read_hide');
      //To align the title height
      const $title = iframeDocument.querySelector('h1');
      const titleMargin = Math.ceil($title.clientHeight / 50) * 4;
      $title.style.marginTop = `${titleMargin}px`;

      addTrackingScript();
    }, 500);

    iframeWindow.addEventListener('mouseup', contextMenuEvent);
  }

  function addFrameSettings($iframe) {
    const win = $iframe.contentWindow;
    const doc = $iframe.contentDocument;

    addStylesheet(doc, 'css/iframe.css');
    addStylesheet(doc, 'css/atom-one-light.css');
    scrollAnchorLinks(win);
    addAnchorToTitles(doc);

    const $links = doc.querySelectorAll('a:not([href*="#"]):not([target="_blank"])');
    fixNotAnchorLinks($links);
  }

  function contextMenuEvent(e) {
    const win = this;
    const doc = win.document;

    const $contextMenu = doc.querySelector('.context-menu');
    if ($contextMenu) {
      $contextMenu.remove();
    }

    if (typeof e.target.className === 'object' || e.target.className.includes('context-menu')) {
      return;
    }
    

    setTimeout(() => {
      const selectionText = win.getSelection().toString().trim();
      if (!selectionText) {
        return;
      }

      const contextMenuOffsetX = 240;
      const contextMenuOffsetY = 50;
      const coords = {};

      if (e.clientX > (win.innerWidth - contextMenuOffsetX)) {
        coords.x = e.clientX - contextMenuOffsetX;
      } else if (e.clientX < contextMenuOffsetX) {
        coords.x = e.clientX + contextMenuOffsetX / 2;
      } else {
        coords.x = e.clientX;
      }

      if (e.clientY > (win.innerHeight - contextMenuOffsetY)) {
        coords.y = e.pageY;
      } else if (e.clientY < contextMenuOffsetY) {
        coords.y = e.pageY + contextMenuOffsetY;
      } else {
        coords.y = e.pageY;
      }
      
      const $contextMenu = getContextMenu(win, coords);
      doc.body.appendChild($contextMenu);
    }, 10);
  }

  function addAnchorToTitles(iframeDoc) {
    let titlesAnchorsArray = [];
    [...document.querySelectorAll('h2, h3, h4, h5, h6')].forEach($title => {
        const $titlePrev = $title.previousElementSibling;
        if ($titlePrev && $titlePrev.getAttribute('name') && !$title.getAttribute('name')) {
          titlesAnchorsArray.push({
            text: $title.innerText || '',
            anchor: $titlePrev.getAttribute('name') || ''
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
  
  function getUI(win) {
    const doc = win.document;

    const $ui = document.createElement('div');
    $ui.className = 'interface';
  
    const $left = document.createElement('div');
    $left.className = 'interface__left';

    const $bookmarksPopupBtn = getBookmarksPopupBtn(doc);
    $left.appendChild($bookmarksPopupBtn);

    const $bookmarksBtn = getBookmarksBtn();
    const $voiceBtn = getVoiceBtn(doc);
    const $closeBtn = getCloseBtn();
    const $scrollCounter = getScrollCounter();
  
    $ui.appendChild($left);
    $ui.appendChild($voiceBtn);
    $ui.appendChild($bookmarksBtn);
    $ui.appendChild($closeBtn);
    addScrollControls(win, $ui);
    $ui.appendChild($scrollCounter);
  
    return $ui;
  }

  function addScrollControls(win, $parent) {
    let thisPageNum = 1;
    const $nextBtn = getNextBtn();
    const $prevBtn = getPrevBtn();

    setTimeout(() => {
      const docHeight = win.document.documentElement.clientHeight;
      const scrollValue = win.innerHeight - 12;
      let maxScrollVal = Math.ceil(docHeight / scrollValue);    

      if (docHeight - win.innerHeight === 0) {
        maxScrollVal = 1;    
      } else {
        $nextBtn.classList.remove('interface__btn_hide');
      }
      
      changeScrollCounter(win, 1, maxScrollVal);
    }, 1000);

    win.addEventListener('scroll', () => {
      const scrollValue = win.innerHeight - 12;
      const docHeight = win.document.documentElement.clientHeight;
      const maxScrollVal = Math.ceil(docHeight / scrollValue);
      const scrollOffset = Math.ceil(win.pageYOffset / scrollValue);

      thisPageNum = scrollOffset !== 0 ? scrollOffset : 1;
      if (docHeight - win.pageYOffset - win.innerHeight === 0 && thisPageNum < maxScrollVal) {
        thisPageNum++;
      }

      $prevBtn.classList.remove('interface__btn_hide');
      $nextBtn.classList.remove('interface__btn_hide');
      if (thisPageNum === 1) {
        $prevBtn.classList.add('interface__btn_hide');
      } else if (thisPageNum === maxScrollVal) {
        $nextBtn.classList.add('interface__btn_hide');
      }

      changeScrollCounter(win, thisPageNum, maxScrollVal);
    });

    win.addEventListener('resize', () => {
      const scrollValue = win.innerHeight - 12;
      const docHeight = win.document.documentElement.clientHeight;
      let maxScrollVal = Math.ceil(docHeight / scrollValue);

      if (docHeight - window.innerHeight === 0) {
        $prevBtn.classList.add('interface__btn_hide');
        $nextBtn.classList.add('interface__btn_hide');
        maxScrollVal = thisPageNum = 1;
      }

      changeScrollCounter(win, thisPageNum, maxScrollVal);
    });

    win.addEventListener('keydown', (e) => {
      if (e.keyCode === 39) {
        scrollNextEvent();
      } else if (e.keyCode === 37) {
        scrollPrevEvent();
      }
    });
    
    $nextBtn.addEventListener('click', scrollNextEvent);
    $prevBtn.addEventListener('click', scrollPrevEvent);

    $parent.appendChild($nextBtn);
    $parent.appendChild($prevBtn);

    function scrollNextEvent() {
      const scrollValue = win.innerHeight - 12;
      const docHeight = win.document.documentElement.clientHeight;
      const maxScrollVal = Math.ceil(docHeight / scrollValue);
      
      if (thisPageNum >= maxScrollVal) {
        return;
      }

      thisPageNum++;
      win.scrollTo(0, (thisPageNum - 1) * scrollValue + 5);
      changeScrollCounter(win, thisPageNum, maxScrollVal);
    }

    function scrollPrevEvent() {
      const scrollValue = win.innerHeight - 12;
      const docHeight = win.document.documentElement.clientHeight;
      const maxScrollVal = Math.ceil(docHeight / scrollValue);
      
      if (thisPageNum <= 1) {
        return;
      }

      thisPageNum--;
      win.scrollTo(0, (thisPageNum - 1) * scrollValue + 5);
      changeScrollCounter(win, thisPageNum, maxScrollVal);
    }
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

  function getNextBtn() {
    const $btn = document.createElement('button');
    $btn.className = 'interface__btn interface__btn_next interface__btn_hide';
    $btn.innerHTML = `
    <svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px"
        viewBox="0 0 490.8 490.8" style="enable-background:new 0 0 490.8 490.8;" xml:space="preserve">
      <path d="M128.133,490.68c-5.891,0.011-10.675-4.757-10.686-10.648c-0.005-2.84,1.123-5.565,3.134-7.571l227.136-227.115
          L120.581,18.232c-4.171-4.171-4.171-10.933,0-15.104c4.171-4.171,10.933-4.171,15.104,0l234.667,234.667
          c4.164,4.165,4.164,10.917,0,15.083L135.685,487.544C133.685,489.551,130.967,490.68,128.133,490.68z"/>
    </svg>`;

    return $btn;
  }

  function getPrevBtn() {
    const $btn = document.createElement('button');
    $btn.className = 'interface__btn interface__btn_prev interface__btn_hide';
    $btn.innerHTML = `
      <svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"
          viewBox="0 0 490.787 490.787" xml:space="preserve">
        <path d="M362.671,490.787c-2.831,0.005-5.548-1.115-7.552-3.115L120.452,253.006c-4.164-4.165-4.164-10.917,0-15.083L355.119,3.256
            c4.093-4.237,10.845-4.354,15.083-0.262c4.237,4.093,4.354,10.845,0.262,15.083c-0.086,0.089-0.173,0.176-0.262,0.262
            L143.087,245.454l227.136,227.115c4.171,4.16,4.179,10.914,0.019,15.085C368.236,489.664,365.511,490.792,362.671,490.787z"/>
      </svg>
    `;

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
    $btn.innerHTML = 'Bookmarks';
    
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

  function getScrollCounter() {
    const $counter = document.createElement('div');
    $counter.className = 'pages-count';
    $counter.innerHTML = `1 / 1`;

    return $counter;
  }

  function changeScrollCounter(win, from, to) {
    const doc = win.document;
    const $counter = doc.querySelector('.pages-count');
    $counter.innerHTML = `${from} / ${to}`;
  }
  
  function getPath(url) {
    return chrome.extension.getURL(url);
  }
  
  function getFrameFonts() {
    return `
      <link href="https://fonts.googleapis.com/css2?family=Merriweather:wght@400;700" rel="stylesheet">'
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
    $popupContent.innerHTML = '<div class="bookmarks__title">Boomarks</div>'
  
    if (!bookmarks) {
      $popupContent.innerHTML += '<p>Bookmarks toolbar is empty</p>';
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
  
})();