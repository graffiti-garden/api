import type { JSONSchema, FromSchema } from "json-schema-to-ts";
import type { Operation as JSONPatchOperation } from "fast-json-patch";

/**
 * Objects are the atomic unit in Graffiti that can represent both data (*e.g.* a social media post or profile)
 * and activities (*e.g.* a like or follow).
 * Objects are created and modified by a single {@link actor | `actor`}.
 *
 * Most of an object's content is stored in its {@link value | `value`} property, which can be any JSON
 * object. However, we recommend using properties from the
 * [Activity Vocabulary](https://www.w3.org/TR/activitystreams-vocabulary/)
 * or properties that emerge in the Graffiti [folksonomy](https://en.wikipedia.org/wiki/Folksonomy)
 * to promote interoperability.
 *
 * The {@link name | `name`}, {@link actor | `actor`}, and {@link source | `source`}
 * properties together uniquely describe the {@link GraffitiLocation | object's location}
 * and can be {@link Graffiti.locationToUri | converted to a globally unique URI}.
 *
 * The {@link channels | `channels`} and {@link allowed | `allowed`} properties
 * enable the object's creator to shape the visibility of and access to their object.
 *
 * The {@link tombstone | `tombstone`} and {@link lastModified | `lastModified`} properties are for
 * caching and synchronization.
 */
export interface GraffitiObjectBase {
  /**
   * The object's content as freeform JSON. We recommend using properties from the
   * [Activity Vocabulary](https://www.w3.org/TR/activitystreams-vocabulary/)
   * or properties that emerge in the Graffiti [folksonomy](https://en.wikipedia.org/wiki/Folksonomy)
   * to promote interoperability.
   */
  value: {};

  /**
   * An array of URIs the creator associates with the object. Objects can only be found by querying
   * one of the object's channels using the
   * {@link Graffiti.discover} method. This allows creators to express the intended audience of their object
   * which helps to prevent [context collapse](https://en.wikipedia.org/wiki/Context_collapse) even
   * in the highly interoperable ecosystem that Graffiti envisions. For example, channel URIs may be:
   * - A user's own {@link actor | `actor`} URI. Putting an object in this channel is a way to broadcast
   * the object to the user's followers, like posting a tweet.
   * - The URI of a Graffiti post. Putting an object in this channel is a way to broadcast to anyone viewing
   * the post, like commenting on a tweet.
   * - A URI representing a topic. Putting an object in this channel is a way to broadcast to anyone interested
   * in that topic, like posting in a subreddit.
   */
  channels: string[];

  /**
   * An optional array of {@link actor | `actor`} URIs that the creator allows to access the object.
   * If no `allowed` array is provided, the object can be accessed by anyone (so long as they
   * also know the right {@link channels | `channel` } to look in). An object can always be accessed by its creator, even if
   * the `allowed` array is empty.
   *
   * The `allowed` array is not revealed to users other than the creator, like
   * a BCC email. A user may choose to add a `to` property to the object's {@link value | `value`} to indicate
   * other recipients, however this is not enforced by Graffiti and may not accurately reflect the actual `allowed` array.
   *
   * `allowed` can be combined with {@link channels | `channels`}. For example, to send someone a direct message
   * the sender should put their object in the channel of the recipient's {@link actor | `actor`} URI to notify them of the message and also add
   * the recipient's {@link actor | `actor`} URI to the `allowed` array to prevent others from seeing the message.
   */
  allowed?: string[] | null;

  /**
   * The URI of the `actor` that {@link Graffiti.put | created } the object. This `actor` also has the unique permission to
   * {@link Graffiti.patch | modify} or {@link Graffiti.delete | delete} the object.
   *
   * We borrow the term actor from the ActivityPub because
   * [like in ActivityPub](https://www.w3.org/TR/activitypub/#h-note-0)
   * there is not necessarily a one-to-one mapping between actors and people/users.
   * Multiple people can share the same actor or one person can have multiple actors.
   * Actors can also be bots.
   *
   * In Graffiti, actors are always globally unique URIs which
   * allows them to also function as {@link channels | `channels`}.
   */
  actor: string;

