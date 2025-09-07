# Interactive Comment Box Web App

An interactive chat-like message box built with HTML, CSS, JavaScript, and Flask backend, backed by MySQL for message storage.  
All messages are automatically exported to timestamped CSV files after every add or delete.

---

## ✅ Features

- User enters a **username via modal popup** on first visit
- Interactive Comment box UI with nice styling
- Users can **send messages** and see all others' messages
- Messages are stored in **MySQL**
- Every change (add/delete) auto-exports to a new timestamped CSV file in `exports/`
- No manual export button (everything happens automatically)
- Simple setup — easy to run locally

---


### 1. Install dependencies

```bash
pip install -r requirements.txt
