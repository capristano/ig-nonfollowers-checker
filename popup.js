// need to keep all elements references here, better for maintenance
const appTitle = document.getElementById('app_title');
const btnCheck = document.getElementById('btn_check');
const captionWarning = document.getElementById('caption_warning');
const warningKeepTabOpen = document.getElementById('warning_keep_tab_open');
const warningNoInteraction = document.getElementById('warning_no_interaction');
const warningTimeDepends = document.getElementById('warning_time_depends');
const warningOtherTabsOk = document.getElementById('warning_other_tabs_ok');
const warningHowItWorks = document.getElementById('warning_how_it_works');
const warningWhereGetResults = document.getElementById(
  'warning_where_get_results',
);
const resultBox = document.getElementById('result');

resultBox.style.display = 'none';

function applyI18n() {
  appTitle.textContent = chrome.i18n.getMessage('app_title');
  btnCheck.textContent = chrome.i18n.getMessage('btn_check');
  captionWarning.textContent = chrome.i18n.getMessage('caption_warning');
  warningKeepTabOpen.textContent = chrome.i18n.getMessage(
    'warning_keep_tab_open',
  );
  warningNoInteraction.textContent = chrome.i18n.getMessage(
    'warning_no_interaction',
  );
  warningTimeDepends.textContent = chrome.i18n.getMessage(
    'warning_time_depends',
  );
  warningOtherTabsOk.textContent = chrome.i18n.getMessage(
    'warning_other_tabs_ok',
  );
  warningHowItWorks.textContent = chrome.i18n.getMessage(
    'warning_how_it_works',
  );
  warningWhereGetResults.textContent = chrome.i18n.getMessage(
    'warning_where_get_results',
  );
}

applyI18n();

function getTabIdFromQuery() {
  const params = new URLSearchParams(location.search);
  const raw = params.get('tabId');
  const id = Number(raw);
  return Number.isFinite(id) ? id : null;
}

async function findInstagramTabId() {
  // pick an active IG tab, or last one in list
  const tabs = await chrome.tabs.query({ url: '*://www.instagram.com/*' });
  if (!tabs.length) return null;
  const active = tabs.find((t) => t.active) || tabs[0];
  return active.id ?? null;
}

function changeBtnCheckStatus(status) {
  btnCheck.disabled = status;
  btnCheck.textContent = chrome.i18n.getMessage(
    status ? 'btn_status_checking' : 'btn_check',
  );
}

