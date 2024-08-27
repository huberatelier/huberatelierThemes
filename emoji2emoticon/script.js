// ==UserScript==
// @name         testdeploy
// @namespace    http://tampermonkey.net/
// @version      0.0.2
// @description  Replaces emojis with traditional text emoticons
// @author       huberatelier
// @match        *://*/*
// @icon         https://static.xx.fbcdn.net/images/emoji.php/v9/ef8/1.5/16/PACMAN.png
// @grant        none
// @license      MIT
// ==/UserScript==

(function() {
    'use strict';

    // Define the emoji-to-text mapping
    const emojiMappings = {
    ' :-D ': ' :-D ',
    ' =D ': ' =D ',
    ' ^_^ ': ' ^_^ ',
    ' ^_^V ': ' ^_^V ',
    ' xD ': ' xD ',
    ' ^_^' ': ' ^_^\' ',
    ' :'D ': ' :\'D ',
    ' :) ': ' :) ',
    ' :-) ': ' :-) ',
    ' ;) ': ' ;) ',
    ' ^_^ ': ' ^_^ ',
    ' O:-) ': ' O:-) ',
    ' <3_<3 ': ' <3_<3 ',
    ' :-* ': ' :-* ',
    ' :-* ': ' :-* ',
    ' ^_^ ': ' ^_^ ',
    ' :-* ': ' :-* ',
    ' :-*^_^ ': ' :-*^_^ ',
    ' :p ': ' :p ',
    ' :P ': ' :P ',
    ' ;P ': ' ;P ',
    ' :p ': ' :p ',
    ' $.$ ': ' $.$ ',
    ' \(^_^)/ ': ' \\(^_^)/ ',
    ' :-? ': ' :-? ',
    ' :-X ': ' :-X ',
    ' :| ': ' :| ',
    ' :-| ': ' :-| ',
    ' :-| ': ' :-| ',
    ' ¬‿¬ ': ' ¬‿¬ ',
    ' -_- ': ' -_- ',
    ' -_- ': ' -_- ',
    ' D: ': ' D: ',
    ' ^_^' ': ' ^_^\' ',
    ' :\ ': ' :\\ ',
    ' |-O ': ' |-O ',
    ' (-O-) ': ' (-O-) ',
    ' :-| ': ' :-| ',
    ' °_° ': ' °_° ',
    ' @_@ ': ' @_@ ',
    ' X_X ': ' X_X ',
    ' B-) ': ' B-) ',
    ' 8-) ': ' 8-) ',
    ' :-/ ': ' :-/ ',
    ' D: ': ' D: ',
    ' :( ': ' :( ',
    ' :-( ': ' :-( ',
    ' :-o ': ' :-o ',
    ' :-o ': ' :-o ',
    ' :-o ': ' :-o ',
    ' ^_^' ': ' ^_^\' ',
    ' :-(': ' :-(',
    ' D: ': ' D: ',
    ' D: ': ' D: ',
    ' D: ': ' D: ',
    ' ^_^' ': ' ^_^\' ',
    ' T_T ': ' T_T ',
    ' T_T ': ' T_T ',
    ' :-o ': ' :-o ',
    ' @_@ ': ' @_@ ',
    ' >_< ': ' >_< ',
    ' :( ': ' :( ',
    ' ^_^' ': ' ^_^\' ',
    ' (-_-) ': ' (-_-) ',
    ' (-_-) ': ' (-_-) ',
    ' >_< ': ' >_< ',
    ' >_< ': ' >_< ',
    ' >_< ': ' >_< ',
    ' >:D ': ' >:D ',
    ' >:( ': ' >:( ',
    '...': '...',
        // ... (rest of your mappings)
    };

    // Create a single regex pattern to match all emojis
    const emojiPattern = new RegExp(Object.keys(emojiMappings).join('|'), 'g');

    // Function to replace emojis in a single text node
    function replaceTextNode(node) {
        const originalText = node.nodeValue;
        const replacedText = originalText.replace(emojiPattern, match => emojiMappings[match]);

        if (replacedText !== originalText) {
            node.nodeValue = replacedText;
        }
    }

    // Function to replace emojis in all text nodes
    function replaceEmojisInDocument() {
        const textNodes = [];
        const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null, false);

        let currentNode;
        while (currentNode = walker.nextNode()) {
            textNodes.push(currentNode);
        }

        textNodes.forEach(replaceTextNode);
    }

    // Run the replacement function when the document loads
    window.addEventListener('load', replaceEmojisInDocument);

    // Optimized MutationObserver handler
    let observerTimeout;
    const observer = new MutationObserver(() => {
        clearTimeout(observerTimeout);
        observerTimeout = setTimeout(replaceEmojisInDocument, 100); // Debounce with a 100ms delay
    });

    observer.observe(document.body, { childList: true, subtree: true });
})();
