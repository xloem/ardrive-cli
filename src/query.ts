import { ArweaveAddress } from './types';

const nodeFragment = (block: boolean) => `
	node {
		id
		${block ? feeInfoFragment : ''}
		tags {
			name
			value
		}
	}
`;

const edgesFragment = (singleResult: boolean, block: boolean) => `
	edges {
		${singleResult ? '' : 'cursor'}
		${nodeFragment(block)}
	}
`;

const pageInfoFragment = `
	pageInfo {
		hasNextPage
	}
`;

const feeInfoFragment = `
	fee {
		winston
	}
`;

export type GQLQuery = { query: string };

const latestResult = 1;
const pageLimit = 100;

/**
 * Builds a GraphQL query which will only return the latest result
 *
 * TODO: Add parameters and support for all possible upcoming GQL queries
 *
 * @example
 * const query = buildQuery([{ name: 'Folder-Id', value: folderId }]);
 */
export function buildQuery(
	tags?: { name: string; value: string | string[] }[],
	cursor?: string,
	owner?: ArweaveAddress,
	block?: number
): GQLQuery {
	let queryTags = ``;

	tags?.forEach((t) => {
		queryTags = `${queryTags}
				{ name: "${t.name}", values: ${Array.isArray(t.value) ? JSON.stringify(t.value) : `"${t.value}"`} }`;
	});

	const singleResult = cursor === undefined;

	return {
		query: `query {
			transactions(
				first: ${singleResult ? latestResult : pageLimit}
				${singleResult ? '' : `after: "${cursor}"`}
				${block ? `block: {  min: ${block}, max: ${block} }` : ''}
				${owner === undefined ? '' : `owners: ["${owner}"]`}
				${
					tags
						? `tags: [
					${queryTags}
				]`
						: ''
				}
			) {
				${singleResult ? '' : pageInfoFragment}
				${edgesFragment(singleResult, block !== undefined)}
			}
		}`
	};
}
