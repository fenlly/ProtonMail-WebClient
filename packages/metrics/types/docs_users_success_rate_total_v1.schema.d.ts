/* eslint-disable */
/**
 * This file was automatically generated by json-schema-to-typescript.
 * DO NOT MODIFY IT BY HAND. Instead, modify the source JSONSchema file,
 * and run json-schema-to-typescript to regenerate this file.
 */

/**
 * Error free vs errored users counts (every 10min)
 */
export interface HttpsProtonMeDocsUsersSuccessRateTotalV1SchemaJson {
  Labels: {
    plan: "free" | "paid";
    type: "error" | "success";
  };
  Value: number;
}
