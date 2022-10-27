
const core = require('@actions/core');
const { loadSpecFromMainBranch, loadSpecLocally } = require('./loader');
const { detectBreakingChanges } = require('./analyzer');

async function run() {
  const fileName = core.getInput('specFilename', { required: true });
  const format = core.getInput('format', { required: false });

  const previousSpec = await loadSpecFromMainBranch(
    core.getInput('access_token', { required: true }),
    fileName,
    format
  );

  if (!previousSpec) {
    core.setFailed('Unable to load spec from the main branch');
    return;
  }

  const newSpec = loadSpecLocally(fileName, format);
  if (!newSpec) {
    core.setFailed('Unable to load spec from current branch');
    return;
  }

  const breakingChangeTypes = core.getMultilineInput('breakingChangeTypes', { required: false });
  const breakingChanges = detectBreakingChanges(previousSpec, newSpec, breakingChangeTypes);
  if (breakingChanges?.length) {
    const failureMessage = `Found breaking changes: ${breakingChanges.join('\r\n')}`;
    core.error('breaking-changes', failureMessage);
    core.setOutput('breaking-changes-detected', true);
    core.setFailed(failureMessage);
  } else {
    core.setOutput('breaking-changes-detected', false);
  }
}