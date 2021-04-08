function save_options() {
    var tests = document.getElementById('tests').value;
    chrome.storage.sync.set({
        cachedTests: tests,
    }, function() {
        // Update status to let user know options were saved.
        var status = document.getElementById('status');
        status.textContent = 'Options saved.';
        setTimeout(function() {
        status.textContent = '';
        }, 750);
    });
}

function restore_options() {
    // Use default value color = 'red' and likesColor = true.
    chrome.storage.sync.get({
        cachedTests: ''
    }, function(items) {
      document.getElementById('tests').value = items.cachedTests;
    });
  }

document.addEventListener('DOMContentLoaded', restore_options);
document.getElementById('save').addEventListener('click', save_options);