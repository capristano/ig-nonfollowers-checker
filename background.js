// when the plugin is opened
chrome.action.onClicked.addListener(async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const tabId = tab?.id ?? 0;

  await chrome.windows.create({
    url: `popup.html?tabId=${tabId}`, // pass tabId to popup
    type: 'popup',
    width: 400,
    height: 600,
  });
});
