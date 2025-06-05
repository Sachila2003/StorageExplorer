chrome.runtime.onInstalled.addListener((details) => {
    console.log("Web Storage Manager extension has been installed or updated.");

    if (details.reason === 'install') {
        console.log('This is a first install of Web Storage Manager!');
    } else if (details.reason === 'update') {
        console.log('Web Storage Manager extension has been updated to version:', chrome.runtime.getManifest().version);
    }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log("Background script received a message: ", message);
    console.log("From sender: ", sender);
});

console.log("Web Storage Manager Background Service Worker started.");