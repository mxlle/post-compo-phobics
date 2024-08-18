export enum PubSubEvent {
  NEW_GAME,
  GAME_OVER,
  STARS_CHANGED,
}

type EventDataTypes = {
  [PubSubEvent.NEW_GAME]: undefined;
  [PubSubEvent.GAME_OVER]: undefined;
  [PubSubEvent.STARS_CHANGED]: undefined;
};

type Callback<Event extends PubSubEvent> = (data: EventDataTypes[Event]) => void;

/**
 * A service that allows components to subscribe to events and publish events.
 */
export class PubSubService {
  _subscriptions: {
    [event in PubSubEvent]?: Callback<event>[];
  } = {};

  /**
   * Subscribes to an event.
   */
  subscribe<Event extends PubSubEvent>(event: Event, callback: Callback<Event>) {
    if (!this._subscriptions[event]) {
      this._subscriptions[event] = [];
    }

    this._subscriptions[event].push(callback);
  }

  /**
   * Unsubscribes from an event.
   */
  unsubscribe<Event extends PubSubEvent>(event: Event, callback: Callback<Event>) {
    if (!this._subscriptions[event]) {
      return;
    }

    const index = this._subscriptions[event].indexOf(callback);
    if (index >= 0) {
      this._subscriptions[event].splice(index, 1);
    }
  }

  /**
   * Publishes an event.
   */
  publish<Event extends PubSubEvent>(event: Event, data?: EventDataTypes[Event]) {
    if (!this._subscriptions[event]) {
      return;
    }

    this._subscriptions[event].forEach((cb) => cb(data));
  }
}

export const pubSubService = new PubSubService();