/**
 * This script generates a random string (based on base64) of the specified length.
 *
 * Usage:
 *
 * 1. `yarn run ts-node ./cli/script/generate-keys/script.ts --length 64`:
 *      This will generate a 64 character random string.
 *
 * 2. `yarn run ts-node ./cli/script/generate-keys/script.ts --length 32 --env-file .env --env-vars JWT_ACCESS_TOKEN_SECRET JWT_REFRESH_TOKEN_SECRET`:
 *      This will generate two 32 character random string, and store them in the environment variables `JWT_ACCESS_TOKEN_SECRET` and `JWT_REFRESH_TOKEN_SECRET`
 *      in the .env file found in the directory from which the script is run.
 */
import chalk from 'chalk';
import { randomBytes } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import yargs from 'yargs';

export function scriptArgumentsParser(rawArguments: string[]) {
  return yargs
    .usage('Generates keys/secrets that are used by the application.')
    .options({
      length: {
        description: 'The length of the key to generate.',
        default: 64,
      },
      envFile: {
        description:
          'The name of the environment file into which to insert the generated keys.',
        string: true,
      },
      envVars: {
        description:
          'The name of the environment variables present inside the environment file - into which to insert the generated keys.',
        string: true,
        array: true,
      },
    })
    .number('length')
    .implies('envFile', 'envVars')
    .implies('envVars', 'envFile')
    .strict()
    .parseSync(rawArguments);
}

export function generateKey(length: number) {
  return randomBytes(length).toString('base64').substring(0, length);
}

export function main({
  length,
  envFile,
  envVars,
}: {
  length: number;
  envFile: string | undefined;
  envVars: string[] | undefined;
}) {
  if (!envFile) {
    return {
      key: generateKey(length),
    };
  }

  if (!existsSync(envFile)) {
    throw new Error(
      `The '${envFile}' file does not exist. Create it and try again.`,
    );
  }

  if (!envVars || envVars.length === 0) {
    throw new Error(
      'At least one environment variable key should be provided.',
    );
  }

  let envFileContent = readFileSync(envFile, 'utf-8');

  for (const envVar of envVars) {
    const envKeyRegExp = new RegExp(`${envVar}=(.*)\n`);

    if (!envKeyRegExp.test(envFileContent)) {
      throw new Error(
        `The '${envVar}' key does not exist in the environment file '${envFile}'.`,
      );
    }

    envFileContent = envFileContent.replace(
      envKeyRegExp,
      `${envVar}="${generateKey(length)}"\n`,
    );
  }

  writeFileSync(envFile, envFileContent);

  return {
    message: `Successfully generated keys for the environment variables: ${(
      envVars as string[]
    )
      .map((envVar) => `"${envVar}"`)
      .join(', ')} - in the file '${envFile}'.`,
  };
}

/**
 * Run the script (only if it is being run through a transpiler).
 */
if (process.argv[1] === __filename) {
  (() => {
    try {
      const result = main(scriptArgumentsParser(process.argv.slice(2)));

      console.log(`\n${chalk.green(result.key ?? result.message)}`);
    } catch (error) {
      console.error(`${chalk.red((error as Error).message)}`);

      process.exit(1);
    }
  })();
}
