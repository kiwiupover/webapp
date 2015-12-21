import Ember from 'ember';
import config from 'webapp/config/environment';
import request from 'ic-ajax';

const { service } = Ember.inject;

export default Ember.Component.extend({

  notify: service('notify'),

  host: null,

  classNames: ['panel'],
  classNameBindings: ['panelClass', 'host.isPendingApproval:panel-info:panel-danger'],

  actions: {
    /**
     * Approves or rejects a host after validation.
     */
    approveHost(isApproved) {

      // Get host
      let host = this.get('host');

      this.set('isProcessing', true);

      // Prepare URL
      let url = [config.apiHost, config.apiNamespace, 'hosts', host.get('id'), 'approve'].join('/');

      // Approve/reject the host
      let promise = request({
        type: 'POST',
        url: url,
        data: {
          isApproved: isApproved
        }
      });

      // Handle success
      promise.then(()=> {
        if (isApproved) {
          this.get('notify').success(this.get('i18n').t('notify.hostApproved'));
        } else {
          this.get('notify').success(this.get('i18n').t('notify.hostRejected'));
        }
      });

      // Always reload host
      promise.finally(()=> {
        host.reload();
        this.set('isProcessing', false);
      });
    }
  }
});
