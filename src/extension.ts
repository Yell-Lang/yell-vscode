import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

let diagnosticCollection = vscode.languages.createDiagnosticCollection("yell");
let diagnostics : vscode.Diagnostic[] = [];

class YellCompletionItemProvider implements vscode.CompletionItemProvider {

    public provideCompletionItems(document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken): vscode.CompletionItem[] {
            const linePrefix = document.lineAt(position).text.substr(0, position.character);
            if (linePrefix.endsWith('print ') || linePrefix.endsWith('println ') || linePrefix.endsWith('sleep ')
                || linePrefix.endsWith('system ')) {
                return [
                    new vscode.CompletionItem('"";', vscode.CompletionItemKind.Property),
                ]
            } else if (linePrefix.endsWith('read ')) {
                return [
                    new vscode.CompletionItem('"input" "input_var";', vscode.CompletionItemKind.Property),
                ]
            }
            return [
                new vscode.CompletionItem('code_start;', vscode.CompletionItemKind.Function),
                new vscode.CompletionItem('print', vscode.CompletionItemKind.Function),
                new vscode.CompletionItem('var', vscode.CompletionItemKind.Function),
                new vscode.CompletionItem('read', vscode.CompletionItemKind.Function),
                new vscode.CompletionItem('sleep', vscode.CompletionItemKind.Function),
                new vscode.CompletionItem('system', vscode.CompletionItemKind.Function),
                new vscode.CompletionItem('println', vscode.CompletionItemKind.Function),
                new vscode.CompletionItem('println "Hello World!";', vscode.CompletionItemKind.Snippet),
            ]
        }
}

function isStringPresent(name: string, line: string, lineNum: number, startNum: number): void {
    var string = line.substr(line.indexOf(" ") + 1)!;
    if (!(string.endsWith('"') || string.endsWith('";'))) {
        diagnostics.push(new vscode.Diagnostic(
            new vscode.Range(new vscode.Position(lineNum, startNum), new vscode.Position(lineNum, startNum + line.split(' ')[0].length)),
            `${name} requires a string as an argument`,
            vscode.DiagnosticSeverity.Error,
        ));
    }
}

function updateDiagnostics(editor: vscode.TextEditor): void {
    diagnostics = []

    for (let lineNum = 0; lineNum < editor.document.lineCount; ++lineNum) {
        const lineAt = editor.document.lineAt(lineNum);
        const document = editor.document;
        const line_notrim = lineAt.text;
        const startNum = line_notrim.search(/\S/);
        if (startNum == -1) {
            continue;
        }
        const line = line_notrim.trim();
        const endNum = lineAt.range.end.character;
    
        if (document && path.basename(document.uri.fsPath).endsWith('.yell')) {
            switch (line.split(' ')[0]) {
                case 'print':
                    isStringPresent('print', line, lineNum, startNum)
                    break;
                case 'println':
                    isStringPresent('println', line, lineNum, startNum)
                    break;
                case 'var':
                    break;
                case 'read':
                    break;
                case 'system':
                    isStringPresent('var', line, lineNum, startNum)
                    break;
                case 'code_start;':
                    break;
                case 'sleep':
                    if (!(line.split(' ')[1].startsWith('n"') && (line.split(' ')[1].endsWith('"') || line.split(' ')[1].endsWith('";')))) {
                        diagnostics.push(new vscode.Diagnostic(
                            new vscode.Range(new vscode.Position(lineNum, startNum), new vscode.Position(lineNum, startNum + line.split(' ')[0].length)),
                            'sleep requires an n"" string/number',
                            vscode.DiagnosticSeverity.Error,
                        ));
                    }
                case 'import':
                    break;
                default:
                    if (!(line.startsWith('#!') || line.startsWith('/*') || line.endsWith('*/') || line === '')) {
                        diagnostics.push(new vscode.Diagnostic(
                            new vscode.Range(new vscode.Position(lineNum, startNum), new vscode.Position(lineNum, startNum + line.split(' ')[0].length)),
                            'no such function: ' + line.split(' ')[0],
                            vscode.DiagnosticSeverity.Error,
                        ));
                    }
            }

            if (!line.endsWith(';')) {
                if (!(line.startsWith('#!') || line.startsWith('/*') || line.endsWith('*/') || line === '')) {
                    diagnostics.push(new vscode.Diagnostic(
                        new vscode.Range(new vscode.Position(lineNum, endNum), new vscode.Position(lineNum, endNum)),
                        'missing semicolon',
                        vscode.DiagnosticSeverity.Error,
                    ));
                }
            }

            diagnosticCollection.set(document.uri, diagnostics);
        } else {
            diagnosticCollection.clear();
        }
    }
}

export function activate(ctx: vscode.ExtensionContext): void {
    let documentSelector:vscode.DocumentSelector = { scheme: 'file', language: 'yell' };

    vscode.tasks.registerTaskProvider('yell_run', {
        provideTasks(token?: vscode.CancellationToken) {
            if (vscode.window.activeTextEditor) {
                if (fs.existsSync(vscode.window.activeTextEditor.document.fileName)) {
                    var file = vscode.window.activeTextEditor.document.fileName
                    var execution = new vscode.ShellExecution(`cd ${path.dirname(file)} && yell ${file}`);
                    var problemMatchers = ["$yellProblemMatcher"];
                    return [
                        new vscode.Task({type: 'yell_run'}, vscode.TaskScope.Workspace,
                            "Run", "yell-vscode", execution, problemMatchers)
                    ];
                } else {
                    vscode.window.showErrorMessage('Looks like you haven\'t created the file.')
                }
            } else {
                vscode.window.showErrorMessage('There is no active text editor.')
            }
        },
        resolveTask(task: vscode.Task, token?: vscode.CancellationToken) {
            return task;
        }
    });

    ctx.subscriptions.push(
        vscode.languages.registerCompletionItemProvider(documentSelector, new YellCompletionItemProvider(), " "));
        let disposable = vscode.commands.registerCommand('yell.run_code', () => {
            if (vscode.window.activeTextEditor) {
                if (fs.existsSync(vscode.window.activeTextEditor.document.fileName)) {
                    vscode.window.showInformationMessage('The last saved file state will be run if you haven\'t saved your latest changes.')
                    const terminal = vscode.window.createTerminal('Yell Terminal');
                    terminal.sendText(`yell ${vscode.window.activeTextEditor!.document.fileName}`);
                } else {
                    vscode.window.showErrorMessage('Looks like you haven\'t created the file.')
                }
            }
    });

    ctx.subscriptions.push(disposable);

    var activeEditor = vscode.window.activeTextEditor

	if (activeEditor) {
        setInterval(() => { if (vscode.window.activeTextEditor) { updateDiagnostics(vscode.window.activeTextEditor) } }, 500);
	}
}