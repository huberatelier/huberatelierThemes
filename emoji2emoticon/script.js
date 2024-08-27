// ==UserScript==
// @name         emoji2emoticon
// @namespace    http://tampermonkey.net/
// @version      0.0.2
// @description  Replace emojis with traditional text emoticons
// @author       huberatelier
// @match        *://*/*
// @icon         https://github.com/huberatelier/huberatelierThemes/blob/main/emoji2emoticon/lolicon.png?raw=true
// @grant        none
// @license      MIT
// ==/UserScript==

(function() {
    'use strict';
    const emojiMappings = {
    '😀': ' :-D ',
    '😃': ' =D ',
    '😄': ' ^_^ ',
    '😁': ' ^_^V ',
    '😆': ' xD ',
    '😅': ' ^_^\' ',
    '😂': ' :\'D ',
    '🙂': ' :) ',
    '🙃': ' :-) ',
    '😉': ' ;) ',
    '😊': ' ^_^ ',
    '😇': ' O:-) ',
    '😍': ' <3_<3 ',
    '😘': ' :-* ',
    '😗': ' :-* ',
    '☺️': ' ^_^ ',
    '😚': ' :-* ',
    '😙': ' :-*^_^ ',
    '😋': ' :p ',
    '😛': ' :P ',
    '😜': ' ;P ',
    '😝': ' :p ',
    '🤑': ' $.$ ',
    '🤗': ' \\(^_^)/ ',
    '🤔': ' :-? ',
    '🤐': ' :-X ',
    '😐': ' :| ',
    '😑': ' :-| ',
    '😶': ' :-| ',
    '😏': ' ¬‿¬ ',
    '😒': ' -_- ',
    '🙄': ' -_- ',
    '😬': ' D: ',
    '😌': ' ^_^\' ',
    '😔': ' :\\ ',
    '😪': ' |-O ',
    '😴': ' (-O-) ',
    '😷': ' :-| ',
    '🤒': ' °_° ',
    '🤕': ' @_@ ',
    '😵': ' X_X ',
    '😎': ' B-) ',
    '🤓': ' 8-) ',
    '😕': ' :-/ ',
    '😟': ' D: ',
    '🙁': ' :( ',
    '☹️': ' :-( ',
    '😮': ' :-o ',
    '😯': ' :-o ',
    '😲': ' :-o ',
    '😳': ' ^_^\' ',
    '😦': ' :-(',
    '😧': ' D: ',
    '😨': ' D: ',
    '😰': ' D: ',
    '😥': ' ^_^\' ',
    '😢': ' T_T ',
    '😭': ' T_T ',
    '😱': ' :-o ',
    '😖': ' @_@ ',
    '😣': ' >_< ',
    '😞': ' :( ',
    '😓': ' ^_^\' ',
    '😩': ' (-_-) ',
    '😫': ' (-_-) ',
    '😤': ' >_< ',
    '😡': ' >_< ',
    '😠': ' >_< ',
    '😈': ' >:D ',
    '👿': ' >:( ',
    '💀': '...',
    };

    // create a regex to match emojis
    const emojiPattern = new RegExp(Object.keys(emojiMappings).join('|'), 'g');

    // replacing in a single node
    function replaceTextNode(node) {
        const originalText = node.nodeValue;
        const replacedText = originalText.replace(emojiPattern, match => emojiMappings[match]);

        if (replacedText !== originalText) {
            node.nodeValue = replacedText;
        }
    }

    // replace in all nodes
    function replaceEmojisInDocument() {
        const textNodes = [];
        const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null, false);

        let currentNode;
        while (currentNode = walker.nextNode()) {
            textNodes.push(currentNode);
        }

        textNodes.forEach(replaceTextNode);
    }

    // run the function when site loads
    window.addEventListener('load', replaceEmojisInDocument);

    // NEW MutationObserver
    let observerTimeout;
    const observer = new MutationObserver(() => {
        clearTimeout(observerTimeout);
        observerTimeout = setTimeout(replaceEmojisInDocument, 100); // Debounce with a 100ms delay
    });

    observer.observe(document.body, { childList: true, subtree: true });
})();
