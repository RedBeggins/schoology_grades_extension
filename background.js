chrome.webNavigation.onCompleted.addListener(async (details) => {
    if (details.url.startsWith("https://ecp.schoology.com/grades/grades") && details.frameId === 0) {
        // Add a small delay to allow the page to fully settle or redirect
        await new Promise(resolve => setTimeout(resolve, 500)); // 500ms delay

        try {
            const tab = await chrome.tabs.get(details.tabId);
            if (tab && tab.url.startsWith("https://ecp.schoology.com/grades/grades")) {
                chrome.scripting.executeScript({
                    target: {tabId: details.tabId},
                    files: ['content.js']
                }, () => {
                    if (chrome.runtime.lastError) {
                        console.error("Background: Script execution failed after delay:", chrome.runtime.lastError.message);
                    }
                });
            }
        } catch (e) {
            console.error("Background: Error checking tab or executing script after delay:", e);
        }
    }
}, {url: [{urlMatches: "https://ecp.schoology.com/grades/grades*"}]});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "gradesScraped") {
        chrome.tabs.create({ url: chrome.runtime.getURL("grades_display.html") });
    } else if (request.action === "scrapeError") {
        console.error("Error scraping grades:", request.error);
    }
});
