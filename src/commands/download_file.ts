import { EID } from 'ardrive-core-js';
import { resolve as resolvePath } from 'path';
import { cliArDriveAnonymousFactory, cliArDriveFactory } from '../index';
import { CLICommand, ParametersHelper } from '../CLICommand';
import { CLIAction } from '../CLICommand/action';
import {
	DriveIdParameter,
	DrivePrivacyParameters,
	FileIdParameter,
	LocalFilePathParameter
} from '../parameter_declarations';

new CLICommand({
	name: 'download-file',
	parameters: [FileIdParameter, LocalFilePathParameter, DriveIdParameter, ...DrivePrivacyParameters],
	action: new CLIAction(async (options) => {
		const parameters = new ParametersHelper(options);
		const fileId = parameters.getRequiredParameterValue(FileIdParameter, EID);
		const destFolderPath = resolvePath(parameters.getParameterValue(LocalFilePathParameter) || './');

		if (await parameters.getIsPrivate()) {
			const wallet = await parameters.getRequiredWallet();
			const ardrive = cliArDriveFactory({
				wallet,
				feeMultiple: parameters.getOptionalBoostSetting()
			});
			const driveIdString = parameters.getParameterValue(DriveIdParameter);
			const driveId = driveIdString ? EID(driveIdString) : await ardrive.getDriveIdForFileId(fileId);
			const driveKey = await parameters.getDriveKey({ driveId: driveId });
			await ardrive.downloadPrivateFile(fileId, destFolderPath, driveKey);
		} else {
			const ardrive = cliArDriveAnonymousFactory({});
			await ardrive.downloadPublicFile(fileId, destFolderPath);
		}
		console.log(`File with ID "${fileId}" was successfully download to "${destFolderPath}"`);
	})
});
