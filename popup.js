const btnCheck = document.getElementById('check');

btnCheck.onclick = async () => {
  btnCheck.disabled = true;
  const resultBox = document.getElementById('result');
  resultBox.textContent = 'Checking...';

  const runInPage = async () => {
    function sleep(ms) {
      return new Promise((resolve) => setTimeout(resolve, ms));
    }

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

      button.click();
      await sleep(5000);

      const dialog = document.querySelector('div[role="dialog"]');
      if (!dialog) {
        alert(`Dialog not found for ${type}`);
        return [];
      }

      const scrollable = Array.from(dialog.querySelectorAll('div')).find(
        (div) => div.scrollHeight > div.clientHeight && div.clientHeight > 100,
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
  };

  chrome.tabs.query({ active: true, currentWindow: true }, async ([tab]) => {
    chrome.scripting.executeScript(
      {
        target: { tabId: tab.id },
        func: runInPage,
      },
      (results) => {
        if (chrome.runtime.lastError) {
          resultBox.textContent = `Error: ${chrome.runtime.lastError.message}`;
          return;
        }

        const data = results[0].result;
        const { notFollowingBack } = data;

        if (!notFollowingBack) {
          resultBox.textContent = 'Something went wrong.';
          return;
        }

        const header = `❌ Não te seguem de volta (${notFollowingBack.length}):\n`;
        const list = notFollowingBack.join('\n');

        resultBox.textContent = `${header}${list}`;
        btnCheck.disabled = false;
      },
    );
  });
};
