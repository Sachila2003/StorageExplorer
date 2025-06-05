document.addEventListener('DOMContentLoaded', function() {
    const defaultTabSelect = document.getElementById('defaultTab');
    const valuePreviewLengthInput = document.getElementById('valuePreviewLength');
    const confirmDeleteEntryCheckbox = document.getElementById('confirmDeleteEntry');
    const confirmClearAllCheckbox = document.getElementById('confirmClearAll');
    const saveOptionsButton = document.getElementById('saveOptions');
    const statusDiv = document.getElementById('status');

    //load save options and display them
    function loadOptions(){
        chrome.storage.sync.get({
            defaultTab: 'localStorage',
            valuePreviewLength: 100,
            confirmDeleteEntry: true,
            confirmClearAll: true
        }, function(items){
            defaultTabSelect.value = items.defaultTab;
            valuePreviewLengthInput.value = items.valuePreviewLength;
            confirmDeleteEntryCheckbox.checked = items.confirmDeleteEntry;
            confirmClearAllCheckbox.checked = items.confirmClearAll;
            console.log("Options loaded:",items);
        });
    }

    //save option
    function saveOptions(){
        const defaultTab = defaultTabSelect.value;
        const valuePreviewLength = parseInt(valuePreviewLengthInput.value, 10);
        const confirmDeleteEntry = confirmDeleteEntryCheckbox.checked;
        const confirmClearAll = confirmClearAllCheckbox.checked;

        if(isNaN(valuePreviewLength) || valuePreviewLength < 10 || valuePreviewLength > 500){
            statusDiv.textContent = 'Error: preview length must be between 10 and 500.';
            statusDiv.style.color = 'red';
            setTimeout(() => { statusDiv.textContent = '';},);
            return;
        }

        chrome.storage.sync.set({
            defaultTab:defaultTab,
            valuePreviewLength: valuePreviewLength,
            confirmDeleteEntry: confirmDeleteEntry,
            confirmClearAll: confirmClearAll
        }, function(){
            statusDiv.textContent = 'Options saved.';
            statusDiv.style.color = 'green';
            console.log("Options saved successfully.")
            setTimeout(() => { statusDiv.textContent = '';},);
        });
    }
});
    