btnCheck.onclick = async () => {
  changeBtnCheckStatus(true);

  let targetTabId = getTabIdFromQuery();
  if (!targetTabId) targetTabId = await findInstagramTabId();
  if (!targetTabId) {
    resultBox.textContent = chrome.i18n.getMessage('err_no_ig_tab');
    changeBtnCheckStatus(false);
    return;
  }

  const runInPage = async () => {
    function sleep(ms) {
      return new Promise((resolve) => setTimeout(resolve, ms));
    }

    function addInteractionShield() {
      if (document.getElementById('igInteractionShield')) return;

      const shield = document.createElement('div');
      shield.id = 'igInteractionShield';
      Object.assign(shield.style, {
        position: 'fixed',
        inset: '0',
        background: 'rgba(15, 23, 42, 0.55)',
        backdropFilter: 'blur(2px)',
        zIndex: '2147483647',
        display: 'grid',
        placeItems: 'center',
        cursor: 'wait',
        pointerEvents: 'auto',
      });

      // saving current states
      shield.setAttribute(
        'data-prev-overflow-html',
        document.documentElement.style.overflow || '',
      );
      shield.setAttribute(
        'data-prev-overflow-body',
        document.body.style.overflow || '',
      );
      document.documentElement.style.overflow = 'hidden';
      document.body.style.overflow = 'hidden';

      // creating overlay with spinner and msg
      const panel = document.createElement('div');
      panel.setAttribute('role', 'alertdialog');
      panel.setAttribute('aria-live', 'assertive');
      panel.style.cssText = `
        display:flex; align-items:center; gap:10px;
        background: rgba(17,24,39,.85);
        color:#fff; padding:12px 14px; border-radius:12px;
        border: 1px solid rgba(255,255,255,.12);
        box-shadow: 0 8px 30px rgba(0,0,0,.35);
        font: 600 14px ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell, Helvetica Neue, Arial;
        max-width: 90vw;
      `;

      const spinner = document.createElement('div');
      spinner.style.cssText = `
        width:18px; height:18px; border-radius:50%;
        border:3px solid rgba(255,255,255,.25);
        border-top-color:#fff; animation: igSpin .9s linear infinite;
      `;

      const label = document.createElement('div');
      label.id = 'igInteractionShieldLabel'; // to write a message of the current step
      label.textContent = chrome.i18n.getMessage('warning_keep_open');

      panel.appendChild(spinner);
      panel.appendChild(label);
      shield.appendChild(panel);
      document.body.appendChild(shield);

      // spinner rotation
      if (!document.getElementById('igSpinStyle')) {
        const st = document.createElement('style');
        st.id = 'igSpinStyle';
        st.textContent = `@keyframes igSpin { to { transform: rotate(360deg); } }`;
        document.head.appendChild(st);
      }

      // blocking keyboard and mouse
      const block = (e) => {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        return false;
      };
      const opts = { capture: true, passive: false };
      const events = [
        'keydown',
        'keypress',
        'keyup',
        'wheel',
        'mousewheel',
        'DOMMouseScroll',
        'touchmove',
        'focus',
      ];

      events.forEach((ev) => {
        window.addEventListener(ev, block, opts);
        document.addEventListener(ev, block, opts);
      });

      // saving our overlay props, so we can take it of later
      window.__IG_BLOCKERS__ = { block, opts, events };
    }

    // removing overlay props
    function removeInteractionShield() {
      const B = window.__IG_BLOCKERS__;
      if (B && B.events) {
        B.events.forEach((ev) => {
          window.removeEventListener(ev, B.block, B.opts);
          document.removeEventListener(ev, B.block, B.opts);
        });
        delete window.__IG_BLOCKERS__;
      }

      const shield = document.getElementById('igInteractionShield');
      if (shield) {
        const prevHtml = shield.getAttribute('data-prev-overflow-html') || '';
        const prevBody = shield.getAttribute('data-prev-overflow-body') || '';
        document.documentElement.style.overflow = prevHtml;
        document.body.style.overflow = prevBody;
        shield.remove();
      }
    }

    function updateInteractionShield(message) {
      const el = document.getElementById('igInteractionShieldLabel');
      if (el) el.textContent = message;
    }

    addInteractionShield();

    try {
      async function scrape(type) {
        const buttonSelector =
          type === 'followers'
            ? 'a[href$="/followers/"]'
            : 'a[href$="/following/"]';

        const button = document.querySelector(buttonSelector);
        if (!button) {
          alert(`Couldn't find ${type} button`);
          return [];
        }

        updateInteractionShield(
          type === 'followers'
            ? chrome.i18n.getMessage('warning_loading_followers')
            : chrome.i18n.getMessage('warning_loading_following'),
        );

        button.click();
        await sleep(5000);

        const dialog = document.querySelector('div[role="dialog"]');
        if (!dialog) {
          alert(`Dialog not found for ${type}`);
          return [];
        }

        const scrollable = Array.from(dialog.querySelectorAll('div')).find(
          (div) =>
            div.scrollHeight > div.clientHeight && div.clientHeight > 100,
        );

        if (!scrollable) {
          alert('Scrollable list not found.');
          return [];
        }

        const usernames = new Set();
        let previousHeight = 0;
        let previousCount = 0;
        let unchangedScrollCount = 0;
        let unchangedUsernameCount = 0;
        const maxIterations = 100;
        let iterations = 0;

        while (
          unchangedScrollCount < 4 &&
          unchangedUsernameCount < 4 &&
          iterations < maxIterations
        ) {
          scrollable.scrollTop = scrollable.scrollHeight;
          await sleep(3000);

          const anchors = scrollable.querySelectorAll(
            'a[href^="/"][role="link"]',
          );
          anchors.forEach((a) => {
            const href = a.getAttribute('href');
            if (href && /^\/[^/]+\/$/.test(href)) {
              const username = href.replace(/\//g, '');
              usernames.add(username);
            }
          });

          const currentHeight = scrollable.scrollHeight;
          const currentCount = usernames.size;

          if (currentHeight === previousHeight) {
            unchangedScrollCount++;
          } else {
            unchangedScrollCount = 0;
            previousHeight = currentHeight;
          }

          if (currentCount === previousCount) {
            unchangedUsernameCount++;
          } else {
            unchangedUsernameCount = 0;
            previousCount = currentCount;
          }

          iterations++;
        }

        const closeBtn = dialog.querySelector(
          'svg[aria-label="Fechar"], svg[aria-label="Close"]',
        );
        if (closeBtn && closeBtn.parentElement) closeBtn.parentElement.click();
        return Array.from(usernames);
      }

      const spanAvatar = document.querySelectorAll(
        'span:has(img[alt*="profile picture"])',
      );
      const userProfileAvatar = spanAvatar[spanAvatar.length - 1];
      if (userProfileAvatar) userProfileAvatar.click();
      await sleep(1000);

      const followers = await scrape('followers');
      await sleep(1000);
      const following = await scrape('following');

      const followersSet = new Set(followers);
      const notFollowingBack = following.filter(
        (user) => !followersSet.has(user),
      );

      return {
        followersCount: followers.length,
        followingCount: following.length,
        notFollowingBack,
      };
    } finally {
      removeInteractionShield();
    }
  };

  chrome.tabs.query({ active: true, currentWindow: true }, async ([tab]) => {
    chrome.scripting.executeScript(
      {
        target: { tabId: targetTabId },
        func: runInPage,
      },
      (results) => {
        if (chrome.runtime.lastError) {
          resultBox.textContent = `Error: ${chrome.runtime.lastError.message}`;
          changeBtnCheckStatus(false);
          return;
        }

        const data = results[0].result;
        const { notFollowingBack } = data;

        if (!notFollowingBack) {
          resultBox.textContent = chrome.i18n.getMessage('err_generic');
          changeBtnCheckStatus(false);
          return;
        }

        resultBox.innerHTML = '';

        const header = document.createElement('div');
        header.textContent = chrome.i18n.getMessage(
          'header_not_following_back',
          [String(notFollowingBack.length)],
        );
        header.style.fontWeight = 'bold';
        header.style.marginBottom = '6px';
        resultBox.appendChild(header);

        notFollowingBack.forEach((username) => {
          const link = document.createElement('a');
          link.href = `https://www.instagram.com/${username}/`;
          link.textContent = username;
          link.addEventListener('click', (e) => {
            e.preventDefault();
            chrome.tabs.create({ url: link.href });
          });
          resultBox.appendChild(link);
        });

        changeBtnCheckStatus(false);
        btnCheck.textContent = chrome.i18n.getMessage('btn_check');
        resultBox.style.display = 'block';
      },
    );
  });
};
