import type {
  GraffitiLocation,
  GraffitiObject,
  GraffitiObjectBase,
  GraffitiPatch,
  GraffitiSessionBase,
  GraffitiPutObject,
  GraffitiOptionsBase,
  GraffitiFeed,
} from "./types";
import type { JSONSchema4 } from "json-schema";

/**
 * Graffiti is...
 * blah blah
 *
 * @groupDescription Utilities - Utility functions for converting between Graffiti objects and URIs.
 * @groupDescription CRUD Operations - Functions for creating, reading, updating, and deleting Graffiti objects.
 *  @showGroups
 */
export abstract class Graffiti {
  /**
   * Converts a {@link GraffitiLocation} object containing a
   * {@link GraffitiObjectBase.name | `name`}, {@link GraffitiObjectBase.actor | `actor`},
   * and {@link GraffitiObjectBase.source | `source`} into a globally unique URI.
   * The form of this URI is implementation dependent.
   *
   * Its exact inverse is {@link uriToLocation}.
   *
   * @group Utilities
   */
  abstract locationToUri(location: GraffitiLocation): string;

  /**
   * Parses a globally unique Graffiti URI into a {@link GraffitiLocation}
   * object containing a {@link GraffitiObjectBase.name | `name`},
   * {@link GraffitiObjectBase.actor | `actor`}, and {@link GraffitiObjectBase.source | `source`}.
   *
   * Its exact inverse is {@link locationToUri}.
   *
   * @group Utilities
   */
  abstract uriToLocation(uri: string): GraffitiLocation;

  /**
   * An alias of {@link locationToUri}
   *
   * @group Utilities
   */
  objectToUri(object: GraffitiObjectBase) {
    return this.locationToUri(object);
  }

  /**
   * Retrieves an object from a given location.
   * If no object exists at that location or if the retrieving
   * {@link GraffitiObjectBase.actor | `actor`} is not included in
   * the object's {@link GraffitiObjectBase.allowed | `allowed`} property,
   * an error is thrown.
   *
   * The retrieved object is also type-checked against the provided [JSON schema](https://json-schema.org/)
   * otherwise an error is thrown.
   *
   * @group CRUD Operations
   */
  abstract get<Schema extends JSONSchema4>(
    /**
     * The location of the object to get.
     */
    locationOrUri: GraffitiLocation | string,
    /**
     * The JSON schema to validate the retrieved object against.
     */
    schema: Schema,
    /**
     * An implementation-specific object with information to authenticate the
     * {@link GraffitiObjectBase.actor | `actor`}. If no `session` is provided,
     * the retrieved object's {@link GraffitiObjectBase.allowed | `allowed`}
     * property must be `undefined`.
     */
    session?: GraffitiSessionBase,
  ): Promise<GraffitiObject<Schema>>;

  /**
   * Creates a new object or replaces an existing object.
   * To replace an object the {@link GraffitiObjectBase.actor | `actor`} must be the same as the
   * `actor` that created the object.
   *
   * The supplied object must contain the following fields:
   * - `value`: contains the object's JSON content. We recommend using the
   *   [Activity Vocabulary](https://www.w3.org/TR/activitystreams-vocabulary/)
   *   to describe the object.
   * - `channels`: an array of URIs that the object is associated with.
   *
   * The object may also contain the following optional fields:
   * - `allowed`: an optional array of actor URIs that are allowed to access the object.
   *   If not provided, the object is public. If empty, the object can only be accessed
   *   by the owner.
   * - `name`: a unique name for the object. If not provided, a random one will be generated.
   * - `actor`: the URI of the actor that created the object. If not provided, the actor
   *   from the `session` object will be used.
   * - `source`: the URI of the source that created the object. If not provided, a source
   *   may be inferred depending on the implementation.
   *
   *
   * @returns The object that was replaced if one exists or an object with
   * with a `null` {@link GraffitiObjectBase.value | `value`} if this operation
   * created a new object.
   * The object will have a {@link GraffitiObjectBase.tombstone | `tombstone`}
   * field set to `true` and a {@link GraffitiObjectBase.lastModified | `lastModified`}
   * field updated to the time of replacement/creation.
   *
   * @group CRUD Operations
   */
  abstract put<Schema>(
    /**
     * The object to be put. This object is statically type-checked against the [JSON schema](https://json-schema.org/) that can be optionally provided
     * as the generic type parameter. We highly recommend providing a schema to
     * ensure that the PUT object matches subsequent {@link get} or {@link discover}
     * operations.
     */
    object: GraffitiPutObject<Schema>,
    /**
     * An implementation-specific object with information to authenticate the
     * {@link GraffitiObjectBase.actor | `actor`}.
     */
    session: GraffitiSessionBase,
  ): Promise<GraffitiObjectBase>;

