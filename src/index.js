// TODO: Implement debugging right in the extenstion properties
const debug = false;

// A YouTube comment section is lazily loaded, including the container element for all comments.
// So when we load a video, we set an interval that checks if that element has been rendered.
// If so, we can close the interval and start observing the element for any mutations 
const initInterval = 3000; // ms

// CSS selectors we'll be using querySelections
const selectors = {

    // This element is the root of all comment elements
    // root: 'ytd-comment-thread-renderer',
    root: 'div#contents.style-scope.ytd-item-section-renderer',

    // This is the container of an entire comment
    commentContainer: 'ytd-comment-renderer.ytd-comment-thread-renderer',

    // This element holds the actual text of the comment
    commentText: 'yt-formatted-string[id=content-text]',
}

// Options for the observer
const observerOptions = {

    // We only need to observe the first layer of children
    childList: true,

    // Ignore all the rest
    attributes: false,
    subtree: false,
}


// A collection of RegEx expressions to test comments with.
// If a comments tests true with any given expression, it will be removed.
let tests = [];

chrome.storage.sync.get({
    cachedTests: ''
  }, function(items) {
    let temp = items.cachedTests.split("\n");
    for(let test of temp) {
        tests.push(new RegExp(`(${test})`, 'ig'));
    }
});

// Retrieve the text of a comment element
function GetCommentObjectText(commentObject) {
    return commentObject.querySelector(selectors.commentContainer)?.innerText ?? '';
}

// Check a comment object for any matches
function CheckCommentObject(commentObject) {
    const commentText = GetCommentObjectText(commentObject);
        
    // Track the amount of tests the comment passes
    let nMatches = 0;

    tests.forEach(test => {
        if (commentText.match(test)) nMatches++;
    });

    // If atleast one test matches, we send the comment object TO THE RANCH
    if(nMatches > 0) {
        RemoveCommentObject(commentObject, nMatches, commentText);
    }
} 

// Remove a comment from the DOM and log our heroic actions
function RemoveCommentObject(commentObject, nMatches, commentText) {
    if (commentObject) {
        commentObject.remove();
        (debug) && console.log(`Removed comment with ${nMatches} match(es): ${commentText}`);
    }
}

// Handles observed mutations...
// We check every newly observed comment
function HandleMutation(mutations, observer) {
    for(let mutation of mutations) {
        if (mutation.type === 'childList') {
            debug && console.log('Mutation detected');
            for(let addedNode of mutation.addedNodes) {
                CheckCommentObject(addedNode);
            }
        }
    }
}

// We must first wait for the root to appear in the DOM, only then can we initiate the observer
// as we must pass in the DOM object into the observer 
let observer = null;
function CreateObserver(target) {

    // Create the comment section observer
    observer = new MutationObserver(HandleMutation);
    observer.observe(target, observerOptions);
}

// Set up an interval that waits for the root element to appear
function Init() {

    const interval = setInterval(() => {
        let target = document.querySelector(selectors.root);

        // The root has appeared, start observing and clear this interval
        if(target) {
            CreateObserver(target);
            debug && console.log('Observer created!');
            clearInterval(interval);
        }

    }, initInterval);
}

Init();