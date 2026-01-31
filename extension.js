const vscode = require('vscode');
let countdownInterval = null;
let countdownEndTime = null;

/**
 * @param {vscode.ExtensionContext} context
 */

function activate(context) {
  console.log('Interview Mode extension activated');

  const SETTINGS_BACKUP_KEY = 'interviewMode.settingsBackup';
  const MODE_ACTIVE_KEY = 'interviewMode.isActive';

  const statusBar = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Right,
    100
  );

  statusBar.command = 'barecode.disable';

  /**
   * @param {boolean} isActive
   */

  function updateStatusBar(isActive, minutesLeft = null, secondsLeft = null) {
    if (!isActive) {
      statusBar.hide();
      return;
    }

    // If timer exists, show countdown
    if (minutesLeft !== null && secondsLeft !== null) {
      const mm = String(minutesLeft).padStart(2, '0');
      const ss = String(secondsLeft).padStart(2, '0');
      statusBar.text = `$(circle-filled) Interview ${mm}:${ss}`;
      statusBar.tooltip = 'Interview Mode is ON (click to turn OFF)';
    } else {
      statusBar.text = '$(circle-filled) Interview Mode';
      statusBar.tooltip = 'Interview Mode is ON (click to turn OFF)';
    }

    statusBar.show();
  }

  const disposable = vscode.commands.registerCommand(
    'barecode.enable',
    async function () {
      // get data

      const config = vscode.workspace.getConfiguration();

      const input = await vscode.window.showInputBox({
        title: 'Interview Mode Duration',
        prompt: 'Enter session length in minutes (e.g., 30, 45, 60)',
        value: '45',
        validateInput: (value) => {
          const n = Number(value);
          if (!Number.isFinite(n) || n <= 0 || n > 180)
            return 'Enter a number between 1 and 180';
          return null;
        },
      });

      if (!input) {
        return;
      }

      const minutes = Number(input);
      const backup = {
        quickSUggestion: config.get('editor.quickSuggestions'),
        suggestionOnTriggerCharacters: config.get(
          'editor.suggestOnTriggerCharacters'
        ),
        parameterHintsEnabled: config.get('editor.parameterHints.enabled'),
        formatOnSave: config.get('editor.formatOnSave'),
        suggestSelection: config.get('editor.suggestSelection'),
        acceptSuggestionOnEnter: config.get('editor.acceptSuggestionOnEnter'),
        quickSuggestionsDelay: config.get('editor.quickSuggestionsDelay'),
        autoImportsTs: config.get('typescript.suggest.autoImports'),
        autoImportsJs: config.get('javascript.suggest.autoImports'),
        problemsDecorationsEnabled: config.get('problems.decorations.enabled'),
        showUnused: config.get('editor.showUnused'),
      };

      // save backup
      await context.globalState.update(SETTINGS_BACKUP_KEY, backup);

      // update setting

      await config.update(
        'editor.quickSuggestions',
        false,
        vscode.ConfigurationTarget.Global
      );
      await config.update(
        'editor.suggestOnTriggerCharacters',
        false,
        vscode.ConfigurationTarget.Global
      );
      await config.update(
        'editor.parameterHints.enabled',
        false,
        vscode.ConfigurationTarget.Global
      );
      await config.update(
        'editor.formatOnSave',
        false,
        vscode.ConfigurationTarget.Global
      );
      await config.update(
        'typescript.suggest.autoImports',
        false,
        vscode.ConfigurationTarget.Global
      );
      await config.update(
        'javascript.suggest.autoImports',
        false,
        vscode.ConfigurationTarget.Global
      );
      await config.update(
        'editor.acceptSuggestionOnEnter',
        'off',
        vscode.ConfigurationTarget.Global
      );
      await config.update(
        'editor.suggestSelection',
        'first',
        vscode.ConfigurationTarget.Global
      );
      await config.update(
        'editor.quickSuggestionsDelay',
        999999,
        vscode.ConfigurationTarget.Global
      );

      await config.update(
        'problems.decorations.enabled',
        false,
        vscode.ConfigurationTarget.Global
      );
      await config.update(
        'editor.showUnused',
        false,
        vscode.ConfigurationTarget.Global
      );

      await context.globalState.update(MODE_ACTIVE_KEY, true);
      updateStatusBar(true);

      // Clear existing timer if any
      if (countdownInterval) {
        clearInterval(countdownInterval);
        countdownInterval = null;
      }

      countdownEndTime = Date.now() + minutes * 60 * 1000;

      countdownInterval = setInterval(async () => {
        const remainingMs = countdownEndTime - Date.now();

        if (remainingMs <= 0) {
          clearInterval(countdownInterval);
          countdownInterval = null;
          countdownEndTime = null;

          // Auto turn OFF
          await vscode.commands.executeCommand('barecode.disable');
          vscode.window.showInformationMessage(
            'Interview session finished. Interview Mode OFF.'
          );
          return;
        }

        const totalSeconds = Math.floor(remainingMs / 1000);
        const m = Math.floor(totalSeconds / 60);
        const s = totalSeconds % 60;

        updateStatusBar(true, m, s);
      }, 1000);

      vscode.window.showInformationMessage('Interview Mode On!');
    }
  );

  const disableDisposable = vscode.commands.registerCommand(
    'barecode.disable',
    async function () {
      const config = vscode.workspace.getConfiguration();

      if (countdownInterval) {
        clearInterval(countdownInterval);
        countdownInterval = null;
        countdownEndTime = null;
      }
      const backup = context.globalState.get(SETTINGS_BACKUP_KEY);

      if (backup) {
        await config.update(
          'editor.quickSuggestions',
          backup.quickSUggestion,
          vscode.ConfigurationTarget.Global
        );
        await config.update(
          'editor.suggestOnTriggerCharacters',
          backup.suggestionOnTriggerCharacters,
          vscode.ConfigurationTarget.Global
        );
        await config.update(
          'editor.parameterHints.enabled',
          backup.parameterHintsEnabled,
          vscode.ConfigurationTarget.Global
        );
        await config.update(
          'editor.formatOnSave',
          backup.formatOnSave,
          vscode.ConfigurationTarget.Global
        );
        await config.update(
          'typescript.suggest.autoImports',
          backup.autoImportsTs,
          vscode.ConfigurationTarget.Global
        );
        await config.update(
          'javascript.suggest.autoImports',
          backup.autoImportsJs,
          vscode.ConfigurationTarget.Global
        );
        await config.update(
          'editor.acceptSuggestionOnEnter',
          backup.acceptSuggestionOnEnter,
          vscode.ConfigurationTarget.Global
        );
        await config.update(
          'editor.suggestSelection',
          backup.suggestSelection,
          vscode.ConfigurationTarget.Global
        );
        await config.update(
          'editor.quickSuggestionsDelay',
          backup.quickSuggestionsDelay,
          vscode.ConfigurationTarget.Global
        );

        await config.update(
          'problems.decorations.enabled',
          backup.problemsDecorationsEnabled,
          vscode.ConfigurationTarget.Global
        );
        await config.update(
          'editor.showUnused',
          backup.showUnused,
          vscode.ConfigurationTarget.Global
        );

        await context.globalState.update(MODE_ACTIVE_KEY, false);
        updateStatusBar(false);

        vscode.window.showInformationMessage('Interview Mode Off!');
      } else {
        vscode.window.showWarningMessage(
          'No backup settings found. Cannot disable Interview Mode.'
        );
      }
    }
  );

  const wasActive = context.globalState.get(MODE_ACTIVE_KEY, false);
  updateStatusBar(wasActive);

  context.subscriptions.push(disableDisposable);
  context.subscriptions.push(statusBar);
  context.subscriptions.push(disposable);
}

function deactivate() {}

module.exports = {
  activate,
  deactivate,
};
