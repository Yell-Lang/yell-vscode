import * as vscode from 'vscode';
import * as path from 'path';

let diagnosticCollection = vscode.languages.createDiagnosticCollection("yell");
let diagnostics : vscode.Diagnostic[] = [];

class YellCompletionItemProvider implements vscode.CompletionItemProvider {

    public provideCompletionItems(document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken): vscode.CompletionItem[] {
            const linePrefix = document.lineAt(position).text.substr(0, position.character);
            if (linePrefix.endsWith('print ') || linePrefix.endsWith('println ') || linePrefix.endsWith('sleep ')
                || linePrefix.endsWith('system ')) {
                return [
                    new vscode.CompletionItem("'';", vscode.CompletionItemKind.Property),
                    new vscode.CompletionItem('"";', vscode.CompletionItemKind.Property),
                ]
            } else if (linePrefix.endsWith('read ')) {
                return [
                    new vscode.CompletionItem('"input: " "input_var";', vscode.CompletionItemKind.Property),
                ]
            }
            return [
                new vscode.CompletionItem('code_start;', vscode.CompletionItemKind.Function),
                new vscode.CompletionItem('print', vscode.CompletionItemKind.Function),
                new vscode.CompletionItem('var', vscode.CompletionItemKind.Function),
                new vscode.CompletionItem('read', vscode.CompletionItemKind.Function),
                new vscode.CompletionItem('sleep', vscode.CompletionItemKind.Function),
                new vscode.CompletionItem('a', vscode.CompletionItemKind.Function),
                new vscode.CompletionItem('import', vscode.CompletionItemKind.Function),
                new vscode.CompletionItem('system', vscode.CompletionItemKind.Function),
                new vscode.CompletionItem('python', vscode.CompletionItemKind.Function),
                new vscode.CompletionItem('while', vscode.CompletionItemKind.Function),
                new vscode.CompletionItem('if', vscode.CompletionItemKind.Function),
                new vscode.CompletionItem('repeat', vscode.CompletionItemKind.Function),
                new vscode.CompletionItem('println', vscode.CompletionItemKind.Function),
                new vscode.CompletionItem('println "Hello World!";', vscode.CompletionItemKind.Snippet),
            ]
        }
}

function isStringPresent(name: string, line: string, lineNum: number, startNum: number): void {
    var _string:string = line.substr(line.indexOf(" ") + 1).replace(/\s+/g, '');
    var isString:boolean = false;
    if (_string.endsWith("'") || _string.endsWith("';") || _string.endsWith("'&&")) {
        isString = true;
    } else if (_string.endsWith('"') || _string.endsWith('";') || _string.endsWith("\"&&")) {
        isString = true;
    } else if (_string.endsWith('`') || _string.endsWith('`;') || _string.endsWith("`&&")) {
        isString = true;
    }
    if (!isString) {
        diagnostics.push(new vscode.Diagnostic(
            new vscode.Range(new vscode.Position(lineNum, startNum), new vscode.Position(lineNum, startNum + line.split(' ')[0].length)),
            `${name} requires a string as an argument`,
            vscode.DiagnosticSeverity.Error,
        ));
    }
}

function updateDiagnostics(editor: vscode.TextEditor): void {
    diagnostics = [];

    if (editor.document.getText().trim() === '') {
        diagnosticCollection.clear();
        return;
    }

    for (let lineNum = 0; lineNum < editor.document.lineCount; ++lineNum) {
        const lineAt = editor.document.lineAt(lineNum);
        const document = editor.document;
        const line_notrim = lineAt.text;
        const startNum = line_notrim.search(/\S/);
        if (startNum == -1) {
            continue;
        }
        const line = line_notrim.trim();
    
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
                case '&&':
                    break;
                case 'while':
                    break;
                case 'if':
                    break;
                case 'alias':
                    break;
                case 'repeat':
                    break;
                case 'read':
                    break;
                case 'python':
                    break;
                case 'a':
                    break;
                case 'system':
                    isStringPresent('var', line, lineNum, startNum)
                    break;
                case 'code_start;':
                    break;
                case 'sleep':
                    break;
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

            diagnosticCollection.set(document.uri, diagnostics);
        } else {
            diagnosticCollection.clear();
        }
    }
}

export function activate(ctx: vscode.ExtensionContext): void {
    let documentSelector = { scheme: 'file', language: 'yell' };

    try {
        ctx.subscriptions.push(vscode.commands.registerCommand('yell.run_code', () => {
            vscode.window.showInformationMessage('To run the code, open a VSCode terminal and run (replacing <DIR> and <FILE> with the name of the directory and the name of the file): cd <DIR> && yell <FILE>');
        }));
    }
    catch (error) { }

    ctx.subscriptions.push(vscode.languages.registerCompletionItemProvider(documentSelector, new YellCompletionItemProvider(), " "));

    setInterval(() => { if (vscode.window.activeTextEditor) { updateDiagnostics(vscode.window.activeTextEditor) } }, 500);
}