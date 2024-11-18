chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "getCookie") {
    chrome.cookies.get({ url: "https://www.roblox.com", name: ".ROBLOSECURITY" }, (cookie) => {
      if (cookie && cookie.value) {
        sendResponse({ success: true, cookie: cookie.value });
      } else {
        sendResponse({ success: false, error: "ROBLOSECURITY cookie not found." });
      }
    });
    return true;
  }
});

chrome.runtime.onInstalled.addListener(() => {
  chrome.notifications.create({
    type: 'basic',
    iconUrl: '../icons/roblox.png',
    title: 'Extension Installed!',
    message: 'Thank you for installing the extension!\n\nBe sure to star the repository to show your support.',
    priority: 2
  });
});