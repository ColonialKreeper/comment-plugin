import * as vscode from 'vscode';
import * as path from 'path';
import * as winston from 'winston';

import { LogOutputChannelTransport } from 'winston-transport-vscode';

const outputChannel = vscode.window.createOutputChannel('Coment Inserter', { log: true });

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
        }}
    );

    context.subscriptions.push(insertCommentCommand);

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
    const config = vscode.workspace.getConfiguration('commentInserter');
    const authorName = config.get<string>('authorName', 'Blank User');
    const includeDate = config.get<boolean>('includeDate', true);
    const includeFileName = config.get<boolean>('includeFileName', true);

    logger.info(authorName);

    const date = new Date();
    const formattedDate = `${String(date.getDate()).padStart(2, '0')}.${String(date.getMonth() + 1).padStart(2, '0')}.${date.getFullYear()}`;

    const fileNameWithExtension = path.basename(editor.document.fileName);
    const fileName = path.parse(fileNameWithExtension).name;

    let comment = `// ${authorName}\n`;
    if (includeDate) {comment += `// ${formattedDate}\n`;}
    if (includeFileName) {comment += `// ${fileName}\n`;}

    try {
        await editor.edit(editBuilder => {
            editBuilder.insert(new vscode.Position(0, 0), comment);
        });
        logger.info(`Comment inserted for file: ${fileNameWithExtension}`);
    } catch (err) {
        logger.error('Error inserting comment: ' + (err as Error).message);
    }
}


export function deactivate() {}
