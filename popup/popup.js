// popup.js
console.log("Popup.js script started!"); // VERY FIRST LINE FOR DEBUGGING

document.addEventListener('DOMContentLoaded', function () {
    console.log("DOMContentLoaded event fired!"); // DEBUGGING

    const tabButtons = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.tab-content');
    let currentActiveStorageType = 'localStorage';

    //initialize
    function initializePopup() {
        console.log("Initializing popup..."); // DEBUGGING
        //tab switch 
        tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                const newStorageType = button.getAttribute('data-tab');
                switchTab(newStorageType);
            });
        });

        //add new entry
        document.querySelectorAll('.add-entry-form .add-btn').forEach(button => {
            button.addEventListener('click', handleAddNewEntry);
        });

        //refresh buttons
        document.getElementById('refreshLocalStorage').addEventListener('click', () => requestStorageData('localStorage'));
        document.getElementById('refreshSessionStorage').addEventListener('click', () => requestStorageData('sessionStorage'));

        //clear buttons
        document.getElementById('clearLocalStorage').addEventListener('click', () => handleClearAll('localStorage'));
        document.getElementById('clearSessionStorage').addEventListener('click', () => handleClearAll('sessionStorage'));

        switchTab(currentActiveStorageType);
        console.log("Popup initialized.");
    }

    //tab switch
    function switchTab(newStorageType) {
        currentActiveStorageType = newStorageType;
        tabButtons.forEach(btn => {
            btn.classList.toggle('active', btn.getAttribute('data-tab') === newStorageType);
        });
        tabContents.forEach(content => {
            content.classList.toggle('active', content.id === (newStorageType + 'Content'));
        })
        console.log(`Switched to ${newStorageType} tab.`);
        requestStorageData(newStorageType);
    }

    //request data from content
    function requestStorageData(storageType) {
        const tableBody = document.querySelector(`#${storageType}Table tbody`);
        if (tableBody) tableBody.innerHTML = `<tr>
        <td colspan="3" class="empty-message">🔄 Loading data... </td>
        </tr>`;
        else {
            console.error(`Table body for ${storageType}Table not found!`);
            return;
        }

        chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
            if (!tabs || tabs.length === 0 || !tabs[0].id) {
                console.error("No active tab found or tab ID is missing.");
                if (tableBody) tableBody.innerHTML = `<tr>
                <td colspan="3" class="empty-message">⚠️ Error: No active tab. Cannot fetch data.</td>
                </tr>`;
                return;
            }
            const activeTabId = tabs[0].id;

            if (tabs[0].url && (tabs[0].url.startsWith('chrome://') ||
                tabs[0].url.startsWith('about:') || tabs[0].url.startsWith('file://'))) {
                console.warn(`Cannot access storage on restricted URL: ${tabs[0].url}`);
                if (tableBody) tableBody.innerHTML = `<tr>
            <td colspan="3" class="empty-message">ℹ️ Storage cannot be accessed on this type of page (${tabs[0].url.split(':')[0]}:).</td>
            </tr>`;
                return;
            }
            chrome.tabs.sendMessage(
                activeTabId,
                { action: "getStorageData", type: storageType },
                function (response) {
                    console.log(`POPUP: Received response from content script for getStorageData (${storageType}):`, response); // DEBUG

                    if (chrome.runtime.lastError) {
                        console.error(`POPUP: Error for getStorageData (${storageType}):`, chrome.runtime.lastError.message);
                        let errorMsg = `⚠️ Error loading ${storageType}.`;
                        if (chrome.runtime.lastError.message.includes("No matching signature")) {
                            errorMsg += " Issue with message format or listener.";
                        } else if (chrome.runtime.lastError.message.includes("Receiving end does not exist")) {
                            errorMsg += " Content script might not be injected or page is not responding.";
                        }
                        if (tableBody) tableBody.innerHTML = `<tr>
                        <td colspan="3" class="empty-message">${errorMsg} (Check console)</td>
                        </tr>`;
                        return;
                    }

                    if (response && response.data !== undefined) {
                        console.log(`POPUP: Data received for ${storageType}. Calling displayStorageData.`); // DEBUG
                        displayStorageData(storageType, response.data);
                    } else {
                        console.warn(`POPUP: No data in response for ${storageType} or response invalid. Response:`, response);
                        if (tableBody) tableBody.innerHTML = `<tr>
                        <td colspan="3" class="empty-message">🤔 No data found or invalid response for ${storageType}.</td>
                        </tr>`;
                        displayStorageData(storageType, {}); // Show "no data" message in table
                    }
                }
            );
        });
    }
    //display data
    function displayStorageData(storageType, data) {
        const tableBody = document.querySelector(`#${storageType}Table tbody`);
        if (!tableBody) {
            console.error("Table body not found in displayStorageData for:", storageType);
            return;
        }
        tableBody.innerHTML = '';

        if (data === null || typeof data !== 'object' || Object.keys(data).length === 0) {
            tableBody.innerHTML = `<tr>
            <td colspan="3" class="empty-message">🎉 No ${storageType} entries found on this page.</td>
            </tr>`;
            return;
        }
        for (const key in data) {
            if (Object.hasOwnProperty.call(data, key)) {
                const value = data[key];
                const row = tableBody.insertRow();

                const keyCell = row.insertCell();
                keyCell.textContent = escapeHtml(key);
                keyCell.title = key;

                const valueCell = row.insertCell();
                valueCell.textContent = escapeHtml(String(value).substring(0, 100)) + (String(value).length > 100 ? '...' : '');
                valueCell.title = String(value);

                const actionsCell = row.insertCell();
                actionsCell.classList.add('actions');

                const editButton = document.createElement('button');
                editButton.textContent = 'Edit';
                editButton.classList.add('edit-btn');
                editButton.dataset.key = key;
                editButton.dataset.storageType = storageType;
                editButton.addEventListener('click', handleEditEntry);

                const deleteButton = document.createElement('button');
                deleteButton.textContent = 'Delete';
                deleteButton.classList.add('delete-btn');
                deleteButton.dataset.key = key;
                deleteButton.dataset.storageType = storageType;
                deleteButton.addEventListener('click', handleDeleteEntry);

                actionsCell.appendChild(editButton);
                actionsCell.appendChild(deleteButton);
            }
        }
    }

    // --- Handle Add New Entry --- (THIS IS THE CORRECTED VERSION)
    function handleAddNewEntry(event) {
        const form = event.target.closest('.add-entry-form');
        const storageType = form.dataset.storageType;
        const keyInput = form.querySelector('.new-key');
        const valueInput = form.querySelector('.new-value');
        const key = keyInput.value.trim();
        const value = valueInput.value;

        if (!key) {
            alert('Key cannot be empty.');
            keyInput.focus();
            return;
        }

        console.log(`POPUP: Attempting to add to ${storageType}: Key='${key}', Value='${value}'`);

        chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
            if (!tabs || tabs.length === 0 || !tabs[0].id) {
                console.error("POPUP: No active tab found for adding entry.");
                alert("Error: Could not find active tab to save data.");
                return;
            }
            const activeTabId = tabs[0].id;

            chrome.tabs.sendMessage(
                activeTabId,
                {
                    action: "setStorageItem",
                    type: storageType,
                    key: key,
                    value: value
                },
                (response) => {
                    console.log("POPUP: Received response from content script for setStorageItem:", response);

                    if (chrome.runtime.lastError) {
                        console.error("POPUP: Error sending 'setStorageItem' message OR error in content script response handling:", chrome.runtime.lastError.message);
                        alert(`Failed to add entry: ${chrome.runtime.lastError.message}`);
                        return;
                    }

                    if (response && response.success) {
                        console.log("POPUP: Entry added/updated successfully via content script. Refreshing list.");
                        keyInput.value = '';
                        valueInput.value = '';
                        requestStorageData(storageType);
                    } else {
                        console.error("POPUP: Failed to add/update entry. Response from content script was not successful or invalid. Response:", response);
                        alert(`Failed to add entry. ${response && response.error ? response.error : 'Content script reported an issue or returned invalid response.'}`);
                    }
                }
            );
        });
    }
    // END OF CORRECTED handleAddNewEntry


    //handle edit entry
    function handleEditEntry(event) {
        const key = event.target.dataset.key;
        const storageType = event.target.dataset.storageType;
        const currentValue = "fetch current value from displayed data or re-fetch"; // Placeholder
        const newValue = prompt(`Editing '${key}' in ${storageType}.\nEnter new value:`, currentValue);

        if (newValue !== null) {
            console.log(`Editing ${storageType} item: Key='${key}', New Value='${newValue}'`);
            // TODO: Implement sending message
            alert(`"Edit Entry" for ${key} in ${storageType} - Not fully implemented yet.\nNew Value: ${newValue}`);
        }
    }
    //handle delete entry
    function handleDeleteEntry(event) {
        const key = event.target.dataset.key;
        const storageType = event.target.dataset.storageType;

        if (confirm(`Are you sure you want to delete '${key}' from ${storageType}?`)) {
            console.log(`Deleting from ${storageType}: Key='${key}'`);
            // TODO: Implement sending message
            alert(`"Delete Entry" for ${key} in ${storageType} - Not fully implemented yet.`);
        }
    }

    //handle clear all entries
    function handleClearAll(storageType) {
        if (confirm(`Are you sure you want to clear ALL entries from ${storageType}? This cannot be undone.`)) {
            console.log(`Clearing all ${storageType}`);
            // TODO: Implement sending message
            alert(`"Clear All ${storageType}" - Not fully implemented yet.`);
        }
    }
     //utility to escape html
     function escapeHtml(unsafe) {
        if (typeof unsafe !== 'string') {
            if (unsafe === null || typeof unsafe === 'undefined') return '';
            unsafe = String(unsafe);
        }
        return unsafe
            .replace(/&/g, "&")
            .replace(/</g, "<")
            .replace(/>/g, ">")
            .replace(/"/g, "")
            .replace(/'/g, "'");
    }

    // Call initializePopup to set everything up
    initializePopup();
    console.log("Event listeners should be set up now."); // DEBUGGING

});