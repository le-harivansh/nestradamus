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
      envKeys: {
        description:
          'The name of the environment variables present inside the environment file - into which to insert the generated keys.',
        string: true,
        array: true,
      },
    })
    .number('length')
    .implies('envFile', 'envKeys')
    .implies('envKeys', 'envFile')
    .strict()
    .parseSync(rawArguments);
}

export function generateKey(length: number) {
  return randomBytes(length).toString('base64').substring(0, length);
}

export function main({
  length,
  envFile,
  envKeys,
}: {
  length: number;
  envFile: string;
  envKeys: string[];
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

  if (envKeys.length === 0) {
    throw new Error(
      'At least one environment variable key should be provided.',
    );
  }

  let envFileContent = readFileSync(envFile, 'utf-8');

  for (const envKey of envKeys) {
    const envKeyRegExp = new RegExp(`${envKey}=(.*)\n`);

    if (!envKeyRegExp.test(envFileContent)) {
      throw new Error(
        `The '${envKey}' key does not exist in the environment file '${envFile}'.`,
      );
    }

    envFileContent = envFileContent.replace(
      envKeyRegExp,
      `${envKey}="${generateKey(length)}"\n`,
    );
  }

  writeFileSync(envFile, envFileContent);

  return {
    message: `Successfully generated keys for the environment variables: ${(
      envKeys as string[]
    )
      .map((key) => `"${key}"`)
      .join(', ')} - in the file '${envFile}'.`,
  };
}

/**
 * Run the script if it is not part of a jest test.
 */
if (process.env.NODE_ENV !== 'test') {
  (() => {
    try {
      const result = main(scriptArgumentsParser(process.argv.slice(2)));

      console.log(`\n${chalk.green(result.key ?? result.message)}`);
    } catch (error) {
      console.error(`${chalk.red((error as Error).message)}`);

      process.exit();
    }
  })();
}
