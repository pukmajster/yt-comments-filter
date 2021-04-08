function save_options() {
    var tests = document.getElementById('tests').value;
    chrome.storage.sync.set({
        cachedTests: tests,
    }, function() {
        var status = document.getElementById('status');
        status.textContent = 'Filters saved.';
        setTimeout(() => status.textContent = '', 1500);
    });
}

function restore_options() {
    chrome.storage.sync.get({
        cachedTests: ''
    }, function(items) {
      document.getElementById('tests').value = items.cachedTests;
    });
  }

document.addEventListener('DOMContentLoaded', restore_options);
document.getElementById('save').addEventListener('click', save_options);