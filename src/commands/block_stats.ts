import { arDriveAnonymousFactory } from '..';
import { CLICommand } from '../CLICommand';
import { BlockParameter, NumberOfBlocksParameter } from '../parameter_declarations';

/* eslint-disable no-console */

new CLICommand({
	name: 'block-stats',
	parameters: [BlockParameter, NumberOfBlocksParameter],
	async action({ block, numberOfBlocks }) {
		const arDrive = arDriveAnonymousFactory();

		const blockStats = await arDrive.getStatsOfBlock(block, numberOfBlocks);
		console.log(JSON.stringify(blockStats, null, 4));
		process.exit(0);
	}
});
