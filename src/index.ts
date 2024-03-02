import * as vscode from "vscode";
import { join } from "path";
import goToDashboard from "./commands/go-to-dashboard";
import goToWebsite from "./commands/go-to-website";
import { load as parseToml } from "js-toml";

export async function activate(context: vscode.ExtensionContext) {
  const rootDir = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
  if (rootDir) {
    const envDocument = await vscode.workspace.openTextDocument(join(rootDir, ".env"));
    const envParseRegex = /^(?<key>\w+)=['|"]?(?<value>[^'"]*)?['|"]?$/g;
    const lines = envDocument.getText().replace(/(?:\\[rn]|[\r\n]+)+/g, "\n").split("\n");
    const envList = lines.map((line) => line.matchAll(envParseRegex).next().value.groups);

    if (envList.length === 0 || !envList) { return; }
    console.log(envList);
    const supabaseUrl = envList.find((i) => i.key === "SUPABASE_URL")?.value ?? "https://supabase.co";

    console.log(supabaseUrl);
    global.supabaseHost = supabaseUrl;

    if (global.supabaseHost.indexOf("supabase.co") === -1) {
      const supabaseConfigDocument = await vscode.workspace.openTextDocument(join(rootDir, "supabase", "config.toml"));
      const config = supabaseConfigDocument.getText();
      const configParse: any = parseToml(config);
      const port = configParse.studio.port ?? 54323;
      global.supabaseHost = `${global.supabaseHost.replace(/(\:\d{4,6})/g, "")}:${port}`;
    } else {
      global.supabaseRef = supabaseUrl?.split("https://")[1].split(".supabase")[0] ?? "";
    }

  }

  context.subscriptions.concat(goToWebsite);
  context.subscriptions.concat(goToDashboard);
}

export function deactivate() { }
