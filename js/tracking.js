var _gaq = _gaq || [];
_gaq.push(['_setAccount', 'UA-188549687-1']);
_gaq.push(['_trackPageview']);

(function() {
  var ga = document.createElement('script'); ga.type = 'text/javascript'; ga.async = true;
  ga.src = 'https://ssl.google-analytics.com/ga.js';
  var s = document.getElementsByTagName('script')[0]; s.parentNode.insertBefore(ga, s);
})();

window.$iframeDoc = document.querySelector('.simple-read').contentWindow.document;

window.$bookmarksBtn = $iframeDoc.querySelector('.interface__btn_bookmarks');
$bookmarksBtn.addEventListener('click', () => {
  if( $bookmarksBtn.className.includes('interface__btn_bookmarks_active')) {
    trackButton('remove-from-bookmarks');
  } else {
    trackButton('add-to-bookmarks');
  }
});

window.$bookmarksPopupBtn = $iframeDoc.querySelector('.interface__btn_bookmarks-popup');
$bookmarksPopupBtn.addEventListener('click', () => {
  trackButton('open-bookmarks-list');
});

window.$voiceBtn = $iframeDoc.querySelector('.interface__btn_voice');
$voiceBtn.addEventListener('click', () => {
  if ($voiceBtn.dataset.voice) {
    trackButton('start-voice');
  } else {
    trackButton('stop-voice');
  }
});

window.$closeBtn = $iframeDoc.querySelector('.interface__btn_close');
$closeBtn.addEventListener('click', () => {
  trackButton('exit');
});

function trackButton(name) {
  _gaq.push(['_trackEvent', name, 'clicked']);
};