  /**
   * Deletes an object from a given location.
   * The deleting {@link GraffitiObjectBase.actor | `actor`} must be the same as the
   * `actor` that created the object.
   *
   * @returns The object that was deleted if one exists or an object with
   * with a `null` {@link GraffitiObjectBase.value | `value`} otherwise.
   * The object will have a {@link GraffitiObjectBase.tombstone | `tombstone`}
   * field set to `true` and a {@link GraffitiObjectBase.lastModified | `lastModified`}
   * field updated to the time of deletion.
   *
   * @group CRUD Operations
   */
  abstract delete(
    /**
     * The location of the object to delete.
     */
    locationOrUri: GraffitiLocation | string,
    /**
     * An implementation-specific object with information to authenticate the
     * {@link GraffitiObjectBase.actor | `actor`}.
     */
    session: GraffitiSessionBase,
  ): Promise<GraffitiObjectBase>;

  /**
   * Patches an existing object at a given location.
   * The patching {@link GraffitiObjectBase.actor | `actor`} must be the same as the
   * `actor` that created the object.
   *
   * @returns The object that was deleted if one exists or an object with
   * with a `null` {@link GraffitiObjectBase.value | `value`} otherwise.
   * The object will have a {@link GraffitiObjectBase.tombstone | `tombstone`}
   * field set to `true` and a {@link GraffitiObjectBase.lastModified | `lastModified`}
   * field updated to the time of deletion.
   *
   * @group CRUD Operations
   */
  abstract patch(
    /**
     * A collection of [JSON Patch](https://jsonpatch.com) operations
     * to apply to the object. See {@link GraffitiPatch} for more information.
     */
    patch: GraffitiPatch,
    /**
     * The location of the object to patch.
     */
    locationOrUri: GraffitiLocation | string,
    /**
     * An implementation-specific object with information to authenticate the
     * {@link GraffitiObjectBase.actor | `actor`}.
     */
    session: GraffitiSessionBase,
  ): Promise<GraffitiObjectBase>;

  /**
   * Returns a stream of objects that match the given [JSON Schema](https://json-schema.org)
   * and are contained in at least one of the given `channels`.
   *
   * Objects are returned asynchronously as they are discovered but the stream
   * will end once all objects that currently exist have been discovered.
   * The functions must be polled again for new objects.
   *
   * These objects are fetched from the `pods` specified in the `session`,
   * and a `webId` and `fetch` function may also be provided to retrieve
   * access-controlled objects. See {@link GraffitiSession} for more information.
   *
   * Error messages are returned in the stream rather than thrown
   * to prevent one unstable pod from breaking the entire stream.
   *
   * @group Query Operations
   */
  abstract discover<Schema extends JSONSchema4>(
    channels: string[],
    schema: Schema,
    session?: GraffitiSessionBase,
    options?: GraffitiOptionsBase,
  ): GraffitiFeed<GraffitiObject<Schema>>;

  /**
   * Whenever the user makes changes or retrieves data, that data is streamed
   * to "discoverLocalChanges". This makes apps reactive and prevents there from
   * being any inconsistencies in the data.
   * This discovery remains active until the user calls the "return" method on the
   * iterator.
   */
  /**
   * Returns a stream of objects that match the given [JSON Schema](https://json-schema.org)
   * and are contained in at least one of the given `channels`.
   *
   * Unlike {@link discover}, which queries external pods, this function listens
   * for changes made locally via {@link put}, {@link patch}, and {@link delete}.
   * Additionally, unlike {@link discover}, it does not return a one-time snapshot
   * of objects, but rather streams object changes as they occur. This is useful
   * for updating a UI in real-time without unnecessary polling.
   *
   * @group Query Operations
   */
  abstract discoverLocalChanges<Schema extends JSONSchema4>(
    channels: string[],
    schema: Schema,
    options?: GraffitiOptionsBase,
  ): AsyncGenerator<GraffitiObject<Schema>>;

  /**
   * Returns a list of all channels a user has posted to.
   * This is likely not very useful for most applications, but
   * necessary for certain applications where a user wants a
   * global view of all their Graffiti data.
   *
   * Error messages are returned in the stream rather than thrown
   * to prevent one unstable pod from breaking the entire stream.
   *
   * @group Utilities
   */
  abstract listChannels(
    session: GraffitiSessionBase,
    options?: GraffitiOptionsBase,
  ): GraffitiFeed<{
    channel: string;
    source: string;
    lastModified: Date;
    count: number;
  }>;

  /**
   * Returns a list of all objects a user has posted that are
   * not associated with any channel, i.e. orphaned objects.
   * This is likely not very useful for most applications, but
   * necessary for certain applications where a user wants a
   * global view of all their Graffiti data.
   *
   * Error messages are returned in the stream rather than thrown
   * to prevent one unstable pod from breaking the entire stream.
   *
   * @group Utilities
   */
  abstract listOrphans(
    session: GraffitiSessionBase,
    options?: GraffitiOptionsBase,
  ): GraffitiFeed<{
    name: string;
    source: string;
    lastModified: Date;
    tombstone: boolean;
  }>;
}

export type UseGraffiti = () => Graffiti;