// @flow
import gql from "graphql-tag";

export const loadPages = gql`
    query ListPublishedPages($category: String, $sort: PageSortInput, $tags: [String], $tagsRule: TagsRule, $page: Int, $perPage: Int) {
        cms {
            listPublishedPages(category: $category, sort: $sort, tags: $tags, tagsRule: $tagsRule, page: $page, perPage: $perPage) {
                data {
                    id
                    title
                    url
                    settings {
                        general {
                            image {
                                src
                            }
                        }
                    }
                    createdBy {
                        firstName
                        lastName
                    }
                    category {
                        id
                        name
                    }
                }
            }
        }
    }
`;
