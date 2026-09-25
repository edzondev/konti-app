import { createStandardSchemaDTO } from "nestjs-standard-schema";
import * as v from "valibot";

export const SessionIdParamSchema = v.object({
	id: v.pipe(v.string(), v.minLength(1), v.maxLength(128)),
});

export const SessionIdParamDto = createStandardSchemaDTO(SessionIdParamSchema);
export type SessionIdParamDto = v.InferOutput<typeof SessionIdParamSchema>;
