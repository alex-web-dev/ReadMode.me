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
  const $iframe = document.querySelector('.simple-read');
  $iframe.removeEventListener('transitionend', removeFrame);
  $iframe.remove();
}

function disableHTML(doc) {
  const $html = doc.querySelector('html');
  
  $html.classList.add('disable');
}

function enableHTML(doc){
  
  const $html = doc.querySelector('html');
  $html.classList.remove('disable');
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
  }, 400);

  document.body.appendChild($iframe);

  const iframeDocument = $iframe.contentWindow.document;
  iframeDocument.head.innerHTML += getFrameFonts();
  addStylesheet(iframeDocument, 'css/iframe.css');
  
  const $interface = getUI(iframeDocument);
  iframeDocument.body.appendChild($interface);
  iframeDocument.body.appendChild($blockBody);

  const iframeWindow = $iframe.contentWindow;
  iframeDocument.querySelectorAll('a[href*="#"]:not([target="_blank"])').forEach(($anchor) => {
    
    $anchor.addEventListener('click', (e) => {
      e.preventDefault();

      const blockID = $anchor.getAttribute('href');
      const blockName = $anchor.getAttribute('href').substr(1);
      const $block = iframeDocument.querySelector(blockID) || iframeDocument.querySelector(`[name="${blockName}"]`);
      
      const blockOffsetTop = $block.getBoundingClientRect().top;

      iframeWindow.scrollBy({ top: (blockOffsetTop), left: 0, behavior: 'smooth' });
    });
  });
  const $iframeLinks = iframeDocument.querySelectorAll('a:not([href*="#"]):not([target="_blank"])');
  fixNotAnchorLinks($iframeLinks);
}

function fixNotAnchorLinks($linksNotAnchors) {
  $linksNotAnchors.forEach(($link) => {
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

  const $bookmarksPopupBtn = getBookmarksPopupBtn(doc);
  const $bookmarksBtn = getBookmarksBtn();
  const $closeBtn = getCloseBtn();


  $ui.appendChild($bookmarksPopupBtn);
  $ui.appendChild($bookmarksBtn);
  $ui.appendChild($closeBtn);

  return $ui;
}

function getCloseBtn() {
  const $closeBtn = document.createElement('button');
  $closeBtn.className = 'interface__btn interface__btn_close';
  $closeBtn.innerHTML = `<img src="${getPath('images/close.svg')}">`;

  $closeBtn.addEventListener('click', () => {
    deleteFrame();
  });

  return $closeBtn;
}

function getBookmarksBtn() {
  const $bookmarksBtn = document.createElement('button');
  $bookmarksBtn.className = 'interface__btn interface__btn_bookmarks';
  $bookmarksBtn.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" width="48" viewBox="0 0 48 48">
      <path d="M34 6h-20c-2.21 0-3.98 1.79-3.98 4l-.02 32 14-6 14 6v-32c0-2.21-1.79-4-4-4z"/>
      <path class="test" d="M0 0h48v48h-48z" fill="none" />
    </svg>
  `;

  const thisURL = document.location.href;
  chrome.storage.local.get(['bookmarks'], function(result) {
    const bookmarks = result.bookmarks;

    if(hasBookmark(thisURL, bookmarks)) {
      $bookmarksBtn.classList.add('interface__btn_bookmarks_active');
    }
  });

    $bookmarksBtn.addEventListener('click', () => {
      chrome.storage.local.get(['bookmarks'], function(result) {
        const bookmarks = result.bookmarks;
      
        if(hasBookmark(thisURL, bookmarks)) {
            removeBookmark(thisURL);
            $bookmarksBtn.classList.remove('interface__btn_bookmarks_active');
            return;
        };

        const thisArticleName = document.title;
        addToBookmarks(thisURL, thisArticleName);
        $bookmarksBtn.classList.add('interface__btn_bookmarks_active');
      });
    });

  return $bookmarksBtn;
}

function getBookmarksPopupBtn(doc) {
  const $bookmarksPopupBtn = document.createElement('button');
  $bookmarksPopupBtn.className = 'interface__btn interface__btn_bookmarks-popup';
  $bookmarksPopupBtn.innerHTML = 'Закладки';
  
  $bookmarksPopupBtn.addEventListener('click', () => {
    chrome.storage.local.get(['bookmarks'], function(result) {
      const bookmarks = result.bookmarks;
      addBookmarksPopup(doc, bookmarks);
    });
  });

  return $bookmarksPopupBtn;
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

      bookmarks.push(newBookmark);
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
  $bookmarksPopup.className = 'bookmarks bookmarks_hide';

  const $popupContent = getBookmarksPopupContent(bookmarks);
  $bookmarksPopup.appendChild($popupContent);

  $bookmarksPopup.innerHTML += '<div class="mask"></div>';
  $bookmarksPopup.addEventListener('click', (e) => {
    if (e.target.classList.contains('mask')) {
      removeBookmarksPopup(doc);
    }
  });

  doc.body.appendChild($bookmarksPopup);
  setTimeout(() => {
    $bookmarksPopup.classList.remove('bookmarks_hide');
  }, 50);

  const $closePopupBtn = document.createElement('button');
  $closePopupBtn.className = 'bookmarks__close';
  $closePopupBtn.innerHTML = `
  <svg xmlns="http://www.w3.org/2000/svg"  width="20" viewBox="0 0 329 329">
    <path d="m194.800781 164.769531 128.210938-128.214843c8.34375-8.339844 8.34375-21.824219 0-30.164063-8.339844-8.339844-21.824219-8.339844-30.164063 0l-128.214844 128.214844-128.210937-128.214844c-8.34375-8.339844-21.824219-8.339844-30.164063 0-8.34375 8.339844-8.34375 21.824219 0 30.164063l128.210938 128.214843-128.210938 128.214844c-8.34375 8.339844-8.34375 21.824219 0 30.164063 4.15625 4.160156 9.621094 6.25 15.082032 6.25 5.460937 0 10.921875-2.089844 15.082031-6.25l128.210937-128.214844 128.214844 128.214844c4.160156 4.160156 9.621094 6.25 15.082032 6.25 5.460937 0 10.921874-2.089844 15.082031-6.25 8.34375-8.339844 8.34375-21.824219 0-30.164063zm0 0"/>
  </svg>
  `;
  $closePopupBtn.addEventListener('click', () => {
    removeBookmarksPopup(doc);
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
          <a href="${bookmark.url}" class="bookmarks__link">${i + 1}. ${bookmark.name}</a>
        </li>
      `;
    });

    $popupContent.appendChild($bookmarksList);
  }

  return $popupContent;
}

function removeBookmarksPopup(doc) {
  const $popup = doc.querySelector('.bookmarks');
  if (!$popup) {
    return;
  }

  $popup.classList.add('bookmarks_hide');
  setTimeout(() => {
    $popup.remove();
  }, 300);
}