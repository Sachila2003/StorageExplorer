document.addEventListener('DOMContentLoaded', function () {
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.tab-content');
    let currentActiveStorageType = 'localStorage';

    //initialize
    function initializePopup() {
        //tab switch 
        tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                const newStorageType = button.getAttribute('data-tab');
                switchTab(newStorageType);
            });
        });
        //add new entry
        document.querySelectorAll('.add-form .add-btn').forEach(button => {
            button.addEventListener('click',handleAddEntry);
        });
        //refresh buttons
        document.getElementById('clearLocalStorage').addEventListener('click', ()=> requesetStorageData('localStorage'));
        document.getElementById('clearSessionStorage').addEventListener('click', ()=> requesetStorageData('sessionStorage'));

        //clear buttons
        document.getElementById('clearLocalStorage').addEventListener('click', ()=> clearStorage('localStorage'));
        document.getElementById('clearSessionStorage').addEventListener('click', ()=> clearStorage('sessionStorage'));

        switchTab(currentActiveStorageType);
    }

    //tab switch
    function switchTab(newStorageType) {
        currentActiveStorageType = newStorageType;
        tabButtons.forEach(button => {
            BigInt.classList.toggle('active', contact.id === (newStorageType + 'content'));
        });
        console.log(`Switched to ${newStorageType} tab.`);
        requesetStorageData(newStorageType);
    }
});