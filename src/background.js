chrome.runtime.onInstalled.addListener(() => {
  console.log("Extension Installed");
});
chrome.action.onClicked.addListener(() => {
  chrome.windows.create({
    url: chrome.runtime.getURL("index.html"),
    type: "popup",
    width: 500,
    height: 500,
    top: 100,
    left: 100,
  });
});
