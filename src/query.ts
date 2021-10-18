import { ArweaveAddress } from './types';

const nodeFragment = `
	node {
		id
		tags {
			name
			value
		}
	}
`;

const edgesFragment = (singleResult: boolean) => `
	edges {
		${singleResult ? '' : 'cursor'}
		${nodeFragment}
	}
`;

const pageInfoFragment = `
	pageInfo {
		hasNextPage
	}
`;

export type GQLQuery = { query: string };

export const ASCENDENT_ORDER = 'HEIGHT_ASC';
export const DESCENDENT_ORDER = 'HEIGHT_DESC';
const latestResult = 1;
const pageLimit = 100;

type Sort = typeof ASCENDENT_ORDER | typeof DESCENDENT_ORDER;

/**
 * Builds a GraphQL query which will only return the latest result
 *
 * TODO: Add parameters and support for all possible upcoming GQL queries
 *
 * @example
 * const query = buildQuery([{ name: 'Folder-Id', value: folderId }]);
 */
export function buildQuery(
	tags: { name: string; value: string | string[] }[],
	cursor?: string,
	owner?: ArweaveAddress,
	sort: Sort = ASCENDENT_ORDER
): GQLQuery {
	let queryTags = ``;

	tags.forEach((t) => {
		queryTags = `${queryTags}
				{ name: "${t.name}", values: ${Array.isArray(t.value) ? JSON.stringify(t.value) : `"${t.value}"`} }`;
	});

	const singleResult = cursor === undefined;

	return {
		query: `query {
			transactions(
				first: ${singleResult ? latestResult : pageLimit}
				sort: ${sort}
				${singleResult ? '' : `after: "${cursor}"`}
				${owner === undefined ? '' : `owners: ["${owner}"]`}
				tags: [
					${queryTags}
				]
			) {
				${singleResult ? '' : pageInfoFragment}
				${edgesFragment(singleResult)}
			}
		}`
	};
}
