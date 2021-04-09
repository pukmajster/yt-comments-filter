// Cross-browser solution for interacting with the various browser APIs
// https://www.smashingmagazine.com/2017/04/browser-extension-edge-chrome-firefox-opera-brave-vivaldi/
window.browserAPI = (function () {
  return window.msBrowser || window.browser || window.chrome;
})();

function save_options() {
  var tests = document.getElementById('tests').value.trim();
  let markRemoved = document.getElementById('markRemoved').checked;
  window.browserAPI.storage.sync.set({ tests, markRemoved }, function() {
    var status = document.getElementById('save');
    status.textContent = 'CHANGES SAVED';
    setTimeout(() => status.textContent = 'SAVE CHANGES', 1500);
  });
}

function restore_options() {
  window.browserAPI.storage.sync.get(['tests', 'markRemoved', 'totalRemoved', 'totalMatches'], function(items) {
    document.getElementById('tests').value = items.tests ?? '';
    document.getElementById('markRemoved').checked = items.markRemoved ?? false;
    document.getElementById('TOTAL_REMOVED').innerHTML = items.totalRemoved ?? '0';
    document.getElementById('TOTAL_MATCHED').innerHTML = items.totalMatches ?? '0';
  });
}

document.addEventListener('DOMContentLoaded', restore_options);
document.getElementById('save').addEventListener('click', save_options);