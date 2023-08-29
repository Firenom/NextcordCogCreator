// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import { workspace, commands, window, WorkspaceEdit, Uri, Position, ExtensionContext, WorkspaceConfiguration, ConfigurationTarget } from 'vscode';
import { readdir, readdirSync, statSync } from 'fs';
import { join } from 'path';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: ExtensionContext) {
	const template = `import nextcord
from nextcord.ext import commands

class {NAME}(commands.Cog):
    def __init__(self, client: commands.Bot):
        self.client = client

def setup(client: commands.Bot):
    client.add_cog({NAME}(client))`
	
	let config = getConfig()

	workspace.onDidChangeConfiguration(event => {
		config = getConfig()
	})

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	// console.log('Congratulations, your extension "nextcordcoggenerator" is now active!');

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	let disposable = commands.registerCommand('nextcordcoggenerator.createCog', (data) => {
		if (data) {
			let files = getFiles(data.path.slice(1))
			let input = window.createInputBox()
			input.prompt = "Enter name of file"
			input.onDidChangeValue(function (e) {
				if (files.includes(e))
					input.validationMessage = "A file with this name already exists!"

				else
					input.validationMessage = ""
			})

			input.onDidAccept(async function (e) {
				if (files.includes(input.value)) {
					return
				}

				const wsedit = new WorkspaceEdit();
				const filePath = Uri.file(data.path + `/${input.value}.py`);
				window.showInformationMessage(filePath.toString());
				const file = wsedit.createFile(filePath, { ignoreIfExists: true });
				let content = ""
				switch (config.get("templateType")) {
					case "default":
						content = template
						break
					
					case "text":
						content = config.get("templateCode")!
						break

					case "link":
						content = template
						break

					case "path":
						content = (await workspace.openTextDocument(Uri.parse("file:///" + workspace.workspaceFolders![0].uri.fsPath + "/" + config.get("templateCode")))).getText()
				}
				content = content.replace(new RegExp("{NAME}", 'g'), `${input.value.split(" ").map(function (word) {return word.charAt(0).toUpperCase() + word.substring(1)}).join("")}`)
				
				wsedit.insert(filePath, new Position(0, 0), content)
				workspace.applyEdit(wsedit);
				window.showInformationMessage(`Created a new file: ${input.value}.py`);
				input.dispose()
			})
	
			input.onDidHide(function (e) {
				return
			})
	
			input.show()
		}

		else {
			let folder = workspace.workspaceFolders
			if (!folder)
				return

			let folder_selection = window.createQuickPick()
			folder_selection.title = "Select which folder to make the file in"
			let choices = getDirectoriesRecursive(folder[0].uri.fsPath)
			folder_selection.items = choices.map(choice => ({ label: choice }));
			folder_selection.matchOnDetail = true

			folder_selection.onDidChangeValue(function (e) {
				if (check_if_in(choices, folder_selection.value)) folder_selection.items = [folder_selection.value, ...choices].map(label => ({ label }))
			})

			folder_selection.onDidChangeSelection(function (e) {
				folder_selection.value = e[0].label
			})

			folder_selection.onDidAccept(function (e) {
				folder_selection.dispose()
				let name_of_file = window.createInputBox()
				let files = getFiles(folder_selection.value)
				name_of_file.prompt = "Enter name of file"

				name_of_file.onDidChangeValue(function (e) {
					if (files.includes(e))
					name_of_file.validationMessage = "A file with this name already exists!"

					else
						name_of_file.validationMessage = ""
				})
				
				name_of_file.onDidAccept(async function (e) {					
					if (files.includes(name_of_file.value))
						return

					let content = ""
					switch (config.get("templateType")) {
						case "default":
							content = template
							break
						
						case "text":
							content = config.get("templateCode")! ? config.get("templateCode")! : template
							break
	
						case "link":
							content = template
							break
	
						case "path":
							content = (await workspace.openTextDocument(Uri.parse("file:///" + workspace.workspaceFolders![0].uri.fsPath + "/" + config.get("templateCode")))).getText()
					}
					content = content.replace(new RegExp("{NAME}", 'g'), `${name_of_file.value.split(" ").map(function (word) {return word.charAt(0).toUpperCase() + word.substring(1)}).join("")}`)

					const wsedit = new WorkspaceEdit();
					const filePath = Uri.file(`${folder_selection.value}\\${name_of_file.value}.py`);
					window.showInformationMessage(filePath.toString());
					const file = wsedit.createFile(filePath, { ignoreIfExists: true });
					wsedit.insert(filePath, new Position(0, 0), content)
					workspace.applyEdit(wsedit);
					window.showInformationMessage(`Created a new file: ${name_of_file.value}.py`);
					name_of_file.dispose()
				})
		
				name_of_file.show()
			})

			folder_selection.show()
		}
	});

	context.subscriptions.push(disposable);
}

// This method is called when your extension is deactivated
export function deactivate() {}

function getConfig() {
	return workspace.getConfiguration("nextcordcoggenerator") as WorkspaceConfiguration
}

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

function getFiles(srcpath: any) {
	return readdirSync(srcpath)
		.map((file: any) => join(srcpath, file))
		.filter((path: any) => statSync(path).isFile())
		.map((path: any) => path.slice(path.lastIndexOf("\\")+1))
		.map((path: any) => path.slice(0, path.indexOf(".")))
}

function getDirectories(srcpath: any) {
	return readdirSync(srcpath)
		.map((file: any) => join(srcpath, file))
		.filter((path: any) => statSync(path).isDirectory());
}

function getDirectoriesRecursive(srcpath: any): string[] {
	return [srcpath, ...flatten(getDirectories(srcpath).map(getDirectoriesRecursive))];
}