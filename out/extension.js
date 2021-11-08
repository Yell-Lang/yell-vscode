"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = void 0;
const vscode = require("vscode");
const path = require("path");
let diagnosticCollection = vscode.languages.createDiagnosticCollection("yell");
let diagnostics = [];
class YellCompletionItemProvider {
    provideCompletionItems(document, position, token) {
        const linePrefix = document.lineAt(position).text.substr(0, position.character);
        if (linePrefix.endsWith('print ') || linePrefix.endsWith('println ') || linePrefix.endsWith('sleep ')
            || linePrefix.endsWith('system ')) {
            return [
                new vscode.CompletionItem('"";', vscode.CompletionItemKind.Property),
            ];
        }
        else if (linePrefix.endsWith('read ')) {
            return [
                new vscode.CompletionItem('"input" "input_var";', vscode.CompletionItemKind.Property),
            ];
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
        ];
    }
}
function isStringPresent(name, line, lineNum, startNum) {
    var _string = line.substr(line.indexOf(" ") + 1).replace(/\s+/g, '');
    var isString = false;
    if (_string.endsWith("'") || _string.endsWith("';")) {
        isString = true;
    }
    else if (_string.endsWith('"') || _string.endsWith('";')) {
        isString = true;
    }
    else if (_string.endsWith('`') || _string.endsWith('`;')) {
        isString = true;
    }
    if (!isString) {
        diagnostics.push(new vscode.Diagnostic(new vscode.Range(new vscode.Position(lineNum, startNum), new vscode.Position(lineNum, startNum + line.split(' ')[0].length)), `${name} requires a string as an argument`, vscode.DiagnosticSeverity.Error));
    }
}
function updateDiagnostics(editor) {
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
        const endNum = lineAt.range.end.character;
        if (document && path.basename(document.uri.fsPath).endsWith('.yell')) {
            switch (line.split(' ')[0]) {
                case 'print':
                    isStringPresent('print', line, lineNum, startNum);
                    break;
                case 'println':
                    isStringPresent('println', line, lineNum, startNum);
                    break;
                case 'var':
                    break;
                case '&&':
                    break;
                case 'while':
                    break;
                case 'if':
                    break;
                case 'repeat':
                    break;
                case 'read':
                    break;
                case 'a':
                    break;
                case 'system':
                    isStringPresent('var', line, lineNum, startNum);
                    break;
                case 'code_start;':
                    break;
                case 'sleep':
                    if (!(line.split(' ')[1].startsWith('n"') && (line.split(' ')[1].endsWith('"') || line.split(' ')[1].endsWith('";')))) {
                        diagnostics.push(new vscode.Diagnostic(new vscode.Range(new vscode.Position(lineNum, startNum), new vscode.Position(lineNum, startNum + line.split(' ')[0].length)), 'sleep requires an n"" string/number', vscode.DiagnosticSeverity.Error));
                    }
                case 'import':
                    break;
                default:
                    if (!(line.startsWith('#!') || line.startsWith('/*') || line.endsWith('*/') || line === '')) {
                        diagnostics.push(new vscode.Diagnostic(new vscode.Range(new vscode.Position(lineNum, startNum), new vscode.Position(lineNum, startNum + line.split(' ')[0].length)), 'no such function: ' + line.split(' ')[0], vscode.DiagnosticSeverity.Error));
                    }
            }
            diagnosticCollection.set(document.uri, diagnostics);
        }
        else {
            diagnosticCollection.clear();
        }
    }
}
function activate(ctx) {
    ctx.subscriptions.push(vscode.commands.registerCommand('yell.run_code', () => {
        vscode.window.showInformationMessage('To run the code, open a VSCode terminal and run (replacing <DIR> and <FILE> with the name of the directory and the name of the file): cd <DIR> && yell <FILE>');
    }));
    setInterval(() => { if (vscode.window.activeTextEditor) {
        updateDiagnostics(vscode.window.activeTextEditor);
    } }, 500);
}
exports.activate = activate;
//# sourceMappingURL=extension.js.map