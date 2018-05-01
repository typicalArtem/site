// @flow
import {
    GraphQLList,
    GraphQLUnionType,
    GraphQLString,
    GraphQLInt,
    GraphQLFloat,
    GraphQLBoolean
} from "graphql";
import GraphQLJSON from "graphql-type-json";
import * as attrs from "webiny-model";
import { EntityAttribute, EntitiesAttribute } from "webiny-entity";
import { ModelAttribute, ModelsAttribute } from "webiny-model";
import type { Entity } from "webiny-entity";
import type { AttributeToTypeParams } from "webiny-api/types";
import BufferAttribute from "./bufferAttribute";

/**
 * This function converts built-in Entity attributes into GraphQL compatible types
 * @param params
 * @returns {{type,resolve} || null}
 */

export default (params: AttributeToTypeParams) => {
    const { attr, schema, convertModelToType } = params;

    let type = null;
    let resolve = null;

    if (attr instanceof BufferAttribute) {
        type = GraphQLString;
    }

    if (attr instanceof attrs.CharAttribute) {
        type = GraphQLString;
    }

    if (attr instanceof attrs.BooleanAttribute) {
        type = GraphQLBoolean;
    }

    if (attr instanceof attrs.IntegerAttribute) {
        type = GraphQLInt;
    }

    if (attr instanceof attrs.FloatAttribute) {
        type = GraphQLFloat;
    }

    if (attr instanceof attrs.ArrayAttribute) {
        type = new GraphQLList(GraphQLJSON);
    }

    if (attr instanceof attrs.ObjectAttribute) {
        type = GraphQLJSON;
    }

    if (attr instanceof ModelAttribute) {
        const model = attr.getModelInstance();
        type =
            schema.getType(model.classId) ||
            convertModelToType(model.classId, { type: "model" }, model.getAttributes(), schema);
    }

    if (attr instanceof ModelsAttribute) {
        const model = attr.getModelInstance();
        type = new GraphQLList(
            schema.getType(model.classId) ||
                convertModelToType(model.classId, { type: "model" }, model.getAttributes(), schema)
        );
    }

    if (attr instanceof EntityAttribute) {
        if (attr.hasMultipleEntityClasses()) {
            const name = attr.getName();
            const parent = attr.getParentModel().getParentEntity();
            const entityClasses = attr.getEntityClasses();
            // If entity classes are defined, create a new Union type to represent these classes
            if (entityClasses.length) {
                const typeName = parent.classId + (name.charAt(0).toUpperCase() + name.slice(1));
                schema.addType({
                    meta: {
                        type: "union"
                    },
                    type: new GraphQLUnionType({
                        name: typeName,
                        types: () => {
                            return entityClasses.map(ec => {
                                const typeName = ec.classId;
                                if (schema.types[typeName]) {
                                    return schema.getType(typeName);
                                }

                                const entity = new ec();
                                return convertModelToType(
                                    entity.classId,
                                    { type: "entity" },
                                    entity.getAttributes(),
                                    schema
                                );
                            });
                        },
                        resolveType(entity) {
                            return schema.getType(entity.classId);
                        }
                    })
                });
                type = schema.getType(typeName);
            } else {
                // Use EntityType which represents all Entities in the system
                type = schema.getType("EntityType");
            }
        } else {
            const entity = new (attr.getEntityClass())();
            const typeName = entity.classId;

            type =
                schema.getType(typeName) ||
                convertModelToType(typeName, { type: "entity" }, entity.getAttributes(), schema);
        }
    }

    if (attr instanceof EntitiesAttribute) {
        const entityClass = attr.getEntitiesClass();
        const entity = new entityClass();

        type = new GraphQLList(
            schema.getType(entity.classId) ||
                convertModelToType(
                    entity.classId,
                    { type: "entity" },
                    entity.getAttributes(),
                    schema
                )
        );
    }

    if (attr instanceof attrs.DynamicAttribute) {
        type = GraphQLJSON;
    }

    if (attr instanceof attrs.DateAttribute) {
        type = GraphQLString;
        resolve = (entity: Entity) => {
            const value = entity.getAttribute(attr.getName()).getValue();
            return value instanceof Date ? value.toISOString() : null;
        };
    }

    return type ? { type, resolve } : null;
};