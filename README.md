# Instagram Followers Checker

**Instagram Followers Checker** is a simple Chrome extension that helps you identify who you follow but **doesn’t follow you back** — directly inside the Instagram website, **without needing your password or login through external apps**.

No API keys. No risk. Just open Instagram and click **"Check"**.

---

## 🔍 Features

- ✅ One-click to check who doesn't follow you back
- ✅ No Instagram login required (works while you're logged in)
- ✅ No external requests or API usage
- ✅ Data handled 100% locally in your browser
- ✅ Opens profile links in new tabs
- ✅ Clean and simple interface

---

## 🚀 How to Use

1. Install the extension from the [Chrome Web Store](https://chrome.google.com/webstore) (coming soon)
2. Go to [instagram.com](https://www.instagram.com) and make sure you're logged in.
3. Open your profile page.
4. Click the **Check** button from the extension popup.
5. Wait until you see the users who **don’t follow you back**, each will be a clickable link for they profile.

---

## 🛡️ Privacy and Security

This extension:

- ❌ Does **not** collect or store any data
- ❌ Does **not** require login credentials
- ✅ Works only with the currently loaded Instagram session
- ✅ All comparisons are done **in memory, on your browser**

---

## 🔧 Permissions Used

| Permission                    | Why it's needed                                                       |
| ----------------------------- | --------------------------------------------------------------------- |
| `activeTab`                   | To read and scrape Instagram on the open tab                          |
| `scripting`                   | To inject and run the follower comparison logic                       |
| `tabs`                        | To query information about the user's open tabs (needed for scraping) |
| `https://www.instagram.com/*` | To access Instagram content                                           |

---

## 🧑‍💻 Development Instructions

1. Clone or download the repo.
2. Open `chrome://extensions` in your browser.
3. Enable **Developer Mode**.
4. Click **“Load unpacked”** and select the folder with the extension files.
5. Go to Instagram and test it live.

---

## 💡 Future Plans

- [ ] Dark mode

---

## 📸 Screenshot

![Popup Screenshot](screenshots/popup.png)
![Results Panel](screenshots/results-panel.png)

---

## 📄 License

MIT — feel free to fork, improve, and contribute.

---

## 🙋 FAQ

**Q: Is this extension safe?**
A: Yes. It does not require your password and does not communicate with external servers.

**Q: Will Instagram block me for using it?**
A: Unlikely. The extension mimics manual behavior and doesn’t overload Instagram’s servers.

**Q: Can I check private accounts?**
A: Only if you already follow them (just like on Instagram).

---

## ✉️ Contact

Developed by Cleiton Capristano
For feedback or support: cleiton.capristano@gmail.com
