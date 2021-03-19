(function() {
  var ga = document.createElement('script');
  ga.type = 'text/javascript';
  ga.async = true;
  ga.src = 'https://www.googletagmanager.com/gtag/js?id=G-6TWKPEBEBM';
  var s = document.getElementsByTagName('script')[0];
  s.parentNode.insertBefore(ga, s);
})();

window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());

gtag('config', 'G-6TWKPEBEBM');

window.$iframeDoc = document.querySelector('.simple-read').contentWindow.document;

window.$bookmarksBtn = $iframeDoc.querySelector('.interface__btn_bookmarks');
$bookmarksBtn.addEventListener('click', () => {
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

window.$bookmarksPopupBtn = $iframeDoc.querySelector('.interface__btn_bookmarks-popup');
$bookmarksPopupBtn.addEventListener('click', () => {
  gtag('event', 'click', {
    'event_category': 'Bookmarks list',
    'event_label': 'open'
  });
});

window.$voiceBtn = $iframeDoc.querySelector('.interface__btn_voice');
$voiceBtn.addEventListener('click', () => {
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

window.$closeBtn = $iframeDoc.querySelector('.interface__btn_close');
$closeBtn.addEventListener('click', () => {
  gtag('event', 'click', {
    'event_category': 'Close'
  });
});
