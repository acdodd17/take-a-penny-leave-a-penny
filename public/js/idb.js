// variable to hold db connection
let db;
// establish a connection to IndexedDB database called 'budget_tracker' and set it to version 1
const request = indexedDB.open('budget_tracker', 1);

// if database version changes
request.onupgradeneeded = function(event) {
    const db = event.target.result;
    db.createObjectStore('new_entry', { autoIncrement: true });
};

// upon a successful 
request.onsuccess = function(event) {
    // save reference to db in global variable
    db = event.target.result;
  
    // check if app is online, then uploadEntry() function to send all local db data to api
    if (navigator.onLine) {
      uploadEntry();
    }
};

request.onerror = function(event) {
// log error here
console.log(event.target.errorCode);
};

function saveRecord(record) {
    // open a new transaction with the database with read and write permissions 
    const transaction = db.transaction(['new_entry'], 'readwrite');
  
    // access the object store for `new_entry`
    const entryObjectStore = transaction.objectStore('new_entry');
  
    // add record to store with add method
    entryObjectStore.add(record);
};

function uploadEntry() {
    const transaction = db.transaction(['new_entry'], 'readwrite');
    const entryObjectStore = transaction.objectStore('new_entry');

    const getAll = entryObjectStore.getAll();

    // upon a successful .getAll() execution, run this function
    getAll.onsuccess = function() {
        // if there was data in indexedDb's store, let's send it to the api server
        if (getAll.result.length > 0) {
            fetch('/api/transaction', {
                method: 'POST',
                body: JSON.stringify(getAll.result),
                headers: {
                Accept: 'application/json, text/plain, */*',
                'Content-Type': 'application/json'
                }
            })
                .then(response => response.json())
                .then(serverResponse => {
                if (serverResponse.message) {
                    throw new Error(serverResponse);
                }
                // open one more transaction
                const transaction = db.transaction(['new_entry'], 'readwrite');
                // access the new_entry object store
                const entryObjectStore = transaction.objectStore('new_entry');
                // clear all items in your store
                entryObjectStore.clear();

                alert('All saved entries has been submitted!');
                })
                .catch(err => {
                console.log(err);
                });
        }
    };
};

window.addEventListener('online', uploadEntry);