import * as vscode from 'vscode';
import * as path from 'path';
import * as winston from 'winston';
import * as fs from 'fs';

import { LogOutputChannelTransport } from 'winston-transport-vscode';

const outputChannel = vscode.window.createOutputChannel('Coment Inserter', { log: true });

const config = vscode.workspace.getConfiguration('commentInserter');
const authorName = config.get<string>('authorName', 'Default Author'); // Default fallback
const drivePath = config.get<string>('DrivePath', '');

//Create the logger
const logger = winston.createLogger({
    level: 'info',
    levels: LogOutputChannelTransport.config.levels,
    format: LogOutputChannelTransport.format(),
    transports: [
        new LogOutputChannelTransport({ outputChannel })
    ],
});


export function activate(context: vscode.ExtensionContext) {
    logger.info("Comment Inserter activated");
    const insertCommentCommand = vscode.commands.registerCommand('extension.insertComments', async () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            await insertComment(editor);
        }});
        const copyToPath = vscode.commands.registerCommand(
            'extension.copyToDrive',
            async () => {
                await submitToGDrive(drivePath); // Call your function
            }
        );

    context.subscriptions.push(insertCommentCommand);
    context.subscriptions.push(copyToPath);

	vscode.workspace.onDidCreateFiles(async event => {
		for (const file of event.files) {
			if (file.fsPath.endsWith('.java')) {
				logger.info("Java file found: " + file.fsPath.endsWith('.java'));
				try {
					const document = await vscode.workspace.openTextDocument(file.fsPath);
					const editor = await vscode.window.showTextDocument(document);
					await insertComment(editor);
				} catch (err) {
					logger.error(err);
				}
			}
		}
	});


}

async function insertComment(editor: vscode.TextEditor) {
    const firstLine = authorName;
    const date = new Date();
    const formattedDate = `${String(date.getDate()).padStart(2, '0')}.${String(date.getMonth() + 1).padStart(2, '0')}.${date.getFullYear()}`;
    logger.info(formattedDate);
	const fileNameWithExtension = editor.document.fileName.split('/').pop();
	const fileName = fileNameWithExtension ? path.parse(fileNameWithExtension).name : '';
	logger.info(fileName);
    const comment = `// ${firstLine}\n// ${formattedDate}\n// ${fileName}\n`;

    try {
        await editor.edit(editBuilder => {
            editBuilder.insert(new vscode.Position(0, 0), comment);
        });
    } catch (err) {
        console.error(err);
    }
}

async function submitToGDrive(drivePath: string) {
    const editor = vscode.window.activeTextEditor;
    let filePath: string | undefined;

    if (editor) {
        filePath = editor.document.fileName;
    } else {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders || workspaceFolders.length === 0) {
            vscode.window.showErrorMessage('No workspace folder is open. Cannot select a file.');
            return;
        }

        const selectedFile = await vscode.window.showQuickPick(
            (await vscode.workspace.findFiles('**/*')).map(uri => vscode.workspace.asRelativePath(uri)),
            { placeHolder: 'Select a file to copy to Google Drive' }
        );

        if (!selectedFile) {
            vscode.window.showErrorMessage('No file selected.');
            return;
        }

        filePath = path.join(workspaceFolders[0].uri.fsPath, selectedFile);
    }

    if (!filePath) {
        vscode.window.showErrorMessage('No file to submit.');
        return;
    }

    try {
        // Get the destination path recursively
        let destinationPath = await getDestinationPath(drivePath); // Recursively get destination folder
    
        // Read the contents of the source file
        const fileContents = (await vscode.workspace.fs.readFile(vscode.Uri.file(filePath))).toString();
    
        // Remove package headers
        const cleanedContents = fileContents.replace(/^package\s+.*?;\s*/m, '');
    
        // Ensure the destination folder exists, create if necessary
        const destinationFolder = path.dirname(destinationPath);
        let finalPath = path.join(destinationFolder, path.basename(filePath));
        const destinationUri = vscode.Uri.file(finalPath);
    
        if (destinationPath === '') {
            throw new Error('File Path is empty.');
        }

        if (!fs.existsSync(destinationFolder)) {
            fs.mkdirSync(destinationFolder, { recursive: true });  // Create the folder if it doesn't exist
        }
    
        // Check that cleaned contents is a valid string before writing
        if (typeof cleanedContents !== 'string') {
            throw new Error('Cleaned contents are not a valid string.');
        }
        // Write the cleaned contents to the destination
        await vscode.workspace.fs.writeFile(destinationUri, Buffer.from(cleanedContents, 'utf8'));
    
        vscode.window.showInformationMessage(`File successfully copied to Google Drive at ${destinationPath}`);
        logger.info(`File copied to Google Drive: ${destinationPath}`);
    } catch (err) {
        let errorMessage = 'An unknown error occurred.';
        if (err instanceof Error) {
            errorMessage = err.message;
            logger.error(err);
        } else if (typeof err === 'string') {
            errorMessage = err;
            logger.error(new Error(err)); // Wrap in Error for better logging
        } else {
            logger.error(new Error('Unknown error occurred'));
        }
        vscode.window.showErrorMessage(`Failed to copy file to Google Drive: ${errorMessage}`);    
    }
}

// Function to handle folder selection if destination is a directory
async function getDestinationPath(destinationPath: string): Promise<string> {
    let currentFolderPath = destinationPath;

    while (fs.existsSync(currentFolderPath) && fs.statSync(currentFolderPath).isDirectory()) {
        // Get all subdirectories
        const subdirectories = fs.readdirSync(currentFolderPath).filter(file => {
            const fullPath = path.join(currentFolderPath, file);
            return fs.statSync(fullPath).isDirectory();
        });

        if (subdirectories.length > 0) {
            // Offer the user to choose a folder or "This folder"
            const options = [
                ...subdirectories.map(subdir => ({ label: subdir, description: 'Subfolder' })),
                { label: 'This folder', description: 'Select the current folder' }
            ];

            const selectedFolder = await vscode.window.showQuickPick(options, {
                placeHolder: 'Select a folder to copy the file to'
            });

            if (selectedFolder) {
                if (selectedFolder.label === 'This folder') {
                    return currentFolderPath; // User selected the current folder
                } else {
                    currentFolderPath = path.join(currentFolderPath, selectedFolder.label); // Navigate to the selected subfolder
                }
            } else {
                // If no folder is selected, abort
                throw new Error('No folder selected.');
            }
        } else {
            // No subdirectories, return current path
            return currentFolderPath;
        }
    }

    return currentFolderPath; // Return the destination path when no more subdirectories are left
}





export function deactivate() {}
