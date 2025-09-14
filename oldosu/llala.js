// ==UserScript==
// @name         New Userscript
// @namespace    http://tampermonkey.net/
// @version      2025-08-08
// @description  None
// @author       You
// @match        https://osu.ppy.sh/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=ppy.sh
// @grant        GM_xmlhttpRequest
// @connect      old.ppy.sh
// ==/UserScript==
(function() {
    'use strict';

    // Configuration
    const maxBeatmaps = 15;
    const checkInterval = 1000; // Check every second
    const maxAttempts = 30; // Maximum attempts to find the elements

    let attempts = 0;

    function limitBeatmaps() {
        attempts++;

        // Find the beatmaps container
        const beatmapsContainer = document.querySelector('.beatmap-playcount-list') ||
                                 document.querySelector('[data-page-id="most_played"]');

        // Find the show more button
        const showMoreButton = document.querySelector('.show-more-link--profile-page');

        if (beatmapsContainer && showMoreButton) {
            // Count current beatmaps
            const currentBeatmaps = beatmapsContainer.querySelectorAll('.beatmap-playcount').length;

            if (currentBeatmaps < maxBeatmaps) {
                // Click the show more button to load more beatmaps
                showMoreButton.click();
            } else if (currentBeatmaps >= maxBeatmaps) {
                // Hide beatmaps beyond the limit
                const allBeatmaps = beatmapsContainer.querySelectorAll('.beatmap-playcount');
                for (let i = maxBeatmaps; i < allBeatmaps.length; i++) {
                    allBeatmaps[i].style.display = 'none';
                }

                // Hide the show more button
                showMoreButton.style.display = 'none';

                // Add a status message
                const statusMessage = document.createElement('div');
                statusMessage.className = 'status-message';
                statusMessage.textContent = `Showing ${maxBeatmaps} of ${showMoreButton.getAttribute('data-total') || 'many'} beatmaps (limited to ${maxBeatmaps})`;
                beatmapsContainer.parentNode.insertBefore(statusMessage, showMoreButton);

                // Stop checking
                clearInterval(intervalId);
            }
        } else if (attempts >= maxAttempts) {
            // Stop checking after max attempts
            clearInterval(intervalId);
        }
    }

    // Start checking for elements
    const intervalId = setInterval(limitBeatmaps, checkInterval);
})();
function repositionPageTabs() {
    // Find the user profile box and page tabs
    const userProfileBox = document.querySelector('.page-extra--userpage');
    const pageTabs = document.querySelector('.page-extra-tabs');

    if (!userProfileBox || !pageTabs) return;

    // Create a container for both elements
    const container = document.createElement('div');
    container.className = 'user-profile-container';

    // Insert the container after the user profile box's current position
    userProfileBox.parentNode.insertBefore(container, userProfileBox.nextSibling);

    // Move both elements into the new container
    container.appendChild(userProfileBox);
    container.appendChild(pageTabs);

    // Apply styling to maintain layout
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.marginBottom = '20px';
    container.style.alignItems = 'flex-end';

    // Ensure tabs are full width
    pageTabs.style.marginTop = '15px';
}

// Run when page loads
window.addEventListener('load', function() {
    repositionPageTabs();

    // Also try after a delay in case content loads slowly
    setTimeout(repositionPageTabs, 1000);
});
function addClassicKudosu() {
    // Wait for stats to load
    const statsContainer = document.querySelector('.profile-stats');
    if (!statsContainer) return;

    // Check if kudosu element already exists
    if (document.querySelector('.profile-stats__entry--kudosu')) return;

    // Try to find kudosu value from the page
    let kudosuValue = '0';
    const kudosuTab = document.querySelector('a[href*="kudosu"]');
    if (kudosuTab) {
        const match = kudosuTab.textContent.match(/(\d+)/);
        if (match) kudosuValue = match[1];
    }

    // Create the classic kudosu display
    const kudosuEntry = document.createElement('div');
    kudosuEntry.className = 'profile-stats__entry profile-stats__entry--kudosu';
    kudosuEntry.innerHTML = `
        <span class="profile-stats__key profile-stats__key--kudosu">
            <a href="http://osu.ppy.sh/wiki/Kudosu" target="_blank">Kudosu</a>:
        </span>
        <span class="profile-stats__value">${kudosuValue}</span>
    `;

    // Add to stats container
    statsContainer.appendChild(kudosuEntry);
}

