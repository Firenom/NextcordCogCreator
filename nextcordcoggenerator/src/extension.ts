// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { readdir, readdirSync, statSync } from 'fs';
import { join } from 'path';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	// console.log('Congratulations, your extension "nextcordcoggenerator" is now active!');

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	let disposable = vscode.commands.registerCommand('nextcordcoggenerator.createCog', (data) => {
		// The code you place here will be executed every time your command is executed
		// Display a message box to the user
		// let input = vscode.window.showInputBox()
		// input.then(
		// 	function (data) {
		// 		vscode.window.showInformationMessage(`Hello ${data} from NextcordCogGenerator!`);
		// 	}
		// )
		
		if (data) {
			let input = vscode.window.createInputBox()
			input.prompt = "Enter name of file"
			input.onDidAccept(function (e) {
				const wsedit = new vscode.WorkspaceEdit();
				const filePath = vscode.Uri.file(data.path + `/${input.value}.py`);
				vscode.window.showInformationMessage(filePath.toString());
				const file = wsedit.createFile(filePath, { ignoreIfExists: true });
				wsedit.insert(filePath, new vscode.Position(0, 0), template.replace(new RegExp("{NAME}", 'g'), `${input.value.split(" ").map(function (word) {return word.charAt(0).toUpperCase() + word.substring(1)}).join("")}`))
				vscode.workspace.applyEdit(wsedit);
				vscode.window.showInformationMessage(`Created a new file: ${input.value}.py`);
				input.dispose()
			})
	
			input.onDidHide(function (e) {
				return
			})
	
			input.show()
		}

		else {
			let name_of_file = vscode.window.createInputBox()
			name_of_file.prompt = "Enter name of file"
			
			name_of_file.onDidAccept(function (e) {
				name_of_file.dispose()
				let folder = vscode.workspace.workspaceFolders
				if (!folder)
					return
				
				let folder_selection = vscode.window.createQuickPick()
				folder_selection.title = "Select which folder to make the file in"
				let choices = getDirectoriesRecursive(folder[0].uri.fsPath)
				folder_selection.items = choices.map(choice => ({ label: choice }));
				folder_selection.matchOnDetail = true

				folder_selection.onDidChangeValue(function (e) {
					// let items = choices.map(function (label) {if (label.toLowerCase().startsWith(e.toLowerCase())) return label})
					// if (items.length == 0) {
					// 	folder_selection.items = ["No results match your query"].map(choice => ({ label: choice }))
					// }
					// else {
					// 	folder_selection.items = items ? items : default_choice.map(e => ({ label: e }))
					// }

					// folder_selection.items = [folder_selection.value, ...choices].map(function (label) {return label})

					// if (!choices.includes(folder_selection.value)) folder_selection.items = [folder_selection.value, ...choices].map(label => ({ label }))

					if (check_if_in(choices, folder_selection.value)) folder_selection.items = [folder_selection.value, ...choices].map(label => ({ label }))
				})

				folder_selection.onDidChangeSelection(function (e) {
					folder_selection.value = e[0].label
				})

				folder_selection.onDidAccept(function (e) {
					const wsedit = new vscode.WorkspaceEdit();
					const filePath = vscode.Uri.file(`${folder_selection.value}\\${name_of_file.value}.py`);
					vscode.window.showInformationMessage(filePath.toString());
					const file = wsedit.createFile(filePath, { ignoreIfExists: true });
					wsedit.insert(filePath, new vscode.Position(0, 0), template.replace(new RegExp("{NAME}", 'g'), `${name_of_file.value.split(" ").map(function (word) {return word.charAt(0).toUpperCase() + word.substring(1)}).join("")}`))
					vscode.workspace.applyEdit(wsedit);
					vscode.window.showInformationMessage(`Created a new file: ${name_of_file.value}.py`);
					folder_selection.dispose()
				})

				folder_selection.show()
			})
	
			name_of_file.onDidHide(function (e) {
				return
			})
	
			name_of_file.show()
		}

	});

	context.subscriptions.push(disposable);
}

// This method is called when your extension is deactivated
export function deactivate() {}

const template = `
import nextcord
from nextcord.ext import commands

class {NAME}(commands.Cog):
    def __init__(self, client: commands.Bot):
        self.client = client

def setup(client: commands.Bot):
    client.add_cog({NAME}(client))`

function check_if_in(choices: string[], goal: string) {
	for (let i in choices) {
		if (i.toLowerCase().includes(goal.toLowerCase())) {
			return true
		}
	}
	return false
}

function flatten(lists: any[]) {
	return lists.reduce((a: string | any[], b: any) => a.concat(b), []);
}
	  
function getDirectories(srcpath: any) {
	return readdirSync(srcpath)
		.map((file: any) => join(srcpath, file))
		.filter((path: any) => statSync(path).isDirectory());
}

function getDirectoriesRecursive(srcpath: any): string[] {
	return [srcpath, ...flatten(getDirectories(srcpath).map(getDirectoriesRecursive))];
}