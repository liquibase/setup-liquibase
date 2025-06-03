import * as core from '@actions/core';
import { setupLiquibase } from './installer';

async function run(): Promise<void> {
  try {
    const version = core.getInput('version') || 'latest';
    const editionInput = core.getInput('edition') || 'oss';
    const licenseKey = core.getInput('liquibase-pro-license-key');
    const cache = core.getBooleanInput('cache');
    const checkLatest = core.getBooleanInput('check-latest');

    if (editionInput !== 'oss' && editionInput !== 'pro') {
      throw new Error('Edition must be either "oss" or "pro"');
    }

    const edition = editionInput as 'oss' | 'pro';

    core.info(`Setting up Liquibase ${edition} version ${version}`);

    if (edition === 'pro' && !licenseKey) {
      throw new Error('License key is required for Liquibase Pro edition');
    }

    const result = await setupLiquibase({
      version,
      edition,
      licenseKey,
      cache,
      checkLatest
    });

    core.setOutput('liquibase-version', result.version);
    core.setOutput('liquibase-path', result.path);

    core.info(`Successfully set up Liquibase ${result.version} at ${result.path}`);
  } catch (error) {
    core.setFailed(error instanceof Error ? error.message : String(error));
  }
}

run();