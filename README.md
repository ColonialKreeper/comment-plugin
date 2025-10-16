# Comment Inserter

**Comment Inserter** is a VS Code extension that automatically inserts header comments into Java files, including author name, date, and file name.

---

## Features

- Automatically inserts a comment at the top of Java files.
- Configurable author name.
- Optionally include the current date.
- Optionally include the file name.
- Works on file creation and via command palette.

---

## Usage

- The extension automatically inserts a comment when a `.java` file is created.
- You can also manually insert a comment via the Command Palette:

Ctrl+Shift+P -> Insert Comments

## Configuration

Set your preferences in your VS Code `settings.json`:

{
    "commentInserter.authorName": "Your Name",
    "commentInserter.includeDate": true,
    "commentInserter.includeFileName": true
}

Options:

- authorName – The author name inserted in the comment.
- includeDate – Include the current date in the comment.
- includeFileName – Include the file name in the comment.