
window.addEventListener('load', () => {
  chrome.browserAction.onClicked.addListener(function(tab) {
    chrome.tabs.executeScript(tab.id, {
      file: "js/Readability.js",
      allFrames: false
    });

    chrome.tabs.executeScript(tab.id, {
      file: "js/index.js",
      allFrames: false
    });
  });
});