window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());

gtag('config', 'G-6TWKPEBEBM');

var $iframeDoc = document.querySelector('.simple-read').contentWindow.document;

var $bookmarksBtn = $iframeDoc.querySelector('.interface__btn_bookmarks');
$bookmarksBtn.addEventListener('click', () => {
  if (!isTracking()) {
    return;
  }
  
  if( $bookmarksBtn.className.includes('interface__btn_bookmarks_active')) {
    gtag('event', 'click', {
      'event_category': 'Bookmarks',
      'event_label': 'add'
    });
  } else {
    gtag('event', 'click', {
      'event_category': 'Bookmarks',
      'event_label': 'remove'
    });
  }
});

var $bookmarksPopupBtn = $iframeDoc.querySelector('.interface__btn_bookmarks-popup');
$bookmarksPopupBtn.addEventListener('click', () => {
  if (!isTracking()) {
    return;
  }
  
  gtag('event', 'click', {
    'event_category': 'Bookmarks list',
    'event_label': 'open'
  });
});

var $voiceBtn = $iframeDoc.querySelector('.interface__btn_voice');
$voiceBtn.addEventListener('click', () => {
  if (!isTracking()) {
    return;
  }

  if ($voiceBtn.dataset.voice) {
    gtag('event', 'click', {
      'event_category': 'Voice',
      'event_label': 'start'
    });
  } else {
    gtag('event', 'click', {
      'event_category': 'Voice',
      'event_label': 'remove'
    });
  }
});

var $closeBtn = $iframeDoc.querySelector('.interface__btn_close');
$closeBtn.addEventListener('click', () => {
  if (!isTracking()) {
    return;
  }
  
  gtag('event', 'click', {
    'event_category': 'Close'
  });
});


function isTracking() {
  var analyticsURL = 'https://www.googletagmanager.com/gtag/js?id=G-6TWKPEBEBM';
  var analyticsScript = document.querySelector(`script[src="${analyticsURL}"]`);

  if (analyticsScript) {
    return true;
  }

  return false;
}