/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import { Command } from 'commander';
import { showHelp } from '../utils';
import { CliApiObject, ParsedArguments } from './cli';
import { Parameter, ParameterName, ParameterOverridenConfig } from './parameter';

export type CommandName = string;
export interface CommandDescriptor {
	name: CommandName;
	parameters: (ParameterName | ParameterOverridenConfig)[];
	action(options: ParsedArguments): Promise<void>;
}

const program: CliApiObject = new Command() as CliApiObject;

// Disable default commander help docs
program.addHelpCommand(false);

/**
 * @name setCommanderCommand
 * @param {CommandDescriptor} commandDescriptor the description of the command to be set
 * @param {CliApiObject} program the instance of the commander class
 * This function is the responsible to tell the third party library to declare a command
 */
function setCommanderCommand(commandDescriptor: CommandDescriptor, program: CliApiObject): void {
	let command: CliApiObject = program.command(commandDescriptor.name);
	const parameters = commandDescriptor.parameters.map((param) => new Parameter(param));
	parameters.forEach((parameter) => {
		const aliasesAsString = parameter.aliases.join(' ');
		const paramTypeString = (function () {
			if (parameter.type === 'array') {
				return ` <${parameter.name}...>`;
			} else if (parameter.type === 'boolean') {
				return '';
			}
			return ` <${parameter.name}>`;
		})();
		const optionArguments = [
			`${aliasesAsString}${paramTypeString}`,
			parameter.description,
			parameter.default
		] as const;
		if (parameter.required) {
			command.requiredOption(...optionArguments);
		} else {
			command.option(...optionArguments);
		}
	});
	command = command.action(async (options) => {
		assertConjunctionParameters(commandDescriptor, options);
		await commandDescriptor.action(options).catch((err) => {
			console.log(err.message);
			process.exit(1);
		});
	});
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function assertConjunctionParameters(commandDescriptor: CommandDescriptor, options: any): void {
	const parameters = commandDescriptor.parameters;
	parameters.forEach((param) => {
		const parameter = new Parameter(param);
		const parameterName = parameter.name;
		const parameterValue = options[parameterName];
		if (parameterValue) {
			assertRequired(parameter, options);
			assertForbidden(parameter, options);
		}
	});
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function assertRequired(parameter: Parameter, options: any): void {
	const parameterName = parameter.name;
	const required = parameter.requiredParametersInConjunction;
	required.forEach((requiredParameterName) => {
		const requiredParameterValue = options[requiredParameterName];
		if (!requiredParameterValue) {
			throw new Error(`Parameter ${parameterName} requires ${requiredParameterName} but it wasn't provided`);
		}
	});
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function assertForbidden(parameter: Parameter, options: any): void {
	const parameterName = parameter.name;
	const forbidden = parameter.forbiddenParametersInConjunction;
	forbidden.forEach((forbiddenParameterName) => {
		const forbiddenParameterValue = options[forbiddenParameterName];
		if (forbiddenParameterValue) {
			throw new Error(`Parameter ${parameterName} cannot be used in conjunction with ${forbiddenParameterName}`);
		}
	});
}

export class CLICommand {
	/**
	 * @param {CommandDescriptor} commandDescription an immutable representation of a command
	 * @param {string[]} argv a custom argv for testing purposes
	 */
	constructor(private readonly commandDescription: CommandDescriptor, private readonly _program?: CliApiObject) {
		this.setCommand();
	}

	// A singleton instance of the commander's program object
	public static get program(): CliApiObject {
		// TODO: make me private when index.ts is fully de-coupled from commander library
		return program;
	}

	private get program(): CliApiObject {
		return this._program || CLICommand.program;
	}

	private setCommand(): void {
		setCommanderCommand(this.commandDescription, this.program);
	}

	public static parse(program: CliApiObject = this.program, argv: string[] = process.argv): void {
		if (argv.length < 3 || argv.includes('-h') || argv.includes('--help') || argv.includes('help')) {
			showHelp();
			process.exit(0);
		}

		program.parse(argv);
	}
}