  /**
   * A name for the object. This name is not globally unique but it is unique when
   * combined with the {@link actor | `actor`} and {@link source | `source`}.
   * Often times it is not specified by the user and randomly generated during {@link Graffiti.put | creation}.
   * If an object is created with the same `name`, `actor`, and `source` as an existing object,
   * the existing object will be replaced with the new object.
   */
  name: string;

  /**
   * The URI of the source that stores the object. In some decentralized implementations,
   * it can represent the server or [pod](https://en.wikipedia.org/wiki/Solid_(web_decentralization_project)#Design)
   * that a user has delegated to store their objects. In others it may represent the distributed
   * storage network that the object is stored on.
   */
  source: string;

  /**
   * The time the object was last modified, measured in milliseconds since January 1, 1970.
   * This is used for caching and synchronization.
   * A number, rather than an ISO string or Date object, is used for easy comparison, sorting,
   * and JSON Schema [range queries](https://json-schema.org/understanding-json-schema/reference/numeric#range).
   *
   * It is possible to use this value to sort objects in a user's interface but in many cases it would be better to
   * use a `createdAt` property in the object's {@link value | `value`} to indicate when the object was created
   * rather than when it was modified.
   */
  lastModified: number;

  /**
   * A boolean indicating whether the object has been deleted.
   * Depending on implementation, objects stay available for some time after deletion to allow for synchronization.
   */
  tombstone: boolean;
}

/**
 * This type constrains the {@link GraffitiObjectBase} type to adhere to a
 * particular [JSON schema](https://json-schema.org/).
 * This allows for static type-checking of an object's {@link GraffitiObjectBase.value | `value`}
 * which is otherwise a freeform JSON object.
 *
 * Schema-aware objects are returned by {@link Graffiti.get} and {@link Graffiti.discover}.
 */
export type GraffitiObject<Schema extends JSONSchema> = GraffitiObjectBase &
  FromSchema<Schema & typeof GraffitiObjectJSONSchema>;

/**
 * A JSON Schema equivalent to the {@link GraffitiObjectBase} type.
 * Needed internally for type inference of JSON Schemas, but can
 * be used by implementations to validate objects.
 */
export const GraffitiObjectJSONSchema = {
  type: "object",
  properties: {
    value: { type: "object" },
    channels: { type: "array", items: { type: "string" } },
    allowed: { type: "array", items: { type: "string" }, nullable: true },
    actor: { type: "string" },
    name: { type: "string" },
    source: { type: "string" },
    lastModified: { type: "number" },
    tombstone: { type: "boolean" },
  },
  additionalProperties: false,
  required: [
    "value",
    "channels",
    "actor",
    "name",
    "source",
    "lastModified",
    "tombstone",
  ],
} as const satisfies JSONSchema;

/**
 * This is a subset of properties from {@link GraffitiObjectBase} that uniquely
 * identify an object's location: {@link GraffitiObjectBase.actor | `actor`},
 * {@link GraffitiObjectBase.name | `name`}, and {@link GraffitiObjectBase.source | `source`}.
 * Attempts to create an object with the same `actor`, `name`, and `source`
 * as an existing object will replace the existing object (see {@link Graffiti.put}).
 *
 * This location can be converted to
 * a globally unique URI using {@link Graffiti.locationToUri}.
 */
export type GraffitiLocation = Pick<
  GraffitiObjectBase,
  "actor" | "name" | "source"
>;

