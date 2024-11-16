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