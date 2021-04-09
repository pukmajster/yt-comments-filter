function save_options() {
  var tests = document.getElementById('tests').value.trim();
  let markRemoved = document.getElementById('markRemoved').checked;
  chrome.storage.sync.set({ tests, markRemoved }, function() {
    var status = document.getElementById('save');
    status.textContent = 'CHANGES SAVED';
    setTimeout(() => status.textContent = 'SAVE CHANGES', 1500);
  });
}

function restore_options() {
  chrome.storage.sync.get(['tests', 'markRemoved', 'totalRemoved', 'totalMatches'], function(items) {
    document.getElementById('tests').value = items.tests ?? '';
    document.getElementById('markRemoved').checked = items.markRemoved ?? false;
    document.getElementById('TOTAL_REMOVED').innerHTML = items.totalRemoved ?? '0';
    document.getElementById('TOTAL_MATCHED').innerHTML = items.totalMatches ?? '0';
  });
}

document.addEventListener('DOMContentLoaded', restore_options);
document.getElementById('save').addEventListener('click', save_options);