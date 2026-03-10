import { z } from 'zod';

export const ExternalDispatchSourceSchema = z.enum(['wms', 'wcs']);
export type ExternalDispatchSource = z.infer<typeof ExternalDispatchSourceSchema>;

export const WmsWcsCommandTypeSchema = z.enum([
	'allocate_pick',
	'release_pick',
	'reroute_container',
	'hold_container',
]);
export type WmsWcsCommandType = z.infer<typeof WmsWcsCommandTypeSchema>;

export const WmsWcsDispatchCommandSchema = z.object({
	sourceSystem: ExternalDispatchSourceSchema,
	commandId: z.string().min(1).max(128),
	correlationId: z.string().min(1).max(128).optional(),
	commandType: WmsWcsCommandTypeSchema,
	facilityId: z.string().min(1).max(64),
	targetId: z.string().min(1).max(128),
	payload: z.record(z.string(), z.unknown()).default({}),
	requestedAt: z.coerce.date(),
});

export type WmsWcsDispatchCommand = z.infer<typeof WmsWcsDispatchCommandSchema>;

export function createWmsWcsIdempotencyKey(
	command: Pick<WmsWcsDispatchCommand, 'sourceSystem' | 'commandId' | 'correlationId'>
): string {
	const dedupeKey = command.correlationId ?? command.commandId;
	return `${command.sourceSystem}:${dedupeKey}`;
}
