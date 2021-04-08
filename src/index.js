// TODO: Implement debugging right in the extenstion options
const debug = {
    enabled: true,
    logMutations: false
}

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
let userOptions = {
    tests: []
}

function LoadOptions() {
    chrome.storage.sync.get({
        tests: ''
      }, function(items) {
        DebugLog('Loading user options...');

        // Load tests
        let temp = items.tests.split("\n");
        userOptions.tests = [];
        for(let test of temp) {
            userOptions.tests.push(new RegExp(`(${test})`, 'ig'));
        }
        DebugLog(userOptions.tests);
    });
    
}
function DebugLog(value) {
    return debug.enabled && console.log(`[YT-Comments-Filter][Debug]: ${value}`);
}

// Retrieve the text of a comment element
function GetCommentObjectText(commentObject) {
    return commentObject.querySelector(selectors.commentText)?.innerText ?? '';
}

// Check a comment object for any matches
function CheckCommentObject(commentObject) {
    const commentText = GetCommentObjectText(commentObject);
        
    // Track the amount of tests the comment passes
    let nMatches = 0;

    // Loop through every test and check for any matches
    userOptions.tests.forEach(test => {
        if (commentText.toLowerCase().match(test)) nMatches++;
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
        DebugLog(`Removed comment with ${nMatches} match(es): ${commentText}`);
    }
}

// Handles observed mutations...
// We check every newly observed comment
function HandleMutation(mutations, observer) {
    for(let mutation of mutations) {
        if (mutation.type === 'childList') {
            debug.logMutations && DebugLog('Mutation detected');
            for(let addedNode of mutation.addedNodes) {
                CheckCommentObject(addedNode);
            }
        }
    }
}




// We must first wait for the root to appear in the DOM, only then can we initiate the observer
// as we must pass in the DOM object into the observer 
//
// Set up an interval that waits for the root element to appear
// TODO: Have this only run on pages with videos, not on any YouTube page
let observer = null;
let currentVideoTitle = null;
let intervalHandle = null;

function Init() {

    DebugLog(`Initializing; looking for comment section`);
    LoadOptions();

    // Disconnect any previous observer
    if(observer) {
        observer.disconnect();
        observer = undefined;
        DebugLog('Disconnected old observer');
    }

    // Clear any previous interval
    if(intervalHandle) {
        clearInterval(intervalHandle);
        intervalHandle = null;
    }

    intervalHandle = setInterval(() => {
        let target = document.querySelector(selectors.root);

        // The root has appeared, start observing and clear this interval
        if(target) {

            // Create the comment section observer
            observer = new MutationObserver(HandleMutation);
            observer.observe(target, observerOptions);
            DebugLog('Observer created');
            clearInterval(intervalHandle);
        }

    }, initInterval);
}

// We observe the document's title for when the user moves onto another video
function main() {
    let target = document.querySelector('title');
    let observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            let title = target.innerText;
            
            // Only proceed if the title doesn't already match our saved video title
            // This prevents redundant mutatitons from running Init()
            if(currentVideoTitle !== title) {
                Init();
                currentVideoTitle = title;
            } else DebugLog('Skipping redundant document.title mutation');
        });
    });
    observer.observe(target, {
        childList: true,
    });
}

main();