/**
 * This object is a subset of {@link GraffitiObjectBase} that a user must construct locally before calling {@link Graffiti.put}.
 * This local copy does not require system-generated properties and may be statically typed with
 * a [JSON schema](https://json-schema.org/) to prevent the accidental creation of erroneous objects.
 *
 * This local object must have a {@link GraffitiObjectBase.value | `value`} and {@link GraffitiObjectBase.channels | `channels`}
 * and may optionally have an {@link GraffitiObjectBase.allowed | `allowed`} property.
 *
 * It may also contain any of the {@link GraffitiLocation } properties: {@link GraffitiObjectBase.actor | `actor`},
 * {@link GraffitiObjectBase.name | `name`}, and {@link GraffitiObjectBase.source | `source`}.
 * If the location provided exactly matches an existing object, the existing object will be replaced.
 * If no `name` is provided, one will be randomly generated.
 * If no `actor` is provided, the `actor` from the supplied {@link GraffitiSession | `session` } will be used.
 * If no `source` is provided, one may be inferred by the depending on implementation.
 *
 * This object does not need a {@link GraffitiObjectBase.lastModified | `lastModified`} or {@link GraffitiObjectBase.tombstone | `tombstone`}
 * property since these are automatically generated by the Graffiti system.
 */
export type GraffitiPutObject<Schema extends JSONSchema> = Pick<
  GraffitiObjectBase,
  "value" | "channels" | "allowed"
> &
  Partial<GraffitiObjectBase> &
  FromSchema<Schema & typeof GraffitiPutObjectJSONSchema>;

/**
 * A JSON Schema equivalent to the {@link GraffitiPutObject} type.
 * Needed internally for type inference of JSON Schemas, but can
 * be used by implementations to validate objects.
 */
export const GraffitiPutObjectJSONSchema = {
  ...GraffitiObjectJSONSchema,
  required: ["value", "channels"],
} as const satisfies JSONSchema;

/**
 * This object contains information that
 * {@link GraffitiObjectBase.source | `source`}s can
 * use to verify that a user has permission to operate a
 * particular {@link GraffitiObjectBase.actor | `actor`}.
 * This object is required of all {@link Graffiti} methods
 * that modify objects and is optional for methods that read objects.
 *
 * At a minimum the `session` object must contain the
 * {@link GraffitiSession.actor | `actor`} URI the user wants to authenticate with.
 * However it is likely that the `session` object must contain other
 * implementation-specific properties.
 * For example, a Solid implementation might include a
 * [`fetch`](https://docs.inrupt.com/developer-tools/api/javascript/solid-client-authn-browser/functions.html#fetch)
 * function. A distributed implementation may include
 * a cryptographic signature.
 *
 * As to why the `session` object is passed as an argument to every method
 * rather than being an internal property of the {@link Graffiti} instance,
 * this is primarily for type-checking to catch bugs related to login state.
 * Graffiti applications can expose some functionality to users who are not logged in
 * with {@link Graffiti.get} and {@link Graffiti.discover} but without type-checking
 * the `session` it can be easy to forget to hide buttons that trigger
 * other methods that require login.
 * In the future, `session` object may be updated to include scope information
 * and passing the `session` to each method can type-check whether the session provides the
 * necessary permissions.
 *
 * Passing the `session` object per-method also allows for multiple sessions
 * to be used within the same application, like an Email client fetching from
 * multiple accounts.
 */
export interface GraffitiSession {
  /**
   * The {@link GraffitiObjectBase.actor | `actor`} a user wants to authenticate with.
   */
  actor: string;
  /**
   * A yet undefined property detailing what operations the session
   * grants the user to perform. For example, to allow a user to
   * read private messages from a particular set of channels or
   * to allow the user to write object matching a particular schema.
   */
  scope?: {};
}

/**
 * This is the format for patches that modify {@link GraffitiObjectBase} objects
 * using the {@link Graffiti.patch} method. The patches must
 * be an array of [JSON Patch](https://jsonpatch.com) operations.
 * Patches can only be applied to the
 * {@link GraffitiObjectBase.value | `value`}, {@link GraffitiObjectBase.channels | `channels`},
 * and {@link GraffitiObjectBase.allowed | `allowed`} properties since the other
 * properties either describe the object's location or are automatically generated.
 * (See also {@link GraffitiPutObject}).
 */
