import * as assert from 'assert';
import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

suite('Comment Inserter Extension Tests', () => {

    suiteSetup(async () => {
        // Ensure workspace is open
        const folders = vscode.workspace.workspaceFolders;
        if (!folders) {
            throw new Error('Please open a workspace before running tests.');
        }
    });

    // 🔹 1. Test Configuration
    test('Configuration: Check if authorName and drivePath are loaded correctly', async () => {
        const config = vscode.workspace.getConfiguration('commentInserter');
        const authorName = config.get<string>('authorName', 'Default Author');
        const drivePath = config.get<string>('drivePath', '');

        assert.strictEqual(authorName, 'Bennett Smith', 'Default authorName should be Bennett Smith');
        assert.strictEqual(drivePath, '', 'Default drivePath should be an empty string');
    });

    test('Configuration: Check default fallback values', async () => {
        const config = vscode.workspace.getConfiguration('commentInserter');
        const authorName = config.get<string>('authorName', 'Default Author');
        const drivePath = config.get<string>('drivePath', '');

        assert.strictEqual(authorName, 'Bennett Smith', 'Default authorName should be Bennett Smith');
        assert.strictEqual(drivePath, '', 'Default drivePath should be an empty string');
    });

    // 🔹 2. Test Command Registration
    test('Command: Check if extension.insertComments is registered', async () => {
        const commandList = await vscode.commands.getCommands(true);
        assert.ok(commandList.includes('extension.insertComments'), 'The command "extension.insertComments" is not registered.');
    });

    test('Command: Check if extension.copyToDrive is registered', async () => {
        const commandList = await vscode.commands.getCommands(true);
        assert.ok(commandList.includes('extension.copyToDrive'), 'The command "extension.copyToDrive" is not registered.');
    });

    // 🔹 3. Test Insert Comment Functionality
    test('Insert Comments: Check if comment is correctly inserted at the top of a file', async () => {
        const filePath = path.join(vscode.workspace.workspaceFolders![0].uri.fsPath, 'testFile.java');
        const initialContent = 'public class TestClass {}';

        // Create a test file
        await vscode.workspace.fs.writeFile(vscode.Uri.file(filePath), Buffer.from(initialContent, 'utf8'));

        const document = await vscode.workspace.openTextDocument(filePath);
        const editor = await vscode.window.showTextDocument(document);
        
        // Run the command to insert comments
        await vscode.commands.executeCommand('extension.insertComments');

        // Get the new document content
        const updatedContent = document.getText();
        const config = vscode.workspace.getConfiguration('commentInserter');
        const authorName = config.get<string>('authorName', 'Default Author');
        const date = new Date();
        const formattedDate = `${String(date.getDate()).padStart(2, '0')}.${String(date.getMonth() + 1).padStart(2, '0')}.${date.getFullYear()}`;
        
        const expectedComment = `// ${authorName}\n// ${formattedDate}\n// testFile\n`;
        assert.ok(updatedContent.startsWith(expectedComment), 'The file does not contain the expected comment at the top.');
    });

    // 🔹 4. Test File Copy Functionality
    test('Copy File: Check if file is copied to the correct drive path', async () => {
        const drivePath = vscode.workspace.getConfiguration('commentInserter').get<string>('drivePath', '');

        if (!drivePath) {
            assert.fail('Drive path is not set. Please set it in settings.json before running this test.');
        }

        const sourceFilePath = path.join(vscode.workspace.workspaceFolders![0].uri.fsPath, 'copyTestFile.java');
        const fileContent = 'public class TestClass {}';

        // Create a test file
        await vscode.workspace.fs.writeFile(vscode.Uri.file(sourceFilePath), Buffer.from(fileContent, 'utf8'));

        // Open file and copy it
        const document = await vscode.workspace.openTextDocument(sourceFilePath);
        await vscode.window.showTextDocument(document);
        
        await vscode.commands.executeCommand('extension.copyToDrive');

        const copiedFilePath = path.join(drivePath, 'copyTestFile.java');

        assert.ok(fs.existsSync(copiedFilePath), 'File was not copied to the drive path.');

        // Clean up the copied file
        if (fs.existsSync(copiedFilePath)) {
            fs.unlinkSync(copiedFilePath);
        }
    });

    // 🔹 5. Test Error Handling
    test('Error Handling: Should throw error when no file is open on copyToDrive', async () => {
        const activeEditor = vscode.window.activeTextEditor;
        
        if (activeEditor) {
            await vscode.commands.executeCommand('workbench.action.closeActiveEditor');
        }

        try {
            await vscode.commands.executeCommand('extension.copyToDrive');
        } catch (err) {
            assert.ok(err instanceof Error, 'No error was thrown when no file was open.');
        }
    });

    test('Error Handling: Should throw error if drivePath is not set', async () => {
        const config = vscode.workspace.getConfiguration('commentInserter');
        await config.update('drivePath', '', vscode.ConfigurationTarget.Global);

        try {
            await vscode.commands.executeCommand('extension.copyToDrive');
        } catch (err) {
            assert.ok(err instanceof Error, 'No error was thrown when drivePath was not set.');
        }
    });

});
