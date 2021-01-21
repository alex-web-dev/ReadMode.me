(() => {

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
    $blockContent.appendChild(getPageContent());

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
        const $block = iframeDocument.querySelector(`[name="${blockName}"]`) || iframeDocument.querySelector(blockID);
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
    const $voiceBtn = getVoiceBtn(doc);
    const $closeBtn = getCloseBtn();
  
    $ui.appendChild($bookmarksPopupBtn);
    $ui.appendChild($voiceBtn);
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
      voiceCancel();
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
        
  
        let text = $articleClone.innerText;

        
        voiceStart(text, doc);
        $voiceBtn.setAttribute('data-voice', 'active');
      }
    });
  
    return $voiceBtn;
  }
  
  function voiceResume() {
    const synth = window.speechSynthesis;
    synth.resume();
  }
  
  let voiceTextsArray = [];
  function voiceStart(text, doc) {    
    let optimalTextLength = 1700; //SpeechSynthesis limit
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
    const voiceName = 'Google русский';
  
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
      synth.resume();
  
      if (voiceBtn.dataset.voice !== 'active') {
        clearInterval(speakingUpdate);
      }
    }, 14000);

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
  
  speechSynthesis.addEventListener('voiceschanged', e => {});

})();


function getPageContent() {
  let cloneBody = document.body.cloneNode(true);
  removeBlackListElems(cloneBody);
  removeAdvBanners(cloneBody);

  cloneBody.querySelectorAll('a:not([href]):not([id]):not([name])').forEach($link => $link.remove());

  cloneBody.querySelectorAll('h1, h2, h3, h4, h5, h6').forEach($title => {
    let titleText = $title.innerText.trim();
    if (!/[,.!?;:]/.test(titleText[titleText.length - 1])) {
      titleText += '.';
    }
    $title.innerHTML = titleText;    
  });

  let $content;
  let $textElems = cloneBody.querySelectorAll('p');
  let $mostWordsElem = cloneBody;
  let mostWordsCount = 0;
  const wordsCount = cloneBody.innerText.match(/\S+/g).length;

  if ($textElems.length === 0) {
    $textElems = cloneBody.querySelectorAll("div");
  }

  $textElems.forEach(elem => {
      const innerText = elem.innerText.match(/\S+/g);
      if (innerText && innerText.length > mostWordsCount) {
        $mostWordsElem = elem;
        mostWordsCount = innerText.length;
      }
  });

  $content = $mostWordsElem;
  let wordCountSelected = mostWordsCount;

  while (wordCountSelected / wordsCount < 0.7 &&
        $content != cloneBody && 
        $content.parentElement.innerText) {
    $content = $content.parentElement;
    console.log(wordCountSelected / wordsCount);
    wordCountSelected = $content.innerText.match(/\S+/g).length;
    console.log(wordCountSelected / wordsCount);
  }

  
  if ($content.tagName === "P") {
      $content = $content.parentElement;
  }

  if (!$content.querySelector('h1')) {
   $content.prepend(cloneBody.querySelector('h1'));
  }

  return $content.cloneNode(true);
}

function removeBlackListElems($parent) {
  $parent.querySelectorAll('#comments, .comments, style, script, #___gcse_0').forEach(($item) => $item.remove());
}

function removeAdvBanners($parent) {
  $parent.querySelectorAll('[class*="banner"], [id*="yandex_rtb"').forEach($banner => {
    console.log($banner);
    $banner.remove()
  })
}