export interface GraffitiPatch {
  /**
   * An array of [JSON Patch](https://jsonpatch.com) operations to
   * modify the object's {@link GraffitiObjectBase.value | `value`}. The resulting
   * `value` must still be a JSON object.
   */
  value?: JSONPatchOperation[];

  /**
   * An array of [JSON Patch](https://jsonpatch.com) operations to
   * modify the object's {@link GraffitiObjectBase.channels | `channels`}. The resulting
   * `channels` must still be an array of strings.
   */
  channels?: JSONPatchOperation[];

  /**
   * An array of [JSON Patch](https://jsonpatch.com) operations to
   * modify the object's {@link GraffitiObjectBase.allowed | `allowed`} property. The resulting
   * `allowed` property must still be an array of strings or `undefined`.
   */
  allowed?: JSONPatchOperation[];
}

/**
 * This type represents a stream of data that are
 * returned by Graffiti's query-like operations such as
 * {@link Graffiti.discover} and {@link Graffiti.recoverOrphans}.
 *
 * Errors are returned within the stream rather than as
 * exceptions that would halt the entire stream. This is because
 * some implementations may pull data from multiple
 * {@link GraffitiObjectBase.source | `source`}s
 * including some that may be unreliable. In many cases,
 * these errors can be safely ignored.
 *
 * The stream is an [`AsyncGenerator`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/async_function)
 * that can be iterated over using `for await` loops or calling `next` on the generator.
 * The stream can be terminated by breaking out of a loop calling `return` on the generator.
 */
export type GraffitiStream<TValue, TReturn = void> = AsyncGenerator<
  | {
      error?: undefined;
      value: TValue;
    }
  | {
      error: Error;
      source: string;
    },
  TReturn
>;

/**
 * Statistic about single channel returned by {@link Graffiti.channelStats}.
 * These statistics only account for contributions made by the
 * querying actor.
 */
export type ChannelStats = {
  /**
   * The URI of the channel.
   */
  channel: string;
  /**
   * The number of non-{@link GraffitiObjectBase.tombstone | `tombstone`}d objects
   * that the actor has posted to the channel.
   */
  count: number;
  /**
   * The time that the actor {@link GraffitiObjectBase.lastModified | last modified} an object in the channel,
   * measured in milliseconds since January 1, 1970.
   * {@link GraffitiObjectBase.tombstone | Tombstone}d objects do not effect this modification time.
   */
  lastModified: number;
};

/**
 * The event type produced in {@link Graffiti.sessionEvents}
 * when a user logs in manually from {@link Graffiti.login}
 * or when their session is restored from a previous login.
 * The event name to listen for is `login`.
 */
export type GraffitiLoginEvent = CustomEvent<
  | {
      error: Error;
      session?: undefined;
    }
  | {
      error?: undefined;
      session: GraffitiSession;
    }
>;

/**
 * The event type produced in {@link Graffiti.sessionEvents}
 * when a user logs out either manually with {@link Graffiti.logout}
 * or when their session times out or otherwise becomes invalid.
 * The event name to listen for is `logout`.
 */
export type GraffitiLogoutEvent = CustomEvent<
  | {
      error: Error;
      actor?: string;
    }
  | {
      error?: undefined;
      actor: string;
    }
>;

/**
 * The event type produced in {@link Graffiti.sessionEvents}
 * after an application has attempted to complete any login redirects
 * and restore any previously active sessions.
 * Successful session restores will be returned in parallel as
 * their own {@link GraffitiLoginEvent} events.
 *
 * This event optionally returns an `href` property
 * representing the URL the user originated a login request
 * from, which may be useful for redirecting the user back to
 * the page they were on after login.
 * The event name to listen for is `initialized`.
 */
export type GraffitiSessionInitializedEvent = CustomEvent<
  | {
      error?: Error;
      href?: string;
    }
  | null
  | undefined
>;
