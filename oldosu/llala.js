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
// === Auto-load up to 15 items specifically for "Most Played Beatmaps" ===
(function () {
  'use strict';

  var TARGET_COUNT = 15;
  var MAX_CLICKS = 12;
  var CLICK_DELAY = 350;         // ms between clicks
  var WAIT_FOR_NEW_MS = 2500;    // wait after click for new nodes
  var OVERALL_TIMEOUT = 20000;   // fail-safe

  function findMostPlayedSection() {
    // Find the H3 that contains the "Most Played Beatmaps" title
    var headers = document.querySelectorAll('h3.title--page-extra-small');
    for (var i = 0; i < headers.length; i++) {
      var txt = headers[i].textContent || '';
      if (txt.indexOf('Most Played Beatmaps') !== -1) {
        // In the HTML structure the container with beatmap items is the next sibling <div>
        var sibling = headers[i].nextElementSibling;
        if (sibling) return { header: headers[i], container: sibling };
      }
    }
    return null;
  }

  function countMaps(container) {
    if (!container) return 0;
    return container.querySelectorAll('.beatmap-playcount').length;
  }

  function safeClick(el) {
    if (!el) return;
    try { el.click && el.click(); } catch (e) {}
    try {
      el.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true }));
      el.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, cancelable: true }));
      el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
    } catch (e) {}
    try { el.dispatchEvent(new Event('touchstart', { bubbles: true, cancelable: true })); } catch (e) {}
  }

  function wait(ms) {
    return new Promise(function (res) { setTimeout(res, ms); });
  }

  async function ensureMostPlayedLoaded() {
    var startTs = Date.now();
    // Wait for the section to exist
    while (Date.now() - startTs < OVERALL_TIMEOUT) {
      var sec = findMostPlayedSection();
      if (sec && sec.container) break;
      await wait(300);
    }
    var secObj = findMostPlayedSection();
    if (!secObj || !secObj.container) {
      // give up
      return false;
    }
    var container = secObj.container;

    // If already enough, done
    if (countMaps(container) >= TARGET_COUNT) return true;

    // Find the show-more button inside this container
    function findLocalShowMore() {
      return container.querySelector('.show-more-link.show-more-link--profile-page') ||
             container.querySelector('.show-more-link--profile-page') ||
             container.querySelector('button.show-more-link');
    }

    var clicks = 0;
    var overallStop = false;

    // MutationObserver to detect additions quickly
    var mo;
    var promiseResolve;
    var increasePromise = new Promise(function (resolve) { promiseResolve = resolve; });

    function onMut(muts) {
      if (countMaps(container) >= TARGET_COUNT) {
        if (promiseResolve) {
          promiseResolve(true);
          promiseResolve = null;
        }
      } else {
        // if any childList mutation adds .beatmap-playcount, resolve true
        for (var m = 0; m < muts.length; m++) {
          var added = muts[m].addedNodes;
          for (var a = 0; a < added.length; a++) {
            if (added[a].nodeType === 1 && added[a].matches && added[a].matches('.beatmap-playcount')) {
              if (promiseResolve) {
                promiseResolve(true);
                promiseResolve = null;
              }
              return;
            }
            // also check subtree
            if (added[a].querySelector && added[a].querySelector('.beatmap-playcount')) {
              if (promiseResolve) {
                promiseResolve(true);
                promiseResolve = null;
              }
              return;
            }
          }
        }
      }
    }

    mo = new MutationObserver(onMut);
    mo.observe(container, { childList: true, subtree: true });

    while (!overallStop && clicks < MAX_CLICKS && Date.now() - startTs < OVERALL_TIMEOUT) {
      if (countMaps(container) >= TARGET_COUNT) break;

      var btn = findLocalShowMore();
      if (!btn) {
        // If no explicit button, attempt to scroll the container to trigger lazy-loading
        try { container.scrollTop = container.scrollHeight; } catch (e) {}
        // Wait a bit and re-check
        await wait(WAIT_FOR_NEW_MS);
        if (countMaps(container) >= TARGET_COUNT) break;
        // still no button and no new nodes — break
        break;
      }

      clicks++;
      // Prepare an increasePromise that will auto-resolve after WAIT_FOR_NEW_MS to continue
      if (!promiseResolve) {
        increasePromise = new Promise(function (resolve) {
          promiseResolve = resolve;
          // safety timeout to resolve false if nothing added
          setTimeout(function () {
            if (promiseResolve) { promiseResolve(false); promiseResolve = null; }
          }, WAIT_FOR_NEW_MS + 250);
        });
      }

      safeClick(btn);

      // Wait for observer to detect additions OR fallback timeout
      var increased = await increasePromise;
      // small extra delay between clicks
      await wait(CLICK_DELAY);

      if (countMaps(container) >= TARGET_COUNT) break;

      // if click didn't increase nodes, try a second click quickly (some handlers require it)
      if (!increased) {
        safeClick(btn);
        await wait(WAIT_FOR_NEW_MS);
        if (countMaps(container) >= TARGET_COUNT) break;
      }
    }

    // cleanup
    try { mo.disconnect(); } catch (e) {}

    return countMaps(container) >= TARGET_COUNT;
  }

  // Run (no await at top-level needed since user script continues)
  ensureMostPlayedLoaded().then(function (ok) {
    // optionally log result
    // console.log('MostPlayed auto-load result:', ok);
  }).catch(function (err) {
    // console.error('MostPlayed auto-load error:', err);
  });

})();

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
    const MAX_ATTEMPTS = 80;
    let attempts = 0;
    let observer = null;

    function tryPlace() {
        attempts++;

        const profileDetail = document.querySelector('.profile-detail');
        // Main tab bar (the 4 big buttons are often here)
        const pageTabs = document.querySelector('.page-extra-tabs');
        // Smaller page-mode (me!, Recent, Ranks, etc.)
        const pageMode = document.querySelector('.page-mode--profile-page-extra') || document.querySelector('.page-mode');

        // If no profileDetail yet, wait (we need its position to insert before it)
        if (!profileDetail) {
            if (attempts >= MAX_ATTEMPTS) {
                disconnectObserver();
            }
            return false;
        }

        // If neither tab element exists yet, wait
        if (!pageTabs && !pageMode) {
            if (attempts >= MAX_ATTEMPTS) disconnectObserver();
            return false;
        }

        const targetParent = profileDetail.parentNode;

        // Helper to safely insert node before profileDetail
        function insertBeforeProfile(node) {
            if (!node) return;
            // if it's already in the right place, skip
            if (node.parentNode === targetParent && node.nextElementSibling === profileDetail) return;
            try {
                targetParent.insertBefore(node, profileDetail);
            } catch (e) {
                // fallback: insert directly into document before profileDetail
                profileDetail.parentNode.insertBefore(node, profileDetail);
            }
            // small inline style fallback to ensure layout if CSS hasn't applied yet
            node.style.position = 'static';
            node.style.float = 'right';
            node.style.width = '640px';
            node.style.marginBottom = '0';

            pageMode.style.marginBottom = '-10px';
        }

        // Move pageTabs and pageMode to directly before .profile-detail
        if (pageTabs) insertBeforeProfile(pageTabs);
        if (pageMode) insertBeforeProfile(pageMode);

        // Ensure the userpage wrapper still contains an inner/outer wrapper so your CSS rules depending on them won't break
        const userBox = document.querySelector('.page-extra--userpage');
        if (userBox) {
            let outer = userBox.querySelector('.page-extra__content-overflow-wrapper-outer');
            if (!outer) {
                outer = document.createElement('div');
                outer.className = 'page-extra__content-overflow-wrapper-outer';
                // append at the end of userBox to avoid disturbing other nodes
                userBox.appendChild(outer);
            }
            let inner = outer.querySelector('.page-extra__content-overflow-wrapper-inner');
            if (!inner) {
                inner = document.createElement('div');
                inner.className = 'page-extra__content-overflow-wrapper-inner';
                outer.appendChild(inner);
            }
            // If CSS expects pageTabs INSIDE the inner wrapper, put a copy (or move it) there.
            // We prefer to *not* remove the element from before profileDetail if the visual result would break,
            // so only move it into inner if inner isn't already an ancestor.
            if (pageTabs && !inner.contains(pageTabs)) {
                // Clone and keep a copy in the original position to avoid style-breaks:
                // But cloning can confuse event handlers, so prefer moving only if pageTabs currently isn't placed above profileDetail.
                // If pageTabs is already before profileDetail, keep it there (that's the priority).
                // However: some CSS selectors expect pageTabs to be inside the inner wrapper — so if your CSS relies on that, uncomment the move:
                // inner.appendChild(pageTabs);
                // For safety, do not force the move here.
            }
        }

        // Success — stop observing
        disconnectObserver();
        return true;
    }

    function disconnectObserver() {
        if (observer) {
            observer.disconnect();
            observer = null;
        }
    }

    // Try immediately (if DOM already ready)
    tryPlace();

    // Observe body for dynamic insertions (async loading)
    observer = new MutationObserver(() => {
        tryPlace();
    });

    observer.observe(document.body, { childList: true, subtree: true });

    // Safety: stop after N ms
    setTimeout(() => {
        if (observer) disconnectObserver();
    }, 10000);
}

// Run when page loads (replace any previous invocations)
window.addEventListener('load', function() {
    repositionPageTabs();
    // Try again after a short delay in case content loads slowly
    setTimeout(repositionPageTabs, 800);
});

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
            Total <a href="http://osu.ppy.sh/wiki/Kudosu" target="_blank">Kudosu</a> Earned:
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
                header.style.marginBottom = '-5px';
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


        // Try immediately

    })();
})();
