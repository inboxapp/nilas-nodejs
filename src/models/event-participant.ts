import Attributes from './attributes';
import Model from './model';

export interface EventParticipantProperties {
  email: string;
  name?: string;
  status?: string;
}

export default class EventParticipant extends Model
  implements EventParticipantProperties {
  email!: string;
  name?: string;
  status?: string;

  constructor(props?: EventParticipantProperties) {
    super(props);
    if (!props) {
      this.email = '';
    }
  }

  toJSON(enforceReadOnly?: boolean) {
    const json = super.toJSON(enforceReadOnly);
    if (!json['name']) {
      json['name'] = json['email'];
    }
    return json;
  }
}

EventParticipant.attributes = {
  name: Attributes.String({
    modelKey: 'name',
  }),
  email: Attributes.String({
    modelKey: 'email',
  }),
  status: Attributes.String({
    modelKey: 'status',
  }),
};
