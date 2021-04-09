// Cross-browser solution for interacting with the various browser APIs
// https://www.smashingmagazine.com/2017/04/browser-extension-edge-chrome-firefox-opera-brave-vivaldi/
const browserAPI = (function () {
  if(chrome) return chrome;
  if(msBrowser) return msBrowser;
  if(browser) return browser;
  return null;
})();

// TODO: Implement debugging right in the extenstion options?
const debug = {
  enabled: true,
  logMutations: true,
};

const removedCommentMarker = `<p style="font-size: 15px; color: red" >Removed comment<p>`

// CSS selectors we'll be using querySelections
const selectors = {

  // This is the only present element for the comment section on page load
  // We observe this element until a selector.root element appears, afterwards
  // we observe that element instead
  ytdComments: 'ytd-comments',

  // This element is the root of all comment elements
  // root: 'ytd-comment-thread-renderer',
  root: "div#contents.style-scope.ytd-item-section-renderer",

  // This is the container of an entire comment
  commentContainer: "ytd-comment-renderer.ytd-comment-thread-renderer",

  // This element holds the actual text of the comment
  commentText: "yt-formatted-string[id=content-text]",
};

// Options for the observer
const observerOptions = {

  // We only need to observe the first layer of children
  childList: true,
};

// A collection of RegEx expressions to test comments with.
// If a comments tests true with any given expression, it will be removed.

// TODO: Instead of getting rid of the comment, simply hide it and allow the user
// To view the comment if they wish to
let userOptions = {
  tests: [],
  markRemoved: false,
};

function LoadOptions() {
  browserAPI.storage.sync.get(['tests', 'markRemoved'], (items) => {
    DebugLog("Loading user options...");

    // Load tests
    let temp = (items.tests ?? '').split("\n");
    userOptions.tests = [];
    for (let test of temp) {
      userOptions.tests.push(new RegExp(`(${test})`, "ig"));
    }
    DebugLog(userOptions.tests);

    // set markRemoved
    userOptions.markRemoved = items.markRemoved ?? false;
  })
}
function DebugLog(value) {
  return debug.enabled && console.log(`[YT-Comments-Filter][Debug]: ${value}`);
}

// Retrieve the text of a comment element
function GetCommentObjectText(commentObject) {
  return commentObject.querySelector(selectors.commentText)?.innerText ?? "";
}

// Check a comment object for any matches
function CheckCommentObject(commentObject) {
  const commentText = GetCommentObjectText(commentObject);

  // Track the amount of tests the comment passes
  let nMatches = 0;

  // Loop through every test and check for any matches
  userOptions.tests.forEach((test) => {
    if (commentText.toLowerCase().match(test)) nMatches++;
  });

  // If atleast one test matches, we send the comment object TO THE RANCH
  if (nMatches > 0) {
    RemoveCommentObject(commentObject, nMatches, commentText);
  }
}

// Remove a comment from the DOM and log our heroic actions
function RemoveCommentObject(commentObject, nMatches, commentText) {
  if (commentObject) {

    if(userOptions.markRemoved) {
      commentObject.innerHTML = removedCommentMarker;
    } else commentObject.remove();
    
    DebugLog(`Removed comment with ${nMatches} match(es): ${commentText}`);

    // Update user records
    browserAPI.storage.sync.get(['totalRemoved', 'totalMatches'], function(items) {

      let newStats = {
        totalRemoved: (items.totalRemoved ?? 0) + 1,
        totalMatches: (items.totalMatches ?? 0) + nMatches,
      }

      browserAPI.storage.sync.set(newStats);
    });
  }
}

// Handles observed mutations...
// We check every newly observed comment
function HandleMutation(mutations) {
  for (let mutation of mutations) {
    // if (mutation.type === "childList") {
      debug.logMutations && DebugLog("Mutation detected");
      for (let addedNode of mutation.addedNodes) {
        CheckCommentObject(addedNode);
      }
    // }
  }
}

// We must first wait for the root to appear in the DOM, only then can we initiate the observer
// as we must pass in the DOM object into the observer
//
// Set up an interval that waits for the root element to appear
// TODO: Have this only run on pages with videos, not on any YouTube page
// TODO: Fix some bad comments slipping through at the start
let observer = null;
let currentVideoTitle = null;

function InitMainObserver() {
  DebugLog(`Initializing; looking for comment section`);
  LoadOptions();
  console.log('load options?');

  // Disconnect any previous observer
  if (observer) {
    observer.disconnect();
    observer = undefined;
    DebugLog("Disconnected old observer");
  }

  function CreateMainObserver() {
    let targetYtdComments = document.querySelector(selectors.root);
    if (targetYtdComments) {
      // Create the comment section observer
      observer = new MutationObserver(HandleMutation);
      observer.observe(targetYtdComments, observerOptions);
      DebugLog("Comments observer created");
    }
  }

  waitForAddedNode({
    id: 'contents',
    parent: document.querySelector(selectors.ytdComments),
    recursive: true,
    done: CreateMainObserver
  });
}

// We observe the document's title for when the user moves onto another video
function main() {
  let target = document.querySelector("title");
  let titleObserver = new MutationObserver(function (mutations) {
    mutations.forEach(function (mutation) {
      let title = target.innerText;

      // Only proceed if the title doesn't already match our saved video title
      // This prevents redundant mutatitons from running Init()
      if (currentVideoTitle !== title) {
        DebugLog(`New title: ${title}`);
        currentVideoTitle = title;
        InitMainObserver();
      } else DebugLog("Skipping redundant document.title mutation");
    });
  });
  titleObserver.observe(target, {
    childList: true,
  });
}

// InitMainObserver();
// currentVideoTitle = document.querySelector("title").innerText;
main();

// https://stackoverflow.com/questions/38881301/observe-mutations-on-a-target-node-that-doesnt-exist-yet/38882022
function waitForAddedNode(params) {
  new MutationObserver(function(mutations) {
      var el = document.getElementById(params.id);
      if (el) {
          this.disconnect();
          params.done(el);
      }
  }).observe(params.parent || document, {
      subtree: !!params.recursive || !params.parent,
      childList: true,
  });
}