// Run when page loads
window.addEventListener('load', function() {
    // Initial attempt
    addClassicKudosu();

    // Try again after a delay in case of slow loading
    setTimeout(addClassicKudosu, 2000);
});
(function() {
    'use strict';

    // Function to create the 2016-style performance bar
    function create2016PerformanceBar() {
        // Check if we're on a profile page
        if (!document.querySelector('.profile-detail__stats')) return;

        // Extract values from the page
        const ppElement = document.querySelector('.profile-detail__values--grid .value-display:nth-child(2) .value-display__value');
        const globalRankElement = document.querySelector('.profile-detail__values:first-child .value-display:first-child .value-display__value');
        const countryRankElement = document.querySelector('.profile-detail__values:first-child .value-display:nth-child(2) .value-display__value');
        const countryFlagElement = document.querySelector('.profile-info__flag .flag-country');

        if (!ppElement || !globalRankElement || !countryRankElement) return;

        const ppValue = ppElement.textContent;
        const globalRank = globalRankElement.textContent;
        const countryRank = countryRankElement.textContent;

        // Extract the flag URL properly
        let flagUrl = '';
        if (countryFlagElement) {
            const style = countryFlagElement.getAttribute('style');
            const urlMatch = style.match(/url\(["']?(.*?)["']?\)/);
            if (urlMatch && urlMatch[1]) {
                flagUrl = urlMatch[1];
                // Handle relative URLs
                if (flagUrl.startsWith('/')) {
                    flagUrl = window.location.origin + flagUrl;
                }
            }
        }

        // Create the 2016-style performance bar
        const performanceBar = document.createElement('div');
        performanceBar.className = 'performance-bar-2016';
        performanceBar.innerHTML = `
            <span class="performance-text">Performance:</span>
            <span class="pp-value">${ppValue}pp</span>
            <span class="global-rank">(${globalRank})</span>
            ${flagUrl ? `<img class="country-flag" src="${flagUrl}" alt="Country Flag">` : ''}
            <span class="country-rank">${countryRank}</span>
        `;

        // Add CSS for the performance bar
        const style = document.createElement('style');
        style.textContent = `
            .performance-bar-2016 {
                display: flex;
                align-items: center;
                margin-bottom: 15px;
                padding: 10px;
                border-bottom: 1px dashed #a9a9ff;
                background: #f0ecfa;
                font-size: 17.0667px;
                font-weight: bold;
                font-family:Tahoma;
                height:21px;
            }
            .performance-bar-2016 .performance-text {
                margin-right: 10px;
                margin-left: -10px;
                color: #3843a6;
            }
            .performance-bar-2016 .pp-value {
                color: #000;
                margin-right: 5px;
            }
            .performance-bar-2016 .global-rank {
                color: #000;
                margin-right: 10px;
            }
            .performance-bar-2016 .country-flag {
                width: 20px;
                height: 15px;
                margin-right: 5px;
                object-fit: cover;
            }
            .performance-bar-2016 .country-rank {
                color: #000;
                font-size:13.6533px;
                font-weight:normal;
            }
            .profile-detail__chart-numbers--top,
            .profile-detail__values--grid .value-display:nth-child(2) {
                display: none !important;
            }
        `;
        document.head.appendChild(style);

        // Insert the new bar at the top of the stats section
        const statsContainer = document.querySelector('.profile-detail__stats > div');
        if (statsContainer) {
            statsContainer.insertBefore(performanceBar, statsContainer.firstChild);
        }
    }

    // Run the function when the page loads
    window.addEventListener('load', function() {
        // Your existing code
        const meSection = document.querySelector('.page-extra--userpage');
        const profileDetail = document.querySelector('.profile-detail');
        if (meSection && profileDetail) {
            profileDetail.parentNode.insertBefore(meSection, profileDetail);
            meSection.style.marginBottom = '20px';
            meSection.style.marginRight = '2px';
            meSection.style.justifySelf = 'end';
        }

        // Create the 2016 performance bar
        create2016PerformanceBar();
    });

    // The rest of your existing code
    (function() {
        const navContainer = document.querySelector('.nav2__colgroup--icons');
        if (!navContainer) return;
        const searchWrapper = document.createElement('div');
        searchWrapper.classList.add('nav2__col', 'custom-search');
        searchWrapper.style.paddingLeft = '40px';
        searchWrapper.style.marginRight = 'auto';
        searchWrapper.innerHTML = `
            <form class="inline-form" action="https://www.google.com/search" method="get" target="_blank">
                <input type="hidden" name="cx" value="007714945049801807819:fwdivvi5sik">
                <input type="hidden" name="cof" value="FORID:10">
                <input type="hidden" name="ie" value="UTF-8">
                <input type="text" name="q" size="18" placeholder="Google Search">
            </form>
            <form class="inline-form" onsubmit="window.location.href='https://osu.ppy.sh/home/search?mode=user&query=' + encodeURIComponent(this['search-query'].value); return false;">
                <input type="text" name="search-query" size="10" placeholder="User" autocomplete="off">
            </form>
            <form class="inline-form" onsubmit="window.location.href='https://osu.ppy.sh/beatmapsets?q=' + encodeURIComponent(this['beatmap-query'].value); return false;">
                <input type="text" name="beatmap-query" size="10" placeholder="Beatmap">
            </form>
        `;
        navContainer.insertBefore(searchWrapper, navContainer.firstChild);
    })();

    (function() {
        //wait for it
        const waitForTarget = setInterval(function() {
            const header = document.querySelector('.header-v4, .header-v4--users');
            const target = document.querySelector('.page-mode.page-mode--profile-page-extra.hidden-xs.ui-sortable');

            if (header && target) {
                clearInterval(waitForTarget);
                const parent = target.parentNode;
                parent.insertBefore(header, target);
                header.style.marginBottom = '20px';
            }
        }, 100);
    })();

    (function() {
        'use strict';

        // Fetch old.ppy.sh
        GM_xmlhttpRequest({
            method: "GET",
            url: "https://old.ppy.sh/",
            onload: function(response) {
                if (response.status !== 200) return;

                const parser = new DOMParser();
                const doc = parser.parseFromString(response.responseText, "text/html");

                // === PLAYSTATS ===
                const statsEl = doc.querySelector("#playstats");
                if (statsEl) {
                    const playStats = document.createElement("div");
                    playStats.id = "playstats";
                    playStats.innerHTML = statsEl.innerHTML;
                    playStats.style.position = "absolute";
                    playStats.style.marginRight = "20px";
                    playStats.style.right = "0px";
                    playStats.style.width = "240px";
                    playStats.style.height = "30px";
                    playStats.style.color = "#fff";
                    playStats.style.fontSize = "11px";
                    playStats.style.top = "90px";
                    const target = document.querySelector(".nav2-header__body .nav2.js-nav-button > .nav2__colgroup");
                    if (target) target.appendChild(playStats);
                }
            }
        });
    })();

    (function() {
        'use strict';

        const checkNav = setInterval(() => {
            const twitterCol = document.querySelector('.nav-button--twitter')?.closest('.nav2__col');
            const supportCol = document.querySelector('.nav-button--support')?.closest('.nav2__col');

            if (twitterCol && supportCol) {
                clearInterval(checkNav);

                const facebookCol = supportCol.cloneNode(true);
                const facebookBtn = facebookCol.querySelector('a');

                facebookBtn.href = 'https://facebook.com';
                facebookBtn.classList.remove('nav-button--support');
                facebookBtn.classList.add('nav-button--facebook');
                facebookBtn.setAttribute('data-orig-title', 'Facebook');

                facebookBtn.style.width = '61px';
                facebookBtn.style.height = '62px';
                facebookBtn.style.background = 'url(https://s.ppy.sh/images/social.png)';
                facebookBtn.style.backgroundPosition = '-305px 0'; // adjust to actual sprite position
                facebookBtn.style.position = 'absolute';
                facebookBtn.style.top = '6px';
                facebookBtn.style.left = '650px';

                twitterCol.insertAdjacentElement('afterend', facebookCol);
            }
        }, 200);
    })();

    (function() {
        'use strict';

        function addListingLink() {
            const header = document.querySelector('.beatmapset-header__box--main');
            if (!header) return false;

            // Create the Beatmap Listing link
            const listingLink = document.createElement('a');
            listingLink.href = 'https://osu.ppy.sh/p/beatmaplist';
            listingLink.textContent = 'Beatmap Listing';
            listingLink.style.cssText = `
                color: #3843a6;
                text-decoration: none;
                cursor: pointer;
                margin-right: 15px;
                font-weight: normal;
                font-size: 23.4667px;
                white-space: nowrap;
            `;

            // Create a container for the artist-title combo
            const artistTitleContainer = document.createElement('span');
            artistTitleContainer.style.display = 'inline-block';
            artistTitleContainer.style.whiteSpace = 'nowrap';

            // Get artist and title elements
            const artistEl = header.querySelector('.beatmapset-header__details-text--artist');
            const titleEl = header.querySelector('.beatmapset-header__details-text--title');

            if (!artistEl || !titleEl) return false;

            // Clone elements to preserve original styling
            const artistClone = artistEl.cloneNode(true);
            const titleClone = titleEl.cloneNode(true);

            // Create separator
            const separator = document.createElement('span');
            separator.textContent = ' - ';
            separator.style.margin = '0 4px';
            separator.style.display = 'inline';
            separator.style.color = '#cc2e8a';
            separator.style.textShadow = '#efcfe1 0px 0px 10px';
            separator.style.fontSize = '23.4667px';
            separator.style.fontWeight = 'normal';

            // Build the artist-title combo
            artistTitleContainer.appendChild(artistClone);
            artistTitleContainer.appendChild(separator);
            artistTitleContainer.appendChild(titleClone);

            // Create a flex container to hold everything
            const flexContainer = document.createElement('div');
            flexContainer.style.display = 'flex';
            flexContainer.style.alignItems = 'center';
            flexContainer.style.gap = '10px';
            flexContainer.style.order = '-1';

            // Add elements to flex container
            flexContainer.appendChild(listingLink);
            flexContainer.appendChild(artistTitleContainer);

            // Insert the flex container before the original elements
            header.insertBefore(flexContainer, artistEl);

            // Remove original elements
            artistEl.remove();
            titleEl.remove();

            return true;
        }

        // Try immediately
        if (!addListingLink()) {
            // If elements aren't ready, try every 100ms
            const interval = setInterval(() => {
                if (addListingLink()) {
                    clearInterval(interval);
                }
            }, 100);
        }
    })();
})();
