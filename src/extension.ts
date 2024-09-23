import * as vscode from 'vscode';
import * as path from 'path';
import * as winston from 'winston';
import { LogOutputChannelTransport } from 'winston-transport-vscode';

const logChannel = vscode.window.createOutputChannel('Comment Inserter', {
	log: true,
});

const logger = winston.createLogger({
	level: 'trace',
	exitOnError: false,
	levels: LogOutputChannelTransport.config.levels,
	format: LogOutputChannelTransport.format(),
	transports: [new LogOutputChannelTransport({ outputChannel: logChannel })],
});

export function activate(context: vscode.ExtensionContext) {
    logger.info("Comment Inserter activated");
    let disposable = vscode.commands.registerCommand('extension.insertComments', async () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            await insertComment(editor);
			logger.info("Editor detected");
        }
    });

    context.subscriptions.push(disposable);

    vscode.workspace.onDidCreateFiles(async event => {
        for (const file of event.files) {
            if (file.fsPath.endsWith('.java')) {
				logger.info("Java file found: " + file.fsPath.endsWith('.java'));
                try {
                    const document = await vscode.workspace.openTextDocument(file.fsPath);
                    const editor = await vscode.window.showTextDocument(document);
                    await insertComment(editor);
                } catch (err) {
                    console.error(err);
                }
            }
        }
    });
}

async function insertComment(editor: vscode.TextEditor) {
    const firstLine = "Bennett Smith";
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

export function deactivate() {}
