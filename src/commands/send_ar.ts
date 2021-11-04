import { cliWalletDao } from '..';
import { ArweaveAddress, AR, FeeMultiple } from '../types';
import { CLICommand } from '../CLICommand';
import { ParametersHelper } from '../CLICommand';
import { CLIAction } from '../CLICommand/action';
import { SUCCESS_EXIT_CODE } from '../CLICommand/error_codes';
import {
	ArAmountParameter,
	BoostParameter,
	DestinationAddressParameter,
	DryRunParameter,
	WalletFileParameter
} from '../parameter_declarations';
import { assertARPrecision } from '../utils/ar_unit';

new CLICommand({
	name: 'send-ar',
	parameters: [ArAmountParameter, DestinationAddressParameter, WalletFileParameter, BoostParameter, DryRunParameter],
	action: new CLIAction(async function action(options) {
		assertARPrecision(options.arAmount);
		const parameters = new ParametersHelper(options);
		const arAmount = AR.from(options.arAmount);
		const destAddress = new ArweaveAddress(options.destAddress);
		const wallet = await parameters.getRequiredWallet();
		const walletAddress = await wallet.getAddress();
		console.log(`Source address: ${walletAddress}`);
		console.log(`AR amount sent: ${arAmount.toString()}`);
		console.log(`Destination address: ${destAddress}`);
		const rewardSetting = options.boost ? { feeMultiple: new FeeMultiple(+options.boost) } : undefined;

		const arTransferResult = await cliWalletDao.sendARToAddress(
			arAmount,
			wallet,
			destAddress,
			rewardSetting,
			options.dryRun,
			[
				{ name: 'App-Name', value: 'ArDrive-CLI' },
				{ name: 'App-Version', value: '2.0' },
				{ name: 'Type', value: 'transfer' }
			],
			true
		);

		console.log(JSON.stringify(arTransferResult, null, 4));
		return SUCCESS_EXIT_CODE;
	})
});
