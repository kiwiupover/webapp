import Ember from 'ember';
import DS from 'ember-data';
import ValidationsMixin from '../mixins/validations';
import Regex from '../utils/regex';

const { computed } = Ember;

export default DS.Model.extend(ValidationsMixin, {

  // Attributes
  email: DS.attr('string'),
  password: DS.attr('string'), // Only used for sign up
  firstName: DS.attr('string'),
  lastName: DS.attr('string'),
  birthDate: DS.attr('string'),
  phone: DS.attr('string'),
  isAdmin: DS.attr('boolean'),
  isSuspended: DS.attr('boolean'),
  locale: DS.attr('string'),
  createdAt: DS.attr('date'),
  updatedAt: DS.attr('date'),
  photo: DS.attr('string'),

  // Relationships
  host: DS.belongsTo('host', { async: true }),
  wwoofer: DS.belongsTo('wwoofer', { async: true }),
  memberships: DS.hasMany('membership', { async: true }),
  bookmarks: DS.hasMany('host', {
    inverse: 'bookmarks',
    async: true
  }),

  // Computed properties
  completePhotoUrl: computed('photo', function() {
    var photo = this.get('photo');
    if (Ember.isPresent(photo)) {
      return 'https://s3.amazonaws.com/wwoof-france/photos/users/' + encodeURIComponent(photo);
    } else {
      return '../assets/images/no-photo.png';
    }
  }),

  isNotAdmin: computed.not('isAdmin'),

  /**
   * Returns the full name of the user.
   */
  fullName: computed('firstName', 'lastName', function() {
    return this.get('firstName') + ' ' + this.get('lastName');
  }),

  /**
   * Order memberships by expiration date (most recent first).
   */
  expireAtSortingDesc: ['expireAt:desc'],
  sortedMemberships: computed.sort('memberships', 'expireAtSortingDesc'),

  /**
   * All memberships computed properties.
   */
  hasMemberships: computed.notEmpty('sortedMemberships'),
  latestMembership: computed.readOnly('sortedMemberships.firstObject'),
  firstMembership: computed.readOnly('sortedMemberships.lastObject'),
  hasNonExpiredMembership: computed.and('hasMemberships', 'latestMembership.isNotExpired'),

  /**
   * Wwoofer memberships computed properties.
   */
  wwooferMemberships: computed.filterBy('sortedMemberships', 'type', 'W'),
  hasWwooferMemberships: computed.notEmpty('wwooferMemberships'),
  latestWwooferMembership: computed.readOnly('wwooferMemberships.firstObject'),
  firstWwooferMembership: computed.readOnly('wwooferMemberships.lastObject'),
  hasNonExpiredWwooferMembership: computed.and('hasWwooferMemberships', 'latestWwooferMembership.isNotExpired'),

  /**
   * Host memberships computed properties.
   */
  hostMemberships: computed.filterBy('sortedMemberships', 'type', 'H'),
  hasHostMemberships: computed.notEmpty('hostMemberships'),
  latestHostMembership: computed.readOnly('hostMemberships.firstObject'),
  firstHostMembership: computed.readOnly('hostMemberships.lastObject'),
  hasNonExpiredHostMembership: computed.and('hasHostMemberships', 'latestHostMembership.isNotExpired'),

  // Validations
  validations: {
    email: {
      presence: true,
      format: {
        'with': Regex.EMAIL_ADDRESS
      }
    },
    password: {
      presence: {
        'if': 'isNew'
      },
      length: { 'if': 'isNew', minimum: 8, maximum: 25 }
    },
    firstName: {
      presence: true,
      length: { maximum: 255 }
    },
    lastName: {
      presence: true,
      length: { maximum: 255 }
    },
    birthDate: {
      presence: {
        'if': 'isNew' // legacy users do not have a birth date
      }
    }
  }
});
