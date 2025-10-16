import * as assert from 'assert';
import * as vscode from 'vscode';
import * as path from 'path';
import { after, before, suite, test } from 'mocha';

suite('Comment Inserter Extension Test Suite', () => {

    let doc: vscode.TextDocument;
    let editor: vscode.TextEditor;

    before(async () => {
        // Create a new untitled Java file
        doc = await vscode.workspace.openTextDocument({ language: 'java', content: '' });
        editor = await vscode.window.showTextDocument(doc);
    });

    after(async () => {
        // Close the editor
        await vscode.commands.executeCommand('workbench.action.closeActiveEditor');
    });

    test('Insert comment at top of file', async () => {
        // Execute your command
        await vscode.commands.executeCommand('extension.insertComments');

        const firstLine = doc.lineAt(0).text;
        const config = vscode.workspace.getConfiguration('commentInserter');
        const authorName = config.get<string>('authorName', 'Blank User');

        assert.strictEqual(firstLine.includes(authorName), true, 'Author name should be in the first line of the comment');
    });

    test('Comment contains file name and date if enabled', async () => {
        const config = vscode.workspace.getConfiguration('commentInserter');
        const includeFileName = config.get<boolean>('includeFileName', true);
        const includeDate = config.get<boolean>('includeDate', true);

        const text = doc.getText();

        if (includeFileName) {
            const fileName = path.parse(doc.fileName).name;
            assert.strictEqual(text.includes(fileName), true, 'Comment should contain file name');
        }

        if (includeDate) {
            const dateRegex = /\d{2}\.\d{2}\.\d{4}/;
            assert.strictEqual(dateRegex.test(text), true, 'Comment should contain date');
        }
    });
});
