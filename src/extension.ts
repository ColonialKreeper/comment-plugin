import * as vscode from 'vscode';
import * as path from 'path';

export function activate(context: vscode.ExtensionContext) {
    let disposable = vscode.commands.registerCommand('extension.insertComments', () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            const firstLine = "Bennett Smith";
            const date = new Date();
            const formattedDate = `${String(date.getDate()).padStart(2, '0')}.${String(date.getMonth() + 1).padStart(2, '0')}.${date.getFullYear()}`;
			const fileNameWithExtension = editor.document.fileName.split('/').pop();
			const fileName = fileNameWithExtension ? path.parse(fileNameWithExtension).name : '';
			
			const thirdLine = `test ${fileName}`;
			

            const comment = `// ${firstLine}\n// ${formattedDate}\n// ${thirdLine}\n`;

            editor.edit(editBuilder => {
                editBuilder.insert(new vscode.Position(0, 0), comment);
            });
        }
    });

    context.subscriptions.push(disposable);

    vscode.workspace.onDidCreateFiles(event => {
        event.files.forEach(file => {
            if (file.fsPath.endsWith('.java')) {
                vscode.commands.executeCommand('extension.insertComments');
            }
        });
    });
}

export function deactivate() {}
